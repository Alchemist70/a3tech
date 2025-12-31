const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const admin = require('../controllers/adminController');
const users = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');

// Public admin authentication routes
router.post('/auth/login', auth.loginAdmin);
router.post('/auth/register', auth.registerAdmin);
router.get('/auth/me', auth.meAdmin);

// Protected admin routes - require authentication and admin role
router.use(authMiddleware);
router.use(adminOnly);

// Get all registered users with Gold Member status
router.get('/users', users.getUsersWithGoldMemberStatus);

// Admin: trigger full RAG rebuild on demand (protected)
router.post('/reindex', async (req, res) => {
	try {
		const ragService = require('../services/ragService');
		const count = await ragService.rebuildIndex();
		return res.json({ success: true, rebuilt: count });
	} catch (e) {
		console.error('[admin] reindex failed', e && e.message ? e.message : e);
		return res.status(500).json({ success: false, message: 'Reindex failed', error: e && e.message ? e.message : String(e) });
	}
});

// Admin: get RAG index status
router.get('/reindex/status', async (req, res) => {
	try {
		const ragService = require('../services/ragService');
		const stats = ragService.getIndexStats ? ragService.getIndexStats() : { docCount: 0 };
		return res.json({ success: true, stats });
	} catch (e) {
		console.error('[admin] reindex status failed', e && e.message ? e.message : e);
		return res.status(500).json({ success: false, message: 'Status failed', error: e && e.message ? e.message : String(e) });
	}
});

module.exports = router;
