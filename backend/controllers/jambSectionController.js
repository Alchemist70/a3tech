const JambSection = require('../models/JambSection');

// Get all JAMB sections
exports.getSections = async (req, res) => {
  try {
    const sections = await JambSection.find();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch JAMB sections', error: err });
  }
};

// Add a new JAMB section
exports.addSection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const section = new JambSection({ name, slug });
    await section.save();
    res.status(201).json(section);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-section', id: section._id, text: [section.name, section.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after addJambSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to add JAMB section', error: err });
  }
};

// Update a JAMB section
exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const section = await JambSection.findByIdAndUpdate(id, { name, slug }, { new: true });
    if (!section) return res.status(404).json({ message: 'JAMB section not found' });
    res.json(section);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'jamb-section', id: section._id, text: [section.name, section.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateJambSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to update JAMB section', error: err });
  }
};

// Delete a JAMB section
exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await JambSection.findByIdAndDelete(id);
    if (!section) return res.status(404).json({ message: 'JAMB section not found' });
    res.json({ message: 'JAMB section deleted' });
    try { require('../services/ragService').removeDoc('jamb-section', id).catch(e => console.warn('[RAG] removeDoc failed after deleteJambSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete JAMB section', error: err });
  }
};
