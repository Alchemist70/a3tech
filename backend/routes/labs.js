const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');

// Get all labs
router.get('/', labController.getAllLabs);

// Get labs by subject
router.get('/subject/:subject', labController.getLabsBySubject);

// Get single lab by ID
router.get('/:id', labController.getLabById);

// Create new lab
router.post('/', labController.createLab);

// Update lab
router.put('/:id', labController.updateLab);

// Delete lab
router.delete('/:id', labController.deleteLab);

module.exports = router;
