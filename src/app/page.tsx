'use client';

import { useState, useEffect, useRef } from 'react';
import { readDir, createDir, removeDir } from '@tauri-apps/api/fs';
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
  const [files, setFiles] = useState<FileInfo[]>([
    { filename: 'ES_PASSWORD', keyMapping: 'ES_PASSWORD_FILE', type: 'secret' },
    { filename: '.env', keyMapping: '', type: 'config' },
    { filename: 'ES_CRT', keyMapping: 'ES_CRT_LOCATION', type: 'secret' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = async (index: number) => {
    await deleteRepository(repositories[index]);
    if (selectedRepo === index.toString()) {
      setSelectedRepo('0');
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
    // Implement view file logic
    console.log(`Viewing file: ${filename}`);
  };

  const handleDeleteFile = (filename: string) => {
    // Implement delete file logic
    console.log(`Deleting file: ${filename}`);
    setFiles(files.filter((file) => file.filename !== filename));
  };

  const handleAddFile = () => {
    fileInputRef.current?.click();
  };

  const handleShowFolder = async () => {
    try {
      const secretsPath = await invoke('get_secrets_path');
      await message(`Secrets folder path: ${secretsPath}`, {
        title: 'Secrets Folder',
        type: 'info',
      });
    } catch (error) {
      console.error('Error in handleShowFolder:', error);
      await message(`Error getting secrets folder path: ${error}`, {
        title: 'Error',
        type: 'error',
      });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <RepositoryColumn
            repositories={repositories}
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
            onOpenDialog={handleOpenDialog}
            onDelete={handleDelete}
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
                onDeleteFile={handleDeleteFile}
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
          {dialogMode === 'add' ? 'Add New Repository' : 'Edit Repository Name'}
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
    </Box>
  );
}
