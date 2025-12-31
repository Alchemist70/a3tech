/**
 * useUserMemory: Hook for accessing semantic memory and user profile
 */

import { useCallback, useState } from 'react';
import api from '../api';

export interface UserProfile {
  userId: string;
  name?: string;
  occupations: string[];
  interests: string[];
  messageCount: number;
  firstInteraction?: string;
  lastInteraction?: string;
  facts: Array<{
    type: string;
    value: string;
    frequency: number;
    strength: number;
  }>;
}

export interface Memory {
  id: string;
  userId: string;
  conversationId: string;
  messageText: string;
  facts: Array<{
    type: string;
    value: string;
    strength: number;
  }>;
  similarity?: number;
  timestamp: string;
}

export const useUserMemory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's consolidated profile from memory
  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/memory/profile', { withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return data.data as UserProfile;
      }
      setError((data && data.error) || 'Failed to fetch profile');
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Search semantic memories
  const searchMemories = useCallback(
    async (query: string, limit = 5, minSimilarity = 0.5) => {
      setLoading(true);
      try {
        const res = await api.post('/memory/search', { query, limit, minSimilarity }, { withCredentials: true });
        const data = res.data;
        if (data && data.success) {
          setError(null);
          return (data.data as Memory[]) || [];
        }
        setError((data && data.error) || 'Search failed');
        return [];
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Manually index a message to memory
  const indexMessage = useCallback(
    async (conversationId: string, messageText: string, metadata?: Record<string, any>) => {
      setLoading(true);
      try {
        const res = await api.post('/memory/index', { conversationId, messageText, metadata }, { withCredentials: true });
        const data = res.data;
        if (data && data.success) {
          setError(null);
          return data.data;
        }
        setError((data && data.error) || 'Indexing failed');
        return null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Clear all user memories (privacy)
  const clearMemories = useCallback(async () => {
    if (!window.confirm('Permanently clear all semantic memories? This cannot be undone.')) {
      return false;
    }

    setLoading(true);
    try {
      const res = await api.delete('/memory/clear', { data: { confirmed: true }, withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return true;
      }
      setError((data && data.error) || 'Failed to clear memories');
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchUserProfile,
    searchMemories,
    indexMessage,
    clearMemories
  };
};
