// Vercel Serverless Function Entry Point
// This file serves as the entry point for Vercel serverless functions
// It exports the Express app configured for serverless deployment
// Located at root/api/index.js for Vercel compatibility 

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const expressRateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

// Load environment variables from backend/.env (if exists) or root .env
dotenv.config({ path: path.join(__dirname, '../backend/.env') });
dotenv.config(); // Also load from root

// Import config
const config = require('../backend/config/config');

// Import passport configuration
require('../backend/config/passport-google');

// Import routes
const projects = require('../backend/routes/projects');
const users = require('../backend/routes/users');
const contact = require('../backend/routes/contact');
const blog = require('../backend/routes/blog');
const faq = require('../backend/routes/faq');
const testimonials = require('../backend/routes/testimonials');
const about = require('../backend/routes/about');
const knowledgeBase = require('../backend/routes/knowledgeBase');
const topic = require('../backend/routes/topic');
const topicDetail = require('../backend/routes/topicDetail');
const researchAreas = require('../backend/routes/researchAreas');
const chat = require('../backend/routes/chat');
const auth = require('../backend/routes/auth');
const visits = require('../backend/routes/visits');
const admin = require('../backend/routes/admin');
const goldMemberStatus = require('../backend/routes/goldMemberStatus');
const chatHistory = require('../backend/routes/chatHistory');

const app = express();

// Trust proxy for accurate IP addresses behind proxies (important for Vercel)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (use memory store for serverless - consider Redis for production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting with safe key generator
const safeKeyGenerator = (req) => {
  try {
    if (req.ip) return req.ip;
    if (req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
    if (req.headers && req.headers['x-forwarded-for']) {
      return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    }
  } catch (e) {
    // ignore errors
  }
  return 'unknown';
};

const limiter = expressRateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: safeKeyGenerator
});

app.use('/api/', limiter);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || '', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Connected');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/projects', projects);
app.use('/api/users', users);
app.use('/api/contact', contact);
app.use('/api/blog', blog);
app.use('/api/faq', faq);
app.use('/api/testimonials', testimonials);
app.use('/api/about', about);
app.use('/api/knowledge-base', knowledgeBase);
app.use('/api/topics', topic);
app.use('/api/topic-details', topicDetail);
app.use('/api/research-areas', researchAreas);
app.use('/api/chat', chat);
app.use('/api/auth', auth);
app.use('/api/visits', visits);
app.use('/api/admin', admin);
app.use('/api/gold-member-status', goldMemberStatus);
app.use('/api/chat-history', chatHistory);

// Serve uploaded files (if using file uploads)
// Note: For production, consider using cloud storage (S3, Cloudinary, etc.)
// For Vercel, file uploads should use cloud storage as serverless functions are stateless
try {
  const uploadsRouter = require('../backend/routes/uploads');
  app.use('/api/uploads', uploadsRouter);
  // Static file serving may not work well on Vercel - consider cloud storage
  // app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));
} catch (e) {
  console.warn('Uploads route not available:', e.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'A3 Website API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel serverless functions
module.exports = app;

