import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Grid, Card, CardContent, Button, CircularProgress, Breadcrumbs, Link, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import { blogAPI } from '../api/blogAPI';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const Bookmarks: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookmarkToDelete, setBookmarkToDelete] = useState<any | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        const data = await blogAPI.getBookmarks();
        setBookmarks(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setBookmarks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated, navigate, openLogin]);

  const handleRemoveBookmark = async (bookmark: any) => {
    setDeleting(true);
    try {
      const blogId = bookmark.blogId?._id || bookmark.blogId;
      await blogAPI.toggleBookmark(blogId, bookmark.title || '', bookmark.blogId?.slug || bookmark.slug || '');
      setBookmarks((prev) => prev.filter(b => b._id !== bookmark._id));
      setSnackbarMessage('Bookmark removed');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setSnackbarMessage('Failed to remove bookmark');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = (bookmark: any) => {
    setBookmarkToDelete(bookmark);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!bookmarkToDelete) return;
    await handleRemoveBookmark(bookmarkToDelete);
    setBookmarkToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleCancelDelete = () => {
    setBookmarkToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleViewBlog = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" color="primary" to="/">Home</Link>
        <Typography color="text.primary" sx={{ fontWeight: 600 }}>My Bookmarks</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BookmarkIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
          My Bookmarks
        </Typography>
      </Box>

      {/* Content */}
      {bookmarks.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 4 }}>
          You don't have any bookmarks yet. Start reading blogs and bookmark your favorites!
        </Alert>
      ) : (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You have {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
          </Typography>
          
          <Grid container spacing={3}>
            {bookmarks.map((bookmark) => (
              <Grid item xs={12} sm={6} md={4} key={bookmark._id}>
                <Card
                  sx={(theme) => ({
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.primary.main,
                    }
                  })}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                      {bookmark.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
                      {bookmark.description || 'No description available'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Added {new Date(bookmark.bookmarkedAt || bookmark.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      fullWidth
                      onClick={() => handleViewBlog(bookmark.blogId?.slug || bookmark.slug)}
                      sx={{ textTransform: 'none' }}
                    >
                      Read
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => confirmDelete(bookmark)}
                      startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                      title="Remove bookmark"
                    />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="confirm-delete-title"
      >
        <DialogTitle id="confirm-delete-title">Confirm remove bookmark</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove the bookmark "{bookmarkToDelete?.title}"? This will remove it from your bookmarks list.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>{deleting ? 'Removing…' : 'Remove'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Bookmarks;
