const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const goldMemberController = require('../controllers/goldMemberController');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Routes
router.get('/', goldMemberController.getAllGoldMembers);
router.post('/', goldMemberController.addGoldMember);
router.delete('/:id', goldMemberController.removeGoldMember);
router.patch('/:id', goldMemberController.updateGoldMember);

module.exports = router;