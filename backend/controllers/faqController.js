"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFAQ = exports.updateFAQ = exports.createFAQ = exports.getFAQCategories = exports.getFAQsByCategory = exports.getFAQs = void 0;
const FAQ_1 = __importDefault(require("../models/FAQ"));
const ragService = require('../services/ragService');
// Get all FAQs with optional filtering
const getFAQs = async (req, res) => {
    try {
        const { category, isActive = 'true' } = req.query;
        const query = {};
        if (category)
            query.category = category;
        if (isActive === 'true')
            query.isActive = true;
        const faqs = await FAQ_1.default.find(query)
            .sort({ order: 1, createdAt: 1 });
        res.json({
            success: true,
            data: faqs
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching FAQs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFAQs = getFAQs;
// Get FAQs by category
const getFAQsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const faqs = await FAQ_1.default.find({
            category,
            isActive: true
        }).sort({ order: 1, createdAt: 1 });
        res.json({
            success: true,
            data: faqs
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching FAQs by category',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFAQsByCategory = getFAQsByCategory;
// Get FAQ categories
const getFAQCategories = async (req, res) => {
    try {
        const categories = await FAQ_1.default.aggregate([
            { $match: { isActive: true } },
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
            message: 'Error fetching FAQ categories',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFAQCategories = getFAQCategories;
// Create new FAQ (admin only)
const createFAQ = async (req, res) => {
    try {
        const faqData = req.body;
        const faq = new FAQ_1.default(faqData);
        await faq.save();
        res.status(201).json({
            success: true,
            data: faq,
            message: 'FAQ created successfully'
        });
        try { ragService.addOrUpdateDoc({ source: 'faq', id: faq._id, text: [faq.question, faq.answer || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createFAQ', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating FAQ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createFAQ = createFAQ;
// Update FAQ (admin only)
const updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const faq = await FAQ_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        res.json({
            success: true,
            data: faq,
            message: 'FAQ updated successfully'
        });
        try { ragService.addOrUpdateDoc({ source: 'faq', id: faq._id, text: [faq.question, faq.answer || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateFAQ', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating FAQ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateFAQ = updateFAQ;
// Delete FAQ (admin only)
const deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const faq = await FAQ_1.default.findByIdAndDelete(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }
        res.json({
            success: true,
            message: 'FAQ deleted successfully'
        });
        try { ragService.removeDoc('faq', id).catch(e => console.warn('[RAG] removeDoc failed after deleteFAQ', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting FAQ',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteFAQ = deleteFAQ;
//# sourceMappingURL=faqController.js.map
