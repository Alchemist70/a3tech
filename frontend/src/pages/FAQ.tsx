import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Button,
} from '@mui/material';
import './sections.css';
import { ExpandMore, Search, Help, QuestionAnswer } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import api from '../api';

// AnimatedBox for framer-motion animations
const AnimatedBox = motion(Box);

function FAQ() {
  const MotionAccordion = motion(Accordion);
  // Handler for search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handler for category select
  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  // Handler for accordion expand/collapse
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  // Helper to get color for category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'primary';
      case 'collaboration': return 'secondary';
      case 'project': return 'success';
      case 'academic': return 'warning';
      default: return 'default';
    }
  };
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Fetch FAQs from backend on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/faq')
      .then(res => {
        let data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        // Support both {success, data} and array response
        if (Array.isArray(data)) {
          data = data.map((faq: any) => ({ ...faq, id: faq._id || faq.id }));
        }
        setFaqs(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load FAQs');
        setLoading(false);
      });
  }, []);

  // Always update filteredFaqs when faqs, searchTerm, or selectedCategory changes
  useEffect(() => {
    let filtered = faqs;
    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }
    setFilteredFaqs(filtered);
  }, [faqs, searchTerm, selectedCategory]);

const categories = [
  { value: 'all', label: 'All Questions' },
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'project', label: 'Projects' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'academic', label: 'Academic' },
];
  return (
    <Box className="section-bg-alt" style={{ paddingTop: 64, paddingBottom: 64, minHeight: '100vh' }}>
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs sx={{ mb: 4 }}>
            <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              Home
            </Link>
            <Typography color="text.primary">FAQ</Typography>
          </Breadcrumbs>
          {/* Header */}
          <AnimatedBox
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            sx={{ textAlign: 'center', mb: 6 }}
          >
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' } }}>
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 500, md: 600 }, mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, px: { xs: 2, sm: 0 } }}>
              Find answers to common questions about my research, projects, 
              and collaboration opportunities.
            </Typography>
          </AnimatedBox>
          {/* Search and Filter */}
          <AnimatedBox
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            sx={{ mb: 6 }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="faq-category-label">Category</InputLabel>
                  <Select
                    labelId="faq-category-label"
                    value={selectedCategory}
                    label="Category"
                    onChange={handleCategoryChange}
                  >
                    {categories.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </AnimatedBox>
          {/* Loading/Error/No Results/FAQ Accordions */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
          ) : filteredFaqs.length === 0 ? (
            <Alert severity="info" sx={{ mb: 4 }}>
              No FAQs found matching your criteria. Try adjusting your search or filter options.
            </Alert>
          ) : (
            <Box sx={{ mb: 6 }}>
              {filteredFaqs.map((faq, index) => (
                <MotionAccordion
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  // Use whileInView + viewport.once so the entry animation only
                  // runs the first time the item scrolls into view. This prevents
                  // the accordion list from re-animating (appearing to reload)
                  // when a user toggles an individual accordion.
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
                  expanded={expandedAccordion === `panel${faq.id}`}
                  onChange={handleAccordionChange(`panel${faq.id}`)}
                  sx={(theme) => ({
                    mb: 2,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    '&:before': {
                      display: 'none',
                    },
                  })}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={(theme) => ({
                      '& .MuiAccordionSummary-content': {
                        alignItems: 'center',
                      },
                      '& .MuiAccordionSummary-expandIconWrapper': {
                        color: theme.palette.text.secondary,
                      },
                    })}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <QuestionAnswer sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        {faq.question}
                      </Typography>
                      <Chip
                        label={categories.find((c: any) => c.value === faq.category)?.label || faq.category}
                        color={getCategoryColor(faq.category) as any}
                        size="small"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </MotionAccordion>
              ))}
            </Box>
          )}
          {/* Contact CTA */}
          <AnimatedBox
            initial={{ opacity: 0, y: 50 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card sx={(theme) => ({
              p: 4,
              textAlign: 'center',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(11, 94, 215, 0.8)' 
                : theme.palette.primary.main,
              color: 'white',
              border: theme.palette.mode === 'dark' 
                ? `1px solid ${theme.palette.primary.light}`
                : 'none',
            })}>
              <CardContent>
                <Help sx={{ fontSize: 48, mb: 2, color: 'white' }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                  Still Have Questions?
                </Typography>
                <Typography variant="body1" paragraph sx={{ mb: 3, maxWidth: 600, mx: 'auto', color: 'rgba(255, 255, 255, 0.9)' }}>
                  If you couldn't find the answer you're looking for, feel free to reach out. 
                  I'm always happy to discuss my research and potential collaborations.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/contact')}
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      fontWeight: 600,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        color: 'primary.dark',
                      },
                    }}
                  >
                    Contact Me
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/projects')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    View Projects
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </AnimatedBox>

        </Container>
      </Box>
  );
}
export default FAQ;
