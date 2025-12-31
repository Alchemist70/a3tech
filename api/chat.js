const chatController = require('../backend/controllers/chatController');

// Vercel serverless function wrapper for POST /api/chat
module.exports = async (req, res) => {
  // Ensure CORS preflight is handled
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    // Delegate to existing controller function which expects (req, res)
    await chatController.sendChatReply(req, res);
  } catch (e) {
    console.error('Serverless wrapper error', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
};
