const express = require('express');
const router = express.Router();
const waecTopic = require('../controllers/waecTopicController');

router.get('/', waecTopic.getTopics);
router.get('/:id', waecTopic.getTopic);
router.post('/', waecTopic.addTopic);
router.put('/:id', waecTopic.updateTopic);
router.delete('/:id', waecTopic.deleteTopic);

module.exports = router;
