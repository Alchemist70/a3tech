import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Signup: React.FC = () => {
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
  const navigate = useNavigate();


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

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 600 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Create an account</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* Required Fields */}
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, color: '#666' }}>
          Required Information
        </Typography>
        <TextField 
          label="Full name" 
          fullWidth 
          value={name} 
          onChange={e => setName(e.target.value)} 
          sx={{ mb: 2 }}
          required
        />
        <TextField 
          label="Email" 
          type="email"
          fullWidth 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          sx={{ mb: 2 }}
          required
        />
        <TextField 
          label="Password" 
          type="password" 
          fullWidth 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          sx={{ mb: 3 }}
          required
        />

        {/* Educational Information */}
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, color: '#666' }}>
          Educational Information
        </Typography>
        <TextField 
          label="School/Institution Name *" 
          fullWidth 
          value={schoolName} 
          onChange={e => setSchoolName(e.target.value)} 
          sx={{ mb: 2 }}
          placeholder="e.g., Harvard University"
          required
        />
        <TextField 
          label="School/Institution Email" 
          type="email"
          fullWidth 
          value={schoolEmail} 
          onChange={e => setSchoolEmail(e.target.value)} 
          sx={{ mb: 2 }}
          placeholder="e.g., student@university.edu"
        />
        
        <FormControl sx={{ mb: 2, width: '100%' }} size="small" required>
          <InputLabel>Education Level *</InputLabel>
          <Select
            value={educationLevel}
            label="Education Level *"
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

        <FormControl sx={{ mb: 3, width: '100%' }} size="small" required>
          <InputLabel>Purpose *</InputLabel>
          <Select
            value={purpose}
            label="Purpose *"
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
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600, color: '#666' }}>
          Location Information
        </Typography>
        <TextField 
          label="Address *" 
          fullWidth 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          sx={{ mb: 2 }}
          placeholder="Street address"
          required
        />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <TextField 
            label="City *" 
            value={city} 
            onChange={e => setCity(e.target.value)} 
            placeholder="City"
            required
          />
          <TextField 
            label="Country *" 
            value={country} 
            onChange={e => setCountry(e.target.value)} 
            placeholder="Country"
            required
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={submit} 
            disabled={loading}
            size="large"
          >
            {loading ? 'Creating...' : 'Create account'}
          </Button>
          <Button variant="text" onClick={() => navigate('/login')}>Already have an account?</Button>
        </Box>
      </Paper>

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
          <Button variant="contained" onClick={() => { setSuccessOpen(false); navigate('/login'); }} fullWidth>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Signup;
