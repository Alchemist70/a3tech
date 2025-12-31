import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useVisitTracker } from '../hooks/useVisitTracker';
import './sections.css';
import { Search, FilterList } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';


import api from '../api';

const projectsData: any[] = [];

// Default fallback categories (kept for graceful fallback if API is unavailable)
const defaultCategories = [
  { value: 'all', label: 'All Projects' },
  { value: 'federated-learning', label: 'Federated Learning' },
  { value: 'biomarker-discovery', label: 'Biomarker Discovery' },
  { value: 'automotive-security', label: 'Automotive Security' },
  { value: 'ai-ml', label: 'AI & Machine Learning' },
];

const AnimatedBox = motion(Box);
const AnimatedCard = motion(Card);

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<any[]>(projectsData);
  const [filteredProjects, setFilteredProjects] = useState<any[]>(projectsData);
  const [categories, setCategories] = useState<{ value: string; label: string; order?: number }[]>(defaultCategories);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Track page visit
  useVisitTracker();

  // Initial fetch projects on component mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/projects')
      .then(res => {
        if (res.data && res.data.success) {
          const payload = res.data.projects ?? res.data.data ?? [];
          setProjects(Array.isArray(payload) ? payload : []);
        } else {
          setError('Failed to fetch projects.');
        }
      })
      .catch(() => setError('Failed to fetch projects.'))
      .finally(() => setLoading(false));
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const projectsPerPage = 6;

  // Filter projects based on search term and category
  useEffect(() => {
    let filtered = projects || [];

    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project?.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (Array.isArray(project?.tags) ? project.tags.some((tag: string) => (tag || '').toLowerCase().includes(searchTerm.toLowerCase())) : false)
      );
    }

    if (selectedCategory !== 'all') {
      // Compare categories by tokens so 'automotive' matches 'automotive-security'
      const normalize = (s: any) => String(s || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
      const tokensOf = (s: any) => new Set(normalize(s).split(/\s+/).filter(Boolean));
      const selectedTokens = tokensOf(selectedCategory);
      filtered = filtered.filter((project) => {
        const projectTokens = tokensOf(project?.category);
        if (projectTokens.size === 0 || selectedTokens.size === 0) return false;
        // match if one set is a subset of the other (e.g., 'automotive' subset of 'automotive security')
        const projectIsSubset = Array.from(projectTokens).every(t => selectedTokens.has(t));
        const selectedIsSubset = Array.from(selectedTokens).every(t => projectTokens.has(t));
        return projectIsSubset || selectedIsSubset;
      });
    }

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchTerm, selectedCategory]);

  // Handle URL parameters
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // Fetch research areas to populate the Category select (use admin-managed list)
  useEffect(() => {
    let mounted = true;
    const fetchAreas = async () => {
      try {
        const res = await api.get('/research-areas');
        let data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (!Array.isArray(data)) data = [];
        const areas = data
          .map((d: any) => {
            const title = typeof d === 'string' ? d : (d.title || d.name || '');
            const order = typeof d === 'object' && typeof d.order === 'number' ? d.order : undefined;
            const value = String(title).toLowerCase().replace(/\s+/g, '-');
            return { title, value, order };
          })
          .filter((a: any) => a.title);

        // Sort: explicit numeric order first, otherwise alphabetical by title
        areas.sort((a: any, b: any) => {
          const ao = typeof a.order === 'number' ? a.order : null;
          const bo = typeof b.order === 'number' ? b.order : null;
          if (ao !== null && bo !== null) {
            if (ao !== bo) return ao - bo;
          } else if (ao !== null) {
            return -1;
          } else if (bo !== null) {
            return 1;
          }
          return String(a.title).localeCompare(String(b.title), undefined, { sensitivity: 'base' });
        });

        const mapped = [{ value: 'all', label: 'All Projects' }, ...areas.map((a: any) => ({ value: a.value, label: a.title, order: a.order }))];
        if (mounted) setCategories(mapped);
      } catch (err) {
        // keep defaultCategories on error
      }
    };
    fetchAreas();
    return () => { mounted = false; };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  // No server fetch on search/category change - we filter client-side instead
  // This avoids double-fetching and improves performance

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginatedProjects = () => {
    const startIndex = (currentPage - 1) * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    return (filteredProjects || []).slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(((filteredProjects && filteredProjects.length) || 0) / projectsPerPage);

  return (
    <Box className="section-bg-alt" style={{ paddingTop: 64, paddingBottom: 64, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <AnimatedBox
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          sx={{ textAlign: 'center', mb: 6 }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' } }}>
            Research Projects
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 500, md: 600 }, mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, px: { xs: 2, sm: 0 } }}>
            Explore our cutting-edge research in artificial intelligence, machine learning, 
            and their applications across various domains.
          </Typography>
        </AnimatedBox>

        {/* Search and Filter */}
        <AnimatedBox
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          sx={{ mb: 4 }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search projects..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={(theme) => ({
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.palette.mode === 'light' ? '0 2px 6px rgba(16,24,40,0.04)' : '0 2px 6px rgba(2,6,23,0.6)',
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Category"
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                  sx={(theme) => ({
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.background.paper,
                      },
                    })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      {category.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
              </Typography>
            </Grid>
          </Grid>
        </AnimatedBox>


        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        )}
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {/* No Results */}
        {!loading && !error && filteredProjects.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            No projects found matching your criteria. Try adjusting your search or filter options.
          </Alert>
        )}

        {/* Projects Grid */}
        {!loading && filteredProjects.length > 0 && (
          <Grid container spacing={4}>
            {getPaginatedProjects().map((project, index) => (
              <Grid item xs={12} md={6} lg={4} key={project?._id ?? index}>
                <AnimatedCard
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    },
                  }}
                  onClick={() => navigate(`/projects/${encodeURIComponent(String(project?._id ?? project?.id ?? index))}`)}
                >
                  <CardMedia
                    component="div"
                    sx={(theme) => ({
                      height: { xs: 180, sm: 200, md: 220 },
                      backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.background.paper,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      '& img': {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      },
                    })}
                  >
                    {Array.isArray(project?.media?.images) && project.media.images[0] ? (
                      <img
                        src={project.media.images[0]}
                        alt={project.title}
                        loading="lazy"
                      />
                    ) : (
                      <Typography variant="h6" color="text.secondary">
                        {project.title}
                      </Typography>
                    )}
                    {project?.featured && (
                      <Chip
                        label="Featured"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
                          borderRadius: 1,
                          px: 1,
                        }}
                      />
                    )}
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', maxHeight: 340, overflowY: 'auto' }}>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={(() => {
                          const normalize = (s: any) => String(s || '').toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
                          const tokensOf = (s: any) => new Set(normalize(s).split(/\s+/).filter(Boolean));
                          const projectTokens = tokensOf(project?.category);
                          const found = categories.find(cat => {
                            const catTokens = tokensOf(cat.value);
                            if (catTokens.size === 0 || projectTokens.size === 0) return false;
                            return (Array.from(catTokens).every(t => projectTokens.has(t)) || Array.from(projectTokens).every(t => catTokens.has(t)));
                          });
                          return found?.label || project?.category || '';
                        })()}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {project?.title}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      {project?.subtitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                      {project?.description}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(Array.isArray(project?.tags) ? project.tags : []).map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </AnimatedCard>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Projects;
