const express = require('express');
const router = express.Router();
const kb = require('../controllers/knowledgeBaseController');

// Support both root and explicit '/subjects' paths because some callers
// request '/api/knowledge-base/subjects' while others call '/api/knowledge-base/'.
router.get('/', kb.getSubjects);
router.get('/subjects', kb.getSubjects);
router.post('/', kb.addSubject);
router.post('/subjects', kb.addSubject);
router.put('/:id', kb.updateSubject);
router.put('/subjects/:id', kb.updateSubject);
router.delete('/:id', kb.deleteSubject);
router.delete('/subjects/:id', kb.deleteSubject);

module.exports = router;
