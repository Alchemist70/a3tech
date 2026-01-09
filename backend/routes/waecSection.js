const express = require('express');
const router = express.Router();
const waecSection = require('../controllers/waecSectionController');

router.get('/', waecSection.getSections);
router.get('/sections', waecSection.getSections);
router.post('/', waecSection.addSection);
router.post('/sections', waecSection.addSection);
router.put('/:id', waecSection.updateSection);
router.put('/sections/:id', waecSection.updateSection);
router.delete('/:id', waecSection.deleteSection);
router.delete('/sections/:id', waecSection.deleteSection);

module.exports = router;
