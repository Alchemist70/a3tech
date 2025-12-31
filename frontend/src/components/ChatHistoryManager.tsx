/**
 * ChatHistoryManager: UI component for managing chat history (view, export, delete)
 */

import React, { useEffect, useState } from 'react';
import { useChatHistory } from '../hooks/useChatHistory';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

export const ChatHistoryManager: React.FC = () => {
  const theme = useTheme();
  const {
    loading,
    error,
    fetchHistories,
    exportHistory,
    deleteConversation,
    deleteAllConversations,
    getCleanupStatus,
  } = useChatHistory();

  const [histories, setHistories] = useState<any[]>([]);
  const [cleanupStatus, setCleanupStatus] = useState<any>(null);
  const [showExpanded, setShowExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchHistories(50);
    if (data) setHistories(data.data || []);
    const status = await getCleanupStatus();
    if (status) setCleanupStatus(status);
  };

  const handleExport = async () => {
    const success = await exportHistory();
    if (success) {
      alert('Chat history exported successfully!');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!window.confirm(`Delete conversation "${conversationId}"?`)) return;
    const success = await deleteConversation(conversationId);
    if (success) {
      setHistories((s) => s.filter((h) => h.conversationId !== conversationId));
      alert('Conversation deleted.');
    }
  };

  const handleDeleteAll = async () => {
    const success = await deleteAllConversations();
    if (success) {
      setHistories([]);
      alert('All conversations deleted.');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        my: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Chat History Manager</Typography>
        <Button size="small" onClick={() => setShowExpanded((s) => !s)}>
          {showExpanded ? '▼' : '▶'} {histories.length} Conversation(s)
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {showExpanded && (
        <Box sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" color="success" size="small" onClick={handleExport} disabled={loading || histories.length === 0}>
              📥 Export All
            </Button>
            <Button variant="contained" color="error" size="small" onClick={handleDeleteAll} disabled={loading || histories.length === 0}>
              🗑️ Delete All
            </Button>
          </Stack>

          {cleanupStatus && (
            <Paper variant="outlined" sx={{ p: 1, mb: 2, borderLeft: '4px solid', borderColor: 'primary.main', backgroundColor: 'background.default' }}>
              <Typography variant="caption" sx={{ display: 'block' }}><strong>Retention Policy:</strong> {cleanupStatus.ttlDays} days</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}><strong>Active:</strong> {cleanupStatus.activeCount} | <strong>Expired:</strong> {cleanupStatus.expiredCount}</Typography>
            </Paper>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={20} /></Box>
          ) : histories.length === 0 ? (
            <Paper sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No conversations found.</Paper>
          ) : (
            <Stack spacing={1}>
              {histories.map((history) => (
                <Paper key={history.conversationId} variant="outlined" sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{history.metadata?.title || history.conversationId}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{history.messageCount || 0} messages</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Created: {new Date(history.createdAt).toLocaleDateString()} • Updated: {new Date(history.updatedAt).toLocaleDateString()}</Typography>
                  </Box>
                  <IconButton edge="end" color="error" onClick={() => handleDeleteConversation(history.conversationId)} disabled={loading} size="small" sx={{ ml: 1 }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ChatHistoryManager;
