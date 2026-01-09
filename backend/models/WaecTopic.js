const mongoose = require('mongoose');

const WaecTopicSchema = new mongoose.Schema({
  sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WaecSection', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String },
  uuid: { type: String, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WaecTopic', WaecTopicSchema);
