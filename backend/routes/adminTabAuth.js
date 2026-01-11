const express = require('express');
const router = express.Router();

// Verify admin tab password (public endpoint - password is the guard)
router.post('/verify-tab-password', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    const ADMIN_TAB_SECRET = process.env.ADMIN_TAB_SECRET || '';
    
    if (password === ADMIN_TAB_SECRET) {
      // Return a simple verification token (timestamp-based)
      const token = Buffer.from(JSON.stringify({
        verified: true,
        timestamp: Date.now()
      })).toString('base64');
      
      return res.json({
        success: true,
        message: 'Password verified',
        token
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
  } catch (err) {
    console.error('Tab password verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: err.message || err
    });
  }
});

module.exports = router;
