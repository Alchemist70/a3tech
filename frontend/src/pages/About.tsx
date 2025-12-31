import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import './sections.css';
import {
  School,
  Work,
  Science,
  EmojiEvents,
  Email,
  LocationOn,
  GitHub,
  LinkedIn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../api';
import { useInView } from 'react-intersection-observer';

const AnimatedBox = motion(Box);

const DEFAULT_ACHIEVEMENTS = [
  "Published 3 research papers in top-tier conferences",
  "Developed novel APFL-ODA framework for medical federated learning",
  "Created explainable AI system for multi-omics biomarker discovery",
  "Designed comprehensive security framework for Software Defined Vehicles",
  "Achieved 40% improvement in federated learning convergence speed",
  "Maintained differential privacy guarantees of ε = 5 and δ = 10⁻⁵"
];

const About: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [aboutData, setAboutData] = React.useState<any | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/about');
        const data = res.data;
        // eslint-disable-next-line no-console
        console.log('[About page] Fetched about data:', data);
        if (!cancelled && data) setAboutData(data);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[About page] Error fetching about data:', e);
        // ignore and use fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const education = aboutData?.education?.length ? aboutData.education : [
    {
      degree: "Bachelor of Technology in Computer Science and Engineering (AI & ML)",
      institution: "GITAM University, Bengaluru",
      year: "2022-2026",
      description: "Specialized in Artificial Intelligence and Machine Learning with focus on healthcare applications and federated learning systems."
    }
  ];

  const experience = aboutData?.experience?.length ? aboutData.experience : [
    {
      title: "Research Scientist & AI Engineer",
      organization: "GITAM University, SDV-MURTI Lab",
      period: "2023-Present",
      description: "Leading research in federated learning, multi-omics biomarker discovery, and software-defined vehicle security systems."
    }
  ];

  const researchInterests = aboutData?.researchInterests?.length ? aboutData.researchInterests : [
    "Federated Learning",
    "Multi-omics Data Analysis",
    "Explainable AI",
    "Privacy-Preserving Machine Learning",
    "Computer Vision",
    "Biomarker Discovery",
    "Software-Defined Vehicles",
    "Medical AI",
    "Graph Neural Networks",
    "Differential Privacy"
  ];

  const achievements = React.useMemo(() => (
    aboutData?.achievements?.length ? aboutData.achievements : DEFAULT_ACHIEVEMENTS
  ), [aboutData?.achievements]);

  // Log achievements when source data changes
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[About page] Using achievements:', achievements);
  }, [achievements]);

  return (
    <Box className="section-bg" style={{ minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <AnimatedBox
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center', mb: 8 }}
        >
          <div className="section-title">About Me</div>
          <div className="section-gradient-bar" />
          <Typography variant="h6" className="section-subtitle" sx={{ maxWidth: 800, mx: 'auto' }}>
            Passionate AI researcher and engineer dedicated to advancing healthcare, 
            biotechnology, and intelligent transportation through innovative machine learning solutions.
          </Typography>
        </AnimatedBox>

        {/* Profile Section */}
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          sx={{ mb: 8 }}
        >
          <Card className="section-card">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Avatar
                  src={aboutData?.profilePicture || undefined}
                  sx={{
                    width: { xs: 120, sm: 160, md: 200 },
                    height: { xs: 120, sm: 160, md: 200 },
                    mx: 'auto',
                    mb: 2,
                    fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                    backgroundColor: aboutData?.profilePicture ? 'transparent' : 'primary.main',
                  }}
                >
                  {!aboutData?.profilePicture && 'AA'}
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  {aboutData?.name || 'Abdulhadi Abbas Akanni'}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                  {aboutData?.title || 'AI Research Scientist & Engineer'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Email color="primary" />
                  <LocationOn color="primary" />
                  <GitHub color="primary" />
                  <LinkedIn color="primary" />
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="body1" paragraph sx={{ fontSize: { xs: '1rem', sm: '1.05rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                  {aboutData?.bio || 'I am a dedicated AI researcher and engineer with a passion for solving complex problems in healthcare, biotechnology, and intelligent transportation. My work focuses on developing privacy-preserving machine learning systems, explainable AI for biomarker discovery, and secure frameworks for software-defined vehicles.'}
                </Typography>
                {aboutData?.bioDescription && (
                  <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                    {aboutData.bioDescription}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Card>
        </AnimatedBox>

        {/* Education & Experience */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <AnimatedBox
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <School sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Education
                    </Typography>
                  </Box>
                  {education.map((edu: any, index: number) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {edu.degree}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {edu.institution}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {edu.year}
                      </Typography>
                      <Typography variant="body2">
                        {edu.description}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <AnimatedBox
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Work sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Experience
                    </Typography>
                  </Box>
                  {experience.map((exp: any, index: number) => (
                    <Box key={index} sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        {exp.title}
                      </Typography>
                      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                        {exp.organization}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {exp.period}
                      </Typography>
                      <Typography variant="body2">
                        {exp.description}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>
        </Grid>

        {/* Research Interests */}
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          sx={{ mb: 8 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Science sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Research Interests
                </Typography>
              </Box>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                My research spans multiple domains of artificial intelligence, with a focus on 
                practical applications that benefit society. I am particularly interested in 
                developing AI systems that are both powerful and trustworthy.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {researchInterests.map((interest: string, index: number) => (
                  <Chip
                    key={index}
                    label={interest}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </AnimatedBox>

        {/* Achievements */}
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.0 }}
          sx={{ mb: 8 }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Key Achievements
                </Typography>
              </Box>
              <List>
                {achievements.map((achievement: string, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <EmojiEvents color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={achievement} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </AnimatedBox>

        {/* Contact Information */}
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Let's Connect
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              I'm always interested in discussing research opportunities, collaborations, 
              or any questions about my work. Feel free to reach out!
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<Email />}
                label="Email"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => window.location.href = `mailto:${aboutData?.email || 'aabdulha@gitam.in'}`}
              />
              <Chip
                icon={<LocationOn />}
                label="Address"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(aboutData?.location || 'Bengaluru, India')}`, '_blank')}
              />
              <Chip
                icon={<GitHub />}
                label="GitHub"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => window.open(aboutData?.github || 'https://github.com/abdulhadi-akanni', '_blank')}
              />
              <Chip
                icon={<LinkedIn />}
                label="LinkedIn"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
                onClick={() => window.open(aboutData?.linkedin || 'https://linkedin.com/in/abdulhadi-akanni', '_blank')}
              />
            </Box>
          </Paper>
        </AnimatedBox>
      </Container>
    </Box>
  );
};

export default About;
