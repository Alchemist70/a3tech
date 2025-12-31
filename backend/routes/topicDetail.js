const express = require('express');
const router = express.Router();
const {
	getAllTopicDetails,
	getTopicDetail,
	createTopicDetail,
	updateTopicDetail,
	deleteTopicDetail
} = require('../controllers/topicDetailController');

// List all topic details
router.get('/', getAllTopicDetails);

// Create new topic detail
router.post('/', createTopicDetail);

// Get single topic detail
router.get('/:id', getTopicDetail);

// Update topic detail
router.put('/:id', updateTopicDetail);

// Delete topic detail
router.delete('/:id', deleteTopicDetail);

module.exports = router;
