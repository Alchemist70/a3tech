/**
 * Docker Code Executor
 * Executes code in isolated Docker containers with multi-language support
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Supported languages and their Docker runtime commands
const LANGUAGE_COMMANDS = {
  python: {
    extension: 'py',
    runtime: 'python3',
    image: 'alchemist-executor:latest',
    cmd: 'python3'
  },
  javascript: {
    extension: 'js',
    runtime: 'node',
    image: 'alchemist-executor:latest',
    cmd: 'node'
  },
  java: {
    extension: 'java',
    runtime: 'java',
    image: 'alchemist-executor:latest',
    cmd: 'java'
  },
  cpp: {
    extension: 'cpp',
    runtime: 'g++',
    image: 'alchemist-executor:latest',
    cmd: 'g++'
  },
  c: {
    extension: 'c',
    runtime: 'gcc',
    image: 'alchemist-executor:latest',
    cmd: 'gcc'
  }
};

/**
 * Check if Docker is installed and running
 */
function isDockerAvailable() {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Check if the executor image exists
 */
function imageExists() {
  try {
    execSync('docker image inspect alchemist-executor:latest', { stdio: 'pipe' });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Build the Docker image
 */
function buildImage() {
  try {
    console.log('[Docker] Building alchemist-executor image...');
    const dockerfilePath = path.join(__dirname, '..', '..', 'Dockerfile');
    const context = path.join(__dirname, '..', '..');
    
    execSync(
      `docker build -t alchemist-executor:latest -f ${dockerfilePath} ${context}`,
      { stdio: 'inherit' }
    );
    
    console.log('[Docker] Image built successfully');
    return true;
  } catch (err) {
    console.error('[Docker] Failed to build image:', err.message);
    return false;
  }
}

/**
 * Execute code in Docker container
 * @param {string} code - Source code
 * @param {string} language - Programming language
 * @param {string} input - Optional stdin
 * @param {number} timeLimit - Execution timeout in seconds
 * @returns {Promise<Object>} - { output, error, success, executionTime }
 */
async function executeCode(code, language, input = '', timeLimit = 10) {
  try {
    // Check Docker availability
    if (!isDockerAvailable()) {
      return {
        success: false,
        error: 'Docker is not installed or not running',
        language,
        executionTime: 0
      };
    }

    // Check if image exists, build if needed
    if (!imageExists()) {
      console.log('[Docker] Image not found, building...');
      if (!buildImage()) {
        return {
          success: false,
          error: 'Failed to build Docker image',
          language,
          executionTime: 0
        };
      }
    }

    const config = LANGUAGE_COMMANDS[language.toLowerCase()];
    if (!config) {
      return {
        success: false,
        error: `Unsupported language: ${language}`,
        language,
        executionTime: 0
      };
    }

    // Create temporary directory for code
    const tmpDir = path.join(os.tmpdir(), `alchemist-exec-${Date.now()}`);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // For Java, extract the public class name to match filename requirement
    let codeFileName = `code.${config.extension}`;
    let className = 'Main'; // Default fallback
    
    if (language.toLowerCase() === 'java') {
      const publicClassMatch = code.match(/public\s+class\s+(\w+)/);
      if (publicClassMatch) {
        className = publicClassMatch[1];
        codeFileName = `${className}.${config.extension}`;
      }
    }

    const codeFile = path.join(tmpDir, codeFileName);
    const inputFile = path.join(tmpDir, 'input.txt');

    // Write code to file
    fs.writeFileSync(codeFile, code);
    if (input) {
      fs.writeFileSync(inputFile, input);
    }

    const startTime = Date.now();
    const result = await runInDocker(language, tmpDir, config, input, timeLimit, className);
    const executionTime = Date.now() - startTime;

    // Cleanup
    try {
      fs.rmSync(tmpDir, { recursive: true });
    } catch (e) {
      console.warn('[Docker] Cleanup warning:', e.message);
    }

    result.executionTime = executionTime;
    return result;

  } catch (err) {
    return {
      success: false,
      error: `Docker execution error: ${err.message}`,
      language,
      executionTime: 0
    };
  }
}

/**
 * Run code in Docker container
 */
function runInDocker(language, tmpDir, config, input, timeLimit, className = 'Main') {
  return new Promise((resolve) => {
    try {
      const lang = language.toLowerCase();
      let dockerCmd = '';
      let executeCmd = '';

      // Build execution command based on language
      if (lang === 'python') {
        executeCmd = `python3 /work/code.py`;
      } else if (lang === 'javascript') {
        executeCmd = `node /work/code.js`;
      } else if (lang === 'java') {
        // Java requires compilation first, use the actual class name
        executeCmd = `bash -c "cd /work && javac ${className}.java && java ${className}"`;
      } else if (lang === 'cpp') {
        executeCmd = `bash -c "cd /work && g++ -o code code.cpp && ./code"`;
      } else if (lang === 'c') {
        executeCmd = `bash -c "cd /work && gcc -o code code.c && ./code"`;
      }

      // Build Docker run command
      const volumeMount = `${tmpDir}:/work`;
      const timeoutMs = timeLimit * 1000 + 2000; // Add buffer

      const process = spawn('docker', [
        'run',
        '--rm',
        '--interactive',
        '--cpus=1',
        '--memory=256m',
        `--volume=${volumeMount}`,
        'alchemist-executor:latest',
        'bash', '-c', executeCmd
      ]);

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Write input to container's stdin if provided
      if (input) {
        process.stdin.write(input);
      }
      process.stdin.end();

      // Timeout handling
      const timeout = setTimeout(() => {
        try {
          process.kill('SIGKILL');
        } catch (e) {}
        resolve({
          success: false,
          error: `Execution timeout (${timeLimit}s exceeded)`,
          language,
          stage: 'runtime'
        });
      }, timeoutMs);

      process.on('close', (code) => {
        clearTimeout(timeout);

        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            error: '',
            language,
            stage: 'success'
          });
        } else {
          // Determine if it's a compile or runtime error
          const stage = stderr.includes('error:') || stderr.includes('undefined') ? 'compile' : 'runtime';
          resolve({
            success: false,
            output: stdout,
            error: stderr || `Process exited with code ${code}`,
            language,
            stage
          });
        }
      });

    } catch (err) {
      resolve({
        success: false,
        error: err.message,
        language
      });
    }
  });
}

/**
 * Get Docker status
 */
function getStatus() {
  return {
    dockerAvailable: isDockerAvailable(),
    imageExists: isDockerAvailable() && imageExists(),
    supportedLanguages: Object.keys(LANGUAGE_COMMANDS)
  };
}

module.exports = {
  executeCode,
  isDockerAvailable,
  imageExists,
  buildImage,
  getStatus,
  LANGUAGE_COMMANDS
};
