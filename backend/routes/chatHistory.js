const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getChatHistory,
  getConversation,
  saveChatMessage,
  exportChatHistory,
  deleteConversation,
  deleteAllConversations,
  getCleanupStatus
} = require('../controllers/chatHistoryController');

// Apply auth middleware to populate req.user (does not block if token missing or invalid)
router.use(authMiddleware);

// GET /api/chat-history - Get user's chat history (paginated, auth required in controller)
router.get('/', getChatHistory);

// GET /api/chat-history/:conversationId - Get a specific conversation (auth required in controller)
router.get('/:conversationId', getConversation);

// POST /api/chat-history - Save a message to chat history (auth required in controller)
router.post('/', saveChatMessage);

// GET /api/chat-history/export/all - Export all user conversations as JSON
router.get('/export/all', exportChatHistory);

// DELETE /api/chat-history/:conversationId - Delete a specific conversation
router.delete('/:conversationId', deleteConversation);

// POST /api/chat-history/delete/all - Delete all user conversations (requires confirmation)
router.post('/delete/all', deleteAllConversations);

// GET /api/chat-history/status/cleanup - Get retention policy and cleanup status
router.get('/status/cleanup', getCleanupStatus);

module.exports = router;
