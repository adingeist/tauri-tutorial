import React, { useState } from 'react';
import {
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface RepositoryListItemProps {
  repository: string;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RepositoryListItem: React.FC<RepositoryListItemProps> = ({
  repository,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <ListItem
      disablePadding
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      secondaryAction={
        (isHovered || isSelected) && (
          <Box>
            <IconButton edge="end" aria-label="edit" onClick={onEdit}>
              <EditIcon />
            </IconButton>
            <IconButton edge="end" aria-label="delete" onClick={onDelete}>
              <DeleteIcon />
            </IconButton>
          </Box>
        )
      }
    >
      <ListItemButton selected={isSelected} onClick={onSelect}>
        <ListItemText primary={repository} />
      </ListItemButton>
    </ListItem>
  );
};

export default RepositoryListItem;
