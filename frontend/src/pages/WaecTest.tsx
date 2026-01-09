import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  alpha,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { isMobileOrTablet, getDeviceType } from '../utils/deviceDetection';
import { useSafeExamMode } from '../contexts/SafeExamModeContext';
import PreflightChecks from '../components/PreflightChecks';

const WaecTest: React.FC = () => {
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

  const [mockTestData, setMockTestData] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [digitalClock, setDigitalClock] = useState<string>(new Date().toLocaleTimeString());
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [questionIdMap, setQuestionIdMap] = useState<{ [key: string]: string }>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [phaseStarted, setPhaseStarted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPhase, setCurrentPhase] = useState(1);
  // Fullscreen violation tracking (mirror JAMB logic)
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

  useEffect(() => {
    if (!user || !mockTestId || !deviceCheckPassed) {
      if (!user || !mockTestId) {
        navigate('/login');
      }
      return;
    }

    // Delay preflight by 500ms to ensure component is fully mounted
    const timer = setTimeout(() => {
      setShowPreflight(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, mockTestId, navigate, deviceCheckPassed]);

  const handlePreflightComplete = async (success: boolean, sessionId?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[WaecTest] handlePreflightComplete called', { success, sessionId });
    }
    if (success && sessionId) {
      setPreflightSessionId(sessionId);
      setShowPreflight(false);

      // Enable safe exam mode
      setIsExamMode(true);

      const fetchMockTestStatus = async () => {
        try {
          const response = await api.get(`/mock-test/${mockTestId}/status`);
          if (!response.data) {
            throw new Error('No mock test data received from server');
          }
          setMockTestData(response.data);
          // Start the phase timer when test data is loaded
          setPhaseStarted(true);
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[WaecTest] Mock test data loaded successfully', {
              subjects: response.data.subjectCombination
            });
          }
        } catch (error: any) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[WaecTest] Error fetching mock test data:', error?.message, error);
          }
          const errorMsg = error?.response?.data?.error || error?.message || 'Unknown error';
          setError('Error fetching mock test data: ' + errorMsg);
          setIsExamMode(false);
          // Navigate back after showing error
          setTimeout(() => {
            navigate(`/mock-test/waec/instructions/${mockTestId}`, { replace: true });
          }, 3000);
        }
      };

      fetchMockTestStatus();
    } else {
      // On preflight failure, navigate back to instructions (not confirmation)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[WaecTest] Preflight checks failed, navigating back to instructions');
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
        navigate(`/mock-test/waec/instructions/${mockTestId}`, { replace: true });
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

  // Fetch questions for current subject
  useEffect(() => {
    if (!mockTestData || mockTestData.subjectCombination?.length === 0) return;

    const fetchQuestions = async () => {
      try {
        const currentSubject = mockTestData.subjectCombination[currentSubjectIndex];
        if (!currentSubject) return;

        const response = await api.get(`/mock-test/${mockTestId}/questions`, {
          params: { subject: currentSubject },
        });
        setQuestions(response.data.questions || []);
        // Map local question indexes to real question IDs for submission
        try {
          const mapUpdates: { [key: string]: string } = {};
          (response.data.questions || []).forEach((q: any, idx: number) => {
            mapUpdates[`${currentSubjectIndex}-${idx}`] = q._id || q.id || q.questionId || '';
          });
          setQuestionIdMap((prev) => ({ ...prev, ...mapUpdates }));
        } catch (e) {
          // ignore mapping errors
        }
        setLoading(false);
      } catch (error: any) {
        setError('Error fetching questions');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [mockTestData, currentSubjectIndex, mockTestId]);

  // Timer effect for phases
  useEffect(() => {
    if (!mockTestData || !phaseStarted) return;

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [mockTestData, phaseStarted]);

  // Digital clock
  useEffect(() => {
    const t = setInterval(() => setDigitalClock(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(t);
  }, []);

  // Suppress ESC and monitor fullscreen changes while in exam mode (record violations and auto-submit on 3rd)
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
                console.warn('Could not log violation:', (e as any)?.message);
              }
            }

            if (newCount === VIOLATION_THRESHOLD) {
              // Auto-submit and lock exam on third exit (when newCount = 3)
              // Hide any existing dialogs before submitting
              try {
                setShowExitConfirm(false);
                setShowViolationWarning(false);
              } catch (e) {}
              
              try {
                await handleSubmitTest();
              } catch (e) {
                // If submit fails even after retries, still navigate to results page
                console.error('Auto-submit on 3rd violation failed:', (e as any)?.message);
                // Let the result page handle missing data
                setLoading(false);
              }
            } else {
              // Show a warning to the user (1st or 2nd violation)
              setShowViolationWarning(true);
            }
          })();

          return newCount;
        });
      } catch (e) {
        // ignore
        console.error('Error recording violation:', (e as any)?.message);
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

  // Calculate phase timing
  const calculatePhaseTime = () => {
    const subjects = mockTestData?.subjectCombination || [];
    const totalSubjects = subjects.length;

    // Phase 1: 3 subjects (Use of English 60min + 2 others @ 50min each = 160min)
    // Phase 2: 3 subjects (50min each = 150min)
    // Phase 3: remaining 1-3 subjects (50/100/150 min based on count)

    if (currentPhase === 1) {
      return 160 * 60; // 160 minutes in seconds
    } else if (currentPhase === 2) {
      return 150 * 60; // 150 minutes in seconds
    } else {
      // Phase 3: depends on remaining subjects
      const remainingSubjects = totalSubjects - 6;
      if (remainingSubjects === 1) return 50 * 60;
      if (remainingSubjects === 2) return 100 * 60;
      return 150 * 60; // 3 subjects
    }
  };

  const phaseTimeLimit = calculatePhaseTime();
  const timeRemaining = Math.max(0, phaseTimeLimit - elapsedTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleAnswerQuestion = (answerIndex: number) => {
    const questionKey = `${currentSubjectIndex}-${currentQuestionIndex}`;
    setAnswers({
      ...answers,
      [questionKey]: String(answerIndex),
    });
  };

  const handleBookmark = () => {
    const questionKey = `${currentSubjectIndex}-${currentQuestionIndex}`;
    if (bookmarked.includes(questionKey)) {
      setBookmarked(bookmarked.filter((k) => k !== questionKey));
    } else {
      setBookmarked([...bookmarked, questionKey]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < 9) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    setLoading(true);
    let examIdToNavigate = mockTestData?.examId || '';
    
    try {
      // Ensure we have an examId before proceeding - fetch current status if missing
      if (!examIdToNavigate && mockTestId) {
        try {
          const statusResp = await api.get(`/mock-test/${mockTestId}/status`);
          if (statusResp.data?.examId) {
            examIdToNavigate = statusResp.data.examId;
          }
        } catch (e) {
          // Best-effort: continue without examId if fetch fails
          console.warn('Could not fetch examId during submit:', (e as any)?.message);
        }
      }

      // Save all answers by mapping local keys to question IDs
      for (const [key, ans] of Object.entries(answers)) {
        const questionId = questionIdMap[key];
        const isBookmarked = bookmarked.includes(key);
        if (!questionId) continue; // best-effort
        if (ans || isBookmarked) {
          try {
            await api.post(`/mock-test/${mockTestId}/responses`, {
              questionId,
              answer: ans,
              isBookmarked,
            });
          } catch (e) {
            // Best-effort: continue saving other responses even if one fails
            console.warn('Error saving response:', (e as any)?.message);
          }
        }
      }

      // Submit test
      const submitResponse = await api.post(`/mock-test/${mockTestId}/submit`);
      
      // Use examId from response if available, otherwise fall back to state/fetched value
      const finalExamId = submitResponse.data?.examId || examIdToNavigate;
      
      navigate(`/mock-test/waec/result/${mockTestId}`, {
        state: {
          score: submitResponse.data.score,
          total: submitResponse.data.totalQuestions || submitResponse.data.total,
          examId: finalExamId,
        },
      });
    } catch (error: any) {
      if (isLocked) {
        // On auto-submit (3rd ESC), always navigate to results regardless of error
        // The result page will attempt to fetch authoritative data using examId or mockTestId
        setLoading(false);
        setError('');
        
        // Even on error, try to fetch examId one more time before navigating
        try {
          if (!examIdToNavigate) {
            const statusResp = await api.get(`/mock-test/${mockTestId}/status`);
            if (statusResp.data?.examId) {
              examIdToNavigate = statusResp.data.examId;
            }
          }
        } catch (e) {
          // Ignore and proceed with whatever examId we have
        }
        
        navigate(`/mock-test/waec/result/${mockTestId}`, {
          state: {
            score: null,
            total: null,
            examId: examIdToNavigate || null,
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
              examType="WAEC"
              onComplete={handlePreflightComplete}
              onCancel={() => navigate(-1)}
            />
          ) : (
            <CircularProgress />
          )}
        </Box>

        {/* Bottom-right floating clock + exit button */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 60000, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
          <Box sx={{ background: 'rgba(0,0,0,0.6)', color: '#fff', px: 2, py: 1, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ display: 'block', opacity: 0.9 }}>Local Time</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{digitalClock}</Typography>
          </Box>
          <Button variant="contained" color="error" onClick={() => { setShowExitConfirm(true); try { window.dispatchEvent(new Event('exam:overlay-hide')); } catch (err) {} }} sx={{ mt: 1 }}>Exit</Button>
        </Box>
      </>
    );
  }

  // Device warning dialog
  if (showDeviceWarning && !deviceCheckPassed) {
    return (
      <Dialog open={showDeviceWarning} disableEscapeKeyDown maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Desktop/Laptop Required
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            WAEC Mock Tests can only be taken on a desktop or laptop computer.
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

  const subjects = mockTestData?.subjectCombination || [];
  const currentSubject = subjects[currentSubjectIndex] || '';
  const currentQuestion = questions[currentQuestionIndex] || null;

  // Helper to render image from blob or URL
  const renderImage = (img: any) => {
    let src = '';
    if (!img) return null;
    if (typeof img === 'string') src = img;
    else if (img.type === 'url' && img.data) src = img.data;
    else if (img.type === 'blob' && img.data && img.mimeType) src = `data:${img.mimeType};base64,${img.data}`;
    else if (img.data && typeof img.data === 'string' && img.mimeType) src = `data:${img.mimeType};base64,${img.data}`;
    else if (img.fileUrl) src = img.fileUrl;
    return src ? <img src={src} alt="quiz" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8 }} /> : null;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, display: 'flex', flexDirection: 'column' }}>
      {/* Header with Timer */}
      <Box
        sx={{
          background: theme.palette.primary.main,
          color: 'white',
          py: 2,
          px: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {currentSubject}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>Local Time</Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{digitalClock}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ fontWeight: 800 }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Typography>
            <Typography variant="caption">Phase {currentPhase} Time</Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<ArrowBack />}
          onClick={() => setShowExitConfirm(true)}
        >
          Exit
        </Button>
      </Box>

      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Grid container spacing={3}>
          {/* Main Content - Question */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                {error && (
                  <Box sx={{ mb: 2, p: 2, background: theme.palette.error.light, color: theme.palette.error.dark, borderRadius: 1 }}>
                    {error}
                  </Box>
                )}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Question {currentQuestionIndex + 1} of {questions.length || (subjects.length * 60)}
                </Typography>

                {/* Question Content */}
                {currentQuestion ? (
                  <>
                    {/* Question Text */}
                    <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
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
                  </>
                ) : (
                  <Typography color="error">Loading question...</Typography>
                )}

                {/* Answer Options */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                  {currentQuestion && currentQuestion.options ? (
                    currentQuestion.options.map((option: any, idx: number) => {
                      const optionLabel = String.fromCharCode(65 + idx); // Convert 0,1,2,3 to A,B,C,D
                      return (
                        <Card
                          key={idx}
                          onClick={() => handleAnswerQuestion(idx)}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            border: `2px solid ${
                              answers[`${currentSubjectIndex}-${currentQuestionIndex}`] === String(idx)
                                ? theme.palette.primary.main
                                : 'divider'
                            }`,
                            background:
                              answers[`${currentSubjectIndex}-${currentQuestionIndex}`] === String(idx)
                                ? alpha(theme.palette.primary.main, 0.1)
                                : 'transparent',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                            },
                          }}
                        >
                          <Typography variant="body2">
                            <strong>{optionLabel}.</strong> {typeof option === 'string' ? option : option.text || option}
                          </Typography>
                        </Card>
                      );
                    })
                  ) : (
                    <Typography color="textSecondary">Loading answer options...</Typography>
                  )}
                </Box>

                {/* Navigation */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant={bookmarked.includes(`${currentSubjectIndex}-${currentQuestionIndex}`) ? 'contained' : 'outlined'}
                    onClick={handleBookmark}
                  >
                    Bookmark
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === subjects.length * 60 - 1}
                  >
                    Next
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Sidebar - Subject/Question Navigator */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Subjects
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                  {subjects.map((subject: string, idx: number) => (
                    <Button
                      key={idx}
                      variant={currentSubjectIndex === idx ? 'contained' : 'outlined'}
                      fullWidth
                      onClick={() => {
                        setCurrentSubjectIndex(idx);
                        setCurrentQuestionIndex(0);
                      }}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {subject}
                    </Button>
                  ))}
                </Box>

                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', mb: 2 }}>
                  Question Status
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
                  {Array.from({ length: 20 }).map((_, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1,
                        cursor: 'pointer',
                        background:
                          answers[`${currentSubjectIndex}-${idx}`] !== undefined
                            ? '#4caf50'
                            : bookmarked.includes(`${currentSubjectIndex}-${idx}`)
                            ? '#2196f3'
                            : '#f44336',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Submit Button */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={() => setShowSubmitConfirm(true)}
            sx={{ fontWeight: 700, px: 4 }}
          >
            Submit Test
          </Button>
        </Box>
        {/* Violation warning dialog (shown on 1st and 2nd ESC) */}
        <Dialog open={showViolationWarning} onClose={() => {}} disableEscapeKeyDown>
          <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
            Fullscreen Required
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Fullscreen mode is required to continue the exam. You have exited fullscreen {violationCount - 1} {violationCount - 1 === 1 ? 'time' : 'times'}.
            </Typography>
            <Typography color="text.secondary">
              Exiting fullscreen again will result in auto-submission and the exam being locked. Please return to fullscreen to continue.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setShowViolationWarning(false);
                try { enterFullscreenMode && enterFullscreenMode(); } catch (e) {}
              }}
              variant="contained"
            >
              Return to Fullscreen
            </Button>
            <Button
              onClick={async () => {
                setShowViolationWarning(false);
                try { await handleSubmitTest(); } catch (e) { navigate('/'); }
              }}
              color="error"
              variant="outlined"
            >
              Exit & Submit
            </Button>
          </DialogActions>
        </Dialog>
        {/* Exit confirmation modal shown when user clicks Exit or fullscreen lost */}
        <Dialog open={showExitConfirm} onClose={() => setShowExitConfirm(false)} disableEscapeKeyDown>
          <DialogTitle sx={{ fontWeight: 700 }}>Exit Test</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Exiting the test will submit your current answers and end the session. This action cannot be undone.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you exit before completing the test, your answers will be saved and the result will be available for review per the usual processing schedule.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExitConfirm(false)} variant="outlined">Cancel</Button>
            <Button
              onClick={async () => {
                setShowExitConfirm(false);
                try {
                  // Attempt to save answers first
                  await api.post(`/mock-test/${mockTestId}/submit`, { answers }).catch(() => null);
                } catch (e) {
                  // ignore submit errors and continue to end session
                }

                try {
                  // End exam session server-side if session id available
                  if (preflightSessionId) {
                    await api.post('/exam-sessions/session/end', { sessionId: preflightSessionId, reason: 'user_exit' }).catch(() => null);
                  }
                } catch (e) {
                  // ignore
                }

                // Navigate to results page or home depending on availability
                try {
                  navigate(`/mock-test/waec/result/${mockTestId}`);
                } catch (e) {
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
        {/* Submit confirmation dialog */}
        <Dialog open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)}>
          <DialogTitle sx={{ fontWeight: 700 }}>Submit Test?</DialogTitle>
          <DialogContent>
            <Typography>
              You are about to submit your test. This will finalize your answers and cannot be undone. Are you sure you want to submit?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                setShowSubmitConfirm(false);
                await handleSubmitTest();
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default WaecTest;
