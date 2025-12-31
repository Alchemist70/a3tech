const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getUserMemoryProfile,
  searchUserMemories,
  indexMessage,
  clearMemories
} = require('../controllers/memoryController');

// Apply auth middleware
router.use(authMiddleware);

// GET /api/memory/profile - Get user's consolidated memory profile
router.get('/profile', getUserMemoryProfile);

// POST /api/memory/search - Search memories semantically
router.post('/search', searchUserMemories);

// POST /api/memory/index - Index a message to memory
router.post('/index', indexMessage);

// DELETE /api/memory/clear - Clear all user memories
router.delete('/clear', clearMemories);

module.exports = router;
