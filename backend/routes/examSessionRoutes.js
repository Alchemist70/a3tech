const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const {
  createExamSession,
  recordViolation,
  sessionHeartbeat,
  updateProctorMetrics,
  endExamSession,
  getSessionDetails,
  getSebConfig,
  getSebConfigUrl,
  getFlaggedSessions,
  markSessionReviewed,
} = require('../controllers/examSessionController');

const router = express.Router();
// Public route: serve .seb config when a valid signed token is provided.
// This must be public because SEB will fetch the .seb without browser auth.
router.get('/session/:sessionId/seb-config', getSebConfig);

// All subsequent routes require authentication
router.use(authMiddleware);

// Create new exam session
router.post('/session/create', createExamSession);

// Record violation
router.post('/session/violation', recordViolation);

// Session heartbeat (keep-alive)
router.post('/session/heartbeat', sessionHeartbeat);

// Update proctor metrics
router.post('/session/metrics', updateProctorMetrics);

// End exam session
router.post('/session/end', endExamSession);

// Get session details
router.get('/session/:sessionId', getSessionDetails);

// Get a signed, short-lived URL that points to the .seb config for the session
router.get('/session/:sessionId/seb-config-url', getSebConfigUrl);

// Get a signed, short-lived URL that points to the .seb config for the session
router.get('/session/:sessionId/seb-config-url', getSebConfigUrl);

// Get flagged sessions (admin only)
router.get('/sessions/flagged', getFlaggedSessions);

// Mark session as reviewed (admin only)
router.post('/session/:sessionId/review', markSessionReviewed);

module.exports = router;
