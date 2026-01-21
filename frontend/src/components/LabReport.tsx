import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  // ...existing code...
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  // ...existing code...
  CircularProgress,
} from '@mui/material';
// ...existing code...
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../api';

interface LabReportProps {
  labSessionId: string;
  labData: any;
  simulationData: any;
  scoring: any;
  onClose?: () => void;
}

const LabReport: React.FC<LabReportProps> = ({
  labSessionId,
  labData,
  simulationData,
  scoring,
  onClose,
}) => {
  const [reportHtml, setReportHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateReport = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/lab-results/session/${labSessionId}/report`);
        setReportHtml(response.data.html);
      } catch (error) {
        console.error('Error generating report:', error);
        // Generate fallback report
        generateFallbackReport();
      } finally {
        setLoading(false);
      }
    };
    generateReport();
  }, []);

  const generateFallbackReport = () => {
    const html = `
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <h1 style="color: #667eea; text-align: center;">Lab Report</h1>
        <h2>${labData?.title || 'Lab'}</h2>
        
        <h3>Lab Information</h3>
        <p><strong>Subject:</strong> ${labData?.subject || 'N/A'}</p>
        <p><strong>Status:</strong> ${scoring?.grade || 'Pending'}</p>
        
        ${
          simulationData?.measurements?.length > 0
            ? `
          <h3>Measurements</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #667eea; color: white;">
                <th style="border: 1px solid #ddd; padding: 10px;">Name</th>
                <th style="border: 1px solid #ddd; padding: 10px;">Value</th>
                <th style="border: 1px solid #ddd; padding: 10px;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${simulationData.measurements
                .map(
                  (m: any) =>
                    `<tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${m.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${m.value}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${m.unit}</td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        `
            : ''
        }
        
        <h3>Observations</h3>
        <p>${simulationData?.observations || 'No observations recorded'}</p>
        
        ${
          scoring
            ? `
          <h3>Scoring</h3>
          <p><strong>Total Score:</strong> ${scoring.totalScore}/100</p>
          <p><strong>Grade:</strong> ${scoring.grade}</p>
          <p><strong>Feedback:</strong> ${scoring.feedback}</p>
        `
            : ''
        }
      </div>
    `;
    setReportHtml(html);
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    setLoading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        allowTaint: true,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${labData?.title || 'lab-report'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadHTML = () => {
    const element = document.createElement('a');
    const file = new Blob([reportHtml], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `${labData?.title || 'lab-report'}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareReport = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Lab Report - ${labData?.title}`,
          text: `Check out my lab report for ${labData?.title}`,
          url: window.location.href,
        });
      } else {
        alert('Share not supported on this device. Try copying the URL.');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  if (loading && !reportHtml) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={downloadPDF}
          disabled={loading || !reportHtml}
        >
          Download PDF
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={downloadHTML}
          disabled={loading || !reportHtml}
        >
          Download HTML
        </Button>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setShareDialogOpen(true)}
        >
          Share Report
        </Button>
        {onClose && (
          <Button variant="outlined" color="error" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      {/* Report Content */}
      <Card>
        <CardContent>
          <Box
            ref={reportRef}
            sx={{
              backgroundColor: 'white',
              p: 4,
              borderRadius: 1,
              color: '#000000',
              '& *': {
                color: '#000000 !important',
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                color: '#667eea !important',
              },
            }}
            dangerouslySetInnerHTML={{ __html: reportHtml }}
          />
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
        <DialogTitle>Share Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Share your lab report with others
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                const url = window.location.href;
                navigator.clipboard.writeText(url);
                alert('Link copied to clipboard!');
              }}
            >
              Copy Link
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={shareReport}
            >
              Share
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabReport;
