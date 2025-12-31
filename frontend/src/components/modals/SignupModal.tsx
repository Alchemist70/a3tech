import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, TextField, Button, Alert, FormControl, InputLabel, Select, MenuItem, Box, Typography, Divider } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import api from '../../api';
import { useAuthModal } from '../../contexts/AuthModalContext';
import API_BASE_URL from '../../config/api';

const SignupModal: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [purpose, setPurpose] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const { signupOpen, closeSignup, switchToLogin } = useAuthModal();

  const submit = async () => {
    setError(null);
    if (!name || !email || !password || !schoolName || !educationLevel || !purpose || !address || !city || !country) {
      setError('Please fill in all required fields (School Email is optional)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name,
        email,
        password,
        schoolName,
        schoolEmail,
        educationLevel,
        purpose,
        address,
        city,
        country
      });
      setLoading(false);
      setSuccessOpen(true);
    } catch (err: any) {
      setLoading(false);
      setError(err?.response?.data?.message || 'Registration failed');
    }
  };

  const handleClose = () => {
    if (!loading) {
      closeSignup();
      setError(null);
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setSchoolName('');
      setSchoolEmail('');
      setEducationLevel('');
      setPurpose('');
      setAddress('');
      setCity('');
      setCountry('');
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    handleClose();
    switchToLogin();
  };

  return (
    <>
      <Dialog open={signupOpen && !successOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
          Create an account
          <IconButton onClick={handleClose} size="small" disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, maxHeight: '60vh', overflowY: 'auto' }}>
            {/* Required Fields */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                Required Information
              </Typography>
              <TextField
                label="Full name"
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
                size="small"
                required
              />
            </Box>

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={e => setEmail(e.target.value)}
              size="small"
              required
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={e => setPassword(e.target.value)}
              size="small"
              required
            />

            {/* Educational Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                Educational Information
              </Typography>
              <TextField
                label="School/Institution Name"
                fullWidth
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                size="small"
                placeholder="e.g., Harvard University"
                required
              />
            </Box>

            <TextField
              label="School/Institution Email"
              type="email"
              fullWidth
              value={schoolEmail}
              onChange={e => setSchoolEmail(e.target.value)}
              size="small"
              placeholder="e.g., student@university.edu"
            />

            <FormControl size="small" fullWidth required>
              <InputLabel>Education Level</InputLabel>
              <Select
                value={educationLevel}
                label="Education Level"
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <MenuItem value="">Select education level</MenuItem>
                <MenuItem value="high-school">High School</MenuItem>
                <MenuItem value="associate">Associate Degree</MenuItem>
                <MenuItem value="bachelor">Bachelor's Degree</MenuItem>
                <MenuItem value="master">Master's Degree</MenuItem>
                <MenuItem value="phd">PhD</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth required>
              <InputLabel>Purpose</InputLabel>
              <Select
                value={purpose}
                label="Purpose"
                onChange={(e) => setPurpose(e.target.value)}
              >
                <MenuItem value="">Select primary purpose</MenuItem>
                <MenuItem value="research">Research</MenuItem>
                <MenuItem value="learning">Learning</MenuItem>
                <MenuItem value="professional">Professional Development</MenuItem>
                <MenuItem value="hobby">Hobby/Personal Interest</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Location Information */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                Location Information
              </Typography>
              <TextField
                label="Address"
                fullWidth
                value={address}
                onChange={e => setAddress(e.target.value)}
                size="small"
                placeholder="Street address"
                required
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="City"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City"
                size="small"
                required
              />
              <TextField
                label="Country"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="Country"
                size="small"
                required
              />
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ px: 2, py: 2 }}>
          <Divider sx={{ my: 1, mb: 2 }}>OR</Divider>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              // Redirect to Google OAuth endpoint
              window.location.href = `${API_BASE_URL}/auth/google`;
            }}
            sx={{ mb: 2, textTransform: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
            disabled={loading}
            startIcon={<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ height: '20px', width: '20px' }} />}
          >
            Sign up with Google
          </Button>
        </Box>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button variant="text" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </Button>
        </DialogActions>
        <Box sx={{ px: 2, pb: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Button
              variant="text"
              size="small"
              onClick={switchToLogin}
              sx={{ textTransform: 'none', fontSize: 'inherit' }}
            >
              Sign in
            </Button>
          </Typography>
        </Box>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onClose={() => {}} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.3rem', color: '#2e7d32' }}>
          ✓ Registration Successful
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2, mb: 2, fontSize: '1rem' }}>
            <strong>Welcome!</strong> Your account has been created successfully.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            Please click OK below to proceed to the sign-in page.
          </DialogContentText>
          <DialogContentText sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
            You can now log in with your email and password to access the platform and start using Einstein, our AI assistant.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={handleSuccessClose} fullWidth>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignupModal;
