const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
  subject: { type: String, enum: ['Chemistry', 'Physics', 'Biology'], required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  objectives: { type: [String], default: [] },
  materials: { type: [String], default: [] },
  procedure: { type: String },
  precautions: { type: [String], default: [] },
  observations: { type: String },
  calculations: { type: String },
  resultTemplate: { type: String },
  simulationContent: { type: String },
  images: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  uuid: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lab', LabSchema);
