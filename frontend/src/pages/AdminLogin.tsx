import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, Link } from '@mui/material';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';

const AdminLogin: React.FC = () => {
  // CRITICAL: Clear all existing auth (both admin and public user) on mount
  // This prevents users from reusing old sessions when switching to admin login
  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_user');
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  // NOTE: Admin login stores credentials separately so it doesn't affect public site auth
  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/admin/auth/login', {
        email: email.trim(),
        password: password.trim(),
        secretCode: secretCode.trim()
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Login failed');
      }

      const { token, data: user } = res.data;
      if (!token || !user) {
        throw new Error('Invalid login response');
      }

      // CRITICAL: Clear all public user auth before storing admin session
      // This prevents a previous non-admin login from interfering
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } catch (e) {
        // ignore any errors during cleanup
      }

      // Store admin session separately from public site auth
      localStorage.setItem('admin_auth_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));

      // Navigate to admin dashboard with success message
      navigate(from, {
        replace: true,
        state: { success: `Welcome, ${user.name || 'Admin'}` }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          minHeight: 'calc(100vh - 64px)', // Account for AppBar height
          bgcolor: 'background.default'
        }}
      >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%'
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Admin Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <TextField
            label="Admin Secret Code"
            type="password"
            fullWidth
            margin="normal"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            required
            disabled={loading}
            helperText="Required for admin access"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Don't have an admin account?{' '}
            <Link
              component={RouterLink}
              to="/admin/signup"
              sx={{ 
                textDecoration: 'none', 
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              Create an Account
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
    </AdminLayout>
  );
};

export default AdminLogin;