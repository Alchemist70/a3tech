const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjectId: { type: String },
  slug: { type: String, required: true, unique: true },
  content: { type: String },
  uuid: { type: String, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Topic', TopicSchema);
