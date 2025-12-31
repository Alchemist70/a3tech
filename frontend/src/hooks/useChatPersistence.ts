/**
 * useChatPersistence: Hook for managing chat history persistence and privacy settings
 */

import { useCallback, useState, useEffect } from 'react';
import api from '../api';

export interface PrivacySettings {
  storeChatHistory: boolean;
  allowSemanticIndexing: boolean;
  allowPIIStorage: boolean;
  userConsent: boolean;
  consentDate?: string;
}

export interface PersistenceOptions {
  conversationId: string;
  settings?: Partial<PrivacySettings>;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  storeChatHistory: true,
  allowSemanticIndexing: true,
  allowPIIStorage: false,
  userConsent: false,
  consentDate: undefined
};

export const useChatPersistence = (conversationId?: string) => {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current privacy settings
  const fetchSettings = useCallback(async (convId: string) => {
    if (!convId) return;
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = { conversationId: convId };
      if (localUserId) params.userId = localUserId;
      const res = await api.get('/privacy/settings', { params, withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setSettings(data.data);
        setError(null);
      } else {
        setError((data && data.error) || 'Failed to fetch settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update privacy settings
  const updateSettings = useCallback(
    async (convId: string, newSettings: Partial<PrivacySettings>) => {
      setLoading(true);
      try {
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
        const body = { conversationId: convId, settings: newSettings, ...(localUserId ? { userId: localUserId } : {}) };
        const res = await api.post('/privacy/settings', body, { withCredentials: true });
        const data = res.data;
        if (data && data.success) {
          setSettings(data.data);
          setError(null);
        } else {
          setError((data && data.error) || 'Failed to update settings');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Give consent for data retention
  const giveConsent = useCallback(
    async (convId: string, consentType = 'all') => {
      setLoading(true);
      try {
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
        const body = { conversationId: convId, consentType, ...(localUserId ? { userId: localUserId } : {}) };
        const res = await api.post('/privacy/consent', body, { withCredentials: true });
        const data = res.data;
        if (data && data.success) {
          setSettings(data.data);
          setError(null);
        } else {
          setError((data && data.error) || 'Failed to record consent');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Withdraw consent
  const withdrawConsent = useCallback(async (convId: string) => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const body = { conversationId: convId, ...(localUserId ? { userId: localUserId } : {}) };
      const res = await api.post('/privacy/withdraw-consent', body, { withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setSettings(data.data);
        setError(null);
      } else {
        setError((data && data.error) || 'Failed to withdraw consent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load settings on mount or when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchSettings(conversationId);
    }
  }, [conversationId, fetchSettings]);

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    giveConsent,
    withdrawConsent
  };
};
