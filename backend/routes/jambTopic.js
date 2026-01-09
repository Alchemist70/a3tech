const express = require('express');
const router = express.Router();
const jambTopic = require('../controllers/jambTopicController');

router.get('/', jambTopic.getTopics);
router.get('/:id', jambTopic.getTopic);
router.post('/', jambTopic.addTopic);
router.put('/:id', jambTopic.updateTopic);
router.delete('/:id', jambTopic.deleteTopic);

module.exports = router;
