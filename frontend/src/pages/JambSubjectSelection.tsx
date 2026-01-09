import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowForward, ArrowBack } from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const defaultJambSubjects = [
  'Use of English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Geography',
  'History',
  'Civics',
  'Literature in English',
];

const JambSubjectSelection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Use of English']);
  const [subjects, setSubjects] = useState<string[]>(defaultJambSubjects);
  const [isComboLocked, setIsComboLocked] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mockTestId, setMockTestId] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Initialize mock test
    const initializeMockTest = async () => {
      try {
        const response = await api.post('/mock-test/initialize', {
          examType: 'JAMB',
        });
        setMockTestId(response.data.mockTestId);

        // If user changed subjects previously, and within 8 months, lock selection
        if (response.data.lastSubjectCombinationChangedDate) {
          const lastChange = new Date(response.data.lastSubjectCombinationChangedDate);
          const now = new Date();
          const monthsDiff = (now.getFullYear() - lastChange.getFullYear()) * 12 + (now.getMonth() - lastChange.getMonth());
          if (monthsDiff < 8 && Array.isArray(response.data.lastSubjectCombination)) {
            setSelectedSubjects(response.data.lastSubjectCombination);
            setIsComboLocked(true);
            setError('Your subject combination is locked until ' + new Date(lastChange.setMonth(lastChange.getMonth() + 8)).toLocaleDateString());
          }
        }
      } catch (error: any) {
        if (error.response?.status === 429) {
          setError(`${error.response.data.message}. Next attempt available at: ${new Date(error.response.data.nextAttemptDate).toLocaleString()}`);
        } else {
          setError('Error initializing mock test. Please try again.');
        }
      }
    };

    initializeMockTest();

    // Fetch JAMB sections for subjects list
    const fetchSections = async () => {
      try {
        const resp = await api.get('/jamb-sections');
        if (Array.isArray(resp.data)) {
          const names = resp.data.map((s: any) => s.name).filter(Boolean);
          if (names.length) setSubjects(names);
        }
      } catch (e) {
        // keep default subjects on error
        console.warn('Failed to fetch JAMB sections', e && (e as any).message ? (e as any).message : e);
      }
    };

    fetchSections();
  }, [user, navigate]);

  // Persist current selection to sessionStorage to ensure confirmation/instruction pages can show it immediately
  useEffect(() => {
    if (mockTestId && Array.isArray(selectedSubjects)) {
      try {
        sessionStorage.setItem(`selectedSubjects_${mockTestId}`, JSON.stringify(selectedSubjects));
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [selectedSubjects, mockTestId]);

  const handleSubjectToggle = (subject: string) => {
    if (isComboLocked) return; // prevent edits when locked
    if (subject === 'Use of English') return; // Can't unselect English

    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects([...selectedSubjects, subject]);
      }
    }
    setError(''); // Clear error when user makes changes
  };

  const handleNext = async () => {
    if (selectedSubjects.length !== 4) {
      setError('Please select exactly 4 subjects (English + 3 others)');
      return;
    }
    setError(''); // Clear error before proceeding

    // Always attempt to persist subjects to backend (backend will check if it's a true change)
    setLoading(true);
    try {
      await api.put(`/mock-test/${mockTestId}/subjects`, {
        subjects: selectedSubjects,
      });
      if (isComboLocked) {
        // Combo is locked, proceed directly
        navigate(`/mock-test/jamb/confirm/${mockTestId}`);
      } else {
        // First time, show confirmation modal
        setShowConfirmation(true);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error updating subjects';
      setError(errorMsg);
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[JambSubjectSelection] Error saving subjects:', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = async () => {
    // Subjects are already saved by handleNext, just navigate
    navigate(`/mock-test/jamb/confirm/${mockTestId}`);
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 6 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Home
          </Button>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.dark' }}>
            JAMB Mock Test - Subject Selection
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Choose 3 additional subjects to accompany the compulsory Use of English. You can only change your subject combination once every 8 months.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> The order in which you select your subjects will be the order in which you will take the test sections.
            </Typography>
          </Alert>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Select Your Subjects
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4 }}>
              {subjects.map((subject) => (
                <Box
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  sx={{
                    p: 2.5,
                    border: '2px solid',
                    borderColor: selectedSubjects.includes(subject) ? 'primary.main' : 'divider',
                    borderRadius: 1.5,
                    cursor: subject === 'Use of English' ? 'not-allowed' : 'pointer',
                    background: selectedSubjects.includes(subject)
                      ? alpha(theme.palette.primary.main, 0.1)
                      : 'transparent',
                    transition: 'all 0.3s ease',
                    opacity: subject === 'Use of English' ? 1 : selectedSubjects.includes(subject) ? 1 : 0.7,
                    '&:hover': {
                      borderColor: subject === 'Use of English' ? 'divider' : 'primary.main',
                      background:
                        subject === 'Use of English'
                          ? 'transparent'
                          : alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Checkbox
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      disabled={subject === 'Use of English' || isComboLocked}
                      sx={{ ml: -1 }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {subject}
                      </Typography>
                      {subject === 'Use of English' && (
                        <Typography variant="caption" color="text.secondary">
                          Compulsory
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mb: 4, p: 2, background: alpha(theme.palette.info.main, 0.1), borderRadius: 1.5, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Selected Subjects ({selectedSubjects.length}/4)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedSubjects.map((subject) => (
                    <Chip
                      key={subject}
                      label={subject}
                      color="primary"
                      variant={subject === 'Use of English' ? 'filled' : 'outlined'}
                      onDelete={!isComboLocked && subject !== 'Use of English' ? () => handleSubjectToggle(subject) : undefined}
                    />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={selectedSubjects.length !== 4}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
        {/* SEB support removed — no external SEB prompts shown */}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Your Subject Combination</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Please review your subject combination. This selection can only be changed once every 8 months.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Compulsory Subject:</Typography>
            <Typography variant="body2">• Use of English</Typography>
          </Alert>
          <Box sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.1), borderRadius: 1.5, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Your Subjects ({selectedSubjects.length}):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedSubjects.map((subject) => (
                <Chip key={subject} label={subject} color="primary" variant={subject === 'Use of English' ? 'filled' : 'outlined'} />
              ))}
            </Box>
          </Box>
          <Alert severity="warning">
            You will not be able to change this selection until 8 months from now.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)} disabled={loading}>
            Go Back
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmation}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JambSubjectSelection;
