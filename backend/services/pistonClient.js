/**
 * Piston API Client
 * Wraps the Piston code execution API (https://piston.rocks)
 */

const axios = require('axios');

const PISTON_API_URL = 'https://api.piston.rocks/execute';

// Map common language names to Piston language identifiers
const LANGUAGE_MAP = {
  'python': 'python',
  'python3': 'python',
  'javascript': 'javascript',
  'js': 'javascript',
  'node': 'javascript',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'c++': 'cpp',
};

/**
 * Execute code via Piston API
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language
 * @param {string} input - Optional stdin input
 * @param {number} timeLimit - Time limit in seconds (Piston has its own limits)
 * @returns {Promise<Object>} - { output, error, language, executionTime }
 */
async function executeCode(code, language, input = '', timeLimit = 10) {
  try {
    // Normalize language name
    const normalizedLang = LANGUAGE_MAP[language.toLowerCase()] || language.toLowerCase();
    
    // Validate inputs
    if (!code || code.trim().length === 0) {
      return {
        success: false,
        error: 'Code cannot be empty',
        language: normalizedLang,
        executionTime: 0
      };
    }

    if (code.length > 50000) {
      return {
        success: false,
        error: 'Code exceeds maximum length (50KB)',
        language: normalizedLang,
        executionTime: 0
      };
    }

    if (input && input.length > 10240) {
      return {
        success: false,
        error: 'Input exceeds maximum length (10KB)',
        language: normalizedLang,
        executionTime: 0
      };
    }

    // Prepare Piston request
    const requestPayload = {
      language: normalizedLang,
      version: '*', // Latest version
      files: [
        {
          name: `main.${getFileExtension(normalizedLang)}`,
          content: code
        }
      ]
    };

    // Add stdin if provided
    if (input && input.trim().length > 0) {
      requestPayload.stdin = input;
    }

    // Execute with timeout
    const startTime = Date.now();
    const response = await axios.post(PISTON_API_URL, requestPayload, {
      timeout: (timeLimit + 5) * 1000, // Add buffer
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const executionTime = Date.now() - startTime;

    // Parse Piston response
    const { run, compile } = response.data;
    
    // Check for compilation errors
    if (compile && compile.stderr && compile.stderr.trim().length > 0) {
      return {
        success: false,
        error: compile.stderr,
        output: '',
        language: normalizedLang,
        executionTime,
        stage: 'compile'
      };
    }

    // Check for runtime errors
    if (run && run.stderr && run.stderr.trim().length > 0) {
      return {
        success: false,
        error: run.stderr,
        output: run.stdout || '',
        language: normalizedLang,
        executionTime,
        stage: 'runtime'
      };
    }

    // Success
    return {
      success: true,
      output: (run && run.stdout) || '',
      error: '',
      language: normalizedLang,
      executionTime,
      stage: 'success'
    };

  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
    
    // Handle specific Piston errors
    if (err.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Piston service unavailable. Please try again later.',
        language,
        executionTime: 0
      };
    }

    if (err.code === 'ENOTFOUND') {
      return {
        success: false,
        error: 'Cannot reach Piston service (network error).',
        language,
        executionTime: 0
      };
    }

    return {
      success: false,
      error: `Execution error: ${errorMsg}`,
      language,
      executionTime: 0
    };
  }
}

/**
 * Get file extension for a language
 */
function getFileExtension(language) {
  const extensions = {
    'python': 'py',
    'javascript': 'js',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp'
  };
  return extensions[language] || language;
}

/**
 * Check if Piston service is available
 */
async function healthCheck() {
  try {
    const response = await axios.post(PISTON_API_URL, {
      language: 'javascript',
      version: '*',
      files: [{ name: 'test.js', content: 'console.log("ok")' }]
    }, { timeout: 5000 });
    
    return { healthy: true, message: 'Piston API is responsive' };
  } catch (err) {
    return { healthy: false, message: err.message };
  }
}

module.exports = {
  executeCode,
  getFileExtension,
  healthCheck,
  LANGUAGE_MAP
};
