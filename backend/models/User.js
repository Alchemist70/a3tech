const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 }, // Made optional for OAuth users
  googleId: { type: String }, // Google OAuth ID
  profilePhoto: { type: String }, // Profile photo from OAuth provider
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  secretCode: { type: String, select: false }, // Admin-only secret code, excluded from queries by default
  interests: { type: [String], default: [] },
  educationalLevel: { type: String, enum: ['beginner','intermediate','advanced','expert'], default: 'beginner' },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }, // Email verification status
  // Whether this user has an active paid subscription granting full access.
  isSubscribed: { type: Boolean, default: false },
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Educational profile fields
  schoolName: { type: String, trim: true, default: '' },
  schoolEmail: { type: String, trim: true, default: '' },
  educationLevel: { type: String, enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'other', ''], default: '' },
  purpose: { type: String, enum: ['research', 'learning', 'professional', 'hobby', 'other', ''], default: '' },
  address: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  country: { type: String, trim: true, default: '' },
  profileLocked: { type: Boolean, default: false } // Prevents further edits of educational/location profile
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash secret code before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('secretCode')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.secretCode = await bcrypt.hash(this.secretCode, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare secret code method
UserSchema.methods.compareSecretCode = async function(candidateCode) {
  if (!this.secretCode) return false;
  return bcrypt.compare(candidateCode, this.secretCode);
};

module.exports = mongoose.model('User', UserSchema);
