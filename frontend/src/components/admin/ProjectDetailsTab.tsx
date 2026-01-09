// Markdown formatting toolbar for concept descriptions
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import api from '../../api';
import normalizeImageUrl from '../../utils/normalizeImageUrl';
import { Project } from '../../types/Project';
import styles from './ProjectDetailsTab.module.css';
import { buildProjectPayload } from '../../utils/projectPayloadBuilder';
import { PROJECT_CONSTRAINTS } from '../../constants/projectConstraints';
import { Paper, Typography, Divider, Button, Box, Grid, TextField, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import MarkdownToolbar from '../MarkdownToolbar';

// For type-safe level keys
const levels = ['beginner', 'intermediate', 'advanced'] as const;
type Level = typeof levels[number];

const emptyProject: Project = {
  id: '',
  title: '',
  subtitle: '',
  description: '',
  category: '',
  image: '',
  technologies: [],
  tags: [],
  featured: false,
  createdAt: '',
  links: {},
  media: {},
  educationalContent: {
    beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
    intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
    advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
  },
};

// Helper: convert array to string for display
function arrayToResourceString(arr: { title?: string; url?: string; type?: string }[]): string {
  if (!Array.isArray(arr)) return '';
  return arr.map(r => `${r.title || ''}::${r.url || ''}::${r.type || ''}`).join('\n');
}
function arrayToQuizString(arr: { question?: string; options?: string[]; answer?: number; explanations?: string[] }[]): string {
  if (!Array.isArray(arr)) return '';
  return arr.map(q => `${q.question || ''}||${(q.options||[]).join('||')}||${q.answer || 0}||${(q.explanations||[]).join('||')}`).join('\n');
}

type ProjectDetailsTabProps = {
  projects: Project[];
  onAddProject?: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onDeleteProject?: (id: string | number) => void;
};

export default function ProjectDetailsTab({ projects, onAddProject, onEditProject, onDeleteProject }: ProjectDetailsTabProps) {
  // --- Edit form controlled resource and quiz strings ---
  const [editResourceStrings, setEditResourceStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = arrayToResourceString(emptyProject.educationalContent[l].resources); });
    return obj;
  });
  const [editPrereqStrings, setEditPrereqStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = Array.isArray(emptyProject.educationalContent[l].prerequisites) ? emptyProject.educationalContent[l].prerequisites.join(', ') : ''; });
    return obj;
  });
  // --- Add form controlled resource and quiz strings ---
  const [resourceStrings, setResourceStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = arrayToResourceString(emptyProject.educationalContent[l].resources); });
    return obj;
  });
  const [quizStrings, setQuizStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = arrayToQuizString(emptyProject.educationalContent[l].quizzes); });
    return obj;
  });
  // --- Add form controlled project state ---
  const [newProject, setNewProject] = useState<Project>({ ...emptyProject });
  // Ref for the beginner concept description input
  const beginnerDescRef = useRef<HTMLTextAreaElement>(null);
  // --- Add form controlled prerequisites strings ---
  const [prereqStrings, setPrereqStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = Array.isArray(emptyProject.educationalContent[l].prerequisites) ? emptyProject.educationalContent[l].prerequisites.join(', ') : ''; });
    return obj;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  // Projects are now passed as a prop from Admin.tsx

  // Rehydrate controlled strings for prerequisites and resources after projects are fetched
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  useEffect(() => {
    // Always rehydrate controlled strings for new project form from the first project in the prop
    if (projects && projects.length > 0 && editIndex === null) {
      const first = projects[0];
      const firstEC = first.educationalContent || emptyProject.educationalContent;
      const prereqObj = {} as Record<Level, string>;
      const resourceObj = {} as Record<Level, string>;
      levels.forEach(l => {
        const lvlEC = (firstEC && (firstEC as any)[l]) ? (firstEC as any)[l] : emptyProject.educationalContent[l];
        prereqObj[l] = Array.isArray(lvlEC.prerequisites) ? lvlEC.prerequisites.join(', ') : '';
        resourceObj[l] = arrayToResourceString(lvlEC.resources || []);
      });
      setPrereqStrings(prereqObj);
      setResourceStrings(resourceObj);
    }
    // For edit form, rehydrate controlled resource strings and prereqStrings for each project when editProject changes and in edit mode
    if (typeof editProject !== 'undefined' && editProject && editIndex !== null) {
      const editResourceObj = {} as Record<Level, string>;
      const editPrereqObj = {} as Record<Level, string>;
      const editEC = editProject.educationalContent || emptyProject.educationalContent;
      levels.forEach(l => {
        const lvlEdit = (editEC && (editEC as any)[l]) ? (editEC as any)[l] : emptyProject.educationalContent[l];
        editResourceObj[l] = arrayToResourceString(lvlEdit.resources || []);
        editPrereqObj[l] = Array.isArray(lvlEdit.prerequisites) ? lvlEdit.prerequisites.join(', ') : '';
        // Ensure concepts array exists and is not undefined/null on the editProject object
        if (!Array.isArray(lvlEdit.concepts)) {
          editProject.educationalContent = {
            ...(editProject.educationalContent || {}),
            [l]: {
              ...(editProject.educationalContent?.[l] || emptyProject.educationalContent[l]),
              concepts: []
            }
          } as any;
        } else {
          // For each concept, ensure description is ConceptBlock[]
          editProject.educationalContent = {
            ...(editProject.educationalContent || {}),
            [l]: {
              ...(editProject.educationalContent?.[l] || emptyProject.educationalContent[l]),
              concepts: lvlEdit.concepts.map((c: any) => {
                if (!Array.isArray(c.description)) {
                  if (typeof c.description === 'string') return { ...c, description: [{ type: 'text', content: c.description }] };
                  return { ...c, description: [] };
                }
                return c;
              })
            }
          } as any;
        }
      });
      setEditPrereqStrings(editPrereqObj);
    }
    // No return value (do not return JSX or undefined)
  }, [projects, editProject, editIndex]);
  const [editQuizStrings, setEditQuizStrings] = useState<Record<Level, string>>(() => {
    const obj = {} as Record<Level, string>;
    levels.forEach(l => { obj[l] = ''; });
    return obj;
  });

  // Helper to safely get an educationalContent level for the editProject
  const getEditLevel = (level: Level) => {
    if (!editProject) return emptyProject.educationalContent[level];
    const ec = (editProject.educationalContent && (editProject.educationalContent as any)[level]) ? (editProject.educationalContent as any)[level] : null;
    return ec || emptyProject.educationalContent[level];
  };
  useEffect(() => {
    if (editProject) {
      const resObj = {} as Record<Level, string>;
      const quizObj = {} as Record<Level, string>;
      const prereqObj = {} as Record<Level, string>;
      levels.forEach(l => {
        const lvl = (editProject.educationalContent && (editProject.educationalContent as any)[l]) ? (editProject.educationalContent as any)[l] : emptyProject.educationalContent[l];
        resObj[l] = arrayToResourceString(lvl.resources || []);
        quizObj[l] = arrayToQuizString(lvl.quizzes || []);
        prereqObj[l] = Array.isArray(lvl.prerequisites) ? lvl.prerequisites.join(', ') : '';
      });
      setEditResourceStrings(resObj);
      setEditQuizStrings(quizObj);
      setEditPrereqStrings(prereqObj);
    }
  }, [editProject]);

  // When the user clicks 'Add New Project', reset newProject (id remains blank)
  const handleAddNewProject = () => {
    setNewProject({ ...emptyProject });
    setResourceStrings(() => {
      const obj = {} as Record<Level, string>;
      levels.forEach(l => { obj[l] = arrayToResourceString(emptyProject.educationalContent[l as Level].resources); });
      return obj;
    });
    setQuizStrings(() => {
      const obj = {} as Record<Level, string>;
      levels.forEach(l => { obj[l] = arrayToQuizString(emptyProject.educationalContent[l as Level].quizzes); });
      return obj;
    });
  };

  const handleAddChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value: rawValue, type, checked } = e.target as HTMLInputElement;
    const value: any = rawValue;
    if (type === 'checkbox') {
      setNewProject(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'technologies' || name === 'tags') {
      setNewProject(prev => ({ ...prev, [name]: value.split(',').map((s: string) => s.trim()).filter(Boolean) }));
    } else if (name.startsWith('links.')) {
      const key = name.split('.')[1];
      setNewProject(prev => ({ ...prev, links: { ...prev.links, [key]: value } }));
    } else if (name.startsWith('media.')) {
      const key = name.split('.')[1];
      setNewProject(prev => ({ ...prev, media: { ...prev.media, [key]: value.split(',').map((s: string) => s.trim()).filter(Boolean) } }));
    } else if (name.startsWith('educationalContent.')) {
      const parts = name.split('.');
      const level = parts[1];
      const levelKey = level as Level;
      if (parts[2] === 'concepts' && parts.length === 5) {
        const idx = parseInt(parts[3], 10);
        const field = parts[4];
        setNewProject(prev => {
          const concepts = Array.isArray(prev.educationalContent[levelKey].concepts) ? [...prev.educationalContent[levelKey].concepts] : [];
          if (field === 'images' || field === 'videos' || field === 'diagrams') {
            concepts[idx] = {
              ...concepts[idx],
              [field]: value.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            };
          } else if (field === 'description') {
            concepts[idx] = {
              ...concepts[idx],
              description: value // You may want to parse/validate this as needed
            };
          } else {
            concepts[idx] = {
              ...concepts[idx],
              [field]: value
            };
          }
          return {
            ...prev,
            educationalContent: {
              ...prev.educationalContent,
              [levelKey]: {
                ...prev.educationalContent[levelKey],
                concepts
              }
            }
          };
        });
      } else if (parts[2] === 'resources') {
        setResourceStrings(prev => ({ ...prev, [levelKey]: value }));
      } else if (parts[2] === 'quizzes') {
        setQuizStrings(prev => ({ ...prev, [levelKey]: value }));
      } else if (parts[2] === 'prerequisites') {
        setPrereqStrings(prev => ({ ...prev, [levelKey]: value }));
      } else {
        // Handle other educationalContent fields
        const field = parts[2];
        setNewProject(prev => ({
          ...prev,
          educationalContent: {
            ...prev.educationalContent,
            [levelKey]: {
              ...prev.educationalContent[levelKey],
              [field]: value,
            },
          },
        }));
      }
    } else {
      setNewProject(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAdd = async () => {
    setMessage(null);
    setError(null);
    if (!newProject.id || newProject.id.trim() === '') {
      setError('Please enter/paste a valid Project UUID.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      // Ensure resources and prerequisites are parsed and included in the payload
      const parsedResourceStrings = { ...resourceStrings };
      levels.forEach(level => {
        if (!parsedResourceStrings[level]) parsedResourceStrings[level] = '';
        // Sync prerequisites from prereqStrings to newProject before saving
        newProject.educationalContent[level].prerequisites = prereqStrings[level]
          ? prereqStrings[level].split(',').map(s => s.trim()).filter(s => s.length > 0)
          : [];
      });
      const payload = buildProjectPayload(newProject, parsedResourceStrings, quizStrings, prereqStrings);
      console.log('DEBUG: Prerequisites sent (add):', {
        beginner: payload.educationalContent.beginner.prerequisites,
        intermediate: payload.educationalContent.intermediate.prerequisites,
        advanced: payload.educationalContent.advanced.prerequisites
      });
      console.log('DEBUG: Payload sent to backend (add):', JSON.stringify(payload, null, 2));
      const res = await api.post('/projects', payload);
      if (res.data && res.data.data && res.data.data.educationalContent) {
        console.log('DEBUG: Prerequisites received (add):', {
          beginner: res.data.data.educationalContent.beginner.prerequisites,
          intermediate: res.data.data.educationalContent.intermediate.prerequisites,
          advanced: res.data.data.educationalContent.advanced.prerequisites
        });
      }
      console.log('DEBUG: Response from backend (add):', JSON.stringify(res.data, null, 2));
      if (res.data && res.data.success && res.data.data) {
        setMessage('Project added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        if (onAddProject) onAddProject(res.data.data);
        // Only reset form after new project is reflected in parent state
        setTimeout(() => setNewProject({ ...emptyProject }), 500);
      } else {
        setError('Failed to save project to backend.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err: any) {
      // Extract detailed error messages from API response
      let errorMessage = 'Failed to save project to backend.';
      
      if (err.response?.data) {
        const data = err.response.data;
        // Check for validation errors first
        if (data.details && typeof data.details === 'object') {
          const errors = Object.entries(data.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errors}`;
        } else if (data.validation && typeof data.validation === 'object') {
          const errors = Object.entries(data.validation)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errors}`;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // --- Interactive quiz editor helpers for Add form ---
  const syncQuizStringsFromNew = (level: Level) => {
    const arr = (newProject.educationalContent[level].quizzes || []) as any[];
    setQuizStrings(prev => ({ ...prev, [level]: arrayToQuizString(arr) }));
  };
  const addQuizToNew = (level: Level) => {
    setNewProject(prev => {
      const quizzes = Array.isArray(prev.educationalContent[level].quizzes) ? [...prev.educationalContent[level].quizzes] : [];
      quizzes.push({ question: '', options: [], answer: 0, explanations: [] });
      const out = { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...prev.educationalContent[level], quizzes } } };
      return out;
    });
    setTimeout(() => syncQuizStringsFromNew(level), 0);
  };
  const updateNewQuiz = (level: Level, idx: number, updater: (q: any) => any) => {
    setNewProject(prev => {
      const quizzes = Array.isArray(prev.educationalContent[level].quizzes) ? [...prev.educationalContent[level].quizzes] : [];
      quizzes[idx] = updater(quizzes[idx] || { question: '', options: [], answer: 0, explanations: [] });
      return { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...prev.educationalContent[level], quizzes } } };
    });
    setTimeout(() => syncQuizStringsFromNew(level), 0);
  };
  const removeNewQuiz = (level: Level, idx: number) => {
    setNewProject(prev => {
      const quizzes = Array.isArray(prev.educationalContent[level].quizzes) ? [...prev.educationalContent[level].quizzes] : [];
      quizzes.splice(idx, 1);
      return { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...prev.educationalContent[level], quizzes } } };
    });
    setTimeout(() => syncQuizStringsFromNew(level), 0);
  };

  // --- Interactive quiz editor helpers for Edit form ---
  const syncQuizStringsFromEdit = (level: Level) => {
    if (!editProject) return;
    const lvl = getEditLevel(level);
    const arr = (lvl.quizzes || []) as any[];
    setEditQuizStrings(prev => ({ ...prev, [level]: arrayToQuizString(arr) }));
  };
  const addQuizToEdit = (level: Level) => {
    if (!editProject) return;
    setEditProject(prev => {
      if (!prev) return prev;
      const lvl = (prev.educationalContent && (prev.educationalContent as any)[level]) ? (prev.educationalContent as any)[level] : emptyProject.educationalContent[level];
      const quizzes = Array.isArray(lvl.quizzes) ? [...lvl.quizzes] : [];
      quizzes.push({ question: '', options: [], answer: 0, explanations: [] });
      return { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...(prev.educationalContent?.[level] || emptyProject.educationalContent[level]), quizzes } } } as Project;
    });
    setTimeout(() => syncQuizStringsFromEdit(level), 0);
  };
  const updateEditQuiz = (level: Level, idx: number, updater: (q: any) => any) => {
    if (!editProject) return;
    setEditProject(prev => {
      if (!prev) return prev;
      const lvl = (prev.educationalContent && (prev.educationalContent as any)[level]) ? (prev.educationalContent as any)[level] : emptyProject.educationalContent[level];
      const quizzes = Array.isArray(lvl.quizzes) ? [...lvl.quizzes] : [];
      quizzes[idx] = updater(quizzes[idx] || { question: '', options: [], answer: 0, explanations: [] });
      return { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...(prev.educationalContent?.[level] || emptyProject.educationalContent[level]), quizzes } } } as Project;
    });
    setTimeout(() => syncQuizStringsFromEdit(level), 0);
  };
  const removeEditQuiz = (level: Level, idx: number) => {
    if (!editProject) return;
    setEditProject(prev => {
      if (!prev) return prev;
      const lvlPrev = (prev.educationalContent && (prev.educationalContent as any)[level]) ? (prev.educationalContent as any)[level] : emptyProject.educationalContent[level];
      const quizzes = Array.isArray(lvlPrev.quizzes) ? [...lvlPrev.quizzes] : [];
      quizzes.splice(idx, 1);
      return { ...prev, educationalContent: { ...prev.educationalContent, [level]: { ...(prev.educationalContent?.[level] || emptyProject.educationalContent[level]), quizzes } } } as Project;
    });
    setTimeout(() => syncQuizStringsFromEdit(level), 0);
  };

  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    // Ensure the edit project always has a normalized educationalContent shape
    const base = projects[idx] || {} as Project;
    const normalizedEditProject = {
      ...base,
      educationalContent: {
        ...emptyProject.educationalContent,
        ...(base.educationalContent || {})
      }
    } as Project;
    setEditProject(normalizedEditProject);
    // Rehydrate prereqStrings for the edit form (use safe access)
    const project = normalizedEditProject;
    const editPrereqObj = {} as Record<Level, string>;
    levels.forEach(l => {
      const lvl = project.educationalContent?.[l] || emptyProject.educationalContent[l];
      editPrereqObj[l] = Array.isArray(lvl.prerequisites) ? lvl.prerequisites.join(', ') : '';
    });
    setPrereqStrings(editPrereqObj);
  };
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editProject) return;
    const { name, value: rawValue, type, checked } = e.target as HTMLInputElement;
    const value: string = rawValue;
    if (type === 'checkbox') {
      setEditProject({ ...editProject, [name]: checked });
    } else if (name === 'technologies' || name === 'tags') {
  setEditProject({ ...editProject, [name]: value.split(',').map(function(s: string) { return s.trim(); }).filter(Boolean) });
    } else if (name.startsWith('links.')) {
      const key = name.split('.')[1];
      setEditProject({ ...editProject, links: { ...editProject.links, [key]: value } });
    } else if (name.startsWith('media.')) {
      const key = name.split('.')[1];
  setEditProject({ ...editProject, media: { ...editProject.media, [key]: value.split(',').map(function(s: string) { return s.trim(); }).filter(Boolean) } });
    } else if (name.startsWith('educationalContent.')) {
      const parts = name.split('.');
      const level = parts[1];
      const levelKey = level as 'beginner' | 'intermediate' | 'advanced';
      if (parts[2] === 'concepts' && parts.length === 5) {
        const idx = parseInt(parts[3], 10);
        const field = parts[4];
        setEditProject(prev => {
          if (!prev) return prev;
          const concepts = Array.isArray(prev.educationalContent[levelKey].concepts) ? [...prev.educationalContent[levelKey].concepts] : [];
          if (field === 'images' || field === 'videos' || field === 'diagrams') {
            concepts[idx] = {
              ...concepts[idx],
              [field]: (typeof value === 'string') ? value.split(',').map(function(s: string) { return s.trim(); }).filter(function(s: string) { return s.length > 0; }) : []
            };
          } else if (field === 'description') {
            // Always store as ConceptBlock[]
            let descArr: any[] = [];
            if (typeof value === 'string') {
              // Try to parse as JSON array, else treat as text
              try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                  descArr = parsed.map((block: any) => {
                    if (typeof block === 'string') return { type: 'text', content: block };
                    if (block && typeof block === 'object' && typeof block.type === 'string') {
                      if (["text","image","diagram","video"].includes(block.type)) return block;
                    }
                    return { type: 'text', content: '' };
                  });
                } else {
                  descArr = [{ type: 'text', content: value }];
                }
              } catch {
                descArr = [{ type: 'text', content: value }];
              }
            } else if (Array.isArray(value)) {
              descArr = (value as any[]).map((v: any) => (typeof v === 'string' ? { type: 'text', content: v } : v));
            } else {
              descArr = [{ type: 'text', content: '' }];
            }
            concepts[idx] = {
              ...concepts[idx],
              description: descArr
            };
          } else {
            concepts[idx] = {
              ...concepts[idx],
              [field]: value
            };
          }
          return {
            ...prev,
            educationalContent: {
              ...prev.educationalContent,
              [levelKey]: {
                ...prev.educationalContent[levelKey],
                concepts
              }
            }
          } as typeof prev;
        });
      } else if (parts[2] === 'resources') {
        setEditResourceStrings(prev => ({ ...prev, [levelKey]: value }));
      } else if (parts[2] === 'quizzes') {
        setEditQuizStrings(prev => ({ ...prev, [levelKey]: value }));
      } else if (parts[2] === 'prerequisites') {
        setEditPrereqStrings(prev => ({ ...prev, [levelKey]: value }));
      } else {
        // Handle other educationalContent fields
        const field = parts[2];
        setEditProject({
          ...editProject,
          educationalContent: {
            ...editProject.educationalContent,
            [levelKey]: {
              ...editProject.educationalContent[levelKey],
              [field]: value,
            },
          },
        });
      }
    } else {
      setEditProject({ ...editProject, [name]: value });
    }
  };

  // Upload a file for a concept block (image/diagram/video). Uses /api/uploads which returns a public fileUrl.
  const handleConceptBlockFileUpload = async (file: File | null, levelKey: Level, conceptIdx: number, blockIdx: number, blockType: string) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const fileUrl = res.data?.data?.fileUrl || res.data?.fileUrl;
      if (fileUrl) {
        setEditProject(prev => {
          if (!prev) return prev;
          const concepts = Array.isArray(prev.educationalContent[levelKey].concepts) ? [...prev.educationalContent[levelKey].concepts] : [];
          const desc = Array.isArray(concepts[conceptIdx]?.description) ? [...concepts[conceptIdx].description] : [];
          desc[blockIdx] = { type: blockType as 'image' | 'video' | 'diagram', url: fileUrl };
          concepts[conceptIdx] = { ...concepts[conceptIdx], description: desc };
          return {
            ...prev,
            educationalContent: {
              ...prev.educationalContent,
              [levelKey]: {
                ...prev.educationalContent[levelKey],
                concepts
              }
            }
          } as typeof prev;
        });
      }
    } catch (err) {
      console.error('Concept image upload failed', err);
      alert('Failed to upload image');
    }
  };

  const handleSaveEdit = async () => {
    setMessage(null);
    setError(null);
    if (editIndex === null || !editProject) return;
    try {
      const projectId = editProject._id || editProject.id;
      if (!projectId) throw new Error('Project ID missing');
      // Ensure resources and prerequisites are parsed and included in the payload
      const parsedEditResourceStrings = { ...editResourceStrings };
      levels.forEach(level => {
        if (!parsedEditResourceStrings[level]) parsedEditResourceStrings[level] = '';
        // Sync prerequisites from editPrereqStrings to editProject before saving
        if (editProject && editProject.educationalContent[level]) {
          editProject.educationalContent[level].prerequisites = editPrereqStrings[level]
            ? editPrereqStrings[level].split(',').map(s => s.trim()).filter(s => s.length > 0)
            : [];
        }
      });
      const payload = buildProjectPayload(editProject as Project, parsedEditResourceStrings, editQuizStrings, editPrereqStrings);
      console.log('DEBUG: Prerequisites sent (edit):', {
        beginner: payload.educationalContent.beginner.prerequisites,
        intermediate: payload.educationalContent.intermediate.prerequisites,
        advanced: payload.educationalContent.advanced.prerequisites
      });
      console.log('DEBUG: Payload sent to backend (edit):', JSON.stringify(payload, null, 2));
      const res = await api.put(`/projects/${projectId}`, payload);
      if (res.data && res.data.data && res.data.data.educationalContent) {
        console.log('DEBUG: Prerequisites received (edit):', {
          beginner: res.data.data.educationalContent.beginner.prerequisites,
          intermediate: res.data.data.educationalContent.intermediate.prerequisites,
          advanced: res.data.data.educationalContent.advanced.prerequisites
        });
      }
      console.log('DEBUG: Response from backend (edit):', JSON.stringify(res.data, null, 2));
      if (res.data && res.data.success && res.data.data) {
        setMessage('Project updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        if (onEditProject) onEditProject(res.data.data);
        // Only reset edit form after new project is reflected in parent state
        setTimeout(() => {
          setEditIndex(null);
          setEditProject(null);
        }, 500);
      } else {
        setError('Failed to save project changes to backend.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (err: any) {
      // Extract detailed error messages from API response
      let errorMessage = 'Failed to save project changes to backend.';
      
      if (err.response?.data) {
        const data = err.response.data;
        // Check for validation errors first
        if (data.details && typeof data.details === 'object') {
          const errors = Object.entries(data.details)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errors}`;
        } else if (data.validation && typeof data.validation === 'object') {
          const errors = Object.entries(data.validation)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMessage = `Validation errors:\n${errors}`;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditProject(null);
  };
  const handleDelete = (idx: number) => {
    if (onDeleteProject) {
      const id = projects[idx]._id || projects[idx].id;
      onDeleteProject(id);
    }
  };

  // Track the last-focused textarea or input
  const lastFocusedRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  // Handler to set last focused
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    lastFocusedRef.current = e.target;
  }, []);

    const normalizedProjects = (projects || []).map(p => {
      let ec = p.educationalContent as any;
      // If educationalContent was stored as a JSON string, try to parse it
      if (typeof ec === 'string') {
        try { ec = JSON.parse(ec); } catch { ec = null; }
      }
      return ({
        ...p,
        educationalContent: {
          ...emptyProject.educationalContent,
          ...(ec || {})
        }
      });
    });

    // Safe accessor for educational content levels. Handles missing, stringified or malformed educationalContent.
    const getEC = (obj: Project | undefined | null, level: Level) => {
      if (!obj) return emptyProject.educationalContent[level];
      let ec = obj.educationalContent as any;
      if (typeof ec === 'string') {
        try { ec = JSON.parse(ec); } catch { ec = null; }
      }
      if (!ec || typeof ec !== 'object') return emptyProject.educationalContent[level];
      const lvl = ec[level];
      if (!lvl || typeof lvl !== 'object') return emptyProject.educationalContent[level];
  return lvl as any;
    };

    return (
      <>
        {/* Fixed Markdown Help and Toolbar at the very top, just under the header */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 1200, background: '#f8f9fa', pb: 2, pt: 2, mb: 2, borderBottom: '1px solid #eee' }}>
          <Accordion defaultExpanded sx={{ maxWidth: 1200, margin: '0 auto', mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Formatting Help: Markdown Examples
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" sx={{ mb: 1 }}>
                You can use the following formatting in concept descriptions:
              </Typography>
              <Box sx={{ background: 'var(--card)', borderRadius: 2, p: 2, fontFamily: 'monospace', fontSize: 14 }}>
                <div><b>Heading:</b> <code>## My Heading</code></div>
                <div><b>Bold:</b> <code>**bold text**</code></div>
                <div><b>Italic:</b> <code>*italic text*</code></div>
                <div><b>Underline:</b> <span dangerouslySetInnerHTML={{__html: '&lt;u&gt;underlined text&lt;/u&gt;'}} /> <span style={{color:'#888'}}>(HTML only)</span></div>
                <div><b>Strikethrough:</b> <code>~~strikethrough~~</code></div>
                <div><b>Subscript:</b> <span dangerouslySetInnerHTML={{__html: 'H&lt;sub&gt;2&lt;/sub&gt;O'}} /> <span style={{color:'#888'}}>(HTML only)</span></div>
                <div><b>Superscript:</b> <span dangerouslySetInnerHTML={{__html: 'X&lt;sup&gt;2&lt;/sup&gt;'}} /> <span style={{color:'#888'}}>(HTML only)</span></div>
                <div><b>Font Color:</b> <span dangerouslySetInnerHTML={{__html: '&lt;span style="color:red"&gt;Red text&lt;/span&gt;'}} /> <span style={{color:'#888'}}>(HTML only)</span></div>
                <div><b>Font Size:</b> <span dangerouslySetInnerHTML={{__html: '&lt;span style="font-size:20px"&gt;Large text&lt;/span&gt;'}} /> <span style={{color:'#888'}}>(HTML only)</span></div>
                <div><b>Paragraph break:</b> <code>Line 1\n\nLine 2</code></div>
                <div><b>List:</b> <code>- item 1\n- item 2</code></div>
                <div><b>Numbered List:</b> <code>1. First\n2. Second</code></div>
                <div><b>Blockquote:</b> <code>&gt; quoted text</code></div>
                <div><b>Code:</b> <code>`inline code`</code></div>
                <div><b>Code Block:</b> <code>```js\ncode here\n```</code></div>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Example:
              </Typography>
              <Box sx={{ background: 'var(--card)', borderRadius: 2, p: 2, fontFamily: 'monospace', fontSize: 14 }}>
                <div>## Introduction to Biomarkers</div>
                <div></div>
                <div>A **biomarker** (biological marker) is a measurable indicator of a biological state or condition.</div>
                <div></div>
                <div>**Types of Biomarkers:**</div>
                <div>- **Diagnostic biomarkers** → detect or confirm the presence of a disease.</div>
                <div>- **Prognostic biomarkers** → predict the course or outcome of a disease.</div>
                <div>- **Predictive biomarkers** → forecast response to a specific treatment.</div>
                <div>- **Monitoring biomarkers** → track the progress of disease or therapy.</div>
                <div></div>
                <div>**Examples:**</div>
                <div>Blood glucose (for diabetes), PSA (Prostate-Specific Antigen for prostate cancer), Troponin (for heart attack), and genetic mutations like BRCA1/2 (for breast cancer risk).</div>
                <div></div>
                <div>**Applications:**</div>
                <div>Biomarkers are widely used in **medicine, drug development, personalized therapy, and clinical research**. They help in **early disease detection, risk assessment, treatment selection, and monitoring patient responses**.</div>
                <div></div>
                <div><span dangerouslySetInnerHTML={{__html: '&lt;u&gt;Underline&lt;/u&gt;'}} /> ~~strikethrough~~ H<sub>2</sub>O X<sup>2</sup> <span style={{color:'blue'}}>Blue text</span> <span style={{fontSize:'18px'}}>Big text</span></div>
                <div>&gt; Blockquote</div>
                <div>`inline code`</div>
                <div><span>{'```js'}</span></div>
                <div>console.log('Code block');</div>
                <div>{'```'}</div>
              </Box>
            </AccordionDetails>
          </Accordion>
          <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
            <MarkdownToolbar getTarget={() => lastFocusedRef.current} handleAddChange={handleAddChange} />
          </Box>
        </Box>
        <Snackbar
          open={snackbarOpen && (!!message || !!error)}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarSeverity === 'success' ? message : error}
          </Alert>
        </Snackbar>
        <Box className={styles.container}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Project Details (Admin)</Typography>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddNewProject}
              sx={{ mb: 2, fontWeight: 600, fontSize: 18, borderRadius: 2, boxShadow: 2 }}
            >
              Add New Project
            </Button>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Add New Project</Typography>
            <Divider sx={{ mb: 2 }} />
  {/* Markdown Toolbar for Concept Description */}
  {/* Only show for concept description input, so we need a ref to the textarea */}
  <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField label="Project UUID" name="id" value={newProject.id || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" placeholder="Paste Project UUID here" sx={{ mb: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              label="Project Title" 
              name="title" 
              value={newProject.title || ''} 
              onChange={handleAddChange} 
              onFocus={handleFocus} 
              fullWidth 
              size="small" 
              variant="outlined"
              inputProps={{ maxLength: PROJECT_CONSTRAINTS.title.maxLength }}
              helperText={`${(newProject.title || '').length}/${PROJECT_CONSTRAINTS.title.maxLength} characters`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField 
              label="Subtitle" 
              name="subtitle" 
              value={newProject.subtitle || ''} 
              onChange={handleAddChange} 
              onFocus={handleFocus} 
              fullWidth 
              size="small" 
              variant="outlined"
              inputProps={{ maxLength: PROJECT_CONSTRAINTS.subtitle.maxLength }}
              helperText={`${(newProject.subtitle || '').length}/${PROJECT_CONSTRAINTS.subtitle.maxLength} characters`}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Category" name="category" value={newProject.category || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" helperText="Select or enter category" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Image URL" name="image" value={newProject.image || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Technologies (comma separated)" name="technologies" value={Array.isArray(newProject.technologies) ? newProject.technologies.join(', ') : ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" helperText={`Up to ${PROJECT_CONSTRAINTS.technologies.maxItems} technologies`} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Tags (comma separated)" name="tags" value={Array.isArray(newProject.tags) ? newProject.tags.join(', ') : ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" helperText={`Up to ${PROJECT_CONSTRAINTS.tags.maxItems} tags`} />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Switch checked={!!newProject.featured} onChange={handleAddChange} name="featured" color="primary" />} label="Featured" sx={{ mt: 1 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Created At (ISO)" name="createdAt" value={newProject.createdAt || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#d32f2f' }}>Required Fields:</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <TextField 
              label="Short Description"
              name="description" 
              value={newProject.description || ''} 
              onChange={handleAddChange} 
              onFocus={handleFocus}
              multiline
              minRows={2}
              fullWidth 
              variant="outlined"
              inputProps={{ maxLength: PROJECT_CONSTRAINTS.description.maxLength }}
              helperText={`${(newProject.description || '').length}/${PROJECT_CONSTRAINTS.description.maxLength} characters - Appears in project lists`}
              error={(newProject.description || '').length > PROJECT_CONSTRAINTS.description.maxLength}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField 
              label="Detailed Description"
              name="detailedDescription" 
              value={newProject.detailedDescription || ''} 
              onChange={handleAddChange} 
              onFocus={handleFocus}
              multiline
              minRows={3}
              fullWidth 
              variant="outlined"
              inputProps={{ maxLength: PROJECT_CONSTRAINTS.detailedDescription.maxLength }}
              helperText={`${(newProject.detailedDescription || '').length}/${PROJECT_CONSTRAINTS.detailedDescription.maxLength} characters - Full project details`}
              error={(newProject.detailedDescription || '').length > PROJECT_CONSTRAINTS.detailedDescription.maxLength}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Beginner Concepts</Typography>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Concept Description (Markdown supported)"
            name={`educationalContent.beginner.concepts.0.description`}
            inputRef={beginnerDescRef}
            multiline
            minRows={3}
            fullWidth
            value={
              newProject.educationalContent?.beginner?.concepts?.[0]?.description?.map((b: any) => b.content).join('\n') || ''
            }
            onChange={handleAddChange}
            onFocus={handleFocus}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Links</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField label="GitHub URL" name="links.github" value={newProject.links?.github || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Demo URL" name="links.demo" value={newProject.links?.demo || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField label="Documentation URL" name="links.documentation" value={newProject.links?.documentation || ''} onChange={handleAddChange} onFocus={handleFocus} fullWidth size="small" variant="outlined" />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Media</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField label="Images (comma separated)" name="media.images" value={Array.isArray(newProject.media?.images) ? (newProject.media?.images ?? []).join(', ') : ''} onChange={handleAddChange} fullWidth size="small" variant="outlined" onFocus={handleFocus} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Videos (comma separated)" name="media.videos" value={Array.isArray(newProject.media?.videos) ? (newProject.media?.videos ?? []).join(', ') : ''} onChange={handleAddChange} fullWidth size="small" variant="outlined" onFocus={handleFocus} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Diagrams (comma separated)" name="media.diagrams" value={Array.isArray(newProject.media?.diagrams) ? (newProject.media?.diagrams ?? []).join(', ') : ''} onChange={handleAddChange} fullWidth size="small" variant="outlined" onFocus={handleFocus} />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Code Snippets (comma separated)" name="media.codeSnippets" value={Array.isArray(newProject.media?.codeSnippets) ? (newProject.media?.codeSnippets ?? []).join(', ') : ''} onChange={handleAddChange} fullWidth size="small" variant="outlined" onFocus={handleFocus} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Educational Content</Typography>
        {/* Collapsible panels for each level */}
        {levels.map((level: Level) => (
          <Paper key={level} elevation={1} sx={{ mb: 2, borderRadius: 2, p: 2, background: 'var(--card)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'capitalize', flex: 1 }}>{level} Overview</Typography>
            </Box>
            <TextField label={`${level.charAt(0).toUpperCase() + level.slice(1)} Overview`} name={`educationalContent.${level}.overview`} value={newProject.educationalContent[level].overview} onChange={handleAddChange} fullWidth size="small" variant="outlined" sx={{ mb: 1 }} onFocus={handleFocus} multiline minRows={2} />
            <TextField
              label="Prerequisites (comma separated)"
              name={`educationalContent.${level}.prerequisites`}
              value={prereqStrings[level]}
              onChange={e => {
                const value = e.target.value;
                setPrereqStrings(prev => ({ ...prev, [level]: value }));
              }}
              fullWidth
              size="small"
              variant="outlined"
              sx={{ mb: 1 }}
              onFocus={handleFocus}
            />
            <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>Concepts</Typography>
            {(Array.isArray(newProject.educationalContent[level].concepts) ? newProject.educationalContent[level].concepts : []).map((c: any, i: number) => (
              <Paper key={i} elevation={0} sx={{ p: 1, mb: 1, background: 'var(--surface)', border: '1px solid var(--sidebar-border)', borderRadius: 1 }}>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Concept Title"
                      name={`educationalContent.${level}.concepts.${i}.title`}
                      value={c.title || ''}
                      fullWidth
                      size="small"
                      variant="outlined"
                      onFocus={handleFocus}
                      onChange={handleAddChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Concept Description"
                      name={`educationalContent.${level}.concepts.${i}.description`}
                      value={(() => {
                        if (Array.isArray(c.description)) {
                          return c.description.map((b: import('../../types/Project').ConceptBlock) => b.type === 'text' ? b.content : '').join('\n');
                        } else if (typeof c.description === 'string') {
                          return c.description;
                        } else {
                          return '';
                        }
                      })()}
                      fullWidth
                      size="small"
                      variant="outlined"
                      multiline
                      minRows={2}
                      onFocus={handleFocus}
                      onChange={handleAddChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Images (comma separated URLs)" value={Array.isArray(c.images) ? c.images.join(', ') : ''} fullWidth size="small" variant="outlined"
                      onChange={e => {
                        const value = e.target.value;
                        setNewProject(prev => {
                          const concepts = [...prev.educationalContent[level].concepts];
                          concepts[i] = { ...concepts[i], images: value.split(',').map(s => s.trim()).filter(s => s.length > 0) };
                          return {
                            ...prev,
                            educationalContent: {
                              ...prev.educationalContent,
                              [level]: {
                                ...prev.educationalContent[level],
                                concepts
                              }
                            }
                          };
                        });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Videos (comma separated URLs)" value={Array.isArray(c.videos) ? c.videos.join(', ') : ''} fullWidth size="small" variant="outlined"
                      onChange={e => {
                        const value = e.target.value;
                        setNewProject(prev => {
                          const concepts = [...prev.educationalContent[level].concepts];
                          concepts[i] = { ...concepts[i], videos: value.split(',').map(s => s.trim()).filter(s => s.length > 0) };
                          return {
                            ...prev,
                            educationalContent: {
                              ...prev.educationalContent,
                              [level]: {
                                ...prev.educationalContent[level],
                                concepts
                              }
                            }
                          };
                        });
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField label="Diagrams (comma separated URLs)" value={Array.isArray(c.diagrams) ? c.diagrams.join(', ') : ''} fullWidth size="small" variant="outlined"
                      onChange={e => {
                        const value = e.target.value;
                        setNewProject(prev => {
                          const concepts = [...prev.educationalContent[level].concepts];
                          concepts[i] = { ...concepts[i], diagrams: value.split(',').map(s => s.trim()).filter(s => s.length > 0) };
                          return {
                            ...prev,
                            educationalContent: {
                              ...prev.educationalContent,
                              [level]: {
                                ...prev.educationalContent[level],
                                concepts
                              }
                            }
                          };
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
            <Button variant="outlined" size="small" onClick={() => {
              setNewProject({
                ...newProject,
                educationalContent: {
                  ...newProject.educationalContent,
                  [level]: {
                    ...newProject.educationalContent[level],
                    concepts: [
                      ...newProject.educationalContent[level].concepts,
                      { title: '', description: [], images: [], videos: [], diagrams: [] }
                    ]
                  }
                }
              });
            }} sx={{ mb: 1 }}>Add Concept</Button>
            <TextField label="Resources (format: title::url::type, one per line)" name={`educationalContent.${level}.resources`} value={resourceStrings[level]} onChange={handleAddChange} fullWidth size="small" variant="outlined" multiline minRows={2} sx={{ mb: 1 }} />
            <TextField label="Quizzes (format: question||option1||option2||...||answerIndex||explanation1||explanation2..., one per line)" name={`educationalContent.${level}.quizzes`} value={quizStrings[level]} onChange={handleAddChange} fullWidth size="small" variant="outlined" multiline minRows={2} />
            {/* Interactive quiz editor (adds structured quizzes while preserving textarea fallback) */}
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Structured Quizzes (optional)</Typography>
              <Button variant="outlined" size="small" sx={{ mt: 1, mb: 1 }} onClick={() => addQuizToNew(level)}>Add Quiz (structured)</Button>
              {(Array.isArray(newProject.educationalContent[level].quizzes) ? newProject.educationalContent[level].quizzes : []).map((q: any, qi: number) => (
                <Paper key={qi} elevation={0} sx={{ p: 1, mb: 1, background: 'var(--surface)', border: '1px solid var(--sidebar-border)' }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <TextField label="Question" value={q.question || ''} fullWidth size="small" onChange={e => updateNewQuiz(level, qi, prev => ({ ...prev, question: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField label="Answer Index" type="number" value={typeof q.answer === 'number' ? q.answer : 0} onChange={e => updateNewQuiz(level, qi, prev => ({ ...prev, answer: parseInt(e.target.value || '0', 10) }))} fullWidth size="small" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Options</Typography>
                      {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                        <Box key={oi} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                          <TextField value={opt || ''} fullWidth size="small" onChange={e => updateNewQuiz(level, qi, prev => {
                            const opts = Array.isArray(prev.options) ? [...prev.options] : [];
                            opts[oi] = e.target.value;
                            return { ...prev, options: opts };
                          })} />
                          <Button size="small" variant="outlined" color="error" onClick={() => updateNewQuiz(level, qi, prev => {
                            const opts = Array.isArray(prev.options) ? [...prev.options] : [];
                            opts.splice(oi, 1);
                            return { ...prev, options: opts };
                          })}>Remove</Button>
                        </Box>
                      ))}
                      <Button size="small" variant="outlined" onClick={() => updateNewQuiz(level, qi, prev => ({ ...prev, options: Array.isArray(prev.options) ? [...prev.options, ''] : [''] }))}>Add Option</Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>Explanations</Typography>
                      {(Array.isArray(q.explanations) ? q.explanations : []).map((exp: string, ei: number) => (
                        <Box key={ei} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                          <TextField value={exp || ''} fullWidth size="small" onChange={e => updateNewQuiz(level, qi, prev => {
                            const exps = Array.isArray(prev.explanations) ? [...prev.explanations] : [];
                            exps[ei] = e.target.value;
                            return { ...prev, explanations: exps };
                          })} />
                          <Button size="small" variant="outlined" color="error" onClick={() => updateNewQuiz(level, qi, prev => {
                            const exps = Array.isArray(prev.explanations) ? [...prev.explanations] : [];
                            exps.splice(ei, 1);
                            return { ...prev, explanations: exps };
                          })}>Remove</Button>
                        </Box>
                      ))}
                      <Button size="small" variant="outlined" onClick={() => updateNewQuiz(level, qi, prev => ({ ...prev, explanations: Array.isArray(prev.explanations) ? [...prev.explanations, ''] : [''] }))}>Add Explanation</Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="outlined" color="error" onClick={() => removeNewQuiz(level, qi)}>Remove Quiz</Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>
          </Paper>
        ))}
        <Button onClick={handleAdd} variant="contained" color="success" sx={{ mt: 2, fontWeight: 700, fontSize: 18, borderRadius: 2, boxShadow: 2 }}>Add Project</Button>
      </Paper>
      <div>
  {normalizedProjects.map((project, idx) => (
          <div key={project.id || idx} className={styles.projectCard}>
            {/* Only show Project UUID once, clearly labeled */}
            <Paper elevation={2} sx={{ p: 3, mb: 2, borderRadius: 2, background: '#f9fbfd' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--primary)', mb: 1 }}>Project UUID</Typography>
              <TextField value={project._id || project.id || ''} fullWidth disabled margin="dense" sx={{ mb: 2 }} />
              {editIndex === idx && editProject && (
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Project Title" name="title" value={editProject.title || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Subtitle" name="subtitle" value={editProject.subtitle || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Category" name="category" value={editProject.category || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Image URL" name="image" value={editProject.image || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Technologies (comma separated)" name="technologies" value={Array.isArray(editProject.technologies) ? editProject.technologies.join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Tags (comma separated)" name="tags" value={Array.isArray(editProject.tags) ? editProject.tags.join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <FormControlLabel control={<Switch checked={!!editProject.featured} onChange={handleEditChange} name="featured" />} label="Featured" />
                  <TextField label="Created At (ISO)" name="createdAt" value={editProject.createdAt || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--primary)', mb: 1 }}>Links</Typography>
                  <TextField label="GitHub URL" name="links.github" value={editProject.links?.github || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Demo URL" name="links.demo" value={editProject.links?.demo || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Documentation URL" name="links.documentation" value={editProject.links?.documentation || ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--primary)', mb: 1 }}>Media</Typography>
                  <TextField label="Images (comma separated)" name="media.images" value={Array.isArray(editProject.media?.images) ? (editProject.media?.images ?? []).join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Videos (comma separated)" name="media.videos" value={Array.isArray(editProject.media?.videos) ? (editProject.media?.videos ?? []).join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Diagrams (comma separated)" name="media.diagrams" value={Array.isArray(editProject.media?.diagrams) ? (editProject.media?.diagrams ?? []).join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <TextField label="Code Snippets (comma separated)" name="media.codeSnippets" value={Array.isArray(editProject.media?.codeSnippets) ? (editProject.media?.codeSnippets ?? []).join(', ') : ''} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--primary)', mb: 1 }}>Educational Content</Typography>
                  {levels.map((level: Level) => (
                    <Paper key={level} elevation={1} sx={{ mb: 2, p: 2, borderRadius: 2, background: 'var(--card)' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, textTransform: 'capitalize', mb: 1 }}>{level} Overview</Typography>
                      <TextField label={`${level.charAt(0).toUpperCase() + level.slice(1)} Overview`} name={`educationalContent.${level}.overview`} value={getEditLevel(level).overview} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" multiline minRows={2} />
                      <TextField
                        label="Prerequisites (comma separated)"
                        name={`educationalContent.${level}.prerequisites`}
                        value={editPrereqStrings[level]}
                        onChange={e => {
                          const value = e.target.value;
                          setEditPrereqStrings(prev => ({ ...prev, [level]: value }));
                        }}
                        fullWidth
                        margin="dense"
                      />
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Concepts</Typography>
                        {Array.isArray(getEditLevel(level).concepts) && getEditLevel(level).concepts.map((concept: any, i: number) => (
                          <Paper key={i} elevation={0} sx={{ mb: 1, p: 1, borderRadius: 1, background: 'var(--surface)' }}>
                            <TextField label="Title" name={`educationalContent.${level}.concepts.${i}.title`} value={concept.title} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" />
                            {/* Block-based editor for concept.description (ConceptBlock[]) */}
                            <Box sx={{ mt: 1, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 500, mb: 1 }}>Concept Content Blocks</Typography>
                              {Array.isArray(concept.description) && concept.description.map((block: any, bIdx: number) => (
                                <Box key={bIdx} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                  {block.type === 'text' && (
                                    <TextField
                                      label={`Text Block`}
                                      value={block.content || ''}
                                      onChange={e => {
                                        const value = e.target.value;
                                        setEditProject(prev => {
                                          if (!prev) return prev;
                                          const concepts = Array.isArray((prev.educationalContent && (prev.educationalContent as any)[level] && prev.educationalContent[level].concepts) ? prev.educationalContent[level].concepts : []) ? [...(prev.educationalContent[level].concepts || [])] : [];
                                          const desc = Array.isArray(concepts[i]?.description) ? [...concepts[i].description] : [];
                                          desc[bIdx] = { type: 'text', content: value };
                                          concepts[i] = { ...concepts[i], description: desc };
                                          return {
                                            ...prev,
                                            educationalContent: {
                                              ...prev.educationalContent,
                                              [level]: {
                                                ...prev.educationalContent[level],
                                                concepts
                                              }
                                            }
                                          };
                                        });
                                      }}
                                      onFocus={handleFocus}
                                      fullWidth
                                      margin="dense"
                                      multiline
                                      minRows={2}
                                    />
                                  )}
                                  {(block.type === 'image' || block.type === 'diagram' || block.type === 'video') && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                      <TextField
                                        label={`${block.type.charAt(0).toUpperCase() + block.type.slice(1)} URL`}
                                        value={block.url || ''}
                                        onChange={e => {
                                          const value = e.target.value;
                                          setEditProject(prev => {
                                            if (!prev) return prev;
                                            const concepts = Array.isArray(prev.educationalContent[level].concepts) ? [...prev.educationalContent[level].concepts] : [];
                                            const desc = Array.isArray(concepts[i]?.description) ? [...concepts[i].description] : [];
                                            desc[bIdx] = { type: block.type, url: value };
                                            concepts[i] = { ...concepts[i], description: desc };
                                            return {
                                              ...prev,
                                              educationalContent: {
                                                ...prev.educationalContent,
                                                [level]: {
                                                  ...prev.educationalContent[level],
                                                  concepts
                                                }
                                              }
                                            };
                                          });
                                        }}
                                        onFocus={handleFocus}
                                        fullWidth
                                        margin="dense"
                                      />
                                      {/* File upload input for image/diagram/video */}
                                      <input
                                        type="file"
                                        accept={block.type === 'image' || block.type === 'diagram' ? 'image/*' : 'video/*'}
                                        onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            handleConceptBlockFileUpload(file, level, i, bIdx, block.type);
                                          }
                                        }}
                                        style={{ display: 'none' }}
                                        id={`upload-${level}-${i}-${bIdx}`}
                                      />
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => document.getElementById(`upload-${level}-${i}-${bIdx}`)?.click()}
                                      >
                                        Upload
                                      </Button>
                                      {/* Preview for image/diagram/video */}
                                      {block.type === 'image' || block.type === 'diagram' ? (
                                        <img src={normalizeImageUrl(block.url) || block.url} alt={block.type} style={{ maxWidth: 60, maxHeight: 40, borderRadius: 4, marginLeft: 8 }} />
                                      ) : block.type === 'video' ? (
                                        <video src={block.url} controls style={{ maxWidth: 60, maxHeight: 40, borderRadius: 4, marginLeft: 8 }} />
                                      ) : null}
                                    </Box>
                                  )}
                                  {/* Remove block button */}
                                  <Button variant="outlined" color="error" size="small" onClick={() => {
                                    setEditProject(prev => {
                                      if (!prev) return prev;
                                      const concepts = [...prev.educationalContent[level].concepts];
                                      const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                      desc.splice(bIdx, 1);
                                      concepts[i] = { ...concepts[i], description: desc };
                                      return {
                                        ...prev,
                                        educationalContent: {
                                          ...prev.educationalContent,
                                          [level]: {
                                            ...prev.educationalContent[level],
                                            concepts
                                          }
                                        }
                                      };
                                    });
                                  }}>Remove</Button>
                                  {/* Move up/down buttons */}
                                  <Button variant="outlined" size="small" disabled={bIdx === 0} onClick={() => {
                                    setEditProject(prev => {
                                      if (!prev) return prev;
                                      const concepts = [...prev.educationalContent[level].concepts];
                                      const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                      if (bIdx > 0) {
                                        [desc[bIdx - 1], desc[bIdx]] = [desc[bIdx], desc[bIdx - 1]];
                                      }
                                      concepts[i] = { ...concepts[i], description: desc };
                                      return {
                                        ...prev,
                                        educationalContent: {
                                          ...prev.educationalContent,
                                          [level]: {
                                            ...prev.educationalContent[level],
                                            concepts
                                          }
                                        }
                                      };
                                    });
                                  }}>Up</Button>
                                  <Button variant="outlined" size="small" disabled={bIdx === concept.description.length - 1} onClick={() => {
                                    setEditProject(prev => {
                                      if (!prev) return prev;
                                      const concepts = [...prev.educationalContent[level].concepts];
                                      const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                      if (bIdx < desc.length - 1) {
                                        [desc[bIdx + 1], desc[bIdx]] = [desc[bIdx], desc[bIdx + 1]];
                                      }
                                      concepts[i] = { ...concepts[i], description: desc };
                                      return {
                                        ...prev,
                                        educationalContent: {
                                          ...prev.educationalContent,
                                          [level]: {
                                            ...prev.educationalContent[level],
                                            concepts
                                          }
                                        }
                                      };
                                    });
                                  }}>Down</Button>
                                </Box>
                              ))}
                              {/* Add new block buttons */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Button variant="outlined" size="small" onClick={() => {
                                  setEditProject(prev => {
                                    if (!prev) return prev;
                                    const concepts = [...prev.educationalContent[level].concepts];
                                    const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                    desc.push({ type: 'text', content: '' });
                                    concepts[i] = { ...concepts[i], description: desc };
                                    return {
                                      ...prev,
                                      educationalContent: {
                                        ...prev.educationalContent,
                                        [level]: {
                                          ...prev.educationalContent[level],
                                          concepts
                                        }
                                      }
                                    };
                                  });
                                }}>Add Text</Button>
                                <Button variant="outlined" size="small" onClick={() => {
                                  setEditProject(prev => {
                                    if (!prev) return prev;
                                    const concepts = [...prev.educationalContent[level].concepts];
                                    const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                    desc.push({ type: 'image', url: '' });
                                    concepts[i] = { ...concepts[i], description: desc };
                                    return {
                                      ...prev,
                                      educationalContent: {
                                        ...prev.educationalContent,
                                        [level]: {
                                          ...prev.educationalContent[level],
                                          concepts
                                        }
                                      }
                                    };
                                  });
                                }}>Add Image</Button>
                                <Button variant="outlined" size="small" onClick={() => {
                                  setEditProject(prev => {
                                    if (!prev) return prev;
                                    const concepts = [...prev.educationalContent[level].concepts];
                                    const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                    desc.push({ type: 'diagram', url: '' });
                                    concepts[i] = { ...concepts[i], description: desc };
                                    return {
                                      ...prev,
                                      educationalContent: {
                                        ...prev.educationalContent,
                                        [level]: {
                                          ...prev.educationalContent[level],
                                          concepts
                                        }
                                      }
                                    };
                                  });
                                }}>Add Diagram</Button>
                                <Button variant="outlined" size="small" onClick={() => {
                                  setEditProject(prev => {
                                    if (!prev) return prev;
                                    const prevLvl = (prev.educationalContent && (prev.educationalContent as any)[level]) ? (prev.educationalContent as any)[level] : emptyProject.educationalContent[level];
                                    const concepts = Array.isArray(prevLvl.concepts) ? [...prevLvl.concepts] : [];
                                    const desc = Array.isArray(concepts[i].description) ? [...concepts[i].description] : [];
                                    desc.push({ type: 'video', url: '' });
                                    concepts[i] = { ...concepts[i], description: desc };
                                    return {
                                      ...prev,
                                      educationalContent: {
                                        ...prev.educationalContent,
                                        [level]: {
                                          ...(prev.educationalContent?.[level] || emptyProject.educationalContent[level]),
                                          concepts
                                        }
                                      }
                                    };
                                  });
                                }}>Add Video</Button>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                        <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={() => {
                          setEditProject(prev => {
                            if (!prev) return prev;
                            const lvlPrev = (prev.educationalContent && (prev.educationalContent as any)[level]) ? (prev.educationalContent as any)[level] : emptyProject.educationalContent[level];
                            const concepts = Array.isArray(lvlPrev.concepts) ? [...lvlPrev.concepts] : [];
                            concepts.push({ title: '', description: [], images: [], videos: [], diagrams: [] });
                            return {
                              ...prev,
                              educationalContent: {
                                ...prev.educationalContent,
                                [level]: {
                                  ...(prev.educationalContent?.[level] || emptyProject.educationalContent[level]),
                                  concepts
                                }
                              }
                            };
                          });
                        }}>Add Concept</Button>
                      </Box>
                      {/* Resources field */}
                      <TextField label="Resources (format: title::url::type, one per line)" name={`educationalContent.${level}.resources`} value={editResourceStrings[level]} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" multiline minRows={2} sx={{ mb: 1 }} />
                      {/* Quizzes field */}
                      <TextField label="Quizzes (format: question||option1||option2||...||answerIndex||explanation1||explanation2..., one per line)" name={`educationalContent.${level}.quizzes`} value={editQuizStrings[level]} onChange={handleEditChange} onFocus={handleFocus} fullWidth margin="dense" multiline minRows={2} />
                      {/* Interactive quiz editor for edit form (preserves textarea fallback) */}
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Structured Quizzes (optional)</Typography>
                        <Button variant="outlined" size="small" sx={{ mt: 1, mb: 1 }} onClick={() => addQuizToEdit(level)}>Add Quiz (structured)</Button>
                        {(editProject && Array.isArray(getEditLevel(level).quizzes) ? getEditLevel(level).quizzes : []).map((q: any, qi: number) => (
                          <Paper key={qi} elevation={0} sx={{ p: 1, mb: 1, background: '#fff', border: '1px solid #eee' }}>
                            <Grid container spacing={1} alignItems="center">
                              <Grid item xs={12} md={8}>
                                <TextField label="Question" value={q.question || ''} fullWidth size="small" onChange={e => updateEditQuiz(level, qi, prev => ({ ...prev, question: e.target.value }))} />
                              </Grid>
                              <Grid item xs={12} md={4}>
                                <TextField label="Answer Index" type="number" value={typeof q.answer === 'number' ? q.answer : 0} onChange={e => updateEditQuiz(level, qi, prev => ({ ...prev, answer: parseInt(e.target.value || '0', 10) }))} fullWidth size="small" />
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Options</Typography>
                                {(Array.isArray(q.options) ? q.options : []).map((opt: string, oi: number) => (
                                  <Box key={oi} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                    <TextField value={opt || ''} fullWidth size="small" onChange={e => updateEditQuiz(level, qi, prev => {
                                      const opts = Array.isArray(prev.options) ? [...prev.options] : [];
                                      opts[oi] = e.target.value;
                                      return { ...prev, options: opts };
                                    })} />
                                    <Button size="small" variant="outlined" color="error" onClick={() => updateEditQuiz(level, qi, prev => {
                                      const opts = Array.isArray(prev.options) ? [...prev.options] : [];
                                      opts.splice(oi, 1);
                                      return { ...prev, options: opts };
                                    })}>Remove</Button>
                                  </Box>
                                ))}
                                <Button size="small" variant="outlined" onClick={() => updateEditQuiz(level, qi, prev => ({ ...prev, options: Array.isArray(prev.options) ? [...prev.options, ''] : [''] }))}>Add Option</Button>
                              </Grid>
                              <Grid item xs={12}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>Explanations</Typography>
                                {(Array.isArray(q.explanations) ? q.explanations : []).map((exp: string, ei: number) => (
                                  <Box key={ei} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                    <TextField value={exp || ''} fullWidth size="small" onChange={e => updateEditQuiz(level, qi, prev => {
                                      const exps = Array.isArray(prev.explanations) ? [...prev.explanations] : [];
                                      exps[ei] = e.target.value;
                                      return { ...prev, explanations: exps };
                                    })} />
                                    <Button size="small" variant="outlined" color="error" onClick={() => updateEditQuiz(level, qi, prev => {
                                      const exps = Array.isArray(prev.explanations) ? [...prev.explanations] : [];
                                      exps.splice(ei, 1);
                                      return { ...prev, explanations: exps };
                                    })}>Remove</Button>
                                  </Box>
                                ))}
                                <Button size="small" variant="outlined" onClick={() => updateEditQuiz(level, qi, prev => ({ ...prev, explanations: Array.isArray(prev.explanations) ? [...prev.explanations, ''] : [''] }))}>Add Explanation</Button>
                              </Grid>
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button size="small" variant="outlined" color="error" onClick={() => removeEditQuiz(level, qi)}>Remove Quiz</Button>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        ))}
                      </Box>
                    </Paper>
                  ))}
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleSaveEdit}>Save</Button>
                    <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>Cancel</Button>
                  </Box>
                </Box>
              )}
            </Paper>
            {!(editIndex === idx && editProject) && (
              <div>
                {/* Prominently show Project UUID in details section too */}
                <div style={{marginBottom: 8}}>
                  <label style={{fontWeight: 'bold'}}>Project UUID:</label> <span style={{fontFamily: 'monospace', color: 'var(--primary)'}}>{project._id || project.id}</span>
                </div>
                {/* --- Public-style preview --- */}
                <div style={{border: '1px solid var(--sidebar-border)', borderRadius: 8, padding: 16, marginBottom: 16, background: 'var(--card)'}}>
                  <h2 style={{margin: 0, fontSize: 24}}>{project.title}</h2>
                  <h4 style={{margin: '8px 0', color: 'var(--muted)'}}>{project.subtitle}</h4>
                  <div style={{margin: '8px 0'}}><b>Description:</b> {project.description}</div>
                  <div style={{margin: '8px 0'}}><b>Category:</b> {project.category}</div>
                  <div style={{margin: '8px 0'}}><b>Created At:</b> {project.createdAt}</div>
                  <div style={{margin: '8px 0'}}><b>Featured:</b> {project.featured ? 'Yes' : 'No'}</div>
                  <div style={{margin: '8px 0'}}><b>Technologies:</b> {Array.isArray(project.technologies) ? project.technologies.join(', ') : ''}</div>
                  <div style={{margin: '8px 0'}}><b>Tags:</b> {Array.isArray(project.tags) ? project.tags.join(', ') : ''}</div>
                  <div style={{margin: '8px 0'}}><b>Image:</b> {project.image && <img src={project.image} alt="Project" style={{maxWidth: 200, maxHeight: 120, borderRadius: 8, boxShadow: '0 2px 8px #0001'}} />}</div>
                  <div style={{margin: '8px 0'}}><b>Links:</b>
                    <ul style={{margin: 0, paddingLeft: 20}}>
                      {project.links?.github && <li><b>GitHub:</b> <a href={project.links.github} target="_blank" rel="noopener noreferrer">{project.links.github}</a></li>}
                      {project.links?.demo && <li><b>Demo:</b> <a href={project.links.demo} target="_blank" rel="noopener noreferrer">{project.links.demo}</a></li>}
                      {project.links?.documentation && <li><b>Documentation:</b> <a href={project.links.documentation} target="_blank" rel="noopener noreferrer">{project.links.documentation}</a></li>}
                    </ul>
                  </div>
                  {/* Media section */}
                  <div style={{margin: '8px 0'}}>
                    <b>Media:</b>
                    <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4}}>
                      {project.media?.images && project.media.images.map((img: string, i: number) => (
                        <img key={i} src={img} alt={`Media ${i+1}`} style={{maxWidth: 120, maxHeight: 80, borderRadius: 6, boxShadow: '0 1px 4px #0001'}} />
                      ))}
                      {project.media?.videos && project.media.videos.map((vid: string, i: number) => (
                        <video key={i} src={vid} controls style={{maxWidth: 120, maxHeight: 80, borderRadius: 6, boxShadow: '0 1px 4px #0001'}} />
                      ))}
                      {project.media?.diagrams && project.media.diagrams.map((dia: string, i: number) => (
                        <img key={i} src={dia} alt={`Diagram ${i+1}`} style={{maxWidth: 120, maxHeight: 80, borderRadius: 6, boxShadow: '0 1px 4px #0001'}} />
                      ))}
                    </div>
                  </div>
                  {/* Educational Content Preview */}
                  <div style={{margin: '16px 0'}}>
                    <b>Educational Content:</b>
                    {levels.map((level) => (
                      <div key={level} style={{margin: '12px 0', padding: 8, border: '1px solid #eee', borderRadius: 6, background: '#fff'}}>
                        <div style={{fontWeight: 'bold', textTransform: 'capitalize', fontSize: 18}}>{level} Overview:</div>
                        <div style={{marginBottom: 6}}>{getEC(project, level).overview || ''}</div>
                        <div><b>Prerequisites:</b> {(() => {
                          const prereqs = getEC(project, level).prerequisites;
                          if (Array.isArray(prereqs) && prereqs.filter(p => !!p && p.trim()).length > 0) {
                            return prereqs.filter(p => !!p && p.trim()).join(', ');
                          }
                          return <span style={{color: 'var(--muted)'}}>None</span>;
                        })()}</div>
                        <div><b>Concepts:</b></div>
                        <ul style={{margin: 0, paddingLeft: 20}}>
                          {Array.isArray(getEC(project, level).concepts) && getEC(project, level).concepts.length > 0 ? (
                            getEC(project, level).concepts.map((c: any, i: number) => (
                              <li key={i} style={{marginBottom: 6}}>
                                <b>{c.title}:</b> {Array.isArray(c.description)
                                  ? c.description.map((block: any, idx: number) => {
                                      if (block.type === 'text') return <span key={idx}>{block.content} </span>;
                                      if (block.type === 'image' || block.type === 'diagram') return <img key={idx} src={block.url} alt={block.type} style={{maxWidth: 60, maxHeight: 40, borderRadius: 4, marginLeft: 4, marginRight: 4}} />;
                                      if (block.type === 'video') {
                                        // YouTube embed support
                                        const ytMatch = typeof block.url === 'string' && block.url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
                                        if (ytMatch) {
                                          const videoId = ytMatch[1];
                                          return (
                                            <iframe
                                              key={idx}
                                              width="320"
                                              height="180"
                                              src={`https://www.youtube.com/embed/${videoId}`}
                                              title="YouTube video player"
                                              frameBorder="0"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                              allowFullScreen
                                              style={{borderRadius: 4, marginLeft: 4, marginRight: 4, background: '#000'}}
                                            />
                                          );
                                        }
                                        // Vimeo embed support (optional, can add more platforms)
                                        const vimeoMatch = typeof block.url === 'string' && block.url.match(/vimeo.com\/(\d+)/);
                                        if (vimeoMatch) {
                                          const vimeoId = vimeoMatch[1];
                                          return (
                                            <iframe
                                              key={idx}
                                              title={`Vimeo video ${vimeoId}`}
                                              src={`https://player.vimeo.com/video/${vimeoId}`}
                                              width="320"
                                              height="180"
                                              frameBorder="0"
                                              allow="autoplay; fullscreen; picture-in-picture"
                                              allowFullScreen
                                              style={{borderRadius: 4, marginLeft: 4, marginRight: 4, background: '#000'}}
                                            />
                                          );
                                        }
                                        // Default: direct video file
                                        return (
                                          <video
                                            key={idx}
                                            src={block.url}
                                            controls
                                            style={{maxWidth: 320, maxHeight: 180, borderRadius: 4, marginLeft: 4, marginRight: 4, background: '#000'}}
                                            crossOrigin="anonymous"
                                            preload="metadata"
                                          >
                                            Your browser does not support the video tag.
                                          </video>
                                        );
                                      }
                                      return null;
                                    })
                                  : (typeof c.description === 'string' ? c.description : '')}
                                {/* Concept media preview */}
                                <div style={{display: 'flex', gap: 8, marginTop: 2}}>
                                  {Array.isArray(c.images) && c.images.length > 0 && c.images.map((img: string, j: number) => (
                                    <img key={j} src={img} alt={`Concept Img ${j+1}`} style={{maxWidth: 60, maxHeight: 40, borderRadius: 4}} />
                                  ))}
                                  {Array.isArray(c.videos) && c.videos.length > 0 && c.videos.map((vid: string, j: number) => (
                                    <video key={j} src={vid} controls style={{maxWidth: 60, maxHeight: 40, borderRadius: 4}} />
                                  ))}
                                  {Array.isArray(c.diagrams) && c.diagrams.length > 0 && c.diagrams.map((dia: string, j: number) => (
                                    <img key={j} src={dia} alt={`Concept Dia ${j+1}`} style={{maxWidth: 60, maxHeight: 40, borderRadius: 4}} />
                                  ))}
                                </div>
                              </li>
                            ))
                          ) : <li style={{color: 'var(--muted)'}}>No concepts</li>}
                        </ul>
                        <div><b>Resources:</b></div>
                        <ul style={{margin: 0, paddingLeft: 20}}>
                          {Array.isArray(getEC(project, level).resources) && getEC(project, level).resources.length > 0 ? (
                            getEC(project, level).resources.map((r: any, i: number) => (
                              <li key={i}><b>{r.title}:</b> <a href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a> <span>({r.type})</span></li>
                            ))
                          ) : <li style={{color: 'var(--muted)'}}>No resources</li>}
                        </ul>
                        <div><b>Quizzes:</b></div>
                        <ul style={{margin: 0, paddingLeft: 20}}>
                          {Array.isArray(getEC(project, level).quizzes) && getEC(project, level).quizzes.length > 0 ? (
                            getEC(project, level).quizzes.map((q: any, i: number) => (
                              <li key={i} style={{marginBottom: 4}}>
                                <div><b>Q:</b> {q.question}</div>
                                <div><b>Options:</b> {Array.isArray(q.options) && q.options.length > 0 ? q.options.join(', ') : <span style={{color: 'var(--muted)'}}>None</span>}</div>
                                <div><b>Answer Index:</b> {typeof q.answer === 'number' ? q.answer : <span style={{color: 'var(--muted)'}}>None</span>}</div>
                                <div><b>Explanations:</b> {Array.isArray(q.explanations) && q.explanations.length > 0 ? q.explanations.join(' | ') : <span style={{color: 'var(--muted)'}}>None</span>}</div>
                              </li>
                            ))
                          ) : <li style={{color: 'var(--muted)'}}>No quizzes</li>}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleEdit(idx)}>Edit</button>
                <button onClick={() => handleDelete(idx)}>Delete</button>
              </div>
            )}
            
          </div>
        ))}
      </div>
      </Box>
    </>
  );
}
