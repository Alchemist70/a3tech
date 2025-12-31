
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Avatar, Button, Breadcrumbs, Link, IconButton, Alert, Grid, List, ListItem, ListItemText } from '@mui/material';
import { ArrowBack, CalendarToday, Visibility, Tag, Share as ShareIcon, Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useInView } from 'framer-motion';
import api from '../api';

const AnimatedBox = React.forwardRef((props: any, ref: any) => (
  <Box ref={ref} {...props} />
));

interface BlogPostType {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  category: string;
  featuredImage: string;
  publishedAt: string;
  views: number;
  readTime: number;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/blog/${slug}`);
        setPost(res.data);
      } catch (err) {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchPost();
  }, [slug]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast notification here
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    // You could save to localStorage or send to API here
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  // Fallbacks for missing post fields
  const safePost = {
    title: post?.title || 'Untitled Blog Post',
    excerpt: post?.excerpt || '',
    author: post?.author || 'Unknown Author',
    publishedAt: post?.publishedAt || '',
    views: typeof post?.views === 'number' ? post.views : 0,
    readTime: typeof post?.readTime === 'number' ? post.readTime : '',
    category: post?.category || '',
  tags: post && Array.isArray(post.tags) ? post.tags : [],
    content: post?.content || '',
    featuredImage: post?.featuredImage || '',
    slug: post?.slug || '',
    _id: post?._id || '',
  };

  if (!post) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          Blog post not found. Please check the URL or return to the blog.
        </Alert>
        <Button onClick={() => navigate('/blog')} sx={{ mt: 2 }}>
          Back to Blog
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ py: 8, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Home
          </Link>
          <Link color="inherit" href="/blog" onClick={(e) => { e.preventDefault(); navigate('/blog'); }}>
            Blog
          </Link>
          <Typography color="text.primary">{safePost.title}</Typography>
        </Breadcrumbs>

        {/* Back Button */}
        <Button onClick={() => navigate('/blog')} sx={{ mb: 4 }}>
          <ArrowBack sx={{ mr: 1 }} />
          Back to Blog
        </Button>

        {/* Article Header */}
        <AnimatedBox
          ref={ref}
          initial={{ opacity: 0, y: 50 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          sx={{ mb: 6 }}
        >
          <Card sx={{ p: 4 }}>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Chip
                    label={safePost.category ? safePost.category.charAt(0).toUpperCase() + safePost.category.slice(1) : ''}
                    color="primary"
                    sx={{ mb: 2 }}
                  />
              </Box>
              
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                {safePost.title}
              </Typography>
              
              <Typography variant="h6" color="text.secondary" paragraph sx={{ mb: 4 }}>
                {safePost.excerpt}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {safePost.author.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {safePost.author}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {safePost.publishedAt ? formatDate(safePost.publishedAt) : 'Unknown Date'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {safePost.views} views
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {safePost.readTime ? `${safePost.readTime} min read` : ''}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {safePost.tags.map((tag: string) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      icon={<Tag />}
                    />
                  ))}
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <IconButton onClick={handleShare}>
                    <ShareIcon />
                  </IconButton>
                  <IconButton onClick={handleBookmark}>
                    {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </AnimatedBox>

        {/* Article Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <AnimatedBox
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                        fontWeight: 600,
                        mb: 2,
                        mt: 3,
                      },
                      '& h1': {
                        fontSize: '2rem',
                        borderBottom: '2px solid',
                        borderColor: 'primary.main',
                        pb: 1,
                      },
                      '& h2': {
                        fontSize: '1.5rem',
                        color: 'primary.main',
                      },
                      '& h3': {
                        fontSize: '1.25rem',
                      },
                      '& p': {
                        mb: 2,
                        lineHeight: 1.6,
                      },
                      '& ul, & ol': {
                        mb: 2,
                        pl: 3,
                      },
                      '& li': {
                        mb: 1,
                      },
                      '& code': {
                        backgroundColor: 'grey.100',
                        padding: '2px 4px',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                      },
                      '& pre': {
                        backgroundColor: 'grey.100',
                        padding: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        mb: 2,
                      },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        ml: 0,
                        fontStyle: 'italic',
                        backgroundColor: 'grey.50',
                        py: 1,
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: safePost.content.replace(/\n/g, '<br>') }}
                  />
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>

          <Grid item xs={12} md={4}>
            <AnimatedBox
              initial={{ opacity: 0, x: 50 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Table of Contents
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="What is Federated Learning?" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="How Does It Work?" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Real-World Applications" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Challenges and Solutions" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Getting Started" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Future Directions" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    About the Author
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48 }}>
                      {safePost.author.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {safePost.author}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI Research Scientist
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Passionate about advancing AI research in healthcare, biotechnology, 
                    and intelligent transportation through innovative machine learning approaches.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </AnimatedBox>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default BlogPost;
