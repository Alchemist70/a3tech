"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBlogPost = exports.updateBlogPost = exports.createBlogPost = exports.getBlogCategories = exports.getFeaturedBlogPosts = exports.getBlogPostBySlug = exports.getBlogPosts = void 0;
const BlogPost_1 = __importDefault(require("../models/BlogPost"));
const ragService = require('../services/ragService');
// Get all blog posts with filtering and pagination
const getBlogPosts = async (req, res) => {
    try {
        const { category, search, status = 'published', limit = '10', page = '1', sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
        const query = { status };
        if (category)
            query.category = category;
        if (search) {
            query.$text = { $search: search };
        }
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const posts = await BlogPost_1.default.find(query)
            .select('-content')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        const total = await BlogPost_1.default.countDocuments(query);
        res.json({
            success: true,
            data: posts,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog posts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getBlogPosts = getBlogPosts;
// Get all blog posts for admin (no status filter) with filtering and pagination
const getBlogPostsAdmin = async (req, res) => {
    try {
        const { category, search, limit = '50', page = '1', sortBy = 'publishedAt', sortOrder = 'desc' } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (search) {
            query.$text = { $search: search };
        }
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        const posts = await BlogPost_1.default.find(query)
            //.select('-content') // admin may want content; return full documents
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum);
        const total = await BlogPost_1.default.countDocuments(query);
        res.json({
            success: true,
            data: posts,
            pagination: {
                current: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog posts (admin)',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getBlogPostsAdmin = getBlogPostsAdmin;
// Get single blog post by slug
const getBlogPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const post = await BlogPost_1.default.findOne({ slug, status: 'published' });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }
        // Increment view count
        await BlogPost_1.default.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
        res.json({
            success: true,
            data: post
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog post',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getBlogPostBySlug = getBlogPostBySlug;
// Get featured blog posts
const getFeaturedBlogPosts = async (req, res) => {
    try {
        const posts = await BlogPost_1.default.find({
            status: 'published',
            views: { $gte: 10 } // Posts with at least 10 views
        })
            .select('-content')
            .sort({ views: -1, publishedAt: -1 })
            .limit(3);
        res.json({
            success: true,
            data: posts
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured blog posts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFeaturedBlogPosts = getFeaturedBlogPosts;
// Get blog post categories
const getBlogCategories = async (req, res) => {
    try {
        const categories = await BlogPost_1.default.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching blog categories',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getBlogCategories = getBlogCategories;
// Create new blog post (admin only)
const createBlogPost = async (req, res) => {
    try {
        const postData = req.body;
        const post = new BlogPost_1.default(postData);
        await post.save();
        res.status(201).json({
            success: true,
            data: post,
            message: 'Blog post created successfully'
        });
                try {
                    const doc = { source: 'blog', id: post._id, text: [post.title, post.excerpt || '', (post.content || '').slice(0, 4000)].filter(Boolean).join('\n'), keywords: post.tags || [] };
                    ragService.addOrUpdateDoc(doc).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createBlogPost', e && e.message ? e.message : e));
                } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating blog post',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createBlogPost = createBlogPost;
// Update blog post (admin only)
const updateBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const post = await BlogPost_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }
        res.json({
            success: true,
            data: post,
            message: 'Blog post updated successfully'
        });
                try {
                    const doc = { source: 'blog', id: post._id, text: [post.title, post.excerpt || '', (post.content || '').slice(0, 4000)].filter(Boolean).join('\n'), keywords: post.tags || [] };
                    ragService.addOrUpdateDoc(doc).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateBlogPost', e && e.message ? e.message : e));
                } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating blog post',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateBlogPost = updateBlogPost;
// Delete blog post (admin only)
const deleteBlogPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await BlogPost_1.default.findByIdAndDelete(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }
        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
        try { ragService.removeDoc('blog', id).catch(e => console.warn('[RAG] removeDoc failed after deleteBlogPost', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting blog post',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteBlogPost = deleteBlogPost;
//# sourceMappingURL=blogController.js.map
