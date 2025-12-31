/**
 * Code Executor Component with Monaco Editor
 * Provides a full IDE-like experience for code execution with interactive I/O support
 */

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Alert,
  Chip,
  Stack,
  Divider,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import { useInteractiveCodeExecution } from '../../hooks/useInteractiveCodeExecution';
import '../../styles/CodeExecutor.css';

interface CodeExecutorProps {
  initialLanguage?: string;
  initialCode?: string;
  onClose?: () => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  python: '#366994',
  javascript: '#f7df1e',
  java: '#007396',
  cpp: '#00599c',
  c: '#a8b9cc'
};

export const CodeExecutor: React.FC<CodeExecutorProps> = ({
  initialLanguage = 'python',
  initialCode = '',
  onClose
}) => {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(initialLanguage);
  const [input, setInput] = useState('');
  const [languages, setLanguages] = useState<any[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useInteractive, setUseInteractive] = useState(true);
  const [hasExecutedCode, setHasExecutedCode] = useState(false); // Track if user has run code

  const batchExec = useCodeExecution();
  const interactiveExec = useInteractiveCodeExecution();

  // Destructure stable callbacks from hooks to avoid changing object identity
  const { getSupportedLanguages, getCodeSample } = batchExec;

  // Determine which execution method to use
  const effectiveInteractive = useInteractive && interactiveExec.isConnected;
  const isLoading = effectiveInteractive ? interactiveExec.isRunning : batchExec.isLoading;
  const result = effectiveInteractive ? 
    { 
      success: interactiveExec.success,
      output: interactiveExec.output.join('\n'),
      error: interactiveExec.errors.join('\n'),
      executionTime: interactiveExec.executionTime
    } : 
    batchExec.result;
  const stats = batchExec.stats;

  // CRITICAL FIX: Only show output if the user has explicitly run code
  // This prevents "Execution failed" from appearing on initial render
  const shouldShowResult = hasExecutedCode && result;

  // Load supported languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      const langs = await getSupportedLanguages();
      setLanguages(langs);
    };
    loadLanguages();
  }, [getSupportedLanguages]);

  // Load sample code when language changes
  useEffect(() => {
    const loadSample = async () => {
      const sample = await getCodeSample(language);
      if (sample && !code) {
        setCode(sample);
      }
    };
    loadSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const handleExecute = async () => {
    if (!code.trim()) {
      alert('Please enter some code');
      return;
    }

    // Mark that the user has executed code (shows the result area)
    setHasExecutedCode(true);

    // If the code requires interactive stdin (simple heuristic), and interactive
    // websocket is unavailable, prompt user to provide stdin via the Input field.
    const needsStdin = (() => {
      const lang = (language || '').toLowerCase();
      try {
        if (lang === 'python') return /\binput\s*\(/.test(code);
        if (lang === 'javascript') return /\bprompt\s*\(/.test(code);
        if (lang === 'java') return /new\s+Scanner\(|Scanner\./.test(code);
        if (lang === 'c' || lang === 'cpp') return /scanf\s*\(|scanf\s*\(/.test(code);
      } catch (e) {
        return false;
      }
      return false;
    })();

    // CRITICAL FIX: Code with stdin requirements cannot use interactive mode (Socket.IO)
    // because Docker without a TTY cannot handle real-time stdin/stdout properly.
    // Force batch mode for code with input() calls.
    if (needsStdin && !input.trim()) {
      // Show input area and inform the user to provide stdin
      setShowInput(true);
      setUseInteractive(false); // Force batch mode
      alert('This program requires input. Please provide input in the Input field below and run again. Batch mode will be used for proper stdin handling.');
      return;
    }

    // If code needs stdin and input is provided, always use batch mode (more reliable than interactive)
    if (needsStdin && input.trim()) {
      setUseInteractive(false);
      await batchExec.executeCode(code, language, input);
      return;
    }

    // If interactive mode is desired and connected, use it; otherwise fall back to batch.
    if (effectiveInteractive) {
      interactiveExec.executeCode(code, language);
    } else {
      await batchExec.executeCode(code, language, input);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setHasExecutedCode(false); // Clear the executed flag when code is cleared
  };

  const handleClearInput = () => {
    setInput('');
  };

  const handleCopyOutput = () => {
    const output = useInteractive ? interactiveExec.output.join('\n') : result?.output;
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadOutput = () => {
    const output = useInteractive ? interactiveExec.output.join('\n') : result?.output;
    if (output) {
      const element = document.createElement('a');
      const file = new Blob([output], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `output_${Date.now()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  const currentLanguage = languages.find(l => l.id === language);
  const hasOutput = result && (result.output || result.error);

  return (
    <Box className="code-executor-container">
      <Grid container spacing={2}>
        {/* Toolbar */}
        <Grid item xs={12}>
          <Card elevation={0} className="executor-toolbar">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    label="Language"
                    disabled={isLoading}
                  >
                    {languages.map(lang => (
                      <MenuItem key={lang.id} value={lang.id}>
                        {lang.icon} {lang.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {currentLanguage && (
                  <Chip
                    label={`v${currentLanguage.version}`}
                    size="small"
                    variant="outlined"
                    sx={{ bgcolor: LANGUAGE_COLORS[language], color: 'white', borderColor: LANGUAGE_COLORS[language] }}
                  />
                )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={useInteractive}
                      onChange={(e) => setUseInteractive(e.target.checked)}
                      disabled={!interactiveExec.isConnected}
                    />
                  }
                  label="Interactive"
                  title={interactiveExec.isConnected ? 'Enable real-time input/output streaming' : 'Interactive unavailable — not connected to execution server'}
                />

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="Load sample code">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => getCodeSample(language).then(sample => setCode(sample))}
                    disabled={isLoading}
                  >
                    Load Sample
                  </Button>
                </Tooltip>

                <Tooltip title="Clear code">
                  <IconButton
                    size="small"
                    onClick={handleClearCode}
                    disabled={isLoading || !code}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Button
                  variant="contained"
                  color="success"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                  onClick={handleExecute}
                  disabled={isLoading}
                >
                  Run Code
                </Button>

                {onClose && (
                  <Tooltip title="Close">
                    <IconButton size="small" onClick={onClose}>
                      ✕
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Editor Area */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} className="editor-card">
            <CardHeader
              title="Code Editor"
              subheader={`${code.length} characters`}
              titleTypographyProps={{ variant: 'subtitle1' }}
            />
            <CardContent sx={{ p: 0, height: 400 }}>
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Input/Output Area */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            {/* Input Section (only for batch mode) */}
            {!useInteractive && (
              <Card elevation={2}>
                <CardHeader
                  title="Input (Optional)"
                  action={
                    <Tooltip title={showInput ? 'Hide' : 'Show'}>
                      <Button
                        size="small"
                        onClick={() => setShowInput(!showInput)}
                      >
                        {showInput ? '▼ Hide' : '▶ Show'}
                      </Button>
                    </Tooltip>
                  }
                  titleTypographyProps={{ variant: 'subtitle1' }}
                />
                {showInput && (
                  <CardContent sx={{ p: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Enter input for stdin (max 10KB)"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={isLoading}
                      variant="outlined"
                      size="small"
                    />
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={handleClearInput}
                        disabled={!input}
                      >
                        Clear
                      </Button>
                    </Box>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Output Section */}
            <Card elevation={2} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <CardHeader
                title={useInteractive ? 'Output (Live)' : 'Output'}
                action={
                  shouldShowResult && (
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Copy output">
                        <IconButton
                          size="small"
                          onClick={handleCopyOutput}
                          disabled={!result.output}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download output">
                        <IconButton
                          size="small"
                          onClick={handleDownloadOutput}
                          disabled={!result.output}
                        >
                          <GetAppIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  )
                }
                titleTypographyProps={{ variant: 'subtitle1' }}
              />

              <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                )}

                {!isLoading && !hasOutput && (
                  <Typography variant="body2" color="textSecondary">
                    Output will appear here...
                  </Typography>
                )}

                {shouldShowResult && (
                  <>
                    {result.success ? (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Execution successful in {result.executionTime}ms
                        </Alert>
                        {result.output && (
                          <Paper
                            elevation={0}
                            sx={{
                              bgcolor: '#1e1e1e',
                              color: '#d4d4d4',
                              p: 2,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxHeight: 250,
                              overflow: 'auto',
                              borderRadius: 1
                            }}
                          >
                            {result.output}
                          </Paper>
                        )}
                      </Box>
                    ) : (
                      <>
                        <Alert severity="error" sx={{ mb: 2 }}>
                          Execution failed
                        </Alert>
                        {result.error && (
                          <Paper
                            elevation={0}
                            sx={{
                              bgcolor: '#2d1f1f',
                              color: '#ff6b6b',
                              p: 2,
                              fontFamily: 'monospace',
                              fontSize: 12,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              maxHeight: 250,
                              overflow: 'auto',
                              borderRadius: 1
                            }}
                          >
                            {result.error}
                          </Paper>
                        )}
                        {result.output && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                              Partial Output:
                            </Typography>
                            <Paper
                              elevation={0}
                              sx={{
                                bgcolor: '#1e1e1e',
                                color: '#d4d4d4',
                                p: 2,
                                fontFamily: 'monospace',
                                fontSize: 12,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: 150,
                                overflow: 'auto',
                                borderRadius: 1
                              }}
                            >
                              {result.output}
                            </Paper>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}

                {stats.remainingRequests !== undefined && !useInteractive && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                    <Typography variant="caption" color="textSecondary">
                      Executions remaining: {stats.remainingRequests}/10 per minute
                    </Typography>
                  </Box>
                )}

                {copied && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Output copied to clipboard!
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CodeExecutor;
