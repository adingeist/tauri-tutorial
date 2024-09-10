'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
} from '@mui/material';
import RepositoryColumn from '@/app/components/RepositoryColumn';
import EnvironmentColumn from '@/app/components/EnvironmentColumn';

interface FileInfo {
  filename: string;
  keyMapping: string;
  type: 'secret' | 'config';
}

export default function Home() {
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
    // Replace with actual API call
    const repos = ['Repo1', 'Repo2', 'Repo3'];
    setRepositories(repos);
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

  const handleSaveDialog = () => {
    if (dialogMode === 'add') {
      setRepositories([...repositories, newRepoName]);
    } else if (dialogMode === 'edit' && editingRepoIndex !== null) {
      const updatedRepositories = [...repositories];
      updatedRepositories[editingRepoIndex] = newRepoName;
      setRepositories(updatedRepositories);
    }
    handleCloseDialog();
  };

  const handleDelete = (index: number) => {
    const updatedRepositories = repositories.filter((_, i) => i !== index);
    setRepositories(updatedRepositories);
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
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          {parseInt(selectedRepo) >= 0 &&
            parseInt(selectedRepo) < repositories.length && (
              <EnvironmentColumn
                selectedEnv={selectedEnv}
                selectedRegion={selectedRegion}
                files={files}
                onEnvChange={handleEnvChange}
                onRegionChange={handleRegionChange}
                onViewFile={handleViewFile}
                onDeleteFile={handleDeleteFile}
                onAddFile={handleAddFile}
              />
            )}
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box
            sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
          >
            <Typography variant="h5" component="h2" gutterBottom>
              Config
            </Typography>
            {/* Add config content here */}
          </Box>
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
