const express = require('express');
const router = express.Router();
const controller = require('../controllers/researchAreasController');

router.get('/', controller.listAreas);
router.post('/', controller.createArea);
router.put('/:id', controller.updateArea);
router.delete('/:id', controller.deleteArea);
router.post('/reorder', controller.reorderAreas);

module.exports = router;
