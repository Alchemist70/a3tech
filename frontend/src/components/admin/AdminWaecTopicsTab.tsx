
import React, { useState, useEffect } from 'react';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import { v4 as uuidv4 } from 'uuid';
import { Box, Typography, List, ListItem, ListItemText, Button, TextField, IconButton, Paper, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';

const AdminWaecTopicsTab: React.FC = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState<string>('');
  const [newSlug, setNewSlug] = useState<string>('');
  const [newSectionId, setNewSectionId] = useState<string>('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editSectionId, setEditSectionId] = useState<string>('');
  const [editSlug, setEditSlug] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deletingTopic, setDeletingTopic] = useState<{ id: string; name?: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sectionsRes, topicsRes] = await Promise.all([
          api.get('/waec-sections', { withCredentials: true }),
          api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true })
        ]);
        const sectionsData = sectionsRes.data || [];
        setSections(Array.isArray(sectionsData) ? sectionsData : (sectionsData.data || []));
        const topicsData = topicsRes.data || [];
        const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalized);
      } catch (err) {
        console.error('Error fetching WAEC sections/topics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const extractTopic = (data: any) => {
    if (!data) return null;
    // common shapes: direct topic object, { success: true, data: topic }, { data: topic }
    if (data.success && data.data) return data.data;
    if (data.data && (data.data._id || data.data.id)) return data.data;
    if (data.topic && (data.topic._id || data.topic.id)) return data.topic;
    if (Array.isArray(data) && data.length === 1 && (data[0]._id || data[0].id)) return data[0];
    if (data._id || data.id) return data;
    return null;
  }

  const handleAdd = async () => {
    if (!newTopic.trim() || !newSectionId || !newSlug.trim()) {
      alert('Please enter a WAEC topic name and a unique, non-empty slug.');
      return;
    }
    let tempId = '';
    try {
      const generatedUuid = uuidv4();
      // Optimistic insert with temporary id so UI responds immediately
      tempId = `temp-${generatedUuid}`;
      const optimistic = { _id: tempId, id: tempId, name: newTopic.trim(), slug: newSlug.trim(), sectionId: newSectionId, uuid: generatedUuid };
      setTopics(prev => [...prev, optimistic]);
      setNewTopic('');
      setNewSlug('');
      if (process.env.NODE_ENV !== 'production') console.debug('[AdminWaecTopicsTab] optimistic add:', optimistic);
      const res = await api.post('/waec-topics', { name: optimistic.name, sectionId: optimistic.sectionId, slug: optimistic.slug, uuid: optimistic.uuid }, { withCredentials: true });
      const data = res.data;
      const topic = extractTopic(data);
      let createdTopic: any = topic;
      if (!createdTopic) {
        // fallback: try to use returned fields or keep optimistic
        createdTopic = { _id: data && (data._id || data.id) ? (data._id || data.id) : undefined, name: optimistic.name, slug: optimistic.slug, sectionId: optimistic.sectionId, uuid: optimistic.uuid };
      }
      const topicWithUuid = { ...createdTopic, id: createdTopic._id || createdTopic.id || optimistic.id, uuid: createdTopic.uuid || optimistic.uuid };
      // replace optimistic item with authoritative one (string-safe)
      setTopics(prev => prev.map(t => (String((t.id || t._id) || '') === String(tempId)) ? topicWithUuid : t));
      // Try to refresh authoritative list but do not fail the add if refresh fails
      try {
        const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
        const topicsData = topicsRes.data || [];
        const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalized);
      } catch (fetchErr) {
        console.warn('Failed to refresh WAEC topics after add, using optimistic update:', fetchErr);
      }
      // If server didn't persist uuid, attempt to persist it using update endpoint
      try {
        const savedId = createdTopic._id || createdTopic.id || topicWithUuid.id;
        const serverHasUuid = data && (data.uuid || (data.data && data.data.uuid));
        if (savedId && !serverHasUuid) {
          await api.put(`/waec-topics/${savedId}`, { uuid: topicWithUuid.uuid }, { withCredentials: true });
        }
      } catch (persistErr) {
        console.warn('Failed to persist generated UUID for WAEC topic:', persistErr);
      }
    } catch (err: any) {
      console.error('Error adding WAEC topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      // If server returned 2xx but axios still threw (service-worker/proxy anomaly), treat as success
      if (status && status >= 200 && status < 300 && err.response?.data) {
        const data = err.response.data;
        const topic = extractTopic(data) || data;
        const createdTopic: any = topic || { _id: data._id || data.id, name: newTopic.trim(), slug: newSlug.trim(), sectionId: newSectionId, uuid: data.uuid };
        const topicWithUuid = { ...createdTopic, id: createdTopic._id || createdTopic.id || tempId, uuid: createdTopic.uuid || (tempId && tempId.split('-')[1]) || uuidv4() };
        setTopics(prev => prev.map(t => String((t.id || t._id) || '') === String(tempId) ? topicWithUuid : t));
        // try to refresh authoritative list in background
        try {
          const topicsRes = await api.get('/waec-topics', { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          console.warn('Failed to refresh WAEC topics after add (caught success):', fetchErr);
        }
        return;
      }
      // remove optimistic item if present
      if (tempId) {
        setTopics(prev => prev.filter(t => String((t.id || t._id) || '') !== String(tempId)));
      }
      alert('Error adding WAEC topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
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
      await safeDelete(`/waec-topics/${id}`);
      // refresh authoritative list (cache-busted) in background
      try {
        const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
        const topicsData = topicsRes.data || [];
        const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
        setTopics(normalized);
      } catch (fetchErr) {
        // keep optimistic state if refresh fails
        console.warn('Failed to refresh WAEC topics after delete:', fetchErr);
      }
    } catch (err: any) {
      console.error('Error deleting WAEC topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      if (status && status >= 200 && status < 300 && err.response?.data) {
        // server succeeded; try to reconcile authoritative list
        try {
          const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
          return;
        } catch (fetchErr) {
          console.warn('Failed to refresh WAEC topics after delete (caught):', fetchErr);
        }
      }
      // If no response (network error), poll for deletion
      if (!err?.response) {
        const checkDeleted = async () => {
          for (let i = 0; i < 5; i++) {
            try {
              const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
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
      // rollback optimistic state and show error
      setTopics(previous);
      alert('Failed to delete WAEC topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
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
      alert('Please enter a WAEC topic name and a unique, non-empty slug.');
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
      const res = await api.put(`/waec-topics/${id}`, { name: optimisticUpdate.name, sectionId: optimisticUpdate.sectionId, slug: optimisticUpdate.slug }, { withCredentials: true });
      const data = res?.data;
      let updated = extractTopic(data);
      if (!updated && res && res.status >= 200 && res.status < 300) {
        updated = optimisticUpdate;
      }
      if (updated) {
        const updatedTopic = { ...updated, id: updated._id || updated.id || id, uuid: updated.uuid || uuidv4() };
        setTopics(prev => prev.map(t => String((t._id || t.id) || '') === String(updatedTopic._id || updatedTopic.id) ? updatedTopic : t));
      } else {
        // if no valid response, try to refresh authoritative list
        try {
          const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          // rollback to previous state on failure
          setTopics(previous);
          alert('Error updating WAEC topic.');
        }
      }
    } catch (err: any) {
      console.error('Error updating WAEC topic (caught):', err?.response || err?.message || err);
      const status = err?.response?.status;
      if (status && status >= 200 && status < 300 && err.response?.data) {
        try {
          const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
          const topicsData = topicsRes.data || [];
          const normalized = Array.isArray(topicsData) ? topicsData.map((t: any) => ({ ...t, id: t._id || t.id, uuid: t.uuid || uuidv4() })) : [];
          setTopics(normalized);
        } catch (fetchErr) {
          setTopics(previous);
          alert('Failed to update WAEC topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
        }
        return;
      }
      // If no response, poll for update
      if (!err?.response) {
        const checkUpdated = async () => {
          for (let i = 0; i < 5; i++) {
            try {
              const topicsRes = await api.get(`/waec-topics?_=${Date.now()}`, { withCredentials: true });
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
      alert('Failed to update WAEC topic: ' + (err?.response?.data?.message || err?.message || 'Unknown error'));
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Manage WAEC Topics</Typography>
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
          label="New WAEC Topic"
          value={newTopic}
          onChange={e => setNewTopic(e.target.value)}
          size="small"
          disabled={sections.length === 0}
          helperText={sections.length === 0 ? 'Add a WAEC section first.' : ''}
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
                Warning: One or more WAEC topics are missing a slug. Please edit and add a unique slug for each topic.
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
            {`Are you sure you want to delete WAEC topic "${deletingTopic?.name || ''}"? This action cannot be undone.`}
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

export default AdminWaecTopicsTab;
