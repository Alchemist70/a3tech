import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import { Home, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AnimatedBox = motion(Box);

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center' }}
        >
          <Card sx={{ p: 6 }}>
            <CardContent>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '4rem', md: '6rem' },
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 2,
                }}
              >
                404
              </Typography>
              
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                Page Not Found
              </Typography>
              
              <Typography
                variant="h6"
                color="text.secondary"
                paragraph
                sx={{
                  mb: 4,
                  maxWidth: 500,
                  mx: 'auto',
                }}
              >
                Sorry, the page you're looking for doesn't exist or has been moved. 
                Let's get you back on track!
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Home />}
                  onClick={() => navigate('/')}
                  sx={{ minWidth: 150 }}
                >
                  Go Home
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate(-1)}
                  sx={{ minWidth: 150 }}
                >
                  Go Back
                </Button>
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 4 }}
              >
                If you believe this is an error, please contact me through the contact page.
              </Typography>
            </CardContent>
          </Card>
        </AnimatedBox>
      </Container>
    </Box>
  );
};

export default NotFound;
