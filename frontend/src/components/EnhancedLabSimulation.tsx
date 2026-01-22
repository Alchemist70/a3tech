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
import QuestionDisplay from './QuestionDisplay';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showQuestion, setShowQuestion] = useState(labTitle.includes('Titration'));

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
      {/* Question Display Section - For Titration Labs */}
      {labTitle.includes('Titration') && showQuestion && (
        <Box sx={{ mb: 3 }}>
          <QuestionDisplay 
            labMode="practice"
            onQuestionLoaded={(question) => setCurrentQuestion(question)}
          />
        </Box>
      )}

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

const AcidBaseTitrationSimulation: React.FC<{ 
  onMeasurementsUpdate: (m: Measurement) => void;
  mode?: 'practice' | 'exam';
}> = ({
  onMeasurementsUpdate,
  mode = 'practice',
}) => {
  // ============ MODE SETTINGS ============
  const isPracticeMode = mode === 'practice';
  const isExamMode = mode === 'exam';
  
  // ============ SETUP PHASE ============
  const [setupPhase, setSetupPhase] = useState<'apparatus' | 'solutions' | 'indicator' | 'titration'>('apparatus');
  const [buretteRinsed, setBuretteRinsed] = useState(false);
  const [pipetteRinsed, setPipetteRinsed] = useState(false);
  const [buretteFilled, setBuretteFilled] = useState(false);
  const [pipetteUsed, setPipetteUsed] = useState(false);
  
  // ============ AVAILABLE ACIDS AND BASES ============
  const availableAcids = [
    { name: 'HCl (Hydrochloric Acid)', symbol: 'HCl', defaultConc: 0.1 },
    { name: 'H₂SO₄ (Sulfuric Acid)', symbol: 'H₂SO₄', defaultConc: 0.1 },
    { name: 'CH₃COOH (Acetic Acid)', symbol: 'CH₃COOH', defaultConc: 0.1 },
    { name: 'HNO₃ (Nitric Acid)', symbol: 'HNO₃', defaultConc: 0.1 },
  ];
  
  const availableBases = [
    { name: 'NaOH (Sodium Hydroxide)', symbol: 'NaOH', defaultConc: 0.05 },
    { name: 'KOH (Potassium Hydroxide)', symbol: 'KOH', defaultConc: 0.05 },
    { name: 'NH₃ (Ammonia)', symbol: 'NH₃', defaultConc: 0.05 },
    { name: 'Na₂CO₃ (Sodium Carbonate)', symbol: 'Na₂CO₃', defaultConc: 0.05 },
  ];
  
  // ============ SOLUTIONS ============
  const [selectedAcid, setSelectedAcid] = useState(availableAcids[0]);
  const [selectedBase, setSelectedBase] = useState(availableBases[0]);
  const [customAcidConc, setCustomAcidConc] = useState<string>('0.1');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [customBaseConc, setCustomBaseConc] = useState<string>('0.05');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [solutionsConfirmed, setSolutionsConfirmed] = useState(false);
  
  const [selectedIndicator, setSelectedIndicator] = useState<'methyl-orange' | 'phenolphthalein' | null>(null);
  const [titrant, setTitrant] = useState({ name: selectedAcid.symbol, concentration: parseFloat(customAcidConc), volume: 0 });
  const [analyte, setAnalyte] = useState({ name: selectedBase.symbol, concentration: parseFloat(customBaseConc), volume: 25 });
  
  // ============ MENISCUS READING ============
  const [initialReading, setInitialReading] = useState<number | null>(null);
  const [finalReading, setFinalReading] = useState<number | null>(null);
  const [buretteVolume, setBuretteVolume] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  
  // ============ TITRATION PROGRESS ============
  const [flaskColor, setFlaskColor] = useState('Colorless');
  const [endpointReached, setEndpointReached] = useState(false);
  const [overTitrated, setOverTitrated] = useState(false);
  const [titrationAttempts, setTitrationAttempts] = useState(0);
  
  // ============ CALCULATIONS ============
  const [userCalculations, setUserCalculations] = useState({
    titreVolume: '',
    molarity: '',
    workingDetails: ''
  });
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    isValid: boolean;
    message: string;
    percentError?: number;
    grade?: string;
    score?: number;
    molarityScore?: number;
    stepsScore?: number;
    stepsIssues?: string[];
    combinedScore?: number;
    correctWorkingSteps?: string;
    correctC2?: number;
  } | null>(null);
  const [calculationsSubmitted, setCalculationsSubmitted] = useState(false);

  // ============ HANDLER FUNCTIONS ============
  
  const handleRinseBurette = () => {
    if (!buretteRinsed) {
      setBuretteRinsed(true);
    }
  };

  const handleConfirmSolutions = () => {
    // Update titrant and analyte with selected values
    const acidConc = parseFloat(customAcidConc) || selectedAcid.defaultConc;
    const baseConc = parseFloat(customBaseConc) || selectedBase.defaultConc;
    
    setTitrant({ 
      name: selectedAcid.symbol, 
      concentration: acidConc, 
      volume: 0 
    });
    
    setAnalyte({ 
      name: selectedBase.symbol, 
      concentration: baseConc, 
      volume: 25 
    });
    
    setSolutionsConfirmed(true);
    setSetupPhase('indicator'); // Move to indicator selection phase
  };

  const handleRinsePipette = () => {
    if (!pipetteRinsed) {
      setPipetteRinsed(true);
    }
  };

  const handleFillBurette = () => {
    if (buretteRinsed) {
      setBuretteFilled(true);
      setInitialReading(0.0); // Start from 0 mL
    }
  };

  const handleUsePipette = () => {
    if (pipetteRinsed && buretteFilled) {
      setPipetteUsed(true);
      // Don't advance phase - wait for user to click "Select Solutions" button
    }
  };

  const handleSelectIndicator = (indicator: 'methyl-orange' | 'phenolphthalein') => {
    setSelectedIndicator(indicator);
    // Don't auto-transition - let the "Indicator Selected" button handle it
  };

  const handleBuretteChange = (value: number) => {
    setBuretteVolume(value);

    // Calculate color based on moles of titrant added
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const molesOfTitrant = (value / 1000) * titrant.concentration;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const molesOfAnalyte = (analyte.volume / 1000) * analyte.concentration;
    const equivalencePoint = (analyte.concentration * analyte.volume) / titrant.concentration;

    // Correct endpoint: methyl orange changes at pH 3.1-4.4
    // For strong acid-strong base with HCl and NaOH
    const correctEndpoint = equivalencePoint; // Should be around 12.5 mL for 0.05M HCl vs 0.1M NaOH

    if (value < correctEndpoint - 0.5) {
      if (selectedIndicator === 'methyl-orange') {
        setFlaskColor('Red');
      } else {
        setFlaskColor('Colorless');
      }
      setEndpointReached(false);
      setOverTitrated(false);
    } else if (value >= correctEndpoint - 0.5 && value <= correctEndpoint + 0.5) {
      if (selectedIndicator === 'methyl-orange') {
        setFlaskColor('Orange (ENDPOINT!)');
      } else {
        setFlaskColor('Pale Pink (ENDPOINT!)');
      }
      setEndpointReached(true);
      setOverTitrated(false);
    } else {
      if (selectedIndicator === 'methyl-orange') {
        setFlaskColor('Yellow (OVER-TITRATED!)');
      } else {
        setFlaskColor('Pink (OVER-TITRATED!)');
      }
      setEndpointReached(false);
      setOverTitrated(true);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRecordInitialReading = () => {
    if (buretteFilled && initialReading === null) {
      setInitialReading(0.0);
    }
  };

  const handleRecordFinalReading = () => {
    if (endpointReached && initialReading !== null && finalReading === null) {
      // Validate final reading is greater than initial reading
      if (buretteVolume <= initialReading) {
        setSubmissionFeedback({
          isValid: false,
          message: '❌ Final reading must be greater than initial reading. This is physically impossible.'
        });
        return;
      }
      
      setFinalReading(buretteVolume);
      const titre = buretteVolume - (initialReading || 0);
      
      // Validate titre is in realistic range
      if (titre < 0.5) {
        setSubmissionFeedback({
          isValid: false,
          message: '❌ Titre volume is too small (< 0.5 mL). Check your readings.'
        });
        return;
      }
      
      if (titre > 50) {
        setSubmissionFeedback({
          isValid: false,
          message: '❌ Titre volume exceeds burette capacity. Invalid result.'
        });
        return;
      }
      
      onMeasurementsUpdate({
        name: 'Titre Volume',
        value: titre,
        unit: 'mL',
      });
    }
  };

  const handleSubmitCalculations = () => {
    // ============ EXAM MODE CHECK ============
    if (isExamMode && calculationsSubmitted) {
      setSubmissionFeedback({
        isValid: false,
        message: '❌ EXAM MODE: You have already submitted your calculations. No further submissions are allowed.'
      });
      return;
    }

    // ============ VALIDATION ============
    const titre = (finalReading || 0) - (initialReading || 0);
    const molarityInput = parseFloat(userCalculations.molarity);
    const workingDetails = userCalculations.workingDetails.trim();

    // Check if all required fields are filled
    if (!userCalculations.molarity || !workingDetails) {
      setSubmissionFeedback({
        isValid: false,
        message: '❌ Please enter both your working details and calculated molarity value'
      });
      return;
    }

    if (isNaN(molarityInput) || molarityInput <= 0) {
      setSubmissionFeedback({
        isValid: false,
        message: '❌ Molarity must be a valid positive number'
      });
      return;
    }

    // ============ CALCULATION & FEEDBACK ============
    // First, calculate what the expected molarity SHOULD BE based on actual experiment values
    // C₁V₁ = C₂V₂
    // C₁ = titrant concentration (known - from user selection)
    // V₁ = pipette volume (25 mL)
    // C₂ = unknown concentration (what we solve for)
    // V₂ = titre (burette reading difference)
    const pipetteVolume = 25; // Standard pipette volume (mL)
    const expectedMolarity = (titrant.concentration * pipetteVolume) / titre; // Calculated C₂
    const percentError = Math.abs((molarityInput - expectedMolarity) / expectedMolarity) * 100;
    
    // ============ GRADE CALCULATION STEPS ============
    // Check if working details contain evidence of proper calculation methodology
    const workingDetailsLower = workingDetails.toLowerCase();
    let stepsScore = 0;
    let stepsMaxScore = 100;
    const stepsIssues = [];
    
    // Check for formula (C₁V₁ = C₂V₂ or dilution formula) - flexible matching
    // Look for: C and V variables with equals sign - simple and direct
    const hasFormula = /[cv]/i.test(workingDetailsLower) && 
                       /=/.test(workingDetails) && 
                       /[cv].*[cv]/i.test(workingDetailsLower);
    
    if (hasFormula) {
      stepsScore += 30;
    } else {
      stepsIssues.push('Missing formula/equation');
    }
    
    // Check for value substitution (numbers should be present)
    const hasNumbers = /\d+\.?\d*/.test(workingDetails);
    if (hasNumbers) {
      stepsScore += 20;
    } else {
      stepsIssues.push('No numerical values shown');
    }
    
    // Check for units in calculations (M for molarity, mL for volume) - ENHANCED SCORING
    let unitsScore = 0;
    
    // For titration, check for key units: M (molarity) and mL (volume)
    const hasM = /\bm\b|molar|concentration/i.test(workingDetailsLower);
    const hasML = /ml|volume/i.test(workingDetailsLower);
    const hasMol = /\bmol\b/i.test(workingDetailsLower);
    
    // Award points based on which key units are present
    if ((hasM && hasML) || (hasM && hasMol) || (hasML && hasMol)) {
      unitsScore = 25; // Full credit for having at least 2 key unit types
    } else if (hasM || hasML || hasMol) {
      unitsScore = 18; // Partial credit for having some units
    } else if (/m|acid|base/i.test(workingDetailsLower)) {
      unitsScore = 8; // Minimal credit for mentioning relevant terms
      stepsIssues.push('Incomplete units - need more specific measurements');
    } else {
      stepsIssues.push('Missing units or solution names');
    }
    
    stepsScore += unitsScore;
    
    // Generate CORRECT working steps based on ACTUAL EXPERIMENT VALUES (not user's input)
    // C₁V₁ = C₂V₂
    // C₁ = titrant concentration (known - selected acid)
    // V₁ = volume of pipette (known - 25 mL)
    // C₂ = unknown concentration (what we solve for)
    // V₂ = volume of titrant from burette (titre)
    const correctConcentration = titrant.concentration;
    const correctPipetteVolume = pipetteVolume; // Always 25 mL
    const correctTitreVolume = titre;
    const correctUnknownMolarity = expectedMolarity; // Use calculated value
    
    const correctWorkingSteps = `C₁V₁ = C₂V₂
${correctConcentration} M × ${correctPipetteVolume} mL = C₂ × ${correctTitreVolume} mL
C₂ = (${correctConcentration} M × ${correctPipetteVolume} mL) / ${correctTitreVolume} mL
C₂ = ${correctUnknownMolarity.toFixed(4)} M`;
    
    // ============ VALIDATE C₂ VALUES AND UNITS ============
    // Extract C₂ value from last line of working details
    const workingLines = workingDetails.split('\n').filter(line => line.trim().length > 0);
    const lastLine = workingLines[workingLines.length - 1] || '';
    
    // Extract C₂ value and check for unit (M)
    const c2Pattern = /c[₂2]\s*=\s*([\d.]+)\s*([a-z])?/i;
    const c2Match = lastLine.match(c2Pattern);
    const c2FromWorking = c2Match ? parseFloat(c2Match[1]) : null;
    const c2HasUnit = c2Match && c2Match[2] ? /^m$/i.test(c2Match[2]) : /\bM\b/.test(lastLine);
    
    // Check if "Calculated Molarity of Unknown (M)" field has unit (M)
    const molarityFieldHasUnit = /M$/.test(userCalculations.molarity.trim()) || /^[\d.]+\s+M$/.test(userCalculations.molarity.trim());
    
    // Extract numeric value from molarity field (remove 'M' if present)
    const molarityFieldValue = parseFloat(userCalculations.molarity.replace(/\s*M\s*/i, ''));
    
    let c2ValidationIssues: string[] = [];
    
    // Check if C₂ value in working details matches the correct value
    if (c2FromWorking !== null) {
      // Allow for small rounding differences (tolerance of 0.0001)
      const tolerance = 0.0001;
      if (Math.abs(c2FromWorking - correctUnknownMolarity) > tolerance) {
        c2ValidationIssues.push(`C₂ value in working (${c2FromWorking.toFixed(4)} M) doesn't match correct value (${correctUnknownMolarity.toFixed(4)} M)`);
      }
    }
    
    // Check if working details has unit for C₂
    if (!c2HasUnit) {
      c2ValidationIssues.push('Missing unit (M) for C₂ in working details');
    }
    
    // Check if calculated molarity field has unit
    if (!molarityFieldHasUnit) {
      c2ValidationIssues.push('Missing unit (M) in Calculated Molarity field');
    }
    
    // Check if calculated molarity value matches correct value
    if (!isNaN(molarityFieldValue)) {
      const tolerance = 0.0001;
      if (Math.abs(molarityFieldValue - correctUnknownMolarity) > tolerance) {
        c2ValidationIssues.push(`Calculated Molarity (${molarityFieldValue.toFixed(4)} M) doesn't match correct value (${correctUnknownMolarity.toFixed(4)} M)`);
      }
    }
    
    // If there are C₂ or unit validation issues, deduct from steps score
    if (c2ValidationIssues.length > 0) {
      // Only deduct if stepsScore would still be positive, to allow perfect scores when everything is correct
      const deduction = Math.min(40, stepsScore); // Deduct up to 40, but don't go below 0
      stepsScore = Math.max(0, stepsScore - deduction);
      c2ValidationIssues.forEach(issue => stepsIssues.push(issue));
    }
    
    // Check for logical flow (contains words like "therefore", "so", "then", "=", operators)

    const hasLogicalFlow = /therefore|hence|thus|so|then|=|divide|multiply|subtract|add|final|answer|result/i.test(workingDetailsLower);
    if (hasLogicalFlow) {
      stepsScore += 15;
    } else {
      stepsIssues.push('Steps lack logical connection');
    }
    
    // Check for minimum length (should show real working, not just a few words)
    if (workingDetails.length >= 50) {
      stepsScore += 10;
    } else {
      stepsIssues.push('Working details too brief');
    }
    
    // Ensure steps score doesn't exceed max
    stepsScore = Math.min(stepsScore, stepsMaxScore);
    
    // ============ COMBINE SCORES: MOLARITY (60%) + STEPS (40%) ============
    // Molarity score based on accuracy
    let molarityScore = 0;
    
    if (percentError <= 5) {
      molarityScore = 100;
    } else if (percentError <= 10) {
      molarityScore = 85;
    } else if (percentError <= 15) {
      molarityScore = 70;
    } else if (percentError <= 20) {
      molarityScore = 55;
    } else {
      molarityScore = 30;
    }
    
    // Calculate combined score: 60% molarity + 40% steps
    const combinedScore = Math.round((molarityScore * 0.6) + (stepsScore * 0.4));
    
    // Determine overall grade
    let score = combinedScore;
    let grade = '';
    
    if (combinedScore >= 85) {
      grade = 'A';
    } else if (combinedScore >= 75) {
      grade = 'B';
    } else if (combinedScore >= 65) {
      grade = 'C';
    } else if (combinedScore >= 55) {
      grade = 'D';
    } else {
      grade = 'F';
    }

    // Generate detailed feedback message
    let feedbackMessage = '';
    
    if (combinedScore >= 85) {
      feedbackMessage = `✅ Excellent! Molarity: ${molarityInput.toFixed(4)} M (Error: ${percentError.toFixed(2)}%, Score: ${molarityScore}%). Working details score: ${stepsScore}%. Overall: ${combinedScore}%`;
    } else if (combinedScore >= 75) {
      feedbackMessage = `✓ Good work! Molarity: ${molarityInput.toFixed(4)} M (Error: ${percentError.toFixed(2)}%, Score: ${molarityScore}%). Working details score: ${stepsScore}%. Keep improving your calculations.`;
    } else if (combinedScore >= 65) {
      feedbackMessage = `△ Satisfactory. Molarity score: ${molarityScore}%, Steps score: ${stepsScore}%. Issues with steps: ${stepsIssues.join(', ')}. Please show clearer working.`;
    } else if (combinedScore >= 55) {
      feedbackMessage = `⚠ Needs improvement. Molarity: ${molarityScore}%, Steps: ${stepsScore}%. ${stepsIssues.join(', ')}. Show all calculation steps clearly.`;
    } else {
      feedbackMessage = `❌ Significant gaps (${combinedScore}%). Molarity issues: ${percentError.toFixed(2)}% error. Working details issues: ${stepsIssues.join(', ')}. Review the calculation method.`;
    }

    // ============ RECORD MEASUREMENTS ============
    // Record the calculation
    onMeasurementsUpdate({
      name: 'Calculated Molarity',
      value: molarityInput,
      unit: 'M',
    });

    // Record the working details as an observation
    onMeasurementsUpdate({
      name: 'Calculation Method',
      value: workingDetails.length,
      unit: 'characters',
    });

    // ============ SET FEEDBACK & COMPLETION STATUS ============
    setSubmissionFeedback({
      isValid: true,
      message: feedbackMessage,
      percentError: percentError,
      grade: grade,
      score: score,
      molarityScore: molarityScore,
      stepsScore: stepsScore,
      stepsIssues: stepsIssues,
      combinedScore: combinedScore,
      correctWorkingSteps: correctWorkingSteps,
      correctC2: correctUnknownMolarity
    });

    setCalculationsSubmitted(true);
  };

  const handleResetTitration = () => {
    // In exam mode, prevent reset after submission
    if (isExamMode && calculationsSubmitted) {
      setSubmissionFeedback({
        isValid: false,
        message: '❌ EXAM MODE: Cannot perform another titration after submission. Results are final.'
      });
      return;
    }

    setTitrationAttempts(titrationAttempts + 1);
    setBuretteVolume(0);
    setInitialReading(0.0);
    setFinalReading(null);
    setFlaskColor('Colorless');
    setEndpointReached(false);
    setOverTitrated(false);
    setUserCalculations({ titreVolume: '', molarity: '', workingDetails: '' });
    setSubmissionFeedback(null); // Clear previous feedback
    setCalculationsSubmitted(false); // Re-enable Submit Calculations button
  };

  const colorMap: Record<string, string> = {
    'Red': '#ff6b6b',
    'Orange (ENDPOINT!)': '#ffa500',
    'Yellow (OVER-TITRATED!)': '#ffff00',
    'Colorless': '#ffffff',
    'Pale Pink (ENDPOINT!)': '#ffb3ba',
    'Pink (OVER-TITRATED!)': '#ff69b4',
  };

  // ============ RENDER SETUP PHASE ============
  if (setupPhase === 'apparatus') {
    return (
      <Box>
        {/* Mode Indicator */}
        <Paper sx={{ p: 1, mb: 2, backgroundColor: isExamMode ? '#ffebee' : '#e8f5e9', border: `2px solid ${isExamMode ? '#f44336' : '#4caf50'}` }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', color: isExamMode ? '#d32f2f' : '#2e7d32' }}>
            {isExamMode ? '🔒 EXAM MODE - Single attempt, no retries' : '📚 PRACTICE MODE - Unlimited attempts, hints enabled'}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1565c0', mb: 1 }}>
            🧪 STEP 1: APPARATUS SETUP
          </Typography>
          <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
            Before starting the titration, you must prepare the burette and pipette correctly.
          </Typography>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: buretteRinsed ? '#e8f5e9' : '#fff3cd' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                  📌 Burette (50 mL)
                </Typography>
                <Typography variant="body2" sx={{ color: buretteRinsed ? '#2e7d32' : '#d32f2f', mb: 2, fontWeight: 'bold' }}>
                  {buretteRinsed ? '✓ Rinsed' : '⚠ Not rinsed'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleRinseBurette} 
                  disabled={buretteRinsed}
                  fullWidth
                >
                  Rinse Burette
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ backgroundColor: pipetteRinsed ? '#e8f5e9' : '#fff3cd' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                  📌 Pipette (25 mL)
                </Typography>
                <Typography variant="body2" sx={{ color: pipetteRinsed ? '#2e7d32' : '#d32f2f', mb: 2, fontWeight: 'bold' }}>
                  {pipetteRinsed ? '✓ Rinsed' : '⚠ Not rinsed'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleRinsePipette} 
                  disabled={pipetteRinsed}
                  fullWidth
                >
                  Rinse Pipette
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={() => setSetupPhase('solutions')}
            disabled={!buretteRinsed || !pipetteRinsed}
            fullWidth
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
          >
            ✓ Apparatus Ready - Select Solutions
          </Button>
        </Box>
      </Box>
    );
  }

  // ============ RENDER SOLUTIONS SELECTION ============
  if (setupPhase === 'solutions') {
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1b5e20', mb: 1 }}>
            ⚗️ STEP 2: SELECT ACID & BASE
          </Typography>
          <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
            Choose the acid (titrant) and base (analyte) for this titration, and set their concentrations.
          </Typography>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Acid Selection */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, backgroundColor: '#fff3e0' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                🧪 Titrant (Acid)
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Select Acid:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                }}>
                  {availableAcids.map((acid) => (
                    <Button
                      key={acid.symbol}
                      variant="contained"
                      onClick={() => setSelectedAcid(acid)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: selectedAcid.symbol === acid.symbol ? '#fff' : '#000',
                        backgroundColor: selectedAcid.symbol === acid.symbol ? '#ff9800' : '#536d17',
                        '&:hover': {
                          backgroundColor: selectedAcid.symbol === acid.symbol ? '#ff9800' : '#ffc107',
                        },
                      }}
                    >
                      {acid.name}
                    </Button>
                  ))}
                </Box>
              </Box>
              <TextField
                label="Concentration (M)"
                type="number"
                value={customAcidConc}
                onChange={(e) => setCustomAcidConc(e.target.value)}
                inputProps={{ step: '0.01', min: '0.01' }}
                fullWidth
                sx={{
                  '& .MuiInputBase-input': {
                    color: '#000',
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: '#ff9800',
                  },
                }}
              />
            </Paper>
          </Grid>

          {/* Base Selection */}
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, backgroundColor: '#f3e5f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                🧪 Analyte (Base)
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 0.5 }}>
                  Select Base:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                }}>
                  {availableBases.map((base) => (
                    <Button
                      key={base.symbol}
                      variant="contained"
                      onClick={() => setSelectedBase(base)}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        color: selectedBase.symbol === base.symbol ? '#fff' : '#000',
                        backgroundColor: selectedBase.symbol === base.symbol ? '#7b1fa2' : '#b9415f',
                        '&:hover': {
                          backgroundColor: selectedBase.symbol === base.symbol ? '#7b1fa2' : '#ce93d8',
                        },
                      }}
                    >
                      {base.name}
                    </Button>
                  ))}
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1, fontStyle: 'italic' }}>
                (This is the unknown concentration we will calculate - C₂)
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
            <strong>Summary:</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: '#000', display: 'block' }}>
            ✓ Titrant (Acid): {selectedAcid.name} at {customAcidConc} M
          </Typography>
          <Typography variant="caption" sx={{ color: '#000', display: 'block' }}>
            ✓ Analyte (Base): {selectedBase.name} at {customBaseConc} M (25 mL)
          </Typography>
        </Box>

        {/* Fill Burette and Measure Aliquot - Now in Solutions Phase */}
        <Box sx={{ mt: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
            ⚗️ Prepare Apparatus with Selected Solutions
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Card sx={{ backgroundColor: buretteFilled ? '#e8f5e9' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                    🧴 Fill Burette with {selectedAcid.symbol}
                  </Typography>
                  <Typography variant="body2" sx={{ color: buretteFilled ? '#2e7d32' : '#d32f2f', mb: 2, fontWeight: 'bold' }}>
                    {buretteFilled ? `✓ Filled with ${customAcidConc} M ${selectedAcid.symbol}` : '⚠ Not filled'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleFillBurette}
                    disabled={buretteFilled}
                    fullWidth
                  >
                    Fill Burette
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ backgroundColor: pipetteUsed ? '#e8f5e9' : '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                    📝 Measure 25 mL {selectedBase.symbol}
                  </Typography>
                  <Typography variant="body2" sx={{ color: pipetteUsed ? '#2e7d32' : '#d32f2f', mb: 2, fontWeight: 'bold' }}>
                    {pipetteUsed ? `✓ 25 mL of ${selectedBase.symbol} measured into flask` : '⚠ Not measured'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleUsePipette}
                    disabled={!buretteFilled || pipetteUsed}
                    fullWidth
                  >
                    Measure 25 mL Analyte
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {isPracticeMode && (
            <Button 
              variant="outlined" 
              onClick={() => setSetupPhase('apparatus')}
              fullWidth
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
            >
              ← Back to Apparatus
            </Button>
          )}
          <Button 
            variant="contained" 
            onClick={handleConfirmSolutions}
            disabled={!buretteFilled || !pipetteUsed}
            fullWidth
            sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold', backgroundColor: '#2e7d32' }}
          >
            ✓ Confirm Solutions & Continue
          </Button>
        </Box>
      </Box>
    );
  }

  // ============ RENDER INDICATOR SELECTION ============
  if (setupPhase === 'indicator') {
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f3e5f5', borderLeft: '4px solid #7b1fa2' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#6a1b9a', mb: 1 }}>
            🎨 STEP 3: SELECT INDICATOR
          </Typography>
          <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
            Choose the appropriate indicator for this titration.
          </Typography>
        </Paper>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ cursor: 'pointer', backgroundColor: selectedIndicator === 'methyl-orange' ? '#fff3e0' : '#f5f5f5', border: selectedIndicator === 'methyl-orange' ? '2px solid #ff9800' : 'none' }}>
              <CardContent onClick={() => handleSelectIndicator('methyl-orange')}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                  Methyl Orange
                </Typography>
                <Box sx={{ p: 1, backgroundColor: '#ffcccc', borderRadius: 1, mb: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Red (pH &lt; 3.1)</Typography>
                </Box>
                <Box sx={{ p: 1, backgroundColor: '#ffff99', borderRadius: 1, mb: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Yellow (pH &gt; 4.4)</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#2e7d32', display: 'block', fontWeight: 'bold' }}>
                  ✓ Suitable for strong acid-strong base titrations
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ cursor: 'pointer', backgroundColor: selectedIndicator === 'phenolphthalein' ? '#fff3e0' : '#f5f5f5', border: selectedIndicator === 'phenolphthalein' ? '2px solid #ff9800' : 'none' }}>
              <CardContent onClick={() => handleSelectIndicator('phenolphthalein')}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#000' }}>
                  Phenolphthalein
                </Typography>
                <Box sx={{ p: 1, backgroundColor: '#ffffff', borderRadius: 1, mb: 1, textAlign: 'center', border: '1px solid #ddd' }}>
                  <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Colorless (pH &lt; 8.2)</Typography>
                </Box>
                <Box sx={{ p: 1, backgroundColor: '#ffb3ba', borderRadius: 1, mb: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Pink (pH &gt; 10)</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block', fontWeight: 'bold' }}>
                  ⚠ Not suitable - endpoint pH too high for this reaction
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {selectedIndicator && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {isPracticeMode && (
              <Button 
                variant="outlined" 
                onClick={() => setSetupPhase('solutions')}
                fullWidth
                sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
              >
                ← Back to Solutions
              </Button>
            )}
            <Button 
              variant="contained" 
              onClick={() => setSetupPhase('titration')}
              fullWidth
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
            >
              ✓ Indicator Selected - Perform Titration
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // ============ RENDER TITRATION PHASE ============
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1b5e20', mb: 1 }}>
          📋 STEP 4: PERFORM TITRATION
        </Typography>
        <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
          <strong>Titrant:</strong> {parseFloat(customAcidConc) || selectedAcid.defaultConc} M {selectedAcid.symbol} | <strong>Analyte:</strong> 25 mL {selectedBase.symbol} ({customBaseConc} M) | <strong>Indicator:</strong> {selectedIndicator === 'methyl-orange' ? 'Methyl Orange' : 'Phenolphthalein'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#000' }}>
          Carefully add titrant from the burette until you reach the endpoint (color change).
        </Typography>
      </Paper>

      {/* Apparatus Setup Diagram */}
      <Card sx={{ mb: 3, backgroundColor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2, color: '#000' }}>
            🔧 Laboratory Apparatus Setup
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 2 }}>
            {/* Retort Stand */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#666' }}>📏</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Retort Stand & Clamp</Typography>
            </Box>
            {/* Burette */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#1976d2' }}>📊</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Burette (50 mL)</Typography>
            </Box>
            {/* Pipette */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#4caf50' }}>💧</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Pipette (25 mL)</Typography>
            </Box>
            {/* Conical Flask */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#ff9800' }}>🧪</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Conical Flask</Typography>
            </Box>
            {/* Indicator */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#f44336' }}>🌈</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Indicator</Typography>
            </Box>
            {/* Funnel */}
            <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
              <Typography variant="h4" sx={{ color: '#9c27b0' }}>⛳</Typography>
              <Typography variant="caption" sx={{ color: '#000', fontWeight: 'bold' }}>Funnel</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#666' }}>
            All apparatus is properly set up and ready. Proceed with the titration.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Burette Visualization */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                📊 Burette Reading
              </Typography>
              <Box sx={{ 
                border: '2px solid #333', 
                borderRadius: 1, 
                p: 2, 
                backgroundColor: '#f5f5f5',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <Typography variant="caption" sx={{ textAlign: 'center', color: '#000' }}>
                  50 mL
                </Typography>
                <Box sx={{ height: `${(1 - buretteVolume / 50) * 100}%`, backgroundColor: '#87ceeb', borderRadius: 1 }} />
                <Typography variant="h6" sx={{ textAlign: 'center', color: '#000', fontWeight: 'bold' }}>
                  {buretteVolume.toFixed(1)} mL
                </Typography>
              </Box>
              <Button 
                variant="text" 
                size="small" 
                onClick={() => setShowZoom(!showZoom)}
                fullWidth
                sx={{ mt: 1 }}
              >
                {showZoom ? 'Hide' : 'Show'} Scale
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Flask Visualization */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🧪 Conical Flask
              </Typography>
              <Box sx={{
                p: 3,
                backgroundColor: colorMap[flaskColor] || '#ffffff',
                border: '2px solid #333',
                borderRadius: 1,
                textAlign: 'center',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" sx={{ color: '#000', fontWeight: 'bold' }}>
                  {flaskColor}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                Contains: 25 mL unknown acid + indicator
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Burette Control */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                🔧 Add Titrant
              </Typography>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={buretteVolume}
                onChange={(e) => handleBuretteChange(parseFloat(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
                disabled={!selectedIndicator}
              />
              <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                Drag slider to add solution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Zoom View */}
      {showZoom && (
        <Card sx={{ mt: 2, backgroundColor: '#f9f9f9' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              🔍 Burette Scale (Zoomed)
            </Typography>
            <Box sx={{ p: 2, backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: '#000', display: 'block', mb: 0.5 }}>
                0 mL (Top)
              </Typography>
              {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((mark) => (
                <Box key={mark} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: mark % 5 === 0 ? 20 : 10, height: 2, backgroundColor: '#333' }} />
                  {mark % 5 === 0 && (
                    <Typography variant="caption" sx={{ ml: 1, color: '#000', minWidth: 30 }}>
                      {mark} mL
                    </Typography>
                  )}
                </Box>
              ))}
              <Typography variant="caption" sx={{ color: '#000', display: 'block', mt: 1 }}>
                Meniscus (eye level): {buretteVolume.toFixed(1)} mL
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Detection */}
      {endpointReached && (
        <Card sx={{ mt: 2, backgroundColor: '#fff3e0', border: '2px solid #ff9800' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
              ✅ ENDPOINT REACHED!
            </Typography>
            <Typography variant="body2" sx={{ color: '#000' }}>
              The solution has reached the endpoint at {buretteVolume.toFixed(1)} mL. Record this as your final reading.
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleRecordFinalReading}
              disabled={finalReading !== null}
              fullWidth
              sx={{ mt: 1 }}
            >
              Record Final Reading
            </Button>
          </CardContent>
        </Card>
      )}

      {overTitrated && (
        <Card sx={{ mt: 2, backgroundColor: '#ffebee', border: '2px solid #f44336' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#c62828', mb: 1 }}>
              ❌ OVER-TITRATED!
            </Typography>
            <Typography variant="body2" sx={{ color: '#000' }}>
              You have added too much titrant. The result is invalid. Reset and try again.
            </Typography>
            <Button 
              variant="contained"
              color="error"
              onClick={handleResetTitration}
              fullWidth
              sx={{ mt: 1 }}
            >
              Reset Titration (Attempt {titrationAttempts + 1})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Calculations Section */}
      {finalReading !== null && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              📝 CALCULATIONS
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Initial Burette Reading (mL)"
                  value={initialReading}
                  disabled
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Final Burette Reading (mL)"
                  value={finalReading}
                  disabled
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Volume of Titrant Used (Titre) - mL"
                  value={(finalReading - (initialReading || 0)).toFixed(2)}
                  disabled
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Working Details (Show your calculation steps)"
                  placeholder="Show all your calculation steps here. Example: Write your formula, substitute values, and show each step."
                  value={userCalculations.workingDetails}
                  onChange={(e) => setUserCalculations({ ...userCalculations, workingDetails: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Calculated Molarity of Unknown (M)"
                  value={userCalculations.molarity}
                  onChange={(e) => setUserCalculations({ ...userCalculations, molarity: e.target.value })}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained"
                  onClick={handleSubmitCalculations}
                  disabled={calculationsSubmitted}
                  fullWidth
                  sx={{ backgroundColor: calculationsSubmitted ? '#4caf50' : undefined }}
                >
                  {calculationsSubmitted ? '✓ Calculations Submitted' : 'Submit Calculations'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Submission Feedback */}
      {submissionFeedback && (
        <Card sx={{ 
          mt: 2, 
          backgroundColor: submissionFeedback.isValid ? '#e8f5e9' : '#ffebee',
          border: `2px solid ${submissionFeedback.isValid ? '#4caf50' : '#f44336'}`
        }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: submissionFeedback.isValid ? '#2e7d32' : '#c62828', mb: 2 }}>
              {submissionFeedback.isValid ? '✅ CALCULATION FEEDBACK' : '❌ VALIDATION ERROR'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#000', mb: 1 }}>
              {submissionFeedback.message}
            </Typography>

            {submissionFeedback.isValid && submissionFeedback.percentError !== undefined && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                      Percentage Error
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                      {submissionFeedback.percentError.toFixed(2)}%
                    </Typography>
                  </Grid>
                  
                  {/* Marking Scheme Breakdown */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                      📊 Marking Scheme Breakdown
                    </Typography>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1, border: '1px solid #ddd' }}>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1, backgroundColor: '#e3f2fd', borderRadius: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#1565c0', display: 'block', fontWeight: 'bold' }}>
                              Molarity Accuracy (60%)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#000', fontWeight: 'bold', fontSize: '1.1em' }}>
                              {submissionFeedback.molarityScore}/100
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                              Error: {submissionFeedback.percentError.toFixed(2)}%
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1, backgroundColor: '#f3e5f5', borderRadius: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6a1b9a', display: 'block', fontWeight: 'bold' }}>
                              Calculation Steps (40%)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#000', fontWeight: 'bold', fontSize: '1.1em' }}>
                              {submissionFeedback.stepsScore}/100
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.5 }}>
                              Combined: {submissionFeedback.combinedScore}%
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* Total Mark */}
                      <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#fff9c4', borderRadius: 0.5, border: '2px solid #fbc02d' }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="caption" sx={{ color: '#f57f17', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                              📈 Total Mark
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#f57f17', fontWeight: 'bold', fontSize: '1.3em' }}>
                              {Math.round(((submissionFeedback.molarityScore || 0) + (submissionFeedback.stepsScore || 0)) / 2)}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', display: 'block', mt: 0.3 }}>
                              ({(submissionFeedback.molarityScore || 0)} + {(submissionFeedback.stepsScore || 0)}) / 200 × 100%
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Box sx={{ borderTop: '1px solid #fbc02d', pt: 1 }}>
                              <Typography variant="caption" sx={{ color: '#f57f17', fontWeight: 'bold', display: 'block', mb: 0.3 }}>
                                Grade
                              </Typography>
                              <Typography variant="h5" sx={{ color: '#f57f17', fontWeight: 'bold' }}>
                                {submissionFeedback.grade}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      
                      {/* Show Correct Working Steps */}
                      <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#e8f5e9', borderRadius: 0.5, border: '1px solid #81c784' }}>
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                          ✓ Correct Working Steps (Used for Marking):
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#000', display: 'block', whiteSpace: 'pre-wrap', fontFamily: 'monospace', backgroundColor: '#fff', p: 0.5, borderRadius: 0.25 }}>
                          {submissionFeedback.correctWorkingSteps}
                        </Typography>
                      </Box>
                      
                      {/* Issues if any */}
                      {submissionFeedback.stepsIssues && submissionFeedback.stepsIssues.length > 0 && (
                        <Box sx={{ mt: 1.5, p: 1, backgroundColor: '#fff3e0', borderRadius: 0.5, border: '1px solid #ffb74d' }}>
                          <Typography variant="caption" sx={{ color: '#e65100', fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                            ⚠ Areas to Improve in Working Steps:
                          </Typography>
                          {submissionFeedback.stepsIssues.map((issue: string, idx: number) => (
                            <Typography key={idx} variant="caption" sx={{ color: '#555', display: 'block' }}>
                              • {issue}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#000', display: 'block' }}>
                        <strong>Expected Molarity:</strong> {submissionFeedback.correctC2?.toFixed(4)} M
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#000', display: 'block' }}>
                        <strong>Your Result:</strong> {userCalculations.molarity}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                        This practical is complete. You can perform another titration to improve your results, or proceed to save and submit your work.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Repeat Titration Button */}
      {finalReading !== null && (
        <Button 
          variant="outlined"
          onClick={handleResetTitration}
          disabled={isExamMode && calculationsSubmitted}
          fullWidth
          sx={{ mt: 2 }}
        >
          {isExamMode && calculationsSubmitted ? 'Results Submitted - No More Attempts' : 'Perform Another Titration'}
        </Button>
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
