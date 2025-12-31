const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const authMiddleware = require('../middleware/authMiddleware');

// Get current authenticated user's profile (includes premium status) - requires authentication
router.get('/profile', authMiddleware, users.getProfile);

// Subscribe endpoint - requires authentication (must be before /:id routes)
router.post('/subscribe', authMiddleware, users.subscribe);

// Update authenticated user's general profile (photo, etc) - requires authentication
router.patch('/', authMiddleware, users.updateAuthenticatedUser);

// Update profile endpoint - requires authentication
router.patch('/profile', authMiddleware, users.updateProfile);

router.get('/', users.getUsers);
router.post('/', users.createUser);
router.get('/:id', users.getUserById);
router.put('/:id', users.updateUser);
router.delete('/:id', users.deleteUser);

module.exports = router;
