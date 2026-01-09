const express = require('express');
const router = express.Router();
const questionBankController = require('../controllers/questionBankController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Unauthorized: Admin access required' });
};

// JAMB Questions - GET allowed for all authenticated users, POST/PUT/DELETE require admin
router.get('/jamb', authMiddleware, questionBankController.getAllJambQuestions);
router.post('/jamb', authMiddleware, isAdmin, questionBankController.addJambQuestion);
router.put('/jamb/:id', authMiddleware, isAdmin, questionBankController.updateJambQuestion);
router.delete('/jamb/:id', authMiddleware, isAdmin, questionBankController.deleteJambQuestion);
router.get('/jamb/subjects', authMiddleware, questionBankController.getJambSubjects);

// WAEC Questions - GET allowed for all authenticated users, POST/PUT/DELETE require admin
router.get('/waec', authMiddleware, questionBankController.getAllWaecQuestions);
router.post('/waec', authMiddleware, isAdmin, questionBankController.addWaecQuestion);
router.put('/waec/:id', authMiddleware, isAdmin, questionBankController.updateWaecQuestion);
router.delete('/waec/:id', authMiddleware, isAdmin, questionBankController.deleteWaecQuestion);
router.get('/waec/subjects', authMiddleware, questionBankController.getWaecSubjects);

module.exports = router;
