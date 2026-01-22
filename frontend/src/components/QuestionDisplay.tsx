import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EmojiIcon from '@mui/icons-material/EmojiEmotions';
import GradingResults from './GradingResults';
import API_BASE_URL from '../config/api';

interface Question {
  question_id: string;
  question_text: string;
  sub_questions?: Array<{
    sub_id: string;
    text: string;
    marks?: number;
  }>;
  marking_scheme?: {
    total_marks: number;
    breakdown: Array<{
      step: string;
      marks: number;
      description: string;
    }>;
  };
  difficulty_level: string;
  mode: string;
}

interface GradingResult {
  question_id: string;
  question_text: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  sub_question_results: any[];
  grading_details?: any[];
  correct_answers?: any[];
  marking_scheme?: any;
}

interface QuestionDisplayProps {
  labMode?: 'practice' | 'exam';
  onQuestionLoaded?: (question: Question) => void;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  labMode = 'practice',
  onQuestionLoaded,
}) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<{ [key: string]: string }>({});
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [questionsLoaded, setQuestionsLoaded] = useState(0);
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null);
  const [gradingLoading, setGradingLoading] = useState(false);
  const MAX_QUESTION_LOADS = 3;

  // Fetch a random question on mount
  useEffect(() => {
    fetchRandomQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labMode]);

  const fetchRandomQuestion = async () => {
    try {
      setLoading(true);
      setError(null);
      setCurrentQuestion(null); // Clear previous question immediately
      setStudentAnswers({}); // Clear answers immediately
      
      // Add cache-busting parameter to ensure fresh API response
      const timestamp = Date.now();
      const response = await fetch(
        `${API_BASE_URL}/practical-questions/random/1?mode=${labMode}&t=${timestamp}`,
        {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch question');

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const question = data.data[0];
        setCurrentQuestion(question);
        setStudentAnswers({});
        setSubmissionResult(null);
        
        // Initialize student answers object
        if (question.sub_questions && Array.isArray(question.sub_questions)) {
          const initialAnswers: { [key: string]: string } = {};
          for (let i = 0; i < question.sub_questions.length; i++) {
            const sub = question.sub_questions[i];
            initialAnswers[sub.sub_id] = '';
          }
          setStudentAnswers(initialAnswers);
        }

        // Notify parent component
        onQuestionLoaded?.(question);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (subId: string, value: string) => {
    setStudentAnswers(prev => ({
      ...prev,
      [subId]: value,
    }));
  };

  const handleSubmitAnswers = async () => {
    if (!currentQuestion) return;

    try {
      setSubmittingAnswers(true);

      // For now, just show the answers submission dialog
      // In Phase 2, this will integrate with the grading endpoint
      setAnswerDialogOpen(true);

      setSubmittingAnswers(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmittingAnswers(false);
    }
  };

  const handleConfirmSubmission = async () => {
    if (!currentQuestion) return;

    try {
      setSubmittingAnswers(true);
      setGradingLoading(true);

      // Prepare submission data
      const submissionData = {
        question_id: currentQuestion.question_id,
        student_answers: studentAnswers,
      };

      // Call grading API endpoint
      const response = await fetch(`${API_BASE_URL}/grade-practical-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to grade answers');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setGradingResult(result.data);
        setSubmissionResult({
          submitted: true,
          question_id: currentQuestion.question_id,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error(result.message || 'Grading failed');
      }

      setAnswerDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmittingAnswers(false);
      setGradingLoading(false);
    }
  };

  const handleLoadNewQuestion = () => {
    if (questionsLoaded < MAX_QUESTION_LOADS) {
      setQuestionsLoaded(prev => prev + 1);
      setGradingResult(null); // Clear previous grading result
      fetchRandomQuestion();
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 2, bgcolor: '#1a1a2e', border: '1px solid #0f3460' }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <CircularProgress sx={{ color: '#00d4ff' }} />
          <Typography sx={{ mt: 2, color: '#fff' }}>Loading question...</Typography>
        </CardContent>
      </Card>
    );
  }

  // If grading results are displayed, show them instead of the question
  if (gradingResult) {
    return (
      <Box sx={{ mb: 2 }}>
        <GradingResults
          gradingResult={gradingResult}
          loading={gradingLoading}
          onRetake={() => {
            setGradingResult(null);
            setQuestionsLoaded(0);
            fetchRandomQuestion();
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!currentQuestion) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        No question available
      </Alert>
    );
  }

  return (
    <>
      <Card
        sx={{
          mb: 2,
          bgcolor: '#0f1419',
          border: '2px solid #00d4ff',
          borderRadius: '8px',
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmojiIcon sx={{ color: '#00d4ff' }} />
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 'bold' }}>
                Assessment Question
              </Typography>
            </Box>
          }
          subheader={
            <Typography sx={{ color: '#b0b0b0' }}>
              Difficulty: <strong>{currentQuestion.difficulty_level}</strong> | Mode:{' '}
              <strong>{currentQuestion.mode}</strong> | ID: {currentQuestion.question_id}
            </Typography>
          }
          sx={{
            bgcolor: '#1a1a2e',
            borderBottom: '1px solid #0f3460',
          }}
        />

        <CardContent sx={{ color: '#fff' }}>
          {/* Question Text */}
          <Typography
            variant="body1"
            paragraph
            sx={{ whiteSpace: 'pre-wrap', mb: 2, lineHeight: 1.6 }}
          >
            {currentQuestion.question_text}
          </Typography>

          <Divider sx={{ my: 2, bgcolor: '#0f3460' }} />

          {/* Sub-questions with Answer Fields */}
          {currentQuestion.sub_questions && currentQuestion.sub_questions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', mb: 2 }}>
                Your Answers:
              </Typography>

              {currentQuestion.sub_questions.map((subQ) => (
                <Box key={subQ.sub_id} sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: '#fff',
                      fontWeight: 'bold',
                      mb: 1,
                    }}
                  >
                    {subQ.sub_id}. {subQ.text}
                    {subQ.marks && <span> ({subQ.marks} marks)</span>}
                  </Typography>

                  <TextField
                    fullWidth
                    multiline
                    rows={subQ.text.toLowerCase().includes('state') ? 2 : 1}
                    placeholder="Enter your answer here..."
                    value={studentAnswers[subQ.sub_id] || ''}
                    onChange={(e) => handleAnswerChange(subQ.sub_id, e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        bgcolor: '#1a1a2e',
                        borderColor: '#0f3460',
                        '&:hover fieldset': {
                          borderColor: '#00d4ff',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#00d4ff',
                        },
                      },
                      '& .MuiOutlinedInput-input::placeholder': {
                        color: '#666',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Marking Scheme Preview */}
          {currentQuestion.marking_scheme && (
            <Box sx={{ mt: 3, p: 1.5, bgcolor: '#1a1a2e', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1 }}>
                📊 Total Marks: {currentQuestion.marking_scheme.total_marks}
              </Typography>
              <Typography variant="caption" sx={{ color: '#b0b0b0' }}>
                Your answers will be graded according to the marking scheme once submitted.
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2, bgcolor: '#0f3460' }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', alignItems: 'center' }}>
            <Box sx={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                onClick={handleLoadNewQuestion}
                disabled={questionsLoaded >= MAX_QUESTION_LOADS}
                sx={{
                  color: questionsLoaded >= MAX_QUESTION_LOADS ? '#666' : '#b0b0b0',
                  borderColor: questionsLoaded >= MAX_QUESTION_LOADS ? '#555' : '#0f3460',
                  '&:hover': {
                    borderColor: questionsLoaded >= MAX_QUESTION_LOADS ? '#555' : '#00d4ff',
                    color: questionsLoaded >= MAX_QUESTION_LOADS ? '#666' : '#00d4ff',
                    bgcolor: questionsLoaded >= MAX_QUESTION_LOADS ? 'transparent' : 'rgba(0, 212, 255, 0.05)',
                  },
                  '&:disabled': {
                    borderColor: '#555',
                    color: '#666',
                  },
                }}
              >
                Load Different Question ({MAX_QUESTION_LOADS - questionsLoaded} left)
              </Button>
              {questionsLoaded >= MAX_QUESTION_LOADS && (
                <Typography variant="caption" sx={{ color: '#ff6b6b', display: 'block', mt: 0.5 }}>
                  ⚠️ Maximum loads reached for this session
                </Typography>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmitAnswers}
              disabled={
                !currentQuestion.sub_questions ||
                Object.values(studentAnswers).some((ans) => !ans.trim())
              }
              sx={{
                bgcolor: '#00d4ff',
                color: '#0f1419',
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: '#00a8cc',
                },
                '&:disabled': {
                  bgcolor: '#555',
                  color: '#999',
                },
              }}
            >
              {submittingAnswers ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: '#0f1419' }} />
                  Submitting...
                </>
              ) : (
                'Submit Answers'
              )}
            </Button>
          </Box>

          {/* Submission Status */}
          {submissionResult && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ✅ Answers submitted! Awaiting grading results...
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={answerDialogOpen}
        onClose={() => setAnswerDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#0f1419',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ color: '#00d4ff', fontWeight: 'bold' }}>
          Confirm Answer Submission
        </DialogTitle>
        <DialogContent sx={{ color: '#fff' }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            You are about to submit your answers for the following question:
          </Typography>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#b0b0b0' }}>
            "{currentQuestion.question_id}"
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Your answers will be submitted for automatic grading. Make sure all fields are
            completed before confirming.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAnswerDialogOpen(false)}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmission}
            variant="contained"
            sx={{
              bgcolor: '#00d4ff',
              color: '#0f1419',
              fontWeight: 'bold',
            }}
          >
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default QuestionDisplay;
