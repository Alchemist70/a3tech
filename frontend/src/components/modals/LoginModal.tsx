import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Box, Typography, Divider } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useAuth } from '../../contexts/AuthContext';

const LoginModal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { loginOpen, closeLogin, switchToSignup } = useAuthModal();
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      closeLogin();
      setEmail('');
      setPassword('');
      // Redirect all users to home page after successful login
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  const handleClose = () => {
    closeLogin();
    setError(null);
    setEmail('');
    setPassword('');
  };

  return (
    <Dialog open={loginOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
        Sign in
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            variant="text"
            size="small"
            sx={{
              textDecoration: 'none',
              fontSize: '0.875rem',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
              justifyContent: 'flex-start',
              pl: 0
            }}
          >
            Forgot Password?
          </Button>
        </Box>
      </DialogContent>
      <Box sx={{ px: 2, py: 2 }}>
        <Divider sx={{ my: 1, mb: 2 }}>OR</Divider>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            // Redirect to Google OAuth endpoint
            window.location.href = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/auth/google`;
          }}
          sx={{ mb: 2, textTransform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          startIcon={<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ height: '20px', width: '20px' }} />}
        >
          Sign in with Google
        </Button>
      </Box>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="text" onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </DialogActions>
      <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          Don't have an account?{' '}
          <Button
            variant="text"
            size="small"
            onClick={switchToSignup}
            sx={{ textTransform: 'none', fontSize: 'inherit' }}
          >
            Create one
          </Button>
        </Typography>
      </Box>
    </Dialog>
  );
};

export default LoginModal;
