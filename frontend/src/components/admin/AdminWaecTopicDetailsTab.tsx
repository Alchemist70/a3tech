import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, MenuItem, Select, Divider, Grid, Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails, SelectChangeEvent, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MarkdownToolbar from '../MarkdownToolbar';
import SymbolPicker from './SymbolPicker';
import api from '../../api';
import { v4 as uuidv4 } from 'uuid';

interface Section {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

interface Topic {
  _id?: string;
  id?: string;
  sectionId: string;
  name: string;
  slug?: string;
  uuid?: string;
}

interface CodeSnippet {
  code: string;
  language: string;
}

interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'code';
}

interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanations: string[];
  tables?: Table[];
  charts?: Chart[];
  images?: Image[];
}

interface Table {
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
  rowExplanations?: string[];
}

interface Image {
  type: 'url' | 'blob';
  data: string;
  mimeType?: string;
  size?: number;
}

interface Chart {
  title: string;
  type: 'bar' | 'pie' | 'histogram' | 'line';
  labels: string[];
  labelExplanations?: string[];
  labelFormat?: 'percentage' | 'degrees';
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
  description?: string;
}

interface Lesson {
  title: string;
  content?: string;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  codeSnippets?: CodeSnippet[];
  contentBlocks?: ContentBlock[];
  resources?: Resource[];
  quizzes?: Quiz[];
}

interface TopicDetail {
  _id?: string;
  id?: string;
  topicUUID: string;
  sectionId: string;
  slug?: string;
  description?: string;
  content?: string;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  codeSnippets?: CodeSnippet[];
  lessons?: Lesson[];
  contentBlocks?: ContentBlock[];
  tables?: Table[];
  charts?: Chart[];
  resources?: Resource[];
  quizzes?: Quiz[];
}

type BlockType = 'text' | 'image' | 'diagram' | 'video' | 'table' | 'chart';
interface ContentBlock {
  type: BlockType;
  value: string;
}

const emptyLesson: Lesson = { title: '', contentBlocks: [], resources: [], quizzes: [] } as any;
const emptyDetail: TopicDetail = { topicUUID: '', sectionId: '', slug: '', description: '', contentBlocks: [], lessons: [], resources: [], quizzes: [], tables: [], charts: [] } as any;

const AdminWaecTopicDetailsTab: React.FC = () => {
  // component state and handlers
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicDetails, setTopicDetails] = useState<TopicDetail[]>([]);
  const [newDetail, setNewDetail] = useState<any>({ ...emptyDetail });
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const lastFocusedRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const blockLabel = (type: BlockType) => {
    switch (type) {
      case 'text': return 'Text Block';
      case 'image': return 'Image URL';
      case 'diagram': return 'Diagram URL';
      case 'video': return 'Video URL';
      default: return '';
    }
  };

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    lastFocusedRef.current = e.target;
  }, []);

  const handleQuizImageUpload = async (file: File, quizIdx: number, isNew: boolean = true) => {
    if (!file) return;
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await api.post('/uploads/image-blob', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success && response.data.data) {
        if (isNew) {
          setNewDetail((d: typeof emptyDetail) => {
            const quizzes = [...(d.quizzes || [])];
            const images = [...(quizzes[quizIdx].images || [])];
            images.push(response.data.data);
            quizzes[quizIdx] = { ...quizzes[quizIdx], images };
            return { ...d, quizzes };
          });
        } else {
          setEditFields((f: typeof emptyDetail | null) => {
            if (!f) return f;
            const quizzes = [...(f.quizzes || [])];
            const images = [...(quizzes[quizIdx].images || [])];
            images.push(response.data.data);
            quizzes[quizIdx] = { ...quizzes[quizIdx], images };
            return { ...f, quizzes };
          });
        }
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      alert('Failed to upload image');
    }
  };

  const handleQuizImageUrlAdd = (url: string, quizIdx: number, isNew: boolean = true) => {
    if (!url.trim()) return;

    const imageObj = { type: 'url' as const, data: url };

    if (isNew) {
      setNewDetail((d: typeof emptyDetail) => {
        const quizzes = [...(d.quizzes || [])];
        const images = [...(quizzes[quizIdx].images || [])];
        images.push(imageObj);
        quizzes[quizIdx] = { ...quizzes[quizIdx], images };
        return { ...d, quizzes };
      });
    } else {
      setEditFields((f: typeof emptyDetail | null) => {
        if (!f) return f;
        const quizzes = [...(f.quizzes || [])];
        const images = [...(quizzes[quizIdx].images || [])];
        images.push(imageObj);
        quizzes[quizIdx] = { ...quizzes[quizIdx], images };
        return { ...f, quizzes };
      });
    }
  };

  const handleRemoveQuizImage = (quizIdx: number, imgIdx: number, isNew: boolean = true) => {
    if (isNew) {
      setNewDetail((d: typeof emptyDetail) => {
        const quizzes = [...(d.quizzes || [])];
        const images = [...(quizzes[quizIdx].images || [])];
        images.splice(imgIdx, 1);
        quizzes[quizIdx] = { ...quizzes[quizIdx], images };
        return { ...d, quizzes };
      });
    } else {
      setEditFields((f: typeof emptyDetail | null) => {
        if (!f) return f;
        const quizzes = [...(f.quizzes || [])];
        const images = [...(quizzes[quizIdx].images || [])];
        images.splice(imgIdx, 1);
        quizzes[quizIdx] = { ...quizzes[quizIdx], images };
        return { ...f, quizzes };
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, topicsRes, detailsRes] = await Promise.all([
          api.get('/waec-sections', { withCredentials: true }),
          api.get('/waec-topics', { withCredentials: true }),
          api.get('/waec-topic-details', { withCredentials: true })
        ]);
        const sectionsData = sectionsRes.data || [];
        const topicsData = topicsRes.data || [];
        const detailsData = detailsRes.data || [];
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
        const normalizedTopics = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalizedTopics);
        setTopicDetails(Array.isArray(detailsData) ? detailsData : []);
        if (Array.isArray(sectionsData) && sectionsData.length > 0) {
          setNewDetail((d: typeof emptyDetail) => ({ ...d, sectionId: sectionsData[0]._id || sectionsData[0].id || '' }));
        }
      } catch {
        setSections([]);
        setTopics([]);
        setTopicDetails([]);
      }
    };
    fetchData();
  }, []);

  const handleAdd = async () => {
      const topicUUIDStr = (newDetail && newDetail.topicUUID) ? String(newDetail.topicUUID) : '';
      const slugStr = (newDetail && newDetail.slug) ? String(newDetail.slug) : '';
      const descStr = (newDetail && newDetail.description) ? String(newDetail.description) : '';
      const sectionIdVal = newDetail && newDetail.sectionId ? newDetail.sectionId : '';
      if (!topicUUIDStr.trim() || !sectionIdVal || !slugStr.trim() || !descStr.trim()) {
        setError('Please fill in all required fields.');
        setSnackbarOpen(true);
        return;
      }
    const filteredLessons = Array.isArray(newDetail.lessons)
      ? newDetail.lessons.filter((lesson: Lesson) => lesson && (lesson.title?.trim() || (Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.length > 0)))
      : [];
    const incompleteResource = Array.isArray(newDetail.resources) && newDetail.resources.some((r: any) => !r.title?.trim() || !r.url?.trim() || !r.type);
    if (incompleteResource) {
      setError('Please fill in all fields for every resource (title, url, type).');
      setSnackbarOpen(true);
      return;
    }
    const incompleteQuiz = Array.isArray(newDetail.quizzes) && newDetail.quizzes.some((q: any) => {
      const hasQuestion = q.question?.trim();
      const hasOptions = Array.isArray(q.options) && q.options.length > 0;
      const hasTables = Array.isArray(q.tables) && q.tables.length > 0;
      const hasCharts = Array.isArray(q.charts) && q.charts.length > 0;
      return !hasQuestion || (!hasOptions && !hasTables && !hasCharts);
    });
    if (incompleteQuiz) {
      setError('Please fill in all fields for every quiz (question, and either options, tables, or charts).');
      setSnackbarOpen(true);
      return;
    }
    try {
      const filteredResources = Array.isArray(newDetail.resources)
        ? newDetail.resources.filter((r: any) => r && r.title?.trim() && r.url?.trim() && r.type)
        : [];
      const filteredQuizzes = Array.isArray(newDetail.quizzes)
        ? newDetail.quizzes.filter((q: any) => {
          const hasQuestion = q.question?.trim();
          const hasValidOptions = Array.isArray(q.options) && q.options.length > 0 && q.options.every((opt: string) => opt.trim());
          const hasValidTables = Array.isArray(q.tables) && q.tables.length > 0;
          const hasValidCharts = Array.isArray(q.charts) && q.charts.length > 0;
          return q && hasQuestion && (hasValidOptions || hasValidTables || hasValidCharts);
        })
        : [];
      const payload = {
        ...newDetail,
        topicUUID: topicUUIDStr.trim(),
        sectionId: sectionIdVal,
        slug: slugStr.trim(),
        description: descStr.trim(),
        lessons: filteredLessons,
        contentBlocks: Array.isArray(newDetail.contentBlocks) ? newDetail.contentBlocks : [],
        resources: filteredResources,
        quizzes: filteredQuizzes
      };
      const res = await api.post('/waec-topic-details', payload, { withCredentials: true });
      const created = res.data;
      if (!created) {
        setError('Failed to add WAEC topic detail.');
        setSnackbarOpen(true);
        return;
      }
      setTopicDetails([...topicDetails, created]);
      setNewDetail({ ...emptyDetail, sectionId: newDetail.sectionId });
      setMessage('WAEC topic detail added successfully!');
      setSnackbarOpen(true);
    } catch (err) {
      setError('Failed to add WAEC topic detail.');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/waec-topic-details/${id}`, { withCredentials: true });
      const data = res.data;
      // backend returns either { success: true } or { message: 'Deleted' } on success
      const ok = (data && (data.success === true || typeof data.message === 'string')) || res.status === 200;
      if (!ok) {
        setError((data && (data.error || data.message)) || 'Failed to delete WAEC topic detail.');
        setSnackbarOpen(true);
        return;
      }
      setTopicDetails(topicDetails.filter(td => (td._id || td.id) !== id));
      setMessage('WAEC topic detail deleted.');
      setSnackbarOpen(true);
    } catch (err) {
      const serverMsg = (err as any)?.response?.data?.error || (err as any)?.response?.data?.message || (err as any)?.message || 'Failed to delete WAEC topic detail.';
      setError(String(serverMsg));
      setSnackbarOpen(true);
    }
    setDeleteOpen(false);
    setDeleteId(null);
    setDeleteName('');
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setDeleteOpen(true);
  };
  
  const handleEdit = (detail: TopicDetail) => {
    setEditId(detail._id || detail.id || '');
    setEditFields({
      ...detail,
      resources: Array.isArray(detail.resources) ? detail.resources : [],
      quizzes: Array.isArray(detail.quizzes) ? detail.quizzes : [],
      lessons: Array.isArray(detail.lessons) ? detail.lessons : [],
      contentBlocks: Array.isArray(detail.contentBlocks) ? detail.contentBlocks : [],
    });
  };

  const handleSave = async (id: string) => {
    if (!editFields) return;
    const filteredLessons = Array.isArray(editFields.lessons)
      ? editFields.lessons.filter((lesson: Lesson) => lesson && (lesson.title?.trim() || (Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.length > 0)))
      : [];
    const incompleteResource = Array.isArray(editFields.resources) && editFields.resources.some((r: any) => !r.title?.trim() || !r.url?.trim() || !r.type);
    if (incompleteResource) {
      setError('Please fill in all fields for every resource (title, url, type).');
      setSnackbarOpen(true);
      return;
    }
    const incompleteQuiz = Array.isArray(editFields.quizzes) && editFields.quizzes.some((q: any) => {
      const hasQuestion = q.question?.trim();
      const hasOptions = Array.isArray(q.options) && q.options.length > 0;
      const hasTables = Array.isArray(q.tables) && q.tables.length > 0;
      const hasCharts = Array.isArray(q.charts) && q.charts.length > 0;
      return !hasQuestion || (!hasOptions && !hasTables && !hasCharts);
    });
    if (incompleteQuiz) {
      setError('Please fill in all fields for every quiz (question, and either options, tables, or charts).');
      setSnackbarOpen(true);
      return;
    }
    try {
      const filteredResources = Array.isArray(editFields.resources)
        ? editFields.resources.filter((r: any) => r && r.title?.trim() && r.url?.trim() && r.type)
        : [];
      const filteredQuizzes = Array.isArray(editFields.quizzes)
        ? editFields.quizzes.filter((q: any) => {
          const hasQuestion = q.question?.trim();
          const hasValidOptions = Array.isArray(q.options) && q.options.length > 0 && q.options.every((opt: string) => opt.trim());
          const hasValidTables = Array.isArray(q.tables) && q.tables.length > 0;
          const hasValidCharts = Array.isArray(q.charts) && q.charts.length > 0;
          return q && hasQuestion && (hasValidOptions || hasValidTables || hasValidCharts);
        })
        : [];
      const payload = {
        ...editFields,
        lessons: filteredLessons,
        contentBlocks: editFields.contentBlocks,
        resources: filteredResources,
        quizzes: filteredQuizzes
      };
      if (!payload.resources) payload.resources = [];
      if (!payload.quizzes) payload.quizzes = [];
      if (!payload.lessons) payload.lessons = [];
      if (!payload.contentBlocks) payload.contentBlocks = [];
      const res = await api.put(`/waec-topic-details/${id}`, payload, { withCredentials: true });
      const updated = res.data;
      if (!updated) {
        setError('Failed to update WAEC topic detail.');
        setSnackbarOpen(true);
        return;
      }
      if (!updated.resources) updated.resources = [];
      if (!updated.quizzes) updated.quizzes = [];
      if (!updated.lessons) updated.lessons = [];
      if (!updated.contentBlocks) updated.contentBlocks = [];
      setTopicDetails(topicDetails.map(td => ((td._id || td.id) === id ? updated : td)));
      setEditId(null);
      setEditFields(null);
      setMessage('WAEC topic detail updated!');
      setSnackbarOpen(true);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to update WAEC topic detail.';
      setError(String(serverMsg));
      setSnackbarOpen(true);
    }
  };

  return (
    <Box>
      <Snackbar
        open={snackbarOpen && (!!message || !!error)}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={error ? 'error' : 'success'} sx={{ width: '100%' }}>
          {error || message}
        </Alert>
      </Snackbar>
      <Typography variant="h6" gutterBottom>Manage WAEC Topic Details</Typography>
      <Box sx={{ position: 'fixed', left: 0, right: 0, top: 'calc(var(--appbar-height, 64px) + var(--admin-header-height, 48px) + var(--admin-tabs-height, 48px))', zIndex: 1200, background: 'background.default', pb: 2, pt: 2, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Accordion defaultExpanded sx={{ maxWidth: 1200, margin: '0 auto', mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Formatting Help: Markdown Examples
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 1 }}>
              You can use Markdown formatting in content and lesson fields.
            </Typography>
            <Box sx={{ background: 'background.paper', borderRadius: 2, p: 2, fontFamily: 'monospace', fontSize: 14 }}>
              <div><b>Heading:</b> <code>## My Heading</code></div>
              <div><b>Bold:</b> <code>**bold text**</code></div>
              <div><b>Italic:</b> <code>*italic text*</code></div>
              <div><b>Underline:</b> <span dangerouslySetInnerHTML={{__html: '&lt;u&gt;underlined text&lt;/u&gt;'}} /> <Box component="span" sx={{ color: 'text.secondary' }}>(HTML only)</Box></div>
              <div><b>Strikethrough:</b> <code>~~strikethrough~~</code></div>
              <div><b>Paragraph break:</b> <code>Line 1\n\nLine 2</code></div>
              <div><b>List:</b> <code>- item 1\n- item 2</code></div>
              <div><b>Numbered List:</b> <code>1. First\n2. Second</code></div>
              <div><b>Blockquote:</b> <code>&gt; quoted text</code></div>
              <div><b>Code:</b> <code>`inline code`</code></div>
              <div><b>Code Block:</b> <code>```js\ncode here\n```</code></div>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Box sx={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <MarkdownToolbar getTarget={() => lastFocusedRef.current} handleAddChange={e => {
            const { name, value } = (e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>).target;
            setNewDetail((prev: typeof emptyDetail) => ({ ...prev, [name]: value }));
            if (editFields && editId) {
              setEditFields((prev: typeof emptyDetail | null) => prev ? { ...prev, [name]: value } : prev);
            }
          }} />
          <SymbolPicker getTarget={() => lastFocusedRef.current} />
        </Box>
      </Box>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Add New WAEC Topic Detail</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Select
              value={newDetail.sectionId}
              onChange={(e: SelectChangeEvent<string>) => setNewDetail((d: typeof emptyDetail) => ({ ...d, sectionId: e.target.value as string }))}
              size="small"
              fullWidth
            >
              {sections.map(section => (
                <MenuItem key={section._id || section.id} value={section._id || section.id}>{section.name}</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={3}>
            <Select
              value={newDetail.topicUUID}
              onChange={(e: SelectChangeEvent<string>) => setNewDetail((d: typeof emptyDetail) => ({ ...d, topicUUID: e.target.value as string }))}
              size="small"
              fullWidth
              displayEmpty
              renderValue={selected => {
                if (!selected) return 'Select Topic UUID';
                const topic = topics.find(t => t.uuid === selected);
                return topic ? `${topic.name} (${topic.uuid})` : selected;
              }}
            >
              <MenuItem value="" disabled>Select Topic UUID</MenuItem>
              {topics.filter(topic => topic.sectionId === newDetail.sectionId).map(topic => (
                <MenuItem key={topic.uuid} value={topic.uuid}>{topic.name} ({topic.uuid})</MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Slug" name="slug" value={newDetail.slug || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDetail((d: typeof emptyDetail) => ({ ...d, slug: e.target.value }))} size="small" fullWidth onFocus={handleFocus} />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField label="Description" name="description" value={newDetail.description || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDetail((d: typeof emptyDetail) => ({ ...d, description: e.target.value }))} size="small" fullWidth onFocus={handleFocus} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Resources</Typography>
        {Array.isArray(newDetail.resources) && newDetail.resources.map((resource: any, idx: number) => (
          <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
            <TextField label="Title" value={resource.title} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const resources = [...(d.resources || [])];
              resources[idx] = { ...resources[idx], title: e.target.value };
              return { ...d, resources };
            })} size="small" sx={{ width: 180 }} onFocus={handleFocus} />
            <TextField label="URL" value={resource.url} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const resources = [...(d.resources || [])];
              resources[idx] = { ...resources[idx], url: e.target.value };
              return { ...d, resources };
            })} size="small" sx={{ width: 260 }} onFocus={handleFocus} />
            <Select value={resource.type} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const resources = [...(d.resources || [])];
              resources[idx] = { ...resources[idx], type: e.target.value };
              return { ...d, resources };
            })} size="small" sx={{ width: 120 }}>
              <MenuItem value="article">Article</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="code">Code</MenuItem>
            </Select>
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const resources = [...(d.resources || [])];
              resources.splice(idx, 1);
              return { ...d, resources };
            })}>Remove</Button>
          </Box>
        ))}
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setNewDetail((d: typeof emptyDetail) => ({ ...d, resources: [...(d.resources || []), { title: '', url: '', type: 'article' }] }))}>Add Resource</Button>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Tables</Typography>
        {Array.isArray(newDetail.tables) && newDetail.tables.map((table: any, idx: number) => (
          <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TextField label="Table Title" value={table.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], title: e.target.value };
              return { ...d, tables };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <TextField label="Description" value={table.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], description: e.target.value };
              return { ...d, tables };
            })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
            <TextField value={table.headers ? table.headers.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], headers: e.target.value.split(',').map(h => h.trim()) };
              return { ...d, tables };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, values comma-separated)</Typography>
            <TextField
              multiline
              fullWidth
              minRows={4}
              maxRows={20}
              value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
              onChange={e => {
                const newValue = e.target.value;
                setNewDetail((d: typeof emptyDetail) => {
                  const tables = [...(d.tables || [])];
                  const newRows = newValue.split('\n').map(line => {
                    if (!line.trim()) return [];
                    return line.split(',').map(c => c.trim());
                  });
                  tables[idx] = { ...tables[idx], rows: newRows };
                  return { ...d, tables };
                });
              }}
              size="small"
              sx={{ mb: 1 }}
              onFocus={handleFocus}
            />
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables.splice(idx, 1);
              return { ...d, tables };
            })}>Remove Table</Button>
          </Paper>
        ))}
        

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Charts</Typography>
        {Array.isArray(newDetail.charts) && newDetail.charts.map((chart: any, idx: number) => (
          <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TextField label="Chart Title" value={chart.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], title: e.target.value };
              return { ...d, charts };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Displayed above the chart as its title.</Typography>
            <Select value={chart.type || 'bar'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], type: e.target.value };
              return { ...d, charts };
            })} size="small" sx={{ width: 140, mb: 1 }}>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="histogram">Histogram</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
            </Select>
            <TextField label="Description" value={chart.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], description: e.target.value };
              return { ...d, charts };
            })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              These labels map to chart categories: for bar/line charts they become the x-axis categories; for pie charts they become slice labels. Enter labels in the same order as the dataset values.
            </Typography>
            <TextField value={chart.labels ? chart.labels.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], labels: e.target.value.split(',').map(l => l.trim()) };
              return { ...d, charts };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Display Format (for pie/bar charts)</Typography>
            <Select value={chart.labelFormat || 'percentage'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], labelFormat: e.target.value as any };
              return { ...d, charts };
            })} size="small" sx={{ width: 200, mb: 1 }}>
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="degrees">Degrees (°)</MenuItem>
            </Select>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Each dataset represents one series shown on the chart. <strong>Label</strong> appears in the legend; <strong>Data</strong> must be comma-separated numbers corresponding to each label above; <strong>Background Color</strong> is the fill color; <strong>Border Color</strong> is the stroke color.
            </Typography>
            {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
              <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" onFocus={handleFocus} />
                <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth placeholder="#FF6384" onFocus={handleFocus} />
                <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets.splice(dIdx, 1);
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} sx={{ mt: 1 }}>Remove Dataset</Button>
              </Box>
            ))}
            <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              const datasets = [...(charts[idx].datasets || [])];
              datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
              charts[idx] = { ...charts[idx], datasets };
              return { ...d, charts };
            })} sx={{ mb: 1 }}>Add Dataset</Button>
            <br />
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts.splice(idx, 1);
              return { ...d, charts };
            })}>Remove Chart</Button>
          </Paper>
        ))}
        

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Quizzes</Typography>
        {Array.isArray(newDetail.quizzes) && newDetail.quizzes.map((quiz: any, idx: number) => (
          <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TextField label="Question" value={quiz.question} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const quizzes = [...(d.quizzes || [])];
              quizzes[idx] = { ...quizzes[idx], question: e.target.value };
              return { ...d, quizzes };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              {Array.isArray(quiz.options) && quiz.options.map((opt: string, oidx: number) => (
                <TextField key={oidx} label={`Option ${oidx + 1}`} value={opt} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const options = [...(quizzes[idx].options || [])];
                  options[oidx] = e.target.value;
                  quizzes[idx] = { ...quizzes[idx], options };
                  return { ...d, quizzes };
                })} size="small" sx={{ width: 160 }} onFocus={handleFocus} />
              ))}
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const options = [...(quizzes[idx].options || [])];
                options.push('');
                quizzes[idx] = { ...quizzes[idx], options };
                return { ...d, quizzes };
              })}>Add Option</Button>
              <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const options = [...(quizzes[idx].options || [])];
                options.pop();
                quizzes[idx] = { ...quizzes[idx], options };
                return { ...d, quizzes };
              })}>Remove Option</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const tables = [...(quizzes[idx].tables || [])];
                tables.push({ title: '', description: '', headers: [], rows: [] });
                quizzes[idx] = { ...quizzes[idx], tables };
                return { ...d, quizzes };
              })}>Add Table</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const charts = [...(quizzes[idx].charts || [])];
                charts.push({ title: '', type: 'bar', description: '', labels: [], datasets: [] });
                quizzes[idx] = { ...quizzes[idx], charts };
                return { ...d, quizzes };
              })}>Add Chart</Button>
              <Box>
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Images:</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Upload Image:</Typography>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleQuizImageUpload(e.target.files[0], idx, true);
                      }
                    }}
                    style={{ marginBottom: 8 }}
                  />
                </Box>
                <TextField
                  label="Paste image URL"
                  size="small"
                  sx={{ width: 250, mt: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleQuizImageUrlAdd((e.target as HTMLInputElement).value, idx, true);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  helperText="Press Enter to add"
                  onFocus={handleFocus}
                />
              </Box>
              {Array.isArray(quiz.images) && quiz.images.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1 }}>
                    {quiz.images.map((img: any, imgIdx: number) => (
                      <Chip
                        key={imgIdx}
                        label={img.type === 'url' ? `URL` : `Image`}
                        onDelete={() => handleRemoveQuizImage(idx, imgIdx, true)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            <TextField label="Answer Index" type="number" value={quiz.answer ?? ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const quizzes = [...(d.quizzes || [])];
              quizzes[idx] = { ...quizzes[idx], answer: Number(e.target.value) };
              return { ...d, quizzes };
            })} size="small" sx={{ width: 140, mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              {Array.isArray(quiz.explanations) && quiz.explanations.map((exp: string, eidx: number) => (
                <TextField key={eidx} label={`Explanation ${eidx + 1}`} value={exp} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const explanations = [...(quizzes[idx].explanations || [])];
                  explanations[eidx] = e.target.value;
                  quizzes[idx] = { ...quizzes[idx], explanations };
                  return { ...d, quizzes };
                })} size="small" sx={{ width: 200 }} />
              ))}
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const explanations = [...(quizzes[idx].explanations || [])];
                explanations.push('');
                quizzes[idx] = { ...quizzes[idx], explanations };
                return { ...d, quizzes };
              })}>Add Explanation</Button>
              <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const quizzes = [...(d.quizzes || [])];
                const explanations = [...(quizzes[idx].explanations || [])];
                explanations.pop();
                quizzes[idx] = { ...quizzes[idx], explanations };
                return { ...d, quizzes };
              })}>Remove Explanation</Button>
            </Box>
            {Array.isArray(quiz.tables) && quiz.tables.map((table: any, tIdx: number) => (
              <Box key={tIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                <TextField label="Table Title" value={table.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const tables = [...(quizzes[idx].tables || [])];
                  tables[tIdx] = { ...tables[tIdx], title: e.target.value };
                  quizzes[idx] = { ...quizzes[idx], tables };
                  return { ...d, quizzes };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <TextField label="Description" value={table.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const tables = [...(quizzes[idx].tables || [])];
                  tables[tIdx] = { ...tables[tIdx], description: e.target.value };
                  quizzes[idx] = { ...quizzes[idx], tables };
                  return { ...d, quizzes };
                })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
                <TextField value={table.headers ? table.headers.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const tables = [...(quizzes[idx].tables || [])];
                  tables[tIdx] = { ...tables[tIdx], headers: e.target.value.split(',').map((h: string) => h.trim()) };
                  quizzes[idx] = { ...quizzes[idx], tables };
                  return { ...d, quizzes };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, values comma-separated)</Typography>
                <TextField
                  multiline
                  fullWidth
                  minRows={4}
                  maxRows={20}
                  value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                  onChange={e => {
                    const newValue = e.target.value;
                    setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const tables = [...(quizzes[idx].tables || [])];
                      const newRows = newValue.split('\n').map(line => {
                        if (!line.trim()) return [];
                        return line.split(',').map(c => c.trim());
                      });
                      tables[tIdx] = { ...tables[tIdx], rows: newRows };
                      quizzes[idx] = { ...quizzes[idx], tables };
                      return { ...d, quizzes };
                    });
                  }}
                  size="small"
                  sx={{ mb: 1 }}
                  onFocus={handleFocus}
                />
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Row Explanations (optional feedback for each row)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {Array.isArray(table.rows) && table.rows.map((row: any, rIdx: number) => (
                    <TextField key={rIdx} label={`Row ${rIdx + 1} Explanation`} value={(table.rowExplanations && table.rowExplanations[rIdx]) || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const tables = [...(quizzes[idx].tables || [])];
                      const rowExplanations = [...(tables[tIdx].rowExplanations || [])];
                      rowExplanations[rIdx] = e.target.value;
                      tables[tIdx] = { ...tables[tIdx], rowExplanations };
                      quizzes[idx] = { ...quizzes[idx], tables };
                      return { ...d, quizzes };
                    })} size="small" sx={{ width: 220 }} onFocus={handleFocus} />
                  ))}
                </Box>
                <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const tables = [...(quizzes[idx].tables || [])];
                  tables.splice(tIdx, 1);
                  quizzes[idx] = { ...quizzes[idx], tables };
                  return { ...d, quizzes };
                })}>Remove Table</Button>
              </Box>
            ))}
            {Array.isArray(quiz.charts) && quiz.charts.map((chart: any, cIdx: number) => (
              <Box key={cIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                <TextField label="Chart Title" value={chart.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts[cIdx] = { ...charts[cIdx], title: e.target.value };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} size="small" fullWidth sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Displayed above the chart as its title.</Typography>
                <Select value={chart.type || 'bar'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts[cIdx] = { ...charts[cIdx], type: e.target.value };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} size="small" sx={{ width: 140, mb: 1 }}>
                  <MenuItem value="bar">Bar Chart</MenuItem>
                  <MenuItem value="pie">Pie Chart</MenuItem>
                  <MenuItem value="histogram">Histogram</MenuItem>
                  <MenuItem value="line">Line Chart</MenuItem>
                </Select>
                <TextField label="Description" value={chart.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts[cIdx] = { ...charts[cIdx], description: e.target.value };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  These labels map to chart categories: for bar/line charts they become the x-axis categories; for pie charts they become slice labels. Enter labels in the same order as the dataset values.
                </Typography>
                <TextField value={chart.labels ? chart.labels.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts[cIdx] = { ...charts[cIdx], labels: e.target.value.split(',').map((l: string) => l.trim()) };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} size="small" fullWidth sx={{ mb: 1 }} />
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Display Format</Typography>
                <Select value={chart.labelFormat || 'percentage'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts[cIdx] = { ...charts[cIdx], labelFormat: e.target.value as any };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} size="small" sx={{ width: 200, mb: 1 }}>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="degrees">Degrees (°)</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Explanations (optional feedback for each label when selected)</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {Array.isArray(chart.labels) && chart.labels.map((label: string, lIdx: number) => (
                    <TextField key={lIdx} label={`${label} Explanation`} value={(chart.labelExplanations && chart.labelExplanations[lIdx]) || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const labelExplanations = [...(charts[cIdx].labelExplanations || [])];
                      labelExplanations[lIdx] = e.target.value;
                      charts[cIdx] = { ...charts[cIdx], labelExplanations };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} size="small" sx={{ width: 220 }} />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Each dataset represents one series shown on the chart. <strong>Label</strong> appears in the legend; <strong>Data</strong> must be comma-separated numbers corresponding to each label above; <strong>Background Color</strong> is the fill color; <strong>Border Color</strong> is the stroke color.
                </Typography>
                {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
                  <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                    <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const datasets = [...(charts[cIdx].datasets || [])];
                      datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                      charts[cIdx] = { ...charts[cIdx], datasets };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} size="small" fullWidth sx={{ mb: 1 }} />
                    <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const datasets = [...(charts[cIdx].datasets || [])];
                      datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                      charts[cIdx] = { ...charts[cIdx], datasets };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} size="small" fullWidth sx={{ mb: 1 }} />
                    <TextField label="Background Color (hex or name) or comma-separated per-label colors" value={dataset.backgroundColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const datasets = [...(charts[cIdx].datasets || [])];
                      datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                      charts[cIdx] = { ...charts[cIdx], datasets };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" />
                    <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const datasets = [...(charts[cIdx].datasets || [])];
                      datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                      charts[cIdx] = { ...charts[cIdx], datasets };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} size="small" fullWidth placeholder="#FF6384" />
                    <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                      const quizzes = [...(d.quizzes || [])];
                      const charts = [...(quizzes[idx].charts || [])];
                      const datasets = [...(charts[cIdx].datasets || [])];
                      datasets.splice(dIdx, 1);
                      charts[cIdx] = { ...charts[cIdx], datasets };
                      quizzes[idx] = { ...quizzes[idx], charts };
                      return { ...d, quizzes };
                    })} sx={{ mt: 1 }}>Remove Dataset</Button>
                  </Box>
                ))}
                <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  const datasets = [...(charts[cIdx].datasets || [])];
                  datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
                  charts[cIdx] = { ...charts[cIdx], datasets };
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })} sx={{ mb: 1 }}>Add Dataset</Button>
                <br />
                <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                  const quizzes = [...(d.quizzes || [])];
                  const charts = [...(quizzes[idx].charts || [])];
                  charts.splice(cIdx, 1);
                  quizzes[idx] = { ...quizzes[idx], charts };
                  return { ...d, quizzes };
                })}>Remove Chart</Button>
              </Box>
            ))}
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const quizzes = [...(d.quizzes || [])];
              quizzes.splice(idx, 1);
              return { ...d, quizzes };
            })}>Remove Quiz</Button>
          </Paper>
        ))}
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setNewDetail((d: typeof emptyDetail) => ({ ...d, quizzes: [...(d.quizzes || []), { question: '', options: [], answer: 0, explanations: [], tables: [], charts: [], images: [] }] }))}>Add Quiz</Button>

        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Tables</Typography>
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setNewDetail((d: typeof emptyDetail) => ({ ...d, tables: [...(d.tables || []), { title: '', description: '', headers: [], rows: [] }] }))}>Add Table</Button>
        {Array.isArray(newDetail.tables) && newDetail.tables.map((table: any, idx: number) => (
          <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
            <TextField label="Table Title" value={table.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], title: e.target.value };
              return { ...d, tables };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <TextField label="Description" value={table.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], description: e.target.value };
              return { ...d, tables };
            })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
            <TextField value={table.headers ? table.headers.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables[idx] = { ...tables[idx], headers: e.target.value.split(',').map(h => h.trim()) };
              return { ...d, tables };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, values comma-separated)</Typography>
            <TextField
              multiline
              fullWidth
              minRows={4}
              maxRows={20}
              value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
              onChange={e => {
                const newValue = e.target.value;
                setNewDetail((d: typeof emptyDetail) => {
                  const tables = [...(d.tables || [])];
                  const newRows = newValue.split('\n').map(line => {
                    if (!line.trim()) return [];
                    return line.split(',').map(c => c.trim());
                  });
                  tables[idx] = { ...tables[idx], rows: newRows };
                  return { ...d, tables };
                });
              }}
              size="small"
              sx={{ mb: 1 }}
              onFocus={handleFocus}
            />
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const tables = [...(d.tables || [])];
              tables.splice(idx, 1);
              return { ...d, tables };
            })}>Remove Table</Button>
          </Box>
        ))}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Charts</Typography>
        <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setNewDetail((d: typeof emptyDetail) => ({ ...d, charts: [...(d.charts || []), { title: '', type: 'bar', description: '', labels: [], datasets: [] }] }))}>Add Chart</Button>
        {Array.isArray(newDetail.charts) && newDetail.charts.map((chart: any, idx: number) => (
          <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
            <TextField label="Chart Title" value={chart.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], title: e.target.value };
              return { ...d, charts };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Select value={chart.type || 'bar'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], type: e.target.value };
              return { ...d, charts };
            })} size="small" sx={{ width: 140, mb: 1 }}>
              <MenuItem value="bar">Bar Chart</MenuItem>
              <MenuItem value="pie">Pie Chart</MenuItem>
              <MenuItem value="histogram">Histogram</MenuItem>
              <MenuItem value="line">Line Chart</MenuItem>
            </Select>
            <TextField label="Description" value={chart.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], description: e.target.value };
              return { ...d, charts };
            })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
            <TextField value={chart.labels ? chart.labels.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts[idx] = { ...charts[idx], labels: e.target.value.split(',').map(l => l.trim()) };
              return { ...d, charts };
            })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
            {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
              <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" onFocus={handleFocus} />
                <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} size="small" fullWidth placeholder="#FF6384" onFocus={handleFocus} />
                <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                  const charts = [...(d.charts || [])];
                  const datasets = [...(charts[idx].datasets || [])];
                  datasets.splice(dIdx, 1);
                  charts[idx] = { ...charts[idx], datasets };
                  return { ...d, charts };
                })} sx={{ mt: 1 }}>Remove Dataset</Button>
              </Box>
            ))}
            <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              const datasets = [...(charts[idx].datasets || [])];
              datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
              charts[idx] = { ...charts[idx], datasets };
              return { ...d, charts };
            })} sx={{ mb: 1 }}>Add Dataset</Button>
            <br />
            <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
              const charts = [...(d.charts || [])];
              charts.splice(idx, 1);
              return { ...d, charts };
            })}>Remove Chart</Button>
          </Box>
        ))}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Lessons</Typography>
        {Array.isArray(newDetail.lessons) && newDetail.lessons.map((lesson: any, idx: number) => (
          <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <TextField label="Lesson Title" value={lesson.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDetail((d: typeof emptyDetail) => {
              const lessons = [...(d.lessons || [])];
              lessons[idx] = { ...lessons[idx], title: e.target.value };
              return { ...d, lessons };
            })} size="small" fullWidth onFocus={handleFocus} sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Concept Content Blocks</Typography>
            {Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.map((block: ContentBlock, bIdx: number) => (
              <Box key={bIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.default' }}>
                {block.type === 'table' ? (() => {
                  let tbl: any = { title: '', description: '', headers: [], rows: [] };
                  try { tbl = JSON.parse(block.value || '{}'); } catch (e) { tbl = { title: '', description: '', headers: [], rows: [] }; }
                  return (
                    <Box sx={{ mb: 1 }}>
                      <TextField label="Table Title" value={tbl.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...tbl, title: e.target.value };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth sx={{ mb: 1 }} />
                      <TextField label="Description" value={tbl.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...tbl, description: e.target.value };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
                      <TextField value={Array.isArray(tbl.headers) ? tbl.headers.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...tbl, headers: e.target.value.split(',').map((h: string) => h.trim()) };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth sx={{ mb: 1 }} />
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, comma-separated)</Typography>
                      <TextField
                        multiline
                        fullWidth
                        minRows={4}
                        maxRows={20}
                        value={Array.isArray(tbl.rows) && tbl.rows.length > 0 ? tbl.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                        onChange={e => {
                          const newValue = e.target.value;
                          setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const newRows = newValue.split('\n').map(line => {
                              if (!line.trim()) return [];
                              return line.split(',').map(c => c.trim());
                            });
                            const n = { ...tbl, rows: newRows };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          });
                        }}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                  );
                })() : block.type === 'chart' ? (() => {
                  let ch: any = { title: '', type: 'bar', description: '', labels: [], datasets: [] };
                  try { ch = JSON.parse(block.value || '{}'); } catch (e) { ch = { title: '', type: 'bar', description: '', labels: [], datasets: [] }; }
                  return (
                    <Box sx={{ mb: 1 }}>
                      <TextField label="Chart Title" value={ch.title || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...ch, title: e.target.value };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth sx={{ mb: 1 }} />
                      <Select value={ch.type || 'bar'} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...ch, type: e.target.value };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" sx={{ width: 140, mb: 1 }}>
                        <MenuItem value="bar">Bar Chart</MenuItem>
                        <MenuItem value="pie">Pie Chart</MenuItem>
                        <MenuItem value="histogram">Histogram</MenuItem>
                        <MenuItem value="line">Line Chart</MenuItem>
                      </Select>
                      <TextField label="Description" value={ch.description || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...ch, description: e.target.value };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
                      <TextField value={ch.labels ? ch.labels.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const n = { ...ch, labels: e.target.value.split(',').map((l: string) => l.trim()) };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} size="small" fullWidth sx={{ mb: 1 }} />
                      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
                      {Array.isArray(ch.datasets) && ch.datasets.map((dataset: any, dIdx: number) => (
                        <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                          <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                            const datasets = [...(curr.datasets || [])];
                            datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                            const n = { ...curr, datasets };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          })} size="small" fullWidth sx={{ mb: 1 }} />
                          <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                            const datasets = [...(curr.datasets || [])];
                            datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                            const n = { ...curr, datasets };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          })} size="small" fullWidth sx={{ mb: 1 }} />
                          <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                            const datasets = [...(curr.datasets || [])];
                            datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                            const n = { ...curr, datasets };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" />
                          <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                            const datasets = [...(curr.datasets || [])];
                            datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                            const n = { ...curr, datasets };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          })} size="small" fullWidth placeholder="#FF6384" />
                          <Button color="error" variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                            const lessons = [...(d.lessons || [])];
                            const blocks = [...(lessons[idx].contentBlocks || [])];
                            const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                            const datasets = [...(curr.datasets || [])];
                            datasets.splice(dIdx, 1);
                            const n = { ...curr, datasets };
                            blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                            lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                            return { ...d, lessons };
                          })} sx={{ mt: 1 }}>Remove Dataset</Button>
                        </Box>
                      ))}
                      <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                        const lessons = [...(d.lessons || [])];
                        const blocks = [...(lessons[idx].contentBlocks || [])];
                        const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                        const datasets = [...(curr.datasets || [])];
                        datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
                        const n = { ...curr, datasets };
                        blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                        lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                        return { ...d, lessons };
                      })} sx={{ mb: 1 }}>Add Dataset</Button>
                    </Box>
                  );
                })() : (
                  <TextField
                    label={blockLabel(block.type)}
                    value={block.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDetail((d: typeof emptyDetail) => {
                      const lessons = [...(d.lessons || [])];
                      const blocks = [...(lessons[idx].contentBlocks || [])];
                      blocks[bIdx] = { ...blocks[bIdx], value: e.target.value };
                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                      return { ...d, lessons };
                    })}
                    fullWidth
                    multiline={block.type === 'text'}
                    minRows={block.type === 'text' ? 3 : 1}
                    onFocus={handleFocus}
                    sx={{ mb: 1 }}
                  />
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" color="error" variant="outlined" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                    const lessons = [...(d.lessons || [])];
                    const blocks = [...(lessons[idx].contentBlocks || [])];
                    blocks.splice(bIdx, 1);
                    lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                    return { ...d, lessons };
                  })}>Remove</Button>
                  <Button size="small" variant="outlined" disabled={bIdx === 0} onClick={() => setNewDetail((d: typeof emptyDetail) => {
                    const lessons = [...(d.lessons || [])];
                    const blocks = [...(lessons[idx].contentBlocks || [])];
                    if (bIdx > 0) [blocks[bIdx - 1], blocks[bIdx]] = [blocks[bIdx], blocks[bIdx - 1]];
                    lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                    return { ...d, lessons };
                  })}>Up</Button>
                  <Button size="small" variant="outlined" disabled={bIdx === (lesson.contentBlocks?.length || 0) - 1} onClick={() => setNewDetail((d: typeof emptyDetail) => {
                    const lessons = [...(d.lessons || [])];
                    const blocks = [...(lessons[idx].contentBlocks || [])];
                    if (bIdx < blocks.length - 1) [blocks[bIdx + 1], blocks[bIdx]] = [blocks[bIdx], blocks[bIdx + 1]];
                    lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                    return { ...d, lessons };
                  })}>Down</Button>
                </Box>
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'text', value: '' }] };
                return { ...d, lessons };
              })}>Add Text</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'image', value: '' }] };
                return { ...d, lessons };
              })}>Add Image</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'diagram', value: '' }] };
                return { ...d, lessons };
              })}>Add Diagram</Button>
                <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'video', value: '' }] };
                return { ...d, lessons };
              })}>Add Video</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                const tbl = { title: '', description: '', headers: [], rows: [] };
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'table', value: JSON.stringify(tbl) }] };
                return { ...d, lessons };
              })}>Add Table</Button>
              <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                const chart = { title: '', type: 'bar', description: '', labels: [], datasets: [] };
                lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'chart', value: JSON.stringify(chart) }] };
                return { ...d, lessons };
              })}>Add Chart</Button>
              <Button color="error" variant="outlined" onClick={() => setNewDetail((d: typeof emptyDetail) => {
                const lessons = [...(d.lessons || [])];
                lessons.splice(idx, 1);
                return { ...d, lessons };
              })}>Delete Lesson</Button>
            </Box>
          </Paper>
        ))}
        <Button variant="outlined" size="small" onClick={() => setNewDetail((d: typeof emptyDetail) => ({ ...d, lessons: [...(d.lessons || []), { ...emptyLesson, contentBlocks: [] }] }))}>Add Lesson</Button>
        <Button onClick={handleAdd} variant="contained" color="success" sx={{ mt: 2, fontWeight: 700, fontSize: 18, borderRadius: 2, boxShadow: 2 }}>Add WAEC Topic Detail</Button>
      </Paper>
      <Paper elevation={2}>
        <List>
          {topicDetails.map(detail => {
            const topic = topics.find(t => t.uuid === detail.topicUUID);
            return (
              <React.Fragment key={detail._id || detail.id}>
                <Box sx={{ pl: 2, pt: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Topic UUID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{detail.topicUUID}</span>
                    {topic && (
                      <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>({topic.name})</Box>
                    )}
                  </Typography>
                </Box>
                <ListItem alignItems="flex-start" secondaryAction={
                  editId === (detail._id || detail.id) ? (
                    <IconButton edge="end" onMouseDown={e => e.preventDefault()} onClick={() => handleSave(detail._id || detail.id || '')}><SaveIcon /></IconButton>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconButton edge="end" onMouseDown={e => e.preventDefault()} onClick={() => handleEdit(detail)}><EditIcon /></IconButton>
                      <Box sx={{ width: 12 }} />
                      <IconButton edge="end" color="error" onMouseDown={e => e.preventDefault()} onClick={() => confirmDelete(detail._id || detail.id || '', detail.slug || detail.description || 'this WAEC topic detail')}><DeleteIcon /></IconButton>
                    </Box>
                  )
                }>
                  <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                      <DialogContentText>
                        Are you sure you want to delete <b>{deleteName}</b>? This action cannot be undone.
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={() => setDeleteOpen(false)} color="primary">Cancel</Button>
                      <Button onClick={() => deleteId && handleDelete(deleteId)} color="error" variant="contained">Delete</Button>
                    </DialogActions>
                  </Dialog>
                  {editId === (detail._id || detail.id) && editFields ? (
                    <Box sx={{ width: '100%' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <Select
                            value={editFields.sectionId}
                            onChange={(e: SelectChangeEvent<string>) => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, sectionId: e.target.value as string } : f)}
                            size="small"
                            fullWidth
                          >
                            {sections.map(section => (
                              <MenuItem key={section._id || section.id} value={section._id || section.id}>{section.name}</MenuItem>
                            ))}
                          </Select>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField label="Topic UUID" value={editFields.topicUUID} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, topicUUID: e.target.value } : f)} size="small" fullWidth onFocus={handleFocus} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField label="Slug" value={editFields.slug || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, slug: e.target.value } : f)} size="small" fullWidth onFocus={handleFocus} />
                        </Grid>
                        <Grid item xs={12} md={2}>
                          <TextField label="Description" value={editFields.description || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, description: e.target.value } : f)} size="small" fullWidth onFocus={handleFocus} />
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Resources</Typography>
                      <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, resources: [...(f.resources || []), { title: '', url: '', type: 'article' }] } : f)}>Add Resource</Button>
                      {Array.isArray(editFields.resources) && editFields.resources.map((resource: any, idx: number) => (
                        <Box key={idx} sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
                          <TextField label="Title" value={resource.title} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const resources = [...(d.resources || [])];
                            resources[idx] = { ...resources[idx], title: e.target.value };
                            return { ...d, resources };
                          })} size="small" sx={{ width: 180 }} />
                          <TextField label="URL" value={resource.url} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const resources = [...(d.resources || [])];
                            resources[idx] = { ...resources[idx], url: e.target.value };
                            return { ...d, resources };
                          })} size="small" sx={{ width: 220 }} />
                          <Select value={resource.type} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const resources = [...(d.resources || [])];
                            resources[idx] = { ...resources[idx], type: e.target.value };
                            return { ...d, resources };
                          })} size="small" sx={{ width: 120 }}>
                            <MenuItem value="article">Article</MenuItem>
                            <MenuItem value="video">Video</MenuItem>
                            <MenuItem value="code">Code</MenuItem>
                          </Select>
                          <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const resources = [...(d.resources || [])];
                            resources.splice(idx, 1);
                            return { ...d, resources };
                          })}>Remove</Button>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Quizzes</Typography>
                      <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, quizzes: [...(f.quizzes || []), { question: '', options: [], answer: 0, explanations: [], tables: [], charts: [], images: [] }] } : f)}>Add Quiz</Button>
                      {Array.isArray(editFields.quizzes) && editFields.quizzes.map((quiz: any, idx: number) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                          <TextField label="Question" value={quiz.question} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const quizzes = [...(d.quizzes || [])];
                            quizzes[idx] = { ...quizzes[idx], question: e.target.value };
                            return { ...d, quizzes };
                          })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {Array.isArray(quiz.options) && quiz.options.map((opt: string, oidx: number) => (
                              <TextField key={oidx} label={`Option ${oidx + 1}`} value={opt} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const options = [...(quizzes[idx].options || [])];
                                options[oidx] = e.target.value;
                                quizzes[idx] = { ...quizzes[idx], options };
                                return { ...d, quizzes };
                              })} size="small" sx={{ width: 180 }} onFocus={handleFocus} />
                            ))}
                            <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const options = [...(quizzes[idx].options || [])];
                              options.push('');
                              quizzes[idx] = { ...quizzes[idx], options };
                              return { ...d, quizzes };
                            })}>Add Option</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const tables = [...(quizzes[idx].tables || [])];
                              tables.push({ title: '', description: '', headers: [], rows: [] });
                              quizzes[idx] = { ...quizzes[idx], tables };
                              return { ...d, quizzes };
                            })}>Add Table</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const charts = [...(quizzes[idx].charts || [])];
                              charts.push({ title: '', type: 'bar', description: '', labels: [], datasets: [] });
                              quizzes[idx] = { ...quizzes[idx], charts };
                              return { ...d, quizzes };
                            })}>Add Chart</Button>
                            <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const options = [...(quizzes[idx].options || [])];
                              options.pop();
                              quizzes[idx] = { ...quizzes[idx], options };
                              return { ...d, quizzes };
                            })}>Remove Option</Button>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Images:</Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexWrap: 'wrap', mb: 1 }}>
                              <Box>
                                <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Upload Image:</Typography>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleQuizImageUpload(e.target.files[0], idx, false);
                                    }
                                  }}
                                  style={{ marginBottom: 8 }}
                                />
                              </Box>
                              <TextField
                                label="Paste image URL"
                                size="small"
                                sx={{ width: 250, mt: 1 }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleQuizImageUrlAdd((e.target as HTMLInputElement).value, idx, false);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                                helperText="Press Enter to add"
                              />
                            </Box>
                            {Array.isArray(quiz.images) && quiz.images.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1, mb: 1 }}>
                                {quiz.images.map((img: any, imgIdx: number) => (
                                  <Chip
                                    key={imgIdx}
                                    label={img.type === 'url' ? `URL` : `Image`}
                                    onDelete={() => handleRemoveQuizImage(idx, imgIdx, false)}
                                    size="small"
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            )}
                          </Box>
                          <TextField label="Answer Index (0-based)" type="number" value={quiz.answer} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const quizzes = [...(d.quizzes || [])];
                            quizzes[idx] = { ...quizzes[idx], answer: parseInt(e.target.value, 10) };
                            return { ...d, quizzes };
                          })} size="small" sx={{ width: 180, mb: 1 }} />
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {Array.isArray(quiz.explanations) && quiz.explanations.map((exp: string, eidx: number) => (
                              <TextField key={eidx} label={`Explanation ${eidx + 1}`} value={exp} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const explanations = [...(quizzes[idx].explanations || [])];
                                explanations[eidx] = e.target.value;
                                quizzes[idx] = { ...quizzes[idx], explanations };
                                return { ...d, quizzes };
                              })} size="small" sx={{ width: 220 }} />
                            ))}
                            <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const explanations = [...(quizzes[idx].explanations || [])];
                              explanations.push('');
                              quizzes[idx] = { ...quizzes[idx], explanations };
                              return { ...d, quizzes };
                            })}>Add Explanation</Button>
                            <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                              if (!d) return d;
                              const quizzes = [...(d.quizzes || [])];
                              const explanations = [...(quizzes[idx].explanations || [])];
                              explanations.pop();
                              quizzes[idx] = { ...quizzes[idx], explanations };
                              return { ...d, quizzes };
                            })}>Remove Explanation</Button>
                          </Box>
                          {Array.isArray(quiz.tables) && quiz.tables.map((table: any, tIdx: number) => (
                            <Box key={tIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                              <TextField label="Table Title" value={table.title || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const tables = [...(quizzes[idx].tables || [])];
                                tables[tIdx] = { ...tables[tIdx], title: e.target.value };
                                quizzes[idx] = { ...quizzes[idx], tables };
                                return { ...d, quizzes };
                              })} size="small" fullWidth sx={{ mb: 1 }} />
                              <TextField label="Description" value={table.description || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const tables = [...(quizzes[idx].tables || [])];
                                tables[tIdx] = { ...tables[tIdx], description: e.target.value };
                                quizzes[idx] = { ...quizzes[idx], tables };
                                return { ...d, quizzes };
                              })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
                              <TextField value={table.headers ? table.headers.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const tables = [...(quizzes[idx].tables || [])];
                                tables[tIdx] = { ...tables[tIdx], headers: e.target.value.split(',').map((h: string) => h.trim()) };
                                quizzes[idx] = { ...quizzes[idx], tables };
                                return { ...d, quizzes };
                              })} size="small" fullWidth sx={{ mb: 1 }} />
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, values comma-separated)</Typography>
                              <TextField
                                multiline
                                fullWidth
                                minRows={4}
                                maxRows={20}
                                value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const tables = [...(quizzes[idx].tables || [])];
                                    const newRows = newValue.split('\n').map(line => {
                                      if (!line.trim()) return [];
                                      return line.split(',').map(c => c.trim());
                                    });
                                    tables[tIdx] = { ...tables[tIdx], rows: newRows };
                                    quizzes[idx] = { ...quizzes[idx], tables };
                                    return { ...d, quizzes };
                                  });
                                }}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Row Explanations (optional feedback for each row)</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                {Array.isArray(table.rows) && table.rows.map((row: any, rIdx: number) => (
                                  <TextField key={rIdx} label={`Row ${rIdx + 1} Explanation`} value={(table.rowExplanations && table.rowExplanations[rIdx]) || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const tables = [...(quizzes[idx].tables || [])];
                                    const rowExplanations = [...(tables[tIdx].rowExplanations || [])];
                                    rowExplanations[rIdx] = e.target.value;
                                    tables[tIdx] = { ...tables[tIdx], rowExplanations };
                                    quizzes[idx] = { ...quizzes[idx], tables };
                                    return { ...d, quizzes };
                                  })} size="small" sx={{ width: 220 }} />
                                ))}
                              </Box>
                              <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const tables = [...(quizzes[idx].tables || [])];
                                tables.splice(tIdx, 1);
                                quizzes[idx] = { ...quizzes[idx], tables };
                                return { ...d, quizzes };
                              })}>Remove Table</Button>
                            </Box>
                          ))}
                          {Array.isArray(quiz.charts) && quiz.charts.map((chart: any, cIdx: number) => (
                            <Box key={cIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                              <TextField label="Chart Title" value={chart.title || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                charts[cIdx] = { ...charts[cIdx], title: e.target.value };
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })} size="small" fullWidth sx={{ mb: 1 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Displayed above the chart as its title.</Typography>
                              <Select value={chart.type || 'bar'} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                charts[cIdx] = { ...charts[cIdx], type: e.target.value };
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })} size="small" sx={{ width: 140, mb: 1 }}>
                                <MenuItem value="bar">Bar Chart</MenuItem>
                                <MenuItem value="pie">Pie Chart</MenuItem>
                                <MenuItem value="histogram">Histogram</MenuItem>
                                <MenuItem value="line">Line Chart</MenuItem>
                              </Select>
                              <TextField label="Description" value={chart.description || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                charts[cIdx] = { ...charts[cIdx], description: e.target.value };
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                These labels map to chart categories: for bar/line charts they become the x-axis categories; for pie charts they become slice labels. Enter labels in the same order as the dataset values.
                              </Typography>
                              <TextField value={chart.labels ? chart.labels.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                charts[cIdx] = { ...charts[cIdx], labels: e.target.value.split(',').map((l: string) => l.trim()) };
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })} size="small" fullWidth sx={{ mb: 1 }} />
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Label Explanations (optional feedback for each label when selected)</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                {Array.isArray(chart.labels) && chart.labels.map((label: string, lIdx: number) => (
                                  <TextField key={lIdx} label={`${label} Explanation`} value={(chart.labelExplanations && chart.labelExplanations[lIdx]) || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const labelExplanations = [...(charts[cIdx].labelExplanations || [])];
                                    labelExplanations[lIdx] = e.target.value;
                                    charts[cIdx] = { ...charts[cIdx], labelExplanations };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} size="small" sx={{ width: 220 }} />
                                ))}
                              </Box>
                              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                Each dataset represents one series shown on the chart. <strong>Label</strong> appears in the legend; <strong>Data</strong> must be comma-separated numbers corresponding to each label above; <strong>Background Color</strong> is the fill color; <strong>Border Color</strong> is the stroke color.
                              </Typography>
                              {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
                                <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                                  <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const datasets = [...(charts[cIdx].datasets || [])];
                                    datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                                    charts[cIdx] = { ...charts[cIdx], datasets };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} size="small" fullWidth sx={{ mb: 1 }} />
                                  <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const datasets = [...(charts[cIdx].datasets || [])];
                                    datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                                    charts[cIdx] = { ...charts[cIdx], datasets };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} size="small" fullWidth sx={{ mb: 1 }} />
                                  <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const datasets = [...(charts[cIdx].datasets || [])];
                                    datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                                    charts[cIdx] = { ...charts[cIdx], datasets };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" />
                                  <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const datasets = [...(charts[cIdx].datasets || [])];
                                    datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                                    charts[cIdx] = { ...charts[cIdx], datasets };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} size="small" fullWidth placeholder="#FF6384" />
                                  <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                                    if (!d) return d;
                                    const quizzes = [...(d.quizzes || [])];
                                    const charts = [...(quizzes[idx].charts || [])];
                                    const datasets = [...(charts[cIdx].datasets || [])];
                                    datasets.splice(dIdx, 1);
                                    charts[cIdx] = { ...charts[cIdx], datasets };
                                    quizzes[idx] = { ...quizzes[idx], charts };
                                    return { ...d, quizzes };
                                  })} sx={{ mt: 1 }}>Remove Dataset</Button>
                                </Box>
                              ))}
                              <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                const datasets = [...(charts[cIdx].datasets || [])];
                                datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
                                charts[cIdx] = { ...charts[cIdx], datasets };
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })} sx={{ mb: 1 }}>Add Dataset</Button>
                              <br />
                              <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const quizzes = [...(d.quizzes || [])];
                                const charts = [...(quizzes[idx].charts || [])];
                                charts.splice(cIdx, 1);
                                quizzes[idx] = { ...quizzes[idx], charts };
                                return { ...d, quizzes };
                              })}>Remove Chart</Button>
                            </Box>
                          ))}
                          <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const quizzes = [...(d.quizzes || [])];
                            quizzes.splice(idx, 1);
                            return { ...d, quizzes };
                          })}>Remove Quiz</Button>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Tables</Typography>
                      <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, tables: [...(f.tables || []), { title: '', description: '', headers: [], rows: [] }] } : f)}>Add Table</Button>
                      {Array.isArray(editFields.tables) && editFields.tables.map((table: any, idx: number) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                          <TextField label="Table Title" value={table.title || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const tables = [...(d.tables || [])];
                            tables[idx] = { ...tables[idx], title: e.target.value };
                            return { ...d, tables };
                          })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                          <TextField label="Description" value={table.description || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const tables = [...(d.tables || [])];
                            tables[idx] = { ...tables[idx], description: e.target.value };
                            return { ...d, tables };
                          })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
                          <TextField value={table.headers ? table.headers.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const tables = [...(d.tables || [])];
                            tables[idx] = { ...tables[idx], headers: e.target.value.split(',').map(h => h.trim()) };
                            return { ...d, tables };
                          })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, values comma-separated)</Typography>
                          <TextField
                            multiline
                            fullWidth
                            minRows={4}
                            maxRows={20}
                            value={table.rows && table.rows.length > 0 ? table.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                            onChange={e => {
                              const newValue = e.target.value;
                              setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const tables = [...(d.tables || [])];
                                const newRows = newValue.split('\n').map(line => {
                                  if (!line.trim()) return [];
                                  return line.split(',').map(c => c.trim());
                                });
                                tables[idx] = { ...tables[idx], rows: newRows };
                                return { ...d, tables };
                              });
                            }}
                            size="small"
                            sx={{ mb: 1 }}
                            onFocus={handleFocus}
                          />
                          <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const tables = [...(d.tables || [])];
                            tables.splice(idx, 1);
                            return { ...d, tables };
                          })}>Remove Table</Button>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Charts</Typography>
                      <Button variant="outlined" size="small" sx={{ mb: 2 }} onClick={() => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, charts: [...(f.charts || []), { title: '', type: 'bar', description: '', labels: [], datasets: [] }] } : f)}>Add Chart</Button>
                      {Array.isArray(editFields.charts) && editFields.charts.map((chart: any, idx: number) => (
                        <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.paper' }}>
                          <TextField label="Chart Title" value={chart.title || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            charts[idx] = { ...charts[idx], title: e.target.value };
                            return { ...d, charts };
                          })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Displayed above the chart as its title.</Typography>
                          <Select value={chart.type || 'bar'} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            charts[idx] = { ...charts[idx], type: e.target.value };
                            return { ...d, charts };
                          })} size="small" sx={{ width: 140, mb: 1 }}>
                            <MenuItem value="bar">Bar Chart</MenuItem>
                            <MenuItem value="pie">Pie Chart</MenuItem>
                            <MenuItem value="histogram">Histogram</MenuItem>
                            <MenuItem value="line">Line Chart</MenuItem>
                          </Select>
                          <TextField label="Description" value={chart.description || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            charts[idx] = { ...charts[idx], description: e.target.value };
                            return { ...d, charts };
                          })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            These labels map to chart categories: for bar/line charts they become the x-axis categories; for pie charts they become slice labels. Enter labels in the same order as the dataset values.
                          </Typography>
                          <TextField value={chart.labels ? chart.labels.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            charts[idx] = { ...charts[idx], labels: e.target.value.split(',').map(l => l.trim()) };
                            return { ...d, charts };
                          })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                          <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Each dataset represents one series shown on the chart. <strong>Label</strong> appears in the legend; <strong>Data</strong> must be comma-separated numbers corresponding to each label above; <strong>Background Color</strong> is the fill color; <strong>Border Color</strong> is the stroke color.
                          </Typography>
                          {Array.isArray(chart.datasets) && chart.datasets.map((dataset: any, dIdx: number) => (
                            <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                              <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const charts = [...(d.charts || [])];
                                const datasets = [...(charts[idx].datasets || [])];
                                datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                                charts[idx] = { ...charts[idx], datasets };
                                return { ...d, charts };
                              })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                              <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const charts = [...(d.charts || [])];
                                const datasets = [...(charts[idx].datasets || [])];
                                datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                                charts[idx] = { ...charts[idx], datasets };
                                return { ...d, charts };
                              })} size="small" fullWidth sx={{ mb: 1 }} onFocus={handleFocus} />
                              <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const charts = [...(d.charts || [])];
                                const datasets = [...(charts[idx].datasets || [])];
                                datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                                charts[idx] = { ...charts[idx], datasets };
                                return { ...d, charts };
                              })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" onFocus={handleFocus} />
                              <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const charts = [...(d.charts || [])];
                                const datasets = [...(charts[idx].datasets || [])];
                                datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                                charts[idx] = { ...charts[idx], datasets };
                                return { ...d, charts };
                              })} size="small" fullWidth placeholder="#FF6384" onFocus={handleFocus} />
                              <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                                if (!d) return d;
                                const charts = [...(d.charts || [])];
                                const datasets = [...(charts[idx].datasets || [])];
                                datasets.splice(dIdx, 1);
                                charts[idx] = { ...charts[idx], datasets };
                                return { ...d, charts };
                              })} sx={{ mt: 1 }}>Remove Dataset</Button>
                            </Box>
                          ))}
                          <Button variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            const datasets = [...(charts[idx].datasets || [])];
                            datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
                            charts[idx] = { ...charts[idx], datasets };
                            return { ...d, charts };
                          })} sx={{ mb: 1 }}>Add Dataset</Button>
                          <br />
                          <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((d: typeof emptyDetail | null) => {
                            if (!d) return d;
                            const charts = [...(d.charts || [])];
                            charts.splice(idx, 1);
                            return { ...d, charts };
                          })}>Remove Chart</Button>
                        </Box>
                      ))}
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Lessons</Typography>
                      {Array.isArray(editFields.lessons) && editFields.lessons.map((lesson: any, idx: number) => (
                        <Paper key={idx} elevation={0} sx={{ p: 2, mb: 2, background: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                          <TextField label="Lesson Title" value={lesson.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: typeof emptyDetail | null) => {
                            if (!f) return f;
                            const lessons = [...(f.lessons || [])];
                            lessons[idx] = { ...lessons[idx], title: e.target.value };
                            return { ...f, lessons };
                          })} size="small" fullWidth onFocus={handleFocus} sx={{ mb: 2 }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Concept Content Blocks</Typography>
                          {Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.map((block: ContentBlock, bIdx: number) => (
                            <Box key={bIdx} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, background: 'background.default' }}>
                              {block.type === 'table' ? (() => {
                                let tbl: any = { title: '', description: '', headers: [], rows: [] };
                                try { tbl = JSON.parse(block.value || '{}'); } catch (e) { tbl = { title: '', description: '', headers: [], rows: [] }; }
                                return (
                                  <Box sx={{ mb: 1 }}>
                                    <TextField label="Table Title" value={tbl.title || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...tbl, title: e.target.value };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth sx={{ mb: 1 }} />
                                    <TextField label="Description" value={tbl.description || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...tbl, description: e.target.value };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Headers (comma-separated)</Typography>
                                    <TextField value={Array.isArray(tbl.headers) ? tbl.headers.join(', ') : ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...tbl, headers: e.target.value.split(',').map((h: string) => h.trim()) };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth sx={{ mb: 1 }} />
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Rows (one per line, comma-separated)</Typography>
                                    <TextField
                                      multiline
                                      fullWidth
                                      minRows={4}
                                      maxRows={20}
                                      value={Array.isArray(tbl.rows) && tbl.rows.length > 0 ? tbl.rows.map((r: any) => (Array.isArray(r) ? r.join(', ') : String(r))).join('\n') : ''}
                                      onChange={e => {
                                        const newValue = e.target.value;
                                        setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const newRows = newValue.split('\n').map(line => {
                                            if (!line.trim()) return [];
                                            return line.split(',').map(c => c.trim());
                                          });
                                          const n = { ...tbl, rows: newRows };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        });
                                      }}
                                      size="small"
                                      sx={{ mb: 1 }}
                                    />
                                  </Box>
                                );
                              })() : block.type === 'chart' ? (() => {
                                let ch: any = { title: '', type: 'bar', description: '', labels: [], datasets: [] };
                                try { ch = JSON.parse(block.value || '{}'); } catch (e) { ch = { title: '', type: 'bar', description: '', labels: [], datasets: [] }; }
                                return (
                                  <Box sx={{ mb: 1 }}>
                                    <TextField label="Chart Title" value={ch.title || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...ch, title: e.target.value };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth sx={{ mb: 1 }} />
                                    <Select value={ch.type || 'bar'} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...ch, type: e.target.value };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" sx={{ width: 140, mb: 1 }}>
                                      <MenuItem value="bar">Bar Chart</MenuItem>
                                      <MenuItem value="pie">Pie Chart</MenuItem>
                                      <MenuItem value="histogram">Histogram</MenuItem>
                                      <MenuItem value="line">Line Chart</MenuItem>
                                    </Select>
                                    <TextField label="Description" value={ch.description || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...ch, description: e.target.value };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth multiline rows={2} sx={{ mb: 1 }} />
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Labels (comma-separated)</Typography>
                                    <TextField value={ch.labels ? ch.labels.join(', ') : ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const n = { ...ch, labels: e.target.value.split(',').map((l: string) => l.trim()) };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} size="small" fullWidth sx={{ mb: 1 }} />
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Datasets (add below)</Typography>
                                    {Array.isArray(ch.datasets) && ch.datasets.map((dataset: any, dIdx: number) => (
                                      <Box key={dIdx} sx={{ mb: 1, p: 1, background: 'background.default', borderRadius: 1 }}>
                                        <TextField label={`Dataset ${dIdx + 1} Label`} value={dataset.label || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                          const datasets = [...(curr.datasets || [])];
                                          datasets[dIdx] = { ...datasets[dIdx], label: e.target.value };
                                          const n = { ...curr, datasets };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        })} size="small" fullWidth sx={{ mb: 1 }} />
                                        <TextField label={`Dataset ${dIdx + 1} Data (comma-separated numbers)`} value={dataset.data ? dataset.data.join(', ') : ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                          const datasets = [...(curr.datasets || [])];
                                          datasets[dIdx] = { ...datasets[dIdx], data: e.target.value.split(',').map((n: string) => Number(n.trim()) || 0) };
                                          const n = { ...curr, datasets };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        })} size="small" fullWidth sx={{ mb: 1 }} />
                                        <TextField label="Background Color (hex or name)" value={dataset.backgroundColor || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                          const datasets = [...(curr.datasets || [])];
                                          datasets[dIdx] = { ...datasets[dIdx], backgroundColor: e.target.value };
                                          const n = { ...curr, datasets };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        })} size="small" fullWidth sx={{ mb: 1 }} placeholder="#FF6384" />
                                        <TextField label="Border Color (hex or name)" value={dataset.borderColor || ''} onChange={e => setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                          const datasets = [...(curr.datasets || [])];
                                          datasets[dIdx] = { ...datasets[dIdx], borderColor: e.target.value };
                                          const n = { ...curr, datasets };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        })} size="small" fullWidth placeholder="#FF6384" />
                                        <Button color="error" variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                                          if (!f) return f;
                                          const lessons = [...(f.lessons || [])];
                                          const blocks = [...(lessons[idx].contentBlocks || [])];
                                          const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                          const datasets = [...(curr.datasets || [])];
                                          datasets.splice(dIdx, 1);
                                          const n = { ...curr, datasets };
                                          blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                          lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                          return { ...f, lessons };
                                        })} sx={{ mt: 1 }}>Remove Dataset</Button>
                                      </Box>
                                    ))}
                                    <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                                      if (!f) return f;
                                      const lessons = [...(f.lessons || [])];
                                      const blocks = [...(lessons[idx].contentBlocks || [])];
                                      const curr = JSON.parse(blocks[bIdx].value || '{}') as any;
                                      const datasets = [...(curr.datasets || [])];
                                      datasets.push({ label: '', data: [], backgroundColor: '', borderColor: '' });
                                      const n = { ...curr, datasets };
                                      blocks[bIdx] = { ...blocks[bIdx], value: JSON.stringify(n) };
                                      lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                      return { ...f, lessons };
                                    })} sx={{ mb: 1 }}>Add Dataset</Button>
                                  </Box>
                                );
                              })() : (
                                <TextField
                                  label={blockLabel(block.type)}
                                  value={block.value}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFields((f: typeof emptyDetail | null) => {
                                    if (!f) return f;
                                    const lessons = [...(f.lessons || [])];
                                    const blocks = [...(lessons[idx].contentBlocks || [])];
                                    blocks[bIdx] = { ...blocks[bIdx], value: e.target.value };
                                    lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                    return { ...f, lessons };
                                  })}
                                  fullWidth
                                  multiline={block.type === 'text'}
                                  minRows={block.type === 'text' ? 3 : 1}
                                  onFocus={handleFocus}
                                  sx={{ mb: 1 }}
                                />
                              )}
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" color="error" variant="outlined" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                                  if (!f) return f;
                                  const lessons = [...(f.lessons || [])];
                                  const blocks = [...(lessons[idx].contentBlocks || [])];
                                  blocks.splice(bIdx, 1);
                                  lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                  return { ...f, lessons };
                                })}>Remove</Button>
                                <Button size="small" variant="outlined" disabled={bIdx === 0} onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                                  if (!f) return f;
                                  const lessons = [...(f.lessons || [])];
                                  const blocks = [...(lessons[idx].contentBlocks || [])];
                                  if (bIdx > 0) [blocks[bIdx - 1], blocks[bIdx]] = [blocks[bIdx], blocks[bIdx - 1]];
                                  lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                  return { ...f, lessons };
                                })}>Up</Button>
                                <Button size="small" variant="outlined" disabled={bIdx === (lesson.contentBlocks?.length || 0) - 1} onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                                  if (!f) return f;
                                  const lessons = [...(f.lessons || [])];
                                  const blocks = [...(lessons[idx].contentBlocks || [])];
                                  if (bIdx < blocks.length - 1) [blocks[bIdx + 1], blocks[bIdx]] = [blocks[bIdx], blocks[bIdx + 1]];
                                  lessons[idx] = { ...lessons[idx], contentBlocks: blocks };
                                  return { ...f, lessons };
                                })}>Down</Button>
                              </Box>
                            </Box>
                          ))}
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'text', value: '' }] };
                              return { ...f, lessons };
                            })}>Add Text</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'image', value: '' }] };
                              return { ...f, lessons };
                            })}>Add Image</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'diagram', value: '' }] };
                              return { ...f, lessons };
                            })}>Add Diagram</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'video', value: '' }] };
                              return { ...f, lessons };
                            })}>Add Video</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              const tbl = { title: '', description: '', headers: [], rows: [] };
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'table', value: JSON.stringify(tbl) }] };
                              return { ...f, lessons };
                            })}>Add Table</Button>
                            <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              const chart = { title: '', type: 'bar', description: '', labels: [], datasets: [] };
                              lessons[idx] = { ...lessons[idx], contentBlocks: [...(lessons[idx].contentBlocks || []), { type: 'chart', value: JSON.stringify(chart) }] };
                              return { ...f, lessons };
                            })}>Add Chart</Button>
                            <Button color="error" variant="outlined" onClick={() => setEditFields((f: typeof emptyDetail | null) => {
                              if (!f) return f;
                              const lessons = [...(f.lessons || [])];
                              lessons.splice(idx, 1);
                              return { ...f, lessons };
                            })}>Delete Lesson</Button>
                          </Box>
                        </Paper>
                      ))}
                      <Button variant="outlined" size="small" onClick={() => setEditFields((f: typeof emptyDetail | null) => f ? { ...f, lessons: [...(f.lessons || []), { ...emptyLesson, contentBlocks: [] }] } : f)}>Add Lesson</Button>
                    </Box>
                  ) : (
                    <ListItemText
                      primary={
                        <>
                          <Typography variant="subtitle1" fontWeight={600}>{topic ? topic.name : 'Unknown Topic'}</Typography>
                          <Typography variant="body2" color="text.secondary">Slug: {detail.slug}</Typography>
                          <Typography variant="body2" color="text.secondary">Description: {detail.description}</Typography>
                          <Divider sx={{ my: 1 }} />
                          {Array.isArray(detail.contentBlocks) && detail.contentBlocks.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              {detail.contentBlocks.map((block: any, idx: number) => (
                                <Box key={idx} sx={{ mb: 1 }}>
                                  {block.type === 'text' && <Typography variant="body2">{block.value}</Typography>}
                                  {block.type === 'image' && <img src={block.value} alt="" style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                  {block.type === 'diagram' && <img src={block.value} alt="diagram" style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                  {block.type === 'video' && <video src={block.value} controls style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                </Box>
                              ))}
                            </Box>
                          )}
                          {Array.isArray(detail.lessons) && detail.lessons.length > 0 && (
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>Lessons:</Typography>
                              {detail.lessons.map((lesson: any, lidx: number) => (
                                <Box key={lidx} sx={{ ml: 2, mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{lesson.title}</Typography>
                                  {Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.map((block: any, bidx: number) => (
                                    <Box key={bidx} sx={{ mb: 1 }}>
                                      {block.type === 'text' && <Typography variant="body2">{block.value}</Typography>}
                                      {block.type === 'image' && <img src={block.value} alt="" style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                      {block.type === 'diagram' && <img src={block.value} alt="diagram" style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                      {block.type === 'video' && <video src={block.value} controls style={{ maxWidth: '100%', maxHeight: 120 }} />}
                                    </Box>
                                  ))}
                                </Box>
                              ))}
                            </Box>
                          )}
                          {Array.isArray(detail.resources) && detail.resources.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Resources:</Typography>
                              {detail.resources.map((resource: any, ridx: number) => (
                                <Box key={ridx} sx={{ ml: 2, mb: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{resource.title}</Typography>
                                  <Typography variant="body2" color="text.secondary">{resource.url}</Typography>
                                  <Typography variant="body2" color="text.secondary">Type: {resource.type}</Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                          {Array.isArray(detail.quizzes) && detail.quizzes.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Quizzes:</Typography>
                              {detail.quizzes.map((quiz: any, qidx: number) => (
                                <Box key={qidx} sx={{ ml: 2, mb: 2 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Q: {quiz.question}</Typography>
                                  {Array.isArray(quiz.options) && quiz.options.length > 0 && (
                                    <Box sx={{ ml: 2 }}>
                                      {quiz.options.map((opt: string, oidx: number) => (
                                        <Typography key={oidx} variant="body2">Option {oidx + 1}: {opt}</Typography>
                                      ))}
                                    </Box>
                                  )}
                                  <Typography variant="body2">Answer: {typeof quiz.answer === 'number' ? quiz.answer + 1 : quiz.answer}</Typography>
                                  {Array.isArray(quiz.explanations) && quiz.explanations.length > 0 && (
                                    <Box sx={{ ml: 2 }}>
                                      {quiz.explanations.map((exp: string, eidx: number) => (
                                        <Typography key={eidx} variant="body2" color="text.secondary">Explanation {eidx + 1}: {exp}</Typography>
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </>
                      }
                      secondary={sections.find(s => (s._id || s.id) === detail.sectionId)?.name}
                    />
                  )}
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default AdminWaecTopicDetailsTab;
