const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

// Attach optional auth middleware so `req.user` is populated when a valid
// token is provided. This allows server-side greeting personalization using
// the registered user's name without requiring the client to send it.
router.post('/', auth, async (req, res) => {
  try {
    await chatController.sendChatReply(req, res);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('chat route error', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

module.exports = router;
