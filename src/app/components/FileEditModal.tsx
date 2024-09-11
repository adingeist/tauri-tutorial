import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { readTextFile, readBinaryFile } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';
import { BaseDirectory } from '@tauri-apps/api/fs';
import { Editor } from '@monaco-editor/react';

interface FileEditModalProps {
  open: boolean;
  onClose: () => void;
  filename: string;
  selectedRepo: string;
  selectedEnv: string;
  selectedRegion: string;
  onSave: (newFilename: string, newContent: string) => void;
}

const FileEditModal: React.FC<FileEditModalProps> = ({
  open,
  onClose,
  filename,
  selectedRepo,
  selectedEnv,
  selectedRegion,
  onSave,
}) => {
  const [editedFilename, setEditedFilename] = useState(filename);
  const [fileContent, setFileContent] = useState('');

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setFileContent(value);
    }
  };

  useEffect(() => {
    const loadFileContent = async () => {
      const filePath = await join(
        'secrets',
        selectedRepo,
        selectedEnv,
        selectedRegion,
        filename
      );
      try {
        const content = await readTextFile(filePath, {
          dir: BaseDirectory.AppData,
        });
        setFileContent(content);
      } catch (error) {
        // check if binary file
        try {
          const binary = await readBinaryFile(filePath, {
            dir: BaseDirectory.AppData,
          });
          const content = new TextDecoder().decode(binary);
          setFileContent(content);
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
    };

    if (open) {
      loadFileContent();
    }
  }, [open, filename, selectedRepo, selectedEnv, selectedRegion]);

  const handleSave = async () => {
    onSave(editedFilename, fileContent);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit File: {filename}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Filename"
            value={editedFilename}
            onChange={(e) => setEditedFilename(e.target.value)}
            fullWidth
            margin="normal"
          />
          <Editor
            height="400px"
            defaultLanguage="plaintext"
            value={fileContent}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileEditModal;
