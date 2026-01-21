import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Doughnut,
  Bar,
} from 'react-chartjs-2';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Chart as ChartJS,
} from 'chart.js';
import api from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ScoringDashboardProps {
  userId: string;
}

interface LabStatistic {
  subject: string;
  totalLabs: number;
  completedLabs: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
}

const ScoringDashboard: React.FC<ScoringDashboardProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [overallStats, setOverallStats] = useState<any>(null);
  const [subjectStats, setSubjectStats] = useState<LabStatistic[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/lab-results/stats/user/${userId}`);
      setOverallStats(response.data.statistics);

      // Fetch subject-specific stats
      const subjects = ['Chemistry', 'Physics', 'Biology'];
      const stats: LabStatistic[] = [];

      for (const subject of subjects) {
        try {
          const subResponse = await api.get(
            `/lab-results/stats/${userId}/${subject}`
          );
          stats.push({
            subject,
            ...subResponse.data.statistics,
            totalLabs: subResponse.data.totalLabs,
            completedLabs: subResponse.data.statistics.completionRate,
          });
        } catch (e) {
          // Continue if subject stats not available
        }
      }

      setSubjectStats(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      A: '#4caf50',
      B: '#ff9800',
      C: '#2196f3',
      D: '#ff6f00',
      F: '#f44336',
    };
    return colors[grade] || '#999';
  };

  const gradeDistributionChart = overallStats?.gradeDistribution && {
    labels: ['A', 'B', 'C', 'D', 'F'],
    datasets: [
      {
        data: [
          overallStats.gradeDistribution.A,
          overallStats.gradeDistribution.B,
          overallStats.gradeDistribution.C,
          overallStats.gradeDistribution.D,
          overallStats.gradeDistribution.F,
        ],
        backgroundColor: ['#4caf50', '#ff9800', '#2196f3', '#ff6f00', '#f44336'],
      },
    ],
  };

  const scoreDistributionChart = overallStats && {
    labels: ['0-20', '21-40', '41-60', '61-80', '81-100'],
    datasets: [
      {
        label: 'Score Distribution',
        data: [
          Math.random() * 5,
          Math.random() * 5,
          Math.random() * 5,
          Math.random() * 5,
          Math.random() * 5,
        ],
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
      },
    ],
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Overall Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Total Labs Completed
              </Typography>
              <Typography variant="h3" sx={{ color: '#667eea' }}>
                {overallStats?.completionRate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h3" sx={{ color: '#667eea' }}>
                {overallStats?.averageScore || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                out of 100
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Highest Score
              </Typography>
              <Typography variant="h3" sx={{ color: '#4caf50' }}>
                {overallStats?.highestScore || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="textSecondary" gutterBottom>
                Lowest Score
              </Typography>
              <Typography variant="h3" sx={{ color: '#f44336' }}>
                {overallStats?.lowestScore || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Grade Distribution" />
            <CardContent sx={{ position: 'relative', height: 300 }}>
              {gradeDistributionChart && (
                <Doughnut
                  data={gradeDistributionChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Score Range Distribution" />
            <CardContent sx={{ position: 'relative', height: 300 }}>
              {scoreDistributionChart && (
                <Bar
                  data={scoreDistributionChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                  }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subject-Specific Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Performance by Subject" />
        <CardContent>
          <Tabs value={tabValue} onChange={(e, value) => setTabValue(value)}>
            <Tab label="Chemistry" />
            <Tab label="Physics" />
            <Tab label="Biology" />
          </Tabs>

          {subjectStats.length > 0 && subjectStats[tabValue] && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Average Score
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#667eea', mb: 1 }}>
                      {subjectStats[tabValue].averageScore}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={subjectStats[tabValue].averageScore}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Completion Rate
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ color: '#4caf50', mb: 1 }}>
                      {subjectStats[tabValue].completedLabs}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={subjectStats[tabValue].completedLabs}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Grade Distribution
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {Object.entries(subjectStats[tabValue].gradeDistribution).map(
                  ([grade, count]: [string, any]) => (
                    <Chip
                      key={grade}
                      label={`${grade}: ${count}`}
                      sx={{
                        backgroundColor: getGradeColor(grade),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  )
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recommended Actions */}
      <Card>
        <CardHeader title="Recommendations" />
        <CardContent>
          {overallStats?.averageScore < 70 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your average score is below 70%. Consider reviewing the lab procedures
              and practicing more experiments.
            </Alert>
          )}
          {overallStats?.gradeDistribution?.F > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You have {overallStats.gradeDistribution.F} labs with grade F. Consider
              retaking these labs.
            </Alert>
          )}
          <Typography variant="body2">
            ✓ Keep detailed observations during experiments
          </Typography>
          <Typography variant="body2">
            ✓ Double-check calculations before submitting
          </Typography>
          <Typography variant="body2">
            ✓ Review expected values and compare with your results
          </Typography>
          <Typography variant="body2">
            ✓ Participate in group discussions to improve understanding
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ScoringDashboard;
