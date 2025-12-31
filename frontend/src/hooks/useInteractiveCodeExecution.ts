import { useCallback, useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface ExecutionState {
  isRunning: boolean;
  output: string[];
  errors: string[];
  executionTime: number;
  success: boolean;
}

export function useInteractiveCodeExecution() {
  const [state, setState] = useState<ExecutionState>({
    isRunning: false,
    output: [],
    errors: [],
    executionTime: 0,
    success: false
  });

  const socketRef = useRef<Socket | null>(null);
  const authTokenRef = useRef<string | null>(null);

  // Initialize socket connection once
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    authTokenRef.current = token;

    if (!token) {
      console.log('[Interactive] No auth token found, skipping connection');
      return;
    }

    // Connect to socket.io server at /code-execution namespace
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const baseUrl = apiBase.replace(/\/api\/?$/, '');
    
    // Socket.IO v4+ connects to namespace via URL path
    // io('http://localhost:5000/code-execution') connects to /code-execution namespace
    const socketUrl = `${baseUrl}/code-execution`;
    console.log('[Interactive] Attempting to connect to:', socketUrl);
    
    socketRef.current = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    if (!socketRef.current) {
      console.error('[Interactive] Failed to create socket instance');
      return;
    }

    socketRef.current.on('connect', () => {
      console.log('[Interactive] Connected to code execution server successfully');
    });

    socketRef.current.on('disconnect', () => {
      console.log('[Interactive] Disconnected from code execution server');
    });

    socketRef.current.on('connect_error', (err: any) => {
      console.error('[Interactive] Connection error:', err?.message || err);
      setState((prev) => ({
        ...prev,
        errors: [...prev.errors, `Connection error: ${err?.message || err}`],
        isRunning: false
      }));
    });

    socketRef.current.on('error', (err: any) => {
      console.error('[Interactive] Socket error:', err?.message || err);
      setState((prev) => ({
        ...prev,
        errors: [...prev.errors, `Server error: ${err?.message || err}`],
        isRunning: false
      }));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const executeCode = useCallback(
    (code: string, language: string, timeLimit = 10) => {
      const socket = socketRef.current;
      if (!socket || !socket.connected) {
        setState((prev) => ({
          ...prev,
          errors: ['Not connected to execution server. Please refresh the page.']
        }));
        return;
      }

      // Reset state
      setState({
        isRunning: true,
        output: [],
        errors: [],
        executionTime: 0,
        success: false
      });

      // Set up listeners
      socket.off('output');
      socket.off('error');
      socket.off('complete');

      socket.on('output', (line: string) => {
        setState((prev) => ({
          ...prev,
          output: [...prev.output, line]
        }));
      });

      socket.on('error', (line: string) => {
        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, line]
        }));
      });

      socket.on('complete', (result: any) => {
        setState({
          isRunning: false,
          output: result.totalOutput ? result.totalOutput.split('\n') : state.output,
          errors: result.totalError ? result.totalError.split('\n') : state.errors,
          executionTime: result.executionTime,
          success: result.success
        });
      });

      // Send execution request
      socket.emit('execute', { code, language, timeLimit });
    },
    [state.output, state.errors]
  );

  const provideInput = useCallback((input: string) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('provide-input', { input });
    }
  }, []);

  return {
    ...state,
    executeCode,
    provideInput,
    isConnected: socketRef.current?.connected ?? false
  };
}
