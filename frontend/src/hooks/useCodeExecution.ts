/**
 * useCodeExecution Hook
 * Manages code execution API calls to the backend
 */

import { useState, useCallback } from 'react';
import api from '../api'; // Centralized axios instance

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  language: string;
  executionTime: number;
  stage?: string;
}

interface ExecutionStats {
  remainingRequests?: number;
  rateLimitReset?: number;
}

export function useCodeExecution() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [stats, setStats] = useState<ExecutionStats>({});

  const executeCode = useCallback(async (
    code: string,
    language: string,
    input?: string,
    timeLimit?: number
  ): Promise<ExecutionResult> => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await api.post('/code/execute', {
        code,
        language,
        input: input || '',
        timeLimit: timeLimit || 10
      });

      const data = response.data as ExecutionResult;

      // Extract rate limit info from headers
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];

      setStats({
        remainingRequests: remaining ? parseInt(remaining, 10) : undefined,
        rateLimitReset: reset ? parseInt(reset, 10) : undefined
      });

      setResult(data);
      return data;
    } catch (error: any) {
      const errorResult: ExecutionResult = {
        success: false,
        error: error.response?.data?.error || error.message || 'Execution failed',
        language,
        executionTime: 0
      };

      // Handle rate limiting
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;
        errorResult.error = `Rate limit exceeded. Try again in ${retryAfter || 60} seconds.`;
      }

      setResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getSupportedLanguages = useCallback(async () => {
    try {
      const response = await api.get('/code/languages');
      return response.data.languages || [];
    } catch (error: any) {
      console.error('Failed to fetch languages:', error);
      return [];
    }
  }, []);

  const getCodeSample = useCallback(async (language: string) => {
    try {
      const response = await api.get(`/code/samples/${language}`);
      return response.data.code || '';
    } catch (error: any) {
      console.error('Failed to fetch sample:', error);
      return '';
    }
  }, []);

  return {
    executeCode,
    getSupportedLanguages,
    getCodeSample,
    isLoading,
    result,
    stats
  };
}
