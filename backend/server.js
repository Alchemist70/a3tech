"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport = require('passport');
const session = require('express-session');
// Load config at the very start
const config = require('./config/config');
// Import routes
const projects_1 = __importDefault(require("./routes/projects"));
const users_1 = __importDefault(require("./routes/users"));
const contact_1 = __importDefault(require("./routes/contact"));
const blog_1 = __importDefault(require("./routes/blog"));
const faq_1 = __importDefault(require("./routes/faq"));
const testimonials_1 = __importDefault(require("./routes/testimonials"));
const about_1 = __importDefault(require("./routes/about"));
const knowledgeBase_1 = __importDefault(require("./routes/knowledgeBase"));
const topic_1 = __importDefault(require("./routes/topic"));
const topicDetail_1 = __importDefault(require("./routes/topicDetail"));
const researchAreas_1 = __importDefault(require("./routes/researchAreas"));
const chat_1 = __importDefault(require("./routes/chat"));
const auth_1 = __importDefault(require("./routes/auth"));
const visits_1 = __importDefault(require("./routes/visits"));
const admin_1 = __importDefault(require("./routes/admin"));
const goldMemberStatus_1 = __importDefault(require("./routes/goldMemberStatus"));
// Load environment variables
dotenv_1.default.config();

// Import chat history route
const chatHistory = require('./routes/chatHistory');
const { initializeRetentionPolicy } = require('./controllers/chatHistoryController');

// Import socket.io setup
const { setupInteractiveCodeSocket } = require('./services/interactiveCodeSocket');

const app = (0, express_1.default)();
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
// Configure 'trust proxy' only when explicitly provided via environment to avoid
// permissive settings which allow bypassing IP-based rate limiting.
// If you are behind a single proxy (e.g. a load balancer), set TRUST_PROXY=1
// in your environment. Avoid setting this to true in development.
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY);
}
const PORT = process.env.PORT || 5000;
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting: configured below with a safe key generator to avoid
// express-rate-limit validation errors in development environments.
// Note: express-rate-limit validates trust proxy vs X-Forwarded-For header. In
// development some proxies or tools may set X-Forwarded-For even when
// `trust proxy` is not enabled. To make the limiter robust in local dev
// environments, provide a safe keyGenerator that falls back to `req.ip` or
// `req.connection.remoteAddress` and avoid relying on X-Forwarded-For unless
// `trust proxy` is explicitly configured.
const safeKeyGenerator = (req) => {
    try {
        if (req.ip) return req.ip;
        if (req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
        if (req.headers && req.headers['x-forwarded-for']) return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    }
    catch (e) { }
    return '';
};

// In some dev setups (create-react-app proxy, browser extensions, or tooling)
// the `X-Forwarded-For` header may be set even though `trust proxy` is false.
// express-rate-limit throws in that case to prevent IP spoofing. For local
// development we silently remove the header unless TRUST_PROXY is explicitly
// configured. This keeps rate-limiting meaningful during production while
// avoiding false positives in dev.
app.use((req, res, next) => {
    try {
        if (!process.env.TRUST_PROXY && req.headers && req.headers['x-forwarded-for']) {
            delete req.headers['x-forwarded-for'];
        }
    }
    catch (e) { }
    return next();
});

// Reconfigure limiter with a safe keyGenerator to avoid ERR_ERL_* validation
// errors in development environments that set X-Forwarded-For unexpectedly.
app._router && app._router.stack && app._router.stack.length && (() => {
    // remove previous applied limiter middleware if any (to replace)
})();
// Apply limiter again with safeKeyGenerator (this is idempotent for startup)
const limiterWithKey = (0, express_rate_limit_1.default)(Object.assign({}, {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
    keyGenerator: safeKeyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
}));
// replace limiter middleware by applying limiterWithKey
app.use(limiterWithKey);
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration for Passport
// Session configuration: use Redis when available to persist sessions across restarts
try {
    let sessionOptions = {
        secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        }
    };

    if (process.env.REDIS_URL) {
        const Redis = require('ioredis');
        const connectRedis = require('connect-redis');
        const RedisStore = connectRedis(session);
        const redisClient = new Redis(process.env.REDIS_URL);
        sessionOptions.store = new RedisStore({ client: redisClient, prefix: 'sess:' });
        console.log('Using Redis session store in server');
    }

    app.use(session(sessionOptions));
} catch (e) {
    console.warn('Failed to initialize Redis session store, falling back to MemoryStore:', e && e.message ? e.message : e);
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' }
    }));
}

// Initialize Passport
require('./config/passport-google');
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files
app.use('/uploads', express_1.default.static(path.join(__dirname, 'uploads')));

// Uploads API (file uploads)
try {
    const uploadsRouter = require('./routes/uploads');
    app.use('/api/uploads', uploadsRouter);
} catch (e) {
    // ignore if router not present
}
// Logging middleware
app.use((0, morgan_1.default)('combined'));
// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alchemist-research');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error('Database connection error:', error);
        if (process.env.NODE_ENV === 'production') {
            // In production we should fail fast so the orchestrator (PM2, Docker, Kubernetes)
            // can restart or mark the service unhealthy. In local development we avoid
            // exiting so developer can still run parts of the app (e.g., code execution).
            process.exit(1);
        } else {
            console.warn('Continuing without database connection (development mode).');
        }
    }
};
// Connect to database
connectDB();

// Initialize chat history retention policy (cleanup scheduled automatically)
initializeRetentionPolicy();

// Initialize code execution rate limit cleanup
const { startCleanupInterval } = require('./middleware/codeExecutionRateLimit');
startCleanupInterval();

// Optionally schedule periodic RAG index rebuilds when enabled by env var.
try {
    const RAG_AUTO = (process.env.RAG_AUTO_REBUILD || 'false').toLowerCase() === 'true';
    if (RAG_AUTO) {
        const intervalMs = parseInt(process.env.RAG_REBUILD_INTERVAL_MS || String(24 * 60 * 60 * 1000)); // default 24h
        const ragService = require('./services/ragService');
        console.log(`[RAG] Auto-rebuild scheduled every ${intervalMs}ms`);
        // run initial rebuild in background
        setTimeout(() => {
            ragService.rebuildIndex().then(c => console.log(`[RAG] Initial auto-rebuild completed (${c} docs)`)).catch(e => console.warn('[RAG] initial auto-rebuild failed', e && e.message ? e.message : e));
        }, 2000);
        setInterval(() => {
            ragService.rebuildIndex().then(c => console.log(`[RAG] Periodic rebuild completed (${c} docs)`)).catch(e => console.warn('[RAG] periodic rebuild failed', e && e.message ? e.message : e));
        }, intervalMs);
    }
} catch (e) {
    console.warn('[RAG] Failed to schedule auto-rebuild', e && e.message ? e.message : e);
}

// OAuth routes (must be BEFORE /api/auth mounting to avoid /api prefix)
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login', session: false }), (req, res) => {
    try {
      const { user, token } = req.user;
      const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth-callback?token=${token}&userId=${user._id}&email=${user.email}&name=${encodeURIComponent(user.name)}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }
});

// Routes
app.use('/api/projects', projects_1.default);
app.use('/api/users', users_1.default);
// auth and visits (traditional email/password auth)
app.use('/api/auth', auth_1.default);
app.use('/api/visits', visits_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/faq', faq_1.default);
app.use('/api/testimonials', testimonials_1.default);
app.use('/api/about', about_1.default);
app.use('/api/knowledge-base', knowledgeBase_1.default);
app.use('/api/topics', topic_1.default);
app.use('/api/topic-details', topicDetail_1.default);
app.use('/api/research-areas', researchAreas_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/chat-history', chatHistory);
app.use('/api/memory', require('./routes/memory'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/code', require('./routes/codeExecution'));
// Admin endpoints (gold members management)
app.use('/api/admin', admin_1.default);
app.use('/api/gold-members', require('./routes/goldMembers'));
app.use('/api/gold-member-status', goldMemberStatus_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'A3 Research API is running',
        timestamp: new Date().toISOString()
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = new socketIO.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
});

// Setup interactive code execution socket handler
setupInteractiveCodeSocket(io);

// Tune keep-alive and header timeouts to reduce premature connection closes
server.keepAliveTimeout = parseInt(process.env.SERVER_KEEPALIVE_MS || '61000');
server.headersTimeout = parseInt(process.env.SERVER_HEADERS_TIMEOUT_MS || '65000');

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
exports.default = app;
//# sourceMappingURL=server.js.map