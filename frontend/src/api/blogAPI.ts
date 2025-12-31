import api from '../api';

/**
 * Blog engagement API calls
 */

export const blogAPI = {
  // Track page view
  trackView: async (blogId: string) => {
    const response = await api.post(`/blog/${blogId}/view`);
    return response.data;
  },

  // Get like status and count
  getLikeStatus: async (blogId: string) => {
    try {
      const response = await api.get(`/blog/${blogId}/likes`);
      return response.data;
    } catch (error) {
      console.error('Error fetching like status:', error);
      return { isLiked: false, likeCount: 0 };
    }
  },

  // Toggle like
  toggleLike: async (blogId: string) => {
    const response = await api.post(`/blog/${blogId}/like`);
    return response.data;
  },

  // Get bookmarks
  getBookmarks: async () => {
    try {
      const response = await api.get('/blog/user/bookmarks');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  },

  // Add/remove bookmark
  toggleBookmark: async (blogId: string, title: string, slug: string) => {
    const response = await api.post(`/blog/${blogId}/bookmark`, {
      title,
      slug,
    });
    return response.data;
  },

  // Check if blog is bookmarked
  isBookmarked: async (blogId: string) => {
    try {
      const response = await api.get(`/blog/${blogId}/bookmark-status`);
      return response.data?.isBookmarked || false;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  },
};
