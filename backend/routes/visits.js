const express = require('express');
const router = express.Router();
const visits = require('../controllers/visitsController');

router.post('/record', visits.record);
router.get('/check', visits.check);

module.exports = router;
