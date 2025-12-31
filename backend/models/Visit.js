const mongoose = require('mongoose');

// Track simple visit counts per ip+fingerprint per section (projects, topics, blogs, faqs)
const VisitSchema = new mongoose.Schema({
  ip: { type: String, required: true, index: true },
  fingerprint: { type: String, required: false, index: true },
  counts: {
    projects: { type: Number, default: 0 },
    topics: { type: Number, default: 0 },
    blogs: { type: Number, default: 0 },
    faqs: { type: Number, default: 0 }
  },
  lastSeen: { type: Date, default: Date.now }
});

VisitSchema.methods.increment = function(section) {
  if (!this.counts[section] && this.counts[section] !== 0) this.counts[section] = 0;
  this.counts[section] = (this.counts[section] || 0) + 1;
  this.lastSeen = new Date();
  return this.save();
};

module.exports = mongoose.model('Visit', VisitSchema);
