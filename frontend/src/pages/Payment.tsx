import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

const steps = ['Billing Information', 'Payment Details', 'Confirmation'];

const Payment: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handlePayment();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the backend subscribe endpoint
      const response = await api.post('/users/subscribe');

      if (response.data?.success && response.data?.data) {
        // Update the user data in auth context and localStorage
        updateUser(response.data.data);
        
        // Wait a moment for state to update before redirecting
        // This ensures the usePremiumStatus hook can re-run with updated user data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Redirect to the original page after successful subscription
        navigate(from);
      } else {
        setError(response.data?.message || 'Payment processing failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <TextField
                required
                id="name"
                label="Full Name"
                fullWidth
                autoComplete="name"
                defaultValue={user?.name || ''}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                id="phone"
                label="Phone Number"
                fullWidth
                autoComplete="tel"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="email"
                label="Email"
                fullWidth
                autoComplete="email"
                defaultValue={user?.email || ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="address"
                label="Billing Address"
                fullWidth
                autoComplete="street-address"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                id="cardNumber"
                label="Card number"
                fullWidth
                autoComplete="cc-number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                id="expDate"
                label="Expiry date"
                fullWidth
                autoComplete="cc-exp"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                id="cvv"
                label="CVV"
                fullWidth
                autoComplete="cc-csc"
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>
            <Typography variant="body1">
              Premium Membership: $99/month
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={2}>
              You will be charged $99 monthly. Cancel anytime.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Complete Your Subscription
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mt: 4, mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box mt={4}>
          {renderStepContent(activeStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          {activeStep !== 0 && (
            <Button onClick={handleBack} sx={{ mr: 1 }} disabled={loading}>
              Back
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading}
          >
            {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            {activeStep === steps.length - 1 ? 'Place Order' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Payment;