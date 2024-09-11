import React from 'react';
import { Box, Typography } from '@mui/material';
import CopyButton from './CopyButton';

interface FileInfo {
  filename: string;
  keyMapping: string;
  type: 'secret' | 'config';
}

interface ConfigColumnProps {
  selectedRepo: string;
  repositories: string[];
  files: FileInfo[];
}

const ConfigColumn: React.FC<ConfigColumnProps> = ({
  selectedRepo,
  repositories,
  files,
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Config
      </Typography>
      <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2 }}>
        Secrets
      </Typography>
      {files.length > 0 ? (
        files.map((file, index) => {
          const path = `/etc/config/${repositories[parseInt(selectedRepo)]}/${
            file.filename
          }`;
          return (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Secret:</strong> {file.filename}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> plaintext
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  <strong>MountPath:</strong> {path}
                </Typography>
                <CopyButton text={path} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  <strong>VaultPath:</strong> {path}
                </Typography>
                <CopyButton text={path} />
              </Box>
            </Box>
          );
        })
      ) : (
        <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
          No secrets added to this environment yet.
        </Typography>
      )}
    </Box>
  );
};

export default ConfigColumn;
