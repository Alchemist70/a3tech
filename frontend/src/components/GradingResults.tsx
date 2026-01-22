import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Typography,
  Chip,
  Button,
  Grid,
  Alert
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface SubQuestionResult {
  sub_id: string;
  question_text: string;
  student_answer: string;
  marks_obtained: number;
  max_marks: number;
  feedback: string;
  is_correct: boolean;
}

interface GradingResult {
  question_id: string;
  question_text: string;
  total_marks: number;
  marks_obtained: number;
  percentage: number;
  feedback?: any;
  sub_question_results: SubQuestionResult[];
  grading_details?: any[];
  correct_answers?: any[];
  marking_scheme?: any;
}

interface ResultsComponentProps {
  gradingResult: GradingResult | null;
  loading?: boolean;
  onRetake?: () => void;
  onDownload?: () => void;
}

export const GradingResults: React.FC<ResultsComponentProps> = ({
  gradingResult,
  loading = false,
  onRetake,
  onDownload
}) => {
  const [expandedSubQuestion, setExpandedSubQuestion] = useState<string | null>(null);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            ⏳ Grading your answers...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!gradingResult) {
    return null;
  }

  const performanceColor = getPerformanceColor(gradingResult.percentage);
  const performanceLevel = getPerformanceLevel(gradingResult.percentage);

  return (
    <Box sx={{ width: '100%', mt: 3 }}>
      {/* Overall Score Card */}
      <Card sx={{ mb: 3, background: `linear-gradient(135deg, ${performanceColor}33 0%, ${performanceColor}11 100%)` }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: performanceColor, fontWeight: 'bold', mb: 1 }}>
                  {gradingResult.percentage}%
                </Typography>
                <Typography variant="h6" sx={{ color: performanceColor, mb: 1 }}>
                  {performanceLevel}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {gradingResult.marks_obtained} / {gradingResult.total_marks} marks
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Score Breakdown
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={gradingResult.percentage}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: performanceColor,
                      borderRadius: 5
                    },
                    mb: 1
                  }}
                />
                <Typography variant="caption" color="textSecondary">
                  {performanceLevel}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Feedback */}
      <Alert severity={getAlertSeverity(gradingResult.percentage)} sx={{ mb: 3 }}>
        <Typography variant="body2">
          {getPerformanceFeedback(gradingResult.percentage)}
        </Typography>
      </Alert>

      {/* Question Details */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Question Details"
          subheader={gradingResult.question_id}
        />
        <CardContent>
          <Typography variant="body2" paragraph>
            {gradingResult.question_text}
          </Typography>
        </CardContent>
      </Card>

      {/* Sub-Question Results */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Answer Review" />
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Question</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000' }}>
                    Marks
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000' }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Feedback</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradingResult.sub_question_results.map((result) => (
                  <React.Fragment key={result.sub_id}>
                    <TableRow
                      sx={{
                        backgroundColor: result.is_correct ? '#e8f5e9' : '#ffebee',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: result.is_correct ? '#c8e6c9' : '#ffcccc'
                        }
                      }}
                      onClick={() =>
                        setExpandedSubQuestion(
                          expandedSubQuestion === result.sub_id ? null : result.sub_id
                        )
                      }
                    >
                      <TableCell sx={{ color: '#000' }}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#000' }}>
                            Part ({result.sub_id})
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#555' }}>
                            {result.question_text}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${result.marks_obtained}/${result.max_marks}`}
                          color={result.is_correct ? 'success' : 'error'}
                          variant="outlined"
                          size="small"
                          sx={{ color: '#000' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#000' }}>
                        {result.is_correct ? (
                          <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                        ) : (
                          <CloseIcon sx={{ color: '#f44336', fontSize: 24 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#000' }}>
                        <Typography variant="body2" sx={{ color: '#000' }}>{result.feedback}</Typography>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    {expandedSubQuestion === result.sub_id && (
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell colSpan={4} sx={{ py: 2 }}>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Your Answer:
                            </Typography>
                            <Paper
                              sx={{
                                p: 1.5,
                                mb: 2,
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                fontFamily: 'monospace',
                                color: '#000'
                              }}
                            >
                              <Typography variant="body2" sx={{ color: '#000' }}>{result.student_answer || '(No answer provided)'}</Typography>
                            </Paper>

                            {gradingResult.correct_answers && (
                              <>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Expected Answer:
                                </Typography>
                                <Paper
                                  sx={{
                                    p: 1.5,
                                    mb: 2,
                                    backgroundColor: '#e8f5e9',
                                    border: '1px solid #4caf50',
                                    fontFamily: 'monospace',
                                    color: '#000'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ color: '#000' }}>
                                    {gradingResult.correct_answers.find(
                                      (ca: any) => ca.sub_id === result.sub_id
                                    )?.answer_text ||
                                      gradingResult.correct_answers.find(
                                        (ca: any) => ca.sub_id === result.sub_id
                                      )?.answer_value ||
                                      'N/A'}
                                  </Typography>
                                </Paper>
                              </>
                            )}

                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                              Feedback:
                            </Typography>
                            <Alert severity="info" variant="outlined">
                              {result.feedback}
                            </Alert>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Marking Scheme Reference */}
      {gradingResult.marking_scheme && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Marking Scheme Breakdown"
            avatar={<InfoIcon sx={{ color: '#1976d2' }} />}
          />
          <CardContent>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Step</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#000' }}>
                      Marks
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#000' }}>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gradingResult.marking_scheme.breakdown?.map((step: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Typography variant="body2">{step.step}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${step.marks}m`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {step.description}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        {onRetake && (
          <Button
            variant="contained"
            color="primary"
            onClick={onRetake}
            sx={{ px: 3 }}
          >
            Retake Quiz
          </Button>
        )}
        {onDownload && (
          <Button
            variant="outlined"
            color="primary"
            onClick={onDownload}
            sx={{ px: 3 }}
          >
            Download Results
          </Button>
        )}
      </Box>
    </Box>
  );
};

// Helper functions
function getPerformanceColor(percentage: number): string {
  if (percentage >= 90) return '#4caf50'; // Green
  if (percentage >= 80) return '#8bc34a'; // Light Green
  if (percentage >= 70) return '#ffc107'; // Amber
  if (percentage >= 60) return '#ff9800'; // Orange
  if (percentage >= 50) return '#ff6f00'; // Deep Orange
  return '#f44336'; // Red
}

function getPerformanceLevel(percentage: number): string {
  if (percentage >= 90) return 'Excellent! 🌟';
  if (percentage >= 80) return 'Very Good ✓';
  if (percentage >= 70) return 'Good ✓';
  if (percentage >= 60) return 'Satisfactory';
  if (percentage >= 50) return 'Pass';
  return 'Needs Improvement';
}

function getAlertSeverity(percentage: number): 'success' | 'warning' | 'error' | 'info' {
  if (percentage >= 70) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
}

function getPerformanceFeedback(percentage: number): string {
  if (percentage >= 90) {
    return 'Excellent work! You have demonstrated comprehensive understanding of the practical concepts and techniques.';
  }
  if (percentage >= 80) {
    return 'Very good performance! You have a strong grasp of the practical skills with only minor gaps.';
  }
  if (percentage >= 70) {
    return 'Good work! You understand most concepts. Review the sections you missed to improve further.';
  }
  if (percentage >= 60) {
    return 'Satisfactory. You have basic understanding but need to focus on improving accuracy and completeness.';
  }
  if (percentage >= 50) {
    return 'You have passed, but there are significant areas for improvement. Review the marking scheme and try again.';
  }
  return 'Keep practicing! Review the correct answers and the marking scheme to understand the concepts better.';
}

export default GradingResults;
