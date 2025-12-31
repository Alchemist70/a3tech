/**
 * Memory Controller: Endpoints for retrieving semantic memories and user profiles
 */

const {
  indexUserMessage,
  retrieveUserMemories,
  getUserProfile,
  clearUserMemories
} = require('../services/memoryService');

/**
 * GET /api/memory/profile - Get consolidated user profile from memories
 */
async function getUserMemoryProfile(req, res) {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const profile = await getUserProfile(userId);
    return res.json({ success: true, data: profile });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user memory profile:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/memory/search - Search user memories semantically
 */
async function searchUserMemories(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { query, limit = 5, minSimilarity = 0.5 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query parameter required' });
    }

    const memories = await retrieveUserMemories(userId, query, parseInt(limit), parseFloat(minSimilarity));
    return res.json({
      success: true,
      data: memories,
      count: memories.length
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error searching memories:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/memory/index - Manually index a message to user memory
 */
async function indexMessage(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId, messageText, metadata } = req.body;
    if (!messageText || !conversationId) {
      return res.status(400).json({
        success: false,
        error: 'messageText and conversationId required'
      });
    }

    const entry = await indexUserMessage(userId, conversationId, messageText, metadata);
    if (!entry) {
      return res.status(400).json({
        success: false,
        error: 'Message too short or failed to index'
      });
    }

    return res.json({ success: true, data: entry });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error indexing message:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/memory/clear - Clear all memories for the user (privacy)
 */
async function clearMemories(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Deletion not confirmed. Send { confirmed: true } to proceed.'
      });
    }

    const result = await clearUserMemories(userId);
    return res.json(result);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error clearing memories:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getUserMemoryProfile,
  searchUserMemories,
  indexMessage,
  clearMemories
};
