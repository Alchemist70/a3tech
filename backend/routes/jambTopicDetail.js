const express = require('express');
const router = express.Router();
const {
	getAllTopicDetails,
	getTopicDetail,
	createTopicDetail,
	updateTopicDetail,
	deleteTopicDetail
} = require('../controllers/jambTopicDetailController');

router.get('/', getAllTopicDetails);
router.post('/', createTopicDetail);
router.get('/:id', getTopicDetail);
router.put('/:id', updateTopicDetail);
router.delete('/:id', deleteTopicDetail);

module.exports = router;
