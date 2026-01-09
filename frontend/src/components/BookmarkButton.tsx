import React, { useState, useEffect, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

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

  const checkBookmarkStatus = useCallback(async () => {
    try {
      const endpoints: Record<string, string> = {
        project: `/api/projects/${itemId}/bookmark-status`,
        knowledgeBase: `/api/knowledge-base/${itemId}/bookmark-status`,
        blog: `/api/blog/${itemId}/bookmark-status`
      };

      const response = await fetch(endpoints[itemType]);
      const data = await response.json();
      setBookmarked(data.bookmarked || false);
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

      const endpoints: Record<string, string> = {
        project: `/api/projects/${itemId}/bookmark`,
        knowledgeBase: `/api/knowledge-base/${itemId}/bookmark`,
        blog: `/api/blog/${itemId}/bookmark`
      };

      const response = await fetch(endpoints[itemType], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || '',
          'x-user-name': localStorage.getItem('userName') || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle bookmark');
      }

      const data = await response.json();
      setBookmarked(data.bookmarked);

      if (onToggle) {
        onToggle(data.bookmarked);
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
