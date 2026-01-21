import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Grid,
  // ...existing code...
  Paper,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import DOMPurify from 'dompurify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Measurement {
  name: string;
  value: number;
  unit: string;
}

interface SimulationState {
  measurements: Measurement[];
  observations: string;
  notes: string;
  graphData: any;
  status: 'in-progress' | 'completed';
}

interface LabSimulationProps {
  labId: string;
  labTitle: string;
  subject: string;
  onSave: (data: SimulationState) => void;
  registerField: (get: () => string, set: (val: string) => void) => (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}

const EnhancedLabSimulation: React.FC<LabSimulationProps> = ({
  labId,
  labTitle,
  subject,
  onSave,
  registerField,
}) => {
  const [simulationState, setSimulationState] = useState<SimulationState>({
    measurements: [],
    observations: '',
    notes: '',
    graphData: null,
    status: 'in-progress',
  });

  const [newMeasurement, setNewMeasurement] = useState({ name: '', value: '', unit: '' });
  const [showDataInput, setShowDataInput] = useState(false);

  // const [reportDialogOpen, setReportDialogOpen] = useState(false); // Removed as unused
    // Removed unused reportDialogOpen state
      // Removed unused reportDialogOpen state
    // Removed unused reportDialogOpen state
  // Removed unused reportDialogOpen state

  // Chemistry-specific simulations
  const renderChemistrySimulation = () => {
    if (labTitle.includes('Titration')) {
      return <AcidBaseTitrationSimulation onMeasurementsUpdate={handleAddMeasurement} />;
    } else if (labTitle.includes('Salt')) {
      return <SaltAnalysisSimulation onMeasurementsUpdate={handleAddMeasurement} registerField={registerField} />;
    } else if (labTitle.includes('Redox')) {
      return <RedoxTitrationSimulation onMeasurementsUpdate={handleAddMeasurement} />;
    }
    return <DefaultSimulation />;
  };

  // Physics-specific simulations
  const renderPhysicsSimulation = () => {
    if (labTitle.includes('Pendulum')) {
      return <PendulumSimulation onMeasurementsUpdate={handleAddMeasurement} />;
    } else if (labTitle.includes('Spring')) {
      return <SpringSimulation onMeasurementsUpdate={handleAddMeasurement} />;
    }
    return <DefaultSimulation />;
  };

  const handleAddMeasurement = (measurement: Measurement) => {
    setSimulationState((prev) => ({
      ...prev,
      measurements: [...prev.measurements, measurement],
    }));
  };

  const handleRemoveMeasurement = (index: number) => {
    setSimulationState((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((_, i) => i !== index),
    }));
  };

  const handleGenerateGraph = () => {
    if (simulationState.measurements.length < 2) {
      alert('Need at least 2 measurements to generate a graph');
      return;
    }

    const graphData = {
      labels: simulationState.measurements.map((m, i) => `${m.name} ${i + 1}`),
      datasets: [
        {
          label: simulationState.measurements[0].name,
          data: simulationState.measurements.map((m) => m.value),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
        },
      ],
    };

    setSimulationState((prev) => ({
      ...prev,
      graphData,
    }));
  };

  const handleSaveSimulation = () => {
    simulationState.status = 'completed';
    onSave(simulationState);
    alert('Simulation data saved successfully!');
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Experiment Data Visualization',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <Grid container spacing={3}>
        {/* Simulation Area */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Interactive Simulation" />
            <CardContent>
              {subject === 'Chemistry' && renderChemistrySimulation()}
              {subject === 'Physics' && renderPhysicsSimulation()}
              {subject === 'Biology' && <DefaultSimulation />}
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowDataInput(!showDataInput)}
                  fullWidth
                >
                  {showDataInput ? 'Hide' : 'Show'} Data Input
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Recording Area */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Data Recording" />
            <CardContent>
              {showDataInput && (
                <Box sx={{ mb: 3 }}>
                  <TextField
                    label="Measurement Name"
                    value={newMeasurement.name}
                    onChange={(e) =>
                      setNewMeasurement({ ...newMeasurement, name: e.target.value })
                    }
                    fullWidth
                    inputProps={{
                      placeholder: 'e.g., NaOH Volume, Temperature, pH',
                    }}
                    sx={{
                      mb: 1,
                      '& .MuiInputBase-input': {
                        color: '#000000',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#cccccc',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Value"
                    type="number"
                    value={newMeasurement.value}
                    onChange={(e) =>
                      setNewMeasurement({ ...newMeasurement, value: e.target.value })
                    }
                    fullWidth
                    inputProps={{
                      placeholder: 'e.g., 5.5, 25, 0.75',
                    }}
                    sx={{
                      mb: 1,
                      '& .MuiInputBase-input': {
                        color: '#000000',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#cccccc',
                        },
                      },
                    }}
                  />
                  <TextField
                    label="Unit"
                    value={newMeasurement.unit}
                    onChange={(e) =>
                      setNewMeasurement({ ...newMeasurement, unit: e.target.value })
                    }
                    fullWidth
                    inputProps={{
                      placeholder: 'e.g., mL, g, °C, mol/L',
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiInputBase-input': {
                        color: '#000000',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#cccccc',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (newMeasurement.name && newMeasurement.value) {
                        handleAddMeasurement({
                          name: newMeasurement.name,
                          value: parseFloat(newMeasurement.value),
                          unit: newMeasurement.unit,
                        });
                        setNewMeasurement({ name: '', value: '', unit: '' });
                      }
                    }}
                    fullWidth
                  >
                    Add Measurement
                  </Button>
                </Box>
              )}

              {/* Measurements List */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Recorded Measurements: {simulationState.measurements.length}
                </Typography>
                {simulationState.measurements.map((m, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      mb: 1,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 1,
                      color: '#000000',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#000000' }}>
                      {m.name}: <strong>{m.value} {m.unit}</strong>
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveMeasurement(idx)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Box>

              {/* Observations */}
              <TextField
                label="Observations"
                multiline
                rows={4}
                value={simulationState.observations}
                onFocus={registerField(
                  () => simulationState.observations,
                  (val: string) => setSimulationState((prev) => ({ ...prev, observations: val }))
                )}
                onChange={(e) =>
                  setSimulationState((prev) => ({ ...prev, observations: e.target.value }))
                }
                fullWidth
                inputProps={{
                  placeholder: 'Describe what you observed during the experiment (e.g., color changes, precipitate formation, temperature changes, etc.)',
                }}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    color: '#000000',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#cccccc',
                    },
                  },
                }}
              />

              {/* Notes */}
              <TextField
                label="Notes"
                multiline
                rows={2}
                value={simulationState.notes}
                onFocus={registerField(
                  () => simulationState.notes,
                  (val: string) => setSimulationState((prev) => ({ ...prev, notes: val }))
                )}
                onChange={(e) =>
                  setSimulationState((prev) => ({ ...prev, notes: e.target.value }))
                }
                fullWidth
                inputProps={{
                  placeholder: 'Add additional notes, errors, or deviations from procedure',
                }}
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': {
                    color: '#000000',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#cccccc',
                    },
                  },
                }}
              />

              <Button
                variant="contained"
                color="success"
                onClick={handleGenerateGraph}
                fullWidth
                sx={{ mb: 1 }}
              >
                Generate Graph
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Graph Area */}
        {simulationState.graphData && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Data Visualization" />
              <CardContent>
                <Box sx={{ position: 'relative', height: 400, mb: 2 }}>
                  <Line data={simulationState.graphData} options={chartOptions} />
                </Box>
                <Box sx={{ p: 2, backgroundColor: '#f1f8e9', borderLeft: '4px solid #43a047', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#388e3c', mb: 1 }}>
                    How to Interpret the Graph
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000000' }}>
                    The graph above visualizes your recorded measurements. The <strong>x-axis</strong> represents the sequence or variable measured (such as time, volume, or sample number), while the <strong>y-axis</strong> shows the corresponding values you entered. Look for patterns, trends, or changes in the graph to help you analyze the results and draw scientific conclusions relevant to your experiment.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSimulation}
              fullWidth
            >
              Save Simulation
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

// Chemistry Simulations

const SaltAnalysisSimulation: React.FC<{
  onMeasurementsUpdate: (m: Measurement) => void;
  registerField: (get: () => string, set: (val: string) => void) => (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}> = ({
  onMeasurementsUpdate,
  registerField,
}) => {
  // Mode: 'practice' or 'exam' (default to practice)
  const [mode] = useState<'practice' | 'exam'>('practice');
  
  // Unknown sample selection (A, B, or C)
  const [selectedSample, setSelectedSample] = useState<string>('');
  
  // Current test tube state
  const [testTubeContent, setTestTubeContent] = useState<string>('empty'); // empty, unknown, mixed
  const [testTubeColor, setTestTubeColor] = useState<string>('#e0e0e0'); // Visual color of test tube content
  const [hasPrecipitate, setHasPrecipitate] = useState<boolean>(false);
  const [precipitateColor, setPrecipitateColor] = useState<string>('');
  const [isHeated, setIsHeated] = useState<boolean>(false);
  const [reagentAdded, setReagentAdded] = useState<string>('');
  const [activeReagent, setActiveReagent] = useState<string>(''); // Track which reagent is being tested
  
  // Observation table data
  const [observations, setObservations] = useState<Record<string, string>>({});
  
  // Inference (student input)
  const [inferredCation, setInferredCation] = useState<string>('');
  const [inferredAnion, setInferredAnion] = useState<string>('');
  
  // Feedback state
  const [feedback, setFeedback] = useState<string>(''); // Feedback state
  const [showFeedback, setShowFeedback] = useState<boolean>(false); // Show feedback state
  const [showHintGuide, setShowHintGuide] = useState<boolean>(true); // Hint guide visibility

  // Unknown sample compositions (hidden from student)
  const unknownSamples: Record<string, { cation: string; anion: string; cationHtml: string; anionHtml: string }> = {
    A: { cation: 'Fe³⁺', anion: 'SO₄²⁻', cationHtml: 'Fe<sup>3</sup><sup>+</sup>', anionHtml: 'SO<sub>4</sub><sup>2</sup><sup>-</sup>' }, // Fe₂(SO₄)₃
    B: { cation: 'Cu²⁺', anion: 'Cl⁻', cationHtml: 'Cu<sup>2</sup><sup>+</sup>', anionHtml: 'Cl<sup>-</sup>' },   // CuCl₂
    C: { cation: 'Ba²⁺', anion: 'CO₃²⁻', cationHtml: 'Ba<sup>2</sup><sup>+</sup>', anionHtml: 'CO<sub>3</sub><sup>2</sup><sup>-</sup>' }, // BaCO₃
  };
  
  // Available reagents
  const reagents = [
    { id: 'NaOH', name: 'Sodium Hydroxide (NaOH)', color: '#f0f0f0' },
    { id: 'NH3', name: 'Aqueous Ammonia (NH₃)', color: '#e3f2fd' },
    { id: 'BaCl2', name: 'Barium Chloride (BaCl₂)', color: '#fff3e0' },
    { id: 'AgNO3', name: 'Silver Nitrate (AgNO₃)', color: '#fce4ec' },
    { id: 'HCl', name: 'Dilute Hydrochloric Acid (HCl)', color: '#fff9c4' },
    { id: 'HNO3', name: 'Dilute Nitric Acid (HNO₃)', color: '#fffde7' },
  ];
  
  // Reaction logic based on sample composition and reagent
  const getReaction = (sampleId: string, reagentId: string, heated: boolean): {
    color: string;
    precipitate: boolean;
    precipitateColor: string;
    observation: string;
    gas?: string;
  } => {
    if (!sampleId) {
      return { color: '#e0e0e0', precipitate: false, precipitateColor: '', observation: 'No sample selected' };
    }
    
    const sample = unknownSamples[sampleId];
    if (!sample) {
      return { color: '#e0e0e0', precipitate: false, precipitateColor: '', observation: 'Unknown sample' };
    }
    
    const { cation, anion } = sample;
    
    // NaOH reactions (Cation tests)
    if (reagentId === 'NaOH') {
      if (cation === 'Fe³⁺') {
        return {
          color: '#8b4513',
          precipitate: true,
          precipitateColor: 'reddish-brown',
          observation: 'Reddish-brown precipitate formed, insoluble in excess NaOH',
        };
      } else if (cation === 'Cu²⁺') {
        return {
          color: '#4169e1',
          precipitate: true,
          precipitateColor: 'blue',
          observation: 'Blue precipitate formed, insoluble in excess NaOH',
        };
      } else if (cation === 'Ba²⁺') {
        return {
          color: '#f5f5dc',
          precipitate: true,
          precipitateColor: 'white',
          observation: 'White precipitate formed, soluble in excess NaOH',
        };
      }
    }
    
    // NH₃ reactions (Cation tests)
    if (reagentId === 'NH3') {
      if (cation === 'Fe³⁺') {
        return {
          color: '#8b4513',
          precipitate: true,
          precipitateColor: 'reddish-brown',
          observation: 'Reddish-brown precipitate formed, insoluble in excess NH₃',
        };
      } else if (cation === 'Cu²⁺') {
        return {
          color: '#1e90ff',
          precipitate: true,
          precipitateColor: 'blue',
          observation: 'Blue precipitate formed initially, dissolves to give deep blue solution in excess NH₃',
        };
      } else if (cation === 'Ba²⁺') {
        return {
          color: '#e0e0e0',
          precipitate: false,
          precipitateColor: '',
          observation: 'No precipitate formed',
        };
      }
    }
    
    // BaCl₂ reactions (Anion tests)
    if (reagentId === 'BaCl2') {
      if (anion === 'SO₄²⁻') {
        return {
          color: '#f5f5dc',
          precipitate: true,
          precipitateColor: 'white',
          observation: 'White precipitate (BaSO₄) formed, insoluble in dilute acids',
        };
      } else if (anion === 'CO₃²⁻') {
        const gas = heated ? 'CO₂ gas evolved (turns limewater milky)' : 'Effervescence, CO₂ gas evolved on heating';
        return {
          color: '#fffacd',
          precipitate: true,
          precipitateColor: 'white',
          observation: `White precipitate formed, dissolves with effervescence. ${gas}`,
          gas: 'CO₂',
        };
      } else if (anion === 'Cl⁻') {
        return {
          color: '#e0e0e0',
          precipitate: false,
          precipitateColor: '',
          observation: 'No precipitate formed',
        };
      }
    }
    
    // AgNO₃ reactions (Anion tests)
    if (reagentId === 'AgNO3') {
      if (anion === 'Cl⁻') {
        return {
          color: '#f5f5dc',
          precipitate: true,
          precipitateColor: 'white',
          observation: 'White precipitate (AgCl) formed, soluble in NH₃(aq)',
        };
      } else if (anion === 'SO₄²⁻') {
        return {
          color: '#e0e0e0',
          precipitate: false,
          precipitateColor: '',
          observation: 'No precipitate formed',
        };
      } else if (anion === 'CO₃²⁻') {
        const gas = heated ? 'CO₂ gas evolved' : 'Effervescence on addition';
        return {
          color: '#fffacd',
          precipitate: true,
          precipitateColor: 'cream',
          observation: `Cream precipitate formed, dissolves with effervescence. ${gas}`,
          gas: 'CO₂',
        };
      }
    }
    
    // HCl reactions (Anion tests - for CO₃²⁻)
    if (reagentId === 'HCl') {
      if (anion === 'CO₃²⁻') {
        return {
          color: '#fffacd',
          precipitate: false,
          precipitateColor: '',
          observation: 'Effervescence, CO₂ gas evolved (turns limewater milky)',
          gas: 'CO₂',
        };
      } else if (anion === 'SO₄²⁻' || anion === 'Cl⁻') {
        return {
          color: '#e0e0e0',
          precipitate: false,
          precipitateColor: '',
          observation: 'No reaction',
        };
      }
    }
    
    // HNO₃ reactions
    if (reagentId === 'HNO3') {
      if (anion === 'CO₃²⁻') {
        return {
          color: '#fffacd',
          precipitate: false,
          precipitateColor: '',
          observation: 'Effervescence, CO₂ gas evolved',
          gas: 'CO₂',
        };
      } else {
        return {
          color: '#e0e0e0',
          precipitate: false,
          precipitateColor: '',
          observation: 'No reaction',
        };
      }
    }
    
    return { color: '#e0e0e0', precipitate: false, precipitateColor: '', observation: 'No significant reaction observed' };
  };
  
  // Handle sample selection
  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    setTestTubeContent('unknown');
    setTestTubeColor('#e0e0e0');
    setHasPrecipitate(false);
    setPrecipitateColor('');
    setIsHeated(false);
    setReagentAdded('');
    setObservations({});
    setInferredCation('');
    setInferredAnion('');
    setFeedback('');
    setShowFeedback(false);
  };
  
  // Handle adding reagent
  const handleAddReagent = (reagentId: string) => {
    if (!selectedSample) {
      setFeedback('Please select a sample first!');
      setShowFeedback(true);
      return;
    }
    
    setActiveReagent(reagentId); // Track the currently selected reagent
    const reaction = getReaction(selectedSample, reagentId, isHeated);
    setReagentAdded(reagentId);
    setTestTubeContent('mixed');
    setTestTubeColor(reaction.color);
    setHasPrecipitate(reaction.precipitate);
    setPrecipitateColor(reaction.precipitateColor);
    
    // Store observation
    const observationKey = `${reagentId}${isHeated ? '_heated' : ''}`;
    setObservations(prev => ({
      ...prev,
      [observationKey]: reaction.observation,
    }));
    
    // In practice mode, provide hints
    if (mode === 'practice') {
      const reagent = reagents.find(r => r.id === reagentId);
      setFeedback(`Reagent added: ${reagent?.name}. ${reaction.observation}`);
      setShowFeedback(true);
    }
    
    onMeasurementsUpdate({
      name: `Reaction: ${reagentId}`,
      value: 1,
      unit: 'observed',
    });
  };
  
  // Handle heating
  const handleHeat = () => {
    if (!selectedSample) {
      setFeedback('Please select a sample first!');
      setShowFeedback(true);
      return;
    }
    
    setIsHeated(true);
    
    // Recalculate reaction if reagent was already added
    if (reagentAdded) {
      const reaction = getReaction(selectedSample, reagentAdded, true);
      setTestTubeColor(reaction.color);
      setHasPrecipitate(reaction.precipitate);
      setPrecipitateColor(reaction.precipitateColor);
      
      // Update observation for heated reaction
      const observationKey = `${reagentAdded}_heated`;
      setObservations(prev => ({
        ...prev,
        [observationKey]: reaction.observation,
      }));
      
      if (mode === 'practice') {
        setFeedback(`Sample heated. ${reaction.observation}`);
        setShowFeedback(true);
      }
    } else {
      if (mode === 'practice') {
        setFeedback('Sample heated. Add a reagent to see reaction.');
        setShowFeedback(true);
      }
    }
  };
  
  // Handle inference submission
  const handleSubmitInference = () => {
    if (!selectedSample) {
      setFeedback('Please select a sample first!');
      setShowFeedback(true);
      return;
    }
    
    const correct = unknownSamples[selectedSample];
    const correctCation = correct.cation;
    const correctAnion = correct.anion;
    
    // Helper function to convert ASCII notation to Unicode
    const asciiToUnicode = (text: string): string => {
      if (!text) return text;
      let result = text.trim();
      
      // Superscript patterns - match anything between ^ ^
      result = result.replace(/\^([^^\n]+)\^/g, (match, content) => {
        let converted = content;
        // Convert digits
        converted = converted.replace(/0/g, '⁰').replace(/1/g, '¹').replace(/2/g, '²')
          .replace(/3/g, '³').replace(/4/g, '⁴').replace(/5/g, '⁵')
          .replace(/6/g, '⁶').replace(/7/g, '⁷').replace(/8/g, '⁸').replace(/9/g, '⁹');
        // Convert operators
        converted = converted.replace(/\+/g, '⁺').replace(/-/g, '⁻');
        return converted;
      });
      
      // Subscript patterns - match anything between ~ ~
      result = result.replace(/~([^~\n]+)~/g, (match, content) => {
        let converted = content;
        // Convert digits only for subscripts
        converted = converted.replace(/0/g, '₀').replace(/1/g, '₁').replace(/2/g, '₂')
          .replace(/3/g, '₃').replace(/4/g, '₄').replace(/5/g, '₅')
          .replace(/6/g, '₆').replace(/7/g, '₇').replace(/8/g, '₈').replace(/9/g, '₉');
        return converted;
      });
      
      return result;
    };
    
    // Convert inferred values from ASCII notation to Unicode for comparison
    const normalizedInferredCation = asciiToUnicode(inferredCation);
    const normalizedInferredAnion = asciiToUnicode(inferredAnion);
    
    let observationMarks = 0;
    let inferenceMarks = 0;
    
    // Mark observations (max 2 marks): Give 2 marks if they recorded at least one observation
    const hasObservations = Object.keys(observations).length > 0;
    observationMarks = hasObservations ? 2 : 0;
    
    // Mark inferences (max 2 marks): 1 for each correct inference
    if (normalizedInferredCation === correctCation) {
      inferenceMarks += 1;
    }
    if (normalizedInferredAnion === correctAnion) {
      inferenceMarks += 1;
    }
    
    const totalMarks = observationMarks + inferenceMarks;
    const maxMarks = 4;
    
    // Build feedback HTML with proper HTML-formatted cation/anion
    let feedbackHtml = '<div style="padding: 10px; line-height: 1.6;">';
    
    if (mode === 'practice') {
      feedbackHtml += '<div style="margin-bottom: 10px;"><strong>Results:</strong></div>';
      feedbackHtml += '<div style="margin-bottom: 8px;">';
      feedbackHtml += 'Cation: ' + normalizedInferredCation + ' vs ' + correctCation;
      if (normalizedInferredCation === correctCation) {
        feedbackHtml += ' ✓ Correct';
      } else {
        feedbackHtml += ' ✗ Incorrect. Expected: ' + correct.cationHtml;
      }
      feedbackHtml += '</div>';
      
      feedbackHtml += '<div style="margin-bottom: 15px;">';
      feedbackHtml += 'Anion: ' + normalizedInferredAnion + ' vs ' + correctAnion;
      if (normalizedInferredAnion === correctAnion) {
        feedbackHtml += ' ✓ Correct';
      } else {
        feedbackHtml += ' ✗ Incorrect. Expected: ' + correct.anionHtml;
      }
      feedbackHtml += '</div>';
    }
    
    feedbackHtml += `<div style="margin-bottom: 8px;">Marks: ${totalMarks}/${maxMarks}</div>`;
    feedbackHtml += '<div style="margin-left: 10px; margin-bottom: 4px;">- Observations: ' + observationMarks + '/2</div>';
    feedbackHtml += '<div style="margin-left: 10px;">- Inferences: ' + inferenceMarks + '/2</div>';
    feedbackHtml += '</div>';
    
    setFeedback(feedbackHtml);
    setShowFeedback(true);
  };
  
  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #667eea' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1565c0', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Select an unknown sample</strong> (Sample A, B, or C)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Add reagents dropwise</strong> to test tube and observe reactions
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          3. <strong>Heat when necessary</strong> using the Bunsen burner
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          4. <strong>Record observations</strong> in the Observation Table (right column)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          5. <strong>Identify the cation and anion</strong> based on your observations
        </Typography>
        {mode === 'practice' && (
          <Typography variant="body2" sx={{ color: '#4caf50', mt: 1, fontWeight: 'bold' }}>
            Practice Mode: Hints and immediate feedback available
          </Typography>
        )}
        {mode === 'exam' && (
          <Typography variant="body2" sx={{ color: '#f44336', mt: 1, fontWeight: 'bold' }}>
            Mock Exam Mode: No hints. Submit once.
          </Typography>
        )}
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column: Apparatus and Reagents */}
        <Grid item xs={12} md={6}>
          {/* Sample Selection */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title="Unknown Samples" />
            <CardContent>
              <Grid container spacing={2}>
                {['A', 'B', 'C'].map((sample) => (
                  <Grid item xs={4} key={sample}>
                    <Button
                      variant={selectedSample === sample ? 'contained' : 'outlined'}
                      color={selectedSample === sample ? 'primary' : 'inherit'}
                      onClick={() => handleSelectSample(sample)}
                      fullWidth
                      sx={{ py: 2 }}
                    >
                      Sample {sample}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Virtual Test Tube */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title="Test Tube" />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 200 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 180,
                    border: '3px solid #333',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    backgroundColor: testTubeContent === 'empty' ? '#f5f5f5' : testTubeColor,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {hasPrecipitate && (
                    <Box
                      sx={{
                        width: '100%',
                        height: '30%',
                        backgroundColor: precipitateColor === 'reddish-brown' ? '#8b4513' :
                                       precipitateColor === 'blue' ? '#4169e1' :
                                       precipitateColor === 'white' ? '#f5f5dc' :
                                       precipitateColor === 'cream' ? '#fffacd' : '#ccc',
                        borderBottom: '1px solid #666',
                        borderRadius: '0 0 8px 8px',
                      }}
                    />
                  )}
                  {reagentAdded && (
                    <Typography variant="caption" sx={{ position: 'absolute', top: -25, color: '#000' }}>
                      + {reagents.find(r => r.id === reagentAdded)?.name.split(' ')[0]}
                    </Typography>
                  )}
                  {isHeated && (
                    <Typography variant="caption" sx={{ position: 'absolute', top: -40, color: '#f44336' }}>
                      🔥 Heated
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, color: '#000' }}>
                {selectedSample ? `Sample ${selectedSample} selected` : 'No sample selected'}
              </Typography>
            </CardContent>
          </Card>

          {/* Apparatus Controls */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title="Apparatus" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleHeat}
                    disabled={!selectedSample}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    🔥 Heat with Bunsen Burner
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setTestTubeContent('empty');
                      setTestTubeColor('#e0e0e0');
                      setHasPrecipitate(false);
                      setReagentAdded('');
                      setIsHeated(false);
                      setObservations({});
                    }}
                    fullWidth
                    sx={{ py: 1.5 }}
                  >
                    🧪 Clear Test Tube
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Reagents */}
          <Card>
            <CardHeader title="Reagents" />
            <CardContent>
              <Grid container spacing={1}>
                {reagents.map((reagent) => (
                  <Grid item xs={6} key={reagent.id}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAddReagent(reagent.id)}
                      disabled={!selectedSample}
                      fullWidth
                      sx={{
                        backgroundColor: reagent.color,
                        color: '#111 !important', // force readable text when enabled
                        '&:hover': { backgroundColor: reagent.color, opacity: 0.8 },
                        '&.Mui-disabled': {
                          color: '#222 !important',
                          backgroundColor: reagent.color,
                          borderColor: '#888',
                          opacity: 0.6,
                        },
                        fontWeight: 700,
                        border: '1.5px solid #888',
                        boxShadow: 1,
                      }}
                    >
                      {reagent.name.split(' ')[0]}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Observations and Inferences */}
        <Grid item xs={12} md={6}>
          {/* Observation Table */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title="Observation Table" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Reagent + Test
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                  Record your observations for each test (unheated and heated)
                </Typography>
                {!activeReagent ? (
                  <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
                    Select a reagent above to start testing
                  </Typography>
                ) : (
                  reagents.filter(r => r.id === activeReagent).flatMap((reagent) => [reagent.id, `${reagent.id}_heated`]).map((key) => {
                    const [reagentId, heated] = key.split('_');
                    const reagent = reagents.find(r => r.id === reagentId);
                    const value = observations[key] || '';
                    return (
                      <Box key={key} sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                          {reagent?.name} {heated === 'heated' ? '(Heated)' : '(Room Temp)'}
                        </Typography>
                        <TextField
                          multiline
                          rows={2}
                          fullWidth
                          value={value}
                          onFocus={registerField(
                            () => value,
                            (val: string) => setObservations((prev) => ({ ...prev, [key]: val }))
                          )}
                          onChange={(e) => {
                            setObservations(prev => ({ ...prev, [key]: e.target.value }));
                          }}
                          placeholder="Enter observation..."
                          size="small"
                          sx={{
                          '& .MuiInputBase-input': { color: '#000' },
                          backgroundColor: '#fff',
                        }}
                      />
                    </Box>
                    );
                  })
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Practice Hint Guide */}
          {mode === 'practice' && (
            <Card sx={{ mb: 2 }}>
              <CardHeader
                title="Hint Guide (Practice Mode)"
                action={
                  <Button size="small" onClick={() => setShowHintGuide((v) => !v)}>
                    {showHintGuide ? 'Hide' : 'Show'}
                  </Button>
                }
              />
              {showHintGuide && (
                <CardContent>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Cation clues
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Fe<sup>3+</sup>: Reddish-brown ppt with NaOH/NH₃, insoluble in excess.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Cu<sup>2+</sup>: Blue ppt with NaOH; deep blue solution in excess NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 2 }}>
                    • Ba<sup>2+</sup>: White ppt with NaOH (partly soluble); no ppt with NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Ca<sup>2+</sup>: White ppt with NaOH (slightly soluble), no ppt with NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Mg<sup>2+</sup>: White ppt with NaOH (insoluble in excess), no ppt with NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Zn<sup>2+</sup>: White ppt with NaOH/NH₃, soluble in excess (clear solution).
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Al<sup>3+</sup>: White gelatinous ppt with NaOH, soluble in excess; no ppt with NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Pb<sup>2+</sup>: White ppt with NaOH (soluble in excess, colorless solution); white ppt with NH₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 2 }}>
                    • NH<sub>4</sub><sup>+</sup>: No ppt with NaOH/NH₃; on heating with NaOH, ammonia gas (pungent) evolves.
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Anion clues
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • SO₄<sup>2-</sup>: White ppt with BaCl₂, insoluble in dilute acids; no ppt with AgNO₃.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Cl<sup>-</sup>: White ppt with AgNO₃, soluble in NH₃; no ppt with BaCl₂.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000' }}>
                    • CO₃<sup>2-</sup>: Effervescence with acids; white ppt with BaCl₂ that dissolves with effervescence on acid.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • Br<sup>-</sup>: Cream ppt with AgNO₃ (partly soluble in NH₃); no ppt with BaCl₂.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • I<sup>-</sup>: Yellow ppt with AgNO₃ (insoluble in NH₃); no ppt with BaCl₂.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
                    • NO₃<sup>-</sup>: No ppt with AgNO₃/BaCl₂; brown ring test (conc. H₂SO₄ + FeSO₄) gives brown ring.
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#000' }}>
                    • SO₃<sup>2-</sup>: Decolorizes acidified KMnO₄; with BaCl₂ gives white ppt soluble in dilute acids (SO₂ gas smell).
                  </Typography>
                </CardContent>
              )}
            </Card>
          )}

          {/* Inference Section */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title="Inference" />
            <CardContent>
              <TextField
                label="Cation Identified"
                value={inferredCation}
                onFocus={registerField(
                  () => inferredCation,
                  (val: string) => setInferredCation(val)
                )}
                onChange={(e) => setInferredCation(e.target.value)}
                fullWidth
                placeholder="e.g., Fe³⁺, Cu²⁺, Ba²⁺"
                sx={{ mb: 2, '& .MuiInputBase-input': { color: '#000' } }}
              />
              <TextField
                label="Anion Identified"
                value={inferredAnion}
                onFocus={registerField(
                  () => inferredAnion,
                  (val: string) => setInferredAnion(val)
                )}
                onChange={(e) => setInferredAnion(e.target.value)}
                fullWidth
                placeholder="e.g., SO₄²⁻, Cl⁻, CO₃²⁻"
                sx={{ mb: 2, '& .MuiInputBase-input': { color: '#000' } }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitInference}
                disabled={!selectedSample || !inferredCation || !inferredAnion}
                fullWidth
              >
                Submit Inference
              </Button>
            </CardContent>
          </Card>

          {/* Feedback */}
          {showFeedback && (
            <Card sx={{ mb: 2, backgroundColor: mode === 'practice' ? '#e8f5e9' : '#fff3e0' }}>
              <CardHeader title="Feedback" sx={{ color: '#000' }} />
              <CardContent>
                <Box
                  dangerouslySetInnerHTML={{
                    // Sanitize while allowing sup, sub, div, and style attributes for proper HTML rendering
                    __html: DOMPurify.sanitize(feedback, { 
                      ALLOWED_TAGS: ['div', 'br', 'sup', 'sub', 'strong'],
                      ALLOWED_ATTR: ['style']
                    }),
                  }}
                  sx={{ color: '#000' }}
                />
                <Button variant="contained" size="small" onClick={() => setShowFeedback(false)} sx={{ mt: 2, color: '#fff', backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}>
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

const AcidBaseTitrationSimulation: React.FC<{ onMeasurementsUpdate: (m: Measurement) => void }> = ({
  onMeasurementsUpdate,
}) => {
  const [burette, setBurette] = useState(0);
  const [color, setColor] = useState('Light Red');

  const handleBuretteChange = (value: number) => {
    setBurette(value);

    if (value < 10) {
      setColor('Light Red');
    } else if (value < 15) {
      setColor('Medium Red');
    } else if (value < 20) {
      setColor('Pale Pink');
    } else {
      setColor('Colorless + Pink (ENDPOINT!)');
      onMeasurementsUpdate({
        name: 'Burette Volume',
        value: value,
        unit: 'mL',
      });
    }
  };

  const colorMap: Record<string, string> = {
    'Light Red': '#ffcccc',
    'Medium Red': '#ff9999',
    'Pale Pink': '#ffdddd',
    'Colorless + Pink (ENDPOINT!)': '#ffffff',
  };

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1b5e20', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Drag the slider</strong> to add standard solution from the burette to the flask (starting with methyl orange indicator)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Watch the color change</strong> as you add more solution: Red → Medium Red → Pale Pink → Colorless + Pink (endpoint)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          3. <strong>Stop at the endpoint</strong> when the solution turns colorless with a faint pink tinge that persists for 30 seconds
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          4. <strong>Record the burette reading</strong> at the endpoint to calculate the concentration of unknown acid/base
        </Typography>
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Burette Reading: <strong>{burette.toFixed(1)} mL</strong>
      </Typography>
      <input
        type="range"
        min="0"
        max="25"
        step="0.5"
        value={burette}
        onChange={(e) => handleBuretteChange(parseFloat(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
      <Box
        sx={{
          mt: 2,
          p: 2,
          backgroundColor: colorMap[color] || '#cccccc',
          border: '2px solid #667eea',
          borderRadius: 1,
          textAlign: 'center',
          color: '#000000',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
          Flask Color: {color}
        </Typography>
      </Box>

      {/* Results Interpretation */}
      {color === 'Colorless + Pink (ENDPOINT!)' && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fff3e0', borderLeft: '4px solid #e65100' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
            ✅ Endpoint Reached!
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            <strong>Interpretation:</strong> At {burette.toFixed(1)} mL, the endpoint has been reached. This is the volume of standard solution needed to neutralize the acid/base in the flask.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

const RedoxTitrationSimulation: React.FC<{ onMeasurementsUpdate: (m: Measurement) => void }> = ({
  onMeasurementsUpdate,
}) => {
  const [burette, setBurette] = useState(0);

  const handleBuretteChange = (value: number) => {
    setBurette(value);
    if (value >= 19) {
      onMeasurementsUpdate({
        name: 'KMnO₄ Volume',
        value: value,
        unit: 'mL',
      });
    }
  };

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f3e5f5', borderLeft: '4px solid #6a1b9a' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#4a148c', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Drag the slider</strong> to add KMnO₄ (potassium permanganate) solution from the burette to the oxalic acid solution
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Observe the color change</strong> in the KMnO₄ column: Dark Purple (excess) → Slight Pink (approaching endpoint)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          3. <strong>Stop when the solution</strong> changes from colorless to slight pink color that persists for 30 seconds (endpoint)
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          4. <strong>Record the KMnO₄ volume</strong> at the endpoint to determine the oxalic acid concentration
        </Typography>
      </Paper>

      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        KMnO₄ Added: <strong>{burette.toFixed(1)} mL</strong>
      </Typography>
      <input
        type="range"
        min="0"
        max="20"
        step="1"
        value={burette}
        onChange={(e) => handleBuretteChange(parseFloat(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
      <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
        <Box sx={{ p: 1, backgroundColor: '#cccccc', borderRadius: 1, textAlign: 'center', color: '#000000' }}>
          <Typography variant="caption" sx={{ color: '#000000' }}>Oxalic Acid</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
            Colorless
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            backgroundColor:
              burette < 15 ? 'rgba(150, 50, 50, 0.7)' : 'rgba(255, 100, 100, 0.5)',
            borderRadius: 1,
            textAlign: 'center',
            color: 'white',
          }}
        >
          <Typography variant="caption" sx={{ color: 'white' }}>KMnO₄</Typography>
          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'white' }}>
            {burette < 15 ? 'Dark Purple' : 'Slight Pink'}
          </Typography>
        </Box>
      </Box>

      {/* Results Interpretation */}
      {burette >= 19 && (
        <Paper sx={{ p: 2, mt: 2, backgroundColor: '#fff3e0', borderLeft: '4px solid #e65100' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
            ✅ Titration Complete!
          </Typography>
          <Typography variant="body2" sx={{ color: '#000000' }}>
            <strong>Interpretation:</strong> At {burette.toFixed(1)} mL, the KMnO₄ endpoint has been reached. The solution has changed from dark purple to slight pink, indicating complete reaction with oxalic acid.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

// Physics Simulations

const PendulumSimulation: React.FC<{ onMeasurementsUpdate: (m: Measurement) => void }> = ({
  onMeasurementsUpdate,
}) => {
  const [length, setLength] = useState(100);
  const [oscillations, setOscillations] = useState(0);

  const calculatePeriod = (L: number) => {
    return 2 * Math.sqrt(L / 980); // T = 2π√(L/g), simplified
  };

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#fffde7', borderLeft: '4px solid #fbc02d' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#f9a825', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Adjust the pendulum length</strong> using the slider below (range: 30–150 cm).
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Click "Record Oscillation"</strong> each time you complete a timing for the current length. The period (T) is calculated automatically.
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          3. <strong>Record multiple measurements</strong> for different lengths to analyze the relationship between length and period.
        </Typography>
      </Paper>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Pendulum Length: <strong>{length} cm</strong>
      </Typography>
      <input
        type="range"
        min="30"
        max="150"
        step="10"
        value={length}
        onChange={(e) => {
          const newLength = parseInt(e.target.value);
          setLength(newLength);
          setOscillations(0);
        }}
        style={{ width: '100%', cursor: 'pointer' }}
      />
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, color: '#000000' }}>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          Period T = {calculatePeriod(length).toFixed(3)} seconds
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          Expected g ≈ 9.8 m/s²
        </Typography>
      </Box>
      <Button
        variant="contained"
        onClick={() => {
          setOscillations(oscillations + 1);
          onMeasurementsUpdate({
            name: `L=${length}cm`,
            value: calculatePeriod(length),
            unit: 's',
          });
        }}
        fullWidth
        sx={{ mt: 2 }}
      >
        Record Oscillation (Count: {oscillations})
      </Button>
      {/* Interpretation */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
          📊 How to Interpret Results:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          The <strong>period (T)</strong> increases as the length increases. By plotting period vs. length, you can verify the relationship <strong>T = 2π√(L/g)</strong>. The slope of the graph can be used to estimate the acceleration due to gravity (g).
        </Typography>
      </Paper>
    </Box>
  );
};

const SpringSimulation: React.FC<{ onMeasurementsUpdate: (m: Measurement) => void }> = ({
  onMeasurementsUpdate,
}) => {
  const [mass, setMass] = useState(0);
  const k = 15; // Spring constant N/m

  const handleMassChange = (value: number) => {
    setMass(value);
    const force = (value * 9.8) / 1000; // Convert to Newtons
    const extension = force / k;
    onMeasurementsUpdate({
      name: `Mass=${value}g`,
      value: extension,
      unit: 'cm',
    });
  };

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', borderLeft: '4px solid #388e3c' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Adjust the mass</strong> added to the spring using the slider (range: 0–500 g).
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Observe the force and extension</strong> values calculated below as you change the mass.
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          3. <strong>Record measurements</strong> for different masses to analyze Hooke's Law (F = kx).
        </Typography>
      </Paper>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Added Mass: <strong>{mass} g</strong>
      </Typography>
      <input
        type="range"
        min="0"
        max="500"
        step="50"
        value={mass}
        onChange={(e) => handleMassChange(parseInt(e.target.value))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="body2">
          Force F = {((mass * 9.8) / 1000).toFixed(3)} N
        </Typography>
        <Typography variant="body2">
          Extension x = {((mass * 9.8) / (1000 * k)).toFixed(3)} m
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
          Spring constant k ≈ {k} N/m
        </Typography>
      </Box>
      {/* Interpretation */}
      <Paper sx={{ p: 2, mt: 3, backgroundColor: '#fff3e0', borderLeft: '4px solid #fbc02d' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#fbc02d', mb: 1 }}>
          📊 How to Interpret Results:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          The <strong>extension (x)</strong> increases linearly with force (F). By plotting F vs. x, you can verify Hooke's Law. The slope of the graph gives the spring constant (k).
        </Typography>
      </Paper>
    </Box>
  );
};

const DefaultSimulation: React.FC = () => (
  <Box>
    {/* Instructions */}
    <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f3e5f5', borderLeft: '4px solid #8e24aa' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#6a1b9a', mb: 1 }}>
        📋 Instructions:
      </Typography>
      <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
        1. <strong>Follow the on-screen prompts</strong> to interact with the simulation or record your observations as required by your lab activity.
      </Typography>
      <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
        2. <strong>Enter your observations and notes</strong> in the provided fields. Describe any changes, reactions, or findings you observe during the experiment.
      </Typography>
      <Typography variant="body2" sx={{ color: '#000000' }}>
        3. <strong>Record measurements</strong> if applicable, and use the graphing tool to visualize your data.
      </Typography>
    </Paper>
    <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, color: '#000000' }}>
      <Typography variant="body2" sx={{ color: '#000000' }}>
        Interactive simulation will appear here based on lab type.
      </Typography>
    </Box>
    {/* Interpretation */}
    <Paper sx={{ p: 2, mt: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
        📊 How to Interpret Results:
      </Typography>
      <Typography variant="body2" sx={{ color: '#000000' }}>
        Review your recorded data and observations. If you generated a graph, analyze the trends and relationships between variables. Use your findings to draw scientific conclusions relevant to your experiment.
      </Typography>
    </Paper>
  </Box>
);

export default EnhancedLabSimulation;
