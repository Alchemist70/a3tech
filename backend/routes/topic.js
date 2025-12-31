const express = require('express');
const router = express.Router();
const { getTopics, getTopicBySlug } = require('../controllers/topicController');

router.get('/', getTopics);
router.get('/:slug', getTopicBySlug);

module.exports = router;
// const express = require('express');


router.get('/', (req, res) => {
  res.json({ success: true, topics: [] });
});

module.exports = router;
