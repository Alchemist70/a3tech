/**
 * Interactive Code Executor with WebSocket Streaming
 * Handles real-time stdin/stdout for code execution
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const LANGUAGE_COMMANDS = {
  python: {
    extension: 'py',
    cmd: 'python3'
  },
  javascript: {
    extension: 'js',
    cmd: 'node'
  },
  java: {
    extension: 'java',
    cmd: 'java'
  },
  cpp: {
    extension: 'cpp',
    cmd: 'g++'
  },
  c: {
    extension: 'c',
    cmd: 'gcc'
  }
};

/**
 * Execute code interactively with streaming I/O
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {Function} onOutput - Callback for stdout (line)
 * @param {Function} onError - Callback for stderr (line)
 * @param {Function} onInput - Callback to get stdin (returns Promise<string>)
 * @param {number} timeLimit - Timeout in seconds
 * @returns {Promise<Object>} - { success, totalOutput, totalError, executionTime }
 */
async function executeInteractively(
  code,
  language,
  onOutput,
  onError,
  onInput,
  timeLimit = 10
) {
  try {
    const lang = language.toLowerCase();
    const config = LANGUAGE_COMMANDS[lang];

    if (!config) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Create temporary directory
    const tmpDir = path.join(os.tmpdir(), `alchemist-interactive-${Date.now()}`);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Handle Java class naming
    let codeFileName = `code.${config.extension}`;
    let className = 'Main';

    if (lang === 'java') {
      const publicClassMatch = code.match(/public\s+class\s+(\w+)/);
      if (publicClassMatch) {
        className = publicClassMatch[1];
        codeFileName = `${className}.${config.extension}`;
      }
    }

    const codeFile = path.join(tmpDir, codeFileName);
    fs.writeFileSync(codeFile, code);

    const startTime = Date.now();

    // Build and execute command
    let executeCmd = '';
    if (lang === 'python') {
      executeCmd = `python3 /work/code.py`;
    } else if (lang === 'javascript') {
      executeCmd = `node /work/code.js`;
    } else if (lang === 'java') {
      executeCmd = `bash -c "cd /work && javac ${className}.java && java ${className}"`;
    } else if (lang === 'cpp') {
      executeCmd = `bash -c "cd /work && g++ -o code code.cpp && ./code"`;
    } else if (lang === 'c') {
      executeCmd = `bash -c "cd /work && gcc -o code code.c && ./code"`;
    }

    const volumeMount = `${tmpDir}:/work`;

    // Start Docker container with interactive mode
    // Start Docker container without allocating a pseudo-TTY (-t) because
    // some hosts (Windows mintty, CI, or non-interactive shells) cannot
    // provide a proper TTY and programs may error with "input device is not a TTY".
    // Use interactive stdin (-i) and stream stdout/stderr normally.
    // CRITICAL: Set stdio: ['pipe', 'pipe', 'pipe'] explicitly to ensure stdin is properly connected
    const process = spawn('docker', [
      'run',
      '--rm',
      '-i', // keep stdin open
      '--cpus=1',
      '--memory=256m',
      `--volume=${volumeMount}`,
      'alchemist-executor:latest',
      'bash', '-c', executeCmd
    ], {
      stdio: ['pipe', 'pipe', 'pipe'] // Explicitly set stdin/stdout/stderr to pipe
    });

    let totalOutput = '';
    let totalError = '';
    let lineBuffer = '';
    let errorBuffer = '';

    // Timeout handling
    const timeoutId = setTimeout(() => {
      try {
        process.kill('SIGKILL');
      } catch (e) {}
    }, timeLimit * 1000);

    // Handle stdout - stream line by line
    process.stdout.on('data', (data) => {
      const chunk = data.toString();
      totalOutput += chunk;
      lineBuffer += chunk;

      // Split on newlines and emit complete lines
      const lines = lineBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        onOutput(lines[i]);
      }
      lineBuffer = lines[lines.length - 1]; // Keep incomplete line
    });

    // Handle stderr
    process.stderr.on('data', (data) => {
      const chunk = data.toString();
      totalError += chunk;
      errorBuffer += chunk;

      const lines = errorBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        onError(lines[i]);
      }
      errorBuffer = lines[lines.length - 1];
    });

    // CRITICAL: Handle stdin for interactive programs
    // If onInput callback is provided, set up stdin handling for programs that call input()
    if (onInput && typeof onInput === 'function') {
      // Create stdin writer function for the process
      const stdinWriter = (input) => {
        if (process.stdin && !process.stdin.destroyed) {
          try {
            process.stdin.write(input + '\n');
          } catch (err) {
            console.error('[Interactive] Error writing to stdin:', err.message);
          }
        }
      };

      // Optionally: Listen for when the program might be waiting for input
      // and call onInput to get user input, then write it to stdin
      // For now, this is handled externally via Socket.IO 'provide-input' event
      // which calls the resolver returned by onInput
    }

    return new Promise((resolve) => {
      process.on('close', (code) => {
        clearTimeout(timeoutId);

        // Emit any remaining buffered output
        if (lineBuffer) onOutput(lineBuffer);
        if (errorBuffer) onError(errorBuffer);

        // Cleanup
        try {
          fs.rmSync(tmpDir, { recursive: true });
        } catch (e) {
          console.warn('[Interactive] Cleanup warning:', e.message);
        }

        const executionTime = Date.now() - startTime;

        if (code === 0) {
          resolve({
            success: true,
            totalOutput,
            totalError: '',
            language,
            executionTime
          });
        } else {
          resolve({
            success: false,
            totalOutput,
            totalError,
            language,
            executionTime,
            exitCode: code
          });
        }
      });

      process.on('error', (err) => {
        clearTimeout(timeoutId);
        try {
          fs.rmSync(tmpDir, { recursive: true });
        } catch (e) {}

        resolve({
          success: false,
          totalOutput,
          totalError: err.message,
          language,
          executionTime: Date.now() - startTime
        });
      });
    });
  } catch (err) {
    return {
      success: false,
      totalOutput: '',
      totalError: err.message,
      language,
      executionTime: 0
    };
  }
}

/**
 * Get stdin writer function for a process
 */
function createStdinWriter(process) {
  return (input) => {
    if (process.stdin && !process.stdin.closed) {
      process.stdin.write(input + '\n');
    }
  };
}

module.exports = {
  executeInteractively,
  createStdinWriter,
  LANGUAGE_COMMANDS
};
