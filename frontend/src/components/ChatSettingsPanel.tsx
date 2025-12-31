/**
 * ChatSettingsPanel: Modal for managing chat history, privacy settings, and exports
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useChatHistory } from '../hooks/useChatHistory';
import { useChatPersistence } from '../hooks/useChatPersistence';
import { useTheme } from '@mui/material/styles';

interface ChatSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
);

export const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({
  open,
  onClose,
  conversationId
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [histories, setHistories] = useState<any[]>([]);
  
  const {
    loading: histLoading,
    error: histError,
    fetchHistories,
    exportHistory,
    exportHistoryPdf,
    deleteConversation,
    deleteAllConversations
  } = useChatHistory();

  const {
    settings,
    loading: privLoading,
    error: privError,
    updateSettings
  } = useChatPersistence(conversationId);

  useEffect(() => {
    if (open && tabValue === 1) {
      loadHistories();
    }
  }, [open, tabValue]);

  const loadHistories = async () => {
    const data = await fetchHistories(100);
    // fetchHistories returns an array of conversations (or null on error).
    // Older code expected an object with a `data` property; normalize here.
    if (data) {
      setHistories(Array.isArray(data) ? data : (data.data || []));
    } else {
      setHistories([]);
    }
  };

  const handleExportJson = async () => {
    const success = await exportHistory();
    if (success) {
      alert('✓ Chat history exported (JSON) successfully!');
    }
  };

  const handleExportPdf = async () => {
    const success = await exportHistoryPdf();
    if (success) {
      alert('PDF print dialog opened. Save as PDF from your browser.');
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!window.confirm(`Delete conversation "${convId}"?`)) return;
    const success = await deleteConversation(convId);
    if (success) {
      setHistories(histories.filter(h => h.conversationId !== convId));
    }
  };

  const handleDeleteAll = async () => {
    const success = await deleteAllConversations();
    if (success) {
      setHistories([]);
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    await updateSettings(conversationId, { [key]: value });
  };

  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: theme.palette.common.white,
        padding: 2,
        fontWeight: 600,
        position: 'relative'
      }}>
        Chat Settings & History
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'inherit' }}
          size="small"
        >
          ✕
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label="Privacy" />
          <Tab label="History" />
        </Tabs>

        {/* PRIVACY TAB */}
        <TabPanel value={tabValue} index={0}>
          {privError && <Alert severity="error">{privError}</Alert>}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Data Storage Settings
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.storeChatHistory}
                    onChange={(e) => handleSettingChange('storeChatHistory', e.target.checked)}
                    disabled={privLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Store Chat History
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Save conversations for future reference
                    </Typography>
                  </Box>
                }
              />

              <Divider />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowSemanticIndexing}
                    onChange={(e) => handleSettingChange('allowSemanticIndexing', e.target.checked)}
                    disabled={privLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Semantic Indexing
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Index messages for intelligent recall
                    </Typography>
                  </Box>
                }
              />

              <Divider />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.allowPIIStorage}
                    onChange={(e) => handleSettingChange('allowPIIStorage', e.target.checked)}
                    disabled={privLoading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Store Personal Information
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Save names, emails, etc. (requires consent)
                    </Typography>
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <Alert severity="info">
                <Typography variant="caption">
                  <strong>Retention Policy:</strong> Conversations automatically deleted after 90 days of inactivity.
                </Typography>
              </Alert>
            </Box>
          </Box>
        </TabPanel>

        {/* HISTORY TAB */}
        <TabPanel value={tabValue} index={1}>
          {histError && <Alert severity="error">{histError}</Alert>}

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<DownloadIcon />}
                onClick={handleExportJson}
                disabled={histLoading || histories.length === 0}
                size="small"
              >
                Export JSON
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleExportPdf}
                disabled={histLoading || histories.length === 0}
                size="small"
              >
                Export PDF
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteAll}
                disabled={histLoading || histories.length === 0}
                size="small"
              >
                Delete All
              </Button>
            </Box>

            {histLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : histories.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', p: 2 }}>
                No conversations found
              </Typography>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {histories.map((h) => (
                  <ListItem
                    key={h.conversationId}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteConversation(h.conversationId)}
                        disabled={histLoading}
                        size="small"
                        title="Delete this conversation"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={h.metadata?.title || h.conversationId}
                      secondary={`${(h.messages && Array.isArray(h.messages) ? h.messages.length : (h.messageCount || 0))} messages • ${new Date(h.updatedAt).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatSettingsPanel;

