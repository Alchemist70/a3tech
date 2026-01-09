const express = require('express');
const blogController = require('../controllers/blogController');
const blogEngagementController = require('../controllers/blogEngagementController');
const bookmarkController = require('../controllers/bookmarkController');
const blogCommentController = require('../controllers/blogCommentController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Public routes
router.get('/', blogController.getBlogPosts);
router.get('/featured', blogController.getFeaturedBlogPosts);
router.get('/categories', blogController.getBlogCategories);
// Admin listing: return full blog documents (including drafts) for admin UI
router.get('/admin', blogController.getBlogPostsAdmin);
router.get('/:slug', blogController.getBlogPostBySlug);

// Engagement routes
// Views tracking
router.post('/:blogId/view', blogEngagementController.trackBlogView);

// Likes - first one is public (to get counts), second requires auth
router.get('/:blogId/likes', blogEngagementController.getBlogLikes);
router.post('/:blogId/like', authMiddleware, blogEngagementController.toggleBlogLike);

// Bookmarks - all require auth
router.get('/:blogId/bookmark-status', authMiddleware, blogEngagementController.checkBlogBookmark);
router.post('/:blogId/bookmark', authMiddleware, blogEngagementController.toggleBlogBookmark);
router.get('/user/bookmarks', authMiddleware, blogEngagementController.getUserBookmarks);

// Comments routes
router.get('/:blogId/comments', blogCommentController.getBlogComments);
router.post('/:blogId/comments', authMiddleware, blogCommentController.addBlogComment);
router.put('/comments/:commentId', authMiddleware, blogCommentController.updateBlogComment);
router.delete('/comments/:commentId', authMiddleware, blogCommentController.deleteBlogComment);

// Admin routes (would need authentication middleware)
// router.post('/', authMiddleware, adminMiddleware, createBlogPost);
// router.put('/:id', authMiddleware, adminMiddleware, updateBlogPost);
// router.delete('/:id', authMiddleware, adminMiddleware, deleteBlogPost);
// For now, allowing all operations (remove in production)
router.post('/', blogController.createBlogPost);
router.put('/:id', blogController.updateBlogPost);
router.delete('/:id', blogController.deleteBlogPost);

module.exports = router;
