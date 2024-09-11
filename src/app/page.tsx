'use client';

import { useState, useEffect } from 'react';
import {
  readDir,
  createDir,
  removeDir,
  writeTextFile,
} from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';
import RepositoryColumn from '@/app/components/RepositoryColumn';
import EnvironmentColumn, {
  FileInfo,
} from '@/app/components/EnvironmentColumn';
import ConfigColumn from '@/app/components/ConfigColumn';
import { message } from '@tauri-apps/api/dialog';
import { invoke } from '@tauri-apps/api/tauri';
import { BaseDirectory } from '@tauri-apps/api/fs';
import {
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';
import { copyFile, removeFile } from '@tauri-apps/api/fs';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import FileEditModal from '@/app/components/FileEditModal';

export default function Home() {
  console.log('Home component rendered');
  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('0');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingRepoIndex, setEditingRepoIndex] = useState<number | null>(null);
  const [newRepoName, setNewRepoName] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('dev');
  const [selectedRegion, setSelectedRegion] = useState('carbon_onprem_sadc');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [fileEditModalOpen, setFileEditModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const fetchRepositories = async () => {
    try {
      const secretsDir = await join('secrets');
      const entries = await readDir(secretsDir, { dir: BaseDirectory.AppData });
      const repos = entries
        .filter((entry) => entry.children !== undefined)
        .map((entry) => entry.name as string);
      setRepositories(repos);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setRepositories([]);
    }
  };

  const addRepository = async (repoName: string) => {
    try {
      const repoPath = await join('secrets', repoName);
      await createDir(repoPath, {
        dir: BaseDirectory.AppData,
        recursive: true,
      });
      await fetchRepositories(); // Refresh the list
    } catch (error) {
      console.error('Error adding repository:', error);
      throw error;
    }
  };

  const deleteRepository = async (repoName: string) => {
    try {
      const repoPath = await join('secrets', repoName);
      await removeDir(repoPath, {
        dir: BaseDirectory.AppData,
        recursive: true,
      });
      await fetchRepositories(); // Refresh the list
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleOpenDialog = (mode: 'add' | 'edit', index?: number) => {
    setDialogMode(mode);
    setDialogOpen(true);
    if (mode === 'edit' && index !== undefined) {
      setEditingRepoIndex(index);
      setNewRepoName(repositories[index]);
    } else {
      setNewRepoName('');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingRepoIndex(null);
    setNewRepoName('');
  };

  const handleSaveDialog = async () => {
    if (dialogMode === 'add') {
      await addRepository(newRepoName);
    } else if (dialogMode === 'edit' && editingRepoIndex !== null) {
      const oldName = repositories[editingRepoIndex];
      await deleteRepository(oldName);
      await addRepository(newRepoName);
    }
    handleCloseDialog();
  };

  const handleDeleteConfirm = async (index: number) => {
    try {
      await deleteRepository(repositories[index]);
      if (selectedRepo === index.toString()) {
        setSelectedRepo('0');
      }
    } catch (error) {
      console.error('Error deleting repository:', error);
      await message(`Error deleting repository: ${error}`, {
        title: 'Error',
        type: 'error',
      });
    }
  };

  const handleEnvChange = (
    event: React.MouseEvent<HTMLElement>,
    newEnv: string | null
  ) => {
    if (newEnv !== null) {
      setSelectedEnv(newEnv);
    }
  };

  const handleRegionChange = (
    event: React.MouseEvent<HTMLElement>,
    newRegion: string | null
  ) => {
    if (newRegion !== null) {
      setSelectedRegion(newRegion);
    }
  };

  const handleViewFile = (filename: string) => {
    setEditingFile(filename);
    setFileEditModalOpen(true);
  };

  const handleSaveFile = async (newFilename: string, newContent: string) => {
    if (editingFile) {
      try {
        const oldFilePath = await join(
          'secrets',
          repositories[parseInt(selectedRepo)],
          selectedEnv,
          selectedRegion,
          editingFile
        );
        const newFilePath = await join(
          'secrets',
          repositories[parseInt(selectedRepo)],
          selectedEnv,
          selectedRegion,
          newFilename
        );

        // Write new content
        await writeTextFile(newFilePath, newContent, {
          dir: BaseDirectory.AppData,
        });

        // Delete old file if the filename has changed
        if (editingFile !== newFilename) {
          await removeFile(oldFilePath, { dir: BaseDirectory.AppData });
        }

        // Update files state
        setFiles((prevFiles) =>
          prevFiles.map((file) =>
            file.filename === editingFile
              ? { ...file, filename: newFilename }
              : file
          )
        );

        setFileEditModalOpen(false);
        setEditingFile(null);
      } catch (error) {
        console.error('Error saving file:', error);
        await message(`Error saving file: ${error}`, {
          title: 'Error',
          type: 'error',
        });
      }
    }
  };

  const handleAddFile = async () => {
    console.log('Adding file');
    try {
      const filePaths = (await invoke('select_files')) as string[];
      console.log(filePaths);
      const newFiles: FileInfo[] = [];

      for (const filePath of filePaths) {
        const filename = filePath.split('/').pop();
        if (filename) {
          const destPath = await join(
            'secrets',
            repositories[parseInt(selectedRepo)],
            selectedEnv,
            selectedRegion,
            filename
          );
          await copyFile(filePath, destPath, {
            dir: BaseDirectory.AppData,
          });

          newFiles.push({
            filename,
            keyMapping: '',
            type: 'secret',
          });
        }
      }

      // Update the files state with the new files
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    } catch (error) {
      console.error('Error adding files:', error);
      await message(`Error adding files: ${error}`, {
        title: 'Error',
        type: 'error',
      });
    }
  };

  const handleShowFolder = async () => {
    try {
      const secretsPath = await invoke('get_secrets_path');
      await invoke('open_folder', { path: secretsPath });
    } catch (error) {
      console.error('Error in handleShowFolder:', error);
      await message(`Error opening secrets folder: ${error}`, {
        title: 'Error',
        type: 'error',
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={3}>
            <RepositoryColumn
              repositories={repositories}
              selectedRepo={selectedRepo}
              onSelectRepo={setSelectedRepo}
              onOpenDialog={handleOpenDialog}
              onDeleteConfirm={handleDeleteConfirm}
              onShowFolder={handleShowFolder}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            {parseInt(selectedRepo) >= 0 &&
              parseInt(selectedRepo) < repositories.length && (
                <EnvironmentColumn
                  selectedRepo={repositories[parseInt(selectedRepo)]}
                  selectedEnv={selectedEnv}
                  selectedRegion={selectedRegion}
                  files={files}
                  setFiles={setFiles}
                  onEnvChange={handleEnvChange}
                  onRegionChange={handleRegionChange}
                  onViewFile={handleViewFile}
                  onAddFile={handleAddFile}
                />
              )}
          </Grid>
          <Grid item xs={12} sm={4}>
            {parseInt(selectedRepo) >= 0 &&
              parseInt(selectedRepo) < repositories.length && (
                <ConfigColumn
                  selectedRepo={selectedRepo}
                  repositories={repositories}
                  files={files}
                />
              )}
          </Grid>
        </Grid>

        <Dialog open={dialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>
            {dialogMode === 'add'
              ? 'Add New Repository'
              : 'Edit Repository Name'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Repository Name"
              type="text"
              fullWidth
              value={newRepoName}
              onChange={(e) => setNewRepoName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveDialog}>Save</Button>
          </DialogActions>
        </Dialog>

        {fileEditModalOpen && editingFile && (
          <FileEditModal
            open={fileEditModalOpen}
            onClose={() => setFileEditModalOpen(false)}
            filename={editingFile}
            selectedRepo={repositories[parseInt(selectedRepo)]}
            selectedEnv={selectedEnv}
            selectedRegion={selectedRegion}
            onSave={handleSaveFile}
          />
        )}
      </Box>
    </DndProvider>
  );
}
