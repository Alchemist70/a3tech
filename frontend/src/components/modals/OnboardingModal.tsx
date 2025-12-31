import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Educational Profile
  const [schoolName, setSchoolName] = useState(user?.schoolName || '');
  const [schoolEmail, setSchoolEmail] = useState(user?.schoolEmail || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || '');
  const [purpose, setPurpose] = useState(user?.purpose || '');

  // Location
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');

  const handleSave = async () => {
    if (!schoolName || !educationLevel || !purpose || !address || !city || !country) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.patch('/users/profile', {
        schoolName,
        schoolEmail,
        educationLevel,
        purpose,
        address,
        city,
        country,
      });

      // Update auth context with new user data
      if (response.data?.data) {
        updateUser(response.data.data);
      }

      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} maxWidth="sm" fullWidth disableEscapeKeyDown>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.3rem' }}>
        Complete Your Profile
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Help us personalize your experience by sharing a bit about yourself. You can update these details later.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Educational Profile */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
            Educational Profile
          </Typography>

          <TextField
            label="School/Institution Name"
            fullWidth
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="e.g., Harvard University"
            size="small"
            required
          />

          <TextField
            label="School/Institution Email"
            type="email"
            fullWidth
            value={schoolEmail}
            onChange={(e) => setSchoolEmail(e.target.value)}
            placeholder="e.g., student@university.edu"
            size="small"
          />

          <FormControl size="small" fullWidth required>
            <InputLabel>Education Level</InputLabel>
            <Select
              value={educationLevel}
              label="Education Level"
              onChange={(e) => setEducationLevel(e.target.value)}
            >
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
              <MenuItem value="research">Research</MenuItem>
              <MenuItem value="learning">Learning</MenuItem>
              <MenuItem value="professional">Professional</MenuItem>
              <MenuItem value="hobby">Hobby</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Location */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 2 }}>
            Location
          </Typography>

          <TextField
            label="Address"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            size="small"
            required
          />

          <TextField
            label="City"
            fullWidth
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            size="small"
            required
          />

          <TextField
            label="Country"
            fullWidth
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            size="small"
            required
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="text" onClick={onClose} disabled={loading}>
          Skip for Now
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingModal;
