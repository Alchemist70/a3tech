/**
 * Socket.IO Handler for Interactive Code Execution
 * Manages WebSocket communication for real-time code execution with I/O streaming
 */

const { executeInteractively } = require('../services/interactiveExecutor');
const jwt = require('jsonwebtoken');

// Local JWT verifier for socket auth (middleware file exports Express middleware,
// not a token verifier function). Provide a small helper here to verify tokens
// for Socket.IO handshake authentication.
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function setupInteractiveCodeSocket(io) {
  const namespace = io.of('/code-execution');

  // Middleware to verify JWT token
  namespace.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id || decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  namespace.on('connection', (socket) => {
    console.log(`[CodeExecution] User ${socket.userId} connected: ${socket.id}`);

    /**
     * Execute code interactively
     * Expects: { code, language, timeLimit }
     * Emits:
     *   - 'output' for stdout lines
     *   - 'error' for stderr lines
     *   - 'input-prompt' to request user input
     *   - 'complete' when finished
     */
    socket.on('execute', async (data) => {
      const { code, language, timeLimit = 10 } = data;
      const userId = socket.userId;

      if (!code || !language) {
        socket.emit('error', 'Missing code or language');
        return;
      }

      console.log(`[CodeExecution] ${userId} executing ${language}`);

      let inputPromptActive = false;
      let inputResolver = null;
      let stdinWriter = null;

      const onOutput = (line) => {
        socket.emit('output', line);
      };

      const onError = (line) => {
        socket.emit('error', line);
      };

      // onInput handler: When the backend process needs stdin, request it from frontend
      const onInput = () => {
        return new Promise((resolve) => {
          inputResolver = resolve;
          socket.emit('input-prompt'); // Tell frontend that input is needed
        });
      };

      // Call backend execution
      try {
        const result = await executeInteractively(
          code,
          language,
          onOutput,
          onError,
          onInput,
          timeLimit
        );

        socket.emit('complete', {
          ...result,
          userId,
          timestamp: new Date()
        });
      } catch (err) {
        socket.emit('complete', {
          success: false,
          totalOutput: '',
          totalError: err.message,
          language,
          executionTime: 0,
          userId,
          timestamp: new Date()
        });
      }
    });

    /**
     * User provides input when prompted
     * Expects: { input }
     */
    socket.on('provide-input', (data) => {
      const { input } = data;
      console.log(`[CodeExecution] ${socket.userId} provided input`);
      // Signal resolver if waiting
      if (inputResolver) {
        inputResolver(input);
        inputResolver = null;
      }
    });

    socket.on('disconnect', () => {
      console.log(`[CodeExecution] User ${socket.userId} disconnected: ${socket.id}`);
    });

    socket.on('error', (err) => {
      console.error(`[CodeExecution] Socket error for ${socket.userId}:`, err);
    });
  });
}

module.exports = { setupInteractiveCodeSocket };
