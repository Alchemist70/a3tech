import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Chip,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack, CheckCircle, Schedule, Download, Share } from '@mui/icons-material';
import api from '../api';

const JambCheckResult: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [examId, setExamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

  const handleDownloadResults = async () => {
    if (!results) return;

    // Generate comprehensive text for fallback
    const performanceSection = results.performanceBySubject && results.performanceBySubject.length > 0
      ? results.performanceBySubject
          .map((s: any) => `${s.subject}: ${s.score}/${s.totalQuestions} (${((s.score / s.totalQuestions) * 100).toFixed(1)}%)`)
          .join('\n')
      : 'No subject performance data available';
    
    const text = [
      'WEEKLY MOCK TEST RESULTS',
      '='.repeat(50),
      '',
      'EXAM DETAILS',
      '-'.repeat(50),
      `Exam Type: JAMB Mock Test`,
      `Exam ID: ${results.examId}`,
      `Candidate Name: ${results.candidateName || 'N/A'}`,
      `Submitted At: ${new Date(results.submittedAt).toLocaleString()}`,
      `Subjects: ${Array.isArray(results.subjectCombination) ? results.subjectCombination.join(', ') : 'N/A'}`,
      '',
      'OVERALL PERFORMANCE',
      '-'.repeat(50),
      `Score: ${results.score}/${results.totalQuestions} (${results.percentage.toFixed(1)}%)`,
      '',
      'PERFORMANCE BY SUBJECT',
      '-'.repeat(50),
      performanceSection,
      '',
      `GENERATED: ${new Date().toLocaleString()}`,
    ].join('\n');

    const ensureHtml2Pdf = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if ((window as any).html2pdf) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.2/html2pdf.bundle.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (e) => reject(e);
        document.head.appendChild(script);
      });
    };

    try {
      // Create comprehensive HTML document for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>JAMB Mock Test Results - ${results.examId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1976d2; padding-bottom: 15px; }
            .header h1 { margin: 0; color: #1976d2; font-size: 24px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; background: #988686ff; padding: 10px; margin-bottom: 15px; border-left: 4px solid #1976d2; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .detail-item { background: #f9f9f9; padding: 10px; border-radius: 4px; }
            .detail-label { font-size: 12px; color: #666; font-weight: bold; text-transform: uppercase; }
            .detail-value { font-size: 14px; margin-top: 5px; font-weight: 600; color: #753dc8ff; }
            .performance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .perf-box { background: #e8f5e9; padding: 15px; border-radius: 4px; text-align: center; border: 1px solid #4caf50; }
            .perf-number { font-size: 28px; font-weight: bold; color: #2e7d32; margin: 10px 0; }
            .perf-label { font-size: 12px; color: #666; }
            .subject-item { padding: 10px; margin-bottom: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #2196f3; }
            .subject-name { font-weight: 600; color: #1976d2; }
            .subject-score { font-size: 12px; color: #666; margin-top: 3px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>WEEKLY MOCK TEST RESULTS</h1>
            <p style="color: #753dc8ff;">JAMB Examination</p>
          </div>
          
          <div class="section">
            <div class="section-title">EXAM DETAILS</div>
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Exam Type</div>
                <div class="detail-value">JAMB Mock Test</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Exam ID</div>
                <div class="detail-value">${results.examId}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Candidate Name</div>
                <div class="detail-value">${results.candidateName || 'N/A'}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Submitted At</div>
                <div class="detail-value">${new Date(results.submittedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">OVERALL PERFORMANCE</div>
            <div class="performance-grid">
              <div class="perf-box">
                <div class="perf-label">Score</div>
                <div class="perf-number">${results.score}/${results.totalQuestions}</div>
              </div>
              <div class="perf-box">
                <div class="perf-label">Overall Percentage</div>
                <div class="perf-number">${results.percentage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
          
          ${results.performanceBySubject && results.performanceBySubject.length > 0 ? `
          <div class="section">
            <div class="section-title">PERFORMANCE BY SUBJECT</div>
            ${results.performanceBySubject.map((s: any) => `
              <div class="subject-item">
                <div class="subject-name">${s.subject}</div>
                <div class="subject-score">Score: ${s.score}/${s.totalQuestions} (${((s.score / s.totalQuestions) * 100).toFixed(1)}%)</div>
              </div>
            `).join('')}
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>This is an official record of your mock test performance.</p>
          </div>
        </body>
        </html>
      `;

      await ensureHtml2Pdf();
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      (window as any).html2pdf()
        .set({ margin: 10, filename: `JAMB-Results-${results.examId}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' } })
        .from(element)
        .save()
        .catch((err: any) => {
          console.warn('html2pdf error, falling back to TXT:', err);
          downloadAsText(text, results.examId);
        });
    } catch (e) {
      console.warn('PDF generation failed, falling back to TXT', e);
      downloadAsText(text, results.examId);
    }
  };

  const downloadAsText = (content: string, examId: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JAMB-Results-${examId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleShareResults = (platform: string) => {
    if (!results) return;

    const resultText = `I scored ${results.score}/${results.totalQuestions} (${results.percentage.toFixed(1)}%) on the JAMB Mock Test!`;
    const url = window.location.href;
    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(resultText)} ${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(resultText)} ${encodeURIComponent(url)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    setShareAnchor(null);
  };

  const handleCheckResults = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examId.trim()) {
      setError('Please enter your Exam ID');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Validate that this examId belongs to JAMB before calling backend
      if (!examId.startsWith('J')) {
        setError('This Exam ID is not a JAMB ID. JAMB Exam IDs begin with "J".');
        setResults(null);
        setLoading(false);
        return;
      }

      const response = await api.get(`/mock-test/check-results/${examId}`);
      
      if (response.data.status === 'not_ready') {
        setError('Your results are not yet available. Results are typically available 1 hour after submission.');
        setResults(null);
      } else {
        setResults(response.data);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Exam ID not found. Please check and try again.');
      } else {
        setError(error.response?.data?.message || 'Failed to retrieve results. Please try again.');
      }
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default, py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
          >
            Back to Home
          </Button>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: 'primary.dark' }}>
            Check JAMB Mock Test Results
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Enter your Exam ID to check your mock test results. Results are typically available 1 hour after test submission.
          </Typography>
        </Box>

        {/* Main Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {/* Input Section */}
            <Box component="form" onSubmit={handleCheckResults} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                Enter Your Exam ID
              </Typography>
              
              <TextField
                fullWidth
                placeholder="Enter your 12-character Exam ID"
                value={examId}
                onChange={(e) => {
                  setExamId(e.target.value.toUpperCase());
                  setError('');
                }}
                inputProps={{ maxLength: 12, style: { textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600 } }}
                sx={{ mb: 3 }}
                disabled={loading}
                variant="outlined"
              />

              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !examId.trim()}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Check Results'}
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Results Display */}
            {results && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Test Submitted Successfully
                    </Typography>
                  </Box>

                  {/* Exam Details */}
                  <Paper elevation={0} sx={{ p: 3, background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 2, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                      Exam Details
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Exam Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>JAMB Mock Test</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Exam ID</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{results.examId}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Candidate Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{results.candidateName || 'N/A'}</Typography>
                      </Box>
                      {results.submittedAt && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Submitted At</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(results.submittedAt).toLocaleString()}
                          </Typography>
                        </Box>
                      )}
                      {results.subjectCombination && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">Subjects</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {Array.isArray(results.subjectCombination) ? results.subjectCombination.length : 0} subjects
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>

                  {/* Score Display (if available) */}
                  {results.score !== undefined && (
                    <Paper elevation={0} sx={{ p: 3, background: (theme) => theme.palette.mode === 'dark' ? 'rgba(76,175,80,0.1)' : 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 2, mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                        Your Performance
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {results.score}/{results.totalQuestions}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Questions Answered</Typography>
                        </Box>
                        {results.percentage !== undefined && (
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {results.percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Overall Score</Typography>
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  )}
                </Box>

                {/* Performance by Subject (if available) */}
                {results.performanceBySubject && results.performanceBySubject.length > 0 && (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Performance by Subject
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
                      {results.performanceBySubject.map((subject: any, idx: number) => (
                        <Paper key={idx} elevation={0} sx={{ p: 2, background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {subject.subject}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {subject.score}/{subject.totalQuestions} correct
                              </Typography>
                            </Box>
                            <Chip 
                              label={`${((subject.score / subject.totalQuestions) * 100).toFixed(1)}%`}
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </>
                )}

                {/* Next Steps */}
                <Alert severity="info" sx={{ mt: 4 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    What's Next?
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ lineHeight: 1.6 }}>
                    • Review your performance by subject<br/>
                    • Identify weak areas for further study<br/>
                    • Take another mock test to improve your scores<br/>
                    • Visit your account to view detailed analysis
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', gap: 2, mt: 4, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate('/')}
                  >
                    Back to Home
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/mock-test/jamb')}
                  >
                    Take Another Test
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={handleDownloadResults}
                    sx={{ flex: 1, minWidth: 120 }}
                  >
                    Download
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={(e) => setShareAnchor(e.currentTarget)}
                    sx={{ flex: 1, minWidth: 120 }}
                  >
                    Share
                  </Button>
                  <Menu
                    anchorEl={shareAnchor}
                    open={Boolean(shareAnchor)}
                    onClose={() => setShareAnchor(null)}
                  >
                    <MenuItem onClick={() => handleShareResults('twitter')}>Share on Twitter</MenuItem>
                    <MenuItem onClick={() => handleShareResults('facebook')}>Share on Facebook</MenuItem>
                    <MenuItem onClick={() => handleShareResults('linkedin')}>Share on LinkedIn</MenuItem>
                    <MenuItem onClick={() => handleShareResults('whatsapp')}>Share on WhatsApp</MenuItem>
                  </Menu>
                </Box>
              </>
            )}

            {/* Info Box */}
            {!results && (
              <Box sx={{ p: 3, background: (theme) => theme.palette.mode === 'dark' ? 'rgba(25,118,210,0.1)' : 'rgba(25,118,210,0.1)', borderRadius: 2, border: '1px solid rgba(25,118,210,0.3)' }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Schedule sx={{ color: 'info.main', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Results Not Yet Available?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      Results are typically available 1 hour after test submission. If you submitted your test recently, please check back later. Your Exam ID will remain valid for 30 days.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default JambCheckResult;
