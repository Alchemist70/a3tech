const ChatHistory = require('../models/ChatHistory');

// ============================================================================
// RETENTION POLICY: Auto-delete conversations older than CHAT_HISTORY_TTL days
// ============================================================================
const CHAT_HISTORY_TTL_DAYS = parseInt(process.env.CHAT_HISTORY_TTL_DAYS || '90'); // Default: 90 days

/**
 * Cleanup expired chat histories (call periodically or on-demand)
 * Deletes conversations older than CHAT_HISTORY_TTL_DAYS
 */
async function cleanupExpiredHistories() {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CHAT_HISTORY_TTL_DAYS);
    
    const result = await ChatHistory.deleteMany({ updatedAt: { $lt: cutoffDate } });
    // eslint-disable-next-line no-console
    console.log(`[ChatHistory Cleanup] Deleted ${result.deletedCount} expired conversation(s).`);
    return { success: true, deletedCount: result.deletedCount };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ChatHistory Cleanup] Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize cleanup task: run cleanup every 24 hours
 */
function initializeRetentionPolicy() {
  // Run cleanup once at startup
  cleanupExpiredHistories();
  
  // Schedule recurring cleanup every 24 hours
  const intervalMs = 24 * 60 * 60 * 1000;
  setInterval(() => {
    cleanupExpiredHistories();
  }, intervalMs);
  
  // eslint-disable-next-line no-console
  console.log(`[ChatHistory] Retention policy initialized (TTL: ${CHAT_HISTORY_TTL_DAYS} days, cleanup every 24h)`);
}

// Get chat history for the authenticated user
async function getChatHistory(req, res) {
  try {
      // Accept user id from multiple possible client sources for robustness
      let userId = req.user?._id || req.user?.id;
      if (!userId) {
        userId = req.query.userId || req.body.userId || req.body.userID || req.body.clientId || req.headers['x-user-id'] || req.headers['x-client-id'] || null;
      }
      if (!userId) {
        // eslint-disable-next-line no-console
        console.warn('Unauthorized getChatHistory request; req.user:', req.user);
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { conversationId, limit = 10, offset = 0 } = req.query;
    let query = { userId };
    if (conversationId) {
      query.conversationId = conversationId;
    }

    const total = await ChatHistory.countDocuments(query);
    const histories = await ChatHistory.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 10)
      .lean();

    return res.json({
      success: true,
      data: histories,
      pagination: { total, offset: parseInt(offset) || 0, limit: parseInt(limit) || 10 }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching chat history:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Get a specific conversation
async function getConversation(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      // For testing: allow retrieving without auth using userId query param
      userId = req.query.userId || null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'conversationId required' });
    }

    const history = await ChatHistory.findOne({ userId, conversationId }).lean();
    if (!history) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    return res.json({ success: true, data: history });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching conversation:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Save a message to chat history
async function saveChatMessage(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      // For testing: allow saving without auth, using a test user ID
      const testUserId = req.body.userId || null;
      if (!testUserId) {
        // eslint-disable-next-line no-console
        console.warn('saveChatMessage: no userId (req.user=%j)', req.user);
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      // Proceed with testUserId for testing
      const { conversationId, role, content, title } = req.body;
      if (!conversationId || !role || !content) {
        return res.status(400).json({ success: false, error: 'conversationId, role, content required' });
      }

      let history = await ChatHistory.findOne({ userId: testUserId, conversationId });
      if (!history) {
        history = new ChatHistory({
          userId: testUserId,
          conversationId,
          messages: [],
          metadata: { title: title || null }
        });
      }
      history.messages.push({ role, content, timestamp: new Date() });
      await history.save();
      return res.json({ success: true, data: history });
    }

    // Normal authenticated path
    const { conversationId, role, content, title } = req.body;
    if (!conversationId || !role || !content) {
      return res.status(400).json({ success: false, error: 'conversationId, role, content required' });
    }

    // Find or create conversation
    let history = await ChatHistory.findOne({ userId, conversationId });
    if (!history) {
      history = new ChatHistory({
        userId,
        conversationId,
        messages: [],
        metadata: { title: title || null }
      });
    }

    // Append message
    history.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    await history.save();
    return res.json({ success: true, data: history });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error saving chat message:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// Get recent messages from a conversation (for context in LLM)
async function getRecentContext(userId, conversationId, limit = 10) {
  try {
    if (!userId) return []; // Silently return empty for unauthenticated users
    const history = await ChatHistory.findOne({ userId, conversationId }).lean();
    if (!history || !history.messages) return [];
    // Return last N messages
    return history.messages.slice(-limit).map(m => ({
      role: m.role,
      content: m.content
    }));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching recent context:', err);
    return [];
  }
}

// ============================================================================
// EXPORT ENDPOINT: Download user's chat history as JSON
// ============================================================================
async function exportChatHistory(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.query.userId || req.body.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Fetch all conversations for this user
    const histories = await ChatHistory.find({ userId }).lean();
    if (!histories || histories.length === 0) {
      return res.status(404).json({ success: false, error: 'No chat history found' });
    }

    // Build export payload with metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      totalConversations: histories.length,
      conversations: histories.map(h => ({
        conversationId: h.conversationId,
        createdAt: h.createdAt,
        updatedAt: h.updatedAt,
        metadata: h.metadata,
        messageCount: h.messages ? h.messages.length : 0,
        messages: h.messages || []
      }))
    };

    // Send as downloadable JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-history-${Date.now()}.json"`);
    return res.send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error exporting chat history:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// DELETE ENDPOINT: Delete a specific conversation
// ============================================================================
async function deleteConversation(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.query.userId || req.body.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    if (!conversationId) {
      return res.status(400).json({ success: false, error: 'conversationId required' });
    }

    // Verify ownership before deleting
    const history = await ChatHistory.findOne({ userId, conversationId });
    if (!history) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    await ChatHistory.deleteOne({ userId, conversationId });
    return res.json({ success: true, message: `Conversation '${conversationId}' deleted` });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error deleting conversation:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// DELETE ALL ENDPOINT: Delete all conversations for the user
// ============================================================================
async function deleteAllConversations(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.query.userId || req.body.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Require confirmation via body parameter to prevent accidental deletion
    const { confirmed } = req.body;
    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Deletion not confirmed. Send { confirmed: true } to proceed.'
      });
    }

    const result = await ChatHistory.deleteMany({ userId });
    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} conversation(s)`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error deleting all conversations:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================================
// CLEANUP STATUS ENDPOINT: Get retention policy status and cleanup schedule
// ============================================================================
async function getCleanupStatus(req, res) {
  try {
    // Check if user is admin (optional; for now allow all authenticated users)
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CHAT_HISTORY_TTL_DAYS);

    // Count expired vs. active histories
    const expiredCount = await ChatHistory.countDocuments({ updatedAt: { $lt: cutoffDate } });
    const activeCount = await ChatHistory.countDocuments({ updatedAt: { $gte: cutoffDate } });

    return res.json({
      success: true,
      retentionPolicy: {
        ttlDays: CHAT_HISTORY_TTL_DAYS,
        cutoffDate: cutoffDate.toISOString(),
        cleanupSchedule: 'Every 24 hours',
        expiredCount,
        activeCount
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching cleanup status:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getChatHistory,
  getConversation,
  saveChatMessage,
  getRecentContext,
  exportChatHistory,
  deleteConversation,
  deleteAllConversations,
  getCleanupStatus,
  cleanupExpiredHistories,
  initializeRetentionPolicy
};
