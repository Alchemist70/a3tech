import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  // ...existing code...
} from '@mui/material';
import api from '../api';
import '../pages/sections.css';
import EnhancedLabSimulation from '../components/EnhancedLabSimulation';
import LabReport from '../components/LabReport';
import ScoringDashboard from '../components/ScoringDashboard';

interface Lab {
  _id?: string;
  id?: string;
  title: string;
  subject: string;
  description: string;
  objectives?: string[];
  materials?: string[];
  procedure?: string;
  precautions?: string[];
  observations?: string;
  calculations?: string;
  simulationContent?: string;
  order?: number;
}

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`labs-tabpanel-${index}`}
      aria-labelledby={`labs-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Labs: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'simulation' | 'report' | 'dashboard'>('list');
  const [loading, setLoading] = useState(false);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [labSessionId, setLabSessionId] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [scoring, setScoring] = useState<any>(null);
  const [filteredLabs, setFilteredLabs] = useState({
    Chemistry: [] as Lab[],
    Physics: [] as Lab[],
    Biology: [] as Lab[],
  });

  useEffect(() => {
    const fetchLabs = async () => {
      setLoading(true);
      try {
        const response = await api.get('/labs');
        const allLabs = Array.isArray(response.data) ? response.data : [];

        // Filter labs by subject
        const filtered = {
          Chemistry: allLabs.filter((lab: Lab) => lab.subject === 'Chemistry'),
          Physics: allLabs.filter((lab: Lab) => lab.subject === 'Physics'),
          Biology: allLabs.filter((lab: Lab) => lab.subject === 'Biology'),
        };
        setFilteredLabs(filtered);
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch current user info
    const fetchCurrentUser = async () => {
      try {
        const userResponse = await api.get('/auth/me');
        console.log('[Labs] Auth response:', userResponse.data);
        
        if (userResponse.data?.success === true && userResponse.data?.data) {
          console.log('[Labs] Setting current user:', userResponse.data.data);
          setCurrentUser(userResponse.data.data);
        } else {
          console.log('[Labs] Auth failed or no user data:', userResponse.data);
        }
      } catch (error: any) {
        console.log('[Labs] Failed to fetch current user:', {
          status: error?.response?.status,
          message: error?.message,
          data: error?.response?.data
        });
      }
    };

    fetchLabs();
    fetchCurrentUser();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  const handleOpenLab = (lab: Lab) => {
    setSelectedLab(lab);
    setDialogOpen(true);
  };

  const handleCloseLab = () => {
    setDialogOpen(false);
    setSelectedLab(null);
  };

  const handleStartSimulation = async () => {
    if (!selectedLab) return;

    setLoading(true);
    try {
      // Get user if not already cached
      let user = currentUser;
      if (!user) {
        try {
          const userResponse = await api.get('/auth/me');
          if (userResponse.data?.success === true && userResponse.data?.data) {
            user = userResponse.data.data;
            setCurrentUser(user);
          }
        } catch (err) {
          console.error('Failed to get user:', err);
          alert('Please log in to start a lab simulation');
          setLoading(false);
          return;
        }
      }

      if (!user) {
        alert('Please log in to start a lab simulation');
        setLoading(false);
        return;
      }

      const response = await api.post('/lab-results/session', {
        userId: user._id || user.id,
        labId: selectedLab._id || selectedLab.id,
      });

      setLabSessionId(response.data.data._id);
      setViewMode('simulation');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error starting lab session:', error);
      alert('Error starting lab session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSimulation = async (data: any) => {
    if (!labSessionId) return;

    setLoading(true);
    try {
      await api.put(`/lab-results/session/${labSessionId}/results`, {
        measurements: data.measurements,
        graphData: data.graphData,
      });

      await api.put(`/lab-results/session/${labSessionId}/measurements`, {
        measurements: data.measurements,
        observations: data.observations,
        notes: data.notes,
      });

      setSimulationData(data);
      alert('Simulation data saved! Submit when ready for grading.');
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Error saving simulation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLab = async () => {
    if (!labSessionId) return;

    setLoading(true);
    try {
      // Submit lab
      await api.put(`/lab-results/session/${labSessionId}/submit`);

      // Grade lab
      const gradeResponse = await api.put(`/lab-results/session/${labSessionId}/grade`, {
        procedureFollowed: 80,
      });

      setScoring(gradeResponse.data.scoring);
      setViewMode('report');
    } catch (error) {
      console.error('Error submitting lab:', error);
      alert('Error submitting lab. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LabCard: React.FC<{ lab: Lab }> = ({ lab }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-4px)',
        },
      }}
      onClick={() => handleOpenLab(lab)}
    >
      <CardHeader
        title={lab.title}
        subheader={`Order: ${lab.order || 0}`}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="body2" color="textSecondary" paragraph>
          {lab.description.substring(0, 150)}
          {lab.description.length > 150 ? '...' : ''}
        </Typography>
        {lab.objectives && lab.objectives.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              Objectives:
            </Typography>
            <Typography variant="caption" display="block">
              {lab.objectives.slice(0, 2).join(', ')}
              {lab.objectives.length > 2 ? `...` : ''}
            </Typography>
          </Box>
        )}
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          fullWidth
          onClick={(e) => {
            e.stopPropagation();
            handleOpenLab(lab);
          }}
        >
          View & Simulate
        </Button>
      </Box>
    </Card>
  );

  const LabDetailsDialog: React.FC = () => (
    <Dialog open={dialogOpen} onClose={handleCloseLab} maxWidth="md" fullWidth>
      <DialogTitle>{selectedLab?.title}</DialogTitle>
      <DialogContent dividers>
        {selectedLab && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Description
            </Typography>
            <Typography paragraph>{selectedLab.description}</Typography>

            {selectedLab.objectives && selectedLab.objectives.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  📌 Objectives
                </Typography>
                <ul>
                  {selectedLab.objectives.map((obj, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{obj}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedLab.materials && selectedLab.materials.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  🧪 Materials Required
                </Typography>
                <ul>
                  {selectedLab.materials.map((material, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{material}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedLab.procedure && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  📋 Procedure
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, color: '#000000' }}
                >
                  {selectedLab.procedure}
                </Typography>
              </>
            )}

            {selectedLab.precautions && selectedLab.precautions.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  ⚠️ Precautions
                </Typography>
                <ul>
                  {selectedLab.precautions.map((prec, idx) => (
                    <li key={idx}>
                      <Typography variant="body2">{prec}</Typography>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selectedLab.observations && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  👁️ Expected Observations
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, color: '#000000' }}
                >
                  {selectedLab.observations}
                </Typography>
              </>
            )}

            {selectedLab.calculations && (
              <>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', mt: 3 }}>
                  🔢 Calculations
                </Typography>
                <Typography
                  variant="body2"
                  component="div"
                  sx={{ whiteSpace: 'pre-wrap', bgcolor: '#f5f5f5', p: 2, borderRadius: 1, color: '#000000' }}
                >
                  {selectedLab.calculations}
                </Typography>
              </>
            )}

            {/* Old simulation content removed - using EnhancedLabSimulation component instead */}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseLab} color="primary">
          Close
        </Button>
        <Button
          onClick={handleStartSimulation}
          color="success"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Start Simulation'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* View Mode Navigation */}
      {viewMode !== 'list' && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setViewMode('list')}
          >
            Back to Labs
          </Button>
          {currentUser && (
            <Button
              variant={viewMode === 'dashboard' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('dashboard')}
            >
              Scoring Dashboard
            </Button>
          )}
        </Box>
      )}

      {/* Dashboard View */}
      {viewMode === 'dashboard' && currentUser && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            📊 Scoring Dashboard
          </Typography>
          <ScoringDashboard userId={currentUser._id || currentUser.id} />
        </Box>
      )}

      {/* Simulation View */}
      {viewMode === 'simulation' && selectedLab && labSessionId && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            🔬 {selectedLab.title} - Interactive Simulation
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Complete the simulation by recording measurements and observations. Your
            work will be automatically saved and graded.
          </Alert>
          <EnhancedLabSimulation
            labId={labSessionId}
            labTitle={selectedLab.title}
            subject={selectedLab.subject}
            onSave={handleSaveSimulation}
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleSubmitLab}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Submit & Grade'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setViewMode('list');
                setLabSessionId(null);
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {/* Report View */}
      {viewMode === 'report' && selectedLab && labSessionId && (
        <Box>
          <Typography variant="h4" sx={{ mb: 3 }}>
            📄 Lab Report - {selectedLab.title}
          </Typography>
          {scoring && (
            <Alert
              severity={scoring.grade === 'A' || scoring.grade === 'B' ? 'success' : 'info'}
              sx={{ mb: 2 }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Grade: <strong>{scoring.grade}</strong> - Score: {scoring.totalScore}/100
              </Typography>
              <Typography variant="body2">{scoring.feedback}</Typography>
            </Alert>
          )}
          <LabReport
            labSessionId={labSessionId}
            labData={selectedLab}
            simulationData={simulationData}
            scoring={scoring}
            onClose={() => {
              setViewMode('list');
              setLabSessionId(null);
              setSimulationData(null);
              setScoring(null);
            }}
          />
        </Box>
      )}

      {/* Labs List View */}
      {viewMode === 'list' && (
        <>
          {/* Header */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              🔬 Laboratory Practicals
            </Typography>
            <Typography variant="h6" color="textSecondary">
              Learn and simulate essential Chemistry, Physics, and Biology practicals
            </Typography>
            {currentUser && (
              <Chip label={`Logged in as: ${currentUser.name}`} sx={{ mt: 2 }} />
            )}
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tab} onChange={handleTabChange} aria-label="labs subjects">
              <Tab label="🧪 Chemistry" />
              <Tab label="⚙️ Physics" />
              <Tab label="🌿 Biology" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Chemistry */}
              <TabPanel value={tab} index={0}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Chemistry Practicals (8 Practicals)
                </Typography>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
                    How to Use This Tab
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Instructions:</strong> Select a Chemistry practical to view its details and start the simulation. Carefully read the objectives, materials, and procedure before starting. During the simulation, follow the steps, record your measurements and observations, and save your data.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Viewing Results:</strong> After completing the simulation, submit your results to receive instant grading and feedback. You can review your lab report and scoring dashboard for detailed analysis.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000000' }}>
                    <strong>Data Visualization:</strong> For simulations with graphs, the x-axis typically represents the measurement sequence or variable (e.g., volume, time), and the y-axis shows the recorded values. Analyze the graph's shape and trends to draw scientific conclusions (e.g., titration curve, reaction rate, etc.).
                  </Typography>
                </Box>
                {filteredLabs.Chemistry.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredLabs.Chemistry.map((lab) => (
                      <Grid item xs={12} sm={6} md={4} key={lab._id || lab.id}>
                        <LabCard lab={lab} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="textSecondary">
                    No Chemistry practicals available. Check back soon!
                  </Typography>
                )}
              </TabPanel>

              {/* Physics */}
              <TabPanel value={tab} index={1}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Physics Practicals (10 Practicals)
                </Typography>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#e1f5fe', borderLeft: '4px solid #0288d1', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
                    How to Use This Tab
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Instructions:</strong> Select a Physics practical to view its details and start the simulation. Read the objectives and procedure, then follow the simulation steps to collect data and make observations.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Viewing Results:</strong> After saving your simulation data, submit for grading to see your performance and feedback. Review the lab report for detailed results.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000000' }}>
                    <strong>Data Visualization:</strong> For simulations with graphs (e.g., pendulum, spring), the graph displays the relationship between variables (such as length vs. period, mass vs. extension). Use the graph to identify patterns, verify physical laws, and support your conclusions.
                  </Typography>
                </Box>
                {filteredLabs.Physics.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredLabs.Physics.map((lab) => (
                      <Grid item xs={12} sm={6} md={4} key={lab._id || lab.id}>
                        <LabCard lab={lab} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="textSecondary">
                    No Physics practicals available. Check back soon!
                  </Typography>
                )}
              </TabPanel>

              {/* Biology */}
              <TabPanel value={tab} index={2}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Biology Practicals (10 Practicals)
                </Typography>
                <Box sx={{ mb: 2, p: 2, backgroundColor: '#e8f5e9', borderLeft: '4px solid #388e3c', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#000000' }}>
                    How to Use This Tab
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Instructions:</strong> Choose a Biology practical to view its details and begin the simulation. Review the objectives and procedure, then follow the simulation steps, recording your findings as you go.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1, color: '#000000' }}>
                    <strong>Viewing Results:</strong> Save your simulation data and submit for grading to receive feedback and a detailed lab report.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000000' }}>
                    <strong>Data Visualization:</strong> If a graph is included, use it to visualize trends in your data (e.g., growth rates, enzyme activity). Interpret the graph to support your scientific conclusions.
                  </Typography>
                </Box>
                {filteredLabs.Biology.length > 0 ? (
                  <Grid container spacing={3}>
                    {filteredLabs.Biology.map((lab) => (
                      <Grid item xs={12} sm={6} md={4} key={lab._id || lab.id}>
                        <LabCard lab={lab} />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="textSecondary">
                    No Biology practicals available. Check back soon!
                  </Typography>
                )}
              </TabPanel>
            </>
          )}

          {/* Lab Details Dialog */}
          <LabDetailsDialog />

          {/* Features Section */}
          <Box sx={{ mt: 8, pt: 4, borderTop: '2px solid #eee' }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
              How to Use Labs
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      📚
                    </Typography>
                    <Typography variant="h6">Learn</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Understand the theory, objectives, and procedures
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      🎮
                    </Typography>
                    <Typography variant="h6">Simulate</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Practice with interactive simulations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      📊
                    </Typography>
                    <Typography variant="h6">Analyze</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Record observations and do calculations
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      ✅
                    </Typography>
                    <Typography variant="h6">Master</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Gain confidence for exams and real labs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Labs;
