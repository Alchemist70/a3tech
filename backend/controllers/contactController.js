"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContactStats = exports.updateContactStatus = exports.getContacts = exports.submitContact = void 0;
const Contact_1 = __importDefault(require("../models/Contact"));
// Submit contact form
const submitContact = async (req, res) => {
    try {
        const contactData = req.body;
        const contact = new Contact_1.default(contactData);
        await contact.save();
        res.status(201).json({
            success: true,
            data: contact,
            message: 'Contact form submitted successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error submitting contact form',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.submitContact = submitContact;
// Get all contact messages (admin only)
const getContacts = async (req, res) => {
    try {
        const { status, type, priority, limit = '20', page = '1' } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;
        const contacts = await Contact_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = await Contact_1.default.countDocuments(query);
        res.json({
            success: true,
            data: contacts,
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
            message: 'Error fetching contacts',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getContacts = getContacts;
// Update contact status (admin only)
const updateContactStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const contact = await Contact_1.default.findByIdAndUpdate(id, { status, response }, { new: true, runValidators: true });
        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }
        res.json({
            success: true,
            data: contact,
            message: 'Contact status updated successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating contact status',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateContactStatus = updateContactStatus;
// Get contact statistics (admin only)
const getContactStats = async (req, res) => {
    try {
        const total = await Contact_1.default.countDocuments();
        const newMessages = await Contact_1.default.countDocuments({ status: 'new' });
        const byType = await Contact_1.default.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        const byPriority = await Contact_1.default.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        res.json({
            success: true,
            data: {
                total,
                newMessages,
                byType,
                byPriority
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching contact statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getContactStats = getContactStats;
//# sourceMappingURL=contactController.js.map
