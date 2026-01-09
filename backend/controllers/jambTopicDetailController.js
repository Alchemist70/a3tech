const JambTopicDetail = require('../models/JambTopicDetail');

// GET all JAMB topic details
exports.getAllTopicDetails = async (req, res) => {
  try {
    const docs = await JambTopicDetail.find({}).sort({ createdAt: -1 }).lean();
    res.json(docs);
  } catch (err) {
    console.error('getAllJambTopicDetails error', err);
    res.status(500).json({ error: 'Failed to fetch JAMB topic details' });
  }
};

// GET single JAMB topic detail
exports.getTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await JambTopicDetail.findById(id).lean();
    if (!topic) return res.status(404).json({ message: 'JAMB topic detail not found' });
    res.json(topic);
  } catch (err) {
    console.error('getJambTopicDetail error', err);
    res.status(500).json({ error: 'Failed to fetch JAMB topic detail' });
  }
};

// POST create JAMB topic detail
exports.createTopicDetail = async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = new JambTopicDetail(payload);
    await doc.save();
    res.status(201).json(doc);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-topic-detail', id: doc._id, text: [doc.description, doc.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createJambTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('createJambTopicDetail error', err);
    res.status(500).json({ error: 'Failed to create JAMB topic detail' });
  }
};

// PUT update JAMB topic detail
exports.updateTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const updated = await JambTopicDetail.findByIdAndUpdate(id, payload, { new: true, runValidators: false }).lean();
    if (!updated) return res.status(404).json({ message: 'JAMB topic detail not found' });
    res.json(updated);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-topic-detail', id: updated._id, text: [updated.description, updated.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateJambTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('updateJambTopicDetail error', err);
    res.status(500).json({ error: 'Failed to update JAMB topic detail' });
  }
};

// DELETE JAMB topic detail
exports.deleteTopicDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await JambTopicDetail.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'JAMB topic detail not found' });
    res.json({ message: 'Deleted' });
    try { require('../services/ragService').removeDoc('jamb-topic-detail', id).catch(e => console.warn('[RAG] removeDoc failed after deleteJambTopicDetail', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('deleteJambTopicDetail error', err);
    res.status(500).json({ error: 'Failed to delete JAMB topic detail' });
  }
};
