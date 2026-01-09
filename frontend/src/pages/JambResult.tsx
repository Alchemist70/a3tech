import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  Alert,
} from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const JambResult: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as any;

  const score = state?.score || 0;
  const total = state?.total || 0;
  const examId = state?.examId || '';
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const getGrade = () => {
    if (percentage >= 80) return { grade: 'A', comment: 'Excellent!' };
    if (percentage >= 70) return { grade: 'B', comment: 'Very Good!' };
    if (percentage >= 60) return { grade: 'C', comment: 'Good!' };
    if (percentage >= 50) return { grade: 'D', comment: 'Satisfactory' };
    return { grade: 'E', comment: 'Needs Improvement' };
  };

  const { grade } = getGrade();

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

        {/* Result Card */}
        <Card sx={{ mb: 4, textAlign: 'center' }}>
          <CardContent sx={{ p: { xs: 3, md: 6 } }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
              Test Submitted Successfully!
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Your results will be available 1 hour after submission.
            </Typography>

            {/* Exam ID - Key information */}
            <Alert severity="success" sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Your Exam ID (save for reference):
              </Typography>
              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1em' }}>
                {examId}
              </Typography>
            </Alert>

            {/* Next Steps */}
            <Box sx={{ mb: 4, p: 3, background: alpha(theme.palette.info.main, 0.1), borderRadius: 1.5 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                What's Next?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                • Your detailed results will be available 1 hour after submission<br/>
                • Use your Exam ID to access your results later<br/>
                • You can retake the test after 7 days<br/>
                • Consistent practice will help improve your score
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
              >
                Go to Home
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Next Steps
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  ⏱️ Check Detailed Results
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your detailed performance analysis will be available in 1 hour. You can view it using your exam ID.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  📚 Review Study Materials
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Go back to our comprehensive study materials to strengthen your weak areas before the actual exam.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                  ⏰ Next Mock Test
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You can attempt the next mock test after 7 days. Consistent practice will help you improve your score.
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default JambResult;
