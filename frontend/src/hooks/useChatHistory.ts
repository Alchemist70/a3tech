/**
 * useChatHistory: Hook for managing chat history (export, delete, retrieve)
 */

import { useCallback, useState } from 'react';
import api from '../api';
import { jsPDF } from 'jspdf';

export interface ConversationMetadata {
  conversationId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  metadata?: {
    title?: string;
    summary?: string;
  };
}

export const useChatHistory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all chat histories
  const fetchHistories = useCallback(
    async (limit = 10, offset = 0) => {
      setLoading(true);
      try {
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
        const params: any = { limit, offset };
        if (localUserId) params.userId = localUserId;
        const res = await api.get('/chat-history', { params, withCredentials: true });
        const data = res.data;
        if (data && data.success) {
          setError(null);
          return data.data;
        }
        setError((data && data.error) || 'Failed to fetch histories');
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

  // Fetch a specific conversation
  const fetchConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = {};
      if (localUserId) params.userId = localUserId;
      const res = await api.get(`/chat-history/${encodeURIComponent(conversationId)}`, { params, withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return data.data;
      }
      setError((data && data.error) || 'Failed to fetch conversation');
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export all chat histories as JSON file
  const exportHistory = useCallback(async () => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = {};
      if (localUserId) params.userId = localUserId;
      const res = await api.get('/chat-history/export/all', { params, responseType: 'blob', withCredentials: true });
      const blob = res.data;
      if (!blob) {
        setError('Export failed');
        return false;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chat-history-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Export all chat histories as PDF (client-side generated via print dialog)
  const exportHistoryPdf = useCallback(async () => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = {};
      if (localUserId) params.userId = localUserId;
      const res = await api.get('/chat-history/export/all', { params, withCredentials: true });
      const data = res.data;
      if (!data) {
        setError('Export failed');
        return false;
      }

      // Fallback: render a plain-text PDF using jsPDF text layout to guarantee proper wrapping
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40; // pts
      const usableWidth = pageWidth - margin * 2;
      let cursorY = margin;
      const lineHeight = 14;

      const addWrappedText = (text: string, opts?: { fontSize?: number; fontName?: string; fontStyle?: any }) => {
        const fontSize = opts?.fontSize || 11;
        pdf.setFontSize(fontSize);
        const lines = (pdf as any).splitTextToSize(text, usableWidth);
        for (const line of lines) {
          if (cursorY + lineHeight > pageHeight - margin) {
            pdf.addPage();
            cursorY = margin;
            pdf.setFontSize(fontSize);
          }
          pdf.text(line, margin, cursorY);
          cursorY += lineHeight;
        }
      };

      // Header
      pdf.setFontSize(16);
      addWrappedText(`Chat History Export — ${new Date(data.exportedAt || Date.now()).toLocaleString()}`);
      cursorY += 6;
      pdf.setFontSize(11);
      addWrappedText(`Total conversations: ${data.totalConversations || (data.conversations && data.conversations.length) || 0}`);
      cursorY += 8;

      (data.conversations || []).forEach((c: any, idx: number) => {
        pdf.setFontSize(13);
        addWrappedText(`${idx + 1}. ${c.metadata?.title || c.conversationId}`);
        cursorY += 4;
        pdf.setFontSize(10);
        addWrappedText(`Messages: ${c.messageCount || (c.messages ? c.messages.length : 0)} • Updated: ${new Date(c.updatedAt).toLocaleString()}`);
        cursorY += 6;

        (c.messages || []).forEach((m: any) => {
          pdf.setFontSize(11);
          const who = m.role === 'user' ? 'You' : 'Einstein';
          addWrappedText(`${who}:`, { fontSize: 11 });
          // message content
          const content = String(m.content || '');
          addWrappedText(content, { fontSize: 11 });
          pdf.setFontSize(9);
          addWrappedText(new Date(m.timestamp).toLocaleString(), { fontSize: 9 });
          cursorY += 6;
        });

        // separator
        cursorY += 4;
      });

      pdf.save(`chat-history-${Date.now()}.pdf`);

      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a specific conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = {};
      if (localUserId) params.userId = localUserId;
      const res = await api.delete(`/chat-history/${encodeURIComponent(conversationId)}`, { params, withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return true;
      }
      setError((data && data.error) || 'Delete failed');
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete all conversations (with confirmation)
  const deleteAllConversations = useCallback(async () => {
    if (!window.confirm('Are you sure? This will permanently delete all your chat histories.')) {
      return false;
    }

    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const body = { confirmed: true, ...(localUserId ? { userId: localUserId } : {}) };
      const res = await api.post('/chat-history/delete/all', body, { withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return true;
      }
      setError((data && data.error) || 'Delete failed');
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get cleanup policy status
  const getCleanupStatus = useCallback(async () => {
    setLoading(true);
    try {
      const localUserId = typeof window !== 'undefined' ? localStorage.getItem('einstein-chat-user-id') : null;
      const params: any = {};
      if (localUserId) params.userId = localUserId;
      const res = await api.get('/chat-history/status/cleanup', { params, withCredentials: true });
      const data = res.data;
      if (data && data.success) {
        setError(null);
        return data.retentionPolicy;
      }
      setError((data && data.error) || 'Failed to fetch cleanup status');
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchHistories,
    fetchConversation,
    exportHistory,
    exportHistoryPdf,
    deleteConversation,
    deleteAllConversations,
    getCleanupStatus
  };
};
