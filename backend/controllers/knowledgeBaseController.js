const Subject = require('../models/Subject');

// Get all subjects
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects', error: err });
  }
};

// Add a new subject
exports.addSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const subject = new Subject({ name, slug });
    await subject.save();
    res.status(201).json(subject);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'subject', id: subject._id, text: [subject.name, subject.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after addSubject', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to add subject', error: err });
  }
};

// Update a subject
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const subject = await Subject.findByIdAndUpdate(id, { name, slug }, { new: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
    try { require('../services/ragService').addOrUpdateDoc({ source: 'subject', id: subject._id, text: [subject.name, subject.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateSubject', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subject', error: err });
  }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
    try { require('../services/ragService').removeDoc('subject', id).catch(e => console.warn('[RAG] removeDoc failed after deleteSubject', e && e.message ? e.message : e)); } catch (e) {}
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete subject', error: err });
  }
};
