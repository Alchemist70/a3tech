import api from '../api';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import './sections.css';
import {
  Email,
  LocationOn,
  Send,
  CheckCircle,
  Message,
  Business,
  School,
  Work,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import React, { useState } from 'react';

const AnimatedBox = motion(Box);

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    subject: '',
    message: '',
    type: 'general',
  });
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const contactTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'collaboration', label: 'Research Collaboration' },
    { value: 'recruitment', label: 'Recruitment Opportunity' },
    { value: 'academic', label: 'Academic Discussion' },
    { value: 'technical', label: 'Technical Question' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({
      ...prev,
      type: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  setSnackbarMessage('');
  setSnackbarSeverity('success');
    try {
      const res = await api.post('/contact', formData);
      if (res.data && res.data.success) {
        setSnackbarMessage('Message sent successfully! I\'ll get back to you soon.');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setFormData({
          name: '',
          email: '',
          organization: '',
          role: '',
          subject: '',
          message: '',
          type: 'general',
        });
      } else {
        setSnackbarMessage(res.data?.message || 'Failed to send message. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      setSnackbarMessage(error?.response?.data?.message || 'Failed to send message. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box className="section-bg" style={{ paddingTop: 64, paddingBottom: 64, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <AnimatedBox
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center', mb: 8 }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' } }}>
            Get In Touch
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 500, md: 600 }, mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, px: { xs: 2, sm: 0 } }}>
            I'm always interested in discussing research opportunities, collaborations, 
            or any questions about my work. Let's connect!
          </Typography>
        </AnimatedBox>

        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <AnimatedBox
              initial={{ opacity: 0, x: -50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                    Send me a message
                  </Typography>
                  
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleInputChange}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Role/Position"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Inquiry Type</InputLabel>
                          <Select
                            value={formData.type}
                            onChange={handleSelectChange}
                            label="Inquiry Type"
                          >
                            {contactTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          multiline
                          rows={6}
                          variant="outlined"
                          placeholder="Tell me about your inquiry, collaboration idea, or any questions you have..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          startIcon={loading ? <CheckCircle /> : <Send />}
                          sx={{ minWidth: 150 }}
                        >
                          {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <AnimatedBox
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Contact Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Email color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary="aabdulha@gitam.in"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Location"
                        secondary="Bengaluru, India"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Institution"
                        secondary="GITAM University"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Work color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Lab"
                        secondary="SDV-MURTI Lab"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Response Time
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    I typically respond to messages within 24-48 hours. For urgent matters, 
                    please mention it in your message subject line.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="General Inquiries"
                        secondary="24-48 hours"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Research Collaboration"
                        secondary="1-3 days"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Technical Questions"
                        secondary="2-5 days"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    What I'm Looking For
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Message color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Research Collaborations"
                        secondary="Joint projects and publications"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Industry Opportunities"
                        secondary="AI/ML engineering roles"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <School color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Academic Discussions"
                        secondary="Conference presentations"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Work color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Internship Programs"
                        secondary="Research internships"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>
        </Grid>

        {/* Additional Information */}
        <AnimatedBox
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          sx={{ mt: 8 }}
        >
          <Paper sx={{ p: 4, backgroundColor: 'primary.main', color: 'white' }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, textAlign: 'center' }}>
              Let's Build Something Amazing Together
            </Typography>
            <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
              Whether you're interested in collaborating on research, discussing AI applications, 
              or exploring career opportunities, I'm always excited to connect with like-minded 
              individuals who share a passion for advancing technology for the betterment of society.
            </Typography>
          </Paper>
        </AnimatedBox>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Contact;
