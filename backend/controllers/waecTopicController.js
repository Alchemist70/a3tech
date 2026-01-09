const WaecTopic = require('../models/WaecTopic');

// Get all WAEC topics
exports.getTopics = async (req, res) => {
  try {
    const topics = await WaecTopic.find().sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch WAEC topics', error: err });
  }
};

// Get single WAEC topic
exports.getTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await WaecTopic.findById(id);
    if (!topic) return res.status(404).json({ message: 'WAEC topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch WAEC topic', error: err });
  }
};

// Add a new WAEC topic
exports.addTopic = async (req, res) => {
  try {
    const { name, slug, sectionId, uuid } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    // Ensure a UUID exists server-side so clients don't need to rely solely on optimistic writes
    const uuidToUse = uuid || (typeof require === 'function' ? require('crypto').randomUUID() : undefined);
    const topic = new WaecTopic({ name, slug, sectionId, uuid: uuidToUse });
    await topic.save();
    res.status(201).json(topic);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-topic', id: topic._id, text: [topic.name, topic.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after addWaecTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('[WAEC Topic] addTopic error:', err?.message || err);
    res.status(500).json({ message: 'Failed to add WAEC topic', error: err?.message || err });
  }
};

// Update a WAEC topic
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, content, sectionId, uuid } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    const updateObj = { name, slug, content, sectionId };
    if (uuid) updateObj.uuid = uuid;
    const topic = await WaecTopic.findByIdAndUpdate(id, updateObj, { new: true });
    if (!topic) return res.status(404).json({ message: 'WAEC topic not found' });
    res.json(topic);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-topic', id: topic._id, text: [topic.name, topic.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateWaecTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('[WAEC Topic] updateTopic error:', err?.message || err);
    res.status(500).json({ message: 'Failed to update WAEC topic', error: err?.message || err });
  }
};

// Delete a WAEC topic
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await WaecTopic.findByIdAndDelete(id);
    if (!topic) return res.status(404).json({ message: 'WAEC topic not found' });
    res.json({ message: 'WAEC topic deleted' });
    try { require('../services/ragService').removeDoc('waec-topic', id).catch(e => console.warn('[RAG] removeDoc failed after deleteWaecTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete WAEC topic', error: err });
  }
};
