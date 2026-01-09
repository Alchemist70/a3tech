const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const router = express.Router();
const projectController = require('../controllers/projectController');
const fs = require('fs');
const Project = require('../models/Project');

// Try to load top-level project JSON files if present (fallback when DB is unavailable)
const loadProjects = () => {
  const base = path.resolve(__dirname, '..', '..');
  const projects = [];
  ['project1.json', 'project2.json', 'project3.json'].forEach((f) => {
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const p = require(path.join(base, f));
      projects.push(p);
    } catch (e) {
      // ignore missing files
    }
  });
  return projects;
};

// If a MongoDB connection is active, delegate to the controller (DB-backed).
// Otherwise fall back to the static JSON loader (useful in local dev without DB).
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return projectController.getProjects(req, res);
    }
  } catch (e) {
    // fall through to static loader
  }

  const data = loadProjects();
  res.json({ success: true, projects: data });
});

// Create a new project (DB-backed only)
router.post('/', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return projectController.createProject(req, res);
    }
    return res.status(503).json({ success: false, message: 'Database not available' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error creating project' });
  }
});

// Update existing project (DB-backed only)
router.put('/:id', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return projectController.updateProject(req, res);
    }
    return res.status(503).json({ success: false, message: 'Database not available' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error updating project' });
  }
});

// (categories endpoints are handled by the Category controller which prefers DB but
// falls back to the file-backed store when MongoDB is not available)
const categoryController = require('../controllers/categoryController');

router.get('/categories', categoryController.listCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// GET project by id (DB-backed when available, otherwise static fallback)
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return projectController.getProjectById(req, res);
    }
  } catch (e) {
    // fall through to static loader
  }

  const data = loadProjects();
  const idx = parseInt(req.params.id, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= data.length) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }
  return res.json({ success: true, data: data[idx] });
});

// DELETE project by id (DB-backed only)
router.delete('/:id', async (req, res) => {
  try {
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return projectController.deleteProject(req, res);
    }
    return res.status(503).json({ success: false, message: 'Database not available' });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Error deleting project' });
  }
});

// Bookmark routes
const bookmarkController = require('../controllers/bookmarkController');

// Toggle bookmark for a project
router.post('/:projectId/bookmark', bookmarkController.toggleProjectBookmark);

// Check if project is bookmarked
router.get('/:projectId/bookmark-status', bookmarkController.isProjectBookmarked);

// Get all bookmarked projects for user
router.get('/bookmarks/list', bookmarkController.getProjectBookmarks);

module.exports = router;
