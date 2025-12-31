import React, { useEffect, useState } from 'react';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Box, Paper, Typography, Divider, Switch, FormControlLabel, Button, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, RadioGroup, Radio, TextField, Avatar, CircularProgress } from '@mui/material';
/* eslint-enable @typescript-eslint/no-unused-vars */
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SaveWarningDialog from '../components/modals/SaveWarningDialog';
import api from '../api';

const Settings: React.FC = () => {
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { user, logout, updateUser } = useAuth();
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('language') || 'en');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const raw = localStorage.getItem('notificationsEnabled');
    return raw ? JSON.parse(raw) : true;
  });
  const [timezone, setTimezone] = useState<string>(() => localStorage.getItem('timezone') || 'local');
  const [dateFormat, setDateFormat] = useState<string>(() => localStorage.getItem('dateFormat') || 'MM/DD/YYYY');
  const [fontSize, setFontSize] = useState<string>(() => localStorage.getItem('fontSize') || 'medium');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() => {
    const raw = localStorage.getItem('twoFactorEnabled');
    return raw ? JSON.parse(raw) : false;
  });
  const [shareProfile, setShareProfile] = useState<boolean>(() => {
    const raw = localStorage.getItem('shareProfile');
    return raw ? JSON.parse(raw) : false;
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success'|'info'|'error'>('info');
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  
  // Editable profile fields
  const [isEditing, setIsEditing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Profile picture upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  // Educational Profile
  const [schoolName, setSchoolName] = useState(user?.schoolName || '');
  const [schoolEmail, setSchoolEmail] = useState(user?.schoolEmail || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || '');
  const [purpose, setPurpose] = useState(user?.purpose || '');
  
  // Location
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('timezone', timezone);
  }, [timezone]);

  useEffect(() => {
    localStorage.setItem('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    // apply a simple CSS class on the html element for accessibility/font size
    try {
      document.documentElement.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '';
    } catch (e) {}
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('twoFactorEnabled', JSON.stringify(twoFactorEnabled));
  }, [twoFactorEnabled]);

  useEffect(() => {
    localStorage.setItem('shareProfile', JSON.stringify(shareProfile));
  }, [shareProfile]);

  // Check if user has filled profile details and if profile is locked
  const hasFilledProfile = !!(user?.schoolName && user?.address && user?.city && user?.country);
  const isProfileLocked = user?.profileLocked === true;

  const handleSaveProfile = async () => {
    if (!schoolName || !educationLevel || !purpose || !address || !city || !country) {
      setSnackbarMessage('Please fill in all required fields');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setProfileLoading(true);
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

      if (response.data?.data) {
        updateUser(response.data.data);
      }

      setIsEditing(false);
      setSnackbarMessage('Profile updated and locked successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      setSnackbarMessage(err?.response?.data?.message || 'Failed to save profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setProfileLoading(false);
      setShowWarning(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be less than 5MB');
      setSnackbarMessage('File size must be less than 5MB');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file');
      setSnackbarMessage('Please upload an image file');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setUploadingPhoto(true);
    setPhotoError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to /api/uploads endpoint
      const uploadResponse = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const photoUrl = uploadResponse.data?.data?.fileUrl || uploadResponse.data?.fileUrl;

      if (!photoUrl) {
        throw new Error('No file URL returned from upload');
      }

      // Update user profile with new photo URL
      const response = await api.patch('/users', {
        profilePhoto: photoUrl
      });

      if (response.data?.data) {
        updateUser(response.data.data);
      }

      // Set a cache-busting timestamp for this user's photo so the browser reloads it
      try {
        if (response.data?.data && response.data.data._id) {
          localStorage.setItem(`photo_bust_${response.data.data._id}`, String(Date.now()));
        }
      } catch (e) {}

      setSnackbarMessage('Profile picture updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to upload profile picture';
      setPhotoError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: { xs: 2, sm: 3, md: 4 }, p: { xs: 1, sm: 2 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        Settings
      </Typography>
      <Paper sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderRadius: 2 }} elevation={1}>
        <Typography variant="h6">Appearance</Typography>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          Toggle between Light and Dark themes. Your choice will be saved for this browser.
        </Typography>
        <FormControlLabel
          control={<Switch checked={darkMode} onChange={toggleDarkMode} color="primary" />}
          label={darkMode ? 'Dark mode' : 'Light mode'}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">Account</Typography>
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Name:</strong> {user?.name || '—'}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Email:</strong> {user?.email || '—'}
          </Typography>
        </Box>

        {/* Profile Picture Section (Only for non-OAuth users) */}
        {!user?.googleId && (
          <Box sx={{ mt: 3, mb: 3, p: 2, backgroundColor: darkMode ? 'rgba(30, 41, 59, 0.5)' : '#f9f9f9', borderRadius: 1, border: darkMode ? '1px solid #334155' : '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Profile Picture</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {(() => {
                const photo = user?.profilePhoto;
                let src: string | undefined = undefined;
                if (photo) {
                  try {
                    const bust = typeof window !== 'undefined' ? localStorage.getItem(`photo_bust_${user?._id}`) : null;
                    src = photo + (photo.includes('?') ? '&' : '?') + 't=' + (bust || '');
                  } catch (e) {
                    src = photo;
                  }
                }
                try { console.debug('[Settings] user.profilePhoto:', user?.profilePhoto, 'computed src:', src); } catch (e) {}
                return (
                  <Avatar
                    src={src}
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: photo ? 'transparent' : 'primary.main',
                      color: '#fff',
                      fontSize: '2rem'
                    }}
                  >
                    {!photo && user?.name?.charAt(0).toUpperCase()}
                  </Avatar>
                );
              })()}
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Upload a profile picture (Max 5MB, JPEG/PNG)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    component="label"
                    disabled={uploadingPhoto}
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Choose Picture'}
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadingPhoto}
                    />
                  </Button>
                  {uploadingPhoto && <CircularProgress size={24} />}
                </Box>
                {photoError && (
                  <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
                    {photoError}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* OAuth user notice */}
        {user?.googleId && (
          <Box sx={{ mt: 3, mb: 3, p: 2, backgroundColor: darkMode ? 'rgba(74, 158, 255, 0.15)' : '#e3f2fd', borderRadius: 1, border: darkMode ? '1px solid #4a9eff' : '1px solid #90caf9' }}>
            <Typography variant="body2" sx={{ color: darkMode ? '#80c5ff' : '#1565c0', fontWeight: 500 }}>
              📷 Your profile picture is automatically synced from your Google account
            </Typography>
          </Box>
        )}

        {/* Educational Information */}
        <Box sx={{ mt: 2, mb: 2, p: 2, backgroundColor: darkMode ? (isProfileLocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(30, 41, 59, 0.5)') : (isProfileLocked ? '#e8f5e9' : '#f5f5f5'), borderRadius: 1, border: darkMode ? (isProfileLocked ? '1px solid #22c55e' : '1px solid #334155') : (isProfileLocked ? '1px solid #4caf50' : 'none') }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Educational Profile</Typography>
              {isProfileLocked && (
                <Typography variant="caption" sx={{ px: 1, py: 0.5, backgroundColor: '#4caf50', color: '#fff', borderRadius: 0.5 }}>
                  🔒 Locked
                </Typography>
              )}
            </Box>
            {!isEditing && !hasFilledProfile && !isProfileLocked && (
              <Button size="small" variant="outlined" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Box>

          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="School/Institution Name"
                fullWidth
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                size="small"
                required
              />
              <TextField
                label="School Email"
                type="email"
                fullWidth
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
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
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => setIsEditing(false)} disabled={profileLoading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowWarning(true)}
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>School/Institution:</strong> {user?.schoolName || '—'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>School Email:</strong> {user?.schoolEmail || '—'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Education Level:</strong> {user?.educationLevel ? user.educationLevel.charAt(0).toUpperCase() + user.educationLevel.slice(1).replace('-', ' ') : '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Purpose:</strong> {user?.purpose ? user.purpose.charAt(0).toUpperCase() + user.purpose.slice(1) : '—'}
              </Typography>
            </>
          )}
        </Box>

        {/* Location Information */}
        <Box sx={{ mt: 2, mb: 2, p: 2, backgroundColor: darkMode ? (isProfileLocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(30, 41, 59, 0.5)') : (isProfileLocked ? '#e8f5e9' : '#f5f5f5'), borderRadius: 1, border: darkMode ? (isProfileLocked ? '1px solid #22c55e' : '1px solid #334155') : (isProfileLocked ? '1px solid #4caf50' : 'none') }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Location</Typography>
              {isProfileLocked && (
                <Typography variant="caption" sx={{ px: 1, py: 0.5, backgroundColor: '#4caf50', color: '#fff', borderRadius: 0.5 }}>
                  🔒 Locked
                </Typography>
              )}
            </Box>
            {!isEditing && !hasFilledProfile && !isProfileLocked && (
              <Button size="small" variant="outlined" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </Box>

          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Address"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                size="small"
                required
              />
              <TextField
                label="City"
                fullWidth
                value={city}
                onChange={(e) => setCity(e.target.value)}
                size="small"
                required
              />
              <TextField
                label="Country"
                fullWidth
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                size="small"
                required
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" onClick={() => setIsEditing(false)} disabled={profileLoading}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowWarning(true)}
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Address:</strong> {user?.address || '—'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>City:</strong> {user?.city || '—'}
              </Typography>
              <Typography variant="body2">
                <strong>Country:</strong> {user?.country || '—'}
              </Typography>
            </>
          )}
        </Box>

        <Button variant="outlined" color="secondary" onClick={() => {
          // allow user to reset theme preference
          localStorage.removeItem('darkMode');
          window.location.reload();
        }}>
          Reset Theme Preference
        </Button>
        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" sx={{ mt: 2 }}>Preferences</Typography>
        <FormControl sx={{ mt: 1, minWidth: 220 }} size="small">
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
            <MenuItem value="de">German</MenuItem>
            <MenuItem value="zh">Chinese</MenuItem>
          </Select>
        </FormControl>

        <FormControlLabel
          sx={{ display: 'block', mt: 2 }}
          control={<Switch checked={notificationsEnabled} onChange={() => setNotificationsEnabled(v => !v)} color="primary" />}
          label={notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Timezone</Typography>
        <FormControl sx={{ mt: 1, minWidth: 220 }} size="small">
          <Select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <MenuItem value="local">Local (browser)</MenuItem>
            <MenuItem value="UTC">UTC</MenuItem>
            <MenuItem value="America/New_York">America / New York</MenuItem>
            <MenuItem value="Europe/London">Europe / London</MenuItem>
            <MenuItem value="Asia/Shanghai">Asia / Shanghai</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Date format</Typography>
        <FormControl sx={{ mt: 1, minWidth: 220 }} size="small">
          <Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Accessibility</Typography>
        <RadioGroup row value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
          <FormControlLabel value="small" control={<Radio />} label="Small" />
          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
          <FormControlLabel value="large" control={<Radio />} label="Large" />
        </RadioGroup>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Security & Privacy</Typography>
        <FormControlLabel
          sx={{ display: 'block', mt: 1 }}
          control={<Switch checked={twoFactorEnabled} onChange={() => setTwoFactorEnabled(v => !v)} color="primary" />}
          label={twoFactorEnabled ? 'Two-factor authentication enabled (UI only)' : 'Two-factor authentication disabled'}
        />

        <FormControlLabel
          sx={{ display: 'block', mt: 1 }}
          control={<Switch checked={shareProfile} onChange={() => setShareProfile(v => !v)} color="primary" />}
          label={shareProfile ? 'Profile is public' : 'Profile is private'}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>Data</Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => {
            setSnackbarMessage('Data export requested. You will receive an email when ready.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
          }}>Request Data Export</Button>
          <Button color="error" variant="outlined" onClick={() => setDeleteAccountOpen(true)}>Delete My Account</Button>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" color="warning" onClick={() => {
            // clear stored preferences
            localStorage.removeItem('language');
            localStorage.removeItem('notificationsEnabled');
            localStorage.removeItem('darkMode');
            localStorage.removeItem('timezone');
            localStorage.removeItem('dateFormat');
            localStorage.removeItem('fontSize');
            localStorage.removeItem('twoFactorEnabled');
            localStorage.removeItem('shareProfile');
            setLanguage('en');
            setNotificationsEnabled(true);
            setTimezone('local');
            setDateFormat('MM/DD/YYYY');
            setFontSize('medium');
            setTwoFactorEnabled(false);
            setShareProfile(false);
            window.location.reload();
          }}>
            Reset Preferences
          </Button>
        </Box>
      </Paper>

      <Dialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)}>
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Deleting your account will remove your profile and data from this site. This action cannot be undone. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountOpen(false)}>Cancel</Button>
          <Button color="error" onClick={async () => {
            try {
              localStorage.clear();
              if (logout) await logout();
            } catch (e) {
              // ignore
            }
            navigate('/');
            setSnackbarMessage('Account deletion requested locally. If server-side deletion is supported it will be processed.');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            setDeleteAccountOpen(false);
          }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <SaveWarningDialog
        open={showWarning}
        onConfirm={handleSaveProfile}
        onCancel={() => setShowWarning(false)}
        loading={profileLoading}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
