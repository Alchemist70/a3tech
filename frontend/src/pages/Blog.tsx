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
  Breadcrumbs,
  Link,
} from '@mui/material';
import { useVisitTracker } from '../hooks/useVisitTracker';
import './sections.css';
import { Search, FilterList, Article, CalendarToday, Person, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';

import api from '../api';

const blogPostsData: any[] = [];
// ...existing code...

const categories = [
  { value: 'all', label: 'All Posts' },
  { value: 'technical', label: 'Technical' },
  { value: 'research', label: 'Research' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'insights', label: 'Insights' },
  { value: 'news', label: 'News' },
];

const AnimatedBox = motion(Box);
const AnimatedCard = motion(Card);

const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState<any[]>(blogPostsData);
  const [filteredPosts, setFilteredPosts] = useState<any[]>(blogPostsData);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [error, setError] = useState<string | null>(null);
  
  // Track page visit
  useVisitTracker();
  // Fetch blog posts from backend
  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/blog')
      .then(res => {
        if (res.data && res.data.success) {
          setPosts(res.data.data);
        } else {
          setError('Failed to fetch blog posts.');
        }
      })
      .catch(() => setError('Failed to fetch blog posts.'))
      .finally(() => setLoading(false));
  }, []);

  const postsPerPage = 6;

  // Filter posts based on search term and category
  useEffect(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
  post.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    setFilteredPosts(filtered);
    setCurrentPage(1);
  }, [posts, searchTerm, selectedCategory]);

  // Handle URL parameters
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginatedPosts = () => {
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return filteredPosts.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Box className="section-bg" style={{ paddingTop: 64, paddingBottom: 64, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Home
          </Link>
          <Typography color="text.primary">Blog</Typography>
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
            Research Blog
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: { xs: '100%', sm: 500, md: 600 }, mx: 'auto', fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, px: { xs: 2, sm: 0 } }}>
            Insights, tutorials, and technical deep dives into AI research, 
            machine learning, and their real-world applications.
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
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
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
                  sx={{
                    borderRadius: 2,
                  }}
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
                {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
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
        {!loading && !error && filteredPosts.length === 0 && (
          <Alert severity="info" sx={{ mb: 4 }}>
            No blog posts found matching your criteria. Try adjusting your search or filter options.
          </Alert>
        )}

        {/* Blog Posts Grid */}
        {!loading && filteredPosts.length > 0 && (
          <Grid container spacing={4}>
            {getPaginatedPosts().map((post, index) => (
              <Grid item xs={12} md={6} key={post.id}>
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
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      backgroundColor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <Box sx={{ textAlign: 'center' }}>
                        <Article sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.secondary">
                          {post.title}
                        </Typography>
                      </Box>
                    )}
                    <Chip
                      label={categories.find(c => c.value === post.category)?.label || post.category}
                      size="small"
                      sx={(theme) => ({
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(30, 41, 59, 0.9)' 
                          : 'rgba(255, 255, 255, 0.95)',
                        color: theme.palette.mode === 'dark' 
                          ? theme.palette.primary.light 
                          : theme.palette.primary.main,
                        fontWeight: 600,
                        border: theme.palette.mode === 'dark'
                          ? `1px solid ${theme.palette.primary.light}`
                          : `1px solid ${theme.palette.primary.main}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      })}
                    />
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 2 }}>
                      {post.excerpt}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {post.tags.slice(0, 3).map((tag: string) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {post.tags.length > 3 && (
                        <Chip
                          label={`+${post.tags.length - 3}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {post.author}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(post.publishedAt)}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {post.views}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {post.readTime} min read
                        </Typography>
                      </Box>
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

export default Blog;
