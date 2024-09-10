import { Tooltip, IconButton } from '@mui/material';
import {
  Check as CheckIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useState } from 'react';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setOpen(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1000);
  };

  const handleTooltipClose = () => {
    setOpen(false);
  };

  return (
    <Tooltip
      title={copied ? 'Copied!' : ''}
      open={open}
      onClose={handleTooltipClose}
      leaveDelay={0}
    >
      <IconButton onClick={handleCopy} size="small">
        {copied ? (
          <CheckIcon fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;
