"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTestimonial = exports.updateTestimonial = exports.createTestimonial = exports.getFeaturedTestimonials = exports.getTestimonials = void 0;
const Testimonial_1 = __importDefault(require("../models/Testimonial"));
const ragService = require('../services/ragService');
// Get all testimonials with optional filtering
const getTestimonials = async (req, res) => {
    try {
        const { featured, isActive = 'true' } = req.query;
        const query = {};
        if (featured === 'true')
            query.isFeatured = true;
        if (isActive === 'true')
            query.isActive = true;
        const testimonials = await Testimonial_1.default.find(query)
            .sort({ isFeatured: -1, createdAt: -1 });
        res.json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching testimonials',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getTestimonials = getTestimonials;
// Get featured testimonials
const getFeaturedTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial_1.default.find({
            isFeatured: true,
            isActive: true
        }).sort({ createdAt: -1 }).limit(6);
        res.json({
            success: true,
            data: testimonials
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured testimonials',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFeaturedTestimonials = getFeaturedTestimonials;
// Create new testimonial
const createTestimonial = async (req, res) => {
    try {
        const testimonialData = req.body;
        const testimonial = new Testimonial_1.default(testimonialData);
        await testimonial.save();
        res.status(201).json({
            success: true,
            data: testimonial,
            message: 'Testimonial created successfully'
        });
        try { ragService.addOrUpdateDoc({ source: 'testimonial', id: testimonial._id, text: [testimonial.author || '', testimonial.body || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createTestimonial', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating testimonial',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createTestimonial = createTestimonial;
// Update testimonial (admin only)
const updateTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const testimonial = await Testimonial_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        res.json({
            success: true,
            data: testimonial,
            message: 'Testimonial updated successfully'
        });
        try { ragService.addOrUpdateDoc({ source: 'testimonial', id: testimonial._id, text: [testimonial.author || '', testimonial.body || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateTestimonial', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating testimonial',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateTestimonial = updateTestimonial;
// Delete testimonial (admin only)
const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await Testimonial_1.default.findByIdAndDelete(id);
        if (!testimonial) {
            return res.status(404).json({
                success: false,
                message: 'Testimonial not found'
            });
        }
        res.json({
            success: true,
            message: 'Testimonial deleted successfully'
        });
        try { ragService.removeDoc('testimonial', id).catch(e => console.warn('[RAG] removeDoc failed after deleteTestimonial', e && e.message ? e.message : e)); } catch (e) { }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting testimonial',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteTestimonial = deleteTestimonial;
//# sourceMappingURL=testimonialController.js.map
