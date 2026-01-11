const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('./config');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Construct callback URL dynamically using FRONTEND_URL for production, fallback to backend for dev
      callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.FRONTEND_URL || 'http://localhost:5000'}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const { id, displayName, emails, photos } = profile;
        const email = emails && emails[0] ? emails[0].value : null;
        const photoUrl = photos && photos[0] ? photos[0].value : null;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check if user exists by email
        let user = await User.findOne({ email });

        if (user) {
          // User exists, update Google ID if not already set
          if (!user.googleId) {
            user.googleId = id;
          }
          // Update lastLogin for OAuth sign-ins so admin can track recent activity
          try {
            user.lastLogin = new Date();
            await user.save();
          } catch (e) {
            // Don't break auth flow if saving lastLogin fails
            console.error('Failed to update lastLogin for Google user:', e && e.message ? e.message : e);
          }
        } else {
          // Create new user with Google info
          user = new User({
            googleId: id,
            name: displayName,
            email,
            profilePhoto: photoUrl,
            password: null, // No password for OAuth users
            isVerified: true, // Auto-verify OAuth users
            isSubscribed: false, // Start as non-premium
            lastLogin: new Date()
          });
          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
            isSubscribed: user.isSubscribed,
          },
          config.JWT_SECRET,
          { expiresIn: config.JWT_EXPIRY || '7d' }
        );

        return done(null, { user, token });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize only the user id into the session to avoid storing entire objects
passport.serializeUser((payload, done) => {
  try {
    // payload may be either a user document or an object like { user, token }
    if (!payload) return done(null, null);
    if (payload.user && payload.user._id) return done(null, String(payload.user._id));
    if (payload._id) return done(null, String(payload._id));
    // last resort: store payload directly
    return done(null, payload);
  } catch (e) {
    return done(e);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    if (!id) return done(null, null);
    const user = await User.findById(id).select('-password -secretCode');
    return done(null, user);
  } catch (e) {
    return done(e);
  }
});

module.exports = passport;
