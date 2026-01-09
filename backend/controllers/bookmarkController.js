const ProjectBookmark = require('../models/ProjectBookmark');
const KnowledgeBaseBookmark = require('../models/KnowledgeBaseBookmark');

// Project Bookmarks
exports.toggleProjectBookmark = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!projectId) {
            return res.status(400).json({ error: 'Project ID required' });
        }

        // Check if bookmark exists
        const existingBookmark = await ProjectBookmark.findOne({ userId, projectId });

        if (existingBookmark) {
            // Remove bookmark
            await ProjectBookmark.findByIdAndDelete(existingBookmark._id);
            return res.json({ bookmarked: false, message: 'Bookmark removed' });
        } else {
            // Add bookmark
            const bookmark = new ProjectBookmark({ userId, projectId });
            await bookmark.save();
            return res.json({ bookmarked: true, message: 'Bookmark added' });
        }
    } catch (error) {
        console.error('Error toggling project bookmark:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getProjectBookmarks = async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const bookmarks = await ProjectBookmark.find({ userId }).populate('projectId');
        res.json(bookmarks);
    } catch (error) {
        console.error('Error fetching project bookmarks:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.isProjectBookmarked = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.json({ bookmarked: false });
        }

        const bookmark = await ProjectBookmark.findOne({ userId, projectId });
        res.json({ bookmarked: !!bookmark });
    } catch (error) {
        console.error('Error checking project bookmark:', error);
        res.status(500).json({ error: error.message });
    }
};

// Knowledge Base Bookmarks
exports.toggleKnowledgeBaseBookmark = async (req, res) => {
    try {
        const { knowledgeBaseId } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        if (!knowledgeBaseId) {
            return res.status(400).json({ error: 'Knowledge Base ID required' });
        }

        // Check if bookmark exists
        const existingBookmark = await KnowledgeBaseBookmark.findOne({ userId, knowledgeBaseId });

        if (existingBookmark) {
            // Remove bookmark
            await KnowledgeBaseBookmark.findByIdAndDelete(existingBookmark._id);
            return res.json({ bookmarked: false, message: 'Bookmark removed' });
        } else {
            // Add bookmark
            const bookmark = new KnowledgeBaseBookmark({ userId, knowledgeBaseId });
            await bookmark.save();
            return res.json({ bookmarked: true, message: 'Bookmark added' });
        }
    } catch (error) {
        console.error('Error toggling knowledge base bookmark:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getKnowledgeBaseBookmarks = async (req, res) => {
    try {
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const bookmarks = await KnowledgeBaseBookmark.find({ userId }).populate('knowledgeBaseId');
        res.json(bookmarks);
    } catch (error) {
        console.error('Error fetching knowledge base bookmarks:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.isKnowledgeBaseBookmarked = async (req, res) => {
    try {
        const { knowledgeBaseId } = req.params;
        const userId = req.user?.id || req.headers['x-user-id'];

        if (!userId) {
            return res.json({ bookmarked: false });
        }

        const bookmark = await KnowledgeBaseBookmark.findOne({ userId, knowledgeBaseId });
        res.json({ bookmarked: !!bookmark });
    } catch (error) {
        console.error('Error checking knowledge base bookmark:', error);
        res.status(500).json({ error: error.message });
    }
};
