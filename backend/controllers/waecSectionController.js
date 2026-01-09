const WaecSection = require('../models/WaecSection');

// Get all WAEC sections
exports.getSections = async (req, res) => {
  try {
    const sections = await WaecSection.find();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch WAEC sections', error: err });
  }
};

// Add a new WAEC section
exports.addSection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const section = new WaecSection({ name, slug });
    await section.save();
    res.status(201).json(section);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-section', id: section._id, text: [section.name, section.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after addWaecSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to add WAEC section', error: err });
  }
};

// Update a WAEC section
exports.updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const section = await WaecSection.findByIdAndUpdate(id, { name, slug }, { new: true });
    if (!section) return res.status(404).json({ message: 'WAEC section not found' });
    res.json(section);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'waec-section', id: section._id, text: [section.name, section.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateWaecSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to update WAEC section', error: err });
  }
};

// Delete a WAEC section
exports.deleteSection = async (req, res) => {
  try {
    const { id } = req.params;
    const section = await WaecSection.findByIdAndDelete(id);
    if (!section) return res.status(404).json({ message: 'WAEC section not found' });
    res.json({ message: 'WAEC section deleted' });
    try { require('../services/ragService').removeDoc('waec-section', id).catch(e => console.warn('[RAG] removeDoc failed after deleteWaecSection', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete WAEC section', error: err });
  }
};
