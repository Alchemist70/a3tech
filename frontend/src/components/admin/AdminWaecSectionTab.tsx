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

const AdminWaecSectionTab: React.FC = () => {
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
        const res = await api.get('/waec-sections', { withCredentials: true });
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
      alert('WAEC Section already exists.');
      return;
    }
    try {
      const postRes = await api.post('/waec-sections', { name: trimmed }, { withCredentials: true });
      const postData = postRes?.data;
      if (!postData || !postData._id) {
        console.error('Invalid response from POST /waec-sections:', postRes?.data);
        alert('Error adding WAEC section: Invalid server response.');
        return;
      }
      setNewSection('');
      // Optimistically add to local state immediately
      setSections(prev => [...prev, postData]);
      // Try to refresh authoritative list but do not fail the add if refresh fails
      try {
        const res = await api.get('/waec-sections', { withCredentials: true });
        const data = res?.data;
        setSections(Array.isArray(data) ? data : (data?.data || []));
      } catch (fetchErr) {
        console.warn('Failed to refresh WAEC sections after add, using optimistic update:', fetchErr);
      }
    } catch (err: any) {
      console.error('Error adding WAEC section:', err?.response?.data || err?.message || err);
      alert('Error adding WAEC section: ' + (err?.response?.data?.message || 'Unknown error'));
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
      await safeDelete(`/waec-sections/${id}`);
      // Optimistically remove from UI (backend confirmed)
      setSections(prev => prev.filter(s => (s._id || s.id) !== id));
    } catch (err: any) {
      console.error('Error deleting WAEC section:', err?.response?.data || err?.message || err);
      alert('Failed to delete WAEC section: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
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
      const res = await api.put(`/waec-sections/${id}`, { name: editValue }, { withCredentials: true });
      const updatedSection = res?.data;
      setSections(sections.map(s => {
        if (s._id === id || s.id === id) {
          return updatedSection || { ...s, name: editValue };
        }
        return s;
      }));
      setEditId(null);
      setEditValue('');
    } catch (err: any) {
      console.error('Error updating WAEC section:', err?.response?.data || err?.message || err);
      alert('Failed to update section: ' + (err?.response?.data?.message || 'Unknown error'));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage WAEC Sections</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="New WAEC Section"
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
        <DialogTitle>Delete WAEC Section</DialogTitle>
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

export default AdminWaecSectionTab;
