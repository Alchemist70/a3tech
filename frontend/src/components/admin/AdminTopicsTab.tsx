
import React, { useState, useEffect } from 'react';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface Topic {
  _id?: string;
  id?: string;
  subjectId: string;
  name: string;
  slug?: string;
  uuid?: string;
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
}

const AdminTopicsTab: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch subjects and topics from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, topicsRes] = await Promise.all([
          api.get('/knowledge-base/subjects', { withCredentials: true }),
          api.get('/topics', { withCredentials: true })
        ]);
        const subjectsData = subjectsRes.data || [];
        const topicsData = topicsRes.data || [];
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        setTopics(Array.isArray(topicsData) ? topicsData : []);
        if (Array.isArray(subjectsData) && subjectsData.length > 0) {
          setNewSubjectId(subjectsData[0]._id || subjectsData[0].id || '');
          setEditSubjectId(subjectsData[0]._id || subjectsData[0].id || '');
        }
      } catch {
        setSubjects([]);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAdd = async () => {
    if (!newTopic.trim() || !newSubjectId || !newSlug.trim()) {
      alert('Please enter a topic name and a unique, non-empty slug.');
      return;
    }
    try {
      const res = await api.post('/topics', { name: newTopic.trim(), subjectId: newSubjectId, slug: newSlug.trim() }, { withCredentials: true });
      const data = res.data;
      if (!data || !data.success) {
        let errorMsg = 'Error adding topic.';
        errorMsg += '\n' + JSON.stringify(data || {});
        alert(errorMsg);
        return;
      }
      setNewTopic('');
      setNewSlug('');
      const topicsRes = await api.get('/topics', { withCredentials: true });
      setTopics(topicsRes.data || []);
    } catch (err) {
      alert('Error adding topic.');
    }
  };


  // Show confirmation dialog then delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState<{ id: string; name?: string } | null>(null);

  const handleDelete = (id: string, name?: string) => {
    setDeletingTopic({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTopic) return;
    const id = deletingTopic.id;
    try {
      await safeDelete(`/topics/${id}`);
      const topicsRes = await api.get('/topics', { withCredentials: true });
      setTopics(topicsRes.data || []);
    } catch (err: any) {
      alert('Error deleting topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    } finally {
      setDeleteDialogOpen(false);
      setDeletingTopic(null);
    }
  };


  const handleEdit = (id: string, name: string, subjectId: string, slug?: string) => {
    setEditId(id);
    setEditValue(name);
    setEditSubjectId(subjectId);
    setEditSlug(slug || '');
  };


  const handleSave = async (id: string) => {
    if (!editValue.trim() || !editSubjectId || !editSlug.trim()) {
      alert('Please enter a topic name and a unique, non-empty slug.');
      return;
    }
    try {
      const res = await api.put(`/topics/${id}`, { name: editValue.trim(), subjectId: editSubjectId, slug: editSlug.trim() }, { withCredentials: true });
      const data = res.data;
      if (!data || !data.success) {
        alert('Error updating topic.');
        return;
      }
      setEditId(null);
      setEditValue('');
      setEditSlug('');
      const topicsRes = await api.get('/topics', { withCredentials: true });
      setTopics(topicsRes.data || []);
    } catch {
      alert('Error updating topic.');
    }
  };


  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage Topics</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Select
          value={newSubjectId}
          onChange={e => setNewSubjectId(e.target.value as string)}
          size="small"
          disabled={subjects.length === 0}
        >
          {subjects.map(subject => (
            <MenuItem key={subject._id || subject.id} value={subject._id || subject.id}>{subject.name}</MenuItem>
          ))}
        </Select>
        <TextField
          label="New Topic"
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          size="small"
          disabled={subjects.length === 0}
          helperText={subjects.length === 0 ? 'Add a subject first.' : ''}
        />
        <Button variant="contained" onClick={handleAdd} disabled={subjects.length === 0}>Add</Button>
      </Box>
      <Paper elevation={2}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading...</Typography>
        ) : (
          <List>
            {/* Show warning if any topic is missing a slug */}
            {topics.some(topic => !topic.slug) && (
              <Typography color="error" sx={{ p: 2 }}>
                Warning: One or more topics are missing a slug. Please edit and add a unique slug for each topic.
              </Typography>
            )}
            {topics.map(topic => {
              const key = topic._id || topic.id || topic.name;
              const topicId = topic._id || topic.id || '';
              const subj = subjects.find(s => (s._id || s.id) === topic.subjectId);
              return (
                <ListItem key={key} secondaryAction={
                  editId === topicId ? (
                    <IconButton edge="end" onClick={() => handleSave(topicId)}><SaveIcon /></IconButton>
                  ) : (
                    <>
                      <IconButton edge="end" onClick={() => handleEdit(topicId, topic.name, topic.subjectId, topic.slug)}><EditIcon /></IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(topicId, topic.name)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                    </>
                  )
                }>
                  {editId === topicId ? (
                    <>
                      <Select value={editSubjectId} onChange={e => setEditSubjectId(e.target.value as string)} size="small" sx={{ mr: 1 }}>
                        {subjects.map(subject => (
                          <MenuItem key={subject._id || subject.id} value={subject._id || subject.id}>{subject.name}</MenuItem>
                        ))}
                      </Select>
                      <TextField value={editValue} onChange={e => setEditValue(e.target.value)} size="small" sx={{ mr: 1 }} />
                      <TextField value={editSlug} onChange={e => setEditSlug(e.target.value)} size="small" label="Slug" sx={{ mr: 1 }} />
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListItemText primary={topic.name} secondary={subj?.name} />
                        {topic.slug && (
                          <TextField
                            value={topic.slug}
                            size="small"
                            InputProps={{ readOnly: true }}
                            sx={{ width: 120, ml: 2 }}
                            label="Slug"
                          />
                        )}
                        {topic.uuid && (
                          <TextField
                            value={topic.uuid}
                            size="small"
                            InputProps={{ readOnly: true }}
                            sx={{ width: 220, ml: 2 }}
                          />
                        )}
                        {topic.uuid && (
                          <Button size="small" onClick={() => navigator.clipboard.writeText(topic.uuid || '')}>Copy UUID</Button>
                        )}
                      </Box>
                    </Box>
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Are you sure you want to delete topic "${deletingTopic?.name || ''}"? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeletingTopic(null); }}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTopicsTab;
