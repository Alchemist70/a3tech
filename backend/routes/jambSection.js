const express = require('express');
const router = express.Router();
const jambSection = require('../controllers/jambSectionController');

router.get('/', jambSection.getSections);
router.get('/sections', jambSection.getSections);
router.post('/', jambSection.addSection);
router.post('/sections', jambSection.addSection);
router.put('/:id', jambSection.updateSection);
router.put('/sections/:id', jambSection.updateSection);
router.delete('/:id', jambSection.deleteSection);
router.delete('/sections/:id', jambSection.deleteSection);

module.exports = router;
