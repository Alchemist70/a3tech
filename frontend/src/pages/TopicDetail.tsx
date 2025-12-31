
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, CircularProgress, Paper, Divider, Tabs, Tab, Button, useTheme } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeExecutor from '../components/CodeEditor/CodeExecutor';

interface Topic {
  _id?: string;
  id?: string;
  subjectId: string;
  name: string;
  slug?: string;
  description?: string;
  content?: string;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  codeSnippets?: { code: string; language: string }[];
  uuid?: string;
}

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
}

interface ContentBlock {
  type: 'text' | 'image' | 'diagram' | 'video';
  value: string;
}

interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'code';
}

interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanations: string[];
}

interface Lesson {
  title: string;
  content: string;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  codeSnippets?: { code: string; language: string }[];
  contentBlocks?: ContentBlock[];
  resources?: Resource[];
  quizzes?: Quiz[];
}

interface TopicDetailType {
  _id?: string;
  id?: string;
  topicUUID: string;
  subjectId: string;
  slug?: string;
  description?: string;
  content?: string;
  images?: string[];
  videos?: string[];
  diagrams?: string[];
  codeSnippets?: { code: string; language: string }[];
  lessons?: Lesson[];
  resources?: Resource[];
  quizzes?: Quiz[];
}

// Helper to render embed similar to ProjectDetail's logic (YouTube/Vimeo/direct/other)
const renderVideoEmbed = (url: string, width: string | number = '100%', height: number | string = 270) => {
  if (!url) return null;

  const ytMatch = typeof url === 'string' && url.match(/(?:youtu.be\/|youtube.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`;
    return <EmbedIframeWithFallback src={embedUrl} youtubeId={videoId} width={width} height={height} />;
  }

  const vimeoMatch = typeof url === 'string' && url.match(/vimeo.com\/(\d+)/);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[1];
    const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
    return <EmbedIframeWithFallback src={embedUrl} vimeoId={vimeoId} width={width} height={height} />;
  }

  // Detect direct video files and HLS
  const isDirect = /\.(mp4|webm|ogg|m4v|mov)(\?|$)/i.test(url) || url.startsWith('blob:') || url.startsWith('data:');
  const isHls = /\.m3u8(\?|$)/i.test(url);
  if (isHls || isDirect) {
    return <video src={url} controls style={{ width: '100%', borderRadius: 8 }} />;
  }

  // Generic embeddable URL (e.g., veed.io, streamable, etc.) — attempt iframe embed with fallback
  return <EmbedIframeWithFallback src={url} width={width} height={height} />;
};

// Component: iframe with load/timeout detection and YouTube thumbnail + retry fallback
const EmbedIframeWithFallback: React.FC<{
  src: string;
  youtubeId?: string | null;
  vimeoId?: string | null;
  width?: string | number;
  height?: string | number;
}> = ({ src, youtubeId, vimeoId, width = '100%', height = 270 }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'failed'>('idle');
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Start loading only when playing (user requested) or for non-YouTube/Vimeo cases
    if (!playing && youtubeId) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    let mounted = true;
    const timeout = window.setTimeout(() => {
      if (mounted && status === 'loading') setStatus('failed');
    }, 2500);
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, playing]);

  const onLoad = () => setStatus('loaded');

  // YouTube thumbnail URL when available
  const ytThumb = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : undefined;
  const watchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : src;

  if (status === 'failed') {
    // For YouTube, show thumbnail + retry + open in YouTube
      if (youtubeId) {
        return (
          <Box sx={{ maxWidth: 480, width: '100%' }}>
            {ytThumb && (
              <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                <Box component="img" src={ytThumb} alt="YouTube thumbnail" sx={{ width: '100%', display: 'block' }} />
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 0, height: 0, borderLeft: '22px solid #fff', borderTop: '14px solid transparent', borderBottom: '14px solid transparent' }} />
                  </Box>
                </Box>
              </Box>
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button variant="outlined" size="small" onClick={() => { setPlaying(true); setStatus('loading'); }}>Retry embed</Button>
              <Button variant="outlined" size="small" href={watchUrl} target="_blank" rel="noopener noreferrer">Open in YouTube</Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>If embedding is disabled by the video owner, the video cannot play inside the site.</Typography>
          </Box>
        );
      }
    // For Vimeo, just prompt to open in new tab
    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      return (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Embed blocked — opening in new tab is required.</Typography>
          <Button variant="outlined" size="small" href={embedUrl} target="_blank" rel="noopener noreferrer">Open in new tab</Button>
        </Box>
      );
    }
  }

  // If it's a YouTube video and not yet playing, show thumbnail + play button
  if (youtubeId && !playing) {
    return (
      <Box sx={{ maxWidth: 480, width: '100%' }}>
        {ytThumb && (
          <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }} onClick={() => setPlaying(true)}>
            <Box component="img" src={ytThumb} alt="YouTube thumbnail" sx={{ width: '100%', display: 'block' }} />
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ width: 0, height: 0, borderLeft: '22px solid #fff', borderTop: '14px solid transparent', borderBottom: '14px solid transparent' }} />
              </Box>
            </Box>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setPlaying(true)}>Play</Button>
          <Button variant="outlined" size="small" href={watchUrl} target="_blank" rel="noopener noreferrer">Open in YouTube</Button>
        </Box>
      </Box>
    );
  }

  // Loading or loaded: render iframe
  return (
    <Box>
      <iframe ref={iframeRef} width={width} height={height} src={src} title="Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ borderRadius: 8 }} onLoad={onLoad} />
      <Box sx={{ mt: 1 }}>
        <Button variant="outlined" size="small" href={src} target="_blank" rel="noopener noreferrer">Open in new tab</Button>
      </Box>
    </Box>
  );
};

const TopicDetail: React.FC = () => {
  const { subjectSlug, topicSlug, detailSlug } = useParams<{ subjectSlug: string; topicSlug: string; detailSlug: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topicDetail, setTopicDetail] = useState<TopicDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  // State for selected lesson in Learn tab
  const [selectedLesson, setSelectedLesson] = React.useState(0);
  const [showCodeExecutor, setShowCodeExecutor] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [subjectsRes, topicsRes, detailsRes] = await Promise.all([
          import('../api').then(mod => mod.default.get('/knowledge-base/subjects', { withCredentials: true })),
          import('../api').then(mod => mod.default.get('/topics', { withCredentials: true })),
          import('../api').then(mod => mod.default.get('/topic-details', { withCredentials: true }))
        ]);
        const subjectsData = subjectsRes?.data || [];
        const topicsData = topicsRes?.data || [];
        const detailsData = detailsRes?.data || [];
        const foundSubject = Array.isArray(subjectsData)
          ? subjectsData.find((s: Subject) => s.slug === subjectSlug)
          : null;
        setSubject(foundSubject || null);
        const foundTopic = foundSubject && Array.isArray(topicsData)
          ? topicsData.find((t: Topic) => t.slug === topicSlug && t.subjectId === (foundSubject._id || foundSubject.id))
          : null;
        setTopic(foundTopic || null);
        // Only try to match detail if topic and topic.uuid exist
        let foundDetail: TopicDetailType | null = null;
        if (foundTopic && Array.isArray(detailsData)) {
          if (detailSlug) {
            foundDetail = detailsData.find((d: TopicDetailType) => d.topicUUID === foundTopic.uuid && d.slug === detailSlug) || null;
          } else {
            // no detailSlug provided: try to find any TopicDetail for this topic (prefer matching slug if available)
            foundDetail = detailsData.find((d: TopicDetailType) => d.topicUUID === foundTopic.uuid) || null;
          }
        }
        setTopicDetail(foundDetail || null);
      } catch {
        setSubject(null);
        setTopic(null);
        setTopicDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subjectSlug, topicSlug, detailSlug]);

  // Tabs for navigation (Overview, Learn, Resources, Practice)
  const [tab, setTab] = React.useState(0);
  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  // Create a safe 'td' object that always provides arrays/strings so JSX can access without null checks.
  const td: TopicDetailType = topicDetail || {
    topicUUID: topic?.uuid || '',
    subjectId: topic?.subjectId || '',
    slug: detailSlug || '',
    description: '',
    content: topic?.content || '',
    images: [],
    videos: [],
    diagrams: [],
    codeSnippets: [],
    lessons: [],
    resources: [],
    quizzes: []
  } as TopicDetailType;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 }, mb: { xs: 3, sm: 4, md: 6 } }}>
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          ← Go Back
        </Button>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="primary" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Home</Link>
          <Link underline="hover" color="primary" onClick={() => navigate('/knowledge-base')} sx={{ cursor: 'pointer' }}>Knowledge Base</Link>
          {subject && (
            <Link underline="hover" color="primary" onClick={() => navigate(`/knowledge-base/${subject.slug}`)} sx={{ cursor: 'pointer' }}>{subject.name}</Link>
          )}
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>{topic?.name || 'Topic Details'}</Typography>
        </Breadcrumbs>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : !topic ? (
        <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 6 }}>
          Topic not found.
        </Typography>
      ) : (
        <Paper elevation={2} sx={(theme) => ({ borderRadius: 2, p: { xs: 2, sm: 3, md: 4 }, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` })}>
          <Tabs value={tab} onChange={handleTabChange} sx={(theme) => ({
            mb: 4,
            '& .MuiTab-root': {
              color: theme.palette.text.secondary,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            },
            '& .Mui-selected': {
              color: theme.palette.primary.main,
              fontWeight: 700,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
            },
          })}>
            <Tab label="Overview" />
            <Tab label="Learn" />
            <Tab label="Resources" />
            <Tab label="Practice" />
          </Tabs>
          {tab === 0 && (
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }} color="primary.main">
                {topic.name}
              </Typography>
              {td.description ? (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                  {td.description}
                </Typography>
              ) : topic.content ? (
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
                  {topic.content}
                </Typography>
              ) : null}
              <Divider sx={{ my: 3 }} />
              {td.content ? (
                <Box sx={{ fontSize: 18, lineHeight: 1.7, mb: 3 }}>
                  <ReactMarkdown>{td.content}</ReactMarkdown>
                </Box>
              ) : topic.content ? (
                <Box sx={{ fontSize: 18, lineHeight: 1.7, mb: 3 }}>
                  <ReactMarkdown>{topic.content}</ReactMarkdown>
                </Box>
              ) : null}
              {/* Images */}
              {Array.isArray(td.images) && td.images.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                  {td.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`topic-img-${idx}`} style={{ width: '100%', maxWidth: 320, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  ))}
                </Box>
              )}
              {/* Diagrams */}
              {Array.isArray(td.diagrams) && td.diagrams.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                  {td.diagrams.map((img, idx) => (
                    <img key={idx} src={img} alt={`diagram-${idx}`} style={{ maxWidth: 320, borderRadius: 8, border: '2px dashed #0b5ed7', background: '#f8f9fa' }} />
                  ))}
                </Box>
              )}
              {/* Videos */}
              {Array.isArray(td.videos) && td.videos.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                  {td.videos.map((vid, idx) => (
                    <Box key={idx} sx={{ maxWidth: 480, width: '100%' }}>
                      <Box sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', overflow: 'hidden', background: '#000' }}>
                        {renderVideoEmbed(vid, 480, 270)}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
              {/* Code Snippets */}
              {Array.isArray(td.codeSnippets) && td.codeSnippets.length > 0 && (
                <Box sx={{ my: 3 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>Code Examples</Typography>
                  {td.codeSnippets.map((snip, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <SyntaxHighlighter language={snip.language || 'javascript'} style={theme.palette.mode === 'dark' ? materialDark : materialLight} customStyle={{ borderRadius: 8, fontSize: 16 }}>
                        {snip.code}
                      </SyntaxHighlighter>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {/* You can expand Learn, Resources, Practice tabs as needed */}
          {tab === 1 && (
            <Box sx={(theme) => ({ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 400, background: theme.palette.background.default, borderRadius: 2, boxShadow: 1 })}>
              {/* Sidebar Lessons List */}
              <Box sx={(theme) => ({ width: { xs: '100%', md: 300 }, borderRight: { xs: 'none', md: `1px solid ${theme.palette.divider}` }, borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' }, background: theme.palette.background.paper, p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column' })}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, mt: 1, pl: 1 }}>Lessons</Typography>
                {Array.isArray(td.lessons) && td.lessons.length > 0 ? (
                  <>
                    {td.lessons.map((lesson, idx) => (
                      <Box key={idx} sx={{ mb: 1 }}>
                        <Button
                          fullWidth
                          variant={idx === selectedLesson ? 'contained' : 'outlined'}
                          color={idx === selectedLesson ? 'primary' : 'inherit'}
                          sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: idx === selectedLesson ? 700 : 500, borderRadius: 2, mb: 0.5 }}
                          onClick={() => setSelectedLesson(idx)}
                        >
                          {lesson.title}
                        </Button>
                      </Box>
                    ))}
                    {/* Progress Bar */}
                    <Box sx={{ mt: 3, px: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Progress: {Math.min(selectedLesson + 1, td.lessons.length)} / {td.lessons.length} lessons completed
                      </Typography>
                      <Box sx={(theme) => ({ width: '100%', height: 8, bgcolor: theme.palette.action.disabledBackground, borderRadius: 4 })}>
                        <Box sx={{ width: `${((selectedLesson + 1) / td.lessons.length) * 100}%`, height: 8, bgcolor: 'success.main', borderRadius: 4 }} />
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                    No lessons available.
                  </Typography>
                )}
              </Box>
              {/* Main Lesson Content */}
                <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {Array.isArray(td.lessons) && td.lessons.length > 0 && td.lessons[selectedLesson] ? (
                  (() => {
                    const lesson = td.lessons[selectedLesson];
                    return <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h4" fontWeight={700}>{lesson.title}</Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => setShowCodeExecutor(!showCodeExecutor)}
                          size="small"
                        >
                          {showCodeExecutor ? 'Hide Code' : 'Code'}
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {/* Render lesson content blocks if present, else fallback to content string */}
                      {Array.isArray(lesson.contentBlocks) && lesson.contentBlocks.length > 0 ? (
                        <Box>
                          {lesson.contentBlocks.map((block: ContentBlock, idx: number) => (
                            <Box key={idx} sx={{ mb: 2 }}>
                              {block.type === 'text' && (
                                <Box sx={{ fontSize: 18, lineHeight: 1.7 }}>
                                  <ReactMarkdown>{block.value}</ReactMarkdown>
                                </Box>
                              )}
                    {block.type === 'image' && <img src={block.value} alt="" style={{ maxWidth: 320, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />}
                              {block.type === 'diagram' && (
                                <Box
                                  component="img"
                                  src={block.value}
                                  alt="diagram"
                                  sx={(theme) => ({
                                    maxWidth: 320,
                                    borderRadius: 8,
                                    border: `2px dashed ${theme.palette.mode === 'dark' ? theme.palette.primary.light : '#90caf9'}`,
                                    background: theme.palette.background.paper
                                  })}
                                />
                              )}
                              {block.type === 'video' && (
                                <Box sx={{ maxWidth: 480, width: '100%' }}>
                                  <Box sx={{ borderRadius: 8, boxShadow: '0 2px 8px #0002', overflow: 'hidden', background: '#000' }}>
                                    {renderVideoEmbed(block.value, '100%', 270)}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ fontSize: 18, lineHeight: 1.7, mb: 3 }}>
                          <ReactMarkdown>{lesson.content}</ReactMarkdown>
                        </Box>
                      )}
                      {/* Images */}
                      {Array.isArray(lesson.images) && lesson.images.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                          {lesson.images.map((img, idx) => (
                            <img key={idx} src={img} alt={`lesson-img-${idx}`} style={{ maxWidth: 320, borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                          ))}
                        </Box>
                      )}
                      {/* Diagrams */}
                      {Array.isArray(lesson.diagrams) && lesson.diagrams.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                          {lesson.diagrams.map((img, idx) => (
                            <Box
                              key={idx}
                              component="img"
                              src={img}
                              alt={`lesson-diagram-${idx}`}
                              sx={(theme) => ({
                                maxWidth: 320,
                                borderRadius: 8,
                                border: `2px dashed ${theme.palette.mode === 'dark' ? theme.palette.primary.light : '#90caf9'}`,
                                background: theme.palette.background.paper
                              })}
                            />
                          ))}
                        </Box>
                      )}
                      {/* Videos */}
                      {Array.isArray(lesson.videos) && lesson.videos.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 2 }}>
                          {lesson.videos.map((vid, idx) => (
                            <Box key={idx} sx={{ maxWidth: 480, width: '100%' }}>
                              <Box sx={{ borderRadius: 8, boxShadow: '0 2px 8px #0002', overflow: 'hidden', background: '#000' }}>
                                {renderVideoEmbed(vid, 480, 270)}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {/* Code Snippets */}
                      {Array.isArray(lesson.codeSnippets) && lesson.codeSnippets.length > 0 && (
                        <Box sx={{ my: 3 }}>
                          <Typography variant="h6" sx={{ mb: 1 }}>Code Examples</Typography>
                          {lesson.codeSnippets.map((snip, idx) => (
                            <Box key={idx} sx={{ mb: 2 }}>
                              <SyntaxHighlighter language={snip.language || 'javascript'} style={theme.palette.mode === 'dark' ? materialDark : materialLight} customStyle={{ borderRadius: 8, fontSize: 16 }}>
                                {snip.code}
                              </SyntaxHighlighter>
                            </Box>
                          ))}
                        </Box>
                      )}
                      {showCodeExecutor && (
                        <Box sx={(theme) => ({ mt: 3, pt: 3, borderTop: `2px solid ${theme.palette.divider}` })}>
                          <CodeExecutor />
                        </Box>
                      )}
                    </>;
                  })()
                ) : (
                  <Typography variant="body1" color="text.secondary">No lesson selected.</Typography>
                )}
              </Box>
            </Box>
          )}
  {/* // State for selected lesson in Learn tab
  const [selectedLesson, setSelectedLesson] = React.useState(0); */}
          {tab === 2 && (
            <Box>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Resources for {topic.name}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                {Array.isArray(td.resources) && td.resources.length > 0 ? (
                  td.resources.map((resource, idx) => (
                    <Paper key={idx} elevation={2} sx={{ p: 2, borderRadius: 3, minWidth: 280, maxWidth: 340, flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {resource.type === 'article' && <span style={{ color: '#d32f2f', fontSize: 28, marginRight: 8 }}>📄</span>}
                        {resource.type === 'video' && <span style={{ color: '#1976d2', fontSize: 28, marginRight: 8 }}>📺</span>}
                        {resource.type === 'code' && <span style={{ color: '#388e3c', fontSize: 28, marginRight: 8 }}> &lt;/&gt; </span>}
                        <Typography variant="subtitle1" fontWeight={600}>{resource.title}</Typography>
                      </Box>
                      <Button variant="outlined" color="primary" href={resource.url} target="_blank" rel="noopener noreferrer" sx={{ mt: 1, alignSelf: 'stretch' }}>
                        View Resource
                      </Button>
                    </Paper>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary">No resources available.</Typography>
                )}
              </Box>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Practice: {topic.name}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Array.isArray(td.quizzes) && td.quizzes.length > 0 ? (
                  td.quizzes.map((quiz, idx) => (
                    <Box key={idx} sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>Knowledge Check</Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>{idx + 1}. {quiz.question}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        {quiz.options.map((opt, oidx) => (
                          <Button key={oidx} variant="contained" sx={{ background: '#1976d2', color: '#fff', fontWeight: 600, borderRadius: 2, px: 2, mb: 1, '&:hover': { background: '#1565c0' } }}
                            onClick={e => {
                              const btn = e.currentTarget;
                              const parent = btn.parentElement?.parentElement;
                              if (!parent) return;
                              // Remove previous feedback
                              const prev = parent.querySelector('.quiz-feedback');
                              if (prev) prev.remove();
                              // Show feedback
                              const feedback = document.createElement('div');
                              feedback.className = 'quiz-feedback';
                              feedback.style.marginTop = '8px';
                              feedback.style.fontWeight = 'bold';
                              feedback.style.color = (oidx === quiz.answer) ? '#388e3c' : '#d32f2f';
                              feedback.textContent = (oidx === quiz.answer)
                                ? (quiz.explanations[oidx] || 'Correct!')
                                : (quiz.explanations[oidx] || 'Incorrect.');
                              parent.appendChild(feedback);
                            }}
                          >{opt}</Button>
                        ))}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary">No practice activities available.</Typography>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default TopicDetail;
