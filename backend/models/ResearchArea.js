const mongoose = require('mongoose');

const ResearchAreaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

ResearchAreaSchema.index({ order: 1 });

module.exports = mongoose.model('ResearchArea', ResearchAreaSchema);
