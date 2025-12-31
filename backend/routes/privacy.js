const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getPrivacySettings,
  updatePrivacySettings,
  giveConsent,
  withdrawConsent
} = require('../controllers/privacyController');

// Apply auth middleware
router.use(authMiddleware);

// GET /api/privacy/settings - Get privacy settings
router.get('/settings', getPrivacySettings);

// POST /api/privacy/settings - Update privacy settings
router.post('/settings', updatePrivacySettings);

// POST /api/privacy/consent - Give explicit consent
router.post('/consent', giveConsent);

// POST /api/privacy/withdraw-consent - Withdraw consent
router.post('/withdraw-consent', withdrawConsent);

module.exports = router;
