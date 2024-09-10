import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import RepositoryListItem from './RepositoryListItem';

interface RepositoryColumnProps {
  repositories: string[];
  selectedRepo: string;
  onSelectRepo: (index: string) => void;
  onOpenDialog: (mode: 'add' | 'edit', index?: number) => void;
  onDelete: (index: number) => void;
  onShowFolder: () => void;
}

const RepositoryColumn: React.FC<RepositoryColumnProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  onOpenDialog,
  onDelete,
  onShowFolder,
}) => {
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
            onDelete={() => onDelete(index)}
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
    </Box>
  );
};

export default RepositoryColumn;
