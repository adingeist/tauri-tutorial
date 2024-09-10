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
} from '@mui/material';
import { TableCellProps } from '@mui/material';
import { readDir, createDir, BaseDirectory } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import { GetApp as GetAppIcon } from '@mui/icons-material';
import { Publish as PublishIcon } from '@mui/icons-material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { listen } from '@tauri-apps/api/event';
import { copyFile } from '@tauri-apps/api/fs';
import { VisibilityOutlined as ViewIcon, DeleteOutline as DeleteIcon } from '@mui/icons-material';

export interface FileInfo {
  filename: string;
  keyMapping: string;
  type: 'secret' | 'config';
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

  const fetchFiles = useCallback(async () => {
    if (selectedRepo && selectedEnv && selectedRegion) {
      try {
        const path = await join(
          'secrets',
          selectedRepo,
          selectedEnv,
          selectedRegion
        );
        await ensureDirectoryExists(path);
        const entries = await readDir(path, {
          dir: BaseDirectory.AppData,
          recursive: false,
        });
        const files: FileInfo[] = entries.map((entry) => ({
          filename: entry.name || 'unknown',
          keyMapping: entry.name || 'unknown',
          type: 'secret',
        }));
        setFiles(files);
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      }
    }
  }, [selectedRepo, selectedEnv, selectedRegion, setFiles]);

  useEffect(() => {
    fetchFiles();
  }, [selectedRepo, selectedEnv, selectedRegion, fetchFiles]);

  const handleFileDrop = useCallback(
    async (filepaths: string[]) => {
      console.log('handleFileDrop', filepaths);
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
        } catch (error) {
          console.error(`Error copying file ${filepath}:`, error);
        }
      }
      fetchFiles();
    },
    [selectedRepo, selectedEnv, selectedRegion, fetchFiles]
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
        sx={{ mt: 4, boxShadow: 'none', maxWidth: 520 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="35%">
                <strong>Filename</strong>
              </TableCell>
              <TableCell width="35%">
                <strong>Key Mapping</strong>
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
                <ScrollableTableCell>{file.filename}</ScrollableTableCell>
                <TableCell>
                  <IconButton onClick={() => onViewFile(file.filename)} size="small" title="View">
                    <ViewIcon />
                  </IconButton>
                  <IconButton onClick={() => onDeleteFile(file.filename)} size="small" title="Delete">
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
