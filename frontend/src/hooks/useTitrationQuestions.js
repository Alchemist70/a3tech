/**
 * TITRATION QUESTIONS INTEGRATION GUIDE
 * 
 * This guide shows how to integrate WAEC-style titration questions
 * into the EnhancedLabSimulation component and across the frontend.
 */

// ============================================================================
// 1. FETCHING QUESTIONS FROM THE API
// ============================================================================

/**
 * Fetch all titration questions with filters
 */
async function fetchTitrationQuestions(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.difficulty) params.append('difficulty_level', filters.difficulty);
    if (filters.type) params.append('titration_type', filters.type);
    if (filters.mode) params.append('mode', filters.mode);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await fetch(`/api/practical-questions/titration?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to fetch questions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching titration questions:', error);
    throw error;
  }
}

/**
 * Fetch a specific question by ID
 */
async function fetchQuestion(questionId) {
  try {
    const response = await fetch(`/api/practical-questions/${questionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Question not found');
    return await response.json();
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
}

/**
 * Fetch random practice questions
 */
async function fetchRandomPracticeQuestions(count = 3) {
  try {
    const response = await fetch(`/api/practical-questions/random/${count}?mode=practice`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to fetch random questions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching random questions:', error);
    throw error;
  }
}

/**
 * Fetch statistics summary
 */
async function fetchQuestionStatistics() {
  try {
    const response = await fetch('/api/practical-questions/stats/summary', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Failed to fetch statistics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

// ============================================================================
// 2. REACT HOOK FOR MANAGING QUESTIONS
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch and manage titration questions
 */
function useTitrationQuestions(filters = {}) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      try {
        const result = await fetchTitrationQuestions(filters);
        setQuestions(result.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [filters]);

  return { questions, loading, error };
}

// ============================================================================
// 3. RENDERING QUESTIONS IN COMPONENTS
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, Box, Typography, Divider, Alert } from '@mui/material';

/**
 * Component to display a single question
 */
function QuestionDisplay({ question }) {
  if (!question) {
    return <Alert severity="info">No question loaded</Alert>;
  }

  return (
    <Card variant="outlined">
      <CardHeader
        title={`Question: ${question.question_id}`}
        subheader={`Difficulty: ${question.difficulty_level} | Mode: ${question.mode}`}
      />
      <Divider />
      <CardContent>
        {/* Main Question Text */}
        <Typography variant="body1" paragraph>
          {question.question_text}
        </Typography>

        {/* Sub-questions */}
        {question.sub_questions && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Sub-questions:</Typography>
            {question.sub_questions.map((sub, idx) => (
              <Box key={idx} sx={{ ml: 2, mt: 1 }}>
                <Typography variant="body2">
                  <strong>{sub.sub_id})</strong> {sub.text} ({sub.marks} marks)
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Marking Scheme */}
        {question.marking_scheme && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Marking Scheme (Total: {question.marking_scheme.total_marks} marks):</Typography>
            {question.marking_scheme.breakdown.map((item, idx) => (
              <Box key={idx} sx={{ ml: 2, mt: 1 }}>
                <Typography variant="body2">
                  • <strong>{item.step}</strong>: {item.marks} mark(s) - {item.description}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Chemistry Context */}
        {question.chemistry_context && (
          <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption">
              <strong>Context:</strong> {question.chemistry_context}
            </Typography>
          </Box>
        )}

        {/* Tags */}
        {question.tags && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tags:</strong> {question.tags.join(', ')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 4. INTEGRATION WITH EnhancedLabSimulation
// ============================================================================

/**
 * Wrapper component that displays lab simulation + related question
 */
function LabWithQuestion({ practicalType = 'titration', labMode = 'practice' }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [simulationData, setSimulationData] = useState(null);

  useEffect(() => {
    // Fetch a random practice question when component mounts
    fetchRandomPracticeQuestions(1).then(result => {
      if (result.data && result.data.length > 0) {
        setCurrentQuestion(result.data[0]);
      }
    });
  }, [labMode]);

  const handleSimulationComplete = (labResults) => {
    // Store lab results for comparison with question
    setSimulationData(labResults);
    console.log('Lab simulation completed:', labResults);
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
      {/* Left: Lab Simulation */}
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Virtual Titration Lab</Typography>
        <EnhancedLabSimulation 
          mode={labMode}
          onSubmit={handleSimulationComplete}
        />
      </Box>

      {/* Right: Question & Answers */}
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>Assessment Question</Typography>
        {currentQuestion ? (
          <QuestionDisplay question={currentQuestion} />
        ) : (
          <Alert severity="info">Loading question...</Alert>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// 5. QUESTION SELECTOR COMPONENT
// ============================================================================

import { FormControl, InputLabel, Select, MenuItem, Button, CircularProgress } from '@mui/material';

/**
 * Component to select and display questions with filters
 */
function QuestionSelector() {
  const [difficulty, setDifficulty] = useState('medium');
  const [mode, setMode] = useState('practice');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  const { questions, loading } = useTitrationQuestions({
    difficulty,
    mode,
    limit: 10
  });

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            label="Difficulty"
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Mode</InputLabel>
          <Select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            label="Mode"
          >
            <MenuItem value="practice">Practice</MenuItem>
            <MenuItem value="mock_exam">Mock Exam</MenuItem>
            <MenuItem value="both">Both</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Select Question</InputLabel>
          <Select
            value={selectedQuestion?.question_id || ''}
            onChange={(e) => {
              const q = questions.find(q => q.question_id === e.target.value);
              setSelectedQuestion(q);
            }}
            label="Select Question"
          >
            {loading ? (
              <MenuItem disabled><CircularProgress size={24} sx={{ mr: 1 }} /> Loading...</MenuItem>
            ) : (
              questions.map(q => (
                <MenuItem key={q.question_id} value={q.question_id}>
                  {q.question_id} - {q.chemistry_context}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      </Box>

      {selectedQuestion && (
        <QuestionDisplay question={selectedQuestion} />
      )}
    </Box>
  );
}

// ============================================================================
// 6. PRACTICE SESSION COMPONENT
// ============================================================================

/**
 * Component for a full practice session with multiple questions
 */
function PracticeSession() {
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [sessionStarted, setSessionStarted] = useState(false);

  const startSession = async () => {
    try {
      // Fetch 5 random practice questions
      const result = await fetchRandomPracticeQuestions(5);
      setSessionQuestions(result.data || []);
      setCurrentIndex(0);
      setUserAnswers({});
      setSessionStarted(true);
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleAnswerChange = (questionId, subId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [`${questionId}-${subId}`]: answer
    }));
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!sessionStarted) {
    return (
      <Button variant="contained" onClick={startSession}>
        Start Practice Session (5 Questions)
      </Button>
    );
  }

  const currentQuestion = sessionQuestions[currentIndex];

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Question {currentIndex + 1} of {sessionQuestions.length}
      </Typography>

      <QuestionDisplay question={currentQuestion} />

      {/* Answer Input Fields */}
      <Box sx={{ mt: 3 }}>
        {currentQuestion.sub_questions?.map(sub => (
          <Box key={sub.sub_id} sx={{ mb: 2 }}>
            <Typography variant="body2">
              Answer {sub.sub_id}:
            </Typography>
            <input
              type="text"
              value={userAnswers[`${currentQuestion.question_id}-${sub.sub_id}`] || ''}
              onChange={(e) => handleAnswerChange(
                currentQuestion.question_id,
                sub.sub_id,
                e.target.value
              )}
              style={{ width: '100%', padding: '8px' }}
            />
          </Box>
        ))}
      </Box>

      {/* Navigation */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button 
          onClick={handlePrevious} 
          disabled={currentIndex === 0}
        >
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={currentIndex === sessionQuestions.length - 1}
        >
          Next
        </Button>
        <Button 
          variant="contained" 
          color="success"
          disabled={currentIndex !== sessionQuestions.length - 1}
        >
          Submit Session
        </Button>
      </Box>
    </Box>
  );
}

// ============================================================================
// 7. MOCK EXAM COMPONENT
// ============================================================================

/**
 * Component for mock exam mode (strict timing, no review)
 */
function MockExamSession() {
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submissionResults, setSubmissionResults] = useState(null);

  useEffect(() => {
    // Load mock exam questions (hard difficulty)
    fetchTitrationQuestions({
      mode: 'mock_exam',
      difficulty: 'hard',
      limit: 10
    }).then(result => {
      setSessionQuestions(result.data || []);
    });
  }, []);

  useEffect(() => {
    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAutoSubmit = () => {
    // Auto-submit when time is up
    console.log('Time up - auto-submitting exam');
    // Process and grade responses
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 1,
        bgcolor: timeRemaining < 600 ? '#ffe0e0' : '#e0f4ff',
        borderRadius: 1
      }}>
        <Typography variant="h6">
          Mock Exam - {currentIndex + 1}/{sessionQuestions.length}
        </Typography>
        <Typography variant="h6" sx={{ color: timeRemaining < 600 ? 'error.main' : 'info.main' }}>
          Time: {formatTime(timeRemaining)}
        </Typography>
      </Box>

      {sessionQuestions[currentIndex] && (
        <QuestionDisplay question={sessionQuestions[currentIndex]} />
      )}
    </Box>
  );
}

// ============================================================================
// 8. EXPORT HOOK FOR USE IN OTHER COMPONENTS
// ============================================================================

export {
  fetchTitrationQuestions,
  fetchQuestion,
  fetchRandomPracticeQuestions,
  fetchQuestionStatistics,
  useTitrationQuestions,
  QuestionDisplay,
  QuestionSelector,
  LabWithQuestion,
  PracticeSession,
  MockExamSession
};

// ============================================================================
// 9. EXAMPLE USAGE IN MAIN COMPONENT
// ============================================================================

/*
import React from 'react';
import { Box, Container } from '@mui/material';
import { LabWithQuestion, PracticeSession, MockExamSession } from './TitrationQuestions';

function ChemistryLabs() {
  const [mode, setMode] = React.useState('lab'); // 'lab', 'practice', 'exam'

  return (
    <Container>
      {mode === 'lab' && <LabWithQuestion labMode="practice" />}
      {mode === 'practice' && <PracticeSession />}
      {mode === 'exam' && <MockExamSession />}
    </Container>
  );
}

export default ChemistryLabs;
*/
