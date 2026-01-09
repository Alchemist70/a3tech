const mongoose = require('mongoose');

const ViolationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'tab_switch',           // User switched tabs
      'window_blur',          // Window lost focus
      'face_not_detected',    // Face not visible in webcam
      'multiple_faces',       // Multiple people detected
      'suspicious_network',   // Suspicious network request attempted
      'clipboard_access',     // User tried to copy/paste
      'fullscreen_exit',      // User exited fullscreen
      'page_visibility_hidden', // Page hidden event
      'suspicious_request',   // Request to non-whitelisted domain
      'keyboard_shortcut',    // Attempted keyboard shortcut
      'right_click',          // Right-click context menu attempt
      'developer_tools',      // Developer tools open attempt
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  description: String,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed, // Flexible field for additional data
});

const ExamSessionSchema = new mongoose.Schema(
  {
    mockTestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    examType: {
      type: String,
      enum: ['JAMB', 'WAEC'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'suspended', 'terminated'],
      default: 'active',
    },
    proctoring: {
      // Browser environment
      browserName: String,
      browserVersion: String,
      userAgent: String,
      isLockdownBrowser: Boolean,
      isRespondusMonitor: Boolean,
      isFullscreenMode: Boolean,

      // Webcam monitoring
      webcamEnabled: Boolean,
      webcamStartTime: Date,
      faceDetectionFramesAnalyzed: { type: Number, default: 0 },
      faceDetectionAccuracy: { type: Number, default: 0 }, // Percentage 0-100
      webcamInterruptions: { type: Number, default: 0 }, // Times face disappeared
      averageConfidence: { type: Number, default: 0 }, // Average face detection confidence

      // Tab/window monitoring
      tabSwitchAttempts: { type: Number, default: 0 },
      windowBlurEvents: { type: Number, default: 0 },
      fullscreenExitAttempts: { type: Number, default: 0 },
      pageVisibilityHiddenEvents: { type: Number, default: 0 },

      // Network monitoring
      suspiciousRequestsBlocked: { type: Number, default: 0 },
      externalDomainAccessAttempts: { type: Number, default: 0 },
      whitelistedDomainsAccessed: [String],
      blockedDomainsAttempted: [String],

      // Keyboard monitoring
      keyboardShortcutAttempts: { type: Number, default: 0 },
      rightClickAttempts: { type: Number, default: 0 },
      developerToolsAttempts: { type: Number, default: 0 },
    },
    violations: [ViolationSchema],
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      description: 'Overall risk assessment (0-100)',
    },
    flagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flagReason: String,
    startTime: { type: Date, required: true },
    endTime: Date,
    duration: { type: Number, default: 0 }, // In seconds
    heartbeatLastReceived: { type: Date, required: true },
    heartbeatMissedCount: { type: Number, default: 0, max: 3 },

    // IP tracking
    startingIpAddress: String,
    currentIpAddress: String,
    ipChanges: [
      {
        oldIp: String,
        newIp: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Exam performance integrity
    suspiciousAnswerPatterns: Boolean,
    exactAnswerMatches: { type: Number, default: 0 }, // How many answers match other sessions
    averageResponseTime: { type: Number, default: 0 }, // In milliseconds
    unusualResponseTimes: { type: Number, default: 0 }, // Flagged unusual response times
    // Delay processing flags
    delayedResultProcessing: { type: Boolean, default: false },
    resultProcessingDelayedUntil: Date,
  },
  { timestamps: true }
);

// Index for finding sessions by user and mock test
ExamSessionSchema.index({ userId: 1, mockTestId: 1 });
ExamSessionSchema.index({ sessionId: 1 });
ExamSessionSchema.index({ flagged: 1, examType: 1 });
ExamSessionSchema.index({ createdAt: -1 });

// Virtual for calculating risk score
ExamSessionSchema.virtual('riskScoreCalculated').get(function () {
  let score = 0;

  // Tab switches (each = 10 points)
  score += Math.min(this.proctoring.tabSwitchAttempts * 10, 30);

  // Window blur events (each = 5 points)
  score += Math.min(this.proctoring.windowBlurEvents * 5, 25);

  // Face detection issues (each = 15 points)
  score += Math.min(this.proctoring.webcamInterruptions * 15, 40);

  // Suspicious network requests (each = 20 points)
  score += Math.min(this.proctoring.suspiciousRequestsBlocked * 20, 35);

  // Developer tools attempts (each = 25 points)
  score += Math.min(this.proctoring.developerToolsAttempts * 25, 50);

  // Violations count (each = 5 points)
  score += Math.min(this.violations.length * 5, 20);

  // Not using lockdown browser (30 points)
  if (!this.proctoring.isLockdownBrowser && !this.proctoring.isRespondusMonitor) {
    score += 30;
  }

  return Math.min(score, 100);
});

module.exports = mongoose.model('ExamSession', ExamSessionSchema);
