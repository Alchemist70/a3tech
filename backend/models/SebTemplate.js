const mongoose = require('mongoose');

const SebTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  // Freeform XML template; may contain placeholders like {{START_URL}} etc.
  templateXml: { type: String, required: true },
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SebTemplateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SebTemplate', SebTemplateSchema);
