const JambTopic = require('../models/JambTopic');

// Get all JAMB topics
exports.getTopics = async (req, res) => {
  try {
    const topics = await JambTopic.find().sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch JAMB topics', error: err });
  }
};

// Get single JAMB topic
exports.getTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await JambTopic.findById(id);
    if (!topic) return res.status(404).json({ message: 'JAMB topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch JAMB topic', error: err });
  }
};

// Add a new JAMB topic
exports.addTopic = async (req, res) => {
  try {
    const { name, slug, sectionId, uuid } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    const uuidToUse = uuid || (typeof require === 'function' ? require('crypto').randomUUID() : undefined);
    const topic = new JambTopic({ name, slug, sectionId, uuid: uuidToUse });
    await topic.save();
    res.status(201).json(topic);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-topic', id: topic._id, text: [topic.name, topic.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after addJambTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('[JAMB Topic] addTopic error:', err?.message || err);
    res.status(500).json({ message: 'Failed to add JAMB topic', error: err?.message || err });
  }
};

// Update a JAMB topic
exports.updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, content, sectionId, uuid } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    if (!slug) return res.status(400).json({ message: 'Slug is required' });
    const updateObj = { name, slug, content, sectionId };
    if (uuid) updateObj.uuid = uuid;
    const topic = await JambTopic.findByIdAndUpdate(id, updateObj, { new: true });
    if (!topic) return res.status(404).json({ message: 'JAMB topic not found' });
    res.json(topic);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-topic', id: topic._id, text: [topic.name, topic.content || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateJambTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    console.error('[JAMB Topic] updateTopic error:', err?.message || err);
    res.status(500).json({ message: 'Failed to update JAMB topic', error: err?.message || err });
  }
};

// Delete a JAMB topic
exports.deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const topic = await JambTopic.findByIdAndDelete(id);
    if (!topic) return res.status(404).json({ message: 'JAMB topic not found' });
    res.json({ message: 'JAMB topic deleted' });
    try { require('../services/ragService').removeDoc('jamb-topic', id).catch(e => console.warn('[RAG] removeDoc failed after deleteJambTopic', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete JAMB topic', error: err });
  }
};
