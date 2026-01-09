const mongoose = require('mongoose');

const MockTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  examType: { type: String, enum: ['JAMB', 'WAEC'], required: true },
  subjectCombination: [{ type: String }], // For JAMB: English + 3 others; For WAEC: subjects chosen
  examId: { type: String, unique: true, sparse: true }, // 12 alphanumeric ID with prefix (J or W)
  lastAttemptDate: { type: Date },
  nextAttemptDate: { type: Date },
  status: { type: String, enum: ['draft', 'in-progress', 'submitted', 'completed'], default: 'draft' },
  startTime: { type: Date },
  endTime: { type: Date },
  submittedAt: { type: Date }, // Explicit submission timestamp for results availability
  totalTime: { type: Number, default: 9900 }, // 2 hours 35 minutes in seconds (JAMB)
  timeRemaining: { type: Number },
  score: { type: Number },
  responses: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'JambQuestion' },
      selectedAnswer: { type: String },
      isBookmarked: { type: Boolean, default: false },
      timeSpent: { type: Number, default: 0 },
    },
  ],
  performanceData: {
    correctCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    bySubject: { type: Map, of: { correct: Number, total: Number }, default: new Map() },
  },
  // Track fullscreen / exam violations and proctor unlock requests
  violations: [
    {
      timestamp: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sessionId: { type: String },
      count: { type: Number },
      note: { type: String },
    },
  ],
  unlockRequests: [
    {
      timestamp: { type: Date, default: Date.now },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sessionId: { type: String },
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      note: { type: String },
    },
  ],
  subjectCombinationChangedDate: { type: Date }, // Last time subject combination was changed
  currentSubject: { type: String },
  completedSubjects: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MockTest', MockTestSchema);
