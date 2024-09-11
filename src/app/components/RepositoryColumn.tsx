import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RepositoryListItem from './RepositoryListItem';
import { useState } from 'react';

interface RepositoryColumnProps {
  repositories: string[];
  selectedRepo: string;
  onSelectRepo: (index: string) => void;
  onOpenDialog: (mode: 'add' | 'edit', index?: number) => void;
  onDeleteConfirm: (index: number) => void;
  onShowFolder: () => void;
}

const RepositoryColumn: React.FC<RepositoryColumnProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  onOpenDialog,
  onDeleteConfirm,
  onShowFolder,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex !== null) {
      onDeleteConfirm(deleteIndex);
    }
    setDeleteConfirmOpen(false);
    setDeleteIndex(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteIndex(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Repository
      </Typography>
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {repositories.map((repository, index) => (
          <RepositoryListItem
            key={repository}
            repository={repository}
            isSelected={selectedRepo === index.toString()}
            onSelect={() => onSelectRepo(index.toString())}
            onEdit={() => onOpenDialog('edit', index)}
            onDelete={() => handleDeleteClick(index)}
          />
        ))}
        <ListItem disablePadding>
          <ListItemButton onClick={() => onOpenDialog('add')}>
            <AddIcon sx={{ mr: 1 }} />
            <ListItemText primary="Add Repository" />
          </ListItemButton>
        </ListItem>
      </List>
      <Button
        variant="outlined"
        startIcon={<FolderOpenIcon />}
        onClick={onShowFolder}
        sx={{ mt: 2 }}
      >
        Show Folder
      </Button>

      <Dialog open={deleteConfirmOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this repository? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RepositoryColumn;
