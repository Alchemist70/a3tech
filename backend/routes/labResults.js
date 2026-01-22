const express = require('express');
const router = express.Router();
const labResultController = require('../controllers/labResultController');

// Create new lab session
router.post('/session', labResultController.createLabSession);

// Get lab session by ID
router.get('/session/:id', labResultController.getLabSession);

// Get all lab sessions for a user
router.get('/user/:userId', labResultController.getUserLabSessions);

// Get user statistics
router.get('/stats/user/:userId', labResultController.getUserLabStatistics);

// Get subject statistics
router.get('/stats/:userId/:subject', labResultController.getSubjectStatistics);

// Update measurements
router.put('/session/:id/measurements', labResultController.updateLabMeasurements);

// Update results/calculations
router.put('/session/:id/results', labResultController.updateLabResults);

// Submit lab
router.put('/session/:id/submit', labResultController.submitLab);

// Grade lab
router.put('/session/:id/grade', labResultController.gradeLab);

// Validate titration data
router.post('/titration/validate', labResultController.validateTitration);

// Generate report
router.get('/session/:id/report', labResultController.generateLabReport);

// Delete lab session
router.delete('/session/:id', labResultController.deleteLab);

module.exports = router;
