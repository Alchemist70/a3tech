import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  GitHub,
  LinkedIn,
  Email,
  Twitter,
} from '@mui/icons-material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={(t) => ({
        background: `linear-gradient(180deg, ${t.palette.primary.dark} 0%, ${t.palette.primary.main} 100%)`,
        color: t.palette.common.white,
        py: 6,
        mt: 'auto',
      })}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: 'common.white' }}>
              A3 Research
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
              Advancing AI research in healthcare, biotechnology, and intelligent transportation through innovative machine learning approaches and explainable AI systems.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" href="https://github.com" target="_blank" rel="noopener" sx={{ color: 'common.white' }}>
                <GitHub />
              </IconButton>
              <IconButton size="small" href="https://linkedin.com" target="_blank" rel="noopener" sx={{ color: 'common.white' }}>
                <LinkedIn />
              </IconButton>
              <IconButton size="small" href="https://twitter.com" target="_blank" rel="noopener" sx={{ color: 'common.white' }}>
                <Twitter />
              </IconButton>
              <IconButton size="small" href="mailto:contact@alchemistresearch.com" sx={{ color: 'common.white' }}>
                <Email />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'common.white' }}>
              Research Areas
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/projects?category=federated-learning" sx={{ color: 'rgba(255,255,255,0.9)' }} underline="hover">
                Federated Learning
              </Link>
              <Link href="/projects?category=biomarker-discovery" sx={{ color: 'rgba(255,255,255,0.9)' }} underline="hover">
                Biomarker Discovery
              </Link>
              <Link href="/projects?category=automotive-security" sx={{ color: 'rgba(255,255,255,0.9)' }} underline="hover">
                Automotive Security
              </Link>
              <Link href="/projects?category=ai-ml" sx={{ color: 'rgba(255,255,255,0.9)' }} underline="hover">
                AI & Machine Learning
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Resources
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/about" color="text.secondary" underline="hover">
                About
              </Link>
              <Link href="/projects" color="text.secondary" underline="hover">
                Projects
              </Link>
              <Link href="/contact" color="text.secondary" underline="hover">
                Contact
              </Link>
              <Link href="/publications" color="text.secondary" underline="hover">
                Publications
              </Link>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'common.white' }}>
              Contact Information
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
              <strong>Abdulhadi Abbas Akanni</strong><br />
              Research Scientist & AI Engineer<br />
              GITAM University, Bengaluru<br />
              India
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Email: aabdulha@gitam.in
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.12)' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            © {currentYear} A3 Research. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="/privacy" sx={{ color: 'rgba(255,255,255,0.85)' }} underline="hover" variant="body2">
              Privacy Policy
            </Link>
            <Link href="/terms" sx={{ color: 'rgba(255,255,255,0.85)' }} underline="hover" variant="body2">
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
