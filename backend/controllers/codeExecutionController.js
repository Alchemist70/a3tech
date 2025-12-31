/**
 * Code Execution Controller
 * Handles code execution requests via Piston API with Docker fallback
 */

const pistonClient = require('../services/pistonClient');
const dockerExecutor = require('../services/dockerExecutor');

/**
 * POST /api/code/execute
 * Execute code and return output
 * 
 * Request body:
 * {
 *   code: string,          // Source code to execute
 *   language: string,      // Programming language (python, javascript, java, cpp, c)
 *   input?: string,        // Optional stdin input
 *   timeLimit?: number     // Optional time limit in seconds (default 10)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   output?: string,       // Program output (stdout)
 *   error?: string,        // Error message or stderr
 *   language: string,      // Normalized language name
 *   executionTime: number, // Time in milliseconds
 *   stage?: string         // 'compile', 'runtime', or 'success'
 * }
 */
async function executeCode(req, res) {
  try {
    const { code, language, input, timeLimit } = req.body;
    const userId = req.userId; // Set by rate limit middleware

    // Validate required fields
    if (!code || !language) {
      return res.status(400).json({
        success: false,
        error: 'Code and language are required'
      });
    }

    // Validate language
    const supportedLanguages = ['python', 'python3', 'javascript', 'js', 'node', 'java', 'c', 'cpp', 'c++'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${Object.keys(pistonClient.LANGUAGE_MAP).join(', ')}`
      });
    }

    // Validate code length
    if (code.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Code exceeds maximum length (50KB)'
      });
    }

    // Validate input length
    if (input && input.length > 10240) {
      return res.status(400).json({
        success: false,
        error: 'Input exceeds maximum length (10KB)'
      });
    }

    // Try Piston first, fall back to Docker if Piston fails
    let result;
    let executionMethod = 'piston';

    // Attempt Piston execution
    result = await pistonClient.executeCode(
      code,
      language,
      input || '',
      timeLimit || 10
    );

    // If Piston failed and Docker is available, try Docker
    if (!result.success && result.error && result.error.includes('Piston')) {
      const dockerStatus = dockerExecutor.getStatus();
      if (dockerStatus.dockerAvailable) {
        console.log(`[CodeExecution] Piston failed, trying Docker for User: ${userId}`);
        result = await dockerExecutor.executeCode(
          code,
          language,
          input || '',
          timeLimit || 10
        );
        executionMethod = 'docker';
      }
    }

    // Truncate very large outputs (prevent response bloat)
    if (result.output && result.output.length > 50000) {
      result.output = result.output.substring(0, 50000) + '\n... (output truncated)';
    }

    // Log execution (for monitoring/debugging)
    console.log(`[CodeExecution] User: ${userId}, Language: ${language}, Time: ${result.executionTime}ms, Success: ${result.success}, Method: ${executionMethod}`);

    res.json(result);

  } catch (error) {
    console.error('[CodeExecution] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during code execution'
    });
  }
}

/**
 * GET /api/code/languages
 * Get list of supported languages
 */
function getSupportedLanguages(req, res) {
  const languages = [
    {
      id: 'python',
      name: 'Python 3',
      version: '3.10+',
      icon: '🐍',
      extension: 'py'
    },
    {
      id: 'javascript',
      name: 'JavaScript (Node.js)',
      version: '18+',
      icon: '🟨',
      extension: 'js'
    },
    {
      id: 'java',
      name: 'Java',
      version: '17+',
      icon: '☕',
      extension: 'java'
    },
    {
      id: 'cpp',
      name: 'C++',
      version: '11',
      icon: '⚙️',
      extension: 'cpp'
    },
    {
      id: 'c',
      name: 'C',
      version: '11',
      icon: '⚙️',
      extension: 'c'
    }
  ];

  res.json({
    success: true,
    languages
  });
}

/**
 * GET /api/code/samples/:language
 * Get code samples for a specific language
 */
function getCodeSample(req, res) {
  const { language } = req.params;
  const samples = {
    python: `# Python Example: Hello World & Calculations
print("Hello, World!")
print()

# Variables and basic math
x = 10
y = 20
print(f"Sum: {x + y}")
print(f"Product: {x * y}")

# List operations
numbers = [1, 2, 3, 4, 5]
print(f"Sum of list: {sum(numbers)}")
print(f"Average: {sum(numbers) / len(numbers)}")

# Loop
print("\\nLoop from 1 to 5:")
for i in range(1, 6):
    print(f"  {i * i}")
`,
    javascript: `// JavaScript Example: Hello World & Calculations
console.log("Hello, World!");
console.log();

// Variables and basic math
const x = 10;
const y = 20;
console.log(\`Sum: \${x + y}\`);
console.log(\`Product: \${x * y}\`);

// Array operations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of array: \${sum}\`);
console.log(\`Average: \${sum / numbers.length}\`);

// Loop
console.log("\\nLoop from 1 to 5:");
for (let i = 1; i <= 5; i++) {
  console.log(\`  \${i * i}\`);
}
`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println();
        
        // Variables and basic math
        int x = 10;
        int y = 20;
        System.out.println("Sum: " + (x + y));
        System.out.println("Product: " + (x * y));
        
        // Array operations
        int[] numbers = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum of array: " + sum);
        System.out.println("Average: " + (sum / (double) numbers.length));
        
        // Loop
        System.out.println("\\nLoop from 1 to 5:");
        for (int i = 1; i <= 5; i++) {
            System.out.println("  " + (i * i));
        }
    }
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "Hello, World!" << std::endl;
    std::cout << std::endl;
    
    // Variables and basic math
    int x = 10;
    int y = 20;
    std::cout << "Sum: " << (x + y) << std::endl;
    std::cout << "Product: " << (x * y) << std::endl;
    
    // Vector operations
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = std::accumulate(numbers.begin(), numbers.end(), 0);
    std::cout << "Sum of vector: " << sum << std::endl;
    std::cout << "Average: " << (sum / (double) numbers.size()) << std::endl;
    
    // Loop
    std::cout << "\\nLoop from 1 to 5:" << std::endl;
    for (int i = 1; i <= 5; i++) {
        std::cout << "  " << (i * i) << std::endl;
    }
    
    return 0;
}
`,
    c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("\\n");
    
    // Variables and basic math
    int x = 10;
    int y = 20;
    printf("Sum: %d\\n", x + y);
    printf("Product: %d\\n", x * y);
    
    // Array operations
    int numbers[] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += numbers[i];
    }
    printf("Sum of array: %d\\n", sum);
    printf("Average: %.2f\\n", sum / 5.0);
    
    // Loop
    printf("\\nLoop from 1 to 5:\\n");
    for (int i = 1; i <= 5; i++) {
        printf("  %d\\n", i * i);
    }
    
    return 0;
}
`
  };

  const normalizedLang = language.toLowerCase();
  const sample = samples[normalizedLang];

  if (!sample) {
    return res.status(404).json({
      success: false,
      error: `No sample available for language: ${language}`
    });
  }

  res.json({
    success: true,
    language: normalizedLang,
    code: sample
  });
}

module.exports = {
  executeCode,
  getSupportedLanguages,
  getCodeSample
};
