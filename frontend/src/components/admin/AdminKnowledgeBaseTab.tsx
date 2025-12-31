import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface Subject {
  _id?: string;
  id?: string;
  name: string;
}

const AdminKnowledgeBaseTab: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubject, setNewSubject] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Fetch subjects from backend on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const res = await api.get('/knowledge-base/subjects', { withCredentials: true });
        const data = res.data;
        setSubjects(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleAdd = async () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjects.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Subject already exists.');
      return;
    }
    try {
      try {
        const postRes = await api.post('/knowledge-base/subjects', { name: trimmed }, { withCredentials: true });
        const postData = postRes.data;
        if (!postData || !postData.success) {
          let errorMsg = 'Error adding subject.';
          errorMsg += '\n' + JSON.stringify(postData || {});
          alert(errorMsg);
          return;
        }
        setNewSubject('');
        const res = await api.get('/knowledge-base/subjects', { withCredentials: true });
        const data = res.data;
        setSubjects(Array.isArray(data) ? data : (data.data || []));
      } catch (err) {
        alert('Error adding subject.');
        return;
      }
    } catch (err) {
      alert('Error adding subject.');
    }
  };

  const handleDelete = (id: string) => {
    // Open confirmation dialog instead of immediate delete
    const subj = subjects.find(s => (s._id || s.id) === id);
    setDeletingSubject({ id: id, name: subj?.name || '' });
    setDeleteDialogOpen(true);
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (!deletingSubject) return;
    const id = deletingSubject.id;
    try {
      try {
        const res = await api.delete(`/knowledge-base/subjects/${id}`, { withCredentials: true });
        const data = res.data;
        if (!data || !data.success) {
          let msg = 'Failed to delete subject.';
          msg += ' ' + JSON.stringify(data || {});
          alert(msg);
        } else {
          setSubjects(prev => prev.filter(s => (s._id || s.id) !== id));
        }
      } catch (err) {
        alert('Failed to delete subject.');
      }
    } catch (e) {
      alert('Failed to delete subject.');
    } finally {
      setDeletingSubject(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditValue(name);
  };

  const handleSave = (id: string) => {
    setSubjects(subjects.map(s => (s.id === id ? { ...s, name: editValue } : s)));
    setEditId(null);
    setEditValue('');
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage Knowledge Base Subjects</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="New Subject"
          value={newSubject}
          onChange={e => setNewSubject(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <Paper elevation={2}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading...</Typography>
        ) : (
          <List>
            {subjects.map(subject => {
              const key = subject._id || subject.id || subject.name;
              const subjectId = subject._id || subject.id || '';
              return (
                <ListItem key={key} secondaryAction={
                  editId === subjectId ? (
                    <IconButton edge="end" onClick={() => handleSave(subjectId)}><SaveIcon /></IconButton>
                  ) : (
                    <>
                      <IconButton edge="end" onClick={() => handleEdit(subjectId, subject.name)}><EditIcon /></IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(subjectId)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                    </>
                  )
                }>
                  {editId === subjectId ? (
                    <TextField value={editValue} onChange={e => setEditValue(e.target.value)} size="small" />
                  ) : (
                    <ListItemText primary={subject.name} />
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
            {`Are you sure you want to delete "${deletingSubject?.name || ''}"? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); setDeletingSubject(null); }}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminKnowledgeBaseTab;
