import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Alert,
} from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowBack, Download } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const WaecResult: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as any;

  const [score, setScore] = useState<number>(state?.score || 0);
  const [total, setTotal] = useState<number>(state?.total || 0);
  const [examId, setExamId] = useState<string>(state?.examId || '');
  const [performanceBySubject, setPerformanceBySubject] = useState<any[]>(state?.performanceBySubject || []);
  const [candidateName, setCandidateName] = useState<string | null>(state?.candidateName || null);
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // If navigation state did not include full results (or shows zeros), attempt to fetch authoritative results
  useEffect(() => {
    const fetchResultsIfNeeded = async () => {
      try {
        // Determine if we should attempt to fetch: if total is 0/missing AND we don't have valid results
        const hasValidResults = total && total > 0;
        if (hasValidResults) return; // Already have results

        // Try to get examId if missing by asking for mock test status
        let resolvedExamId = examId;
        if (!resolvedExamId && mockTestId) {
          try {
            const statusResp = await (await import('../api')).default.get(`/mock-test/${mockTestId}/status`);
            if (statusResp && statusResp.data && statusResp.data.examId) {
              resolvedExamId = statusResp.data.examId;
              setExamId(resolvedExamId);
            }
          } catch (statusError) {
            console.warn('Could not fetch mock test status:', (statusError as any)?.message);
          }
        }

        if (!resolvedExamId) {
          console.warn('Could not determine exam ID for result fetching');
          return;
        }

        // Fetch authoritative results by examId
        try {
          const res = await (await import('../api')).default.get(`/mock-test/check-results/${resolvedExamId}`);
          if (res && res.data) {
            if (res.data.status === 'ready') {
              setScore(res.data.score || 0);
              setTotal(res.data.totalQuestions || 0);
              setPerformanceBySubject(res.data.performanceBySubject || []);
              setCandidateName(res.data.candidateName || null);
            } else if (res.data.status === 'not_ready') {
              console.info('Results not yet available (within 1 hour of submission)');
            }
          }
        } catch (fetchError) {
          console.warn('Could not fetch authoritative WAEC results:', (fetchError as any)?.message);
          // Continue with whatever data we have
        }
      } catch (e) {
        console.error('Unexpected error in fetchResultsIfNeeded:', (e as any)?.message);
      }
    };

    fetchResultsIfNeeded();
  }, [mockTestId, examId, score, total]);

  const getGrade = () => {
    if (percentage >= 80) return { grade: 'A', comment: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B', comment: 'Very Good!' };
    if (percentage >= 60) return { grade: 'C', comment: 'Good!' };
    if (percentage >= 50) return { grade: 'D', comment: 'Satisfactory' };
    return { grade: 'E', comment: 'Needs Improvement' };
  };

  const { grade, comment } = getGrade();

  

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
        </Box>

        <Card sx={{ mb: 4, textAlign: 'center' }}>
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
              Test Submitted Successfully!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Your results will be available 1 hour after submission.
            </Typography>

            {/* Exam ID - Key information */}
            {examId && (
              <Alert severity="success" sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Your Exam ID (save for reference):
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1em' }}>
                  {examId}
                </Typography>
              </Alert>
            )}

            {/* Warning if results are not ready */}
            {total === 0 && (
              <Alert severity="info" sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Your Detailed Results Not Yet Available
                </Typography>
                <Typography variant="body2">
                  Your complete score breakdown will be available approximately 1 hour after submission. 
                  {examId && ` Use your Exam ID (${examId}) to check results later from the Results Checker page.`}
                </Typography>
              </Alert>
            )}

            {/* Next Steps */}
            <Box sx={{ mb: 4, p: 3, background: alpha(theme.palette.info.main, 0.1), borderRadius: 1.5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                What's Next?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                • Your detailed results will be available 1 hour after submission<br/>
                {examId && `• Use your Exam ID (${examId}) to access your results later`}<br/>
                • You can retake the test after 7 days<br/>
                • Consistent practice will help improve your score
              </Typography>
            </Box>

            {/* Your Performance */}
            {total > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Your Performance</Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 1 }}>
                  <Box sx={{ flex: '1 1 220px', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#f6fff7' }}>
                    <Typography variant="caption" color="text.secondary">Score</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main' }}>{score}/{total}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 220px', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fff7ff' }}>
                    <Typography variant="caption" color="text.secondary">Overall Percentage</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>{percentage}%</Typography>
                  </Box>
                </Box>

                {/* Performance by Subject */}
                {performanceBySubject && performanceBySubject.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Performance by Subject</Typography>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {performanceBySubject.map((sub: any, idx: number) => (
                        <Box key={idx} sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>{sub.subject}</Typography>
                            <Typography variant="caption" color="text.secondary">{sub.score}/{sub.totalQuestions} correct</Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 800 }}>{((sub.score / sub.totalQuestions) * 100).toFixed(1)}%</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 6 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
              {examId && (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/mock-test/waec/check-result')}
                >
                  Check Results Later
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default WaecResult;
