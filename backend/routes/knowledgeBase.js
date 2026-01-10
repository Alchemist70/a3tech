const express = require('express');
const router = express.Router();
const kb = require('../controllers/knowledgeBaseController');
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middleware/authMiddleware');

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

// Knowledge base bookmark routes - protected with authMiddleware to set req.user
router.post('/:knowledgeBaseId/bookmark', authMiddleware, bookmarkController.toggleKnowledgeBaseBookmark);
router.get('/:knowledgeBaseId/bookmark-status', authMiddleware, bookmarkController.isKnowledgeBaseBookmarked);
router.get('/bookmarks/list', authMiddleware, bookmarkController.getKnowledgeBaseBookmarks);

module.exports = router;
