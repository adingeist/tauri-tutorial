import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextField,
} from '@mui/material';
import { TableCellProps } from '@mui/material';
import {
  readDir,
  createDir,
  BaseDirectory,
  writeTextFile,
  readTextFile,
  exists,
  removeFile,
} from '@tauri-apps/api/fs';
import { join, appDataDir } from '@tauri-apps/api/path';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import { Publish as PublishIcon } from '@mui/icons-material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { listen } from '@tauri-apps/api/event';
import { copyFile } from '@tauri-apps/api/fs';
import {
  VisibilityOutlined as ViewIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';

export interface FileInfo {
  filename: string;
  keyMapping: string;
  type: 'secret' | 'config';
  vaultPath?: string;
}

interface VaultMapping {
  namespace: string;
  secrets: {
    type: 'secret' | 'config';
    localPath: string;
    vaultPath: string;
    keyName?: string;
  }[];
}

interface EnvironmentColumnProps {
  selectedRepo: string;
  selectedEnv: string;
  selectedRegion: string;
  files: FileInfo[];
  setFiles: React.Dispatch<React.SetStateAction<FileInfo[]>>;
  onEnvChange: (
    event: React.MouseEvent<HTMLElement>,
    newEnv: string | null
  ) => void;
  onRegionChange: (
    event: React.MouseEvent<HTMLElement>,
    newRegion: string | null
  ) => void;
  onViewFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onAddFile: () => void;
}

const ScrollableTableCell = ({ children, ...props }: TableCellProps) => (
  <TableCell
    {...props}
    sx={{
      maxWidth: 100,
      overflow: 'auto',
      whiteSpace: 'nowrap',
      '&::-webkit-scrollbar': {
        height: 6,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'rgba(0,0,0,.2)',
        borderRadius: 3,
      },
    }}
  >
    {children}
  </TableCell>
);

const EnvironmentColumn: React.FC<EnvironmentColumnProps> = ({
  selectedRepo,
  selectedEnv,
  selectedRegion,
  files,
  setFiles,
  onEnvChange,
  onRegionChange,
  onViewFile,
  onDeleteFile,
  onAddFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [keyValidation, setKeyValidation] = useState<{
    [key: string]: boolean;
  }>({});

  const ensureDirectoryExists = async (path: string) => {
    console.log('ensureDirectoryExists', path);
    try {
      await createDir(path, { dir: BaseDirectory.AppData, recursive: true });
    } catch (error) {
      // If the error is because the directory already exists, we can ignore it
      if (
        !(error instanceof Error) ||
        !error.message.includes('already exists')
      ) {
        throw error;
      }
    }
  };

  const getVaultMappingPath = useCallback(async () => {
    return await join(
      'secrets',
      selectedRepo,
      selectedEnv,
      selectedRegion,
      'vault_mapping.json'
    );
  }, [selectedRepo, selectedEnv, selectedRegion]);

  const readVaultMapping = useCallback(async (): Promise<VaultMapping> => {
    const vaultMappingPath = await getVaultMappingPath();
    const fileExists = await exists(vaultMappingPath, {
      dir: BaseDirectory.AppData,
    });

    if (fileExists) {
      const content = await readTextFile(vaultMappingPath, {
        dir: BaseDirectory.AppData,
      });
      return JSON.parse(content);
    } else {
      return {
        namespace: `${selectedRepo}-${selectedEnv}-${selectedRegion}`,
        secrets: [],
      };
    }
  }, [getVaultMappingPath, selectedRepo, selectedEnv, selectedRegion]);

  const writeVaultMapping = useCallback(
    async (mapping: VaultMapping) => {
      const vaultMappingPath = await getVaultMappingPath();
      await writeTextFile(vaultMappingPath, JSON.stringify(mapping, null, 2), {
        dir: BaseDirectory.AppData,
      });
    },
    [getVaultMappingPath]
  );

  const updateVaultMapping = useCallback(
    async (files: FileInfo[]) => {
      const mapping = await readVaultMapping();
      mapping.secrets = files.map((file) => ({
        type: file.type,
        localPath: file.filename,
        vaultPath: file.vaultPath || file.filename,
        ...(file.type === 'secret' && { keyName: file.keyMapping }),
      }));
      await writeVaultMapping(mapping);
    },
    [readVaultMapping, writeVaultMapping]
  );

  const fetchFiles = useCallback(async () => {
    if (selectedRepo && selectedEnv && selectedRegion) {
      try {
        const appDataDirPath = await appDataDir();
        const path = await join(
          appDataDirPath,
          'secrets',
          selectedRepo,
          selectedEnv,
          selectedRegion
        );
        await ensureDirectoryExists(path);
        const entries = await readDir(path);

        const vaultMapping = await readVaultMapping();

        const files: FileInfo[] = entries
          .filter((entry) => entry.name !== 'vault_mapping.json')
          .map((entry) => {
            const filename = entry.name || 'unknown';
            const mappedSecret = vaultMapping.secrets.find(
              (s) => s.localPath === filename
            );
            return {
              filename,
              keyMapping: mappedSecret?.keyName || '',
              type: mappedSecret?.type || 'config',
              vaultPath: mappedSecret?.vaultPath || filename,
            };
          });

        setFiles(files);
        await updateVaultMapping(files);
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      }
    }
  }, [
    selectedRepo,
    selectedEnv,
    selectedRegion,
    setFiles,
    readVaultMapping,
    updateVaultMapping,
  ]);

  useEffect(() => {
    fetchFiles();
  }, [selectedRepo, selectedEnv, selectedRegion, fetchFiles]);

  const handleFileDrop = useCallback(
    async (filepaths: string[]) => {
      console.log('handleFileDrop', filepaths);
      const newFiles: FileInfo[] = [];
      for (const filepath of filepaths) {
        try {
          const filename = filepath.split('/').pop() || 'unknown';
          const destPath = await join(
            'secrets',
            selectedRepo,
            selectedEnv,
            selectedRegion,
            filename
          );
          await copyFile(filepath, destPath, {
            dir: BaseDirectory.AppData,
          });
          console.log(`File ${filename} copied successfully`);
          newFiles.push({
            filename,
            keyMapping: '',
            type: 'config',
            vaultPath: filename,
          });
        } catch (error) {
          console.error(`Error copying file ${filepath}:`, error);
        }
      }
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      await updateVaultMapping(updatedFiles);
    },
    [
      selectedRepo,
      selectedEnv,
      selectedRegion,
      files,
      setFiles,
      updateVaultMapping,
    ]
  );

  useEffect(() => {
    let dragCounter = 0;

    const unlistenFileDrop = listen('tauri://file-drop', (event: any) => {
      console.log('File drop event:', event);
      setIsDragging(false);
      if (event.payload) {
        handleFileDrop(event.payload);
      }
    });

    const unlistenFileDragEnter = listen('tauri://file-drop-hover', () => {
      dragCounter++;
      setIsDragging(true);
    });

    const unlistenFileDragLeave = listen('tauri://file-drop-cancelled', () => {
      dragCounter--;
      if (dragCounter === 0) {
        setIsDragging(false);
      }
    });

    return () => {
      unlistenFileDrop.then((f) => f());
      unlistenFileDragEnter.then((f) => f());
      unlistenFileDragLeave.then((f) => f());
    };
  }, [handleFileDrop]);

  const handleDeleteFile = async (filename: string) => {
    try {
      const appDataDirPath = await appDataDir();
      const filePath = await join(
        appDataDirPath,
        'secrets',
        selectedRepo,
        selectedEnv,
        selectedRegion,
        filename
      );
      await removeFile(filePath);
      console.log(`File ${filename} deleted successfully`);
      const updatedFiles = files.filter((file) => file.filename !== filename);
      setFiles(updatedFiles);
      await updateVaultMapping(updatedFiles);
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
      await message(`Error deleting file: ${error}`, {
        title: 'Error',
        type: 'error',
      });
    }
  };

  const handleTypeChange = async (
    event: SelectChangeEvent,
    filename: string
  ) => {
    const newType = event.target.value as 'secret' | 'config';
    const updatedFiles = files.map((file) =>
      file.filename === filename
        ? {
            ...file,
            type: newType,
            keyMapping: newType === 'config' ? '' : file.keyMapping,
          }
        : file
    );
    setFiles(updatedFiles);
    await updateVaultMapping(updatedFiles);
  };

  const validateKeyMapping = useCallback(
    async (keyMapping: string) => {
      console.log(`Validating key mapping: "${keyMapping}"`);
      if (!keyMapping) return false;

      try {
        const appDataDirPath = await appDataDir();
        const basePath = await join(
          appDataDirPath,
          'secrets',
          selectedRepo,
          selectedEnv,
          selectedRegion
        );
        console.log(`Searching in base path: ${basePath}`);
        const entries = await readDir(basePath, { dir: BaseDirectory.AppData });

        for (const entry of entries) {
          if (entry.name && entry.name.startsWith('.env')) {
            console.log(`Checking file: ${entry.name}`);
            const filePath = await join(basePath, entry.name);
            console.log(`Full file path: ${filePath}`);
            try {
              const content = await readTextFile(filePath, {
                dir: BaseDirectory.AppData,
              });
              // Split the content into lines and check each line for an exact key match
              const lines = content.split('\n');
              for (const line of lines) {
                // Use a regular expression to match the exact key
                const match = line.match(new RegExp(`^${keyMapping}=`));
                if (match) {
                  console.log(`Key "${keyMapping}" found in ${entry.name}`);
                  return true;
                }
              }
            } catch (readError) {
              console.error(`Error reading file ${entry.name}:`, readError);
              // Continue to the next file if there's an error reading this one
            }
          }
        }
        console.log(`Key "${keyMapping}" not found in any .env file`);
        return false;
      } catch (error) {
        console.error('Error in validateKeyMapping:', error);
        return false;
      }
    },
    [selectedRepo, selectedEnv, selectedRegion]
  );

  const handleKeyMappingChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    filename: string
  ) => {
    const newKeyMapping = event.target.value;
    console.log(
      `New key mapping: "${newKeyMapping}", type: ${typeof newKeyMapping}`
    );

    const updatedFiles = files.map((file) =>
      file.filename === filename ? { ...file, keyMapping: newKeyMapping } : file
    );
    setFiles(updatedFiles);
    await updateVaultMapping(updatedFiles);

    // Validate the new key mapping
    try {
      const isValid = await validateKeyMapping(newKeyMapping);
      console.log(`Validation result for "${newKeyMapping}": ${isValid}`);
      setKeyValidation((prev) => ({ ...prev, [filename]: isValid }));
    } catch (error) {
      console.error('Error validating key mapping:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 2,
        border: isDragging ? '2px dashed #007FFF' : 'none',
        transition: 'border 0.2s ease-in-out',
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Environment
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" component="span" sx={{ mr: 1 }}>
          Env:
        </Typography>
        <ToggleButtonGroup
          value={selectedEnv}
          exclusive
          onChange={onEnvChange}
          aria-label="environment"
          size="small"
        >
          <ToggleButton value="dev" aria-label="dev">
            dev
          </ToggleButton>
          <ToggleButton value="stg" aria-label="stg">
            stg
          </ToggleButton>
          <ToggleButton value="prd" aria-label="prd">
            prd
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" component="span" sx={{ mr: 1 }}>
          Region:
        </Typography>
        <ToggleButtonGroup
          value={selectedRegion}
          exclusive
          onChange={onRegionChange}
          aria-label="region"
          size="small"
        >
          <ToggleButton value="carbon_onprem_sadc" aria-label="SADC">
            SADC
          </ToggleButton>
          <ToggleButton value="carbon_onprem_wsdc" aria-label="WSDC">
            WSDC
          </ToggleButton>
          <ToggleButton value="carbon_gcp_east_4" aria-label="GCP EAST">
            GCP EAST
          </ToggleButton>
          <ToggleButton value="carbon_gcp_central_1" aria-label="GCP CENTRAL">
            GCP CENTRAL
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <TableContainer
        component={Paper}
        sx={{ mt: 4, boxShadow: 'none', maxWidth: 620 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="25%">
                <strong>Filename</strong>
              </TableCell>
              <TableCell width="25%">
                <strong>Key Mapping</strong>
              </TableCell>
              <TableCell width="20%">
                <strong>Type</strong>
              </TableCell>
              <TableCell width="30%">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file, index) => (
              <TableRow key={index}>
                <ScrollableTableCell>{file.filename}</ScrollableTableCell>
                <TableCell>
                  {file.type === 'secret' ? (
                    <Box>
                      <TextField
                        value={file.keyMapping}
                        onChange={(event) =>
                          handleKeyMappingChange(event, file.filename)
                        }
                        size="small"
                        fullWidth
                        error={
                          file.keyMapping !== '' &&
                          keyValidation[file.filename] === false
                        }
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor:
                                file.keyMapping !== '' &&
                                keyValidation[file.filename] === true
                                  ? 'green'
                                  : undefined,
                            },
                          },
                        }}
                      />
                      {file.keyMapping !== '' &&
                        keyValidation[file.filename] === false && (
                          <Typography variant="caption" color="error">
                            [!] no .env file with key
                          </Typography>
                        )}
                    </Box>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={file.type}
                    onChange={(event) => handleTypeChange(event, file.filename)}
                    size="small"
                    fullWidth
                  >
                    <MenuItem value="config">config</MenuItem>
                    <MenuItem value="secret">secret</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => onViewFile(file.filename)}
                    size="small"
                    title="View"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteFile(file.filename)}
                    size="small"
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          m: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          borderColor: 'divider',
        }}
      >
        <Button
          startIcon={<UploadFileIcon />}
          onClick={onAddFile}
          sx={{ textTransform: 'none', mb: 1 }}
        >
          Add file
        </Button>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GetAppIcon />}
            sx={{ textTransform: 'none' }}
            onClick={() => console.log('Export .zip')}
          >
            Export .zip
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PublishIcon />}
            sx={{ textTransform: 'none' }}
            onClick={() => console.log('Import .zip')}
          >
            Import .zip
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CloudUploadIcon />}
            sx={{ textTransform: 'none' }}
            onClick={() => console.log('Upload to Vault')}
          >
            Upload to Vault
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EnvironmentColumn;
