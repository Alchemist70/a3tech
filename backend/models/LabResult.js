const mongoose = require('mongoose');

const LabResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  labTitle: { type: String, required: true },
  subject: { type: String, enum: ['Chemistry', 'Physics', 'Biology'], required: true },
  
  // Experiment data storage
  experimentData: {
    measurements: [
      {
        name: String,
        value: mongoose.Schema.Types.Mixed,
        unit: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    observations: String,
    notes: String,
    images: [String] // URLs to uploaded images
  },

  // Results and calculations
  results: {
    calculatedValues: mongoose.Schema.Types.Mixed,
    expectedValues: mongoose.Schema.Types.Mixed,
    errors: mongoose.Schema.Types.Mixed,
    graphData: mongoose.Schema.Types.Mixed
  },

  // Scoring information
  scoring: {
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 100 },
    accuracy: { type: Number, default: 0 }, // Percentage match with expected results
    procedureFollowed: { type: Number, default: 0, min: 0, max: 100 },
    dataQuality: { type: Number, default: 0, min: 0, max: 100 },
    reportQuality: { type: Number, default: 0, min: 0, max: 100 },
    grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
    feedback: String
  },

  // Report information
  report: {
    htmlContent: String,
    pdfUrl: String,
    generatedAt: Date
  },

  // Timestamps
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  submittedAt: Date,
  gradedAt: Date,

  // Status
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'submitted', 'graded'],
    default: 'in-progress'
  },

  uuid: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabResult', LabResultSchema);
