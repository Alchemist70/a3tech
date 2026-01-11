import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { useAdminTabAuth } from '../contexts/AdminTabAuthContext';

interface TabPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tabName?: string;
  tabIndex?: number;
}

const TabPasswordModal: React.FC<TabPasswordModalProps> = ({
  open,
  onClose,
  onSuccess,
  tabName = 'this admin tab',
  tabIndex = 0,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyTabPassword } = useAdminTabAuth();

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await verifyTabPassword(password, tabIndex);
      if (success) {
        setPassword('');
        onSuccess();
        onClose();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Password verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        // Prevent closing on backdrop click or escape key
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        handleClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      // Lower the dialog stacking so tabs (zIndex ~1199) remain above it and clickable
      sx={{ zIndex: (theme) => Math.max(800, (theme.zIndex?.modal ?? 1300) - 500) }}
      PaperProps={{ sx: { zIndex: (theme) => Math.max(800, (theme.zIndex?.modal ?? 1300) - 500), pointerEvents: 'auto' } }}
      BackdropProps={{ style: { pointerEvents: 'none', backgroundColor: 'transparent' } }}
    >
      <DialogTitle>Password Required</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          This admin section is password protected. Please enter the password to access {tabName}.
        </Alert>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          type="password"
          label="Admin Tab Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmit()}
          disabled={loading}
          placeholder="Enter the password"
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !password.trim()}
          sx={{ position: 'relative' }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              Verifying...
            </Box>
          ) : (
            'Unlock'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TabPasswordModal;
