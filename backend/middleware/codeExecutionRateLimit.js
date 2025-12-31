/**
 * Rate Limiting Middleware for Code Execution
 * Limits: 10 executions per minute per user
 */

const codeExecutionLimits = new Map(); // userId -> { count, resetTime }

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Rate limiting middleware for code execution
 * Requires req.user or req.userId to be set
 */
function codeExecutionRateLimit(req, res, next) {
  // Get user ID from auth context
  const userId = req.user?.id || req.userId || req.headers['x-user-id'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required for code execution'
    });
  }

  const now = Date.now();
  let userLimits = codeExecutionLimits.get(userId);

  // Initialize or reset if window expired
  if (!userLimits || now > userLimits.resetTime) {
    userLimits = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    codeExecutionLimits.set(userId, userLimits);
  }

  // Check if limit exceeded
  if (userLimits.count >= RATE_LIMIT_MAX_REQUESTS) {
    const secondsUntilReset = Math.ceil((userLimits.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Rate limit exceeded. You have ${RATE_LIMIT_MAX_REQUESTS} code executions per minute.`,
      retryAfter: secondsUntilReset,
      remainingRequests: 0
    });
  }

  // Increment counter
  userLimits.count++;

  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', RATE_LIMIT_MAX_REQUESTS - userLimits.count);
  res.setHeader('X-RateLimit-Reset', Math.ceil(userLimits.resetTime / 1000));

  // Store user ID for controller use
  req.userId = userId;

  next();
}

/**
 * Clean up old entries periodically
 * Call this function at server startup
 */
function startCleanupInterval() {
  setInterval(() => {
    const now = Date.now();
    for (const [userId, limits] of codeExecutionLimits.entries()) {
      if (now > limits.resetTime) {
        codeExecutionLimits.delete(userId);
      }
    }
  }, 60 * 1000); // Clean up every minute
}

module.exports = {
  codeExecutionRateLimit,
  startCleanupInterval
};
