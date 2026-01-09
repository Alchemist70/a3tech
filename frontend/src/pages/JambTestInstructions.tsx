import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, PlayArrow } from '@mui/icons-material';
// SEB removed: Safe Exam Browser support stripped
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const JambInstructions: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const { user } = useAuth();

  const [countdown, setCountdown] = useState(10);
  const [testStarted, setTestStarted] = useState(false);
  const [mockTestData, setMockTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !mockTestId) {
      navigate('/login');
      return;
    }

    // Fetch mock test status
    const fetchMockTestStatus = async () => {
      try {
        const response = await api.get(`/mock-test/${mockTestId}/status`);
        setMockTestData(response.data);
        setLoading(false);
      } catch (error: any) {
        setError('Error fetching mock test data');
        setLoading(false);
      }
    };

    fetchMockTestStatus();
  }, [user, mockTestId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!testStarted) return;

    if (countdown === 0) {
      navigate(`/mock-test/jamb/test/${mockTestId}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, testStarted, navigate, mockTestId]);
  const handleStartTest = async () => {
    // SEB removed: do not attempt to open Safe Exam Browser
    // Request fullscreen immediately during user click (synchronous, within gesture context)
    // This must be done before any async operations
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        // Use Promise.catch to silently ignore errors
        elem.requestFullscreen().catch(() => {
          // Silently ignore - fullscreen may not be available
        });
      }
    } catch (err) {
      // Ignore errors
    }

    // Pre-warm camera permission during the user's click and keep the stream
    // alive to avoid a later permission prompt (which can exit fullscreen).
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          // Store warm stream globally so PreflightChecks can detect permission
          // without prompting again. Do NOT stop tracks here to avoid flicker.
          (window as any).__proctorWarmStream = stream;
          try {
            sessionStorage.setItem('proctor_camera_status', 'granted');
          } catch (e) {
            // ignore storage errors
          }
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[JambTestInstructions] Camera pre-warmed successfully, status=granted');
          }
        } catch (err: any) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[JambTestInstructions] Camera pre-warm failed:', err?.name, err?.message);
          }
          try {
            sessionStorage.setItem('proctor_camera_status', 'denied');
          } catch (e) {
            // ignore storage errors
          }
        }
      }
    } catch (err) {
      // Ignore
    }

    // Set overflow hidden to prevent scrollbars from causing fullscreen to exit
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (err) {
      // Ignore
    }

    // Start countdown
    setTestStarted(true);
  };

  if (testStarted) {
    return (
      <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 800 }}>
            {countdown}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Test starting in...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 6 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/mock-test/jamb/confirm/${mockTestId}`)}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Confirmation
          </Button>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.dark' }}>
            Test Instructions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please read the following instructions carefully before starting the test.
          </Typography>
        </Box>

        {error && (
          <Box sx={{ background: theme.palette.error.light, p: 2, borderRadius: 1.5, mb: 3, color: theme.palette.error.dark }}>
            <Typography>{error}</Typography>
          </Box>
        )}

        {/* Subject Combination */}
        {/* Subject Combination */}
        {/* Determine subjects to show: prefer server-provided, fall back to sessionStorage */}
        {(() => {
          try {
            const stored = mockTestData?.subjectCombination && Array.isArray(mockTestData.subjectCombination) && mockTestData.subjectCombination.length
              ? mockTestData.subjectCombination
              : (mockTestId ? JSON.parse(sessionStorage.getItem(`selectedSubjects_${mockTestId}`) || 'null') : null) || [];
            // Render the card below using stored
            return (
              <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                    Your Subject Combination
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {stored.map((subject: string) => (
                      <Box
                        key={subject}
                        sx={{
                          p: 2,
                          background: alpha(subject === 'Use of English' ? theme.palette.primary.main : theme.palette.info.main, 0.1),
                          borderRadius: 1.5,
                          border: `1px solid ${alpha(subject === 'Use of English' ? theme.palette.primary.main : theme.palette.info.main, 0.3)}`,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {subject === 'Use of English' ? '60 questions' : '40 questions'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            );
          } catch (e) {
            return null;
          }
        })()}

        {/* Instructions Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Important Instructions
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  ⏱️ Time Management
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  You have 2 hours and 35 minutes to complete the entire test. The timer will be displayed at the top left corner of each question page. Manage your time wisely.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  📚 Subject Sequence
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  You will answer one question at a time. Once you complete all questions for a subject, you cannot return to that subject. Ensure you finish one subject before moving to the next.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  ✅ Answering Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Select your answer from the provided options (A, B, C, or D). You can bookmark questions for later review within the same subject.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  🔖 Question Status
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
                  Question colors on the sidebar indicate their status:
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#4CAF50' }} />
                    <Typography variant="caption">Answered</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#f44336' }} />
                    <Typography variant="caption">Unanswered</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#2196F3' }} />
                    <Typography variant="caption">Bookmarked</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  📤 Submission
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  After answering all questions, you will see a summary page. Review your answers and click "Submit Test" to finalize your submission. You cannot modify answers after submission.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  �️ System Requirements
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1 }}>
                  To ensure a secure testing environment, your system will be checked for:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>✓ Desktop/Laptop PC (not mobile or tablet)</Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>✓ Webcam for proctoring verification</Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>✓ Stable internet connection</Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>✓ Fullscreen capability</Typography>
                  <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>✓ Secure browser environment</Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  �📊 Result Checking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  Your results will be available 1 hour after submission. Use your unique exam ID to check your score and detailed performance analysis.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 5 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/mock-test/jamb/confirm/${mockTestId}`)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                size="large"
                endIcon={<PlayArrow />}
                onClick={handleStartTest}
                sx={{ fontWeight: 700 }}
              >
                Start Test
              </Button>
            </Box>
          </CardContent>
        </Card>
        {/* SEB support removed — no external SEB prompts shown */}
      </Container>
    </Box>
  );
};

export default JambInstructions;
