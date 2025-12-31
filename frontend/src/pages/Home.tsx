import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import './sections.css';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowForward, Science, Security, Biotech } from '@mui/icons-material';
import ResearchGraph from '../components/ResearchGraph';
import { useInView } from 'react-intersection-observer';
import { useVisitTracker } from '../hooks/useVisitTracker';
import api from '../api';



const researchAreas = [
  {
    title: "Federated Learning",
    description: "Privacy-preserving collaborative machine learning across distributed healthcare institutions",
    icon: <Security sx={{ fontSize: 40, color: 'primary.main' }} />,
    color: '#1976d2',
  },
  {
    title: "Biomarker Discovery",
    description: "Explainable AI for discovering interpretable biomarkers from multi-omics data",
    icon: <Biotech sx={{ fontSize: 40, color: 'secondary.main' }} />,
    color: '#dc004e',
  },
  {
    title: "Automotive AI",
    description: "Intelligent security and interaction systems for Software Defined Vehicles",
    icon: <Science sx={{ fontSize: 40, color: 'success.main' }} />,
    color: '#2e7d32',
  },
];

const AnimatedBox = motion(Box);
const AnimatedTypography = motion(Typography);

const Home: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const heroBg = `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`;
  const overlayBg = alpha(theme.palette.background.paper, 0.7);
  const navigate = useNavigate();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Track page visit
  useVisitTracker();

  // Fetch categories from Knowledge Base
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get('/knowledge-base/subjects');
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (mounted) {
          // Get first 3 categories
          setCategories(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (mounted) {
          setCategories([]);
        }
      } finally {
        if (mounted) {
          setLoadingCategories(false);
        }
      }
    };
    fetchCategories();
    return () => { mounted = false; };
  }, []);

  // Fetch featured projects from API
  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const response = await api.get('/projects');
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        if (mounted) {
          // Get first 3 projects
          setFeaturedProjects(data.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        if (mounted) {
          setFeaturedProjects([]);
        }
      } finally {
        if (mounted) {
          setLoadingProjects(false);
        }
      }
    };
    fetchProjects();
    return () => { mounted = false; };
  }, []);

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box sx={{
        py: { xs: 10, md: 16 },
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 0,
        boxShadow: '0 8px 32px 0 rgba(49, 56, 157, 0.18)',
        background: heroBg,
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
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
                  mb: { xs: 4, md: 0 },
                  backdropFilter: 'blur(12px)',
                  maxWidth: { xs: '100%', md: 800 },
                  width: '100%',
                  border: '1.5px solid',
                  borderColor: 'divider',
                  marginLeft: { xs: 0, md: -7 },
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
                  Advancing AI Research
                  <br />
                    <Box component="span" sx={{ color: 'secondary.main', fontWeight: 900, textShadow: '0 2px 8px rgba(239,96,30,0.14)' }}>
                    for a Better Future
                  </Box>
                </Typography>
                <Typography
                  variant="h6"
                  paragraph
                  sx={{ mb: 4, opacity: 0.96, lineHeight: 1.7, color: 'text.secondary', fontSize: { xs: 18, md: 20 } }}
                >
                  Explore cutting-edge research in federated learning, biomarker discovery, and intelligent transportation systems. Discover how AI can solve real-world challenges while maintaining privacy and explainability.
                </Typography>
                <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', mt: 2 }}>
                  <Button
                    variant="contained"
                    size={isMobile ? 'medium' : 'large'}
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/projects')}
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
                    Explore Projects
                  </Button>
                  <Button
                    variant="outlined"
                    size={isMobile ? 'medium' : 'large'}
                    onClick={() => navigate('/about')}
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
                    Learn More
                  </Button>
                </Box>
              </AnimatedBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <AnimatedBox
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: { xs: 280, md: 400 } }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: 220, md: 360 },
                    background: overlayBg,
                    borderRadius: { xs: '1.5rem', md: '2rem' },
                    boxShadow: theme => `0 4px 32px 0 ${alpha(theme.palette.primary.dark, 0.08)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(16px)',
                    border: '1.5px solid',
                    borderColor: 'divider',
                    p: { xs: 0.5, md: 1 },
                    marginLeft: { xs: 0, md: 25 }
                  }}
                >
                  <ResearchGraph />
                </Box>
              </AnimatedBox>
            </Grid>
          </Grid>
        </Container>
      </Box>

  {/* Explore Our Knowledge Base Section */}
  <Box sx={{ py: { xs: 6, md: 8 }, background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.info.main} 100%)`, position: 'relative', overflow: 'hidden' }}>
    <Container maxWidth="lg">
      <AnimatedBox
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        sx={{ textAlign: 'center', color: '#ffffff', mb: 6 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          🚀 Explore Our Knowledge Base
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: { xs: '100%', sm: 600, md: 700 }, mx: 'auto', opacity: 0.95, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, px: { xs: 2, sm: 0 } }}>
          Dive into comprehensive learning materials on AI research and other generic topics, from foundational concepts to advanced implementations
        </Typography>
      </AnimatedBox>

      {/* Knowledge Base Categories Grid */}
      {categories.length > 0 ? (
        <Grid container spacing={3}>
          {categories.map((category: any, index: number) => {
            // Vibrant color palette for categories
            const categoryColors = [
              { bg: '#FF6B6B', hover: '#FF5252' },
              { bg: '#4ECDC4', hover: '#45B7D1' },
              { bg: '#45B7D1', hover: '#3B9FC9' },
              { bg: '#FFA07A', hover: '#FF8C69' },
              { bg: '#98D8C8', hover: '#7ECCC2' },
              { bg: '#F7DC6F', hover: '#F5D742' },
            ];
            const colors = categoryColors[index % categoryColors.length];
            
            return (
              <Grid item xs={12} sm={6} md={4} key={category._id || category.id || index}>
                <AnimatedBox
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  onClick={() => navigate(`/knowledge-base/${encodeURIComponent(category.slug || category.name?.toLowerCase().replace(/\s+/g, '-'))}`)}
                  sx={{
                    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%)`,
                    borderRadius: 2,
                    p: 4,
                    minHeight: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, background 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-12px)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                      background: `linear-gradient(135deg, ${colors.hover} 0%, ${colors.hover}dd 100%)`,
                    },
                    color: '#ffffff',
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: 18, md: 20 } }}>
                      📚 {category.name}
                    </Typography>
                    {category.description && (
                      <Typography variant="body2" sx={{ opacity: 0.95, lineHeight: 1.6 }}>
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Explore
                    </Typography>
                    <ArrowForward fontSize="small" />
                  </Box>
                </AnimatedBox>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <AnimatedBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center' }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/knowledge-base')}
            sx={{
              backgroundColor: '#ffffff',
              color: theme.palette.primary.main,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              fontSize: 16,
              '&:hover': {
                backgroundColor: alpha('#ffffff', 0.9),
              },
            }}
            endIcon={<ArrowForward />}
          >
            Visit Knowledge Base
          </Button>
        </AnimatedBox>
      )}
    </Container>
  </Box>

  {/* Research Areas Section */}
  <Box className="section-bg-alt" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Container maxWidth="lg">
          <AnimatedBox
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center', mb: 6 }}
          >
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
              Research Areas
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Our research spans multiple domains of artificial intelligence, 
              focusing on practical applications that benefit society.
            </Typography>
          </AnimatedBox>

          <Grid container spacing={4}>
            {researchAreas.map((area, index) => (
              <Grid item xs={12} md={4} key={area.title}>
                <AnimatedBox
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      p: 3,
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        {area.icon}
                      </Box>
                      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                        {area.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {area.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </AnimatedBox>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

  {/* Featured Projects Section */}
  <Box className="section-bg" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Container maxWidth="lg">
          <AnimatedBox
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center', mb: 6 }}
          >
            <Typography variant="h3" gutterBottom sx={{ color: '#d64c1f', fontWeight: 700 }}>
              Featured Projects
            </Typography>
            <Typography variant="h6" sx={{ maxWidth: 600, mx: 'auto', color: '#333333', fontWeight: 500 }}>
              Explore our latest research projects and discover how we're pushing 
              the boundaries of artificial intelligence.
            </Typography>
          </AnimatedBox>

          <Grid container spacing={4}>
            {featuredProjects.length > 0 ? (
              featuredProjects.map((project, index) => (
                <Grid item xs={12} md={4} key={project._id || project.id || index}>
                  <AnimatedBox
                    initial={{ opacity: 0, y: 50 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        minHeight: 700,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        },
                      }}
                      onClick={() => navigate(`/projects/${project._id || project.id}`)}
                    >
                      <CardMedia
                        component="div"
                        sx={{
                          height: 200,
                          backgroundColor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h6" color="text.secondary">
                          {project.title}
                        </Typography>
                      </CardMedia>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', maxHeight: 400, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: 'transparent' }, '&::-webkit-scrollbar-thumb': { background: '#ccc', borderRadius: '3px', '&:hover': { background: '#999' } } }}>
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={project.category || 'Research'}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {project.title}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {project.subtitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                          {project.description}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {project.tags && Array.isArray(project.tags) ? (
                            (project.tags as string[]).slice(0, 3).map((tag: string) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                              />
                            ))
                          ) : null}
                        </Box>
                      </CardContent>
                    </Card>
                  </AnimatedBox>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <AnimatedBox
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  sx={{ textAlign: 'center', py: 4 }}
                >
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {loadingProjects ? 'Loading featured projects...' : 'No projects available yet.'}
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/projects')}
                  >
                    View All Projects
                  </Button>
                </AnimatedBox>
              </Grid>
            )}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/projects')}
            >
              View All Projects
            </Button>
          </Box>
        </Container>
      </Box>

  {/* Call to Action Section */}
  <Box className="section-bg-alt" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <Container maxWidth="md">
          <AnimatedBox
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center' }}
          >
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
              Ready to Explore?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4, opacity: 0.9 }}>
              Dive deeper into our research projects and discover how AI is transforming 
              healthcare, biotechnology, and transportation.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/projects')}
              sx={(theme) => ({
                backgroundColor: theme.palette.background.paper,
                color: "white",
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
              })}
            >
              Start Exploring
            </Button>
          </AnimatedBox>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
