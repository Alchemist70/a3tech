import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Paper, TextField, Typography, List, ListItem, ListItemText, Avatar, Tooltip } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatSettingsPanel from '../ChatSettingsPanel';
import './ChatWidget.css';
import * as chatApi from '../../api/chat';
import { useAuth } from '../../contexts/AuthContext';

// Load MathJax for rendering mathematical symbols
declare global {
  interface Window {
    MathJax: any;
  }
}

const ChatWidget: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Generate or retrieve a persistent user ID for unauthenticated users
  const [userId] = useState(() => {
    const key = 'einstein-chat-user-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(key, id);
    }
    return id;
  });

  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'bot'; text?: string; html?: string; rag?: any[] }>>([]);
  const [sending, setSending] = useState(false);
  const [liveStatus, setLiveStatus] = useState('Einstein is ready to help');
  const [conversationId] = useState(`conv-${Date.now()}`);
  const listRef = useRef<HTMLUListElement | null>(null);
  const liveTimeoutRef = useRef<number | null>(null);
  const soundPlayedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Play notification sound on mount and when user logs in or page refreshes
  useEffect(() => {
    if (isAuthenticated && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      // Play a pleasant notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a pleasant chime sound: two notes
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else if (!isAuthenticated) {
      // Reset the flag when user logs out
      soundPlayedRef.current = false;
    }
  }, [isAuthenticated]);

  // Close and reset chatbot when user logs out
  useEffect(() => {
    if (isAuthenticated) {
      // Prepare Einstein immediately after login (ensure welcome message exists)
      // Do NOT open the widget automatically; wait for user to open it.
      setMessages(prev => {
        if (!prev || prev.length === 0) {
          return [{ from: 'bot', text: 'Hi! I am Einstein — I can help answer your questions about the A3 website, our projects, and research and any of your queries. Ask me anything.' }];
        }
        return prev;
      });
      setLiveStatus('Einstein is ready to help');
    } else {
      setOpen(false);
      setMessages([]);
      setInput('');
      setSettingsOpen(false);
    }
  }, [isAuthenticated]);

  // Load MathJax on component mount
  // Lazy-load MathJax only when a message contains LaTeX markers.
  useEffect(() => {
    let loading = false;

    const mathPattern = /(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\\begin\{)/;

    const shouldLoad = messages.some(m => {
      const t = String(m.text || m.html || '');
      return mathPattern.test(t);
    });

    if (!shouldLoad) return;
    if ((window as any).MathJax) return;

    if (loading) return;
    loading = true;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.async = true;

    script.onload = () => {
      try {
        if ((window as any).MathJax) {
          (window as any).MathJax.typesetPromise = (window as any).MathJax.typesetPromise || [];
          (window as any).MathJax.contentDocument = document;
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[MathJax] onload handler error', e);
      }
    };

    script.onerror = (e) => {
      // Do not throw — just log and continue without MathJax.
      // eslint-disable-next-line no-console
      console.warn('[MathJax] failed to load script', e);
    };

    document.head.appendChild(script);

    return () => {
      // don't remove the script on unmount — keep MathJax available for the session
    };
  }, [messages]);

  // Re-render MathJax when messages change
  useEffect(() => {
    if (window.MathJax?.typesetPromise) {
      try {
        window.MathJax.typesetPromise([document.body]).catch((err: any) => {
          // eslint-disable-next-line no-console
          console.warn('[MathJax] Typeset error:', err);
        });
      } catch (e) {
        // Ignore MathJax errors
      }
    }
  }, [messages]);

  // Initialize welcome message on component mount
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) {
        return [{ from: 'bot', text: 'Hi! I am Einstein — I can help answer your questions about the A3 website, our projects, and research and any of your queries. Ask me anything.' }];
      }
      return prev;
    });
    setLiveStatus('Einstein is ready to help');
    return () => {
      if (liveTimeoutRef.current) {
        window.clearTimeout(liveTimeoutRef.current);
        liveTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Focus the input when the widget is opened by the user
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      try {
        inputRef.current?.focus();
      } catch (e) {
        // ignore
      }
    }, 80);
    return () => window.clearTimeout(t);
  }, [open]);

  // When a new bot message arrives and the widget is open, focus the input
  useEffect(() => {
    if (!open || !messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last && last.from === 'bot') {
      const t = window.setTimeout(() => {
        try {
          inputRef.current?.focus();
        } catch (e) {
          // ignore
        }
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [messages, open]);

  // basic sanitizer + simple markdown-like formatting (bold **text**) and linkification
  // IMPORTANT: Preserves LaTeX math notation for proper symbol rendering
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const linkify = (s: string) => {
    const urlRegex = /(https?:\/\/[\w\-./?%&=+#~:,;@()]+)/g;
    return s.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  };
  const formatSimple = (s: string) => {
    if (!s) return '';
    
    // Extract LaTeX math sections to preserve them (don't escape)
    // Supports \(...\) for inline, \[...\] for display, and $$...$$ for display
    const mathPattern = /(\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
    const mathSections: Array<{ placeholder: string; content: string }> = [];
    let mathIndex = 0;
    
    let textWithPlaceholders = s.replace(mathPattern, (match) => {
      const placeholder = `__MATH_${mathIndex}__`;
      mathSections.push({ placeholder, content: match });
      mathIndex++;
      return placeholder;
    });
    
    // Process non-math text
    let out = escapeHtml(textWithPlaceholders);
    
    // bold **text** -> <strong>
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // inline code `code` -> <code>
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    // convert URLs to links
    out = linkify(out);
    // convert newlines to <br>
    out = out.replace(/\r?\n/g, '<br/>');
    
    // Restore LaTeX math sections (unescaped so MathJax can process them)
    mathSections.forEach(({ placeholder, content }) => {
      out = out.replace(placeholder, content);
    });
    
    return out;
  };

  // Helper to format source name from RAG context without exposing file paths
  const formatSourceName = (source: string, text?: string) => {
    if (!source) return 'Source';
    // If project id, try to extract a human title from the snippet
    if (source.startsWith('project:')) {
      const lines = (text || '').split('\n').map(l => l.trim()).filter(Boolean);
      const title = lines.find(l => l.length > 25 && !/[:{}()[\]\]/.test(l));
      if (title) return title.substring(0, 80);
      return 'Project reference';
    }

    // Remove common prefixes then take basename (no folder paths)
    let name = source.replace(/^(file:|data:|project:)/, '');
    name = name.replace(/\\/g, '/');
    const parts = name.split('/');
    name = parts[parts.length - 1] || parts[0] || name;
    // Remove file extension
    name = name.replace(/\.[a-z0-9]{1,6}$/i, '');
    // Convert delimiters to spaces and title-case a bit
    name = name.replace(/[-_]+/g, ' ').trim();
    if (name.length === 0) return 'Source';
    return name.length > 60 ? name.substring(0, 60) + '...' : name;
  };

  // Create a short, user-friendly snippet for RAG excerpts
  const formatSnippet = (text?: string, max = 180) => {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    // Prefer a full sentence-like fragment
    const sentences = cleaned.split(/(?<=[.?!])\s+/);
    const candidate = sentences.find(s => s.length > 40 && !/[:{}=<>]/.test(s));
    const out = (candidate || cleaned).substring(0, max).trim();
    return out.length < cleaned.length ? out + '…' : out;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setSending(true);
    // announce typing to screen readers
    setLiveStatus('Einstein is typing');
    // clear any previous reset timer
    if (liveTimeoutRef.current) {
      window.clearTimeout(liveTimeoutRef.current);
      liveTimeoutRef.current = null;
    }
    try {
      // If this message looks like a confirmation ("yes, search the site"),
      // send the previous user message to the backend so RAG can search for it
      const lastUserMessage = messages.slice().reverse().find(m => m.from === 'user')?.text || undefined;
      const isConfirmationLocal = /\b(search the site|search site|show related pages|show related|search for me|yes,? search|yes,? show|ok,? search|please search|please do|do it|go ahead|search for that|find it|show me|please show)\b/i.test(text) || (/^\s*(yes|y|ok|sure|please|affirmative|please do|do it)\s*[,.!]?\s*$/i.test(text) && text.length < 40);
      const res = await chatApi.sendMessage(text, conversationId, userId, isConfirmationLocal ? lastUserMessage : undefined);
      // If backend returns structured rag data, capture it
      const replyText = (res && (res.reply || res.message || res.data)) || '';
      const rag = (res && res.rag) || (res && res.contexts) || null;
      const html = formatSimple(String(replyText));
      setMessages(prev => [...prev, { from: 'bot', text: String(replyText), html, rag }]);

      // update live region to indicate response arrived
      setLiveStatus('Einstein has responded');
      // after a short delay, reset live region to ready
      liveTimeoutRef.current = window.setTimeout(() => {
        setLiveStatus('Einstein is ready to help');
        liveTimeoutRef.current = null;
      }, 3000);
    } catch (err) {
      setMessages(prev => [...prev, { from: 'bot', text: 'There was an error contacting the chat service. Try again later.', html: formatSimple('There was an error contacting the chat service. Try again later.') }]);
      setLiveStatus('Einstein is available');
      // reset after short delay
      liveTimeoutRef.current = window.setTimeout(() => {
        setLiveStatus('Einstein is ready to help');
        liveTimeoutRef.current = null;
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="chat-toggle-root">
        {!open && isAuthenticated && (
          <Tooltip title="Chat with Einstein" arrow>
            <IconButton 
              color="primary" 
              onClick={() => setOpen(true)} 
              size="large" 
              aria-label="Open Einstein chat"
              sx={{
                position: 'relative',
                animation: 'pulse-bounce 2s infinite',
                '@keyframes pulse-bounce': {
                  '0%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 0 rgba(0, 102, 255, 0.7)'
                  },
                  '50%': {
                    transform: 'scale(1.05)',
                  },
                  '100%': {
                    transform: 'scale(1)',
                    boxShadow: '0 0 0 12px rgba(0, 102, 255, 0)'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#ff1744',
                  borderRadius: '50%',
                  animation: 'pulse-badge 2s ease-in-out infinite',
                  boxShadow: '0 0 8px rgba(255, 23, 68, 0.6)',
                  '@keyframes pulse-badge': {
                    '0%, 100%': {
                      transform: 'scale(1)',
                      opacity: 1
                    },
                    '50%': {
                      transform: 'scale(1.2)',
                      opacity: 0.8
                    }
                  }
                }
              }}
            >
              <ChatIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </div>

      {open && isAuthenticated && (
        <Paper elevation={8} className="chat-widget-container" role="dialog" aria-label="Einstein chat widget">
          <Box className="chat-header">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={process.env.PUBLIC_URL + '/favicon.png'} alt="Einstein" aria-hidden />
              <Typography variant="subtitle1">Einstein</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Chat Settings & History">
                <IconButton size="small" onClick={() => setSettingsOpen(true)} aria-label="Open chat settings">
                  <SettingsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close Einstein chat">
                <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close Einstein chat">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          {/* Accessible live region for screen readers when widget opens */}
          <div role="status" aria-live="polite" className="sr-only">{liveStatus}</div>

          <List className="chat-messages" ref={listRef as any}>
            {messages.map((m, i) => (
              <ListItem key={i} sx={{ alignItems: 'flex-start' }}>
                <ListItemText
                  primary={m.from === 'user' ? 'You' : 'Einstein'}
                  secondary={
                    m.from === 'user' ? (
                      m.text
                    ) : (
                      <div>
                        {/* Render formatted HTML reply when available */}
                        {m.html ? (
                          <div dangerouslySetInnerHTML={{ __html: m.html }} />
                        ) : (
                          <div>{m.text}</div>
                        )}

                        {/* If RAG contexts exist, show compact source list with expandable excerpts */}
                        {m.rag && Array.isArray(m.rag) && m.rag.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Related sources</div>
                            <ul style={{ paddingLeft: '1rem', marginTop: 6 }}>
                              {m.rag.slice(0, 5).map((r, idx) => (
                                <li key={idx} style={{ marginBottom: 6 }}>
                                    <details style={{ padding: '6px 0' }}>
                                      <summary style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500, color: '#1976d2', userSelect: 'none', padding: '4px 0' }}>
                                        📄 {formatSourceName(r.source, r.text)}
                                        <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: 400, marginTop: 6 }}>{formatSnippet(String(r.text || ''))}</div>
                                      </summary>
                                      <div style={{ marginTop: 8 }} dangerouslySetInnerHTML={{ __html: formatSimple(String(r.text || '')) }} />
                                  </details>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  }
                />
              </ListItem>
            ))}
            {sending && (
              <ListItem sx={{ alignItems: 'flex-start' }}>
                <ListItemText primary="Einstein" secondary={<em>Typing…</em>} />
              </ListItem>
            )}
          </List>

          <Box className="chat-input-row">
            <TextField
              placeholder="Type a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
              size="small"
              fullWidth
              inputRef={inputRef}
              inputProps={{ 'aria-label': 'Einstein chat input' }}
            />
            <IconButton color="primary" onClick={handleSend} disabled={sending} aria-label="Send message to Einstein">
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}

      {open && !isAuthenticated && (
        <Paper elevation={8} className="chat-widget-container" role="dialog" aria-label="Einstein chat widget - login required">
          <Box className="chat-header">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar src={process.env.PUBLIC_URL + '/favicon.png'} alt="Einstein" aria-hidden />
              <Typography variant="subtitle1">Einstein</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Close Einstein chat">
                <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close Einstein chat">
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ p: 3, textAlign: 'center', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Authentication Required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: '90%' }}>
              To use Einstein and access personalized chat features, you need to be logged in.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column', width: '100%', maxWidth: '250px' }}>
              <button
                onClick={() => window.location.href = '/login'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1565c0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1976d2')}
              >
                Login
              </button>
              <button
                onClick={() => window.location.href = '/signup'}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'background-color 0.3s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
              >
                Register
              </button>
            </Box>
          </Box>
        </Paper>
      )}

      {isAuthenticated && (
        <ChatSettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          conversationId={conversationId}
        />
      )}
    </>
  );
};

export default ChatWidget;
