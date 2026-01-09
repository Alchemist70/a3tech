import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  alpha,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowForward, School, EmojiEvents, MenuBook, TrendingUp, Description } from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const AnimatedBox = motion(Box);

const examSections = [
  {
    title: 'WAEC',
    fullName: 'West African Examinations Council',
    description: 'Comprehensive preparation for WAEC examinations with detailed subject coverage and practice materials.',
    icon: <School sx={{ fontSize: 50, color: '#ffffff' }} />,
    color: '#FF6B6B',
    hoverColor: '#FF5252',
    slug: 'waec',
  },
  {
    title: 'JAMB',
    fullName: 'Joint Admissions and Matriculation Board',
    description: 'Master JAMB subjects with our curated study guides, practice questions, and expert explanations.',
    icon: <EmojiEvents sx={{ fontSize: 50, color: '#ffffff' }} />,
    color: '#4ECDC4',
    hoverColor: '#45B7D1',
    slug: 'jamb',
  },
];

const HighSchoolHome: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [jambCountdown, setJambCountdown] = useState('');
  const [waecCountdown, setWaecCountdown] = useState('');
  const [jambNextAttempt, setJambNextAttempt] = useState<Date | null>(null);
  const [waecNextAttempt, setWaecNextAttempt] = useState<Date | null>(null);
  const [jambCanAttempt, setJambCanAttempt] = useState(true);
  const [waecCanAttempt, setWaecCanAttempt] = useState(true);
  const [loadingMockTests, setLoadingMockTests] = useState(true);

  const heroBg = `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`;
  const overlayBg = alpha(theme.palette.background.paper, 0.7);

  // Canonicalize URL: if this page is rendered at /high-school, replace URL to root '/'
  useEffect(() => {
    if (location.pathname === '/high-school') {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Fetch mock test attempt info
  useEffect(() => {
    if (!user) {
      setLoadingMockTests(false);
      return;
    }

    const fetchAttemptInfo = async () => {
      try {
        const [jambRes, waecRes] = await Promise.all([
          api.get('/mock-test/info/last-attempt', { params: { examType: 'JAMB' } }),
          api.get('/mock-test/info/last-attempt', { params: { examType: 'WAEC' } }),
        ]);

        setJambCanAttempt(jambRes.data.canAttempt);
        setWaecCanAttempt(waecRes.data.canAttempt);

        if (!jambRes.data.canAttempt && jambRes.data.nextAttemptDate) {
          setJambNextAttempt(new Date(jambRes.data.nextAttemptDate));
        }
        if (!waecRes.data.canAttempt && waecRes.data.nextAttemptDate) {
          setWaecNextAttempt(new Date(waecRes.data.nextAttemptDate));
        }
        setLoadingMockTests(false);
      } catch (error) {
        console.error('Error fetching mock test info:', error);
        setLoadingMockTests(false);
      }
    };

    fetchAttemptInfo();
  }, [user]);

  // JAMB countdown timer
  useEffect(() => {
    if (!jambNextAttempt) {
      setJambCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = jambNextAttempt.getTime() - now.getTime();

      if (diff <= 0) {
        setJambCountdown('');
        setJambCanAttempt(true);
        setJambNextAttempt(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setJambCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [jambNextAttempt]);

  // WAEC countdown timer
  useEffect(() => {
    if (!waecNextAttempt) {
      setWaecCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = waecNextAttempt.getTime() - now.getTime();

      if (diff <= 0) {
        setWaecCountdown('');
        setWaecCanAttempt(true);
        setWaecNextAttempt(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setWaecCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [waecNextAttempt]);
  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 10, md: 16 },
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: '0 8px 32px 0 rgba(49, 56, 157, 0.18)',
          background: heroBg,
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <AnimatedBox
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                sx={{
                  background: overlayBg,
                  boxShadow: theme => `0 4px 32px 0 ${alpha(theme.palette.primary.dark, 0.08)}`,
                  borderRadius: { xs: '1.5rem', md: '2rem' },
                  px: { xs: 3, md: 6 },
                  py: { xs: 4, md: 6 },
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant={isMobile ? 'h2' : 'h1'}
                  gutterBottom
                  sx={{
                    fontWeight: 900,
                    mb: 2,
                    letterSpacing: '-0.03em',
                    color: 'primary.dark',
                    lineHeight: 1.1,
                    textShadow: '0 2px 8px #0001',
                  }}
                >
                  Master Your
                  <br />
                  <Box
                    component="span"
                    sx={{
                      color: 'secondary.main',
                      fontWeight: 900,
                      textShadow: '0 2px 8px rgba(239,96,30,0.14)',
                    }}
                  >
                    High School Exams
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  paragraph
                  sx={{
                    mb: 4,
                    opacity: 0.96,
                    lineHeight: 1.7,
                    color: 'text.secondary',
                    fontSize: { xs: 18, md: 20 },
                  }}
                >
                  Prepare comprehensively for WAEC and JAMB with our expertly curated study materials, practice
                  questions, and detailed explanations to help you succeed.
                </Typography>
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', mt: 2 }}>
                  <Button
                    variant="contained"
                    size={isMobile ? 'medium' : 'large'}
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/waec')}
                    sx={{
                      fontWeight: 700,
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      boxShadow: theme => `0 2px 8px 0 ${alpha(theme.palette.primary.main, 0.08)}`,
                      borderRadius: 2,
                      fontSize: { xs: 14, sm: 16, md: 18 },
                      '&:hover': {
                        boxShadow: theme => `0 4px 16px 0 ${alpha(theme.palette.primary.main, 0.14)}`,
                      },
                    }}
                  >
                    Explore WAEC
                  </Button>
                  <Button
                    variant="outlined"
                    size={isMobile ? 'medium' : 'large'}
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/jamb')}
                    sx={{
                      fontWeight: 700,
                      px: { xs: 2, sm: 3 },
                      py: { xs: 1, sm: 1.5 },
                      borderRadius: 2,
                      fontSize: { xs: 14, sm: 16, md: 18 },
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        borderColor: 'primary.dark',
                        color: 'primary.dark',
                      },
                    }}
                  >
                    Explore JAMB
                  </Button>
                </Box>
              </AnimatedBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <AnimatedBox
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                sx={{
                  background: overlayBg,
                  boxShadow: theme => `0 4px 32px 0 ${alpha(theme.palette.primary.dark, 0.08)}`,
                  borderRadius: { xs: '1.5rem', md: '2rem' },
                  px: { xs: 2.5, md: 4 },
                  py: { xs: 3, md: 4 },
                  backdropFilter: 'blur(12px)',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  height: '100%',
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    color: 'primary.dark',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Description sx={{ fontSize: 24, color: 'secondary.main' }} />
                  Mock Tests
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/mock-test/jamb/subjects')}
                      disabled={!jambCanAttempt || loadingMockTests}
                      sx={{
                        background: jambCanAttempt
                          ? 'linear-gradient(135deg, #4ECDC4 0%, #45B7D1 100%)'
                          : 'linear-gradient(135deg, #999 0%, #777 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 1.5,
                        fontSize: 15,
                        '&:hover': jambCanAttempt ? {
                          background: 'linear-gradient(135deg, #45B7D1 0%, #3AA5B8 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: theme => `0 8px 24px 0 ${alpha('#4ECDC4', 0.3)}`,
                        } : {},
                        '&:disabled': {
                          opacity: 0.6,
                          cursor: 'not-allowed',
                        },
                      }}
                  >
                    JAMB Mock Test
                  </Button>
                    {jambCountdown && (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: 'warning.main',
                          fontWeight: 600,
                          textAlign: 'center',
                          fontFamily: 'monospace',
                        }}
                      >
                        Next attempt: {jambCountdown}
                      </Typography>
                    )}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/mock-test/waec/subjects')}
                      disabled={!waecCanAttempt || loadingMockTests}
                      sx={{
                        background: waecCanAttempt
                          ? 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)'
                          : 'linear-gradient(135deg, #999 0%, #777 100%)',
                        fontWeight: 700,
                        py: 1.5,
                        borderRadius: 1.5,
                        fontSize: 15,
                        '&:hover': waecCanAttempt ? {
                          background: 'linear-gradient(135deg, #FF5252 0%, #FF3838 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: theme => `0 8px 24px 0 ${alpha('#FF6B6B', 0.3)}`,
                        } : {},
                        '&:disabled': {
                          opacity: 0.6,
                          cursor: 'not-allowed',
                        },
                      }}
                  >
                    WAEC Mock Test
                  </Button>
                    {waecCountdown && (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: 'warning.main',
                          fontWeight: 600,
                          textAlign: 'center',
                          fontFamily: 'monospace',
                        }}
                      >
                        Next attempt: {waecCountdown}
                      </Typography>
                    )}
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/mock-test/jamb/check-result')}
                    sx={{
                      fontWeight: 600,
                      py: 1,
                      borderRadius: 1.5,
                      fontSize: 13,
                      borderColor: '#4ECDC4',
                      color: '#4ECDC4',
                      '&:hover': {
                        borderColor: '#45B7D1',
                        backgroundColor: 'rgba(78, 205, 196, 0.05)',
                      },
                    }}
                  >
                    Check JAMB Results
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/mock-test/waec/check-result')}
                    sx={{
                      fontWeight: 600,
                      py: 1,
                      borderRadius: 1.5,
                      fontSize: 13,
                      borderColor: '#FF6B6B',
                      color: '#FF6B6B',
                      '&:hover': {
                        borderColor: '#FF5252',
                        backgroundColor: 'rgba(255, 107, 107, 0.05)',
                      },
                    }}
                  >
                    Check WAEC Results
                  </Button>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2.5,
                    display: 'block',
                    color: 'text.secondary',
                    fontSize: 12,
                    lineHeight: 1.6,
                    textAlign: 'center',
                  }}
                >
                  Test yourself with exam-style questions. Attempt once per week.
                </Typography>
              </AnimatedBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Exam Sections */}
      <Box
        sx={{
          py: { xs: 6, md: 8 },
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.info.main} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <AnimatedBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center', color: '#ffffff', mb: 6 }}
          >
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              }}
            >
              📚 Choose Your Exam Path
            </Typography>
            <Typography
              variant="h6"
              sx={{
                maxWidth: { xs: '100%', sm: 600, md: 700 },
                mx: 'auto',
                opacity: 0.95,
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                px: { xs: 2, sm: 0 },
              }}
            >
              Select your examination board and start your comprehensive preparation journey today.
            </Typography>
          </AnimatedBox>

          <Grid container spacing={4}>
            {examSections.map((section, index) => (
              <Grid item xs={12} md={6} key={section.slug}>
                <AnimatedBox
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  onClick={() => navigate(`/${section.slug}`)}
                  sx={{
                    background: `linear-gradient(135deg, ${section.color} 0%, ${section.color}dd 100%)`,
                    borderRadius: 2,
                    p: 4,
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                      background: `linear-gradient(135deg, ${section.hoverColor} 0%, ${section.hoverColor}dd 100%)`,
                    },
                    color: '#ffffff',
                  }}
                >
                  <Box>
                    <Box sx={{ mb: 2 }}>{section.icon}</Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {section.title}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, mb: 2, display: 'block' }}>
                      {section.fullName}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                      {section.description}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Start Preparing
                    </Typography>
                    <ArrowForward fontSize="small" />
                  </Box>
                </AnimatedBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Info Section */}
      <Box sx={{ py: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {[
              {
                icon: <MenuBook sx={{ fontSize: 40, color: 'primary.main' }} />,
                title: 'Comprehensive Materials',
                description:
                  'Access detailed study guides, lecture notes, and past exam papers for all subjects.',
              },
              {
                icon: <EmojiEvents sx={{ fontSize: 40, color: 'secondary.main' }} />,
                title: 'Focused Learning',
                description: 'Practice with exam-style questions and get instant feedback on your progress.',
              },
              {
                icon: <School sx={{ fontSize: 40, color: 'success.main' }} />,
                title: 'Expert Content',
                description: 'Learn from carefully curated content by experienced educators and subject matter experts.',
              },
            ].map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default HighSchoolHome;
