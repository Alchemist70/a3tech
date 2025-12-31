const express = require('express');
const faqController = require('../controllers/faqController');
const router = express.Router();

// Public routes
router.get('/', faqController.getFAQs);
router.get('/categories', faqController.getFAQCategories);
router.get('/category/:category', faqController.getFAQsByCategory);

// Admin routes (would need authentication middleware)
// router.post('/', authMiddleware, adminMiddleware, createFAQ);
// router.put('/:id', authMiddleware, adminMiddleware, updateFAQ);
// router.delete('/:id', authMiddleware, adminMiddleware, deleteFAQ);
// For now, allowing all operations (remove in production)
router.post('/', faqController.createFAQ);
router.put('/:id', faqController.updateFAQ);
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;
