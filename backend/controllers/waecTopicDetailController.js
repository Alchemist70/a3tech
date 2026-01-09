const WaecTopicDetail = require('../models/WaecTopicDetail');

// GET all WAEC topic details
exports.getAllTopicDetails = async (req, res) => {
  try {
    const docs = await WaecTopicDetail.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error('getAllWaecTopicDetails error', err);
    res.status(500).json({ error: 'Failed to fetch WAEC topic details' });
  }
};

// GET single WAEC topic detail
exports.getTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await WaecTopicDetail.findById(id).lean();
    if (!topic) return res.status(404).json({ message: 'WAEC topic detail not found' });
    res.json(topic);
  } catch (err) {
    console.error('getWaecTopicDetail error', err);
    res.status(500).json({ error: 'Failed to fetch WAEC topic detail' });
  }
};

// POST create WAEC topic detail
exports.createTopicDetail = async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = new WaecTopicDetail(payload);
    await doc.save();
    res.status(201).json(doc);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-topic-detail', id: doc._id, text: [doc.description, doc.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createWaecTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('createWaecTopicDetail error', err);
    res.status(500).json({ error: 'Failed to create WAEC topic detail' });
  }
};

// PUT update WAEC topic detail
exports.updateTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await WaecTopicDetail.findByIdAndUpdate(id, payload, { new: true, runValidators: false }).lean();
    if (!updated) return res.status(404).json({ message: 'WAEC topic detail not found' });
    res.json(updated);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-topic-detail', id: updated._id, text: [updated.description, updated.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateWaecTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('updateWaecTopicDetail error', err);
    res.status(500).json({ error: 'Failed to update WAEC topic detail' });
  }
};

// DELETE WAEC topic detail
exports.deleteTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await WaecTopicDetail.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'WAEC topic detail not found' });
    res.json({ message: 'Deleted' });
    try { require('../services/ragService').removeDoc('waec-topic-detail', id).catch(e => console.warn('[RAG] removeDoc failed after deleteWaecTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('deleteWaecTopicDetail error', err);
    res.status(500).json({ error: 'Failed to delete WAEC topic detail' });
  }
};
