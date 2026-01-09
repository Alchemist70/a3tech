import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Comment {
  _id: string;
  blogId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CommentSectionProps {
  blogId: string;
  isAuthenticated?: boolean;
}

const CommentSection: React.FC<CommentSectionProps> = ({ blogId, isAuthenticated = true }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const currentUserId = localStorage.getItem('userId') || '';
  const currentUserName = localStorage.getItem('userName') || 'Anonymous';

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${blogId}/comments`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    if (!isAuthenticated || !currentUserId) {
      alert('Please sign in to comment');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/blog/${blogId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
          'x-user-name': currentUserName
        },
        body: JSON.stringify({ content: newComment })
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const addedComment = await response.json();
      setComments([addedComment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (comment: Comment) => {
    if (comment.userId === currentUserId) {
      setEditingId(comment._id);
      setEditingContent(comment.content);
      setOpenEditDialog(true);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingContent.trim() || !editingId) return;

    try {
      const response = await fetch(`/api/blog/comments/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId,
          'x-user-name': currentUserName
        },
        body: JSON.stringify({ content: editingContent })
      });

      if (!response.ok) throw new Error('Failed to update comment');

      const updatedComment = await response.json();
      setComments(
        comments.map((c) => (c._id === editingId ? updatedComment : c))
      );
      setOpenEditDialog(false);
      setEditingId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      try {
        const response = await fetch(`/api/blog/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': currentUserId,
            'x-user-name': currentUserName
          }
        });

        if (!response.ok) throw new Error('Failed to delete comment');

        setComments(comments.filter((c) => c._id !== commentId));
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment');
      }
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Comments ({comments.length})
      </Typography>

      {isAuthenticated && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Typography>Loading comments...</Typography>
      ) : comments.length === 0 ? (
        <Typography color="textSecondary">
          {isAuthenticated ? 'No comments yet. Be the first to comment!' : 'Sign in to view and post comments.'}
        </Typography>
      ) : (
        <List>
          {comments.map((comment, index) => (
            <Box key={comment._id}>
              <ListItem
                sx={{
                  alignItems: 'flex-start',
                  py: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {comment.userName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(comment.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.primary', mb: 1 }}>
                        {comment.content}
                      </Typography>
                      {comment.userId === currentUserId && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleEditClick(comment)}
                            sx={{ color: 'primary.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteComment(comment._id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < comments.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateComment}
            variant="contained"
            disabled={!editingContent.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentSection;
