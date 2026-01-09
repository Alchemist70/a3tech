import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Paper, Divider, CircularProgress, Avatar, Card, CardContent, Grid, Button, Breadcrumbs, Link, IconButton, Snackbar, Alert } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import api from '../api';
import ShareMenu from '../components/ShareMenu';
import CommentSection from '../components/CommentSection';
import { blogAPI } from '../api/blogAPI';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const BlogDetail: React.FC = () => {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Fetch blog and engagement data
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        if (!title) return;
        const res = await api.get(`/blog/${title}`);
        const data = res.data?.data || res.data;
        setBlog(data);
        setViews(data?.views || 0);

        // Track view once per browser session to avoid double-counting
        if (data?._id) {
          try {
            const viewedKey = `viewed_blog_${data._id}`;
            const alreadyViewed = typeof window !== 'undefined' && sessionStorage.getItem(viewedKey);
            if (!alreadyViewed) {
              const trackRes = await blogAPI.trackView(data._id);
              if (trackRes && typeof trackRes.views === 'number') {
                setViews(trackRes.views);
              }
              try {
                sessionStorage.setItem(viewedKey, '1');
              } catch (e) {
                // ignore sessionStorage failures
              }
            } else {
              // If already viewed in this session just use server value if present
              setViews(data.views || 0);
            }
          } catch (e) {
            // fall back gracefully
            setViews(data.views || 0);
          }
        }

        // Load engagement data if authenticated
        if (isAuthenticated && data?._id) {
          const likeStatus = await blogAPI.getLikeStatus(data._id);
          setIsLiked(likeStatus?.isLiked || false);
          setLikeCount(likeStatus?.likeCount || 0);

          const bookmarkStatus = await blogAPI.isBookmarked(data._id);
          setIsBookmarked(bookmarkStatus);
        }
      } catch (err) {
        setBlog(null);
        showSnackbar('Failed to load blog', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [title, isAuthenticated]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      showSnackbar('Please log in to like', 'error');
      openLogin();
      return;
    }

    try {
      const result = await blogAPI.toggleLike(blog._id);
      if (result) {
        setIsLiked(Boolean(result.isLiked));
        setLikeCount(result.likeCount || 0);
        showSnackbar(result.isLiked ? 'Added to likes' : 'Removed like');
      }
    } catch (err) {
      showSnackbar('Failed to like post', 'error');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      showSnackbar('Please log in to bookmark', 'error');
      openLogin();
      return;
    }

    try {
      const result = await blogAPI.toggleBookmark(blog._id, blog.title, blog.slug);
      if (result) {
        setIsBookmarked(Boolean(result.isBookmarked));
        showSnackbar(result.isBookmarked ? 'Added to bookmarks' : 'Removed from bookmarks');
      }
    } catch (err) {
      showSnackbar('Failed to bookmark post', 'error');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!blog) return <Typography>Blog not found.</Typography>;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const getExcerpt = (b: any) => {
    if (!b) return '';
    if (b.excerpt) return b.excerpt;
    if (b.description) return b.description;
    const content = typeof b.content === 'string' ? b.content : '';
    // Strip HTML and truncate
    const stripped = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return stripped.substring(0, 160) + (stripped.length > 160 ? '...' : '');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, mb: 4, px: 2 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="primary" to="/">Home</Link>
        <Link component={RouterLink} underline="hover" color="primary" to="/blog">Blog</Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>{blog.title}</Typography>
      </Breadcrumbs>

      {/* Back to Blogs Button */}
      <Button
        variant="outlined"
        color="primary"
        sx={{ mb: 2, textTransform: 'none' }}
        onClick={() => navigate('/blog')}
      >
        ← Back to Blog
      </Button>

      <Card sx={(theme) => ({ p: 3, borderRadius: 2, boxShadow: 2, border: `1px solid ${theme.palette.divider}` })}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>{blog.title}</Typography>
            
            {/* Engagement buttons */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <ShareMenu title={blog.title} url={pageUrl} description={getExcerpt(blog)} />
              
              <IconButton
                color={isBookmarked ? 'primary' : 'default'}
                onClick={handleBookmark}
                sx={(theme) => ({
                  bgcolor: isBookmarked ? theme.palette.primary.light : theme.palette.action.hover,
                  '&:hover': { bgcolor: theme.palette.primary.main, color: '#fff' },
                })}
                title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
              >
                {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  color={isLiked ? 'primary' : 'default'}
                  onClick={handleLike}
                  sx={(theme) => ({
                    bgcolor: isLiked ? theme.palette.primary.light : theme.palette.action.hover,
                    '&:hover': { bgcolor: theme.palette.primary.main, color: '#fff' },
                  })}
                  title={isLiked ? 'Remove like' : 'Like'}
                >
                  {isLiked ? <ThumbUpIcon /> : <ThumbUpAltOutlinedIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {likeCount}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Blog metadata */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap', fontSize: '0.9rem' }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontWeight: 700 }}>
              {blog.author?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
            <Typography variant="subtitle2" color="text.secondary">
              By {blog.author}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon sx={{ fontSize: 16 }} />
              {formatDate(blog.publishedAt)}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <VisibilityIcon sx={{ fontSize: 16 }} />
              {views} views
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box sx={{ fontSize: '1.1rem', color: 'text.primary', lineHeight: 1.8 }}>
                {typeof blog.content === 'string' && /<\/?[a-z][\s\S]*>/i.test(blog.content) ? (
                  <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                ) : (
                  <Box sx={{ whiteSpace: 'pre-line' }}>{blog.content}</Box>
                )}
              </Box>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} md={4}>
              {/* Table of Contents */}
              {blog.toc && blog.toc.length > 0 && (
                <Paper sx={(theme) => ({ p: 2, mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` })}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>Table of Contents</Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {blog.toc.map((item: string) => (
                      <li key={item} style={{ marginBottom: 6, fontSize: '0.9rem' }}>{item}</li>
                    ))}
                  </ul>
                </Paper>
              )}

              {/* About the Author */}
              <Paper sx={(theme) => ({ p: 2, borderRadius: 2, border: `1px solid ${theme.palette.divider}` })}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>About the Author</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700, mr: 1.5 }}>
                    {blog.author?.charAt(0).toUpperCase() || 'A'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{blog.author}</Typography>
                    <Typography variant="caption" color="text.secondary">AI Research Scientist</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.6 }}>{blog.authorBio}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Read More
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Comments Section */}
      {blog?._id && <CommentSection blogId={blog._id} isAuthenticated={isAuthenticated} />}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BlogDetail;
