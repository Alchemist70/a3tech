import React, { useState, useEffect } from 'react';
import api from '../../api';
import safeDelete from '../../api/deleteHelper';
import {
  Box,
  Typography,
  List,
  Button,
  TextField,
  IconButton,
  Paper,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  TextareaAutosize,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

interface Lab {
  _id?: string;
  id?: string;
  subject: 'Chemistry' | 'Physics' | 'Biology';
  title: string;
  slug: string;
  description: string;
  objectives?: string[];
  materials?: string[];
  procedure?: string;
  precautions?: string[];
  observations?: string;
  calculations?: string;
  resultTemplate?: string;
  simulationContent?: string;
  images?: string[];
  order?: number;
  uuid?: string;
}

const AdminLabsTab: React.FC = () => {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLab, setDeletingLab] = useState<{ id: string; title?: string } | null>(null);

  const [newLab, setNewLab] = useState<Lab>({
    subject: 'Chemistry',
    title: '',
    slug: '',
    description: '',
    objectives: [],
    materials: [],
    procedure: '',
    precautions: [],
    observations: '',
    calculations: '',
    resultTemplate: '',
    simulationContent: '',
    images: [],
    order: 0,
  });

  const [editLab, setEditLab] = useState<Lab | null>(null);

  // Fetch labs from backend on mount
  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const response = await api.get('/labs', { withCredentials: true });
        setLabs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        setLabs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (!newLab.slug && newLab.title) {
      const generated = newLab.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setNewLab((prev) => ({ ...prev, slug: generated }));
    }
  }, [newLab.title, newLab.slug]);

  const handleAddLab = async () => {
    if (!newLab.title.trim() || !newLab.slug.trim() || !newLab.description.trim() || !newLab.subject) {
      alert('Please fill in all required fields: Subject, Title, Slug, and Description.');
      return;
    }

    try {
      const response = await api.post('/labs', newLab, { withCredentials: true });
      if (response.data.success) {
        setLabs([...labs, response.data.data]);
        setNewLab({
          subject: 'Chemistry',
          title: '',
          slug: '',
          description: '',
          objectives: [],
          materials: [],
          procedure: '',
          precautions: [],
          observations: '',
          calculations: '',
          resultTemplate: '',
          simulationContent: '',
          images: [],
          order: 0,
        });
      } else {
        alert('Error adding lab.');
      }
    } catch (error: any) {
      alert('Error adding lab: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    }
  };

  const handleEditLab = (lab: Lab) => {
    setEditId(lab._id || lab.id || '');
    setEditLab({ ...lab });
  };

  const handleSaveLab = async () => {
    if (!editLab || !editId) return;

    if (!editLab.title.trim() || !editLab.slug.trim() || !editLab.description.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const response = await api.put(`/labs/${editId}`, editLab, { withCredentials: true });
      if (response.data.success) {
        const updatedLabs = labs.map((lab) => (lab._id === editId || lab.id === editId ? response.data.data : lab));
        setLabs(updatedLabs);
        setEditId(null);
        setEditLab(null);
      } else {
        alert('Error updating lab.');
      }
    } catch (error: any) {
      alert('Error updating lab: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    }
  };

  const handleDeleteLab = (id: string, title?: string) => {
    setDeletingLab({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingLab) return;
    try {
      await safeDelete(`/labs/${deletingLab.id}`);
      setLabs(labs.filter((lab) => lab._id !== deletingLab.id && lab.id !== deletingLab.id));
    } catch (error: any) {
      alert('Error deleting lab: ' + (error?.response?.data?.message || error?.message || 'Unknown error'));
    } finally {
      setDeleteDialogOpen(false);
      setDeletingLab(null);
    }
  };

  const LabForm = ({ lab, onLab, onSave, isNew = false }: { lab: Lab; onLab: (l: Lab) => void; onSave: () => void; isNew?: boolean }) => (
    <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {isNew ? 'Add New Lab' : 'Edit Lab'}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <Select
          value={lab.subject}
          onChange={(e) => onLab({ ...lab, subject: e.target.value as 'Chemistry' | 'Physics' | 'Biology' })}
          label="Subject"
        >
          <MenuItem value="Chemistry">Chemistry</MenuItem>
          <MenuItem value="Physics">Physics</MenuItem>
          <MenuItem value="Biology">Biology</MenuItem>
        </Select>

        <TextField
          label="Title"
          value={lab.title}
          onChange={(e) => onLab({ ...lab, title: e.target.value })}
          fullWidth
          size="small"
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
        <TextField
          label="Slug"
          value={lab.slug}
          onChange={(e) => onLab({ ...lab, slug: e.target.value })}
          fullWidth
          size="small"
          helperText="Auto-generated from title"
        />

        <TextField
          label="Order"
          type="number"
          value={lab.order || 0}
          onChange={(e) => onLab({ ...lab, order: parseInt(e.target.value) || 0 })}
          fullWidth
          size="small"
        />
      </Box>

      <TextField
        label="Description"
        value={lab.description}
        onChange={(e) => onLab({ ...lab, description: e.target.value })}
        fullWidth
        multiline
        rows={3}
        sx={{ mb: 2 }}
        size="small"
      />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Procedure
      </Typography>
      <TextareaAutosize
        minRows={4}
        value={lab.procedure || ''}
        onChange={(e) => onLab({ ...lab, procedure: e.target.value })}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc' }}
        placeholder="Enter step-by-step procedure..."
      />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Observations
      </Typography>
      <TextareaAutosize
        minRows={3}
        value={lab.observations || ''}
        onChange={(e) => onLab({ ...lab, observations: e.target.value })}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc' }}
        placeholder="Enter observations..."
      />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Calculations (if applicable)
      </Typography>
      <TextareaAutosize
        minRows={3}
        value={lab.calculations || ''}
        onChange={(e) => onLab({ ...lab, calculations: e.target.value })}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc' }}
        placeholder="Enter calculation formula or guidelines..."
      />

      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        Simulation Content
      </Typography>
      <TextareaAutosize
        minRows={4}
        value={lab.simulationContent || ''}
        onChange={(e) => onLab({ ...lab, simulationContent: e.target.value })}
        style={{ width: '100%', padding: '8px', marginBottom: '16px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc' }}
        placeholder="Enter HTML/JavaScript for interactive simulation..."
      />

      <Button variant="contained" color="primary" onClick={onSave} sx={{ mt: 2 }}>
        {isNew ? 'Add Lab' : 'Save Lab'}
      </Button>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Manage Labs Practicals
      </Typography>

      <LabForm lab={newLab} onLab={setNewLab} onSave={handleAddLab} isNew={true} />

      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
        Existing Labs ({labs.length})
      </Typography>

      {loading ? (
        <Typography>Loading labs...</Typography>
      ) : labs.length === 0 ? (
        <Typography color="textSecondary">No labs found. Add one above.</Typography>
      ) : (
        <List>
          {labs.map((lab) => (
            <Paper
              key={lab._id || lab.id}
              sx={{
                mb: 2,
                p: 2,
                backgroundColor: editId === (lab._id || lab.id) ? '#e3f2fd' : '#fff',
              }}
            >
              {editId === (lab._id || lab.id) ? (
                <>
                  <LabForm
                    lab={editLab || lab}
                    onLab={setEditLab}
                    onSave={handleSaveLab}
                    isNew={false}
                  />
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => {
                      setEditId(null);
                      setEditLab(null);
                    }}
                    sx={{ mt: 1 }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Chip label={lab.subject} size="small" color="primary" sx={{ mb: 1 }} />
                      <Typography variant="h6">{lab.title}</Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Slug: {lab.slug}
                      </Typography>
                      <Typography variant="body2">{lab.description?.substring(0, 100)}...</Typography>
                    </Box>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditLab(lab)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteLab(lab._id || lab.id || '', lab.title)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              )}
            </Paper>
          ))}
        </List>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-lab-dialog-title"
      >
        <DialogTitle id="delete-lab-dialog-title">Delete Lab</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the lab "{deletingLab?.title || ''}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminLabsTab;
