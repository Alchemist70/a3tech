import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  TextField,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowForward, ArrowBack, ContentCopy, CheckCircle } from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const JambConfirmation: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const { user } = useAuth();

  const [examId, setExamId] = useState('');
  const [showIdGenerated, setShowIdGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mockTestData, setMockTestData] = useState<any>(null);

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
      } catch (error: any) {
        setError('Error fetching mock test data');
      }
    };

    fetchMockTestStatus();
  }, [user, mockTestId, navigate]);

  const handleGenerateId = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/mock-test/${mockTestId}/generate-id`);
      setExamId(response.data.examId);
      setShowIdGenerated(true);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error generating exam ID');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(examId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () => {
    navigate(`/mock-test/jamb/instructions/${mockTestId}`);
  };

  if (!mockTestData) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Determine subjects to show: prefer server-provided, fall back to sessionStorage (selection page)
  let subjectsToShow: string[] = [];
  try {
    if (mockTestData?.subjectCombination && Array.isArray(mockTestData.subjectCombination) && mockTestData.subjectCombination.length) {
      subjectsToShow = mockTestData.subjectCombination;
    } else if (mockTestId) {
      const stored = sessionStorage.getItem(`selectedSubjects_${mockTestId}`);
      if (stored) subjectsToShow = JSON.parse(stored) as string[];
    }
  } catch (e) {
    subjectsToShow = mockTestData?.subjectCombination || [];
  }

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 6 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/mock-test/jamb/subjects/${mockTestId}`)}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Subjects
          </Button>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.dark' }}>
            Confirm Your Information
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please confirm your registration details and generate your exam ID.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* User Information Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Your Information
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 4 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {user?.name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {user?.email || 'N/A'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Subject Combination Card */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Subject Combination
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 4, p: 2, background: alpha(theme.palette.primary.main, 0.05), borderRadius: 1.5 }}>
              {subjectsToShow && subjectsToShow.length ? (
                subjectsToShow.map((subject: string) => (
                  <Box key={subject} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {subject}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">No subjects selected</Typography>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Exam ID Generation */}
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Generate Exam ID
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Your exam ID will be used to check your results after 1 hour of test submission. Please keep it safe and private.
              </Typography>
            </Alert>

            {!examId ? (
              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateId}
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Exam ID'}
              </Button>
            ) : (
              <Box sx={{ p: 3, background: alpha(theme.palette.success.main, 0.1), border: `2px solid ${theme.palette.success.main}`, borderRadius: 2, mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
                  Your Exam ID (12 Alphanumeric)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, background: '#e3f2fd', borderRadius: 1.5, border: `1px solid #90caf9` }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      flex: 1,
                      wordBreak: 'break-all',
                      userSelect: 'all',
                      color: 'white',
                    }}
                  >
                    {examId}
                  </Typography>
                  <Tooltip title={copied ? 'Copied!' : 'Copy ID'}>
                    <IconButton
                      onClick={handleCopyId}
                      size="small"
                      sx={{
                        background: '#1976d2',
                        color: 'white',
                        '&:hover': {
                          background: '#1565c0',
                        },
                      }}
                    >
                      {copied ? <CheckCircle fontSize="small" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/mock-test/jamb/subjects/${mockTestId}`)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleProceed}
                disabled={!examId}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default JambConfirmation;
