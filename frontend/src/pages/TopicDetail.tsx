
import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Breadcrumbs, Link, CircularProgress, Paper, Divider, Tabs, Tab, Button, useTheme, Table as MuiTable, TableHead, TableBody, TableRow, TableCell, Card, CardContent, Grid } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CodeExecutor from '../components/CodeEditor/CodeExecutor';
import jsPDF from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

interface Topic {
  _id?: string;
  id?: string;
  subjectId?: string;
  sectionId?: string;
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
  type: 'text' | 'image' | 'diagram' | 'video' | 'table' | 'chart';
  value: string;
}

interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'code';
}

interface Quiz {
  question: string;
  options?: string[];
  answer?: number;
  explanations?: string[];
  tables?: Table[];
  charts?: Chart[];
  images?: any[];
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

interface Table {
  title: string;
  headers: string[];
  rows: string[][];
  description?: string;
  rowExplanations?: string[];
}

interface Chart {
  title: string;
  type: 'bar' | 'pie' | 'histogram' | 'line';
  labels: string[];
  labelExplanations?: string[];
  labelFormat?: 'percentage' | 'degrees';
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
  description?: string;
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
  tables?: Table[];
  charts?: Chart[];
  resources?: Resource[];
  quizzes?: Quiz[];
}

// Normalize chart objects loaded from backend so older entries still render correctly.
const normalizeChart = (raw: any) => {
  if (!raw) return { title: '', type: 'bar', labels: [], datasets: [], description: '' } as any;
  const chart = { ...raw } as any;
  chart.type = chart.type || 'bar';
  chart.title = chart.title || '';
  chart.description = chart.description || '';
  chart.labelFormat = chart.labelFormat || 'percentage';

  const tryParseArray = (v: any) => {
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') {
      const s = v.trim();
      // try JSON.parse first (handles stringified arrays and nested encodings)
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p;
      } catch (e) {
        // ignore
      }
      // strip surrounding quotes if double encoded like '"[... ]"'
      if (s.startsWith('"') && s.endsWith('"')) {
        const inner = s.slice(1, -1).trim();
        try { const p2 = JSON.parse(inner); if (Array.isArray(p2)) return p2; } catch (e) {}
      }
      // fallback to comma-separated
      if (s.includes(',')) return s.split(',').map((x: string) => x.trim());
      return [s];
    }
    return [];
  };

  // ensure labels array (handle JSON-encoded or CSV strings)
  if (!Array.isArray(chart.labels)) {
    chart.labels = tryParseArray(chart.labels || '');
  }

  // normalize datasets
  chart.datasets = Array.isArray(chart.datasets) ? chart.datasets.map((ds: any) => {
    const nds: any = { ...ds };
    // normalize data to numeric array (support JSON-encoded arrays or CSV)
    if (!Array.isArray(nds.data)) {
      if (typeof nds.data === 'string') {
        const parsed = tryParseArray(nds.data);
        nds.data = parsed.map((n: any) => Number(n) || 0);
      } else {
        nds.data = [];
      }
    } else {
      nds.data = nds.data.map((n: any) => Number(n) || 0);
    }
    // normalize colors (backgroundColor / borderColor) to arrays when appropriate
    if (typeof nds.backgroundColor === 'string' || Array.isArray(nds.backgroundColor)) {
      const parsed = tryParseArray(nds.backgroundColor || '');
      // if tryParseArray returns single value array and original was single color string, preserve as string
      if (Array.isArray(parsed) && parsed.length > 1) nds.backgroundColor = parsed;
      else if (Array.isArray(parsed) && parsed.length === 1 && typeof nds.backgroundColor === 'string' && nds.backgroundColor.includes(',')) nds.backgroundColor = parsed;
      else if (Array.isArray(parsed) && parsed.length === 1 && Array.isArray(nds.backgroundColor)) nds.backgroundColor = parsed;
      else if (Array.isArray(parsed) && parsed.length === 1 && typeof parsed[0] === 'string') nds.backgroundColor = parsed[0];
    }
    if (typeof nds.borderColor === 'string' || Array.isArray(nds.borderColor)) {
      const parsedB = tryParseArray(nds.borderColor || '');
      if (Array.isArray(parsedB) && parsedB.length > 1) nds.borderColor = parsedB;
      else if (Array.isArray(parsedB) && parsedB.length === 1 && typeof nds.borderColor === 'string' && nds.borderColor.includes(',')) nds.borderColor = parsedB;
      else if (Array.isArray(parsedB) && parsedB.length === 1 && Array.isArray(nds.borderColor)) nds.borderColor = parsedB;
      else if (Array.isArray(parsedB) && parsedB.length === 1 && typeof parsedB[0] === 'string') nds.borderColor = parsedB[0];
    }
    return nds;
  }) : [];
  return chart;
};

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
  
  return (
    <Box
      ref={iframeRef}
      component="iframe"
      src={src}
      sx={{
        width,
        height,
        border: 'none',
        borderRadius: 2,
        backgroundColor: '#000',
      }}
      title="Embedded content"
    />
  );
};

const TopicDetail: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectSlug, sectionSlug, topicSlug, detailSlug } = useParams<{ subjectSlug?: string; sectionSlug?: string; topicSlug?: string; detailSlug?: string }>();
  const contentType = (location?.pathname || '').split('/')?.[1] || '';
  
  // Use sectionSlug for WAEC/JAMB, subjectSlug for KB
  const categorySlug = contentType === 'waec' || contentType === 'jamb' ? sectionSlug : subjectSlug;

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [topicDetail, setTopicDetail] = useState<TopicDetailType | null>(null);
  const [selectedLesson, setSelectedLesson] = React.useState(0);
  const [showCodeExecutor, setShowCodeExecutor] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let subjectsRes, topicsRes, detailsRes;
        
        if (contentType === 'waec') {
          [subjectsRes, topicsRes, detailsRes] = await Promise.all([
            import('../api').then(mod => mod.default.get('/waec-sections', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/waec-topics', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/waec-topic-details', { withCredentials: true }))
          ]);
        } else if (contentType === 'jamb') {
          [subjectsRes, topicsRes, detailsRes] = await Promise.all([
            import('../api').then(mod => mod.default.get('/jamb-sections', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/jamb-topics', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/jamb-topic-details', { withCredentials: true }))
          ]);
        } else {
          [subjectsRes, topicsRes, detailsRes] = await Promise.all([
            import('../api').then(mod => mod.default.get('/knowledge-base/subjects', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/topics', { withCredentials: true })),
            import('../api').then(mod => mod.default.get('/topic-details', { withCredentials: true }))
          ]);
        }
        
        const subjectsData = subjectsRes?.data || [];
        const topicsData = topicsRes?.data || [];
        const detailsData = detailsRes?.data || [];
        
        // Normalize response shapes
        const normalizedSubjects = Array.isArray(subjectsData) ? subjectsData : (Array.isArray(subjectsData?.data) ? subjectsData.data : []);
        const normalizedTopics = Array.isArray(topicsData) ? topicsData : (Array.isArray(topicsData?.data) ? topicsData.data : []);
        const normalizedDetails = Array.isArray(detailsData) ? detailsData : (Array.isArray(detailsData?.data) ? detailsData.data : []);
        
        const foundSubject = normalizedSubjects.find((s: Subject) => s.slug === categorySlug) || null;
        setSubject(foundSubject);
        
        const foundTopic = foundSubject && normalizedTopics
          ? normalizedTopics.find((t: Topic) => {
              const subjectMatch = (foundSubject._id || foundSubject.id);
              const topicSubjectId = t.subjectId || t.sectionId;
              return t.slug === topicSlug && topicSubjectId === subjectMatch;
            })
          : null;
        setTopic(foundTopic || null);
        
        // Only try to match detail if topic and topic.uuid exist
        let foundDetail: TopicDetailType | null = null;
        if (foundTopic && normalizedDetails) {
          if (detailSlug) {
            foundDetail = normalizedDetails.find((d: TopicDetailType) => d.topicUUID === foundTopic.uuid && d.slug === detailSlug) || null;
          } else {
            // no detailSlug provided: try to find any TopicDetail for this topic
            foundDetail = normalizedDetails.find((d: TopicDetailType) => d.topicUUID === foundTopic.uuid) || null;
          }
        }
        setTopicDetail(foundDetail || null);
      } catch (err) {
        console.error('Error fetching topic detail:', err);
        setSubject(null);
        setTopic(null);
        setTopicDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug, topicSlug, detailSlug, contentType]);

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

  // Selection state for practice quizzes: map quiz index -> selected option index
  const [selectedMap, setSelectedMap] = useState<Record<number, number | null>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<number, { text: string; correct: boolean } | null>>({});
  const [practicePageIndex, setPracticePageIndex] = useState(0);
  const practicePageSize = 5;

  // Quiz submission flow state
  type QuizFlowState = 'quiz' | 'confirmation' | 'results';
  const [quizFlowState, setQuizFlowState] = useState<QuizFlowState>('quiz');
  const [quizSubmissionData, setQuizSubmissionData] = useState<{
    totalQuestions: number;
    answeredCount: number;
    unansweredCount: number;
    correctCount: number;
    percentage: number;
    attemptDate: string;
    attemptCount: number;
    quizDetails: Array<{
      questionIndex: number;
      question: string;
      userAnswerIndex: number | null;
      userAnswerText: string;
      correctAnswerIndex: number;
      correctAnswerText: string;
      selectedOptionExplanation: string;  // explanation for the option user selected
      correctOptionExplanation: string;   // explanation for the correct option
      isCorrect: boolean;
    }>;
  } | null>(null);

  // Get percentile-based encouragement message
  const getEncouragementMessage = (percentage: number) => {
    if (percentage >= 90) return "🎉 Excellent work! You've mastered this topic!";
    if (percentage >= 80) return "👏 Great job! You have a strong understanding!";
    if (percentage >= 70) return "✅ Good effort! Keep practicing to improve further!";
    if (percentage >= 60) return "💪 Nice try! Review the concepts and practice more!";
    return "📚 Keep studying! You'll do better next time!";
  };

  // Calculate percentage grade
  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return 'A (Excellent)';
    if (percentage >= 80) return 'B (Very Good)';
    if (percentage >= 70) return 'C (Good)';
    if (percentage >= 60) return 'D (Pass)';
    return 'F (Needs Improvement)';
  };

  const handleSelectOption = (quizIdx: number, optionIdx: number, quiz: any, meta?: any) => {
    setSelectedMap(prev => ({ ...prev, [quizIdx]: optionIdx }));
    const correct = typeof quiz.answer === 'number' && optionIdx === quiz.answer;
    let text = correct ? 'Correct!' : 'Incorrect.';
    
    // Determine where the explanation comes from based on meta
    if (meta) {
      if (meta.kind === 'table') {
        const table = quiz.tables?.[meta.tableIndex];
        if (table?.rowExplanations?.[meta.rowIndex]) {
          text = table.rowExplanations[meta.rowIndex];
        }
      } else if (meta.kind === 'chart') {
        const chart = quiz.charts?.[meta.chartIndex];
        if (chart?.labelExplanations?.[meta.labelIndex]) {
          text = chart.labelExplanations[meta.labelIndex];
        }
      } else if (meta.kind === 'text') {
        if (Array.isArray(quiz.explanations) && quiz.explanations[optionIdx]) {
          text = quiz.explanations[optionIdx];
        }
      }
    } else if (Array.isArray(quiz.explanations) && quiz.explanations[optionIdx]) {
      text = quiz.explanations[optionIdx];
 
    }
    
    setFeedbackMap(prev => ({ ...prev, [quizIdx]: { text, correct } }));
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = () => {
    if (!Array.isArray(td.quizzes) || td.quizzes.length === 0) return;
    
    const answeredCount = Object.keys(selectedMap).length;
    const unansweredCount = td.quizzes.length - answeredCount;
    const correctCount = td.quizzes.reduce((acc, quiz, idx) => {
      const selected = selectedMap[idx];
      if (selected !== null && selected !== undefined && typeof quiz.answer === 'number') {
        return acc + (selected === quiz.answer ? 1 : 0);
      }
      return acc;
    }, 0);
    const percentage = td.quizzes.length > 0 ? Math.round((correctCount / td.quizzes.length) * 100) : 0;
    const attemptDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Build quiz details array with explanations
    const quizDetails = td.quizzes.map((quiz, idx) => {
      const userAnswerIndex = (selectedMap as Record<number, number | null>)[idx] ?? null;
      const correctAnswerIndex = quiz.answer as number;
      const isCorrect = userAnswerIndex === correctAnswerIndex;

      // Fetch explanation for the option user selected
      let selectedOptionExplanation = '';
      if (userAnswerIndex !== null && Array.isArray(quiz.explanations) && quiz.explanations[userAnswerIndex]) {
        selectedOptionExplanation = quiz.explanations[userAnswerIndex];
      }

      // Fetch explanation for the correct option
      let correctOptionExplanation = '';
      if (Array.isArray(quiz.explanations) && typeof correctAnswerIndex === 'number' && quiz.explanations[correctAnswerIndex]) {
        correctOptionExplanation = quiz.explanations[correctAnswerIndex];
      }

      return {
        questionIndex: idx + 1,
        question: quiz.question,
        userAnswerIndex,
        userAnswerText: userAnswerIndex !== null && quiz.options ? quiz.options[userAnswerIndex] : 'Not answered',
        correctAnswerIndex,
        correctAnswerText: quiz.options ? quiz.options[correctAnswerIndex] : 'N/A',
        selectedOptionExplanation,
        correctOptionExplanation,
        isCorrect
      };
    });

    // Determine attempt count (check persisted attempts for this topic, then increment)
    const storageKey = `quiz_attempt_${topic?.id || (topic?.name || '').replace(/\s+/g, '_')}`;
    let persisted = null;
    try {
      const p = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      persisted = p ? JSON.parse(p) : null;
    } catch (e) {
      persisted = null;
    }

    const attemptCount = persisted && typeof persisted.attemptCount === 'number'
      ? persisted.attemptCount + 1
      : (quizSubmissionData ? quizSubmissionData.attemptCount + 1 : 1);

    const newSubmission = {
      totalQuestions: td.quizzes.length,
      answeredCount,
      unansweredCount,
      correctCount,
      percentage,
      attemptDate,
      attemptCount,
      quizDetails
    };

    setQuizSubmissionData(newSubmission);

    // persist attempt count (and basic summary) so retries/reloads keep increments
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({ attemptCount: newSubmission.attemptCount, attemptDate: newSubmission.attemptDate }));
      }
    } catch (e) {
      // ignore storage errors
    }
    setQuizFlowState('confirmation');
  };

  // Generate PDF Report
  const generatePDFReport = () => {
    if (!quizSubmissionData) return;
    
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userStr ? JSON.parse(userStr) : null;
    
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(25, 118, 210);
    doc.text('Test Result Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Topic: ${topic?.name || 'Knowledge Assessment'}`, 20, yPos);
    
    yPos += 8;
    doc.text(`Type: ${contentType?.toUpperCase() || 'PRACTICE'}`, 20, yPos);
    
    yPos += 8;
    const type = contentType === 'waec' ? 'WAEC' : contentType === 'jamb' ? 'JAMB' : 'Knowledge Base';
    doc.text(`Assessment: ${type}`, 20, yPos);
    
    yPos += 12;
    doc.setDrawColor(180, 180, 180);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    // User Information
    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text('Candidate Information', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    if (user) {
      doc.text(`Name: ${user.name || 'Not provided'}`, 20, yPos);
      yPos += 6;
      doc.text(`Email: ${user.email || 'Not provided'}`, 20, yPos);
      yPos += 6;
      doc.text(`Registration Date: ${user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Not provided'}`, 20, yPos);
    } else {
      doc.text('Name: Guest User', 20, yPos);
    }
    
    yPos += 10;
    doc.text(`Attempt Date: ${quizSubmissionData.attemptDate}`, 20, yPos);
    
    yPos += 12;
    doc.setDrawColor(180, 180, 180);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    // Performance Summary
    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text('Performance Summary', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Questions: ${quizSubmissionData.totalQuestions}`, 20, yPos);
    yPos += 6;
    doc.text(`Questions Answered: ${quizSubmissionData.answeredCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Questions Not Answered: ${quizSubmissionData.unansweredCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Correct Answers: ${quizSubmissionData.correctCount}`, 20, yPos);
    yPos += 6;
    doc.text(`Attempt Number: ${quizSubmissionData.attemptCount}`, 20, yPos);
    yPos += 6;
    doc.setTextColor(76, 175, 80);
    doc.setFontSize(11);
    doc.text(`Score: ${quizSubmissionData.correctCount}/${quizSubmissionData.totalQuestions}`, 20, yPos);
    yPos += 8;
    doc.setFontSize(14);
    doc.setTextColor(25, 118, 210);
    doc.text(`${quizSubmissionData.percentage}%`, 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Grade: ${getGradeLabel(quizSubmissionData.percentage)}`, 20, yPos);
    
    yPos += 12;
    doc.setDrawColor(180, 180, 180);
    doc.line(20, yPos, pageWidth - 20, yPos);
    
    // Feedback & Encouragement
    yPos += 12;
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.text('Feedback', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(76, 175, 80);
    const encouragement = getEncouragementMessage(quizSubmissionData.percentage);
    const splitEncouragement = doc.splitTextToSize(encouragement, pageWidth - 40);
    doc.text(splitEncouragement, 20, yPos);
    
    yPos += splitEncouragement.length * 6 + 8;
    
    // Footer
    if (yPos < pageHeight - 20) {
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Generated by Alchemist Learning Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    // Save PDF
    const fileName = `${topic?.name || 'quiz'}_result_${new Date().getTime()}.pdf`;
    doc.save(fileName);
   
     // Add detailed answer review section if attempts >= 3
     if (quizSubmissionData.attemptCount >= 3 && quizSubmissionData.quizDetails) {
       doc.addPage();
       yPos = 20;
     
       doc.setFontSize(12);
       doc.setTextColor(25, 118, 210);
       doc.text('Detailed Answer Review', 20, yPos);
     
       yPos += 12;
       doc.setFontSize(9);
       doc.setTextColor(0, 0, 0);
     
       quizSubmissionData.quizDetails.forEach((detail, idx) => {
         // Check if we need a new page
         if (yPos > pageHeight - 50) {
           doc.addPage();
           yPos = 20;
         }
       
         // Question number and text
         doc.setFontSize(10);
         doc.setTextColor(25, 118, 210);
         doc.text(`Q${detail.questionIndex}: ${detail.question}`, 20, yPos);
       
        yPos += 8;
        doc.setFontSize(9);
        if (detail.isCorrect) {
          doc.setTextColor(76, 175, 80);
        } else {
          doc.setTextColor(244, 67, 54);
        }
        doc.text(`Your Answer: ${detail.userAnswerText}`, 25, yPos);
       
         yPos += 6;
         if (!detail.isCorrect) {
           doc.setTextColor(76, 175, 80);
           doc.text(`Correct Answer: ${detail.correctAnswerText}`, 25, yPos);
           yPos += 6;
         }
       
         // Display selected option explanation if user chose wrong answer
         if (!detail.isCorrect && detail.selectedOptionExplanation) {
           if (yPos > pageHeight - 30) {
             doc.addPage();
             yPos = 20;
           }
           doc.setTextColor(244, 67, 54);
           const selectedExpLines = doc.splitTextToSize(`Why your answer is incorrect: ${detail.selectedOptionExplanation}`, pageWidth - 50);
           doc.text(selectedExpLines, 25, yPos);
           yPos += selectedExpLines.length * 5 + 4;
         }
       
         // Display correct option explanation
         if (detail.correctOptionExplanation) {
           if (yPos > pageHeight - 30) {
             doc.addPage();
             yPos = 20;
           }
           doc.setTextColor(76, 175, 80);
           const correctExpLabel = detail.isCorrect ? 'Explanation:' : 'Why this is correct:';
           const correctExpLines = doc.splitTextToSize(`${correctExpLabel} ${detail.correctOptionExplanation}`, pageWidth - 50);
           doc.text(correctExpLines, 25, yPos);
           yPos += correctExpLines.length * 5 + 4;
         }
       
         yPos += 4;
         doc.setDrawColor(220, 220, 220);
         doc.line(20, yPos, pageWidth - 20, yPos);
         yPos += 6;
       });
     
       // Footer for last page
       doc.setFontSize(9);
       doc.setTextColor(150, 150, 150);
       doc.text('Generated by Alchemist Learning Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
     
       // Save the complete PDF with review pages
       const fileName = `${topic?.name || 'quiz'}_result_${new Date().getTime()}.pdf`;
       doc.save(fileName);
     } else {
       // Save PDF without review pages if attempts < 3
       const fileName = `${topic?.name || 'quiz'}_result_${new Date().getTime()}.pdf`;
       doc.save(fileName);
     }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', mt: { xs: 2, sm: 4, md: 6 }, px: { xs: 1, sm: 2 }, mb: { xs: 3, sm: 4, md: 6 } }}>
      <Box sx={{ mb: 3 }}>
        <Button variant="outlined" color="primary" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          ← Go Back
        </Button>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="primary" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>Home</Link>
          {contentType === 'waec' ? (
            <>
              <Link underline="hover" color="primary" onClick={() => navigate('/waec')} sx={{ cursor: 'pointer' }}>WAEC</Link>
              {subject && (
                <Link underline="hover" color="primary" onClick={() => navigate(`/waec/${subject.slug}`)} sx={{ cursor: 'pointer' }}>{subject.name}</Link>
              )}
            </>
          ) : contentType === 'jamb' ? (
            <>
              <Link underline="hover" color="primary" onClick={() => navigate('/jamb')} sx={{ cursor: 'pointer' }}>JAMB</Link>
              {subject && (
                <Link underline="hover" color="primary" onClick={() => navigate(`/jamb/${subject.slug}`)} sx={{ cursor: 'pointer' }}>{subject.name}</Link>
              )}
            </>
          ) : (
            <>
              <Link underline="hover" color="primary" onClick={() => navigate('/knowledge-base')} sx={{ cursor: 'pointer' }}>Knowledge Base</Link>
              {subject && (
                <Link underline="hover" color="primary" onClick={() => navigate(`/knowledge-base/${subject.slug}`)} sx={{ cursor: 'pointer' }}>{subject.name}</Link>
              )}
            </>
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
            <Tab label="Tables & Charts" />
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
                              {block.type === 'table' && (() => {
                                let tbl: any = { title: '', description: '', headers: [], rows: [] };
                                try { tbl = JSON.parse(block.value || '{}'); } catch (e) { tbl = { title: '', description: '', headers: [], rows: [] }; }
                                return (
                                  <Box sx={{ mb: 2 }}>
                                    {tbl.title && <Typography variant="h6" sx={{ mb: 1 }}>{tbl.title}</Typography>}
                                    {tbl.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{tbl.description}</Typography>}
                                    <Box sx={{ overflowX: 'auto' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                          <tr>
                                            {Array.isArray(tbl.headers) && tbl.headers.map((header: string, hIdx: number) => (
                                              <th key={hIdx} style={{ padding: 12, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f5f5', color: theme.palette.text.primary, fontWeight: 600, textAlign: 'left' }}>
                                                {header}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Array.isArray(tbl.rows) && tbl.rows.map((row: any[], rIdx: number) => (
                                            <tr key={rIdx}>
                                              {row.map((cell, cIdx) => (
                                                <td key={cIdx} style={{ padding: 12, border: `1px solid ${theme.palette.divider}` }}>{cell}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </Box>
                                  </Box>
                                );
                              })()}
                              {block.type === 'chart' && (() => {
                                let chart: any = { title: '', type: 'bar', description: '', labels: [], datasets: [] };
                                try { chart = JSON.parse(block.value || '{}'); } catch (e) { chart = { title: '', type: 'bar', description: '', labels: [], datasets: [] }; }
                                chart = normalizeChart(chart);
                                return (
                                  <Box sx={{ mb: 2 }}>
                                    {chart.title && <Typography variant="h6" sx={{ mb: 1 }}>{chart.title}</Typography>}
                                    {chart.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{chart.description}</Typography>}
                                    <Box sx={{ width: '100%', minHeight: 200, backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : '#f9f9f9', borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                                      {chart.type === 'bar' && (
                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 150, gap: 1 }}>
                                          {chart.datasets?.[0]?.data?.map((value: number, dIdx: number) => {
                                            const maxValue = Math.max(...(chart.datasets?.[0]?.data || [1]));
                                            const heightPercent = (value / maxValue) * 100;
                                            const bg = Array.isArray(chart.datasets?.[0]?.backgroundColor) ? (chart.datasets?.[0]?.backgroundColor as any)[dIdx] : (typeof chart.datasets?.[0]?.backgroundColor === 'string' && (chart.datasets?.[0]?.backgroundColor as string).includes(',') ? (chart.datasets?.[0]?.backgroundColor as string).split(',').map(s=>s.trim())[dIdx] : chart.datasets?.[0]?.backgroundColor);
                                            return (
                                              <Box key={dIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                                <Typography variant="caption" sx={{ mb: 0.5 }}>{value}</Typography>
                                                <Box sx={{ width: '100%', height: `${heightPercent}%`, backgroundColor: bg || '#1976d2', borderRadius: '4px 4px 0 0', minHeight: 12 }} title={`${chart.labels?.[dIdx]}: ${value}`} />
                                                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-word' }}>{chart.labels?.[dIdx] || `Label ${dIdx}`}</Typography>
                                              </Box>
                                            );
                                          })}
                                        </Box>
                                      )}
                                      {chart.type === 'line' && (
                                        <Box sx={{ position: 'relative', width: '100%', height: 150 }}>
                                          <svg width="100%" height="100%" style={{ backgroundColor: 'transparent' }}>
                                            <polyline
                                              points={chart.datasets?.[0]?.data?.map((value: number, idx: number) => {
                                                const maxValue = Math.max(...(chart.datasets?.[0]?.data || [1]));
                                                const x = (idx / Math.max(chart.labels?.length - 1 || 1, 1)) * 100;
                                                const y = 100 - (value / maxValue) * 80;
                                                return `${x}%,${y}%`;
                                              }).join(' ')}
                                              style={{ fill: 'none', stroke: (Array.isArray(chart.datasets?.[0]?.borderColor) ? (chart.datasets?.[0]?.borderColor as any)[0] : chart.datasets?.[0]?.borderColor) || '#1976d2', strokeWidth: 2 }}
                                            />
                                            {chart.datasets?.[0]?.data?.map((value: number, idx: number) => {
                                              const maxValue = Math.max(...(chart.datasets?.[0]?.data || [1]));
                                              const x = (idx / Math.max(chart.labels?.length - 1 || 1, 1)) * 100;
                                              const y = 100 - (value / maxValue) * 80;
                                              const ptColor = Array.isArray(chart.datasets?.[0]?.backgroundColor) ? (chart.datasets?.[0]?.backgroundColor as any)[idx] : (typeof chart.datasets?.[0]?.backgroundColor === 'string' && (chart.datasets?.[0]?.backgroundColor as string).includes(',') ? (chart.datasets?.[0]?.backgroundColor as string).split(',').map(s=>s.trim())[idx] : chart.datasets?.[0]?.backgroundColor) || '#1976d2';
                                              return (
                                                <g key={idx}>
                                                  <circle cx={`${x}%`} cy={`${y}%`} r={3} fill={ptColor} />
                                                  <text x={`${x}%`} y={`${y - 4}%`} fontSize={10} textAnchor="middle" fill={(chart.datasets?.[0]?.borderColor as any) || '#fff'}>{String(value)}</text>
                                                </g>
                                              );
                                            })}
                                          </svg>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-around', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                                            {chart.labels?.map((label: string, lIdx: number) => (
                                              <Typography key={lIdx} variant="caption" sx={{ flex: 1, textAlign: 'center' }}>{label}</Typography>
                                            ))}
                                          </Box>
                                        </Box>
                                      )}
                                      {chart.type === 'pie' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 150 }}>
                                          <svg width="160" height="160" style={{ margin: '0 auto' }}>
                                            {(() => {
                                              const ds = chart.datasets?.[0] || { data: [], backgroundColor: undefined } as any;
                                              const total = (ds.data || []).reduce((a: number, b: number) => a + b, 0) || 1;
                                              const displayFormat = chart.labelFormat || 'percentage';
                                              const getColor = (i: number) => {
                                                if (Array.isArray(ds.backgroundColor)) return ds.backgroundColor[i] || '#1976d2';
                                                if (typeof ds.backgroundColor === 'string' && ds.backgroundColor.includes(',')) {
                                                  const arr = ds.backgroundColor.split(',').map((s: string) => s.trim());
                                                  return arr[i] || arr[0] || '#1976d2';
                                                }
                                                return ds.backgroundColor || ['#1976d2', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'][i % 6];
                                              };
                                              let cum = 0;
                                              return ds.data.map((value: number, idx: number) => {
                                                const percentage = (value / total) * 100;
                                                const degrees = (percentage / 100) * 360;
                                                const radius = 64;
                                                const circumference = 2 * Math.PI * radius;
                                                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                                                const startDeg = (cum / total) * 360;
                                                const midDeg = startDeg + (percentage / 100) * 360 / 2;
                                                cum += value;
                                                const cx = 80;
                                                const cy = 80;
                                                const labelR = radius * 0.65;
                                                const rad = (midDeg - 90) * Math.PI / 180;
                                                const lx = cx + labelR * Math.cos(rad);
                                                const ly = cy + labelR * Math.sin(rad);
                                                const displayValue = displayFormat === 'degrees' ? degrees.toFixed(1) : percentage.toFixed(1);
                                                const displaySymbol = displayFormat === 'degrees' ? '°' : '%';
                                                return (
                                                  <g key={idx}>
                                                    <circle
                                                      cx="80"
                                                      cy="80"
                                                      r={radius}
                                                      fill="none"
                                                      stroke={getColor(idx)}
                                                      strokeWidth="16"
                                                      strokeDasharray={circumference}
                                                      strokeDashoffset={strokeDashoffset}
                                                      style={{ transform: `rotate(${(ds.data.slice(0, idx).reduce((a: number, b: number) => a + b, 0) / total) * 360}deg)`, transformOrigin: '80px 80px', transition: 'all 0.3s' }}
                                                    />
                                                    <text x={lx} y={ly} fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000" stroke="#fff" strokeWidth="0.5">{`${displayValue}${displaySymbol}`}</text>
                                                  </g>
                                                );
                                              });
                                            })()}
                                          </svg>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })()}
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
          {tab === 2 && (
            <Box>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Tables & Charts for {topic.name}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {/* Tables Section */}
                {Array.isArray(td.tables) && td.tables.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Tables</Typography>
                    {td.tables.map((table, idx) => (
                      <Paper key={idx} elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>{table.title}</Typography>
                        {table.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{table.description}</Typography>
                        )}
                        <Box sx={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                    {table.headers && table.headers.map((header, hIdx) => (
                                      <th key={hIdx} style={{ padding: 12, border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#f5f5f5', fontWeight: 600, textAlign: 'left', color: theme.palette.text.primary }}>
                                        {header}
                                      </th>
                                    ))}
                              </tr>
                            </thead>
                            <tbody>
                              {table.rows && table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} style={{ padding: 12, border: '1px solid #ddd' }}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}

                {/* Charts Section */}
                {Array.isArray(td.charts) && td.charts.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Charts</Typography>
                    {td.charts.map((chart, idx) => {
                      const _chart = normalizeChart(chart);
                      return (
                        <Paper key={idx} elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>{_chart.title}</Typography>
                        {_chart.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{_chart.description}</Typography>
                        )}
                        <Box sx={{ width: '100%', minHeight: 300, backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : '#f9f9f9', borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                          {_chart.type === 'bar' && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 250, gap: 1 }}>
                              {_chart.datasets?.[0]?.data?.map((value: any, dIdx: number) => {
                                const maxValue = Math.max(...(_chart.datasets?.[0]?.data || [1]));
                                const heightPercent = (value / maxValue) * 100;
                                const bg = Array.isArray(_chart.datasets?.[0]?.backgroundColor) ? (_chart.datasets?.[0]?.backgroundColor as any)[dIdx] : (typeof _chart.datasets?.[0]?.backgroundColor === 'string' && (_chart.datasets?.[0]?.backgroundColor as string).includes(',') ? (_chart.datasets?.[0]?.backgroundColor as string).split(',').map(s=>s.trim())[dIdx] : _chart.datasets?.[0]?.backgroundColor);
                                return (
                                  <Box key={dIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>{value}</Typography>
                                    <Box sx={{ width: '100%', height: `${heightPercent}%`, backgroundColor: bg || '#1976d2', borderRadius: '4px 4px 0 0', minHeight: 20, transition: 'all 0.3s' }} title={`${_chart.labels?.[dIdx]}: ${value}`} />
                                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-word' }}>{_chart.labels?.[dIdx] || `Label ${dIdx}`}</Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                          {_chart.type === 'line' && (
                            <Box sx={{ position: 'relative', width: '100%', height: 250 }}>
                              <svg width="100%" height="100%" style={{ backgroundColor: 'transparent' }}>
                                <polyline
                                  points={_chart.datasets?.[0]?.data?.map((value: any, idx: number) => {
                                    const maxValue = Math.max(...(_chart.datasets?.[0]?.data || [1]));
                                    const x = (idx / Math.max(_chart.labels?.length - 1 || 1, 1)) * 100;
                                    const y = 100 - (value / maxValue) * 80;
                                    return `${x}%,${y}%`;
                                  }).join(' ')}
                                  style={{ fill: 'none', stroke: (Array.isArray(_chart.datasets?.[0]?.borderColor) ? (_chart.datasets?.[0]?.borderColor as any)[0] : _chart.datasets?.[0]?.borderColor) || '#1976d2', strokeWidth: 2 }}
                                />
                                {_chart.datasets?.[0]?.data?.map((value: number, idx: number) => {
                                  const maxValue = Math.max(...(_chart.datasets?.[0]?.data || [1]));
                                  const x = (idx / Math.max(_chart.labels?.length - 1 || 1, 1)) * 100;
                                  const y = 100 - (value / maxValue) * 80;
                                  const ptColor = Array.isArray(_chart.datasets?.[0]?.backgroundColor) ? (_chart.datasets?.[0]?.backgroundColor as any)[idx] : (typeof _chart.datasets?.[0]?.backgroundColor === 'string' && (_chart.datasets?.[0]?.backgroundColor as string).includes(',') ? (_chart.datasets?.[0]?.backgroundColor as string).split(',').map(s=>s.trim())[idx] : _chart.datasets?.[0]?.backgroundColor) || '#1976d2';
                                  return (
                                    <g key={idx}>
                                      <circle cx={`${x}%`} cy={`${y}%`} r={4} fill={ptColor} />
                                      <text x={`${x}%`} y={`${y - 4}%`} fontSize={12} textAnchor="middle" fill={(_chart.datasets?.[0]?.borderColor as any) || '#fff'}>{String(value)}</text>
                                    </g>
                                  );
                                })}
                              </svg>
                              <Box sx={{ display: 'flex', justifyContent: 'space-around', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                                {_chart.labels?.map((label: any, lIdx: number) => (
                                  <Typography key={lIdx} variant="caption" sx={{ flex: 1, textAlign: 'center' }}>{label}</Typography>
                                ))}
                              </Box>
                            </Box>
                          )}
                            {_chart.type === 'pie' && (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                                <svg width="200" height="200" style={{ margin: '0 auto' }}>
                                  {(() => {
                                    const ds = _chart.datasets?.[0] || { data: [], backgroundColor: undefined } as any;
                                    const total = (ds.data || []).reduce((a: number, b: number) => a + b, 0) || 1;
                                    const labelsLen = (_chart.labels || []).length;
                                  const getColor = (i: number) => {
                                    if (Array.isArray(ds.backgroundColor)) return ds.backgroundColor[i] || '#1976d2';
                                    if (typeof ds.backgroundColor === 'string' && ds.backgroundColor.includes(',')) {
                                      const arr = ds.backgroundColor.split(',').map((s: string) => s.trim());
                                      return arr[i] || arr[0] || '#1976d2';
                                    }
                                    return ds.backgroundColor || ['#1976d2', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'][i % 6];
                                  };
                                  let cum = 0;
                                  const displayFormat = _chart.labelFormat || 'percentage';
                                  return ds.data.map((value: number, idx: number) => {
                                    const percentage = (value / total) * 100;
                                    const degrees = (percentage / 100) * 360;
                                    const radius = 80;
                                    const circumference = 2 * Math.PI * radius;
                                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                                    const startDeg = (cum / total) * 360;
                                    const midDeg = startDeg + (percentage / 100) * 360 / 2;
                                    cum += value;
                                    const cx = 100;
                                    const cy = 100;
                                    const labelR = radius * 0.65;
                                    const rad = (midDeg - 90) * Math.PI / 180;
                                    const lx = cx + labelR * Math.cos(rad);
                                    const ly = cy + labelR * Math.sin(rad);
                                    const displayValue = displayFormat === 'degrees' ? degrees.toFixed(1) : percentage.toFixed(1);
                                    const displaySymbol = displayFormat === 'degrees' ? '°' : '%';
                                    return (
                                      <g key={idx}>
                                        <circle
                                          cx="100"
                                          cy="100"
                                          r={radius}
                                          fill="none"
                                          stroke={getColor(idx)}
                                          strokeWidth="20"
                                          strokeDasharray={circumference}
                                          strokeDashoffset={strokeDashoffset}
                                          style={{ transform: `rotate(${(ds.data.slice(0, idx).reduce((a: number, b: number) => a + b, 0) / total) * 360}deg)`, transformOrigin: '100px 100px', transition: 'all 0.3s' }}
                                        />
                                        <text x={lx} y={ly} fontSize="12" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000" stroke="#fff" strokeWidth="0.5">{`${displayValue}${displaySymbol}`}</text>
                                      </g>
                                    );
                                  });
                                })()}
                              </svg>
                            </Box>
                          )}
                          {_chart.type === 'histogram' && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 250, gap: 0.5 }}>
                              {_chart.datasets?.[0]?.data?.map((value: any, dIdx: number) => {
                                const maxValue = Math.max(...(_chart.datasets?.[0]?.data || [1]));
                                const heightPercent = (value / maxValue) * 100;
                                return (
                                  <Box key={dIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <Typography variant="caption" sx={{ mb: 0.5 }}>{value}</Typography>
                                    <Box sx={{ width: '90%', height: `${heightPercent}%`, backgroundColor: (Array.isArray(_chart.datasets?.[0]?.backgroundColor) ? (_chart.datasets?.[0]?.backgroundColor as any)[dIdx] : (typeof _chart.datasets?.[0]?.backgroundColor === 'string' && (_chart.datasets?.[0]?.backgroundColor as string).includes(',') ? (_chart.datasets?.[0]?.backgroundColor as string).split(',').map(s=>s.trim())[dIdx] : _chart.datasets?.[0]?.backgroundColor)) || '#ff7043', borderRadius: '2px', minHeight: 20 }} title={`${_chart.labels?.[dIdx]}: ${value}`} />
                                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-word' }}>{_chart.labels?.[dIdx] || `Label ${dIdx}`}</Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}
                          {!['bar', 'line', 'pie', 'histogram'].includes(_chart.type) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                              <Typography variant="body2" color="text.secondary">
                                Chart type '{_chart.type}' not yet rendered. Data available: {_chart.datasets?.length} dataset(s) with {_chart.labels?.length} label(s).
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            {_chart.datasets?.map((dataset: any, dIdx: number) => (
                              <Box key={dIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 16, height: 16, backgroundColor: dataset.backgroundColor || '#1976d2', borderRadius: '2px' }} />
                                <Typography variant="caption">{dataset.label}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      </Paper>
                      );
                    })}
                  </Box>
                )}

                {!td.tables?.length && !td.charts?.length && (
                  <Typography variant="body1" color="text.secondary">No tables or charts available.</Typography>
                )}
              </Box>
            </Box>
          )}
          {tab === 3 && (
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
          {tab === 4 && (
            <Box>
              <Typography variant="h5" fontWeight={600} color="primary.main" gutterBottom>
                Practice: {topic.name}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {Array.isArray(td.quizzes) && td.quizzes.length > 0 ? (
                  <Box>
                    {/* CONFIRMATION PAGE */}
                    {quizFlowState === 'confirmation' && quizSubmissionData && (
                      <Box sx={{ py: 4, px: 2 }}>
                        <Card elevation={3} sx={{ maxWidth: 600, mx: 'auto', p: 4, borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="h5" fontWeight={700} textAlign="center" color="primary.main" gutterBottom>
                              Quiz Submission Summary
                            </Typography>
                            <Divider sx={{ my: 3 }} />
                            
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" fontWeight={600} color="primary.main">
                                    {quizSubmissionData.answeredCount}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Answered
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box textAlign="center">
                                  <Typography variant="h6" fontWeight={600} color="error.main">
                                    {quizSubmissionData.unansweredCount}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Unanswered
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                              Total Questions: {quizSubmissionData.totalQuestions}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                              ⚠️ Note: You have {quizSubmissionData.unansweredCount} unanswered question{quizSubmissionData.unansweredCount !== 1 ? 's' : ''}.
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => setQuizFlowState('quiz')}
                                sx={{ px: 3 }}
                              >
                                ← Back to Quiz
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setQuizFlowState('results')}
                                sx={{ px: 3 }}
                              >
                                Proceed to Submit →
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    {/* RESULTS PAGE */}
                    {quizFlowState === 'results' && quizSubmissionData && (
                      <Box sx={{ py: 4, px: 2 }}>
                        <Card elevation={3} sx={{ maxWidth: 700, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 4, textAlign: 'center' }}>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                              Test Completed! 🎉
                            </Typography>
                            <Typography variant="body2">
                              {topic?.name} - {contentType?.toUpperCase() || 'PRACTICE'}
                            </Typography>
                          </Box>

                          <CardContent sx={{ p: 4 }}>
                            {/* Score Display */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                                  <Typography variant="h2" fontWeight={700} color="primary.main">
                                    {quizSubmissionData.percentage}%
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
                                    {getGradeLabel(quizSubmissionData.percentage)}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: theme.palette.mode === 'dark' ? '#2d5016' : '#c8e6c9', borderRadius: 2 }}>
                                    <Typography variant="h5" fontWeight={700} color={theme.palette.mode === 'dark' ? '#81c784' : '#1b5e20'}>
                                    {quizSubmissionData.correctCount}/{quizSubmissionData.totalQuestions}
                                  </Typography>
                                    <Typography variant="body2" color={theme.palette.mode === 'dark' ? '#c8e6c9' : '#1b5e20'} sx={{ mt: 1, fontWeight: 500 }}>
                                    Correct Answers
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>

                            {/* Performance Details */}
                            <Box sx={{ bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5', p: 3, borderRadius: 2, mb: 3 }}>
                              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                Performance Details
                              </Typography>
                              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Answered Questions:</Typography>
                                  <Typography variant="body2" fontWeight={600}>{quizSubmissionData.answeredCount}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Unanswered Questions:</Typography>
                                  <Typography variant="body2" fontWeight={600}>{quizSubmissionData.unansweredCount}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Incorrect Answers:</Typography>
                                  <Typography variant="body2" fontWeight={600}>{quizSubmissionData.answeredCount - quizSubmissionData.correctCount}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />\n                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Attempt Number:</Typography>
                                    <Typography variant="body2" fontWeight={600}>Attempt {quizSubmissionData.attemptCount}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Attempt Date:</Typography>
                                  <Typography variant="body2" fontWeight={600}>{quizSubmissionData.attemptDate}</Typography>
                                </Box>
                              </Box>
                            </Box>

                            {/* Encouragement Message */}
                            <Box sx={{ bgcolor: 'info.light', p: 3, borderRadius: 2, mb: 3, textAlign: 'center' }}>
                              <Typography variant="body1" fontWeight={600} color="info.dark">
                                {getEncouragementMessage(quizSubmissionData.percentage)}
                              </Typography>
                            </Box>

                            {/* Action Buttons */}
                              {/* Detailed Answer Review - Show only after 3+ attempts */}
                              {quizSubmissionData.attemptCount >= 3 && quizSubmissionData.quizDetails && (
                                <Box sx={{ mb: 3 }}>
                                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                                    Detailed Answer Review
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {quizSubmissionData.quizDetails.map((detail, idx) => (
                                      <Box
                                        key={idx}
                                        sx={{
                                          bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                                          p: 2.5,
                                          borderRadius: 2,
                                          borderLeft: `4px solid ${detail.isCorrect ? theme.palette.success.main : theme.palette.error.main}`
                                        }}
                                      >
                                        <Box sx={{ mb: 1.5 }}>
                                          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                            Question {detail.questionIndex}: {detail.question}
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 1 }}>
                                            <Box>
                                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                Your Answer:
                                              </Typography>
                                              <Typography variant="body2" sx={{ ml: 1, color: detail.isCorrect ? theme.palette.success.main : theme.palette.error.main, fontWeight: 500 }}>
                                                {detail.userAnswerText}
                                              </Typography>
                                            </Box>
                                            {!detail.isCorrect && (
                                              <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                  Correct Answer:
                                                </Typography>
                                                <Typography variant="body2" sx={{ ml: 1, color: theme.palette.success.main, fontWeight: 500 }}>
                                                  {detail.correctAnswerText}
                                                </Typography>
                                              </Box>
                                            )}
                                            {/* Display selected option explanation if user chose wrong answer */}
                                            {!detail.isCorrect && detail.selectedOptionExplanation && (
                                              <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                  Why your answer is incorrect:
                                                </Typography>
                                                <Typography variant="body2" sx={{ ml: 1, mt: 0.5, lineHeight: 1.6, color: theme.palette.error.main }}>
                                                  {detail.selectedOptionExplanation}
                                                </Typography>
                                              </Box>
                                            )}
                                            {/* Display correct option explanation */}
                                            {detail.correctOptionExplanation && (
                                              <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                                  {detail.isCorrect ? 'Explanation:' : 'Why this is correct:'}
                                                </Typography>
                                                <Typography variant="body2" sx={{ ml: 1, mt: 0.5, lineHeight: 1.6, color: theme.palette.success.main }}>
                                                  {detail.correctOptionExplanation}
                                                </Typography>
                                              </Box>
                                            )}
                                          </Box>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Action Buttons */}
                              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 4 }}>
                              <Button
                                variant="contained"
                                color="primary"
                                onClick={generatePDFReport}
                                sx={{ px: 3 }}
                              >
                                📥 Download Result (PDF)
                              </Button>
                              <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                  setQuizFlowState('quiz');
                                  setPracticePageIndex(0);
                                  setSelectedMap({});
                                  setFeedbackMap({});
                                  // Keep quizSubmissionData so attemptCount can be incremented on next submit
                                }}
                                sx={{ px: 3 }}
                              >
                                🔄 Retake Quiz
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    {/* QUIZ PAGE */}
                    {quizFlowState === 'quiz' && (
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 3 }}>Knowledge Check</Typography>
                        {(() => {
                          const totalPages = Math.ceil(td.quizzes.length / practicePageSize);
                          const startIdx = practicePageIndex * practicePageSize;
                          const endIdx = startIdx + practicePageSize;
                          const paginatedQuizzes = td.quizzes.slice(startIdx, endIdx);
                          return (
                            <>
                              {paginatedQuizzes.map((quiz, localIdx) => {
                            const idx = startIdx + localIdx;
                      const textOptions = Array.isArray(quiz.options) ? quiz.options : [];
                      const tableRowLabels: string[] = [];
                      const combinedMeta: any[] = [];
                      if (Array.isArray(quiz.tables)) {
                        quiz.tables.forEach((t: any, tI: number) => {
                          if (Array.isArray(t.rows)) {
                            t.rows.forEach((r: any, rI: number) => {
                              // Only use first column value as the selectable option
                              const label = Array.isArray(r) && r.length > 0 ? r[0] : (Array.isArray(r) ? r.join(', ') : String(r));
                              tableRowLabels.push(label);
                              combinedMeta.push({ kind: 'table', tableIndex: tI, rowIndex: rI });
                            });
                          }
                        });
                      }
                      const chartOptionLabels: string[] = [];
                      if (Array.isArray(quiz.charts)) {
                        quiz.charts.forEach((c: any, cI: number) => {
                          if (Array.isArray(c.labels)) {
                            c.labels.forEach((lab: string, li: number) => {
                              // Use only the label text as the selectable option (do not prefix with chart title)
                              chartOptionLabels.push(lab);
                              combinedMeta.push({ kind: 'chart', chartIndex: cI, labelIndex: li });
                            });
                          } else {
                            chartOptionLabels.push(c.title || 'Chart');
                            combinedMeta.push({ kind: 'chart', chartIndex: cI, labelIndex: 0 });
                          }
                        });
                      }
                      // Build combined options: include text options, table rows, and chart labels
                      const combined: string[] = [];
                      const textMeta: any[] = [];
                      textOptions.forEach((tOpt: string) => { combined.push(tOpt); textMeta.push({ kind: 'text' }); });
                      // Add table row labels to selectable options
                      tableRowLabels.forEach(l => combined.push(l));
                      const chartStartIndex = combined.length;
                      // Add chart labels to selectable options
                      chartOptionLabels.forEach(l => combined.push(l));
                      const fullMeta = [...textMeta, ...combinedMeta];

                      // selection state per quiz stored in parent-level map via ref-based state
                      return (
                        <Box key={idx} sx={{ mb: 4 }}>
                          <Typography variant="body1" sx={{ mb: 2 }}><strong>{idx + 1}. {quiz.question}</strong></Typography>

                          {/* Render full tables BEFORE options */}
                          {Array.isArray(quiz.tables) && quiz.tables.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              {quiz.tables.map((t: any, tIdx: number) => (
                                <Box key={tIdx} sx={{ mb: 2, borderRadius: 1, p: 2, backgroundColor: 'transparent', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                                  {t.title && <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t.title}</Typography>}
                                  {t.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t.description}</Typography>}
                                  <Box sx={{ overflowX: 'auto' }}>
                                    <MuiTable size="small" sx={{ minWidth: 500 }}>
                                      {Array.isArray(t.headers) && (
                                        <TableHead>
                                          <TableRow sx={{ backgroundColor: (theme) => theme.palette.action.hover }}>
                                            {t.headers.map((h: string, hi: number) => <TableCell key={hi} sx={{ fontWeight: 600, color: (theme) => theme.palette.text.primary }}>{h}</TableCell>)}
                                          </TableRow>
                                        </TableHead>
                                      )}
                                      <TableBody>
                                        {Array.isArray(t.rows) && t.rows.map((r: any, ri: number) => {
                                          // compute combined index for this row
                                          let rowCombinedIndex = textOptions.length; // start after text options
                                          // sum rows in previous tables
                                          if (Array.isArray(quiz.tables)) {
                                            for (let ti = 0; ti < tIdx; ti++) {
                                              rowCombinedIndex += (Array.isArray(quiz.tables[ti].rows) ? quiz.tables[ti].rows.length : 0);
                                            }
                                          }
                                          rowCombinedIndex += ri;
                                          const isSelected = (selectedMap[idx] === rowCombinedIndex);
                                          return (
                                            <TableRow key={ri} sx={isSelected ? (theme) => ({ backgroundColor: theme.palette.mode === 'dark' ? '#1a3a3a' : '#c8e6c9' }) : { '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                              {(Array.isArray(r) ? r : String(r).split(',')).map((cell: any, ci: number) => (
                                                <TableCell key={ci} sx={{ color: (theme) => theme.palette.text.primary }}>{cell}</TableCell>
                                              ))}
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </MuiTable>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          )}

                          {/* Render charts BEFORE options */}
                          {Array.isArray(quiz.charts) && quiz.charts.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              {quiz.charts.map((c: any, cI: number) => {
                                const _c = normalizeChart(c);
                                const data = {
                                  labels: Array.isArray(_c.labels) ? _c.labels : [],
                                  datasets: Array.isArray(_c.datasets) ? _c.datasets.map((ds: any) => ({ label: ds.label, data: ds.data || [], backgroundColor: ds.backgroundColor, borderColor: ds.borderColor })) : []
                                };
                                return (
                                  <Box key={cI} sx={{ mb: 2, p: 2, borderRadius: 1, backgroundColor: 'transparent', border: (theme) => `1px solid ${theme.palette.divider}` }}>
                                    {_c.title && <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{_c.title}</Typography>}
                                    {_c.description && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{_c.description}</Typography>}
                                    <Box sx={{ position: 'relative', height: 300 }}>
                                      {_c.type === 'pie' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                                          <svg width="220" height="220" style={{ margin: '0 auto' }}>
                                            {(() => {
                                              const ds = _c.datasets?.[0] || { data: [], backgroundColor: undefined } as any;
                                              const total = (ds.data || []).reduce((a: number, b: number) => a + b, 0) || 1;
                                              const getColor = (i: number) => {
                                                if (Array.isArray(ds.backgroundColor)) return ds.backgroundColor[i] || '#1976d2';
                                                if (typeof ds.backgroundColor === 'string' && ds.backgroundColor.includes(',')) {
                                                  const arr = ds.backgroundColor.split(',').map((s: string) => s.trim());
                                                  return arr[i] || arr[0] || '#1976d2';
                                                }
                                                return ds.backgroundColor || ['#1976d2', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'][i % 6];
                                              };
                                              let cum = 0;
                                              const displayFormat = _c.labelFormat || 'percentage';
                                              return ds.data.map((value: number, idx: number) => {
                                                const percentage = (value / total) * 100;
                                                const degrees = (percentage / 100) * 360;
                                                const radius = 88;
                                                const circumference = 2 * Math.PI * radius;
                                                const strokeDashoffset = circumference - (percentage / 100) * circumference;
                                                const startDeg = (cum / total) * 360;
                                                const midDeg = startDeg + (percentage / 100) * 360 / 2;
                                                cum += value;
                                                const cx = 110;
                                                const cy = 110;
                                                const labelR = radius * 0.75;
                                                const rad = (midDeg - 90) * Math.PI / 180;
                                                const lx = cx + labelR * Math.cos(rad);
                                                const ly = cy + labelR * Math.sin(rad);
                                                const displayValue = displayFormat === 'degrees' ? degrees.toFixed(1) : percentage.toFixed(1);
                                                const displaySymbol = displayFormat === 'degrees' ? '°' : '%';
                                                return (
                                                  <g key={idx}>
                                                    <circle
                                                      cx={String(cx)}
                                                      cy={String(cy)}
                                                      r={radius}
                                                      fill="none"
                                                      stroke={getColor(idx)}
                                                      strokeWidth="22"
                                                      strokeDasharray={circumference}
                                                      strokeDashoffset={strokeDashoffset}
                                                      style={{ transform: `rotate(${(ds.data.slice(0, idx).reduce((a: number, b: number) => a + b, 0) / total) * 360}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.3s' }}
                                                    />
                                                    <text x={lx} y={ly} fontSize="12" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill="#000" stroke="#fff" strokeWidth="0.5">{`${displayValue}${displaySymbol}`}</text>
                                                  </g>
                                                );
                                              });
                                            })()}
                                          </svg>
                                        </Box>
                                      )}
                                      {_c.type === 'line' && <Line data={data as any} />}
                                      {_c.type === 'bar' && <Bar data={data as any} />}
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          )}

                              {/* Render quiz images (support legacy strings and object blobs/URLs) */}
                              {Array.isArray(quiz.images) && quiz.images.length > 0 && (
                                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  {quiz.images.map((img: any, i: number) => {
                                    let src = '';
                                    if (!img) return null;
                                    if (typeof img === 'string') src = img;
                                    else if (img.type === 'url' && img.data) src = img.data;
                                    else if (img.type === 'blob' && img.data && img.mimeType) src = `data:${img.mimeType};base64,${img.data}`;
                                    else if (img.data && typeof img.data === 'string' && img.mimeType) src = `data:${img.mimeType};base64,${img.data}`;
                                    else if (img.fileUrl) {
                                      // Normalize fileUrl to avoid mixed-content or protocol issues
                                      try {
                                        let s = img.fileUrl as string;
                                        if (typeof window !== 'undefined' && s && s.startsWith('http')) {
                                          // Make protocol-relative to avoid http->https mixed content blocks
                                          s = s.replace(/^https?:/, '');
                                        }
                                        src = s;
                                      } catch (e) {
                                        src = img.fileUrl;
                                      }
                                    }
                                    if (!src) return null;
                                    return <img key={i} src={src} alt={`quiz-img-${i}`} style={{ maxWidth: 480, width: '100%', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }} />;
                                  })}
                                </Box>
                              )}

                          {/* Option buttons - AFTER tables/charts */}
                          {combined.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Select your answer:</Typography>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {combined.map((opt, oidx) => (
                                  <Button key={oidx} variant="contained" sx={{ background: selectedMap[idx] === oidx ? '#388e3c' : '#1976d2', color: '#fff', fontWeight: 600, borderRadius: 1, px: 2, py: 1, '&:hover': { background: selectedMap[idx] === oidx ? '#2e7d32' : '#1565c0' } }}
                                    onClick={() => handleSelectOption(idx, oidx, quiz, fullMeta[oidx])}
                                  >{opt}</Button>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                          {/* Pagination Controls */}
                          {(() => {
                            const totalPages = Math.ceil(td.quizzes.length / practicePageSize);
                            const isLastPage = practicePageIndex >= totalPages - 1;
                            if (totalPages <= 1) {
                              // Single page - show only Submit button
                              return (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSubmitQuiz}
                                    sx={{ px: 4, py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                                  >
                                    ✅ Submit Quiz
                                  </Button>
                                </Box>
                              );
                            }
                            return (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, gap: 2, flexWrap: 'wrap' }}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  onClick={() => setPracticePageIndex(Math.max(0, practicePageIndex - 1))}
                                  disabled={practicePageIndex === 0}
                                >
                                  ← Previous
                                </Button>
                                <Typography variant="body2" color="text.secondary">
                                  Page {practicePageIndex + 1} of {totalPages}
                                </Typography>
                                {isLastPage ? (
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleSubmitQuiz}
                                    sx={{ px: 3, fontWeight: 600 }}
                                  >
                                    ✅ Submit Quiz
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => setPracticePageIndex(Math.min(totalPages - 1, practicePageIndex + 1))}
                                    disabled={practicePageIndex >= totalPages - 1}
                                  >
                                    Next →
                                  </Button>
                                )}
                              </Box>
                            );
                          })()}
                        </>
                      );
                    })()}
                      </Box>
                    )}
                  </Box>
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
