const express = require('express');
const router = express.Router();
const mockTestController = require('../controllers/mockTestController');
const authMiddleware = require('../middleware/authMiddleware');

// Initialize a new mock test
router.post('/initialize', authMiddleware, mockTestController.initializeMockTest);

// Update JAMB subject combination
router.put('/:mockTestId/subjects', authMiddleware, mockTestController.updateJambSubjectCombination);

// Generate exam ID
router.post('/:mockTestId/generate-id', authMiddleware, mockTestController.generateExamID);

// Get mock test questions
router.get('/:mockTestId/questions', authMiddleware, mockTestController.getMockTestQuestions);

// Save answer response
router.post('/:mockTestId/responses', authMiddleware, mockTestController.saveAnswerResponse);

// Submit mock test
router.post('/:mockTestId/submit', authMiddleware, mockTestController.submitMockTest);

// Record a violation (fullscreen exit etc.)
router.post('/:mockTestId/violation', authMiddleware, mockTestController.recordViolation);

// Request proctor unlock for a locked/auto-submitted exam
router.post('/:mockTestId/unlock-request', authMiddleware, mockTestController.requestUnlock);

// Get mock test status
router.get('/:mockTestId/status', authMiddleware, mockTestController.getMockTestStatus);

// Update current subject
router.put('/:mockTestId/current-subject', authMiddleware, mockTestController.updateCurrentSubject);

// Mark subject as completed
router.post('/:mockTestId/complete-subject', authMiddleware, mockTestController.completeSubject);

// Get last attempt info
router.get('/info/last-attempt', authMiddleware, mockTestController.getLastAttemptInfo);

// Check results using exam ID
router.get('/check-results/:examId', authMiddleware, mockTestController.checkResults);

module.exports = router;
