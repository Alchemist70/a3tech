/**
 * PII Redaction Middleware: Automatically redact PII from messages based on user preferences
 */

const { redactPII, extractNames, getPIISummary } = require('../services/piiRedactionService');
const ChatHistory = require('../models/ChatHistory');

/**
 * Middleware to redact PII from a message before saving
 * Respects user's privacy settings
 */
async function redactBeforeSave(userId, conversationId, message, role) {
  try {
    // Check if user has enabled PII storage
    const history = await ChatHistory.findOne({ userId, conversationId }).lean();
    const allowPII = history?.persistenceSettings?.allowPIIStorage ?? false;
    const allowIndexing = history?.persistenceSettings?.allowSemanticIndexing ?? true;

    // If PII storage is allowed and it's a user message, extract and store name separately
    if (allowPII && role === 'user') {
      // Names will be extracted and stored in metadata
      // Content will NOT be redacted
      return {
        originalMessage: message,
        redactedMessage: message,
        shouldRedact: false,
        extractedData: {}
      };
    }

    // If PII storage NOT allowed, redact sensitive information
    if (!allowPII && role === 'user') {
      const redactionLevel = 'high'; // Default to 'high' for user messages
      const redactedMessage = redactPII(message, redactionLevel);
      const piiSummary = getPIISummary(message);

      return {
        originalMessage: message,
        redactedMessage,
        shouldRedact: piiSummary.hasPII,
        piiDetected: piiSummary,
        extractedData: {}
      };
    }

    // Assistant messages - redact API keys and secrets always
    const assistantRedacted = redactPII(message, 'critical');
    return {
      originalMessage: message,
      redactedMessage: assistantRedacted,
      shouldRedact: assistantRedacted !== message,
      extractedData: {}
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error in redaction middleware:', err.message);
    // On error, return original message
    return {
      originalMessage: message,
      redactedMessage: message,
      shouldRedact: false,
      extractedData: {}
    };
  }
}

/**
 * Function to process and store names from user messages
 * Only stores names if user has given consent
 */
async function processNameFromMessage(userId, conversationId, messageText) {
  try {
    const { extractNames, isValidName, sanitizeName } = require('../services/piiRedactionService');

    // Check user consent for PII storage
    const history = await ChatHistory.findOne({ userId, conversationId });
    if (!history || !history.persistenceSettings?.allowPIIStorage) {
      return null; // Don't extract/store name without consent
    }

    const extractedNames = extractNames(messageText);
    if (extractedNames.length === 0) {
      return null;
    }

    // Take the highest confidence name
    const bestName = extractedNames[0];
    const sanitized = sanitizeName(bestName.value);

    if (sanitized && isValidName(sanitized)) {
      // Store in conversation metadata
      if (!history.metadata) {
        history.metadata = {};
      }
      history.metadata.name = sanitized;
      history.metadata.nameConfidence = bestName.confidence;
      history.metadata.namePattern = bestName.pattern;
      history.metadata.nameExtractedAt = new Date();

      await history.save();
      return {
        success: true,
        name: sanitized,
        confidence: bestName.confidence
      };
    }

    return null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error processing name:', err.message);
    return null;
  }
}

/**
 * Create an audit log entry for PII detection
 * Useful for compliance and debugging
 */
function createPIIAuditLog(userId, conversationId, message, piiSummary, action) {
  return {
    userId,
    conversationId,
    timestamp: new Date(),
    action, // 'redacted', 'detected', 'stored_with_consent'
    piiDetected: piiSummary.hasPII,
    detectionSummary: {
      critical: piiSummary.critical,
      high: piiSummary.high,
      medium: piiSummary.medium
    },
    messageLength: message.length
  };
}

module.exports = {
  redactBeforeSave,
  processNameFromMessage,
  createPIIAuditLog
};
