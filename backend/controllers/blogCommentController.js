const BlogComment = require('../models/BlogComment');

// Get all comments for a blog post
exports.getBlogComments = async (req, res) => {
    try {
        const { blogId } = req.params;

        if (!blogId) {
            return res.status(400).json({ error: 'Blog ID required' });
        }

        const comments = await BlogComment.find({ blogId })
            .sort({ createdAt: -1 })
            .select('blogId userId userName content createdAt updatedAt');

        res.json(comments);
    } catch (error) {
        console.error('Error fetching blog comments:', error);
        res.status(500).json({ error: error.message });
    }
};

// Add a comment to a blog post
exports.addBlogComment = async (req, res) => {
    try {
        const { blogId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id || req.headers['x-user-id'];
        const userName = req.user?.name || req.headers['x-user-name'] || 'Anonymous';

        if (!blogId) {
            return res.status(400).json({ error: 'Blog ID required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content required' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
        }

        const comment = new BlogComment({
            blogId,
            userId,
            userName,
            content: content.trim()
        });

        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error adding blog comment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a comment
exports.deleteBlogComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!commentId) {
            return res.status(400).json({ error: 'Comment ID required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Find comment
        const comment = await BlogComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this comment' });
        }

        await BlogComment.findByIdAndDelete(commentId);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('Error deleting blog comment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a comment
exports.updateBlogComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!commentId) {
            return res.status(400).json({ error: 'Comment ID required' });
        }

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Comment content required' });
        }

        if (content.length > 2000) {
            return res.status(400).json({ error: 'Comment must be less than 2000 characters' });
        }

        // Find comment
        const comment = await BlogComment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to update this comment' });
        }

        comment.content = content.trim();
        comment.updatedAt = new Date();
        await comment.save();

        res.json(comment);
    } catch (error) {
        console.error('Error updating blog comment:', error);
        res.status(500).json({ error: error.message });
    }
};
