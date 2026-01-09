import React, { useState, useEffect } from 'react';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface Section {
  _id?: string;
  id?: string;
  name: string;
}

const AdminJambSectionTab: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSection, setDeletingSection] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      try {
        const res = await api.get('/jamb-sections', { withCredentials: true });
        const data = res.data;
        setSections(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        setSections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const handleAdd = async () => {
    const trimmed = newSection.trim();
    if (!trimmed) return;
    if (sections.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('JAMB Section already exists.');
      return;
    }
    try {
      const postRes = await api.post('/jamb-sections', { name: trimmed }, { withCredentials: true });
      const postData = postRes.data;
      if (!postData || !postData._id) {
        alert('Error adding JAMB section.');
        return;
      }
      setNewSection('');
      const res = await api.get('/jamb-sections', { withCredentials: true });
      const data = res.data;
      setSections(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      alert('Error adding JAMB section.');
    }
  };

  const handleDelete = (id: string) => {
    const section = sections.find(s => (s._id || s.id) === id);
    setDeletingSection({ id: id, name: section?.name || '' });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSection) return;
    const id = deletingSection.id;
    try {
      await safeDelete(`/jamb-sections/${id}`);
      // Optimistically remove from UI (backend confirmed)
      setSections(prev => prev.filter(s => (s._id || s.id) !== id));
    } catch (err: any) {
      alert('Failed to delete JAMB section: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    } finally {
      setDeletingSection(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditValue(name);
  };

  const handleSave = async (id: string) => {
    try {
      await api.put(`/jamb-sections/${id}`, { name: editValue }, { withCredentials: true });
      setSections(sections.map(s => (s._id === id || s.id === id ? { ...s, name: editValue } : s)));
      setEditId(null);
      setEditValue('');
    } catch (err) {
      alert('Failed to update section.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage JAMB Sections</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="New JAMB Section"
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
          size="small"
        />
        <Button variant="contained" onClick={handleAdd}>Add</Button>
      </Box>
      <Paper elevation={2}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading...</Typography>
        ) : (
          <List>
            {sections.map(section => {
              const key = section._id || section.id || section.name;
              const sectionId = section._id || section.id || '';
              return (
                <ListItem key={key} secondaryAction={
                  editId === sectionId ? (
                    <IconButton edge="end" onClick={() => handleSave(sectionId)}><SaveIcon /></IconButton>
                  ) : (
                    <>
                      <IconButton edge="end" onClick={() => handleEdit(sectionId, section.name)}><EditIcon /></IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(sectionId)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                    </>
                  )
                }>
                  {editId === sectionId ? (
                    <TextField value={editValue} onChange={e => setEditValue(e.target.value)} size="small" />
                  ) : (
                    <ListItemText primary={section.name} />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete JAMB Section</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deletingSection?.name || ''}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminJambSectionTab;
