import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

interface BookmarkButtonProps {
  itemId: string;
  itemType: 'project' | 'knowledgeBase' | 'blog';
  size?: 'small' | 'medium' | 'large';
  onToggle?: (bookmarked: boolean) => void;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  itemId,
  itemType,
  size = 'medium',
  onToggle
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const checkBookmarkStatus = useCallback(async () => {
    try {
      const endpoints: Record<string, string> = {
        project: `/projects/${itemId}/bookmark-status`,
        knowledgeBase: `/knowledge-base/${itemId}/bookmark-status`,
        blog: `/blog/${itemId}/bookmark-status`
      };

      const res = await api.get(endpoints[itemType]);
      const data = res.data || {};
      const isBook = Boolean(data.bookmarked ?? data.isBookmarked ?? (data.success && data.isBookmarked));
      setBookmarked(isBook);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [itemId, itemType]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  const handleToggleBookmark = async () => {
    try {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          try { openLogin && openLogin(); } catch (e) {}
          return;
        }

        const endpoints: Record<string, string> = {
          project: `/projects/${itemId}/bookmark`,
          knowledgeBase: `/knowledge-base/${itemId}/bookmark`,
          blog: `/blog/${itemId}/bookmark`
        };

        const res = await api.post(endpoints[itemType], {});
        const data = res.data || {};
        const newState = Boolean(data.bookmarked ?? data.isBookmarked ?? (data.success && data.isBookmarked));
        setBookmarked(newState);
        if (onToggle) onToggle(newState);
      } catch (err) {
        console.error('Error toggling bookmark:', err);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
      <IconButton
        onClick={handleToggleBookmark}
        disabled={loading}
        size={size}
        sx={{
          color: bookmarked ? '#1976d2' : 'inherit',
          transition: 'all 0.3s ease'
        }}
      >
        {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default BookmarkButton;
