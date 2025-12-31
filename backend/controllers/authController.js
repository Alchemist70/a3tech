const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const config = require('../config/config');
const { sendPasswordResetEmail } = require('../services/emailService');

// Environment variables from config
const JWT_SECRET = config.JWT_SECRET;
const JWT_EXPIRES_IN = config.JWT_EXPIRES_IN;
const ADMIN_REGISTRATION_SECRET = config.ADMIN_REGISTRATION_SECRET;

// Generate JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role, 
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Register admin endpoint
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, secretCode, registrationSecret } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !secretCode || !registrationSecret) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Verify the admin registration secret
    if (registrationSecret !== ADMIN_REGISTRATION_SECRET) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid registration secret' 
      });
    }

    // Check if email is already in use
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use' 
      });
    }

    // Create admin user
    const admin = new User({ 
      name, 
      email, 
      password, 
      secretCode, 
      role: 'admin' 
    });
    await admin.save();

    // Generate token and return response
    const token = generateToken(admin);
    const out = admin.toObject();
    delete out.password;
    delete out.secretCode;
    
    res.status(201).json({ 
      success: true, 
      data: out, 
      token 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Admin registration failed', 
      error: err.message || err 
    });
  }
};

// Register endpoint
exports.register = async (req, res) => {
  try {
    const { name, email, password, schoolName, schoolEmail, educationLevel, purpose, address, city, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing required fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });
    const user = new User({ 
      name, 
      email, 
      password,
      schoolName,
      schoolEmail,
      educationLevel,
      purpose,
      address,
      city,
      country
    });
    await user.save();
    const token = generateToken(user);
    const out = user.toObject();
    delete out.password;
    res.status(201).json({ success: true, data: out, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: err.message || err });
  }
};

// Admin login: verify password and admin secret code
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password, secretCode } = req.body;
    
    // Validate required fields
    if (!email || !password || !secretCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Find admin user and include secretCode field
    const user = await User.findOne({ email, role: 'admin' }).select('+secretCode');
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin credentials' 
      });
    }

    // Verify admin secret code
    if (!user.secretCode) {
      return res.status(401).json({ 
        success: false, 
        message: 'Admin account not properly configured' 
      });
    }

    const isSecretCodeValid = await user.compareSecretCode(secretCode);
    if (!isSecretCodeValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin secret code' 
      });
    }

    // Generate admin token and return response
    const token = generateToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.secretCode;

    res.json({ 
      success: true, 
      token, 
      data: userData 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Admin login failed', 
      error: err.message || err 
    });
  }
};

// Regular user login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Find regular user (not admin)
    const user = await User.findOne({ email, role: { $ne: 'admin' } });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate token and update last login
    const token = generateToken(user);
    user.lastLogin = new Date();
    await user.save();

    const out = user.toObject();
    delete out.password;
    delete out.secretCode;
    
    res.json({ 
      success: true, 
      token, 
      data: out 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Login failed', 
      error: err.message || err 
    });
  }
};

// Get current user by token (header: Authorization: Bearer <token> or x-auth-token)
exports.me = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const user = await User.findOne({ token }).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message || err });
  }
};

// Admin: validate admin token and return admin user info
exports.meAdmin = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id).select('-password -secretCode');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid token' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin role required' });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to validate admin token', error: err.message || err });
  }
};

// Logout: clear token
exports.logout = async (req, res) => {
  try {
    const token = req.headers['x-auth-token'] || (req.headers.authorization && String(req.headers.authorization).split(' ')[1]);
    if (!token) return res.json({ success: true });
    const user = await User.findOne({ token });
    if (!user) return res.json({ success: true });
    user.token = undefined;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed', error: err.message || err });
  }
};

// Forgot password: generate reset token and send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find regular user (not admin) by email
    const user = await User.findOne({ email, role: { $ne: 'admin' } });
    
    // Don't reveal if email exists or not for security
    if (!user) {
      // Still return success to prevent email enumeration
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token and expiry (1 hour from now)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      });
    } catch (emailError) {
      // If email fails, clear the token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: err.message || err
    });
  }
};

// Reset password: validate token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
      role: { $ne: 'admin' } // Only allow regular users
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: err.message || err
    });
  }
};
