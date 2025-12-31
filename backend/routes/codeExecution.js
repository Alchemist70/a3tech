/**
 * Code Execution Routes
 */

const express = require('express');
const router = express.Router();
const codeExecutionController = require('../controllers/codeExecutionController');
const { codeExecutionRateLimit } = require('../middleware/codeExecutionRateLimit');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming this exists

/**
 * GET /api/code/languages
 * Get supported languages (no auth required)
 */
router.get('/languages', codeExecutionController.getSupportedLanguages);

/**
 * GET /api/code/samples/:language
 * Get code sample for a language (no auth required)
 */
router.get('/samples/:language', codeExecutionController.getCodeSample);

/**
 * POST /api/code/execute
 * Execute code (authenticated, rate-limited)
 */
router.post(
  '/execute',
  authMiddleware, // Ensure user is authenticated
  codeExecutionRateLimit, // Apply rate limiting
  codeExecutionController.executeCode
);

module.exports = router;
