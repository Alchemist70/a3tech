import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Pagination,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import SymbolPicker from './SymbolPicker';

const AdminWaecQuestionBankTab: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState('');
  const lastFocusedRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    lastFocusedRef.current = e.target;
  }, []);

  const [formData, setFormData] = useState({
    subject: '',
    questionText: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    correctAnswer: 'A',
    explanation: '',
    difficulty: 'medium',
    tables: [] as any[],
    charts: [] as any[],
    images: [] as any[],
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedSubject]);

  const fetchSubjects = async () => {
    try {
      // Try to fetch from WAEC sections first
      const response = await api.get('/waec-sections');
      const data = Array.isArray(response.data) ? response.data : (response.data && Array.isArray(response.data.data) ? response.data.data : []);
      const sectionNames = Array.isArray(data) ? data.map((section: any) => section.name) : [];
      setSubjects(sectionNames);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Fallback to default WAEC subjects if API fails
      setSubjects([
        'Use of English',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Economics',
        'Geography',
        'History',
        'Civics',
        'Literature in English',
      ]);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (selectedSubject) params.subject = selectedSubject;
      const response = await api.get('/question-bank/waec', { params });
      setQuestions(response.data.questions || []);
      setTotalPages(response.data.totalPages || 1);
      setError('');
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      setError(error.response?.data?.message || 'Error fetching questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (question?: any) => {
    if (question) {
      setEditingId(question._id);
      setFormData({
        subject: question.subject,
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        difficulty: question.difficulty,
        tables: question.tables || [],
        charts: question.charts || [],
        images: question.images || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        subject: '',
        questionText: '',
        options: [
          { label: 'A', text: '' },
          { label: 'B', text: '' },
          { label: 'C', text: '' },
          { label: 'D', text: '' },
        ],
        correctAnswer: 'A',
        explanation: '',
        difficulty: 'medium',
        tables: [],
        charts: [],
        images: [],
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveQuestion = async () => {
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/question-bank/waec/${editingId}`, formData);
      } else {
        await api.post('/question-bank/waec', formData);
      }
      handleCloseDialog();
      // After adding a new question, reset to page 1 and clear subject filter to ensure it appears
      if (!editingId) {
        setPage(1);
        setSelectedSubject(formData.subject || '');
      }
      fetchQuestions();
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error saving question');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await safeDelete(`/question-bank/waec/${id}`);
        fetchQuestions();
        setError('');
      } catch (error: any) {
        const msg = error?.response?.data?.message || error?.message || 'Error deleting question';
        setError(msg);
      }
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], text: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    try {
      setLoading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await api.post('/uploads/image-blob', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success && response.data.data) {
        const newImages = [...formData.images];
        newImages.push(response.data.data);
        setFormData({ ...formData, images: newImages });
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      alert('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlAdd = (url: string) => {
    if (!url.trim()) return;
    const newImages = [...formData.images];
    newImages.push({ type: 'url', data: url, mimeType: 'text/plain' });
    setFormData({ ...formData, images: newImages });
  };

  const handleRemoveImage = (idx: number) => {
    const newImages = [...formData.images];
    newImages.splice(idx, 1);
    setFormData({ ...formData, images: newImages });
  };

  const addTable = () => {
    const newTables = [...formData.tables];
    newTables.push({ title: '', headers: [], rows: [], description: '', rowExplanations: [] });
    setFormData({ ...formData, tables: newTables });
  };

  const updateTable = (idx: number, field: string, value: any) => {
    const newTables = [...formData.tables];
    newTables[idx] = { ...newTables[idx], [field]: value };
    setFormData({ ...formData, tables: newTables });
  };

  const updateTableRows = (idx: number, rowsText: string) => {
    const rows = rowsText
      .split('\n')
      .map(line => (line.trim() === '' ? [] : line.split(',').map(c => c.trim())));
    updateTable(idx, 'rows', rows);
  };

  const updateTableRowExplanation = (tableIdx: number, rowIdx: number, value: string) => {
    const newTables = [...formData.tables];
    const rowExplanations = [...(newTables[tableIdx].rowExplanations || [])];
    rowExplanations[rowIdx] = value;
    newTables[tableIdx] = { ...newTables[tableIdx], rowExplanations };
    setFormData({ ...formData, tables: newTables });
  };

  const removeTable = (idx: number) => {
    const newTables = [...formData.tables];
    newTables.splice(idx, 1);
    setFormData({ ...formData, tables: newTables });
  };

  const addChart = () => {
    const newCharts = [...formData.charts];
    newCharts.push({ title: '', type: 'bar', labels: [], labelFormat: 'percentage', labelExplanations: [], datasets: [], description: '' });
    setFormData({ ...formData, charts: newCharts });
  };

  const updateChart = (idx: number, field: string, value: any) => {
    const newCharts = [...formData.charts];
    newCharts[idx] = { ...newCharts[idx], [field]: value };
    setFormData({ ...formData, charts: newCharts });
  };

  const addDataset = (chartIdx: number) => {
    const newCharts = [...formData.charts];
    const datasets = [...(newCharts[chartIdx].datasets || [])];
    datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
    newCharts[chartIdx] = { ...newCharts[chartIdx], datasets };
    setFormData({ ...formData, charts: newCharts });
  };

  const updateDataset = (chartIdx: number, dIdx: number, field: string, value: any) => {
    const newCharts = [...formData.charts];
    const datasets = [...(newCharts[chartIdx].datasets || [])];
    datasets[dIdx] = { ...datasets[dIdx], [field]: value };
    newCharts[chartIdx] = { ...newCharts[chartIdx], datasets };
    setFormData({ ...formData, charts: newCharts });
  };

  const removeDataset = (chartIdx: number, dIdx: number) => {
    const newCharts = [...formData.charts];
    const datasets = [...(newCharts[chartIdx].datasets || [])];
    datasets.splice(dIdx, 1);
    newCharts[chartIdx] = { ...newCharts[chartIdx], datasets };
    setFormData({ ...formData, charts: newCharts });
  };

  const removeChart = (idx: number) => {
    const newCharts = [...formData.charts];
    newCharts.splice(idx, 1);
    setFormData({ ...formData, charts: newCharts });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <FormControl sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Filter by Subject</InputLabel>
            <Select
              value={selectedSubject}
              label="Filter by Subject"
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">All Subjects</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Question
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && <CircularProgress />}

      {!loading && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Question</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Answer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question._id || question.id}>
                    <TableCell>
                      <Chip label={question.subject} size="small" />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {question.questionText.substring(0, 50)}...
                    </TableCell>
                    <TableCell>{question.correctAnswer}</TableCell>
                    <TableCell>
                      <Chip
                        label={question.difficulty}
                        size="small"
                        variant="outlined"
                        color={question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell align="right">
                        <IconButton
                          size="small"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleOpenDialog(question)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setDeleteId(question._id || question.id || null);
                            setDeleteName(question.questionText?.substring?.(0, 50) || 'this question');
                            setDeleteOpen(true);
                          }}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
            />
          </Box>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { maxHeight: '90vh', overflowY: 'auto' } }}>
        <DialogTitle>
          {editingId ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, pt: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <SymbolPicker getTarget={() => lastFocusedRef.current} />
          </Box>
          {/* Basic Question Fields */}
          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={formData.subject}
              label="Subject"
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            >
              <MenuItem value="">Select a subject</MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Question Text"
            multiline
            rows={3}
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            onFocus={handleFocus}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {formData.options.map((option, idx) => (
              <TextField
                key={idx}
                label={`Option ${option.label}`}
                value={option.text}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                multiline
                rows={2}
                onFocus={handleFocus}
              />
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={formData.correctAnswer}
                label="Correct Answer"
                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              >
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={formData.difficulty}
                label="Difficulty"
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="Explanation"
            multiline
            rows={3}
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            onFocus={handleFocus}
          />

          <Divider sx={{ my: 2 }} />

          {/* Images Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Images ({formData.images.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Upload Image</Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleImageUpload(e.target.files[0]);
                      }
                    }}
                    style={{ marginBottom: 8 }}
                  />
                </Box>
                <TextField
                  label="Or paste image URL"
                  size="small"
                  fullWidth
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleImageUrlAdd((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  helperText="Press Enter to add"
                  onFocus={handleFocus}
                />
                {formData.images.map((img: any, idx: number) => (
                  <Box key={idx} sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ flex: 1, wordBreak: 'break-word' }}>
                      {img.type === 'url' ? `URL: ${img.data}` : `Uploaded (${img.mimeType})`}
                    </Typography>
                    <Button size="small" color="error" onClick={() => handleRemoveImage(idx)}>Remove</Button>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Tables Section */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Tables ({formData.tables.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                {formData.tables.map((table: any, tIdx: number) => (
                  <Paper key={tIdx} sx={{ p: 2, backgroundColor: '#fafafa', borderLeft: '4px solid #1976d2' }}>
                    <TextField
                      fullWidth
                      label="Table Title"
                      value={table.title}
                      onChange={(e) => updateTable(tIdx, 'title', e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Headers (comma-separated)"
                      value={table.headers?.join(', ') || ''}
                      onChange={(e) => updateTable(tIdx, 'headers', e.target.value.split(',').map((h: string) => h.trim()))}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={table.description}
                      onChange={(e) => updateTable(tIdx, 'description', e.target.value)}
                      multiline
                      rows={2}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, comma-separated)</Typography>
                    <TextField
                      multiline
                      fullWidth
                      minRows={4}
                      maxRows={12}
                      value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                      onChange={(e) => updateTableRows(tIdx, e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Row Explanations (optional)</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {Array.isArray(table.rows) && table.rows.map((row: any, rIdx: number) => (
                        <TextField key={rIdx} label={`Row ${rIdx + 1} Explanation`} value={(table.rowExplanations && table.rowExplanations[rIdx]) || ''} onChange={(e) => updateTableRowExplanation(tIdx, rIdx, e.target.value)} size="small" sx={{ width: 220 }} onFocus={handleFocus} />
                      ))}
                    </Box>
                    <Button size="small" color="error" onClick={() => removeTable(tIdx)}>Remove Table</Button>
                  </Paper>
                ))}
                <Button variant="outlined" size="small" onClick={addTable}>Add Table</Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Charts Section */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Charts ({formData.charts.length})</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                {formData.charts.map((chart: any, cIdx: number) => (
                  <Paper key={cIdx} sx={{ p: 2, backgroundColor: '#fafafa', borderLeft: '4px solid #f57c00' }}>
                    <TextField
                      fullWidth
                      label="Chart Title"
                      value={chart.title}
                      onChange={(e) => updateChart(cIdx, 'title', e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Select
                      fullWidth
                      value={chart.type || 'bar'}
                      onChange={(e) => updateChart(cIdx, 'type', e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    >
                      <MenuItem value="bar">Bar Chart</MenuItem>
                      <MenuItem value="pie">Pie Chart</MenuItem>
                      <MenuItem value="histogram">Histogram</MenuItem>
                      <MenuItem value="line">Line Chart</MenuItem>
                    </Select>
                    <TextField
                      fullWidth
                      label="Labels (comma-separated)"
                      value={chart.labels?.join(', ') || ''}
                      onChange={(e) => updateChart(cIdx, 'labels', e.target.value.split(',').map((l: string) => l.trim()))}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Display Format</Typography>
                    <Select value={chart.labelFormat || 'percentage'} onChange={(e) => updateChart(cIdx, 'labelFormat', e.target.value)} size="small" sx={{ width: 200, mb: 1 }}>
                      <MenuItem value="percentage">Percentage (%)</MenuItem>
                      <MenuItem value="degrees">Degrees (°)</MenuItem>
                    </Select>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Explanations (optional)</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {Array.isArray(chart.labels) && chart.labels.map((label: string, lIdx: number) => (
                        <TextField key={lIdx} label={`${label} Explanation`} value={(chart.labelExplanations && chart.labelExplanations[lIdx]) || ''} onChange={(e) => updateChart(cIdx, 'labelExplanations', (() => {
                          const arr = [...(chart.labelExplanations || [])];
                          arr[lIdx] = e.target.value;
                          return arr;
                        })())} size="small" sx={{ width: 220 }} />
                      ))}
                    </Box>
                    <TextField
                      fullWidth
                      label="Description"
                      value={chart.description}
                      onChange={(e) => updateChart(cIdx, 'description', e.target.value)}
                      multiline
                      rows={2}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets</Typography>
                    {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
                      <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                        <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={(e) => updateDataset(cIdx, dIdx, 'label', e.target.value)} size="small" fullWidth sx={{ mb: 1 }} />
                        <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={(e) => updateDataset(cIdx, dIdx, 'data', e.target.value.split(',').map((n: string) => Number(n.trim()) || 0))} size="small" fullWidth sx={{ mb: 1 }} />
                        <TextField label="Background Color (hex or comma-separated per-label colors)" value={dataset.backgroundColor || ''} onChange={(e) => updateDataset(cIdx, dIdx, 'backgroundColor', e.target.value)} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" />
                        <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={(e) => updateDataset(cIdx, dIdx, 'borderColor', e.target.value)} size="small" fullWidth placeholder="#FF6384" />
                        <Button color="error" variant="outlined" size="small" onClick={() => removeDataset(cIdx, dIdx)} sx={{ mt: 1 }}>Remove Dataset</Button>
                      </Box>
                    ))}
                    <Button variant="outlined" size="small" onClick={() => addDataset(cIdx)} sx={{ mb: 1 }}>Add Dataset</Button>
                    <Button size="small" color="error" onClick={() => removeChart(cIdx)}>Remove Chart</Button>
                  </Paper>
                ))}
                <Button variant="outlined" size="small" onClick={addChart}>Add Chart</Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveQuestion} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog (WAEC) */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{deleteName}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (!deleteId) return setError('Invalid question id');
              try {
                await safeDelete(`/question-bank/waec/${deleteId}`);
                setDeleteOpen(false);
                setDeleteId(null);
                fetchQuestions();
                setError('');
              } catch (err: any) {
                setError(err?.response?.data?.message || err?.message || 'Error deleting question');
                setDeleteOpen(false);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminWaecQuestionBankTab;
