const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const goldMemberStatusController = require('../controllers/goldMemberStatusController');

router.use(authMiddleware);

router.get('/check', goldMemberStatusController.checkGoldMember);

module.exports = router;