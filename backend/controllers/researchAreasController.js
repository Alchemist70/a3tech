const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const ResearchArea = require('../models/ResearchArea');

const areasPath = path.join(__dirname, '..', 'data', 'researchAreas.json');
const ensureAreasFile = () => {
  try {
    const dir = path.dirname(areasPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(areasPath)) fs.writeFileSync(areasPath, JSON.stringify([]));
  } catch (e) { }
};
const readFileAreas = () => {
  try {
    ensureAreasFile();
    const raw = fs.readFileSync(areasPath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
};
const writeFileAreas = (arr) => {
  try { ensureAreasFile(); fs.writeFileSync(areasPath, JSON.stringify(arr, null, 2)); return true; } catch (e) { return false; }
};

const listAreas = async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const docs = await ResearchArea.find({}).sort({ order: 1, title: 1 }).lean();
      if (Array.isArray(docs) && docs.length > 0) return res.json({ success: true, data: docs });
      // seed from file if file present
      const file = readFileAreas();
      if (Array.isArray(file) && file.length > 0) {
        const created = [];
        for (let i = 0; i < file.length; i++) {
          try {
            const f = file[i];
            const exists = await ResearchArea.findOne({ title: f.title || f.name });
            if (!exists) {
              const c = await ResearchArea.create({ title: f.title || f.name, description: f.description || '', order: typeof f.order === 'number' ? f.order : i });
              created.push(c);
            }
          } catch (e) { }
        }
        const docs2 = await ResearchArea.find({}).sort({ order: 1, title: 1 }).lean();
        return res.json({ success: true, data: docs2 });
      }
      return res.json({ success: true, data: docs });
    }
    // file fallback
    const file = readFileAreas();
    return res.json({ success: true, data: file });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load research areas' });
  }
};

const createArea = async (req, res) => {
  try {
    const title = (req.body && req.body.title) ? String(req.body.title).trim() : '';
    const description = (req.body && req.body.description) ? String(req.body.description) : '';
    const order = typeof req.body.order === 'number' ? req.body.order : 0;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      const exists = await ResearchArea.findOne({ title: new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$','i') });
      if (exists) return res.status(409).json({ success: false, message: 'Research area already exists', data: exists });
      const created = await ResearchArea.create({ title, description, order });
      try { require('../services/ragService').addOrUpdateDoc({ source: 'research-area', id: created._id, text: [created.title, created.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after createArea', e && e.message ? e.message : e)); } catch (e) {}
      return res.status(201).json({ success: true, data: created });
    }
    const file = readFileAreas();
    const id = Math.random().toString(36).slice(2,10);
    const obj = { _id: id, title, description, order };
    file.push(obj);
    if (!writeFileAreas(file)) return res.status(500).json({ success: false, message: 'Failed to persist research area' });
    return res.status(201).json({ success: true, data: obj });
  } catch (e) { return res.status(500).json({ success: false, message: 'Error creating research area' }); }
};

const updateArea = async (req, res) => {
  try {
    const id = req.params.id;
    const title = (req.body && req.body.title) ? String(req.body.title).trim() : '';
    const description = (req.body && req.body.description) ? String(req.body.description) : '';
    const order = typeof req.body.order === 'number' ? req.body.order : undefined;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      let doc = null;
      if (/^[a-fA-F0-9]{24}$/.test(String(id))) doc = await ResearchArea.findById(id);
      if (!doc) doc = await ResearchArea.findOne({ title: id });
      if (!doc) return res.status(404).json({ success: false, message: 'Research area not found' });
      doc.title = title;
      doc.description = description;
      if (typeof order === 'number') doc.order = order;
      await doc.save();
      try { require('../services/ragService').addOrUpdateDoc({ source: 'research-area', id: doc._id, text: [doc.title, doc.description || ''].filter(Boolean).join('\n') }).catch(e => console.warn('[RAG] addOrUpdateDoc failed after updateArea', e && e.message ? e.message : e)); } catch (e) {}
      return res.json({ success: true, data: doc });
    }
    const file = readFileAreas();
    const idx = file.findIndex(f => String(f._id) === String(id) || String(f.title) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Research area not found' });
    file[idx] = { ...file[idx], title, description, ...(typeof order === 'number' ? { order } : {}) };
    if (!writeFileAreas(file)) return res.status(500).json({ success: false, message: 'Failed to persist research area' });
    return res.json({ success: true, data: file[idx] });
  } catch (e) { return res.status(500).json({ success: false, message: 'Error updating research area' }); }
};

const deleteArea = async (req, res) => {
  try {
    const id = req.params.id;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      let doc = null;
      if (/^[a-fA-F0-9]{24}$/.test(String(id))) doc = await ResearchArea.findById(id);
      if (!doc) doc = await ResearchArea.findOne({ title: id });
      if (!doc) return res.status(404).json({ success: false, message: 'Research area not found' });
      await ResearchArea.deleteOne({ _id: doc._id });
      return res.json({ success: true, data: doc });
    }
    const file = readFileAreas();
    const idx = file.findIndex(f => String(f._id) === String(id) || String(f.title) === String(id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Research area not found' });
    const removed = file.splice(idx, 1)[0];
    if (!writeFileAreas(file)) return res.status(500).json({ success: false, message: 'Failed to persist research area' });
    try { require('../services/ragService').removeDoc('research-area', removed._id).catch(e => console.warn('[RAG] removeDoc failed after deleteArea', e && e.message ? e.message : e)); } catch (e) {}
    return res.json({ success: true, data: removed });
  } catch (e) { return res.status(500).json({ success: false, message: 'Error deleting research area' }); }
};

const reorderAreas = async (req, res) => {
  try {
    const { orderedIds } = req.body || {};
    if (!Array.isArray(orderedIds)) return res.status(400).json({ success: false, message: 'orderedIds array required' });
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Update order for each id present in DB
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (/^[a-fA-F0-9]{24}$/.test(String(id))) {
          await ResearchArea.findByIdAndUpdate(id, { order: i });
        }
      }
      return res.json({ success: true });
    }
    const file = readFileAreas();
    const map = new Map();
    orderedIds.forEach((id, idx) => map.set(String(id), idx));
    for (let i = 0; i < file.length; i++) {
      const key = String(file[i]._id || file[i].title);
      if (map.has(key)) file[i].order = map.get(key);
    }
    if (!writeFileAreas(file)) return res.status(500).json({ success: false, message: 'Failed to persist order' });
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ success: false, message: 'Error reordering research areas' }); }
};

module.exports = {
  listAreas,
  createArea,
  updateArea,
  deleteArea,
  reorderAreas
};
