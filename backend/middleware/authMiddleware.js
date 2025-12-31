const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

// Middleware that, if a token is present, loads the user onto req.user.
// It never throws if token is missing; it only sets req.user when valid.
module.exports = async function (req, res, next) {
  try {
    const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
    if (!token) return next();
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next();
    
    // Optional: verify role matches (only block if mismatch, otherwise allow)
    // Removed strict role check to allow token-based auth even if roles don't perfectly align
    
    req.user = user; // mongoose document without password
  } catch (e) {
    // ignore errors here, do not block the request
  }
  return next();
};
