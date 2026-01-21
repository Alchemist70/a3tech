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
}

const EnhancedLabSimulation: React.FC<LabSimulationProps> = ({
  labId,
  labTitle,
  subject,
  onSave,
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
      return <SaltAnalysisSimulation onMeasurementsUpdate={handleAddMeasurement} />;
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
                onChange={(e) =>
                  setSimulationState({ ...simulationState, observations: e.target.value })
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
                onChange={(e) =>
                  setSimulationState({ ...simulationState, notes: e.target.value })
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

const SaltAnalysisSimulation: React.FC<{ onMeasurementsUpdate: (m: Measurement) => void }> = ({
  onMeasurementsUpdate,
}) => {
  const [selectedSalt, setSelectedSalt] = useState<string>('');

  const reactions: Record<string, string> = {
    FeSO4: '🔴 Light green ppt → Reddish-brown ppt (oxidation)',
    CuSO4: '🔵 Blue ppt (Cu(OH)₂) with NaOH | Deep blue complex with NH₃',
    BaCl2: '⚪ White ppt with H₂SO₄ (BaSO₄) | White ppt with AgNO₃ (AgCl)',
    AgNO3: '🟤 Dark brown Ag₂O with NaOH | White ppt with HCl',
  };

  return (
    <Box>
      {/* Instructions */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#e3f2fd', borderLeft: '4px solid #667eea' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1565c0', mb: 1 }}>
          📋 Instructions:
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          1. <strong>Click on each salt button</strong> (FeSO₄, CuSO₄, BaCl₂, AgNO₃) to analyze the unknown solution
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000', mb: 1 }}>
          2. <strong>Observe the reactions</strong> shown in the result box below to identify the cation and anion present
        </Typography>
        <Typography variant="body2" sx={{ color: '#000000' }}>
          3. <strong>Record observations</strong> in the "Observations" field: note colors, precipitate formation, and solubility in reagents
        </Typography>
      </Paper>

      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        Select Salt to Analyze:
      </Typography>
      <Grid container spacing={1}>
        {Object.keys(reactions).map((salt) => (
          <Grid item xs={6} key={salt}>
            <Button
              variant={selectedSalt === salt ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => {
                setSelectedSalt(salt);
                onMeasurementsUpdate({
                  name: `${salt} Reaction`,
                  value: 1,
                  unit: 'observed',
                });
              }}
              fullWidth
            >
              {salt}
            </Button>
          </Grid>
        ))}
      </Grid>
      {selectedSalt && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1, color: '#000000' }}>
          <Typography variant="body2" sx={{ color: '#000000' }}>{reactions[selectedSalt]}</Typography>
        </Box>
      )}
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
