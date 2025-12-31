const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Category = require('../models/Category');

const categoriesPath = path.join(__dirname, '..', 'data', 'projectCategories.json');

const ensureCategoriesFile = () => {
  try {
    const dir = path.dirname(categoriesPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(categoriesPath)) fs.writeFileSync(categoriesPath, JSON.stringify([]));
  } catch (e) {
    // ignore
  }
};

const readFileCategories = () => {
  try {
    ensureCategoriesFile();
    const raw = fs.readFileSync(categoriesPath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const writeFileCategories = (arr) => {
  try {
    ensureCategoriesFile();
    fs.writeFileSync(categoriesPath, JSON.stringify(arr, null, 2));
    return true;
  } catch (e) {
    return false;
  }
};

// Utility: case-insensitive name match
const ciMatch = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

// List categories. If DB is connected, prefer DB and attempt to seed from file if DB empty.
const listCategories = async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Fetch from DB
      const docs = await Category.find({}).sort({ name: 1 }).lean();
      if (Array.isArray(docs) && docs.length > 0) {
        return res.json({ success: true, data: docs });
      }
      // If DB empty but file store exists, seed the DB
      const fileCats = readFileCategories();
      if (Array.isArray(fileCats) && fileCats.length > 0) {
        const created = [];
        for (const fc of fileCats) {
          try {
            const name = fc.name || fc;
            if (!name) continue;
            const exists = await Category.findOne({ name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
            if (!exists) {
              const c = await Category.create({ name });
              created.push(c);
            }
          } catch (e) {
            // ignore individual failures
          }
        }
        const docs2 = await Category.find({}).sort({ name: 1 }).lean();
        return res.json({ success: true, data: docs2 });
      }
      return res.json({ success: true, data: docs });
    }
    // Fallback to file store
    const cats = readFileCategories();
    return res.json({ success: true, data: cats });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to load categories' });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
    if (!name) return res.status(400).json({ success: false, message: 'Category name required' });
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Check for existing by case-insensitive match
      const existing = await Category.findOne({ name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
      if (existing) return res.status(409).json({ success: false, message: 'Category already exists', data: existing });
      const created = await Category.create({ name });
      return res.status(201).json({ success: true, data: created });
    }
    // Fallback file store
    const cats = readFileCategories();
    const exists = cats.find(c => ciMatch(c.name || c, name));
    if (exists) return res.status(409).json({ success: false, message: 'Category already exists', data: exists });
    const id = Math.random().toString(36).slice(2, 10);
    const obj = { _id: id, name };
    cats.push(obj);
    if (!writeFileCategories(cats)) return res.status(500).json({ success: false, message: 'Failed to persist category' });
    return res.status(201).json({ success: true, data: obj });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error creating category' });
  }
};

// Update category by id or name
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
    if (!name) return res.status(400).json({ success: false, message: 'Category name required' });
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Find by _id or name
      let doc = null;
      if (/^[a-fA-F0-9]{24}$/.test(String(id))) doc = await Category.findById(id);
      if (!doc) doc = await Category.findOne({ $or: [{ name: id }, { name: new RegExp('^' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] });
      if (!doc) return res.status(404).json({ success: false, message: 'Category not found' });
      // Check for name conflict
      const conflict = await Category.findOne({ _id: { $ne: doc._id }, name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
      if (conflict) return res.status(409).json({ success: false, message: 'Category name already in use', data: conflict });
      doc.name = name;
      await doc.save();
      return res.json({ success: true, data: doc });
    }
    // Fallback file store
    const cats = readFileCategories();
    const idx = cats.findIndex(c => String(c._id) === String(id) || ciMatch(c.name || c, id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Category not found' });
    cats[idx].name = name;
    if (!writeFileCategories(cats)) return res.status(500).json({ success: false, message: 'Failed to persist category' });
    return res.json({ success: true, data: cats[idx] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error updating category' });
  }
};

// Delete category by id or name
const deleteCategory = async (req, res) => {
  try {
    const id = req.params.id;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      // Find by id or name
      let doc = null;
      if (/^[a-fA-F0-9]{24}$/.test(String(id))) doc = await Category.findById(id);
      if (!doc) doc = await Category.findOne({ $or: [{ name: id }, { name: new RegExp('^' + id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }] });
      if (!doc) return res.status(404).json({ success: false, message: 'Category not found' });
      await Category.deleteOne({ _id: doc._id });
      return res.json({ success: true, data: doc });
    }
    // Fallback file store
    const cats = readFileCategories();
    const idx = cats.findIndex(c => String(c._id) === String(id) || ciMatch(c.name || c, id));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Category not found' });
    const removed = cats.splice(idx, 1)[0];
    if (!writeFileCategories(cats)) return res.status(500).json({ success: false, message: 'Failed to persist category' });
    return res.json({ success: true, data: removed });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error deleting category' });
  }
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
