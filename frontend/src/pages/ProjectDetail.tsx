import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  Card,
  CardContent,
} from '@mui/material';
import {
  GitHub,
  Launch,
  CheckCircle,
  Code,
  Article,
  VideoLibrary,
  ArrowBack,
  PlayArrow,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useVisitTracker } from '../hooks/useVisitTracker';
import api from '../api';
import type { Project as ProjectType } from '../types/Project';
import type { ConceptBlock } from '../types/Project';
import ReactMarkdown from 'react-markdown';
import CodeExecutor from '../components/CodeEditor/CodeExecutor';

const AnimatedBox = motion(Box);

// Types
type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanations: string[];
};

type QuizLevel = 'beginner' | 'intermediate' | 'advanced';

type QuizData = {
  [key in QuizLevel]: QuizQuestion[];
};

// Mock quizzes data structure
const mockQuizzes: QuizData = {
  beginner: [
    {
      question: "What is biomarker discovery?",
      options: [
        "Finding new biological indicators",
        "Testing existing markers",
        "Studying diseases",
        "None of the above"
      ],
      answer: 0,
      explanations: [
        "Correct! Biomarker discovery involves finding new biological indicators.",
        "Incorrect. Testing existing markers is different from discovery.",
        "Incorrect. While related, this is too broad.",
        "Incorrect. Biomarker discovery is about finding new indicators."
      ]
    }
  ],
  intermediate: [
    {
      question: "Which technique is most commonly used in biomarker analysis?",
      options: ["Mass spectrometry", "Microscopy", "DNA sequencing", "PCR"],
      answer: 0,
      explanations: [
        "Correct! Mass spectrometry is a key technique in biomarker analysis.",
        "Incorrect. While useful, microscopy is not the primary technique.",
        "Incorrect. DNA sequencing is more relevant to genomics.",
        "Incorrect. PCR is more relevant to genetic analysis."
      ]
    }
  ],
  advanced: [
    {
      question: "What is proteomics?",
      options: ["Study of proteins", "Study of genes", "Study of cells", "Study of tissues"],
      answer: 0,
      explanations: [
        "Correct! Proteomics is the large-scale study of proteins.",
        "Incorrect. The study of genes is genomics.",
        "Incorrect. The study of cells is cytology.",
        "Incorrect. The study of tissues is histology."
      ]
    }
  ]
};
const AnimatedCard = motion(Card);

// Shared quiz state for all levels
const useSharedQuizState = (numQuestions: number) => {
  const [selected, setSelected] = useState<{ [key: number]: number | null }>({});
  // Handler to select an option for a question (syncs across levels)
  const handleSelect = (qIdx: number, optIdx: number) => {
    setSelected(prev => ({ ...prev, [qIdx]: optIdx }));
  };
  return { selected, handleSelect };
};

// Quiz component for interactive feedback, now independent per level
const Quiz = ({ questions }: { questions: QuizQuestion[] }) => {
  const [selections, setSelections] = useState<{ [key: number]: number | null }>({});
  
  if (!questions || questions.length === 0) {
    return (
      <Typography color="text.secondary">
        No questions available for this level.
      </Typography>
    );
  }

  return (
    <Box>
{questions.map((q, idx) => (
  <Box key={idx} sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>{idx + 1}. {q.question}</Typography>
    {q.options.map((opt, oidx) => {
      const isSelected = selections[idx] === oidx;
      const isCorrect = oidx === q.answer;

      return (
        <Button
          key={oidx}
          variant="contained"
          sx={(theme) => ({
            m: 0.5,
            backgroundColor:
              typeof selections[idx] === 'undefined'
                ? theme.palette.primary.main
                : isSelected
                ? isCorrect
                  ? theme.palette.success.main
                  : theme.palette.error.main
                : theme.palette.action.disabledBackground,
            color: typeof selections[idx] === 'undefined' ? '#ffffff' : '#ffffff',
            '&:hover': {
              opacity: 0.85,
            },
          })}
          onClick={() =>
            setSelections((prev) => ({ ...prev, [idx]: oidx }))
          }
        >
          {opt}
        </Button>
      );
    })}
    {typeof selections[idx] !== 'undefined' && (
      <Typography variant="body2" sx={(theme) => ({ mt: 1, color: selections[idx] === q.answer ? theme.palette.success.main : theme.palette.error.main, fontWeight: 600 })}>
        {q.explanations[selections[idx] as number]}
      </Typography>
    )}
  </Box>
))}
    </Box>
  );
};

// Render ConceptBlock[] as inline content
function renderConceptBlocks(blocks: ConceptBlock[] | string | undefined, theme: { palette: { mode: 'light' | 'dark' } }) {
  if (!blocks) return null;
  let arr: ConceptBlock[] = [];
  if (typeof blocks === 'string') {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(blocks);
      if (Array.isArray(parsed)) arr = parsed;
      else arr = [{ type: 'text', content: blocks }];
    } catch {
      arr = [{ type: 'text', content: blocks }];
    }
  } else {
    arr = blocks;
  }
  const isDark = theme.palette.mode === 'dark';
  return arr.map((block, idx) => {
    if (block.type === 'text') {
      return (
        <Box key={idx} sx={{ mb: 2 }}>
          <ReactMarkdown
            components={{
              h1: (props: any) => <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }} {...props} />,
              h2: (props: any) => <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }} {...props} />,
              h3: (props: any) => <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }} {...props} />,
              p: (props: any) => <Typography variant="body1" sx={{ mb: 2 }} {...props} />,
              ul: (props: any) => <ul style={{ marginLeft: 24, marginBottom: 12 }}>{props.children}</ul>,
              ol: (props: any) => <ol style={{ marginLeft: 24, marginBottom: 12 }}>{props.children}</ol>,
              li: (props: any) => <li style={{ marginBottom: 6 }}>{props.children}</li>,
              strong: (props: any) => <strong style={{ fontWeight: 700 }}>{props.children}</strong>,
              em: (props: any) => <em style={{ fontStyle: 'italic' }}>{props.children}</em>,
              blockquote: (props: any) => <blockquote style={{ borderLeft: `4px solid ${isDark ? '#475569' : '#ccc'}`, margin: '12px 0', padding: '8px 16px', color: isDark ? '#cbd5e1' : '#555', background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f9f9f9' }}>{props.children}</blockquote>,
              code: (props: any) => <code style={{ background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#eee', color: isDark ? '#f1f5f9' : 'inherit', borderRadius: 4, padding: '2px 6px', fontSize: '90%' }}>{props.children}</code>,
            }}
          >
            {block.content}
          </ReactMarkdown>
        </Box>
      );
    }
    if (block.type === 'image' || block.type === 'diagram') {
      return <Box key={idx} sx={{ my: 2, textAlign: 'center' }}><img src={block.url} alt={block.type} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, boxShadow: '0 2px 8px #0002' }} /></Box>;
    }
    if (block.type === 'video') {
      // YouTube embed support
      const ytMatch = typeof block.url === 'string' && block.url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
      if (ytMatch) {
        const videoId = ytMatch[1];
        return (
          <Box key={idx} sx={{ my: 2, textAlign: 'center' }}>
            <iframe
              width="480"
              height="270"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ borderRadius: 8, boxShadow: '0 2px 8px #0002', background: '#000' }}
            />
          </Box>
        );
      }
      // Vimeo embed support
      const vimeoMatch = typeof block.url === 'string' && block.url.match(/vimeo.com\/(\d+)/);
      if (vimeoMatch) {
        const vimeoId = vimeoMatch[1];
        return (
          <Box key={idx} sx={{ my: 2, textAlign: 'center' }}>
            <iframe
              title={`Vimeo video ${vimeoId}`}
              src={`https://player.vimeo.com/video/${vimeoId}`}
              width="480"
              height="270"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 8, boxShadow: '0 2px 8px #0002', background: '#000' }}
            />
          </Box>
        );
      }
      // Default: direct video file
      return <Box key={idx} sx={{ my: 2, textAlign: 'center' }}><video src={block.url} controls style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 8, boxShadow: '0 2px 8px #0002', background: '#000' }} /></Box>;
    }
    return null;
  });
}

const ProjectDetail: React.FC = () => {
  const theme = useTheme();

  // State declarations (order matters!)
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [lessonProgress, setLessonProgress] = useState<{ [level: string]: boolean[] }>({});
  const [tabValue, setTabValue] = useState(0);
  const [level, setLevel] = useState<QuizLevel>('beginner');
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuizzes, setCurrentQuizzes] = useState<QuizQuestion[]>([]);
  const [showCodeExecutor, setShowCodeExecutor] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Track page visit
  useVisitTracker();

  // Helper to safely read educationalContent level (handles stringified/malformed shapes)
  const getEC = (p: ProjectType | null, lvl: QuizLevel) => {
    if (!p) return null as any;
    let ec: any = (p as any).educationalContent;
    if (typeof ec === 'string') {
      try { ec = JSON.parse(ec); } catch { ec = null; }
    }
    if (!ec || typeof ec !== 'object') return null as any;
    const res = ec[lvl];
    if (!res || typeof res !== 'object') return null as any;
    return res as any;
  };

  // Derived value (must be after state)
  const currentContent = getEC(project, level);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lessonProgress');
    if (saved) setLessonProgress(JSON.parse(saved));
  }, []);

  // Save progress to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lessonProgress', JSON.stringify(lessonProgress));
  }, [lessonProgress]);

  // Mark lesson as completed when viewed
  useEffect(() => {
    if (!currentContent?.concepts) return;
    const arr = lessonProgress[level] || Array(currentContent.concepts.length).fill(false);
    if (!arr[selectedLessonIdx]) {
      const updated = { ...lessonProgress, [level]: [...arr] };
      updated[level][selectedLessonIdx] = true;
      setLessonProgress(updated);
    }
    // If number of lessons changes, adjust array
    if (arr.length !== currentContent.concepts.length) {
      const newArr = Array(currentContent.concepts.length).fill(false);
      for (let i = 0; i < Math.min(arr.length, newArr.length); i++) newArr[i] = arr[i];
      setLessonProgress({ ...lessonProgress, [level]: newArr });
    }
    // eslint-disable-next-line
  }, [selectedLessonIdx, currentContent, level]);

  // Update quizzes when level or project changes
  useEffect(() => {
    const quizzes = getEC(project, level)?.quizzes ?? [];
    setCurrentQuizzes(quizzes);
  }, [level, project]);
  
  // Effect to fetch project data
  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/projects/${id}`)
        .then(res => {
          if (res.data?.success) {
            setProject(res.data.data);
            setError(null);
            // Handle registration required message
            if (res.data.requireRegistration) {
              setError('Please register or log in to continue viewing projects.');
            }
          } else {
            setError('Project not found. Please check the URL or return to the projects page.');
          }
        })
        .catch(err => {
          const msg = err.response?.data?.message || 'Error loading project details. Please try again.';
          setError(msg);
          console.error('Error loading project:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);



  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleLevelChange = (newLevel: 'beginner' | 'intermediate' | 'advanced') => {
    setLevel(newLevel);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !project) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Project not found. Please check the URL or return to the projects page.'}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Container>
    );
  }


  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Project Header */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/projects')}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Back to Projects
        </Button>
      </Box>

      <AnimatedBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            mb: 3,
            color: theme.palette.primary.contrastText,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            boxShadow: theme.shadows[4],
          })}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            {project?.title || 'Untitled Project'}
          </Typography>
          <Typography variant="h6" color="inherit" paragraph sx={{ opacity: 0.95, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
            {project?.description || 'No description available'}
          </Typography>
          <Box sx={{ mb: 1 }}>
            {project?.technologies?.map((tech) => (
              <Chip key={tech} label={tech} sx={{ mr: 1, mb: 1 }} color="secondary" />
            )) || []}
          </Box>
        </Box>
      </AnimatedBox>

      {/* Project Links */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {project?.links?.github && (
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<GitHub />}
              color="primary"
              href={project.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Source
            </Button>
          </Grid>
        )}
        {project?.links?.demo && (
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Launch />}
              color="primary"
              href={project.links.demo}
              target="_blank"
              rel="noopener noreferrer"
            >
              Live Demo
            </Button>
          </Grid>
        )}
        {project?.links?.documentation && (
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<Article />}
              color="primary"
              href={project.links.documentation}
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </Button>
          </Grid>
        )}
      </Grid>

      {/* Level Selection */}
  <Paper sx={{ mb: 4 }}>
    <Tabs
      value={level}
      onChange={(_e, v) => handleLevelChange(v as any)}
      variant="fullWidth"
      sx={(theme) => ({
        bgcolor: theme.palette.primary.main,
        '& .MuiTab-root': {
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          transition: 'color 0.3s ease',
        },
        '& .Mui-selected': {
          color: '#ffffff',
        },
        '& .MuiTabs-indicator': {
          backgroundColor: theme.palette.secondary.main,
          height: 3,
        },
      })}
    >
      <Tab value="beginner" label="Beginner" />
      <Tab value="intermediate" label="Intermediate" />
      <Tab value="advanced" label="Advanced" />
    </Tabs>
  </Paper>

{/* Content Tabs */}
<Box sx={{ mb: 4 }}>
  <Tabs
    value={tabValue}
    onChange={handleTabChange}
    sx={(theme) => ({
      mb: 2,
      '& .MuiTab-root': {
        color: theme.palette.text.secondary,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'color 0.3s ease',
      },
      '& .Mui-selected': {
        color: theme.palette.primary.main,
        fontWeight: 700,
      },
      '& .MuiTabs-indicator': {
        backgroundColor: theme.palette.primary.main,
        height: 3,
      },
    })}
  >
    <Tab label="Overview" />
    <Tab label="Learn" />
    <Tab label="Resources" />
    <Tab label="Practice" />
  </Tabs>
</Box>


      {/* Tab Content */}
      {project ? (
        <AnimatedBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {!currentContent ? (
            <Alert severity="info">No content available for the {level} level.</Alert>
          ) : (
            <>
              {/* Overview Tab */}
              {tabValue === 0 && (
                <Box>
                  <Typography variant="body1" paragraph>
                    {currentContent.overview || 'No overview available.'}
                  </Typography>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Prerequisites
                    </Typography>
                    <List>
                      {currentContent.prerequisites?.map((item: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="success" />
                          </ListItemIcon>
                          <ListItemText primary={item} />
                        </ListItem>
                      )) || []}
                    </List>
                  </Box>
                </Box>
              )}

              {/* Learn Tab */}
              {tabValue === 1 && (
                <Box sx={(theme) => ({ display: 'flex', minHeight: 400, background: theme.palette.background.default, borderRadius: 2, boxShadow: theme.shadows[1] })}>
                  {/* Sidebar Navigation */}
                  <Box sx={(theme) => ({ width: 300, borderRight: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper, p: 2, display: 'flex', flexDirection: 'column' })}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Lessons</Typography>
                    <List>
                      {currentContent.concepts?.map((concept: any, idx: number) => (
                        <ListItem
                          button
                          key={idx}
                          selected={idx === selectedLessonIdx}
                          onClick={() => setSelectedLessonIdx(idx)}
                          sx={(theme) => ({ borderRadius: 1, mb: 1, bgcolor: idx === selectedLessonIdx ? theme.palette.action.selected : 'inherit' })}
                        >
                          <ListItemIcon>
                            {lessonProgress[level]?.[idx] ? (
                              <CheckCircle color={idx === selectedLessonIdx ? 'primary' : 'success'} />
                            ) : (
                              <PlayArrow color={idx === selectedLessonIdx ? 'primary' : 'disabled'} />
                            )}
                          </ListItemIcon>
                          <ListItemText primary={concept.title} />
                        </ListItem>
                      ))}
                      {/* Progress bar */}
                      {currentContent.concepts?.length > 0 && (
                        <Box sx={{ mt: 2, px: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: {lessonProgress[level]?.filter(Boolean).length || 0} / {currentContent.concepts.length} lessons completed
                          </Typography>
                          <Box sx={(theme) => ({ width: '100%', height: 8, background: theme.palette.action.disabledBackground, borderRadius: 4, mt: 0.5 })}>
                            <Box sx={(theme) => ({ width: `${((lessonProgress[level]?.filter(Boolean).length || 0) / currentContent.concepts.length) * 100}%`, height: 8, background: theme.palette.primary.main, borderRadius: 4 })} />
                          </Box>
                        </Box>
                      )}
                    </List>
                  </Box>
                  {/* Main Lesson Content */}
                  <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    {currentContent.concepts && currentContent.concepts.length > 0 ? (
                      (() => {
                        const lesson = currentContent.concepts[selectedLessonIdx] || {};
                        return (
                          <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {lesson.title}
                              </Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Code />}
                                onClick={() => setShowCodeExecutor(!showCodeExecutor)}
                                size="small"
                              >
                                {showCodeExecutor ? 'Hide' : 'Code'}
                              </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <Box sx={{ mb: 3 }}>
                              {renderConceptBlocks(lesson.description, theme)}
                            </Box>
                            {showCodeExecutor && (
                              <Box sx={{ mt: 3, pt: 3, borderTop: `2px solid ${theme.palette.divider}` }}>
                                <CodeExecutor />
                              </Box>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <Typography color="text.secondary">No lessons available for this level.</Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Resources Tab */}
              {tabValue === 2 && (
                <Grid container spacing={3}>
                  {currentContent.resources?.map((resource: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <AnimatedCard whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            {resource.type === 'video' && <VideoLibrary color="primary" />}
                            {resource.type === 'article' && <Article color="secondary" />}
                            {resource.type === 'code' && <Code color="success" />}
                            <Typography variant="h6" sx={{ ml: 1 }}>
                              {resource.title}
                            </Typography>
                          </Box>
                          <Button variant="contained" color="primary" href={resource.url} target="_blank" rel="noopener noreferrer" fullWidth>
                            View Resource
                          </Button>
                        </CardContent>
                      </AnimatedCard>
                    </Grid>
                  )) || []}
                </Grid>
              )}

              {/* Practice Tab */}
              {tabValue === 3 && (
                <Box sx={(theme) => ({ p: 3, bgcolor: theme.palette.background.paper, borderRadius: 2, border: `1px solid ${theme.palette.divider}` })}>
                  <Typography variant="h5" sx={(theme) => ({ fontWeight: 700, mb: 3, color: theme.palette.primary.main })}>
                    Knowledge Check
                  </Typography>
                  {currentQuizzes.length > 0 ? (
                    <Quiz questions={currentQuizzes} />
                  ) : (
                    <Typography color="text.secondary">
                      No practice questions available for this level.
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}
        </AnimatedBox>
      ) : (
        <Alert severity="error">Project not found</Alert>
      )}
    </Container>
  );
};

export default ProjectDetail;
