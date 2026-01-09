import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, Schedule } from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const WaecMockTestStart: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [canAttempt, setCanAttempt] = useState(false);
  const [nextAttemptDate, setNextAttemptDate] = useState<Date | null>(null);
  const [countdownText, setCountdownText] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkAttempt = async () => {
      try {
        const response = await api.get('/mock-test/info/last-attempt', {
          params: { examType: 'WAEC' },
        });
        setCanAttempt(response.data.canAttempt);
        if (!response.data.canAttempt && response.data.nextAttemptDate) {
          setNextAttemptDate(new Date(response.data.nextAttemptDate));
        }
        setLoading(false);
          // If user can attempt, redirect directly to subject selection
          if (response.data.canAttempt) {
            navigate('/mock-test/waec/subjects', { replace: true });
          }
      } catch (error) {
        console.error('Error checking attempt:', error);
        setLoading(false);
      }
    };

    checkAttempt();
  }, [user, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!nextAttemptDate) {
      setCountdownText('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextAttemptDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdownText('Available now!');
        setCanAttempt(true);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    // Call immediately on first render to avoid empty display
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextAttemptDate]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!canAttempt) {
    return (
      <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Home
          </Button>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
              <Schedule sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
                WAEC Mock Test - Weekly Limit
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
                You can only attempt the WAEC mock test once per week. Your next attempt will be available in:
              </Typography>

              <Box
                sx={{
                  p: 3,
                  background: theme.palette.warning.light,
                  borderRadius: 2,
                  mb: 4,
                  color: theme.palette.warning.dark,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                  {countdownText}
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  This weekly limit helps ensure you have time to prepare between tests. Use our study materials to improve your knowledge in the meantime!
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                >
                  Home
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/mock-test/jamb')}
                >
                  Try JAMB Mock Test
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Home
        </Button>

        <Card>
          <CardContent sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 4 }}>
              WAEC Mock Test
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, lineHeight: 1.7 }}>
              Get ready for your WAEC examination! This mock test will help you assess your readiness and identify areas for improvement.
            </Typography>

            <Alert severity="success" sx={{ mb: 4 }}>
              <Typography variant="body2">
                You are eligible to take the test now. The test structure is similar to JAMB with subject-specific questions.
              </Typography>
            </Alert>

            <Alert severity="info" sx={{ mb: 4 }}>
              <Typography variant="body2">
                Note: WAEC mock test functionality will be implemented similarly to JAMB. Currently, you can use the JAMB mock test to prepare.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/mock-test/jamb')}
              >
                Try JAMB Mock Test Instead
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WaecMockTestStart;
