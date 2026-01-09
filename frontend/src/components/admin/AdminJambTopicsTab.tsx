
import React, { useState, useEffect } from 'react';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import { v4 as uuidv4 } from 'uuid';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

interface Topic {
  _id?: string;
  id?: string;
  sectionId: string;
  name: string;
  slug?: string;
  uuid?: string;
}

interface Section {
  _id?: string;
  id?: string;
  name: string;
}

const AdminJambTopicsTab: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newSectionId, setNewSectionId] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editSectionId, setEditSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTopic, setDeletingTopic] = useState<{ id: string; name?: string } | null>(null);

  // Fetch sections and topics from backend on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sectionsRes, topicsRes] = await Promise.all([
          api.get('/jamb-sections', { withCredentials: true }),
          api.get('/jamb-topics', { withCredentials: true })
        ]);
        const sectionsData = sectionsRes.data || [];
        const topicsData = topicsRes.data || [];
        setSections(Array.isArray(sectionsData) ? sectionsData : []);
        const normalizedTopics = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalizedTopics);
        if (Array.isArray(sectionsData) && sectionsData.length > 0) {
          setNewSectionId(sectionsData[0]._id || sectionsData[0].id || '');
          setEditSectionId(sectionsData[0]._id || sectionsData[0].id || '');
        }
      } catch {
        setSections([]);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const extractTopic = (data: any) => {
    if (!data) return null;
    if (data.success && data.data) return data.data;
    if (data.data && (data.data._id || data.data.id)) return data.data;
    if (data.topic && (data.topic._id || data.topic.id)) return data.topic;
    if (Array.isArray(data) && data.length === 1 && (data[0]._id || data[0].id)) return data[0];
    if (data._id || data.id) return data;
    return null;
  }

  const handleAdd = async () => {
    if (!newTopic.trim() || !newSectionId || !newSlug.trim()) {
      alert('Please enter a JAMB topic name and a unique, non-empty slug.');
      return;
    }
    let tempId = '';
    try {
      const generatedUuid = uuidv4();
      tempId = `temp-${generatedUuid}`;
      const optimistic = { _id: tempId, id: tempId, name: newTopic.trim(), slug: newSlug.trim(), sectionId: newSectionId, uuid: generatedUuid };
      setTopics(prev => [...prev, optimistic]);
      setNewTopic('');
      setNewSlug('');
      if (process.env.NODE_ENV !== 'production') console.debug('[AdminJambTopicsTab] optimistic add:', optimistic);
      const res = await api.post('/jamb-topics', { name: optimistic.name, sectionId: optimistic.sectionId, slug: optimistic.slug, uuid: optimistic.uuid }, { withCredentials: true });
      const data = res.data;
      const topic = extractTopic(data);
      let createdTopic: any = topic;
      if (!createdTopic) {
        createdTopic = { _id: data && (data._id || data.id) ? (data._id || data.id) : undefined, name: optimistic.name, slug: optimistic.slug, sectionId: optimistic.sectionId, uuid: optimistic.uuid };
      }
      const topicWithUuid = { ...createdTopic, id: createdTopic._id || createdTopic.id || optimistic.id, uuid: createdTopic.uuid || optimistic.uuid };
      setTopics(prev => prev.map(t => (String((t.id || t._id) || '') === String(tempId)) ? topicWithUuid : t));
      // Try to refresh authoritative list but do not fail the add if refresh fails
      try {
        const topicsRes = await api.get('/jamb-topics', { withCredentials: true });
        const topicsData = topicsRes.data || [];
        const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalized);
      } catch (fetchErr) {
        console.warn('Failed to refresh JAMB topics after add, using optimistic update:', fetchErr);
      }
      try {
        const savedId = createdTopic._id || createdTopic.id || topicWithUuid.id;
        const serverHasUuid = data && (data.uuid || (data.data && data.data.uuid));
        if (savedId && !serverHasUuid) {
          await api.put(`/jamb-topics/${savedId}`, { uuid: topicWithUuid.uuid }, { withCredentials: true });
        }
      } catch (persistErr) {
        console.warn('Failed to persist generated UUID for JAMB topic:', persistErr);
      }
    } catch (err: any) {
      console.error('Error adding JAMB topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      if (status && status >= 200 && status < 300 && err.response?.data) {
        const data = err.response.data;
        const topic = extractTopic(data) || data;
        const createdTopic: any = topic || { _id: data._id || data.id, name: newTopic.trim(), slug: newSlug.trim(), sectionId: newSectionId, uuid: data.uuid };
        const topicWithUuid = { ...createdTopic, id: createdTopic._id || createdTopic.id || tempId, uuid: createdTopic.uuid || (tempId && tempId.split('-')[1]) || uuidv4() };
        setTopics(prev => prev.map(t => String((t.id || t._id) || '') === String(tempId) ? topicWithUuid : t));
        try {
          const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          console.warn('Failed to refresh JAMB topics after add (caught success):', fetchErr);
        }
        return;
      }

      // If network error/no response, poll for the new topic before failing
      if (!err?.response) {
        const checkAdded = async () => {
          for (let i = 0; i < 5; i++) {
            try {
              const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
              const topicsData = topicsRes.data || [];
              const found = Array.isArray(topicsData) && topicsData.find((t: any) => t.slug === newSlug.trim() || t.name === newTopic.trim() || t.uuid === (tempId && tempId.split('-')[1]));
              if (found) {
                const normalized = topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() }));
                setTopics(normalized);
                return true;
              }
            } catch (e) {
              // ignore and retry
            }
            await new Promise(r => setTimeout(r, 800));
          }
          return false;
        };
        const added = await checkAdded();
        if (added) return;
      }

      if (tempId) setTopics(prev => prev.filter(t => String((t.id || t._id) || '') !== String(tempId)));
      alert('Error adding JAMB topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  const handleDelete = (id: string, name?: string) => {
    setDeletingTopic({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTopic) return;
    const id = deletingTopic.id;
    // Optimistically remove immediately so UI reflects change fast
    const previous = topics;
    setTopics(prev => prev.filter(t => String((t._id || t.id) || '') !== String(id)));
    setDeleteDialogOpen(false);
    setDeletingTopic(null);
    try {
      await safeDelete(`/jamb-topics/${id}`);
      try {
        const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
        const topicsData = topicsRes.data || [];
        const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalized);
      } catch (fetchErr) {
        console.warn('Failed to refresh JAMB topics after delete:', fetchErr);
      }
    } catch (err: any) {
      console.error('Error deleting JAMB topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      if (status && status >= 200 && status < 300 && err.response?.data) {
        try {
          const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
          return;
        } catch (fetchErr) {
          console.warn('Failed to refresh JAMB topics after delete (caught):', fetchErr);
        }
      }
      // If no response, poll for deletion
      if (!err?.response) {
        const checkDeleted = async () => {
          for (let i = 0; i < 5; i++) {
            try {
              const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
              const topicsData = topicsRes.data || [];
              const found = Array.isArray(topicsData) && topicsData.find((t: any) => String((t._id || t.id) || '') === String(id));
              if (!found) {
                const normalized = topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() }));
                setTopics(normalized);
                return true;
              }
            } catch (e) {
              // ignore and retry
            }
            await new Promise(r => setTimeout(r, 800));
          }
          return false;
        };
        const deleted = await checkDeleted();
        if (deleted) return;
      }
      setTopics(previous);
      alert('Failed to delete JAMB topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  const handleEdit = (id: string, name: string, sectionId: string, slug?: string) => {
    setEditId(id);
    setEditValue(name);
    setEditSectionId(sectionId);
    setEditSlug(slug || '');
  };

  const handleSave = async (id: string) => {
    if (!editValue.trim() || !editSectionId || !editSlug.trim()) {
      alert('Please enter a JAMB topic name and a unique, non-empty slug.');
      return;
    }
    // Optimistically update UI immediately
    const previous = topics;
    const optimisticUpdate = { _id: id, id, name: editValue.trim(), slug: editSlug.trim(), sectionId: editSectionId } as any;
    setTopics(prev => prev.map(t => String((t._id || t.id) || '') === String(id) ? optimisticUpdate : t));
    setEditId(null);
    setEditValue('');
    setEditSlug('');
    try {
      const res = await api.put(`/jamb-topics/${id}`, { name: optimisticUpdate.name, sectionId: optimisticUpdate.sectionId, slug: optimisticUpdate.slug }, { withCredentials: true });
      const data = res?.data;
      let updated = extractTopic(data);
      if (!updated && res && res.status >= 200 && res.status < 300) {
        updated = optimisticUpdate;
      }
      if (updated) {
        const updatedTopic = { ...updated, id: updated._id || updated.id || id, uuid: updated.uuid || uuidv4() };
        setTopics(prev => prev.map(t => String((t._id || t.id) || '') === String(updatedTopic._id || updatedTopic.id) ? updatedTopic : t));
      } else {
        try {
          const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          setTopics(previous);
          alert('Error updating JAMB topic.');
        }
      }
    } catch (err: any) {
      console.error('Error updating JAMB topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      if (status && status >= 200 && status < 300 && err.response?.data) {
        try {
          const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          setTopics(previous);
          alert('Failed to update JAMB topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
        }
        return;
      }
      // If no response, poll for update
      if (!err?.response) {
        const checkUpdated = async () => {
          for (let i = 0; i < 5; i++) {
            try {
              const topicsRes = await api.get(`/jamb-topics?_=${Date.now()}`, { withCredentials: true });
              const topicsData = topicsRes.data || [];
              const found = Array.isArray(topicsData) && topicsData.find((t: any) => String((t._id || t.id) || '') === String(id) && (t.name === optimisticUpdate.name && t.slug === optimisticUpdate.slug));
              if (found) {
                const normalized = topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() }));
                setTopics(normalized);
                return true;
              }
            } catch (e) {
              // ignore
            }
            await new Promise(r => setTimeout(r, 800));
          }
          return false;
        };
        const updated = await checkUpdated();
        if (updated) return;
      }
      setTopics(previous);
      alert('Failed to update JAMB topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage JAMB Topics</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Select
          value={newSectionId}
          onChange={e => setNewSectionId(e.target.value as string)}
          size="small"
          disabled={sections.length === 0}
        >
          {sections.map(section => (
            <MenuItem key={section._id || section.id} value={section._id || section.id}>{section.name}</MenuItem>
          ))}
        </Select>
        <TextField
          label="New JAMB Topic"
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          size="small"
          disabled={sections.length === 0}
          helperText={sections.length === 0 ? 'Add a JAMB section first.' : ''}
        />
        <TextField
          label="Slug"
          value={newSlug}
          onChange={e => setNewSlug(e.target.value)}
          size="small"
          disabled={sections.length === 0}
        />
        <Button variant="contained" onClick={handleAdd} disabled={sections.length === 0}>Add</Button>
      </Box>
      <Paper elevation={2}>
        {loading ? (
          <Typography sx={{ p: 2 }}>Loading...</Typography>
        ) : (
          <List>
            {topics.some(topic => !topic.slug) && (
              <Typography color="error" sx={{ p: 2 }}>
                Warning: One or more JAMB topics are missing a slug. Please edit and add a unique slug for each topic.
              </Typography>
            )}
            {topics.map(topic => {
              const key = topic._id || topic.id || topic.name;
              const topicId = topic._id || topic.id || '';
              const section = sections.find(s => (s._id || s.id) === topic.sectionId);
              return (
                <ListItem key={key} secondaryAction={
                  editId === topicId ? (
                    <IconButton edge="end" onClick={() => handleSave(topicId)}><SaveIcon /></IconButton>
                  ) : (
                    <>
                      <IconButton edge="end" onClick={() => handleEdit(topicId, topic.name, topic.sectionId, topic.slug)}><EditIcon /></IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(topicId, topic.name)} sx={{ ml: 1 }}><DeleteIcon /></IconButton>
                    </>
                  )
                }>
                  {editId === topicId ? (
                    <>
                      <Select value={editSectionId} onChange={e => setEditSectionId(e.target.value as string)} size="small" sx={{ mr: 1 }}>
                        {sections.map(section => (
                          <MenuItem key={section._id || section.id} value={section._id || section.id}>{section.name}</MenuItem>
                        ))}
                      </Select>
                      <TextField value={editValue} onChange={e => setEditValue(e.target.value)} size="small" sx={{ mr: 1 }} />
                      <TextField value={editSlug} onChange={e => setEditSlug(e.target.value)} size="small" label="Slug" sx={{ mr: 1 }} />
                    </>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ListItemText primary={topic.name} secondary={section?.name} />
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
            {`Are you sure you want to delete JAMB topic "${deletingTopic?.name || ''}"? This action cannot be undone.`}
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

export default AdminJambTopicsTab;
