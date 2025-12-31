const TopicDetail = require('../models/TopicDetail');

// GET /api/topic-details
exports.getAllTopicDetails = async (req, res) => {
  try {
    const docs = await TopicDetail.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error('getAllTopicDetails error', err);
    res.status(500).json({ error: 'Failed to fetch topic details' });
  }
};

// GET /api/topic-details/:id
exports.getTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await TopicDetail.findById(id).lean();
    if (!topic) return res.status(404).json({ message: 'Topic detail not found' });
    res.json(topic);
  } catch (err) {
    console.error('getTopicDetail error', err);
    res.status(500).json({ error: 'Failed to fetch topic detail' });
  }
};

// POST /api/topic-details
exports.createTopicDetail = async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = new TopicDetail(payload);
    await doc.save();
    res.status(201).json(doc);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'topic-detail', id: doc._id, text: [doc.title, doc.body || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('createTopicDetail error', err);
    res.status(500).json({ error: 'Failed to create topic detail' });
  }
};

// PUT /api/topic-details/:id
exports.updateTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await TopicDetail.findByIdAndUpdate(id, payload, { new: true, runValidators: false }).lean();
    if (!updated) return res.status(404).json({ message: 'Topic detail not found' });
    res.json(updated);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'topic-detail', id: updated._id, text: [updated.title, updated.body || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('updateTopicDetail error', err);
    res.status(500).json({ error: 'Failed to update topic detail' });
  }
};

// DELETE /api/topic-details/:id
exports.deleteTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await TopicDetail.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Topic detail not found' });
    res.json({ message: 'Deleted' });
    try { require('../services/ragService').removeDoc('topic-detail', id).catch(e => console.warn('[RAG] removeDoc failed after deleteTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('deleteTopicDetail error', err);
    res.status(500).json({ error: 'Failed to delete topic detail' });
  }
};
