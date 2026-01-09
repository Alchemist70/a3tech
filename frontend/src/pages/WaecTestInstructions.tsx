import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  alpha,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, PlayArrow } from '@mui/icons-material';
// SEB removed: Safe Exam Browser support stripped
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const WaecTestInstructions: React.FC = () => {
  const theme = useTheme();
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

  useEffect(() => {
    if (!testStarted) return;

    // Use interval with functional updater to avoid stale closures
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // navigate to test route when countdown reaches zero
          navigate(`/mock-test/waec/test/${mockTestId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [testStarted, navigate, mockTestId]);

  const handleStartTest = async () => {
    // SEB removed: do not attempt to open Safe Exam Browser
    // Set overflow hidden first to prevent scrollbars
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (err) {
      // Ignore
    }

    // Request fullscreen immediately during user click (within gesture context)
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen().catch(() => {
          // Silently ignore - fullscreen may not be available
        });
      }
    } catch (err) {
      // Log but don't block on fullscreen errors
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[WaecTestInstructions] Fullscreen request error:', err);
      }
    }

    // Pre-warm camera permission during the user's click and keep the stream
    // alive to avoid a later permission prompt (which can exit fullscreen).
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          (window as any).__proctorWarmStream = stream;
          sessionStorage.setItem('proctor_camera_status', 'granted');
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[WaecTestInstructions] Camera pre-warmed successfully');
          }
        } catch (err: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[WaecTestInstructions] Camera pre-warm failed:', err?.name, err?.message);
          }
          sessionStorage.setItem('proctor_camera_status', 'denied');
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[WaecTestInstructions] Unexpected camera pre-warm error:', err);
      }
    }

    // Start countdown
    setTestStarted(true);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

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
            onClick={() => navigate(`/mock-test/waec/confirm/${mockTestId}`)}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Confirmation
          </Button>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.dark' }}>
            WAEC Mock Test Instructions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please read all instructions carefully before starting the test.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {/* Subject Combination */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                Your Subject Combination
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(() => {
                  try {
                    const stored = mockTestData?.subjectCombination && Array.isArray(mockTestData.subjectCombination) && mockTestData.subjectCombination.length
                      ? mockTestData.subjectCombination
                      : (mockTestId ? JSON.parse(sessionStorage.getItem(`selectedSubjects_${mockTestId}`) || 'null') : null) || [];
                    return stored.map((subject: string) => <Chip key={subject} label={subject} color="primary" />);
                  } catch (e) {
                    return null;
                  }
                })()}
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Test Structure */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Test Structure (3 Phases)
              </Typography>

              <Box sx={{ mb: 3, p: 2, background: alpha(theme.palette.info.main, 0.1), borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Phase 1: First 3 Subjects (60 + 50 + 50 minutes = 160 minutes)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Use of English: 80 questions, 60 minutes<br/>
                  • Subject 2: 60 questions, 50 minutes<br/>
                  • Subject 3: 60 questions, 50 minutes<br/>
                  • 15-minute break after Phase 1
                </Typography>
              </Box>

              <Box sx={{ mb: 3, p: 2, background: alpha(theme.palette.warning.main, 0.1), borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Phase 2: Next 3 Subjects (50 + 50 + 50 minutes = 150 minutes)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Subject 4: 60 questions, 50 minutes<br/>
                  • Subject 5: 60 questions, 50 minutes<br/>
                  • Subject 6: 60 questions, 50 minutes<br/>
                  • 15-minute break after Phase 2
                </Typography>
              </Box>

              <Box sx={{ mb: 3, p: 2, background: alpha(theme.palette.success.main, 0.1), borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Phase 3: Remaining Subjects (Timing varies)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • 1 Subject: 60 questions, 50 minutes<br/>
                  • 2 Subjects: 60 questions each, 100 minutes total<br/>
                  • 3 Subjects: 60 questions each, 150 minutes total
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* General Instructions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                General Instructions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>•</Typography>
                  <Typography variant="body2">
                    You can return to any previous subject at anytime within the time span.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>•</Typography>
                  <Typography variant="body2">
                    Each question must be answered before you can proceed to the next.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>•</Typography>
                  <Typography variant="body2">
                    You can bookmark questions for later review within the same subject.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>•</Typography>
                  <Typography variant="body2">
                    The timer will count down continuously. You cannot pause the test.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 24 }}>•</Typography>
                  <Typography variant="body2">
                    Your answers are auto-saved after each selection.
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Question Status Colors */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Question Status Indicators
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 20, height: 20, background: '#4caf50', borderRadius: '50%' }} />
                  <Typography variant="body2">
                    <strong>Green:</strong> Answered
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 20, height: 20, background: '#f44336', borderRadius: '50%' }} />
                  <Typography variant="body2">
                    <strong>Red:</strong> Unanswered
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 20, height: 20, background: '#2196f3', borderRadius: '50%' }} />
                  <Typography variant="body2">
                    <strong>Blue:</strong> Bookmarked
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* System Requirements */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                🛡️ System Requirements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
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

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 6 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/mock-test/waec/confirm/${mockTestId}`)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<PlayArrow />}
                onClick={handleStartTest}
                size="large"
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

export default WaecTestInstructions;
