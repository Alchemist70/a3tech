import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, Link } from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    // Check for success message from location state (e.g., from password reset)
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      setLoading(false);
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || err?.message || 'Login failed');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
      <Paper sx={{ p: 3, width: 420 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Login</Typography>
        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField label="Email" fullWidth value={email} onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Password" type="password" fullWidth value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            sx={{ 
              textDecoration: 'none', 
              fontSize: '0.875rem',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            Forgot Password?
          </Link>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="contained" onClick={submit} disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
          <Button variant="text" onClick={() => navigate('/signup')}>Create account</Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
