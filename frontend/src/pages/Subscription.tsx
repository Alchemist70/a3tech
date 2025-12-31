import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const features = [
  'Access to all research projects and their detailed documentation',
  'Full access to the Knowledge Base with in-depth technical content',
  'Priority support and technical consultation',
  'Early access to new research findings',
  'Downloadable resources and code samples',
  'Monthly newsletter with exclusive insights'
];

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleProceedToPayment = () => {
    navigate('/payment', { state: { from } });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 8, mb: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom>
          Unlock Full Access
        </Typography>
        <Typography variant="h5" color="textSecondary" paragraph>
          Join our research community and get exclusive access to all our resources
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h4" component="h2" gutterBottom color="primary">
                Premium Membership
              </Typography>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Get full access to all features and content
              </Typography>
              
              <List>
                {features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>

              <Box mt={4}>
                <Typography variant="h4" color="primary" gutterBottom>
                  $99/month
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Cancel anytime • No hidden fees
                </Typography>
              </Box>
            </CardContent>
            <CardActions sx={{ p: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={handleProceedToPayment}
              >
                Subscribe Now
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Box mt={6} textAlign="center">
        <Typography variant="body1" color="textSecondary">
          Questions about subscription? Contact our support team
        </Typography>
      </Box>
    </Container>
  );
};

export default Subscription;