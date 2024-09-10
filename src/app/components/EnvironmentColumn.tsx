import React from 'react';
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
  IconButton,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  UploadFile as UploadFileIcon,
  GetApp as GetAppIcon,
  Publish as PublishIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { TableCellProps } from '@mui/material';

interface FileInfo {
  filename: string;
  keyMapping: string;
  type: 'secret' | 'config';
}

interface EnvironmentColumnProps {
  selectedEnv: string;
  selectedRegion: string;
  files: FileInfo[];
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
  selectedEnv,
  selectedRegion,
  files,
  onEnvChange,
  onRegionChange,
  onViewFile,
  onDeleteFile,
  onAddFile,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
              <TableCell width="15%">
                <strong>Type</strong>
              </TableCell>
              <TableCell width="15%">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.filename}>
                <ScrollableTableCell>{file.filename}</ScrollableTableCell>
                <ScrollableTableCell>{file.keyMapping}</ScrollableTableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell sx={{ p: 0, textAlign: 'center' }}>
                  <IconButton
                    onClick={() => onViewFile(file.filename)}
                    size="small"
                    sx={{ p: 0.25 }}
                  >
                    <VisibilityIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    onClick={() => onDeleteFile(file.filename)}
                    size="small"
                    sx={{ p: 0.25 }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
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
