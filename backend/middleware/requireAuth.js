const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';

// Middleware that requires authentication - will return 401 if no valid token
module.exports = async function (req, res, next) {
    try {
        const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        res.status(500).json({ success: false, message: 'Auth failed', error: err.message || err });
    }
};