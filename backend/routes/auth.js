const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require('../controllers/authController');

// Public routes for regular users only
router.post('/register', auth.register);
router.post('/login', auth.login);
router.get('/me', auth.me);
router.post('/logout', auth.logout);
router.post('/forgot-password', auth.forgotPassword);
router.post('/reset-password', auth.resetPassword);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    try {
      const { user, token } = req.user;
      
      // Redirect to frontend with OAuth token and user data
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}&userId=${user._id}&email=${user.email}&name=${encodeURIComponent(user.name)}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
  }
);

module.exports = router;
