const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  title: String,
  headers: [String],
  rows: [[String]],
  description: String,
  rowExplanations: [String],
}, { _id: false });

const ChartSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['bar', 'pie', 'histogram', 'line'], default: 'bar' },
  labels: [String],
  labelExplanations: [String],
  labelFormat: { type: String, enum: ['percentage', 'degrees'], default: 'percentage' },
  datasets: [{
    label: String,
    data: [Number],
    backgroundColor: mongoose.Schema.Types.Mixed, // string or [string]
    borderColor: mongoose.Schema.Types.Mixed, // string or [string]
  }],
  description: String,
}, { _id: false });

const ImageSchema = new mongoose.Schema({
  type: { type: String, enum: ['url', 'blob'], default: 'url' }, // 'url' for external link, 'blob' for uploaded
  data: mongoose.Schema.Types.Mixed, // string URL or binary data for BLOB
  mimeType: String, // e.g., 'image/jpeg', 'image/png'
  size: Number, // size in bytes
}, { _id: false });

const JambQuestionSchema = new mongoose.Schema({
  subject: { type: String, required: true }, // e.g., "English Language", "Mathematics", "Physics", "Chemistry", "Biology", etc.
  questionText: { type: String, required: true },
  questionNumber: { type: Number }, // Sequence in the subject
  options: [
    {
      label: { type: String }, // A, B, C, D
      text: { type: String, required: true },
    },
  ],
  correctAnswer: { type: String, required: true }, // A, B, C, or D
  explanation: { type: String }, // Explanation of the answer
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tables: [TableSchema], // Array of tables (similar to TopicDetail quizzes)
  charts: [ChartSchema], // Array of charts (similar to TopicDetail quizzes)
  images: [ImageSchema], // Array of images (can be URLs or BLOBs)
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient subject filtering and shuffling
JambQuestionSchema.index({ subject: 1, isActive: 1 });

module.exports = mongoose.model('JambQuestion', JambQuestionSchema);
