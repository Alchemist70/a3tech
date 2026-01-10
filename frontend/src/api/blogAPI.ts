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
    // Fetch each bookmark type independently and combine results. Use allSettled
    // so a failure in one endpoint doesn't prevent displaying others.
    const promises = {
      blogs: api.get('/blog/user/bookmarks'),
      projects: api.get('/projects/bookmarks/list'),
      knowledgeBase: api.get('/knowledge-base/bookmarks/list')
    };

    const results = await Promise.allSettled([promises.blogs, promises.projects, promises.knowledgeBase]);

    const blogItems: any[] = [];
    const projItems: any[] = [];
    const kbItems: any[] = [];

    // blogs
    if (results[0].status === 'fulfilled') {
      try {
        const blogRes = (results[0] as PromiseFulfilledResult<any>).value;
        (blogRes.data?.data || []).forEach((b: any) => {
          blogItems.push({
            _id: b._id,
            title: b.blogId?.title || b.title || 'Untitled',
            description: b.blogId?.excerpt || b.description || '',
            bookmarkedAt: b.bookmarkedAt || b.createdAt || b.updatedAt,
            type: 'blog',
            resourceId: b.blogId?._id || b.blogId,
            slug: b.blogId?.slug || b.slug || ''
          });
        });
      } catch (e) {
        // ignore per-item mapping errors
        console.error('Error processing blog bookmarks:', e);
      }
    } else {
      console.warn('Blog bookmarks fetch failed:', (results[0] as PromiseRejectedResult).reason);
    }

    // projects
    if (results[1].status === 'fulfilled') {
      try {
        const projRes = (results[1] as PromiseFulfilledResult<any>).value;
        (projRes.data || []).forEach((p: any) => {
          projItems.push({
            _id: p._id,
            title: p.projectId?.title || p.title || 'Untitled Project',
            description: p.projectId?.description || p.description || '',
            bookmarkedAt: p.createdAt || p.updatedAt,
            type: 'project',
            resourceId: p.projectId?._id || p.projectId,
            slug: p.projectId?.slug || ''
          });
        });
      } catch (e) {
        console.error('Error processing project bookmarks:', e);
      }
    } else {
      console.warn('Project bookmarks fetch failed:', (results[1] as PromiseRejectedResult).reason);
    }

    // knowledge-base
    if (results[2].status === 'fulfilled') {
      try {
        const kbRes = (results[2] as PromiseFulfilledResult<any>).value;
        (kbRes.data || []).forEach((k: any) => {
          kbItems.push({
            _id: k._id,
            title: k.knowledgeBaseId?.name || k.title || 'Untitled',
            description: k.knowledgeBaseId?.content || k.description || '',
            bookmarkedAt: k.createdAt || k.updatedAt,
            type: 'knowledgeBase',
            resourceId: k.knowledgeBaseId?._id || k.knowledgeBaseId,
            slug: k.knowledgeBaseId?.slug || '',
            subjectSlug: k.knowledgeBaseId?.subjectId || ''
          });
        });
      } catch (e) {
        console.error('Error processing knowledge-base bookmarks:', e);
      }
    } else {
      console.warn('Knowledge-base bookmarks fetch failed:', (results[2] as PromiseRejectedResult).reason);
    }

    const all = [...blogItems, ...projItems, ...kbItems];
    all.sort((a: any, b: any) => new Date(b.bookmarkedAt || 0).getTime() - new Date(a.bookmarkedAt || 0).getTime());
    return all;
  },

  // Add/remove bookmark
  toggleBookmark: async (blogId: string, title: string, slug: string) => {
    const response = await api.post(`/blog/${blogId}/bookmark`, {
      title,
      slug,
    });
    return response.data;
  },

  // Toggle project bookmark
  toggleProjectBookmark: async (projectId: string) => {
    const response = await api.post(`/projects/${projectId}/bookmark`, {});
    return response.data;
  },

  // Toggle knowledge-base bookmark
  toggleKnowledgeBaseBookmark: async (kbId: string) => {
    const response = await api.post(`/knowledge-base/${kbId}/bookmark`, {});
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
