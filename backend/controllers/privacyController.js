/**
 * Privacy Controller: Manage user privacy and data persistence settings
 */

const ChatHistory = require('../models/ChatHistory');

/**
 * GET /api/privacy/settings - Get current privacy settings for a conversation
 */
async function getPrivacySettings(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      // allow unauthenticated clients to provide a local user id
      userId = req.query.userId || req.body.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.query;
    if (!conversationId) {
      // Return default settings
      return res.json({
        success: true,
        data: {
          storeChatHistory: true,
          allowSemanticIndexing: true,
          allowPIIStorage: false,
          userConsent: false,
          consentDate: null
        }
      });
    }

    const history = await ChatHistory.findOne({ userId, conversationId }).lean();
    if (!history) {
      return res.json({
        success: true,
        data: {
          storeChatHistory: true,
          allowSemanticIndexing: true,
          allowPIIStorage: false,
          userConsent: false,
          consentDate: null
        }
      });
    }

    return res.json({
      success: true,
      data: history.persistenceSettings || {
        storeChatHistory: true,
        allowSemanticIndexing: true,
        allowPIIStorage: false,
        userConsent: false,
        consentDate: null
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching privacy settings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/privacy/settings - Update privacy settings for a conversation
 */
async function updatePrivacySettings(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.body.userId || req.query.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId, settings } = req.body;
    if (!conversationId || !settings) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and settings required'
      });
    }

    // Validate allowed fields
    const allowed = [
      'storeChatHistory',
      'allowSemanticIndexing',
      'allowPIIStorage',
      'userConsent'
    ];
    const filtered = {};
    for (const key of allowed) {
      if (key in settings) {
        filtered[key] = Boolean(settings[key]);
      }
    }

    // Find or create conversation
    let history = await ChatHistory.findOne({ userId, conversationId });
    if (!history) {
      history = new ChatHistory({
        userId,
        conversationId,
        messages: [],
        metadata: { title: null },
        persistenceSettings: {
          storeChatHistory: true,
          allowSemanticIndexing: true,
          allowPIIStorage: false,
          userConsent: false,
          consentDate: null
        }
      });
    }

    // Update settings
    history.persistenceSettings = history.persistenceSettings || {};
    Object.assign(history.persistenceSettings, filtered);

    // If user consented, record the timestamp
    if (filtered.userConsent === true) {
      history.persistenceSettings.consentDate = new Date();
    }

    await history.save();

    return res.json({
      success: true,
      message: 'Privacy settings updated',
      data: history.persistenceSettings
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error updating privacy settings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/privacy/consent - Give explicit consent for data retention and indexing
 */
async function giveConsent(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.body.userId || req.query.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId, consentType = 'all' } = req.body;
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId required'
      });
    }

    let history = await ChatHistory.findOne({ userId, conversationId });
    if (!history) {
      history = new ChatHistory({
        userId,
        conversationId,
        messages: [],
        metadata: { title: null }
      });
    }

    history.persistenceSettings = history.persistenceSettings || {};

    // Consent types: 'history', 'indexing', 'pii', or 'all'
    if (consentType === 'all' || consentType === 'history') {
      history.persistenceSettings.storeChatHistory = true;
    }
    if (consentType === 'all' || consentType === 'indexing') {
      history.persistenceSettings.allowSemanticIndexing = true;
    }
    if (consentType === 'all' || consentType === 'pii') {
      history.persistenceSettings.allowPIIStorage = true;
    }

    history.persistenceSettings.userConsent = true;
    history.persistenceSettings.consentDate = new Date();

    await history.save();

    return res.json({
      success: true,
      message: `Consent given for: ${consentType}`,
      data: history.persistenceSettings
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error recording consent:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/privacy/withdraw-consent - Withdraw consent for data retention
 */
async function withdrawConsent(req, res) {
  try {
    let userId = req.user?._id || req.user?.id;
    if (!userId) {
      userId = req.body.userId || req.query.userId || null;
    }
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId required'
      });
    }

    let history = await ChatHistory.findOne({ userId, conversationId });
    if (!history) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    history.persistenceSettings = history.persistenceSettings || {};
    history.persistenceSettings.userConsent = false;
    history.persistenceSettings.storeChatHistory = false;
    history.persistenceSettings.allowSemanticIndexing = false;
    history.persistenceSettings.allowPIIStorage = false;

    await history.save();

    return res.json({
      success: true,
      message: 'Consent withdrawn',
      data: history.persistenceSettings
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error withdrawing consent:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getPrivacySettings,
  updatePrivacySettings,
  giveConsent,
  withdrawConsent
};
