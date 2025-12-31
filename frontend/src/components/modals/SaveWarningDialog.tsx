import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface SaveWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const SaveWarningDialog: React.FC<SaveWarningDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600 }}>
        <WarningIcon sx={{ color: 'warning.main' }} />
        Important Notice
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Once you save your profile details, they <strong>cannot be changed</strong>.
        </Alert>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Your educational profile and location information will be locked permanently. Please review your
          entries carefully before confirming.
        </Typography>
        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            This is to maintain the integrity of our research community and prevent data manipulation.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="text" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={onConfirm}
          disabled={loading}
          sx={{ bgcolor: 'warning.main' }}
        >
          {loading ? 'Saving...' : 'Save Permanently'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveWarningDialog;
