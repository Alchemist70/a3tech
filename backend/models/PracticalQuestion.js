const mongoose = require('mongoose');

const PracticalQuestionSchema = new mongoose.Schema({
  // Identification
  question_id: { type: String, required: true, unique: true },
  practical_type: { type: String, enum: ['titration', 'qualitative-analysis', 'quantitative-analysis'], default: 'titration' },
  titration_type: { type: String, enum: ['acid-base', 'redox'], default: 'acid-base' },
  
  // Question Content
  question_text: { type: String, required: true },
  sub_questions: [{
    sub_id: String, // e.g., "a", "b", "c"
    text: String,
    type: { type: String, enum: ['calculation', 'stoichiometry', 'theory', 'advanced'] },
    marks: Number
  }],
  
  // Given Data
  given_data: {
    volumes: {
      titre_1: Number,
      titre_2: Number,
      titre_3: Number,
      analyte_volume: Number,
      units: { type: String, default: 'cm³' }
    },
    masses: [{
      substance: String,
      mass: Number,
      units: { type: String, default: 'g' }
    }],
    concentrations: {
      titrant_concentration: { value: Number, units: { type: String, default: 'mol dm⁻³' } },
      analyte_concentration: Number // Hidden in some questions
    },
    equation: String, // e.g., "HCl + NaOH → NaCl + H₂O"
    molar_masses: {
      substance: String,
      value: Number
    }
  },
  
  // Student Tasks
  student_tasks: [String], // e.g., "Calculate the average titre", "Determine moles of NaOH used"
  
  // Correct Answers (with tolerances)
  correct_answers: [{
    sub_id: String,
    answer_value: Number,
    answer_text: String, // For theory questions
    units: String,
    acceptable_range: {
      min: Number,
      max: Number
    },
    method: String, // Description of how to solve
    significant_figures: Number
  }],
  
  // WAEC-style Marking Scheme
  marking_scheme: {
    total_marks: Number,
    breakdown: [{
      step: String, // e.g., "Calculate average titre"
      marks: Number,
      description: String
    }]
  },
  
  // Penalties & Deductions
  penalties: {
    wrong_units: { type: Number, default: -1 },
    wrong_rounding: { type: Number, default: -0.5 },
    missing_steps: { type: Number, default: -2 },
    incorrect_significant_figures: { type: Number, default: -1 },
    arithmetic_error: { type: Number, default: -1 }
  },
  
  // Difficulty & Mode
  difficulty_level: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  mode: { type: String, enum: ['practice', 'mock_exam', 'both'], default: 'both' },
  
  // Metadata
  tags: [String], // e.g., ['acid-base', 'calculation', 'molarity']
  chemistry_context: String, // e.g., "Standardization of NaOH solution"
  aligned_to_practical: String, // Reference to actual titration lab
  source: { type: String, default: 'WAEC Paper 3' },
  academic_year: String, // e.g., "2024"
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PracticalQuestion', PracticalQuestionSchema);
