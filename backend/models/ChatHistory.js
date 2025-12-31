const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId (authenticated users) and String (unauthenticated users)
    required: true,
    index: true
  },
  conversationId: {
    type: String,
    default: null,
    index: true
  },
  messages: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  metadata: {
    title: { type: String, default: null },
    summary: { type: String, default: null },
    name: { type: String, default: null },
    nameConfidence: { type: Number, default: null },
    namePattern: { type: String, default: null },
    nameExtractedAt: { type: Date, default: null },
    pendingPIIConsent: { type: Boolean, default: false }
  },
  // Opt-in flags for privacy control
  persistenceSettings: {
    storeChatHistory: {
      type: Boolean,
      default: true,
      description: 'Whether to store this conversation history'
    },
    allowSemanticIndexing: {
      type: Boolean,
      default: true,
      description: 'Whether to index messages for semantic recall'
    },
    allowPIIStorage: {
      type: Boolean,
      default: false,
      description: 'Whether to allow storage of PII (names, emails, etc.)'
    },
    userConsent: {
      type: Boolean,
      default: false,
      description: 'Explicit user consent for data retention'
    },
    consentDate: {
      type: Date,
      default: null,
      description: 'When user gave consent'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update timestamp on save
ChatHistorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient query by userId and createdAt
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
