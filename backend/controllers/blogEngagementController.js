// Some models are compiled as ES modules (export default). Support both commonjs and esm default shapes.
const _BlogPost = require('../models/BlogPost');
const BlogPost = _BlogPost && _BlogPost.default ? _BlogPost.default : _BlogPost;
const BlogLike = require('../models/BlogLike');
const BlogBookmark = require('../models/BlogBookmark');

/**
 * Track a blog view
 */
exports.trackBlogView = async (req, res) => {
  try {
    const { blogId } = req.params;

    // Find blog and increment views
    const blog = await BlogPost.findByIdAndUpdate(
      blogId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.json({ success: true, views: blog.views });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false, message: 'Error tracking view' });
  }
};

/**
 * Get like status and count for a blog
 */
exports.getBlogLikes = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?._id || null;

    // Get total like count
    const likeCount = await BlogLike.countDocuments({ blogId });

    // Check if current user has liked
    const isLiked = userId
      ? await BlogLike.findOne({ userId, blogId }).then(doc => !!doc)
      : false;

    res.json({
      success: true,
      isLiked,
      likeCount,
    });
  } catch (error) {
    console.error('Error getting likes:', error);
    res.status(500).json({ success: false, message: 'Error getting likes' });
  }
};

/**
 * Toggle like on a blog
 */
exports.toggleBlogLike = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if blog exists
    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Check if user has already liked
    const existingLike = await BlogLike.findOne({ userId, blogId });

    if (existingLike) {
      // Remove like
      await BlogLike.deleteOne({ _id: existingLike._id });
      await BlogPost.findByIdAndUpdate(
        blogId,
        { $inc: { likes: -1 } },
        { new: true }
      );
    } else {
      // Add like
      const like = new BlogLike({ userId, blogId });
      await like.save();
      await BlogPost.findByIdAndUpdate(
        blogId,
        { $inc: { likes: 1 } },
        { new: true }
      );
    }

    // Get updated like count
    const likeCount = await BlogLike.countDocuments({ blogId });

    res.json({
      success: true,
      isLiked: !existingLike,
      likeCount,
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Error toggling like' });
  }
};

/**
 * Check if blog is bookmarked by user
 */
exports.checkBlogBookmark = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.json({ isBookmarked: false });
    }

    const bookmark = await BlogBookmark.findOne({ userId, blogId });

    res.json({
      success: true,
      isBookmarked: !!bookmark,
    });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ success: false, message: 'Error checking bookmark' });
  }
};

/**
 * Toggle bookmark on a blog
 */
exports.toggleBlogBookmark = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { title, slug, description } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Check if blog exists
    const blog = await BlogPost.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Check if already bookmarked
    const existingBookmark = await BlogBookmark.findOne({ userId, blogId });

    if (existingBookmark) {
      // Remove bookmark
      await BlogBookmark.deleteOne({ _id: existingBookmark._id });
    } else {
      // Add bookmark
      const bookmark = new BlogBookmark({
        userId,
        blogId,
        title: title || blog.title,
        slug: slug || blog.slug,
        description: description || blog.excerpt,
      });
      await bookmark.save();
    }

    res.json({
      success: true,
      isBookmarked: !existingBookmark,
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ success: false, message: 'Error toggling bookmark' });
  }
};

/**
 * Get all bookmarks for a user
 */
exports.getUserBookmarks = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const bookmarks = await BlogBookmark.find({ userId })
      .populate('blogId', 'title slug excerpt')
      .sort({ bookmarkedAt: -1 });

    res.json({
      success: true,
      data: bookmarks,
    });
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    res.status(500).json({ success: false, message: 'Error getting bookmarks' });
  }
};
