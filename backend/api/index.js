// Vercel Serverless Function Entry Point
// This file serves as the entry point for Vercel serverless functions
// It exports the Express app configured for serverless deployment h

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const expressRateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');

// Load environment variables
dotenv.config();

// Import config
const config = require('../config/config');

// Import routes
const projects = require('../routes/projects');
const users = require('../routes/users');
const contact = require('../routes/contact');
const blog = require('../routes/blog');
const faq = require('../routes/faq');
const testimonials = require('../routes/testimonials');
const about = require('../routes/about');
const knowledgeBase = require('../routes/knowledgeBase');
const topic = require('../routes/topic');
const topicDetail = require('../routes/topicDetail');
const researchAreas = require('../routes/researchAreas');
const chat = require('../routes/chat');
const auth = require('../routes/auth');
const visits = require('../routes/visits');
const admin = require('../routes/admin');
const goldMemberStatus = require('../routes/goldMemberStatus');
const chatHistory = require('../routes/chatHistory');

// Import passport configuration
require('../config/passport-google');

const app = express();
const path = require('path');

// Trust proxy for accurate IP addresses behind proxies (important for Vercel)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Compression middleware for PWA - reduce bundle size for offline caching
try {
  const compression = require('compression');
  app.use(compression({
    level: 6,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024 // Only compress responses > 1KB
  }));
  console.log('Compression middleware enabled for Vercel');
} catch (e) {
  console.warn('Compression middleware not available:', e && e.message ? e.message : e);
}


// CORS configuration
// Allow only the configured frontend origin(s) and support credentials for cross-site cookies.
const allowedOrigins = [];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
if (process.env.FRONTEND_URL_DEV) allowedOrigins.push(process.env.FRONTEND_URL_DEV);
// Always allow localhost during local development and various localhost bindings
allowedOrigins.push(
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
);

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests like server-to-server (no origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '20mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '20mb' }));

// Session configuration: prefer Redis store when available, fallback to MemoryStore
let sessionStore = null;
try {
  if (process.env.REDIS_URL) {
    const Redis = require('ioredis');
    const connectRedis = require('connect-redis');
    const RedisStore = connectRedis(session);
    const redisClient = new Redis(process.env.REDIS_URL);
    sessionStore = new RedisStore({ client: redisClient, prefix: 'sess:' });
    console.log('Using Redis session store');
  }
} catch (e) {
  console.warn('Redis session store initialization failed, falling back to MemoryStore:', e && e.message ? e.message : e);
}

const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

if (sessionStore) sessionOptions.store = sessionStore;

app.use(session(sessionOptions));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Cache-Control middleware for PWA - optimize caching strategies
app.use((req, res, next) => {
  // Set cache headers based on route and response type
  if (req.path.startsWith('/api/')) {
    if (req.method === 'GET') {
      // Cache read-only API responses (data won't change frequently)
      if (req.path.includes('/projects') || req.path.includes('/blog') || req.path.includes('/faq') || req.path.includes('/topics')) {
        res.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      } else if (req.path.includes('/user') || req.path.includes('/auth')) {
        res.set('Cache-Control', 'private, no-cache'); // Don't cache user-specific data
      } else if (req.path.includes('/question-bank') || req.path.includes('/mock-test') || req.path.includes('/uploads')) {
        // Question bank and mock-test endpoints are dynamic during admin operations; avoid caching
        res.set('Cache-Control', 'private, no-cache');
      } else {
        res.set('Cache-Control', 'public, max-age=300'); // 5 minutes default
      }
    } else {
      // No caching for POST, PUT, DELETE
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
  
  next();
});


// Serve uploaded files (if using file uploads)
// Note: For production, consider using cloud storage (S3, Cloudinary, etc.)
// For Vercel, file uploads should use cloud storage as serverless functions are stateless
try {
  const uploadsRouter = require('../routes/uploads');
  app.use('/api/uploads', uploadsRouter);
  // Also serve the uploads directory so file URLs returned by the uploads route are accessible during local/dev runs
  const uploadsStaticPath = path.join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(uploadsStaticPath));
} catch (e) {
  console.warn('Uploads route not available:', e.message);
}

// Rate limiting with safe key generator
const safeKeyGenerator = (req) => {
  try {
    if (req.ip) return req.ip;
    if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
    if (req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
    if (req.headers && req.headers['x-forwarded-for']) {
      return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    }
  } catch (e) {
    // ignore errors
  }
  return 'unknown';
};

// Rate limiter configuration: allow relaxing or disabling for development via env vars.
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitDisabled = String(process.env.RATE_LIMIT_DISABLED || 'false').toLowerCase() === 'true';
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '') || 15 * 60 * 1000;
// Separate env var for dev allows a much higher limit without touching production defaults
const defaultMax = isProduction ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '') || 100) : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_DEV || '') || 10000);

if (rateLimitDisabled) {
  console.warn('Rate limiting is DISABLED via RATE_LIMIT_DISABLED=true');
} else {
  const limiter = expressRateLimit({
    windowMs,
    max: defaultMax,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: safeKeyGenerator
  });

  app.use('/api/', limiter);
}

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

// Connect to database (fire in background, don't block app initialization)
// Serverless functions should not wait for DB connection during module load
setImmediate(() => {
  connectDB().catch(err => console.error('Background DB connection failed:', err));
});

// Routes
try {
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
} catch (routeErr) {
  console.error('Failed to load routes:', routeErr);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// PWA Update check endpoint - clients can poll to check for app updates
app.get('/api/version', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json({
    version: process.env.API_VERSION || '1.0.0',
    buildTime: process.env.BUILD_TIME || new Date().toISOString(),
    updateAvailable: false,
    minimumClientVersion: process.env.MINIMUM_CLIENT_VERSION || '1.0.0'
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

