import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { CircularProgress, Box, Typography } from '@mui/material';
import { getRedirectPathByEducationLevel } from '../utils/redirectUtils';

/**
 * AuthCallback component handles Google OAuth callback
 * Extracts token from URL query params and sets it in auth context
 */
const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken, updateUser } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const name = searchParams.get('name');

        if (!token) {
          console.error('No token in OAuth callback');
          navigate('/login?error=no_token');
          return;
        }

        // Create user object from OAuth response
        const userData = {
          _id: userId || '',
          email: email || '',
          name: name || '',
        };

        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        // Persist token and set in context
        localStorage.setItem('auth_token', token);
        setToken(token);

        // Try to fetch authoritative profile (may include premium flags)
        try {
          const res = await api.get('/users/profile');
          if (res?.data?.data) {
            const profile = res.data.data;
            try { localStorage.setItem('user', JSON.stringify(profile)); } catch (e) {}
            if (updateUser) updateUser(profile as any);
            
            // Navigate to appropriate page based on education level (replace history)
            const redirectPath = getRedirectPathByEducationLevel(profile?.educationLevel);
            navigate(redirectPath, { replace: true });
          } else {
            // fallback: store minimal user data
            try { localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {}
            if (updateUser) updateUser(userData as any);
            navigate('/', { replace: true });
          }
        } catch (err) {
          // On failure, fallback to minimal user payload but keep token
          console.warn('[AuthCallback] Failed to fetch profile after OAuth:', err);
          try { localStorage.setItem('user', JSON.stringify(userData)); } catch (e) {}
          if (updateUser) updateUser(userData as any);
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=callback_failed');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, setToken, updateUser]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body1">Processing authentication...</Typography>
    </Box>
  );
};

export default AuthCallback;
