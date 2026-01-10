const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topicController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public
router.get('/', topicController.getTopics);
router.get('/:slug', topicController.getTopicBySlug);

// Admin (create/update/delete)
router.post('/', authMiddleware, adminMiddleware, topicController.createTopic);
router.put('/:id', authMiddleware, adminMiddleware, topicController.updateTopic);
router.delete('/:id', authMiddleware, adminMiddleware, topicController.deleteTopic);

module.exports = router;
