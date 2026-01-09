import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import { ArrowBack, ArrowForward, Bookmark, BookmarkBorder } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { isMobileOrTablet, getDeviceType } from '../utils/deviceDetection';
import { useSafeExamMode } from '../contexts/SafeExamModeContext';
import PreflightChecks from '../components/PreflightChecks';

interface Question {
  _id: string;
  questionText: string;
  options: Array<{ label: string; text: string }>;
  subject: string;
  images?: Array<{ type: 'url' | 'blob'; data: string; mimeType?: string }>;
  tables?: Array<{ title?: string; headers?: string[]; rows?: any[] }>;
  charts?: Array<{ type: string; title?: string; data?: any }>;
}

interface Response {
  [key: string]: {
    answer?: string;
    bookmarked: boolean;
  };
}

const JambTest: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const { user } = useAuth();
  const { isExamMode, setIsExamMode, enterFullscreenMode, exitFullscreenMode } = useSafeExamMode();
  
  const [deviceCheckPassed, setDeviceCheckPassed] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [showDeviceWarning, setShowDeviceWarning] = useState(true);
  const [showPreflight, setShowPreflight] = useState(false);
  const [preflightSessionId, setPreflightSessionId] = useState<string | null>(null);

  // State management
  const [mockTestData, setMockTestData] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<{ [key: string]: Question[] }>({});
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Response>({});
  const [timeRemaining, setTimeRemaining] = useState(9900); // 2h 35m in seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [digitalClock, setDigitalClock] = useState<string>(new Date().toLocaleTimeString());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSubjectWarning, setShowSubjectWarning] = useState(false);
  const [pendingSubject, setPendingSubject] = useState('');
  const [showEndWarning, setShowEndWarning] = useState(false);
  // Fullscreen violation tracking
  const [violationCount, setViolationCount] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(`exam_violation_count_${mockTestId}`);
      return raw ? Number(raw) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const VIOLATION_THRESHOLD = 3; // auto-submit and lock on third exit

  // Device check
  useEffect(() => {
    const dt = getDeviceType();
    setDeviceType(dt);
    if (isMobileOrTablet()) {
      setShowDeviceWarning(true);
      setDeviceCheckPassed(false);
    } else {
      setShowDeviceWarning(false);
      setDeviceCheckPassed(true);
    }
  }, []);

  // Initialize - Delayed preflight to allow page to properly mount
  useEffect(() => {
    if (!user || !mockTestId || !deviceCheckPassed) {
      return;
    }

    // Delay preflight by 500ms to ensure component is fully mounted
    const timer = setTimeout(() => {
      setShowPreflight(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, mockTestId, deviceCheckPassed]);

  const handlePreflightComplete = async (success: boolean, sessionId?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[JambTest] handlePreflightComplete called', { success, sessionId });
    }
    if (success && sessionId) {
      setPreflightSessionId(sessionId);
      setShowPreflight(false);

      // Enable safe exam mode
      setIsExamMode(true);

      const initialize = async () => {
        try {
          // Fetch mock test status
          const statusResponse = await api.get(`/mock-test/${mockTestId}/status`);
          if (!statusResponse.data) {
            throw new Error('No mock test data received from server');
          }
          setMockTestData(statusResponse.data);
          
          if (!statusResponse.data.subjectCombination || statusResponse.data.subjectCombination.length === 0) {
            throw new Error('No subject combination found in mock test data');
          }
          setCurrentSubject(statusResponse.data.subjectCombination[0]);

          // Load questions for all subjects
          const questionsMap: { [key: string]: Question[] } = {};
          for (const subject of statusResponse.data.subjectCombination) {
            const qResponse = await api.get(`/mock-test/${mockTestId}/questions`, {
              params: { subject },
            });
            if (!qResponse.data || !qResponse.data.questions) {
              throw new Error(`Failed to load questions for subject: ${subject}`);
            }
            questionsMap[subject] = qResponse.data.questions;
          }
          setAllQuestions(questionsMap);
          setLoading(false);
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[JambTest] Test initialized successfully', {
              subjects: statusResponse.data.subjectCombination,
              questionsLoaded: Object.keys(questionsMap).length
            });
          }
        } catch (error: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[JambTest] Error loading test data:', error?.message, error);
          }
          const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
          setError('Error loading test data: ' + errorMsg);
          setLoading(false);
          setIsExamMode(false);
          // Optionally navigate back after showing error
          setTimeout(() => {
            navigate(`/mock-test/jamb/instructions/${mockTestId}`, { replace: true });
          }, 3000);
        }
      };

      initialize();
    } else {
      // On preflight failure, navigate back to instructions (not confirmation)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[JambTest] Preflight checks failed, navigating back to instructions');
      }
      setShowPreflight(false);
      // cleanup any warm stream
      try {
        const warm: MediaStream | undefined = (window as any).__proctorWarmStream;
        if (warm && warm.getTracks) {
          warm.getTracks().forEach((t) => t.stop());
        }
        delete (window as any).__proctorWarmStream;
        try {
          sessionStorage.removeItem('proctor_camera_status');
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }
      // Use a slight delay to ensure state updates before navigation
      setTimeout(() => {
        navigate(`/mock-test/jamb/instructions/${mockTestId}`, { replace: true });
      }, 100);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsExamMode(false);
      // Stop any warm camera stream created during instructions countdown
      try {
        const warm: MediaStream | undefined = (window as any).__proctorWarmStream;
        if (warm && warm.getTracks) {
          warm.getTracks().forEach((t) => t.stop());
        }
        delete (window as any).__proctorWarmStream;
        try {
          sessionStorage.removeItem('proctor_camera_status');
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // ignore
      }

      exitFullscreenMode();
    };
  }, [setIsExamMode, exitFullscreenMode]);

  // Timer
  useEffect(() => {
    if (!loading && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (timeRemaining === 0 && !loading) {
      handleSubmitTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining, loading]); // handleSubmitTest is defined below and can't be in deps

  // Digital clock (local time) update
  useEffect(() => {
    const t = setInterval(() => {
      setDigitalClock(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Listen for dispatched escape events (from SafeExamModeContext) and fullscreen changes
  useEffect(() => {
    const handleExamEscape = () => {
      if (!isLocked) { // Only show dialog if not already locked/auto-submitting
        setShowExitConfirm(true);
      }
      try { window.dispatchEvent(new Event('exam:overlay-hide')); } catch (e) {}
    };

    const recordViolation = () => {
      try {
        setViolationCount((prev) => {
          const newCount = prev + 1;
          try { sessionStorage.setItem(`exam_violation_count_${mockTestId}`, String(newCount)); } catch (e) {}

          // Set isLocked synchronously on 3rd press so handleExamEscape knows not to show dialog
          if (newCount === VIOLATION_THRESHOLD) {
            setIsLocked(true);
          }

          // best-effort async logging and actions
          (async () => {
            if (mockTestId) {
              try {
                await api.post(`/mock-test/${mockTestId}/violation`, {
                  userId: user?._id || null,
                  sessionId: preflightSessionId || null,
                  count: newCount,
                  timestamp: new Date().toISOString(),
                });
              } catch (e) {
                // ignore logging errors
              }
            }

            if (newCount === VIOLATION_THRESHOLD) {
              // Auto-submit and lock exam on third exit (when newCount = 3)
              try {
                await handleSubmitTest();
              } catch (e) {
                // ignore
              }
            } else {
              // Show a warning to the user and pause interaction
              setShowViolationWarning(true);
            }
          })();

          return newCount;
        });
      } catch (e) {
        // ignore
      }
    };

    const onFullscreenChange = (ev?: Event) => {
      if (!document.fullscreenElement && isExamMode && !isLocked) {
        // User left fullscreen (press ESC or other)
        recordViolation();
        try { window.dispatchEvent(new Event('exam:overlay-hide')); } catch (e) {}
      }
    };

    const handleFullscreenExited = () => {
      // keep backward compatibility with other parts of app
      onFullscreenChange();
    };

    window.addEventListener('exam:escape', handleExamEscape as EventListener);
    window.addEventListener('exam:fullscreen-exited', handleFullscreenExited as EventListener);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('exam:escape', handleExamEscape as EventListener);
      window.removeEventListener('exam:fullscreen-exited', handleFullscreenExited as EventListener);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
    // violationCount intentionally omitted to avoid re-registering listener on each change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExamMode, isLocked, mockTestId, preflightSessionId]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestions = allQuestions[currentSubject] || [];
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const currentQuestionId = currentQuestion?._id;

  const handleAnswerChange = (answer: string) => {
    setResponses({
      ...responses,
      [currentQuestionId]: {
        ...responses[currentQuestionId],
        answer,
      },
    });
  };

  const handleBookmark = () => {
    setResponses({
      ...responses,
      [currentQuestionId]: {
        ...responses[currentQuestionId],
        bookmarked: !responses[currentQuestionId]?.bookmarked,
      },
    });
  };

  // Helper function to render images (blob or URL)
  const renderImage = (img: any) => {
    let src = '';
    if (img.type === 'blob' && img.data) {
      const mimeType = img.mimeType || 'image/jpeg';
      src = `data:${mimeType};base64,${img.data}`;
    } else if (img.type === 'url' && img.data) {
      src = img.data;
    } else if (typeof img === 'string') {
      src = img;
    }
    return src ? <img src={src} alt="question content" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} /> : null;
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Moving to next subject
      const subjectIndex = mockTestData.subjectCombination.indexOf(currentSubject);
      if (subjectIndex < mockTestData.subjectCombination.length - 1) {
        setPendingSubject(mockTestData.subjectCombination[subjectIndex + 1]);
        setShowSubjectWarning(true);
      } else {
        setShowEndWarning(true);
      }
    }
  };

  const handleSubjectChange = async () => {
    try {
      await api.post(`/mock-test/${mockTestId}/complete-subject`, {
        subject: currentSubject,
      });
      setCurrentSubject(pendingSubject);
      setCurrentQuestionIndex(0);
      setShowSubjectWarning(false);
    } catch (error: any) {
      setError('Error changing subject');
    }
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    try {
      // Save all responses
      for (const [questionId, response] of Object.entries(responses)) {
        if (response.answer || response.bookmarked) {
          await api.post(`/mock-test/${mockTestId}/responses`, {
            questionId,
            answer: response.answer,
            isBookmarked: response.bookmarked,
          });
        }
      }

      // Submit test
      const submitResponse = await api.post(`/mock-test/${mockTestId}/submit`);
      navigate(`/mock-test/jamb/result/${mockTestId}`, {
        state: { score: submitResponse.data.score, total: submitResponse.data.totalQuestions, examId: submitResponse.data.examId },
      });
    } catch (error: any) {
      if (isLocked) {
        // On auto-submit (3rd ESC), always navigate to results regardless of error
        // Reset loading, clear error, and navigate to let results page handle missing data gracefully
        setLoading(false);
        setError('');
        navigate(`/mock-test/jamb/result/${mockTestId}`, {
          state: {
            score: null,
            total: null,
            examId: null,
          },
        });
      } else {
        // Manual submit: show error and reset loading
        setError('Error submitting test');
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {showPreflight && mockTestId ? (
            <PreflightChecks
              mockTestId={mockTestId}
              examType="JAMB"
              onComplete={handlePreflightComplete}
              onCancel={() => navigate(-1)}
            />
          ) : (
            <CircularProgress />
          )}
        </Box>
      </>
    );
  }

  if (!currentQuestion) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Error loading question. Please reload.</Typography>
      </Box>
    );
  }

  const answeredCount = Object.values(responses).filter((r) => r.answer).length;
  const bookmarkedCount = Object.values(responses).filter((r) => r.bookmarked).length;

  // Device warning dialog
  if (showDeviceWarning && !deviceCheckPassed) {
    return (
      <Dialog open={showDeviceWarning} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Desktop/Laptop Required
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            JAMB Mock Tests can only be taken on a desktop or laptop computer.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>Your Device:</strong> {deviceType}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            This restriction ensures optimal test experience and prevents cheating. You can still check your results on any device (phone, tablet, or computer).
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            fullWidth
          >
            Back to Home
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default }}>
      {/* Header with Timer */}
      <Box sx={{ background: theme.palette.primary.main, color: 'white', py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              JAMB Mock Test
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* keep header compact; clock + exit moved to bottom-right */}
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Time Remaining
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: timeRemaining < 600 ? '#FFB6C1' : 'white',
                  }}
                >
                  {formatTime(timeRemaining)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {currentQuestionIndex + 1} / {currentQuestions.length}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>

          {/* Bottom-right floating clock + exit button (only shown on exam page, not preflight) */}
          {!showPreflight && (
            <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 60000, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ background: 'rgba(0,0,0,0.6)', color: '#fff', px: 2, py: 1, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>Local Time</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{digitalClock}</Typography>
              </Box>
              <Button variant="contained" color="error" onClick={() => { setShowExitConfirm(true); try { window.dispatchEvent(new Event('exam:overlay-hide')); } catch (e) {} }}>Exit</Button>
            </Box>
          )}
      </Box>

      {/* Exit confirmation modal shown when user clicks Exit or leaves fullscreen */}
      <Dialog open={showExitConfirm} onClose={() => setShowExitConfirm(false)} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Exit Test</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Exiting the test will submit your current answers and end the session. This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If you want to continue the test in fullscreen, cancel and use the "Continue" option.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitConfirm(false)} variant="outlined">Cancel</Button>
          <Button
            onClick={async () => {
              setShowExitConfirm(false);
              try {
                // Try to gracefully submit/exit the test
                await handleSubmitTest();
              } catch (e) {
                // If submit fails, still navigate away to avoid stuck state
                navigate('/');
              }
            }}
            variant="contained"
            color="error"
          >
            Exit & Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Violation warning shown when user exits fullscreen once */}
      <Dialog open={showViolationWarning} onClose={() => {}} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Fullscreen Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Fullscreen mode is required to continue the exam. You have exited fullscreen {violationCount - 1} {violationCount - 1 === 1 ? 'time' : 'times'}.
          </Typography>
          <Typography color="text.secondary">
            Exiting fullscreen again will result in auto-submission and the exam being locked. Please return to fullscreen to continue.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowViolationWarning(false);
            try { enterFullscreenMode && enterFullscreenMode(); } catch (e) {}
          }} variant="contained">Return to Fullscreen</Button>
          <Button onClick={async () => {
            setShowViolationWarning(false);
            try { await handleSubmitTest(); } catch (e) { navigate('/'); }
          }} color="error" variant="outlined">Exit & Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Locked dialog shown after threshold reached - cannot dismiss */}
      <Dialog open={isLocked} disableEscapeKeyDown>
        <DialogTitle sx={{ fontWeight: 700 }}>Exam Locked</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Due to repeated fullscreen exits, this exam has been locked and submitted. A proctor must review and unlock your session before further action.
          </Typography>
          <Typography color="text.secondary">
            Click the button below to request proctor review. This will notify the proctor and record the unlock request.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              try {
                await api.post(`/mock-test/${mockTestId}/unlock-request`, {
                  userId: user?._id || null,
                  sessionId: preflightSessionId || null,
                  timestamp: new Date().toISOString(),
                });
                // best-effort acknowledgement
                try { alert('Proctor unlock request sent.'); } catch (e) {}
              } catch (e) {
                try { alert('Failed to send request. Please contact support.'); } catch (e) {}
              }
            }}
            variant="contained"
          >
            Request Proctor Unlock
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Main Question Area */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                {error && (
                  <Box sx={{ mb: 2, p: 2, background: theme.palette.error.light, color: theme.palette.error.dark, borderRadius: 1 }}>
                    {error}
                  </Box>
                )}

                {/* Subject and Question Info */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Chip label={currentSubject} color="primary" />
                    <Typography variant="caption" color="text.secondary">
                      Question {currentQuestionIndex + 1} of {currentQuestions.length}
                    </Typography>
                  </Box>
                  <Divider />
                </Box>

                {/* Question Text */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, lineHeight: 1.7 }}>
                  {currentQuestion.questionText}
                </Typography>

                {/* Images */}
                {currentQuestion.images && currentQuestion.images.length > 0 && (
                  <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {currentQuestion.images.map((img: any, idx: number) => (
                      <Box key={idx} sx={{ flex: '1 1 300px', minWidth: 200 }}>
                        {renderImage(img)}
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Tables */}
                {currentQuestion.tables && currentQuestion.tables.map((table: any, idx: number) => (
                  <Box key={idx} sx={{ mb: 3, overflow: 'auto', border: '1px solid #ccc', borderRadius: 1 }}>
                    {table.title && <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 700 }}>{table.title}</Typography>}
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          {table.headers?.map((h: string, i: number) => (
                            <th key={i} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left', fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows?.map((row: any, rIdx: number) => (
                          <tr key={rIdx}>
                            {(Array.isArray(row) ? row : [row]).map((cell: any, cIdx: number) => (
                              <td key={cIdx} style={{ border: '1px solid #ddd', padding: 8 }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                ))}

                {/* Charts */}
                {currentQuestion.charts && currentQuestion.charts.map((chart: any, cidx: number) => {
                  const hasValidData = chart.datasets && Array.isArray(chart.datasets) && chart.datasets.length > 0 && chart.datasets[0].data && chart.datasets[0].data.length > 0;
                  
                  return (
                  <Box key={cidx} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                    {chart.title && <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{chart.title}</Typography>}
                    {chart.type === 'pie' && hasValidData ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', height: 'auto', py: 2 }}>
                        <svg width="220" height="220" viewBox="0 0 220 220" style={{ margin: '0 auto' }}>
                          {(() => {
                                const ds = chart.datasets[0] || { data: [] };
                                const nums = (ds.data || []).map((v: any) => {
                                  const n = Number(v);
                                  return Number.isFinite(n) ? n : 0;
                                });
                                const total = nums.reduce((a: number, b: number) => a + b, 0) || 1;
                                const colors = ['#1976d2', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#6c757d'];
                                let startAngle = 0;
                                return nums.map((value: number, idx: number) => {
                                  const percentage = (value / total) * 100;
                                  const angle = (value / total) * 360;
                              const radius = 60;
                              const circum = 2 * Math.PI * radius;
                              const offset = circum - (angle / 360) * circum;
                              const labelAngle = (startAngle + angle / 2) * Math.PI / 180;
                              const labelRadius = radius * 0.65;
                              const labelX = 110 + labelRadius * Math.cos(labelAngle - Math.PI / 2);
                              const labelY = 110 + labelRadius * Math.sin(labelAngle - Math.PI / 2);
                                  const color = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[idx] : colors[idx % colors.length];
                                  const result = (
                                <g key={idx}>
                                  <circle cx="110" cy="110" r={radius} fill="none" stroke={color} strokeWidth="18" strokeDasharray={circum} strokeDashoffset={offset} strokeLinecap="round" style={{ transform: `rotate(${startAngle}deg)`, transformOrigin: '110px 110px', transition: 'all 0.3s ease' }} />
                                      {percentage > 8 && <text x={labelX} y={labelY} fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" fill={theme.palette.mode === 'dark' ? '#fff' : '#000'} style={{ pointerEvents: 'none' }}>{percentage.toFixed(0)}%</text>}
                                </g>
                              );
                              startAngle += angle;
                              return result;
                            });
                          })()}
                        </svg>
                        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {chart.labels && chart.labels.map((label: string, i: number) => {
                            const colors = ['#1976d2', '#dc3545', '#28a745', '#ffc107', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c', '#6c757d'];
                            const color = Array.isArray(chart.datasets[0].backgroundColor) ? chart.datasets[0].backgroundColor[i] : colors[i % colors.length];
                            return (
                              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box sx={{ width: 10, height: 10, backgroundColor: color, borderRadius: '2px' }} />
                                <Typography variant="caption">{label}</Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    ) : chart.type === 'pie' ? (
                      <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>No chart data available</Box>
                    ) : null}
                    {chart.type === 'bar' && hasValidData ? (
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 250, gap: 0.5 }}>
                        {chart.datasets?.[0]?.data?.map((value: any, dIdx: number) => {
                          const maxValue = Math.max(...(chart.datasets?.[0]?.data || [1]));
                          const heightPercent = (value / maxValue) * 100;
                          return (
                            <Box key={dIdx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                              <Typography variant="caption" sx={{ mb: 0.5 }}>{value}</Typography>
                              <Box sx={{ width: '90%', height: `${heightPercent}%`, backgroundColor: (Array.isArray(chart.datasets?.[0]?.backgroundColor) ? (chart.datasets?.[0]?.backgroundColor as any)[dIdx] : chart.datasets?.[0]?.backgroundColor) || '#ff7043', borderRadius: '2px', minHeight: 20 }} title={`${chart.labels?.[dIdx]}: ${value}`} />
                              <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', wordBreak: 'break-word' }}>{chart.labels?.[dIdx] || `Label ${dIdx}`}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    ) : chart.type === 'bar' ? (
                      <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>No chart data available</Box>
                    ) : null}
                    {!['bar', 'pie'].includes(chart.type) && (
                      <Box sx={{ textAlign: 'center', fontSize: '0.9em', color: 'text.secondary' }}>
                        [Chart Type: {chart.type}]
                      </Box>
                    )}
                  </Box>
                );
                })}

                {/* Options */}
                <RadioGroup
                  value={responses[currentQuestionId]?.answer || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {currentQuestion.options.map((option, idx) => (
                      <FormControlLabel
                        key={idx}
                        value={option.label}
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {option.label}.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.text}
                            </Typography>
                          </Box>
                        }
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1.5,
                          transition: 'all 0.3s ease',
                          background:
                            responses[currentQuestionId]?.answer === option.label
                              ? alpha(theme.palette.primary.main, 0.1)
                              : 'transparent',
                          '&:hover': {
                            borderColor: 'primary.main',
                            background: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      />
                    ))}
                  </Box>
                </RadioGroup>

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', gap: 2, mt: 6, justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <Button
                    variant={responses[currentQuestionId]?.bookmarked ? 'contained' : 'outlined'}
                    startIcon={responses[currentQuestionId]?.bookmarked ? <Bookmark /> : <BookmarkBorder />}
                    onClick={handleBookmark}
                    color={responses[currentQuestionId]?.bookmarked ? 'warning' : 'inherit'}
                  >
                    {responses[currentQuestionId]?.bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>

                  <Button
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={handleNext}
                  >
                    {currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar with Question Navigation */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                  {currentSubject}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                  {currentQuestions.length} questions
                </Typography>

                <Divider sx={{ my: 2 }} />

                {/* Question Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mb: 3 }}>
                  {currentQuestions.map((_, idx) => {
                    const qId = currentQuestions[idx]._id;
                    const responded = responses[qId]?.answer;
                    const bookmarked = responses[qId]?.bookmarked;
                    const isActive = idx === currentQuestionIndex;

                    let bgColor = '#FFB4B4'; // Red - unanswered
                    if (bookmarked) bgColor = '#90CAF9'; // Blue - bookmarked
                    if (responded && !bookmarked) bgColor = '#A5D6A7'; // Green - answered

                    return (
                      <Button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        sx={{
                          background: bgColor,
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 12,
                          minHeight: 40,
                          border: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {idx + 1}
                      </Button>
                    );
                  })}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Legend */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, background: '#A5D6A7', borderRadius: '4px' }} />
                    <Typography variant="caption">Answered</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, background: '#FFB4B4', borderRadius: '4px' }} />
                    <Typography variant="caption">Unanswered</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 20, height: 20, background: '#90CAF9', borderRadius: '4px' }} />
                    <Typography variant="caption">Bookmarked</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ p: 1.5, background: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Answered: {answeredCount}
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Bookmarked: {bookmarkedCount}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Subject Change Warning Dialog */}
      <Dialog open={showSubjectWarning} onClose={() => setShowSubjectWarning(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Change Subject</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to finish the current subject and move to <strong>{pendingSubject}</strong>. You will not be able to return to <strong>{currentSubject}</strong>. Are you sure?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubjectWarning(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubjectChange}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Test Warning Dialog */}
      <Dialog open={showEndWarning} onClose={() => setShowEndWarning(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Test?</DialogTitle>
        <DialogContent>
          <Typography>
            You have completed all subjects. Review your answers before submitting. You will not be able to modify answers after submission.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndWarning(false)}>Back</Button>
          <Button variant="contained" onClick={handleSubmitTest}>
            Submit Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JambTest;
