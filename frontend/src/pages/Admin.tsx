import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper, TextField, Button, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Avatar, Snackbar } from '@mui/material';
import api from '../api';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

import type { Project } from '../types/Project';

import ProjectDetailsTab from '../components/admin/ProjectDetailsTab';
import AdminBlogDetail from './admin/AdminBlogDetail';
import AdminKnowledgeBaseTab from '../components/admin/AdminKnowledgeBaseTab';
import AdminTopicsTab from '../components/admin/AdminTopicsTab';
import AdminTopicDetailsTab from '../components/admin/AdminTopicDetailsTab';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import RichTextEditor from '../components/admin/RichTextEditor';
import styles from '../components/Sidebar.module.css';
const tabLabels = [
  'Projects',
  'Blogs',
  'FAQs',
  'About',
  'Contact',
  'Research Areas',
  'Project Details',
  'Blog Details',
  'Knowledge Base',
  'Topics',
  'Topic Details',
  'Users',
];

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}


const initialProjects: Project[] = [
  {
    id: '1',
    title: "Federated Learning for Cancer Diagnosis",
    subtitle: "Privacy-Preserving Collaborative AI",
    description: "A comprehensive federated learning methodology that enables collaborative model training across healthcare institutions while preserving patient privacy and addressing data heterogeneity challenges.",
    image: "/api/placeholder/400/300",
    category: "federated-learning",
    tags: ["AI", "Healthcare", "Privacy", "Federated Learning"],
    featured: true,
    createdAt: "2025-01-01",
    technologies: ["Federated Learning", "AI", "Privacy"],
    links: { github: '', demo: '', documentation: '' },
    educationalContent: {
      beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
    },
  },
  {
    id: '2',
    title: "Multi-Omics Biomarker Discovery",
    subtitle: "Explainable AI for Precision Medicine",
    description: "An innovative approach combining RAG-LLM with Graph Neural Networks to discover interpretable biomarkers from multi-omics data while maintaining mechanistic interpretability.",
    image: "/api/placeholder/400/300",
    category: "biomarker-discovery",
    tags: ["AI", "Biotechnology", "Explainable AI", "Multi-omics"],
    featured: true,
    createdAt: "2025-01-02",
    technologies: ["RAG-LLM", "Graph Neural Networks", "Multi-omics"],
    links: { github: '', demo: '', documentation: '' },
    educationalContent: {
      beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
    },
  },
  {
    id: '3',
    title: "SDV Security Framework",
    subtitle: "Multi-modal Authentication for Smart Vehicles",
    description: "A comprehensive security framework for Software Defined Vehicles with facial recognition, gesture controls, and voice commands for continuous driver authentication.",
    image: "/api/placeholder/400/300",
    category: "automotive",
    tags: ["Computer Vision", "Security", "Automotive", "SDV"],
    featured: true,
    createdAt: "2025-01-03",
    technologies: ["Computer Vision", "Security", "Automotive"],
    links: { github: '', demo: '', documentation: '' },
    educationalContent: {
      beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
      advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
    },
  },
];

type Blog = {
  id: number;
  title: string;
  uuid?: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  tags: string[];
  category: string;
  status: string;
  featuredImage: string;
  publishedAt: string;
  readTime: number;
  views: number;
  likes: number;
};

const initialBlogs: Blog[] = [
  {
    id: 1,
    title: "Understanding Federated Learning: A Beginner's Guide",
    slug: "understanding-federated-learning-beginners-guide",
    excerpt: "Learn the fundamentals of federated learning and how it enables privacy-preserving machine learning across distributed datasets.",
    content: "Full blog post content...",
    author: "Abdulhadi Abbas Akanni",
    tags: ["Federated Learning", "Machine Learning", "Privacy", "Tutorial"],
    category: "tutorial",
    status: "draft",
    featuredImage: "/api/placeholder/400/250",
    publishedAt: "2025-01-15T10:00:00Z",
    readTime: 8,
    views: 1250,
    likes: 45,
  },
  {
    id: 2,
    title: "The Future of Multi-Omics Data Analysis in Precision Medicine",
    slug: "future-multi-omics-data-analysis-precision-medicine",
    excerpt: "Exploring how multi-omics data integration is revolutionizing personalized healthcare and drug discovery.",
    content: "Full blog post content...",
    author: "Abdulhadi Abbas Akanni",
    tags: ["Multi-omics", "Precision Medicine", "Biomarker Discovery", "Healthcare AI"],
    category: "research",
    status: "draft",
    featuredImage: "/api/placeholder/400/250",
    publishedAt: "2025-01-12T14:30:00Z",
    readTime: 12,
    views: 980,
    likes: 32,
  },
];


const initialAbout = {
  name: "Abdulhadi Abbas Akanni",
  title: "AI Research Scientist & Engineer",
  email: "aabdulha@gitam.in",
  location: "Bengaluru, India",
  github: "https://github.com/abdulhadi-akanni",
  linkedin: "https://linkedin.com/in/abdulhadi-akanni",
  bio: "Passionate AI researcher and engineer dedicated to advancing healthcare, biotechnology, and intelligent transportation through innovative machine learning solutions.",
  bioDescription: "I am a dedicated AI researcher and engineer with a passion for solving complex problems in healthcare, biotechnology, and intelligent transportation. My work focuses on developing privacy-preserving machine learning systems, explainable AI for biomarker discovery, and secure frameworks for software-defined vehicles.",
  profilePicture: '',
  education: [
    {
      degree: "Bachelor of Technology in Computer Science and Engineering (AI & ML)",
      institution: "GITAM University, Bengaluru",
      year: "2022-2026",
      description: "Specialized in Artificial Intelligence and Machine Learning with focus on healthcare applications and federated learning systems."
    }
  ],
  experience: [
    {
      title: "Research Scientist & AI Engineer",
      organization: "GITAM University, SDV-MURTI Lab",
      period: "2023-Present",
      description: "Leading research in federated learning, multi-omics biomarker discovery, and software-defined vehicle security systems."
    }
  ],
  researchInterests: [
    "Federated Learning",
    "Multi-omics Data Analysis",
    "Explainable AI",
    "Privacy-Preserving Machine Learning",
    "Computer Vision",
    "Biomarker Discovery",
    "Software-Defined Vehicles",
    "Medical AI",
    "Graph Neural Networks",
    "Differential Privacy"
  ],
  achievements: [
    "Published 3 research papers in top-tier conferences",
    "Developed novel APFL-ODA framework for medical federated learning",
    "Created explainable AI system for multi-omics biomarker discovery",
    "Designed comprehensive security framework for Software Defined Vehicles",
    "Achieved 40% improvement in federated learning convergence speed",
    "Maintained differential privacy guarantees of ε = 5 and δ = 10⁻⁵"
  ]
};

const initialContact = {
  name: '',
  email: '',
  organization: '',
  role: '',
  subject: '',
  message: '',
  type: 'general',
  infoEmail: '',
  infoLocation: '',
  infoInstitution: '',
  infoLab: '',
  responseGeneral: '',
  responseCollab: '',
  responseTech: '',
  lookingCollab: '',
  lookingIndustry: '',
  lookingAcademic: '',
  lookingInternship: '',
};

const initialResearchAreas = [
  {
    title: 'Federated Learning',
    description: 'Collaborative machine learning across institutions with privacy-preserving techniques.',
  },
  {
    title: 'Biomarker Discovery',
    description: 'AI-driven identification of biomarkers for precision medicine and healthcare.',
  },
  {
    title: 'Software-Defined Vehicles',
    description: 'Security and intelligence for next-generation automotive systems.',
  },
];

const Admin: React.FC = () => {
  // Helper: map frontend-rich educationalContent (overview/prerequisites/concepts/resources/quizzes)
  // to the backend legacy schema (summary, keyConcepts, realWorldApplications, etc.).
  const mapEducationalToLegacy = (ec: any) => {
    const empty = {
      beginner: { summary: '', keyConcepts: [], realWorldApplications: [] },
      intermediate: { methodology: '', technicalApproach: '', challenges: [], solutions: [] },
      advanced: { implementation: '', performanceMetrics: [], researchContributions: [], futureWork: [] }
    };
    if (!ec || typeof ec !== 'object') return empty;
    const mapLevel = (lvl: any) => {
      if (!lvl || typeof lvl !== 'object') return {};
      const concepts = Array.isArray(lvl.concepts) ? lvl.concepts : [];
      const keyConcepts = concepts.map((c: any) => {
        if (!c) return '';
        if (typeof c === 'string') return c;
        if (c.title && typeof c.title === 'string' && c.title.trim()) return c.title.trim();
        if (Array.isArray(c.description) && c.description.length > 0) {
          const first = c.description[0];
          if (typeof first === 'string') return first;
          if (first && typeof first === 'object' && typeof first.content === 'string') return first.content;
        }
        return '';
      }).filter(Boolean);
      return {
        // preserve rich fields too so front/back compatibility is maintained
        summary: lvl.overview || lvl.summary || '',
        keyConcepts,
        realWorldApplications: Array.isArray(lvl.prerequisites) ? lvl.prerequisites : (lvl.realWorldApplications || []),
        methodology: lvl.overview || lvl.methodology || '',
        technicalApproach: keyConcepts.join('; '),
        implementation: lvl.overview || lvl.implementation || '',
        researchContributions: keyConcepts,
        // keep rich originals
        overview: lvl.overview || lvl.summary || '',
        prerequisites: Array.isArray(lvl.prerequisites) ? lvl.prerequisites : (lvl.prereqs || []),
        concepts: Array.isArray(lvl.concepts) ? lvl.concepts : (lvl.keyConcepts || []),
        resources: Array.isArray(lvl.resources) ? lvl.resources : (lvl.refs || []),
        quizzes: Array.isArray(lvl.quizzes) ? lvl.quizzes : (lvl.practiceQuestions || []),
      };
    };
    return {
      beginner: mapLevel(ec.beginner || {}),
      intermediate: mapLevel(ec.intermediate || {}),
      advanced: mapLevel(ec.advanced || {}),
    };
  };
  // --- Project Tab Handlers ---
  const onAddProject = (newProject: Project) => {
    setProjects((prev) => [
      ...prev,
      {
        ...newProject,
        technologies: newProject.technologies || [],
        links: newProject.links || { github: '', demo: '', documentation: '' },
        educationalContent: newProject.educationalContent || {
          beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
          intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
          advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
        },
      },
    ]);
  };

  const handleAddCategory = async () => {
    const name = (newCategoryName || '').trim();
    if (!name) return setCategoriesError('Category name required');
    // Client-side duplicate check (case-insensitive) against existing category names only
    if (projectCategories.some((c: any) => {
      const existing = typeof c === 'string' ? c : (c?.name || '');
      return String(existing).trim().toLowerCase() === String(name).trim().toLowerCase();
    })) {
      return setCategoriesError('Category already exists');
    }
    try {
      setCategoriesLoading(true);
      const res = await api.post('/projects/categories', { name });
      const created = res.data?.data;
      if (created && created.name) {
        setProjectCategories(prev => {
          const copy = [...prev];
          if (!copy.some((c: any) => String(c.name).toLowerCase() === String(created.name).toLowerCase())) {
            copy.push({ name: created.name, _id: created._id });
          }
          return copy;
        });
        setNewCategoryName('');
        setCategoriesError(null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create category';
      setCategoriesError(msg);
      // If server returned existing category (409 with data), ensure it appears in the list so Edit/Delete become available
      try {
        if (err?.response?.status === 409 && err?.response?.data?.data) {
          const existing = err.response.data.data;
          setProjectCategories(prev => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const exists = copy.some((c: any) => String((c && (c._id || c.name)) || '').toLowerCase() === String(existing._id || existing.name).toLowerCase());
            if (!exists) {
              copy.push({ name: existing.name, _id: existing._id });
            }
            return copy;
          });
        }
      } catch (e) {
        // ignore
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      setCategoriesLoading(true);
      // Accept either an ObjectId or a category name; ensure value is URL-encoded
      await api.delete(`/projects/categories/${encodeURIComponent(String(id))}`);
      // refetch list
      await fetchProjectCategories();
    } catch (err: any) {
      setCategoriesError(err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const name = (editingCategoryName || '').trim();
    if (!name) return setCategoriesError('Category name required');
    try {
      setCategoriesLoading(true);
      // Ensure id or name are URL-encoded when used in path
      await api.put(`/projects/categories/${encodeURIComponent(String(id))}`, { name });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      await fetchProjectCategories();
      setCategoriesError(null);
    } catch (err: any) {
      setCategoriesError(err?.response?.data?.message || 'Failed to update category');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategoryInline = async (name: string, idx?: number) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return setCategoriesError('Category name required');
    // Client-side duplicate check (case-insensitive) against existing category names only
    if (projectCategories.some((c: any) => {
      const existing = typeof c === 'string' ? c : (c?.name || '');
      return String(existing).trim().toLowerCase() === String(trimmed).trim().toLowerCase();
    })) {
      return setCategoriesError('Category already exists');
    }
    try {
      setCategoriesLoading(true);
      const res = await api.post('/projects/categories', { name: trimmed });
      const created = res.data?.data;
      if (created && created.name) {
        // replace the inline/local entry at idx if provided, otherwise append
        setProjectCategories(prev => {
          const copy = Array.isArray(prev) ? [...prev] : [];
          if (typeof idx === 'number' && idx >= 0 && idx < copy.length) {
            copy[idx] = { name: created.name, _id: created._id };
          } else if (!copy.some((c: any) => String(c.name).toLowerCase() === String(created.name).toLowerCase())) {
            copy.push({ name: created.name, _id: created._id });
          }
          return copy;
        });
        setEditingCategoryId(null);
        setEditingCategoryName('');
        setCategoriesError(null);
      }
    } catch (err: any) {
      setCategoriesError(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const onEditProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((proj) =>
      (proj.id === updatedProject.id || proj._id === updatedProject._id)
        ? {
            ...updatedProject,
            technologies: updatedProject.technologies || [],
            links: updatedProject.links || { github: '', demo: '', documentation: '' },
            educationalContent: updatedProject.educationalContent || {
              beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
              intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
              advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
            },
          }
        : proj
    ));
  };

  const onDeleteProject = (projectId: string | number) => {
    setProjects((prev) => prev.filter((proj) => proj.id !== projectId && proj._id !== projectId));
  };
  const [tab, setTab] = useState(0);
  const [projects, setProjects] = useState(initialProjects);
  const [editingProjectId, setEditingProjectId] = useState<string | number | null>(null);
  const [projectEditBuffer, setProjectEditBuffer] = useState<any>({});
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsSuccess, setProjectsSuccess] = useState<string | null>(null);
  const [projectCategories, setProjectCategories] = useState<any[]>([
    { name: 'ai-ml' },
    { name: 'federated-learning' },
    { name: 'biomarker-discovery' },
    { name: 'computer-vision' },
    { name: 'security' },
    { name: 'automotive' }
  ]);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>(initialBlogs);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogsError, setBlogsError] = useState<string | null>(null);
  const [blogsSuccess, setBlogsSuccess] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);  
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [faqsError, setFaqsError] = useState<string | null>(null);
  const [faqsSuccess, setFaqsSuccess] = useState<string | null>(null);
  const [about, setAbout] = useState(initialAbout);
  const [contact, setContact] = useState(initialContact);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess] = useState<string | null>(null);
  const [researchAreas, setResearchAreas] = useState(initialResearchAreas);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [researchAreasLoading, setResearchAreasLoading] = useState(false);
  const [researchAreasError, setResearchAreasError] = useState<string | null>(null);
  const [researchAreasSuccess, setResearchAreasSuccess] = useState<string | null>(null);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [blogEditBuffer, setBlogEditBuffer] = useState<any>({});
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [faqEditBuffer, setFaqEditBuffer] = useState<any>({});
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutEditBuffer, setAboutEditBuffer] = useState<any>(initialAbout);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleProfilePicFile = async (file: File | null) => {
    if (!file) return;
    setUploadingPicture(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await import('../api').then(mod => mod.default.post('/uploads/profile-picture', fd, { withCredentials: true }));
      const data = res.data;
      if (data && data.success && data.url) {
        setAboutEditBuffer({ ...aboutEditBuffer, profilePicture: data.url });
      } else {
        // optional: show error
      }
    } catch (e) {
      // ignore
    } finally {
      setUploadingPicture(false);
    }
  };
  const [editingContact, setEditingContact] = useState(false);
  const [contactEditBuffer, setContactEditBuffer] = useState<any>(initialContact);
  const [editingResearchAreaId, setEditingResearchAreaId] = useState<string | null>(null);
  const [researchAreaEditBuffer, setResearchAreaEditBuffer] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ idx: number; area: any } | null>(null);
  const [projectDeleteDialogOpen, setProjectDeleteDialogOpen] = useState(false);
  const [projectDeleteTarget, setProjectDeleteTarget] = useState<{ idx: number; project: any } | null>(null);
  const [projectDeleteLoading, setProjectDeleteLoading] = useState(false);
  // FAQ delete confirmation dialog state
  const [faqDeleteDialogOpen, setFaqDeleteDialogOpen] = useState(false);
  const [faqDeleteTarget, setFaqDeleteTarget] = useState<{ idx: number; faq: any } | null>(null);

  // Gold members (Users tab)
  const [goldMembers, setGoldMembers] = useState<any[] | null>(null);
  const [goldEmail, setGoldEmail] = useState('');
  const [goldLoading, setGoldLoading] = useState(false);
  const [goldError, setGoldError] = useState<string | null>(null);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  // Initialize About and Contact Settings on component mount
  useEffect(() => {
    (async () => {
      try {
        const aboutRes = await api.get('/about');
        if (aboutRes.data) {
          setAbout(aboutRes.data);
          setAboutEditBuffer(aboutRes.data);
        }
      } catch (e) {
        // Keep defaults on error
      }
      try {
        const contactRes = await api.get('/contact/settings');
        if (contactRes.data) {
          setContact(contactRes.data);
          setContactEditBuffer(contactRes.data);
        }
      } catch (e) {
        // Keep defaults on error
      }
    })();
  }, []);

  // Fetch data from backend on tab change
  useEffect(() => {
    if (tab === 0) {
      setProjectsLoading(true);
      setProjectsError(null);
      api.get('/projects')
        .then(res => {
          let data = Array.isArray(res.data?.data) ? res.data.data : initialProjects;
          // Always map id for frontend
          data = data.map((proj: any) => ({ ...proj, id: proj._id || proj.id }));
          setProjects(data);
          setProjectsLoading(false);
          // Also fetch categories for project dropdown
          fetchProjectCategories();
        })
        .catch(() => {
          setProjects(initialProjects);
          setProjectsError('Failed to load projects');
          setProjectsLoading(false);
        });
    } else if (tab === 1) {
      setBlogsLoading(true);
      setBlogsError(null);
      api.get('/blog')
        .then(res => {
          let data = Array.isArray(res.data?.data) ? res.data.data : initialBlogs;
          // Always map id for frontend and ensure uuid exists for linking
          data = data.map((blog: any) => {
            const b = { ...blog, id: blog._id || blog.id };
            if (!b.uuid) b.uuid = uuidv4();
            return b;
          });
          setBlogs(data);
          setBlogsLoading(false);
        })
        .catch(() => {
          setBlogs(initialBlogs);
          setBlogsError('Failed to load blogs');
          setBlogsLoading(false);
        });
    } else if (tab === 2) {
      setFaqsLoading(true);
      setFaqsError(null);
      api.get('/faq')
        .then(res => {
          let data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          if (Array.isArray(data)) {
            data = data.map((faq: any) => ({ ...faq, id: faq._id || faq.id }));
          }
          setFaqs(data);
          setFaqsLoading(false);
        })
        .catch(() => {
          setFaqs([]);
          setFaqsError('Failed to load FAQs');
          setFaqsLoading(false);
        });
    } else if (tab === 3) {
      // Load About settings from backend
      api.get('/about')
        .then(res => {
          const data = res.data;
          if (data) {
            setAbout(data);
            setAboutEditBuffer(data);
          }
        })
        .catch(() => {
          // Keep defaults on error
        });
    } else if (tab === 4) {
      setContactLoading(true);
      setContactError(null);
      // Load Contact Settings from backend
      api.get('/contact/settings')
        .then(res => {
          const data = res.data;
          if (data) {
            setContact(data);
            setContactEditBuffer(data);
          } else {
            setContact(initialContact);
            setContactEditBuffer(initialContact);
          }
          setContactLoading(false);
        })
        .catch(() => {
          setContact(initialContact);
          setContactEditBuffer(initialContact);
          setContactError('Failed to load contact settings');
          setContactLoading(false);
        });
    } else if (tab === 5) {
      setResearchAreasLoading(true);
      setResearchAreasError(null);
      api.get('/research-areas')
        .then(res => {
          let data = Array.isArray(res.data?.data) ? res.data.data : [];
          // Ensure we sort admin-side to match public sidebar ordering
          if (Array.isArray(data)) {
            const copy = [...data];
            copy.sort((a: any, b: any) => (String((a.title || a.name || '')).localeCompare(String(b.title || b.name || ''), undefined, { sensitivity: 'base' })));
            data = copy;
          }
          setResearchAreas(data);
          setResearchAreasLoading(false);
        })
        .catch(() => {
          setResearchAreasError('Failed to load research areas');
          setResearchAreasLoading(false);
        });
    } else if (tab === 6) {
      // Project Details admin tab needs full project documents (including educationalContent).
      // The main projects list endpoint intentionally omits educationalContent for performance,
      // so fetch full documents individually and merge into state for the Project Details UI.
      (async () => {
        try {
          setProjectsLoading(true);
          setProjectsError(null);
          // Use existing projects state as a source of IDs if available; otherwise fetch the list first.
          let ids: string[] = [];
          if (Array.isArray(projects) && projects.length > 0) {
            ids = projects.map((p: any) => p._id || p.id).filter(Boolean);
          } else {
            const listRes = await api.get('/projects');
            const listData = Array.isArray(listRes.data?.data) ? listRes.data.data : [];
            ids = listData.map((p: any) => p._id || p.id).filter(Boolean);
          }
          // Fetch full details in parallel but limit to reasonable number to avoid overloading server
          const fetches = ids.map((id: string) => api.get(`/projects/${id}`).then((r: any) => r.data?.data || r.data).catch(() => null));
          const results = await Promise.all(fetches);
          const valid = (results || []).filter(Boolean);
          if (valid.length > 0) {
            // Ensure id mapping and merge with any lightweight project entries
            const merged = valid.map((p: any) => ({ ...p, id: p._id || p.id }));
            setProjects(merged);
          }
        } catch (e) {
          // ignore and allow the tab to operate with existing projects state
          setProjectsError('Failed to load full project details. Using lightweight list.');
        } finally {
          setProjectsLoading(false);
        }
      })();
    }
    // eslint-disable-next-line
  }, [tab]);

  // Fetch gold members when the Users tab is opened
  const fetchGoldMembers = async () => {
    try {
      setGoldLoading(true);
      const res = await api.get('/gold-members');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setGoldMembers(data);
    } catch (e) {
      setGoldError('Failed to load gold members');
    } finally {
      setGoldLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 11) {
      fetchGoldMembers();
    }
  }, [tab]);

  const fetchProjectCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await api.get('/projects/categories');
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      // Map server objects to internal format (name + _id). Overwrite local categories so
      // server-backed items show Edit/Delete in the dialog. If server returned an empty
      // list, replace the local list with an empty array so admin can see current state.
      if (Array.isArray(data)) {
        const mapped = data.map((d: any) => ({ name: d.name, _id: d._id }));
        // If server returned no categories but frontend has local defaults, seed them on the server
        if (Array.isArray(mapped) && mapped.length === 0) {
          try {
            const localNames = Array.isArray(projectCategories) ? projectCategories.map((c: any) => (typeof c === 'string' ? c : (c?.name || ''))).filter(Boolean) : [];
            if (localNames.length > 0) {
              // create each default category on server (skip duplicates)
              for (const nm of localNames) {
                try {
                  await api.post('/projects/categories', { name: nm });
                } catch (e: any) {
                  // ignore conflicts and other errors for individual seeds
                }
              }
              // refetch after seeding
              const r2 = await api.get('/projects/categories');
              const d2 = Array.isArray(r2.data?.data) ? r2.data.data : [];
              setProjectCategories(d2.map((dd: any) => ({ name: dd.name, _id: dd._id })));
            } else {
              setProjectCategories(mapped);
            }
          } catch (seedErr) {
            // If seeding fails, just set the empty mapped list
            setProjectCategories(mapped);
          }
        } else {
          setProjectCategories(mapped);
        }
      }
    } catch (err) {
      // Keep local defaults on error and surface an error message so admin still has options
      setCategoriesError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Save handlers for each section
  const handleSaveProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);
    setProjectsSuccess(null);
    try {
      // Only save projects that have all required fields
      const validProjects = projects.filter(
        (proj) => proj.title && proj.subtitle && proj.description && proj.category
      );
      if (validProjects.length === 0) {
        setProjectsError('Title, subtitle, description, and category are required for all projects. Please fill all fields.');
        setProjectsLoading(false);
        return;
      }
      // Remove incomplete projects from UI before saving
      setProjects(validProjects);
      await Promise.all(validProjects.map(async (proj: any) => {
        // Convert createdAt to ISO string if present and valid
        let createdAt = proj.createdAt;
        if (createdAt) {
          const dateObj = new Date(createdAt);
          if (!isNaN(dateObj.getTime())) {
            createdAt = dateObj.toISOString();
          } else {
            createdAt = '';
          }
        }
  // Ensure all required fields for backend
  const allowedCategories = Array.isArray(projectCategories) && projectCategories.length > 0 ? projectCategories.map((c: any) => (typeof c === 'string' ? c : c.name)) : ['ai-ml', 'federated-learning', 'biomarker-discovery', 'computer-vision', 'security', 'automotive'];
  const category = allowedCategories.includes(proj.category) ? proj.category : (allowedCategories[0] || 'ai-ml');
        let createdAtISO = '';
        if (proj.createdAt) {
          const dateObj = new Date(proj.createdAt);
          if (!isNaN(dateObj.getTime())) {
            createdAtISO = dateObj.toISOString();
          }
        }
        // Ensure media.images is an array and includes the image field if present
        let media = proj.media && typeof proj.media === 'object' ? { ...proj.media } : { images: [], videos: [], diagrams: [], codeSnippets: [] };
        if (proj.image && typeof proj.image === 'string' && proj.image.trim()) {
          media.images = Array.isArray(media.images) ? [...media.images] : [];
          // Only add if not already present
          if (!media.images.includes(proj.image.trim())) {
            media.images.unshift(proj.image.trim());
          }
        }
        const payload = {
          ...proj,
          detailedDescription: proj.detailedDescription || proj.description || '',
          technicalDetails: proj.technicalDetails || { technologies: [], methodologies: [], algorithms: [], datasets: [] },
          // Ensure educationalContent is in the backend-expected legacy shape
          educationalContent: mapEducationalToLegacy(proj.educationalContent || {}),
          media,
          publications: proj.publications || [],
          githubUrl: proj.githubUrl || '',
          demoUrl: proj.demoUrl || '',
          category,
          createdAt: createdAtISO
        };
        // Remove id if present
        delete payload.id;
        // Only keep _id if it is a valid 24-character hex string
        if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
          delete payload._id;
        }
        if (payload._id) {
          await api.put(`/projects/${payload._id}`, payload);
        } else {
          await api.post('/projects', payload);
        }
      }));
      setProjectsSuccess('Projects saved successfully!');
    } catch (error: any) {
      setProjectsError(error?.response?.data?.message || 'Failed to save projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleSaveBlogs = async () => {
    setBlogsLoading(true);
    setBlogsError(null);
    setBlogsSuccess(null);
    try {
      // Allowed enums
      const allowedCategories = ['technical', 'research', 'tutorial', 'insights', 'news'];
      const allowedStatus = ['draft', 'published', 'archived'];
      // Only send and validate blogs that have all required fields filled and valid enums
      const validBlogs = blogs.filter(blog => {
        const title = (blog.title || '').trim();
        const slug = (blog.slug || '').trim();
        const excerpt = (blog.excerpt || '').trim();
        const content = (blog.content || '').trim();
        const author = (blog.author || '').trim();
        const category = (blog.category || '').trim();
        const status = (blog.status || 'draft').trim();
        return title && slug && excerpt && content && author && allowedCategories.includes(category) && allowedStatus.includes(status) && blog.readTime && !isNaN(blog.readTime) && Number(blog.readTime) >= 1;
      });
      if (validBlogs.length === 0) {
        setBlogsError('At least one complete blog with valid category and status is required to save.');
        setBlogsLoading(false);
        return;
      }
    // Persist only the valid blogs to the server, but do NOT remove incomplete/invalid blogs from the UI.
    // We'll merge back the server-returned documents into the existing `blogs` array so nothing unexpectedly disappears.
  const savedResults = await Promise.all(validBlogs.map(async (blog: any) => {
        // Convert publishedAt to ISO string if present and valid
        let publishedAt = blog.publishedAt;
        if (publishedAt) {
          // Try to parse as local datetime and convert to ISO
          const dateObj = new Date(publishedAt);
          if (!isNaN(dateObj.getTime())) {
            publishedAt = dateObj.toISOString();
          } else {
            publishedAt = '';
          }
        }
        const payload = {
          ...blog,
          uuid: blog.uuid || uuidv4(),
          slug: (blog.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
          readTime: Math.max(1, Number(blog.readTime) || 1),
          category: allowedCategories.includes(blog.category) ? blog.category : 'technical',
          status: allowedStatus.includes(blog.status) ? blog.status : 'published',
          publishedAt
        };
        // Remove id if present
        delete payload.id;
        // Only keep _id if it is a valid 24-character hex string
        if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
          delete payload._id;
        }
        let savedBlog: any = null;
        if (payload._id) {
          const res = await api.put(`/blog/${payload._id}`, payload);
          savedBlog = res.data?.data || res.data;
        } else {
          const res = await api.post('/blog', payload);
          savedBlog = res.data?.data || res.data;
        }
        return savedBlog;
      }));
      // Merge the saved results back into the current blogs array. Match by _id (if returned), uuid, or slug.
      const current = [...blogs];
      const merged = current.map((orig) => {
        // Use a loose type for original item to avoid TS complaints about _id
        const origAny: any = orig;
        // Try to find a matching saved document
        const match = savedResults.find((s: any) => {
          if (!s) return false;
          if (s._id && (origAny._id === s._id || origAny.id === s._id)) return true;
          if (s.uuid && (origAny.uuid === s.uuid)) return true;
          if (s.slug && origAny.slug && s.slug === origAny.slug) return true;
          return false;
        });
        if (match) {
          return { ...orig, ...match, id: match._id || match.id, uuid: match.uuid || origAny.uuid || uuidv4() };
        }
        return orig;
      });

      // Append any saved results that didn't match an existing item (new posts created during bulk save)
      for (const s of savedResults) {
        const exists = merged.some((m: any) => (s._id && (((m as any)._id === s._id) || (m.id === s._id))) || (s.uuid && (m.uuid === s.uuid)) || (s.slug && (m.slug === s.slug)));
        if (!exists) {
          merged.push({ ...s, id: s._id || s.id, uuid: s.uuid || uuidv4() });
        }
      }

      setBlogs(merged);
      setBlogsSuccess('Blogs saved successfully!');
    } catch (error: any) {
      // Show full backend error for debugging
      let errorMsg = 'Failed to save blogs';
      if (error?.response?.data) {
        errorMsg = JSON.stringify(error.response.data, null, 2);
      } else if (error?.message) {
        errorMsg = error.message;
      }
      setBlogsError('Error updating blog post: ' + errorMsg);
      // Also log the full error to the console for developer debugging
      // eslint-disable-next-line no-console
      console.error('Blog save error:', error);
    } finally {
      setBlogsLoading(false);
    }
  };

  const handleSaveFaqs = async () => {
    setFaqsLoading(true);
    setFaqsError(null);
    setFaqsSuccess(null);
    try {
      const allowedCategories = ['general', 'technical', 'project', 'collaboration', 'academic'];
      await Promise.all(faqs.map(async (faq: any) => {
        // Validate and sanitize FAQ fields
        let category = faq.category ? String(faq.category).toLowerCase() : '';
        if (!allowedCategories.includes(category)) category = 'general';
        const faqWithActive = {
          ...faq,
          isActive: typeof faq.isActive === 'boolean' ? faq.isActive : true,
          category,
          order: typeof faq.order === 'number' ? faq.order : Number(faq.order) || 0
        };
        if (faq._id || (faq.id && typeof faq.id === 'string')) {
          // Use _id for updates
          await api.put(`/faq/${faq._id || faq.id}`, faqWithActive);
        } else {
          // Remove id/_id for new FAQs so MongoDB can generate one
          const rest = { ...faqWithActive };
          delete rest.id;
          delete rest._id;
          await api.post('/faq', rest);
        }
      }));
      setFaqsSuccess('FAQs saved successfully!');
    } catch (error: any) {
      setFaqsError(error?.response?.data?.message || 'Failed to save FAQs');
    } finally {
      setFaqsLoading(false);
    }
  };

      // contact saving is handled inline in the Contact tab UI; no separate handler needed here.

  // For research areas, demo: update all as projects in a category (customize as needed)
  // Save research areas. If `areasToSave` is provided, persist that list; otherwise use current state.
  const handleSaveResearchAreas = async (areasToSave?: any[]) => {
    // Use provided areasToSave when present, otherwise use current state.
    // If an inline edit is in progress (editingResearchAreaId), merge the edit buffer
    // into the areas array so the global Save includes unsaved inline edits and
    // validation won't incorrectly fail / clear the UI.
    let areas = Array.isArray(areasToSave) ? areasToSave.slice() : (Array.isArray(researchAreas) ? [...researchAreas] : []);
    try {
      if (editingResearchAreaId && researchAreaEditBuffer && researchAreaEditBuffer[editingResearchAreaId]) {
        // Find the index matching the editing key (either _id or numeric index string)
        const idx = areas.findIndex((a: any, i: number) => {
          const key = String((('_id' in a && a._id) ? a._id : i));
          return String(key) === String(editingResearchAreaId);
        });
        if (idx !== -1) {
          areas[idx] = { ...areas[idx], ...researchAreaEditBuffer[editingResearchAreaId] };
        }
      }
    } catch (e) {
      // If merge fails for any reason, fall back to using the original areas array.
      areas = Array.isArray(areasToSave) ? areasToSave : researchAreas;
    }
    setResearchAreasLoading(true);
    setResearchAreasError(null);
    setResearchAreasSuccess(null);
    try {
      // Validate required fields
      for (const area of areas) {
        if (!area.title || !area.description) {
          setResearchAreasError('Title and description are required for all research areas.');
          setResearchAreasLoading(false);
          return;
        }
      }
      if (Array.isArray(areasToSave)) {
        // Fast path: persist ordering in one request for existing items
        const ids = areas.filter((a: any) => a._id).map((a: any) => a._id);
        if (ids.length > 0) {
          await api.post('/research-areas/reorder', { orderedIds: ids });
        }
        // If there are new items (without _id), create them and set their order
        await Promise.all(areas.map(async (area: any, idx: number) => {
          if (!area._id) {
            const payload = { title: area.title, description: area.description, order: idx };
            await api.post('/research-areas', payload);
          }
        }));
      } else {
        // Full-save path: upsert each area including order
        await Promise.all(areas.map(async (area: any, idx: number) => {
          const payload = { title: area.title, description: area.description, order: idx };
          if (area._id) {
            await api.put(`/research-areas/${area._id}`, payload);
          } else {
            await api.post('/research-areas', payload);
          }
        }));
      }
      setResearchAreasSuccess('Research Areas saved!');
      // Refresh from server to ensure Admin shows server-provided order if available
      try {
        const res = await api.get('/research-areas');
        let data = Array.isArray(res.data?.data) ? res.data.data : [];
        if (Array.isArray(data)) {
          // If server provided explicit order, assume it's already ordered. Otherwise sort by title as fallback.
          const hasOrder = data.some((d: any) => typeof d.order === 'number');
          if (!hasOrder) {
            data = [...data].sort((a: any, b: any) => String((a.title || a.name || '')).localeCompare(String(b.title || b.name || ''), undefined, { sensitivity: 'base' }));
          }
        }
        setResearchAreas(data);
      } catch (e) {
        // Ignore refresh error; keep current local state
      }
    } catch (error: any) {
      setResearchAreasError(error?.response?.data?.message || 'Failed to save research areas');
    } finally {
      setResearchAreasLoading(false);
    }
    
  };

  // Delete confirmation handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { idx, area } = deleteTarget;
    try {
      setResearchAreasLoading(true);
      if (area && (area as any)._id) {
        await api.delete(`/research-areas/${(area as any)._id}`);
        setResearchAreas(prev => prev.filter((a, i) => i !== idx && ((a as any)._id || a) !== (area as any)._id));
      } else {
        setResearchAreas(prev => prev.filter((_, i) => i !== idx));
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setResearchAreasError(err?.response?.data?.message || 'Failed to delete research area');
    } finally {
      setResearchAreasLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  // FAQ delete handlers
  const handleConfirmDeleteFaq = async () => {
    if (!faqDeleteTarget) return;
    const { idx, faq } = faqDeleteTarget;
    try {
      setFaqsLoading(true);
      if (faq && (faq._id || (faq.id && typeof faq.id === 'string'))) {
        const id = faq._id || faq.id;
        await api.delete(`/faq/${id}`);
        setFaqs(prev => prev.filter((f, i) => i !== idx && ((f._id || f.id) !== id)));
      } else {
        setFaqs(prev => prev.filter((_, i) => i !== idx));
      }
      setFaqDeleteDialogOpen(false);
      setFaqDeleteTarget(null);
    } catch (err: any) {
      setFaqsError(err?.response?.data?.message || 'Failed to delete FAQ');
    } finally {
      setFaqsLoading(false);
    }
  };

  const cancelFaqDelete = () => {
    setFaqDeleteDialogOpen(false);
    setFaqDeleteTarget(null);
  };

  // Project delete confirmation handlers
  const confirmProjectDelete = async () => {
    if (!projectDeleteTarget) return;
    const { idx, project } = projectDeleteTarget;
    try {
      setProjectDeleteLoading(true);
      if (project && (project._id || project.id)) {
        const id = project._id || project.id;
        await api.delete(`/projects/${id}`);
        setProjects(prev => prev.filter((p, i) => i !== idx));
      } else {
        setProjects(prev => prev.filter((p, i) => i !== idx));
      }
      setProjectDeleteDialogOpen(false);
      setProjectDeleteTarget(null);
      setProjectsSuccess('Project deleted');
    } catch (err: any) {
      setProjectsError(err?.response?.data?.message || 'Failed to delete project');
    } finally {
      setProjectDeleteLoading(false);
    }
  };

  const cancelProjectDelete = () => {
    setProjectDeleteDialogOpen(false);
    setProjectDeleteTarget(null);
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Admin user state (read from admin_user localStorage)
  const [adminUserState, setAdminUserState] = useState<{ name?: string; email?: string } | null>(null);

  // Success message (from navigation state, e.g. after login)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // read admin user from localStorage
    try {
      const raw = localStorage.getItem('admin_user');
      if (raw) setAdminUserState(JSON.parse(raw));
    } catch (e) {
      setAdminUserState(null);
    }

    // show any success message passed via navigation state
    const navState: any = location.state;
    if (navState && navState.success) {
      setSuccessMessage(navState.success);
      // clear the navigation state to avoid repeated messages
      try {
        // replace history state without the message
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } catch (e) {}
      // auto-dismiss after 4s
      setTimeout(() => setSuccessMessage(null), 4000);
    }

    // listen for storage events so header updates when admin_user changes in another tab
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === 'admin_user') {
        try {
          const raw = localStorage.getItem('admin_user');
          if (raw) setAdminUserState(JSON.parse(raw));
          else setAdminUserState(null);
        } catch (e) {
          setAdminUserState(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); };
  }, []);

  const adminLogout = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_auth_token') : null;
    try {
      if (token) {
        await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      // ignore logout errors
    } finally {
      try { localStorage.removeItem('admin_auth_token'); localStorage.removeItem('admin_user'); } catch (err) {}
      navigate('/admin/login');
    }
  };

  // Simple editable forms for each section
  return (
    <Paper sx={{ width: '100%', minHeight: '80vh', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Snackbar
            open={!!successMessage}
            autoHideDuration={4000}
            onClose={() => setSuccessMessage(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {adminUserState && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {adminUserState.name ? adminUserState.name.charAt(0).toUpperCase() : 'A'}
              </Avatar>
              <Typography variant="body2">{adminUserState.name || adminUserState.email}</Typography>
            </Box>
          )}
          <Button variant="outlined" color="secondary" onClick={adminLogout}>
            Admin Logout
          </Button>
        </Box>
      </Box>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        aria-label="Admin Tabs"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}
        TabIndicatorProps={{ style: { background: '#1976d2' } }}
      >
        {tabLabels.map((label, idx) => (
          <Tab
            label={label}
            key={label}
            id={`admin-tab-${idx}`}
            aria-controls={`admin-tabpanel-${idx}`}
            sx={{
              color: '#f4e9e9ff',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#3c1304ff',
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
              },
              textTransform: 'none',
              minWidth: 120,
            }}
          />
        ))}
      </Tabs>
      <TabPanel value={tab} index={0}>
        <Typography variant="h6">Edit Projects</Typography>
        {projectsLoading && <CircularProgress sx={{ my: 2 }} />}
        {projectsError && <Alert severity="error">{projectsError}</Alert>}
        {projectsSuccess && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography color="success.main">{projectsSuccess}</Typography>
            </Paper>
          </Box>
        )}
        {projectsError && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#ffebee' }}>
              <Typography color="error.main">{projectsError}</Typography>
            </Paper>
          </Box>
        )}
        <Button variant="outlined" sx={{
    mb: 2,
    color: "white",        // text color
    borderColor: "white",  // border color
    "&:hover": {
      borderColor: "white", 
      backgroundColor: "rgba(255,255,255,0.1)", // optional hover effect
    },
  }} onClick={() => setProjects([
          ...projects,
          {
            id: '',
            title: '',
            subtitle: '',
            description: '',
            image: '',
            category: '',
            tags: [],
            featured: false,
            createdAt: '',
            technologies: [],
            links: { github: '', demo: '', documentation: '' },
            educationalContent: {
              beginner: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
              intermediate: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
              advanced: { overview: '', prerequisites: [], concepts: [], resources: [], quizzes: [] },
            },
          }
        ])}>
          Add New Project
        </Button>
        <Button variant="text" sx={{ mb: 2, ml: 2 }} onClick={() => { setCategoriesError(null); setCategoriesDialogOpen(true); fetchProjectCategories(); }}>
          Manage Categories
        </Button>
  {!projectsLoading && Array.isArray(projects) && projects.map((proj, idx) => {
    const isEditing = editingProjectId === (proj.id || idx);
    const buffer = isEditing ? (projectEditBuffer[proj.id || idx] || proj) : proj;
    const missingTitle = !buffer.title;
    const missingSubtitle = !buffer.subtitle;
    const missingDescription = !buffer.description;
    const missingCategory = !buffer.category;
    return (
      <Box key={(proj as any)._id || idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
        {/* Project UUID field, always visible and read-only for copy */}
        <TextField
          fullWidth
          label="Project UUID"
          value={(proj as any)._id ? (proj as any)._id : 'No UUID'}
          InputProps={{ readOnly: true, style: { background: '#f3f3f3', color: '#1976d2', fontWeight: 'bold' } }}
          sx={{ mb: 1 }}
        />
        <TextField fullWidth label="Title" value={buffer.title} onChange={e => {
          if (!isEditing) return;
          setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, title: e.target.value } });
        }} sx={{ mb: 1 }} error={missingTitle} helperText={missingTitle ? 'Required' : ''} InputProps={{ readOnly: !isEditing }} />
        <TextField fullWidth label="Subtitle" value={buffer.subtitle} onChange={e => {
          if (!isEditing) return;
          setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, subtitle: e.target.value } });
        }} sx={{ mb: 1 }} error={missingSubtitle} helperText={missingSubtitle ? 'Required' : ''} InputProps={{ readOnly: !isEditing }} />
        <TextField fullWidth label="Description" value={buffer.description} multiline onChange={e => {
          if (!isEditing) return;
          setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, description: e.target.value } });
        }} sx={{ mb: 1 }} error={missingDescription} helperText={missingDescription ? 'Required' : ''} InputProps={{ readOnly: !isEditing }} />
        <TextField fullWidth label="Image URL" value={buffer.image} onChange={e => {
          if (!isEditing) return;
          setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, image: e.target.value } });
        }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
        <TextField
          select
          fullWidth
          label="Category"
          value={buffer.category || (projectCategories.length > 0 ? (typeof projectCategories[0] === 'string' ? projectCategories[0] : projectCategories[0].name) : 'ai-ml')}
          onChange={e => {
            if (!isEditing) return;
            setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, category: e.target.value } });
          }}
          sx={{ mb: 1 }}
          SelectProps={{ native: true }}
          error={missingCategory}
          helperText={missingCategory ? 'Required' : ''}
          InputProps={{ readOnly: !isEditing }}
        >
            {projectCategories.map((c: any) => {
              const name = typeof c === 'string' ? c : (c.name || '');
              return (
                <option key={name} value={name}>{String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              );
            })}
        </TextField>
        <TextField
          fullWidth
          label="Tags (comma separated)"
          value={buffer.tags ? buffer.tags.join(', ') : ''}
          onChange={e => {
            if (!isEditing) return;
            setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) } });
          }}
          sx={{ mb: 1 }}
          InputProps={{ readOnly: !isEditing }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ mr: 2 }}>Featured</Typography>
          <input
            type="checkbox"
            checked={!!buffer.featured}
            disabled={!isEditing}
            onChange={e => {
              if (!isEditing) return;
              setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, featured: e.target.checked } });
            }}
            style={{ transform: 'scale(1.5)' }}
          />
        </Box>
        <TextField
          fullWidth
          label="Created At"
          type="date"
          value={buffer.createdAt ? buffer.createdAt.slice(0, 10) : ''}
          onChange={e => {
            if (!isEditing) return;
            setProjectEditBuffer({ ...projectEditBuffer, [proj.id || idx]: { ...buffer, createdAt: e.target.value } });
          }}
          sx={{ mb: 1 }}
          InputLabelProps={{ shrink: true }}
          InputProps={{ readOnly: !isEditing }}
        />
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 1, float: 'right', color: 'white', borderColor: 'white' }}
          onClick={() => {
            setProjectDeleteTarget({ idx, project: proj });
            setProjectDeleteDialogOpen(true);
          }}
        >
          Delete
        </Button>
        {isEditing ? (
          <Button
            variant="contained"
            // color="primary"
            size="small"
            sx={{ mt: 1, ml: 2, color: "white",        // text color
    borderColor: "white", }}
            onClick={async () => {
              setProjectsLoading(true);
              setProjectsError(null);
              setProjectsSuccess(null);
              try {
                let projToSave = { ...buffer };
                let media = projToSave.media && typeof projToSave.media === 'object' ? { ...projToSave.media } : { images: [], videos: [], diagrams: [], codeSnippets: [] };
                if (projToSave.image && typeof projToSave.image === 'string' && projToSave.image.trim()) {
                  media.images = Array.isArray(media.images) ? [...media.images] : [];
                  if (!media.images.includes(projToSave.image.trim())) {
                    media.images.unshift(projToSave.image.trim());
                  }
                }
                const payload = {
                  ...projToSave,
                  detailedDescription: projToSave.detailedDescription || projToSave.description || '',
                  technicalDetails: projToSave.technicalDetails || { technologies: [], methodologies: [], algorithms: [], datasets: [] },
                  educationalContent: mapEducationalToLegacy(projToSave.educationalContent || {}),
                  media,
                  publications: projToSave.publications || [],
                  githubUrl: projToSave.githubUrl || '',
                  demoUrl: projToSave.demoUrl || '',
                  category: projToSave.category,
                  createdAt: projToSave.createdAt
                };
                delete payload.id;
                if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
                  delete payload._id;
                }
                let savedProject;
                if (payload._id) {
                  await api.put(`/projects/${payload._id}`, payload);
                  savedProject = { ...projects[idx], ...buffer, _id: payload._id };
                } else {
                  // New project: persist to backend and use returned _id
                  const res = await api.post('/projects', payload);
                  savedProject = res.data?.data || res.data;
                }
                // Update local state with the saved project (with _id)
                const arr = [...projects];
                arr[idx] = savedProject;
                setProjects(arr);
                setEditingProjectId(null);
                setProjectEditBuffer((prev: any) => {
                  const copy = { ...prev };
                  delete copy[proj.id || idx];
                  return copy;
                });
                setProjectsSuccess('Project saved successfully!');
              } catch (error: any) {
                setProjectsError(error?.response?.data?.message || 'Failed to save project');
              } finally {
                setProjectsLoading(false);
              }
            }}
          >
            Save
          </Button>
        ) : (
                    <Button
                      variant="outlined"
                      // color="primary"
                      size="small"
                      sx={{ mt: 1, ml: 2, color: "white",        // text color
          borderColor: "white", }}
              onClick={() => {
                // Use the normalized id (prefer proj.id if present, otherwise fallback to index)
                setEditingProjectId(proj.id || idx);
                setProjectEditBuffer((prev: any) => ({ ...prev, [proj.id || idx]: { ...proj } }));
              }}
            >
              Edit
            </Button>
        )}
      </Box>
    );
  })}
        <Button variant="contained" color="primary" onClick={handleSaveProjects} disabled={projectsLoading}>Save Projects</Button>
        {/* Categories management dialog */}
        <Dialog open={categoriesDialogOpen} onClose={() => setCategoriesDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Manage Project Categories</DialogTitle>
          <DialogContent>
            {categoriesError && <Alert severity="error">{categoriesError}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <TextField fullWidth label="New category" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
              <Button variant="contained" onClick={handleAddCategory} disabled={categoriesLoading}>Add</Button>
            </Box>
            <Box sx={{ mt: 2 }}>
              {categoriesLoading && <CircularProgress size={20} />}
              {!categoriesLoading && projectCategories.length === 0 && <Typography>No categories yet.</Typography>}
              {!categoriesLoading && projectCategories.length > 0 && (
                <Box>
                      {projectCategories.map((c: any) => {
                        const name = typeof c === 'string' ? c : (c.name || '');
                        const id = c && (c._id || c.id);
                        const isEditing = id && editingCategoryId === String(id);
                        return (
                          <Box key={id || name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
                            {isEditing ? (
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                />
                                <Button size="small" variant="contained" onClick={() => handleUpdateCategory(String(id))} disabled={categoriesLoading}>Save</Button>
                                <Button size="small" variant="outlined" onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}>Cancel</Button>
                              </Box>
                            ) : (
                              <>
                                <Typography>{String(name).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                                {id ? (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button size="small" onClick={() => { setEditingCategoryId(String(id)); setEditingCategoryName(name); }}>Edit</Button>
                                    <Button size="small" color="error" onClick={() => handleDeleteCategory(id)}>Delete</Button>
                                  </Box>
                                ) : null}
                              </>
                            )}
                          </Box>
                        );
                      })}
                </Box>
              )}
          </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCategoriesDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* Project delete confirmation dialog */}
        <Dialog open={projectDeleteDialogOpen} onClose={cancelProjectDelete} fullWidth maxWidth="xs">
          <DialogTitle>Delete Project</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the project "{projectDeleteTarget?.project?.title || ''}"? This action cannot be undone.
            </DialogContentText>
            {projectDeleteLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={24} /></Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelProjectDelete} disabled={projectDeleteLoading}>Cancel</Button>
            <Button onClick={confirmProjectDelete} color="error" disabled={projectDeleteLoading}>Delete</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <Typography variant="h6">Edit Blogs</Typography>
        {blogsLoading && <CircularProgress sx={{ my: 2 }} />}
        {blogsError && <Alert severity="error">{blogsError}</Alert>}
        {blogsSuccess && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography color="success.main">{blogsSuccess}</Typography>
            </Paper>
          </Box>
        )}
        {blogsError && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#ffebee' }}>
              <Typography color="error.main">{blogsError}</Typography>
            </Paper>
          </Box>
        )}
        <Button variant="outlined" 
        // color="primary" 
        sx={{ mb: 2, color: "white",        // text color
    borderColor: "white", }} onClick={() => setBlogs([
          ...blogs,
          { id: Date.now(), uuid: uuidv4(), title: '', slug: '', excerpt: '', content: '', author: '', tags: [], category: 'technical', status: 'published', featuredImage: '', publishedAt: '', readTime: 0, views: 0, likes: 0 }
        ])}>
          Add New Blog
        </Button>
        {!blogsLoading && Array.isArray(blogs) && blogs.map((blog, idx) => {
          const isEditing = editingBlogId === (blog.id || idx);
          const buffer = isEditing ? (blogEditBuffer[blog.id || idx] || blog) : blog;
          const displayUuid = buffer.uuid || (blog && blog.uuid) || 'No UUID';
          const slug = (buffer.slug || '').trim().toLowerCase();
          const duplicateSlug = slug && blogs.some((b, i) => i !== idx && (b.slug || '').trim().toLowerCase() === slug);
          return (
            <Box key={blog.id || idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, position: 'relative' }}>
              <TextField
                fullWidth
                label="Blog UUID"
                value={displayUuid}
                InputProps={{ readOnly: true, style: { background: '#f3f3f3', fontWeight: '600' } }}
                sx={{ mb: 1 }}
              />
              <TextField fullWidth label="Title" value={buffer.title} onChange={e => {
                if (!isEditing) return;
                setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, title: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Slug" value={buffer.slug || ''} onChange={e => {
                if (!isEditing) return;
                setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, slug: e.target.value } });
              }} sx={{ mb: 1 }} error={!!duplicateSlug} helperText={duplicateSlug ? 'This slug is already taken. Please choose another.' : ''} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Excerpt" value={buffer.excerpt} onChange={e => {
                if (!isEditing) return;
                setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, excerpt: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <Box sx={{ mb: 1 }}>
                <RichTextEditor value={buffer.content || ''} onChange={v => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, content: v } });
                }} readOnly={!isEditing} />
              </Box>
              <TextField fullWidth label="Author" value={buffer.author || ''} onChange={e => {
                if (!isEditing) return;
                setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, author: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField
                fullWidth
                label="Tags (comma separated)"
                value={buffer.tags ? buffer.tags.join(', ') : ''}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) } });
                }}
                sx={{ mb: 1 }}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                select
                fullWidth
                label="Category"
                value={buffer.category || 'technical'}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, category: e.target.value } });
                }}
                sx={{ mb: 1 }}
                SelectProps={{ native: true }}
                InputProps={{ readOnly: !isEditing }}
              >
                <option value="technical">Technical</option>
                <option value="research">Research</option>
                <option value="tutorial">Tutorial</option>
                <option value="insights">Insights</option>
                <option value="news">News</option>
              </TextField>
              <TextField
                select
                fullWidth
                label="Status"
                value={buffer.status || 'draft'}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, status: e.target.value } });
                }}
                sx={{ mb: 1 }}
                SelectProps={{ native: true }}
                InputProps={{ readOnly: !isEditing }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </TextField>
              <TextField fullWidth label="Featured Image URL" value={buffer.featuredImage || ''} onChange={e => {
                if (!isEditing) return;
                setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, featuredImage: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              {buffer.featuredImage ? (
                <Box sx={{ mb: 1 }}>
                  <img src={buffer.featuredImage} alt="preview" style={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0e0e0' }} onError={(e: any) => { e.currentTarget.style.display = 'none'; }} />
                </Box>
              ) : null}
              <TextField
                fullWidth
                label="Published At"
                type="datetime-local"
                value={buffer.publishedAt ? buffer.publishedAt.slice(0, 16) : ''}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, publishedAt: e.target.value } });
                }}
                sx={{ mb: 1 }}
                InputLabelProps={{ shrink: true }}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                fullWidth
                label="Read Time (minutes)"
                type="number"
                value={buffer.readTime || ''}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, readTime: Number(e.target.value) } });
                }}
                sx={{ mb: 1 }}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                fullWidth
                label="Views"
                type="number"
                value={buffer.views || ''}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, views: Number(e.target.value) } });
                }}
                sx={{ mb: 1 }}
                InputProps={{ readOnly: !isEditing }}
              />
              <TextField
                fullWidth
                label="Likes"
                type="number"
                value={buffer.likes || ''}
                onChange={e => {
                  if (!isEditing) return;
                  setBlogEditBuffer({ ...blogEditBuffer, [blog.id || idx]: { ...buffer, likes: Number(e.target.value) } });
                }}
                sx={{ mb: 1 }}
                InputProps={{ readOnly: !isEditing }}
              />
              <Button
                variant="outlined"
                // color="error"
                size="small"
                sx={{ mt: 1, position: 'absolute', top: 8, right: 8, color: "white",        // text color
    borderColor: "white", }}
                onClick={async () => {
                  if (blog.id) {
                    try {
                      await api.delete(`/blog/${blog.id}`);
                      setBlogs(blogs.filter((b, i) => i !== idx));
                    } catch {
                      setBlogsError('Failed to delete blog');
                    }
                  } else {
                    setBlogs(blogs.filter((b, i) => i !== idx));
                  }
                }}
              >
                Delete
              </Button>
              {isEditing ? (
                <Button
                  variant="contained"
                  // color="primary"
                  size="small"
                  sx={{ mt: 1, ml: 2, color: "white",        // text color
    borderColor: "white", }}
                  onClick={async () => {
                    setBlogsLoading(true);
                    setBlogsError(null);
                    setBlogsSuccess(null);
                    try {
                      let blogToSave = { ...buffer };
                      let publishedAt = blogToSave.publishedAt;
                      if (publishedAt) {
                        const dateObj = new Date(publishedAt);
                        if (!isNaN(dateObj.getTime())) {
                          publishedAt = dateObj.toISOString();
                        } else {
                          publishedAt = '';
                        }
                      }
                      const allowedCategories = ['technical', 'research', 'tutorial', 'insights', 'news'];
                      const allowedStatus = ['draft', 'published', 'archived'];
                      const payload = {
                        ...blogToSave,
                        uuid: blogToSave.uuid || uuidv4(),
                        slug: (blogToSave.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, ''),
                        readTime: Math.max(1, Number(blogToSave.readTime) || 1),
                        category: allowedCategories.includes(blogToSave.category) ? blogToSave.category : 'technical',
                        status: allowedStatus.includes(blogToSave.status) ? blogToSave.status : 'published',
                        publishedAt
                      };
                      delete payload.id;
                      if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
                        delete payload._id;
                      }
                      let savedBlog: any = null;
                      if (payload._id) {
                        const res = await api.put(`/blog/${payload._id}`, payload);
                        savedBlog = res.data?.data || res.data;
                      } else {
                        const res = await api.post('/blog', payload);
                        savedBlog = res.data?.data || res.data;
                      }
                      // Update local state with server-returned document (includes _id and persisted fields)
                      const arr = [...blogs];
                      arr[idx] = { ...arr[idx], ...savedBlog, id: savedBlog._id || savedBlog.id, uuid: savedBlog.uuid || arr[idx].uuid || uuidv4() };
                      setBlogs(arr);
                      setEditingBlogId(null);
                      setBlogEditBuffer((prev: any) => {
                        const copy = { ...prev };
                        delete copy[blog.id || idx];
                        return copy;
                      });
                      setBlogsSuccess('Blog saved successfully!');
                    } catch (error: any) {
                      setBlogsError(error?.response?.data?.message || 'Failed to save blog');
                    } finally {
                      setBlogsLoading(false);
                    }
                  }}
                >
                  Save
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  // color="primary"
                  size="small"
                  sx={{ mt: 1, ml: 2, color: "white",        // text color
    borderColor: "white", }}
                  onClick={() => {
                    setEditingBlogId(blog.id || idx);
                    setBlogEditBuffer((prev: any) => ({ ...prev, [blog.id || idx]: { ...blog } }));
                  }}
                >
                  Edit
                </Button>
              )}
            </Box>
          );
        })}
        {/* Disable save if any duplicate slugs exist */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveBlogs}
          disabled={blogsLoading || blogs.some((blog, idx) => {
            const slug = (blog.slug || '').trim().toLowerCase();
            return slug && blogs.some((b, i) => i !== idx && (b.slug || '').trim().toLowerCase() === slug);
          })}
        >
          Save Blogs
        </Button>
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <Typography variant="h6">Edit FAQs</Typography>
        {faqsLoading && <CircularProgress sx={{ my: 2 }} />}
        {faqsError && <Alert severity="error">{faqsError}</Alert>}
        {faqsSuccess && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography color="success.main">{faqsSuccess}</Typography>
            </Paper>
          </Box>
        )}
        {faqsError && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#ffebee' }}>
              <Typography color="error.main">{faqsError}</Typography>
            </Paper>
          </Box>
        )}
        <Button variant="outlined" 
        // color="primary" 
        sx={{ mb: 2, color: "white", borderColor: "white" }} onClick={() => setFaqs([
          ...faqs,
          { id: Date.now(), question: '', answer: '', category: '', order: faqs.length + 1, isActive: true }
        ])}>
          Add New FAQ
        </Button>
        {Array.isArray(faqs) && faqs.map((faq, idx) => {
          const isEditing = editingFaqId === (faq.id || idx);
          const buffer = isEditing ? (faqEditBuffer[faq.id || idx] || faq) : faq;
          return (
            <Box key={faq.id || idx} sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2 }}>
              <TextField fullWidth label="Question" value={buffer.question} onChange={e => {
                if (!isEditing) return;
                setFaqEditBuffer({ ...faqEditBuffer, [faq.id || idx]: { ...buffer, question: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Answer" value={buffer.answer} onChange={e => {
                if (!isEditing) return;
                setFaqEditBuffer({ ...faqEditBuffer, [faq.id || idx]: { ...buffer, answer: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Category" value={buffer.category} onChange={e => {
                if (!isEditing) return;
                setFaqEditBuffer({ ...faqEditBuffer, [faq.id || idx]: { ...buffer, category: e.target.value } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Order" type="number" value={buffer.order || ''} onChange={e => {
                if (!isEditing) return;
                setFaqEditBuffer({ ...faqEditBuffer, [faq.id || idx]: { ...buffer, order: Number(e.target.value) } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              <TextField fullWidth label="Active" value={buffer.isActive ? 'Yes' : 'No'} onChange={e => {
                if (!isEditing) return;
                setFaqEditBuffer({ ...faqEditBuffer, [faq.id || idx]: { ...buffer, isActive: e.target.value === 'Yes' } });
              }} sx={{ mb: 1 }} InputProps={{ readOnly: !isEditing }} />
              {isEditing ? (
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 1, ml: 2, color: "white", borderColor: "white" }}
                  onClick={async () => {
                    setFaqsLoading(true);
                    setFaqsError(null);
                    setFaqsSuccess(null);
                    try {
                      const faqToSave = { ...buffer };
                      const payload = { ...faqToSave };
                      delete payload.id;
                      if (payload._id && (typeof payload._id !== 'string' || payload._id.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(payload._id))) {
                        delete payload._id;
                      }
                      if (payload._id) {
                        await api.put(`/faq/${payload._id}`, payload);
                      } else {
                        await api.post('/faq', payload);
                      }
                      // Update local state
                      const arr = [...faqs];
                      arr[idx] = { ...arr[idx], ...buffer };
                      setFaqs(arr);
                      setEditingFaqId(null);
                      setFaqEditBuffer((prev: any) => {
                        const copy = { ...prev };
                        delete copy[faq.id || idx];
                        return copy;
                      });
                      setFaqsSuccess('FAQ saved successfully!');
                    } catch (error: any) {
                      setFaqsError(error?.response?.data?.message || 'Failed to save FAQ');
                    } finally {
                      setFaqsLoading(false);
                    }
                  }}
                >
                  Save
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, ml: 2, color: "white", borderColor: "white" }}
                  onClick={() => {
                    setEditingFaqId(faq.id || idx);
                    setFaqEditBuffer((prev: any) => ({ ...prev, [faq.id || idx]: { ...faq } }));
                  }}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1, ml: 2, color: 'white', borderColor: 'white' }}
                onClick={() => {
                  setFaqDeleteTarget({ idx, faq });
                  setFaqDeleteDialogOpen(true);
                }}
              >
                Delete
              </Button>
            </Box>
          );
        })}
        <Button variant="contained" color="primary" onClick={handleSaveFaqs} disabled={faqsLoading}>Save FAQs</Button>
        {/* FAQ delete confirmation dialog */}
        <Dialog open={faqDeleteDialogOpen} onClose={cancelFaqDelete} fullWidth maxWidth="xs">
          <DialogTitle>Delete FAQ</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the FAQ "{faqDeleteTarget?.faq?.question || ''}"? This action cannot be undone.
            </DialogContentText>
            {faqsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={24} /></Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelFaqDelete} disabled={faqsLoading}>Cancel</Button>
            <Button onClick={handleConfirmDeleteFaq} color="error" disabled={faqsLoading}>Delete</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
      <TabPanel value={tab} index={3}>
        <Typography variant="h6">Edit About</Typography>
        <Typography variant="subtitle1">Basic Information</Typography>
        <TextField fullWidth label="Name" value={editingAbout ? aboutEditBuffer.name : about.name || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, name: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
        <TextField fullWidth label="Title" value={editingAbout ? aboutEditBuffer.title : about.title || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, title: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Profile Bio</Typography>
        <TextField fullWidth label="Bio" value={editingAbout ? aboutEditBuffer.bio : about.bio || ''} multiline rows={3} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, bio: e.target.value })} sx={{ mb: 2 }} InputProps={{ readOnly: !editingAbout }} />
        <TextField fullWidth label="Bio Description" value={editingAbout ? aboutEditBuffer.bioDescription : about.bioDescription || ''} multiline rows={3} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, bioDescription: e.target.value })} sx={{ mb: 3 }} InputProps={{ readOnly: !editingAbout }} />

        <TextField fullWidth label="Profile Picture URL" value={editingAbout ? aboutEditBuffer.profilePicture : about.profilePicture || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, profilePicture: e.target.value })} sx={{ mb: 1 }} helperText="Paste an image URL to use as the profile picture (optional)" InputProps={{ readOnly: !editingAbout }} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => editingAbout && handleProfilePicFile(e.target.files ? e.target.files[0] : null)}
        />
        <Box mt={1} display="flex" alignItems="center" sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => editingAbout && fileInputRef.current && fileInputRef.current.click()}
            disabled={!editingAbout || uploadingPicture}
          >
            {uploadingPicture ? 'Uploading...' : 'Upload Image'}
          </Button>
          <Box ml={2}>
            <Typography variant="body2">Or paste a direct image URL above.</Typography>
          </Box>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Contact Information</Typography>
        <TextField fullWidth label="Email" value={editingAbout ? aboutEditBuffer.email : about.email || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, email: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
        <TextField fullWidth label="Location" value={editingAbout ? aboutEditBuffer.location : about.location || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, location: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
        <TextField fullWidth label="GitHub Profile URL" value={editingAbout ? aboutEditBuffer.github : about.github || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, github: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
        <TextField fullWidth label="LinkedIn Profile URL" value={editingAbout ? aboutEditBuffer.linkedin : about.linkedin || ''} onChange={e => editingAbout && setAboutEditBuffer({ ...aboutEditBuffer, linkedin: e.target.value })} sx={{ mb: 3 }} InputProps={{ readOnly: !editingAbout }} />
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Education</Typography>
        {(editingAbout ? aboutEditBuffer.education : about.education).map((edu: any, idx: number) => (
          <Box key={idx as number} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Education #{(idx as number) + 1}</Typography>
              {editingAbout && (
                <Button size="small" color="error" onClick={() => {
                  const arr = [...aboutEditBuffer.education];
                  arr.splice(idx, 1);
                  setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
                }}>Delete</Button>
              )}
            </Box>
            <TextField fullWidth label="Degree" value={edu.degree} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.education]; arr[idx].degree = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Institution" value={edu.institution} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.education]; arr[idx].institution = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Year" value={edu.year} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.education]; arr[idx].year = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Description" value={edu.description} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.education]; arr[idx].description = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
          </Box>
        ))}
        {editingAbout && (
          <Button variant="outlined" color="primary" sx={{ mb: 3 }} onClick={() => {
            const arr = [...aboutEditBuffer.education];
            arr.push({ degree: '', institution: '', year: '', description: '' });
            setAboutEditBuffer({ ...aboutEditBuffer, education: arr });
          }}>+ Add Education</Button>
        )}
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Experience</Typography>
        {(editingAbout ? aboutEditBuffer.experience : about.experience).map((exp: any, idx: number) => (
          <Box key={idx as number} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">Experience #{(idx as number) + 1}</Typography>
              {editingAbout && (
                <Button size="small" color="error" onClick={() => {
                  const arr = [...aboutEditBuffer.experience];
                  arr.splice(idx, 1);
                  setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
                }}>Delete</Button>
              )}
            </Box>
            <TextField fullWidth label="Title" value={exp.title} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.experience]; arr[idx].title = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Organization" value={exp.organization} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.experience]; arr[idx].organization = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Period" value={exp.period} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.experience]; arr[idx].period = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
            <TextField fullWidth label="Description" value={exp.description} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.experience]; arr[idx].description = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
            }} sx={{ mb: 1 }} InputProps={{ readOnly: !editingAbout }} />
          </Box>
        ))}
        {editingAbout && (
          <Button variant="outlined" color="primary" sx={{ mb: 3 }} onClick={() => {
            const arr = [...aboutEditBuffer.experience];
            arr.push({ title: '', organization: '', period: '', description: '' });
            setAboutEditBuffer({ ...aboutEditBuffer, experience: arr });
          }}>+ Add Experience</Button>
        )}
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Research Interests</Typography>
        {(editingAbout ? aboutEditBuffer.researchInterests : about.researchInterests).map((interest: string, idx: number) => (
          <Box key={idx as number} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField fullWidth label={`Interest #${(idx as number) + 1}`} value={interest} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.researchInterests]; arr[idx] = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, researchInterests: arr });
            }} InputProps={{ readOnly: !editingAbout }} />
            {editingAbout && (
              <Button size="small" color="error" onClick={() => {
                const arr = [...aboutEditBuffer.researchInterests];
                arr.splice(idx, 1);
                setAboutEditBuffer({ ...aboutEditBuffer, researchInterests: arr });
              }}>Delete</Button>
            )}
          </Box>
        ))}
        {editingAbout && (
          <Button variant="outlined" color="primary" sx={{ mb: 3 }} onClick={() => {
            const arr = [...aboutEditBuffer.researchInterests];
            arr.push('');
            setAboutEditBuffer({ ...aboutEditBuffer, researchInterests: arr });
          }}>+ Add Research Interest</Button>
        )}
        
        <Typography variant="subtitle1" sx={{ mt: 3 }}>Achievements</Typography>
        {(editingAbout ? aboutEditBuffer.achievements : about.achievements)?.map((ach: string, idx: number) => (
          <Box key={idx as number} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField fullWidth label={`Achievement #${(idx as number) + 1}`} value={ach} onChange={e => {
              if (!editingAbout) return;
              const arr = [...aboutEditBuffer.achievements]; arr[idx] = e.target.value; setAboutEditBuffer({ ...aboutEditBuffer, achievements: arr });
            }} InputProps={{ readOnly: !editingAbout }} />
            {editingAbout && (
              <Button size="small" color="error" onClick={() => {
                const arr = [...aboutEditBuffer.achievements];
                arr.splice(idx, 1);
                setAboutEditBuffer({ ...aboutEditBuffer, achievements: arr });
              }}>Delete</Button>
            )}
          </Box>
        ))}
        {editingAbout && (
          <Button variant="outlined" color="primary" sx={{ mb: 3 }} onClick={() => {
            const arr = [...(aboutEditBuffer.achievements || [])];
            arr.push('');
            setAboutEditBuffer({ ...aboutEditBuffer, achievements: arr });
          }}>+ Add Achievement</Button>
        )}
        
        {editingAbout ? (
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={async () => {
            try {
              // Save About to backend via PUT /api/about
              await api.put('/about', aboutEditBuffer);
              setAbout(aboutEditBuffer);
              setEditingAbout(false);
            } catch (error) {
              console.error('Failed to save about:', error);
              // Optionally show error message
            }
          }}>Save</Button>
        ) : (
          <Button variant="outlined" 
          // color="primary" 
          sx={{ mt: 2, color: "white",        // text color
    borderColor: "white", }} onClick={() => {
            setEditingAbout(true);
            setAboutEditBuffer(about);
          }}>Edit</Button>
        )}
      </TabPanel>
      <TabPanel value={tab} index={4}>
        <Typography variant="h6">Edit Contact Form Defaults</Typography>
        {contactLoading && <CircularProgress sx={{ my: 2 }} />}
        {contactSuccess && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography color="success.main">{contactSuccess}</Typography>
            </Paper>
          </Box>
        )}
        {contactError && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#ffebee' }}>
              <Typography color="error.main">{contactError}</Typography>
            </Paper>
          </Box>
        )}
        {!contactLoading && <>
          <TextField fullWidth label="Name" value={editingContact ? contactEditBuffer.name : contact.name} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, name: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Email" value={editingContact ? contactEditBuffer.email : contact.email} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, email: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Organization" value={editingContact ? contactEditBuffer.organization : contact.organization} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, organization: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Role/Position" value={editingContact ? contactEditBuffer.role : contact.role} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, role: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Subject" value={editingContact ? contactEditBuffer.subject : contact.subject} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, subject: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Message" value={editingContact ? contactEditBuffer.message : contact.message} multiline onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, message: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField
            select
            fullWidth
            label="Inquiry Type"
            value={editingContact ? contactEditBuffer.type : contact.type}
            onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, type: e.target.value })}
            sx={{ mb: 1 }}
            SelectProps={{ native: true }}
            InputProps={{ readOnly: !editingContact }}
          >
            <option value="general">General Inquiry</option>
            <option value="collaboration">Research Collaboration</option>
            <option value="recruitment">Recruitment Opportunity</option>
            <option value="academic">Academic Discussion</option>
            <option value="technical">Technical Question</option>
          </TextField>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Contact Information</Typography>
          <TextField fullWidth label="Email" value={editingContact ? contactEditBuffer.infoEmail : contact.infoEmail || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, infoEmail: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Location" value={editingContact ? contactEditBuffer.infoLocation : contact.infoLocation || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, infoLocation: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Institution" value={editingContact ? contactEditBuffer.infoInstitution : contact.infoInstitution || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, infoInstitution: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Lab" value={editingContact ? contactEditBuffer.infoLab : contact.infoLab || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, infoLab: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <Typography variant="subtitle1" sx={{ mt: 2 }}>Response Times</Typography>
          <TextField fullWidth label="General Inquiries" value={editingContact ? contactEditBuffer.responseGeneral : contact.responseGeneral || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, responseGeneral: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Research Collaboration" value={editingContact ? contactEditBuffer.responseCollab : contact.responseCollab || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, responseCollab: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Technical Questions" value={editingContact ? contactEditBuffer.responseTech : contact.responseTech || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, responseTech: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <Typography variant="subtitle1" sx={{ mt: 2 }}>'What I'm Looking For'</Typography>
          <TextField fullWidth label="Research Collaborations" value={editingContact ? contactEditBuffer.lookingCollab : contact.lookingCollab || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, lookingCollab: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Industry Opportunities" value={editingContact ? contactEditBuffer.lookingIndustry : contact.lookingIndustry || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, lookingIndustry: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Academic Discussions" value={editingContact ? contactEditBuffer.lookingAcademic : contact.lookingAcademic || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, lookingAcademic: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          <TextField fullWidth label="Internship Programs" value={editingContact ? contactEditBuffer.lookingInternship : contact.lookingInternship || ''} onChange={e => editingContact && setContactEditBuffer({ ...contactEditBuffer, lookingInternship: e.target.value })} sx={{ mb: 1 }} InputProps={{ readOnly: !editingContact }} />
          {editingContact ? (
            <Button variant="contained" 
            color="primary" sx={{ mt: 2 }} onClick={async () => {
              try {
                // Save Contact Settings to backend via PUT /api/contact/settings
                await api.put('/contact/settings', contactEditBuffer);
                setContact(contactEditBuffer);
                setEditingContact(false);
              } catch (error) {
                console.error('Failed to save contact settings:', error);
                // Optionally handle error
              }
            }} disabled={contactLoading}>Save</Button>
          ) : (
            <Button variant="outlined" 
            // color="primary" 
            sx={{ mt: 2, color: "white",        // text color
    borderColor: "white", }} onClick={() => {
              setEditingContact(true);
              setContactEditBuffer(contact);
            }}>Edit</Button>
          )}
        </>}
      </TabPanel>
      <TabPanel value={tab} index={5}>
        <Typography variant="h6">Edit Research Areas</Typography>
        {researchAreasLoading && <CircularProgress sx={{ my: 2 }} />}
        {researchAreasError && <Alert severity="error">{researchAreasError}</Alert>}
        {researchAreasSuccess && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#e8f5e9' }}>
              <Typography color="success.main">{researchAreasSuccess}</Typography>
            </Paper>
          </Box>
        )}
        {researchAreasError && (
          <Box sx={{ mb: 2 }}>
            <Paper elevation={3} sx={{ p: 2, backgroundColor: '#ffebee' }}>
              <Typography color="error.main">{researchAreasError}</Typography>
            </Paper>
          </Box>
        )}
        <Button variant="outlined" 
        // color="primary" 
        sx={{ mb: 2, color: "white",        // text color
    borderColor: "white", }} onClick={() => setResearchAreas([...researchAreas, { title: '', description: '' }])}>
          Add New Research Area
        </Button>
        {!researchAreasLoading && researchAreas.map((area, idx) => (
          (() => {
            const key = String(("_id" in area && area._id) ? area._id : idx);
            return (
              <Box key={key}
                draggable
                onDragStart={(e) => { setDragIndex(idx); e.dataTransfer?.setData('text/plain', String(idx)); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = dragIndex !== null ? dragIndex : Number(e.dataTransfer?.getData('text/plain'));
                  const to = idx;
                  if (typeof from === 'number' && from !== to) {
                    const arr = [...researchAreas];
                    const [moved] = arr.splice(from, 1);
                    arr.splice(to, 0, moved);
                    setResearchAreas(arr);
                    // Persist new order immediately
                    handleSaveResearchAreas(arr);
                    setDragIndex(null);
                  }
                }}
                className={dragIndex === idx ? styles.draggingItem : undefined}
                sx={{ mb: 3, p: 2, border: '1px solid #eee', borderRadius: 2, position: 'relative', cursor: 'move' }}>
                {/* Drag handle for accessibility and visual affordance */}
                <span
                  className={styles.dragHandle}
                  role="button"
                  tabIndex={0}
                  aria-label={`Drag ${area.title || 'research area'} to reorder`}
                  aria-grabbed={dragIndex === idx}
                  onKeyDown={(e) => {
                    // Allow keyboard reordering with ArrowUp/ArrowDown
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      const from = idx;
                      const to = e.key === 'ArrowUp' ? Math.max(0, idx - 1) : Math.min(researchAreas.length - 1, idx + 1);
                      if (from !== to) {
                        const arr = [...researchAreas];
                        const [moved] = arr.splice(from, 1);
                        arr.splice(to, 0, moved);
                        setResearchAreas(arr);
                        // Persist immediately
                        handleSaveResearchAreas(arr);
                      }
                    }
                  }}
                >
                  <span className={styles.dragHandleIcon} aria-hidden="true">
                    {/* simple 3-bar icon */}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" /></svg>
                  </span>
                  <span className={styles.visuallyHidden}>Drag handle. Press Arrow Up or Arrow Down to move this item.</span>
                </span>
                <TextField fullWidth label="Title" value={editingResearchAreaId === key ? (researchAreaEditBuffer[key]?.title ?? area.title) : area.title} onChange={e => {
                  if (editingResearchAreaId !== key) return;
                  setResearchAreaEditBuffer({ ...researchAreaEditBuffer, [key]: { ...researchAreaEditBuffer[key], title: e.target.value } });
                }} sx={{ mb: 1 }} InputProps={{ readOnly: editingResearchAreaId !== key }} />
                <TextField fullWidth label="Description" value={editingResearchAreaId === key ? (researchAreaEditBuffer[key]?.description ?? area.description) : area.description} multiline onChange={e => {
                  if (editingResearchAreaId !== key) return;
                  setResearchAreaEditBuffer({ ...researchAreaEditBuffer, [key]: { ...researchAreaEditBuffer[key], description: e.target.value } });
                }} sx={{ mb: 1 }} InputProps={{ readOnly: editingResearchAreaId !== key }} />
                {editingResearchAreaId === key ? (
                  <>
                    <Button variant="contained" 
                    // color="primary" 
                    size="small" sx={{ mt: 1, ml: 2, color: "white", borderColor: "white" }} onClick={async () => {
                      try {
                        const arr = [...researchAreas];
                        const buffer = researchAreaEditBuffer[key];
                        const payload = { ...arr[idx], ...buffer, order: idx };
                        if ('_id' in payload && payload._id) {
                          await api.put(`/research-areas/${payload._id}`, payload);
                        } else {
                          await api.post('/research-areas', payload);
                        }
                        arr[idx] = { ...arr[idx], ...buffer, order: idx };
                        setResearchAreas(arr);
                      } catch (error) {
                        // Optionally handle error
                      } finally {
                        setEditingResearchAreaId(null);
                        setResearchAreaEditBuffer((prev: any) => {
                          const copy = { ...prev };
                          delete copy[key];
                          return copy;
                        });
                      }
                    }}>Save</Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      sx={{ mt: 1, ml: 2 }}
                      onClick={() => { setDeleteTarget({ idx, area }); setDeleteDialogOpen(true); }}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outlined" 
                    // color="primary" 
                    size="small" sx={{ mt: 1, ml: 2, color: "white", borderColor: "white" }} onClick={() => {
                      setEditingResearchAreaId(key);
                      setResearchAreaEditBuffer((prev: any) => ({ ...prev, [key]: { ...area } }));
                    }}>Edit</Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      sx={{ mt: 1, ml: 2 }}
                      onClick={() => { setDeleteTarget({ idx, area }); setDeleteDialogOpen(true); }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </Box>
            );
          })()
        ))}
  <Button variant="contained" color="primary" onClick={() => handleSaveResearchAreas()} disabled={researchAreasLoading}>Save Research Areas</Button>
        {/* Delete confirmation dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          aria-labelledby="delete-research-area-dialog-title"
        >
          <DialogTitle id="delete-research-area-dialog-title">Delete Research Area</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the research area "{deleteTarget?.area?.title || ''}"? This action cannot be undone.
            </DialogContentText>
            {researchAreasLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}><CircularProgress size={24} /></Box>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} disabled={researchAreasLoading}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" disabled={researchAreasLoading}>Delete</Button>
          </DialogActions>
        </Dialog>
      </TabPanel>
      <TabPanel value={tab} index={6}>
        <ProjectDetailsTab projects={projects} onAddProject={onAddProject} onEditProject={onEditProject} onDeleteProject={onDeleteProject} />
      </TabPanel>
      <TabPanel value={tab} index={7}>
        <AdminBlogDetail />
      </TabPanel>
      <TabPanel value={tab} index={8}>
        <AdminKnowledgeBaseTab />
      </TabPanel>
      <TabPanel value={tab} index={9}>
        <AdminTopicsTab />
      </TabPanel>
      <TabPanel value={tab} index={10}>
        <AdminTopicDetailsTab />
      </TabPanel>
      <TabPanel value={tab} index={11}>
        <AdminUsersTab />
      </TabPanel>
    </Paper>
  );
}

export default Admin;
