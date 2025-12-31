import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper, 
  Typography, 
  Alert, 
  Link,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../components/AdminLayout';

const AdminSignup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [registrationSecret, setRegistrationSecret] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showRegSecret, setShowRegSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/admin/auth/register', {
        name,
        email,
        password,
        secretCode,
        registrationSecret
      });

      // Redirect to login page on successful registration
      navigate('/admin/login', { 
        state: { message: 'Registration successful. Please log in.' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Clear any existing auth on mount
  useEffect(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }, []);

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
          Admin Registration
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />

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
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Admin Secret Code"
            type={showSecretCode ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            required
            disabled={loading}
            helperText="Create a personal secret code for admin access"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowSecretCode(!showSecretCode)}
                    edge="end"
                  >
                    {showSecretCode ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Registration Secret"
            type={showRegSecret ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={registrationSecret}
            onChange={(e) => setRegistrationSecret(e.target.value)}
            required
            disabled={loading}
            helperText="Enter the admin registration secret provided by system administrator"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowRegSecret(!showRegSecret)}
                    edge="end"
                  >
                    {showRegSecret ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Already have an admin account?{' '}
            <Link
              component={RouterLink}
              to="/admin/login"
              sx={{ 
                textDecoration: 'none', 
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' } 
              }}
            >
              Login here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
    </AdminLayout>
  );
};

export default AdminSignup;