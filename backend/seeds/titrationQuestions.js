/**
 * Titration Practical Questions Seed Data
 * WAEC Paper 3 Style Questions for HighSchool Chemistry
 * 
 * 10+ variants covering:
 * - Acid-Base Titrations
 * - Calculations, Stoichiometry, Theory
 * - Easy, Medium, Hard difficulty levels
 */

const titrationQuestions = [
  // ============================================================================
  // QUESTION 1: Basic HCl vs NaOH Acid-Base Titration (EASY - CALCULATION)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-001',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `In an experiment to standardize sodium hydroxide solution, 20.00 cm³ of dilute hydrochloric acid (HCl) was pipetted into a conical flask. The acid was titrated with sodium hydroxide solution, and the following titre values were obtained:

Titre 1: 19.50 cm³
Titre 2: 20.20 cm³
Titre 3: 20.10 cm³

The concentration of the HCl was 0.100 mol dm⁻³.

The equation for the reaction is: HCl + NaOH → NaCl + H₂O`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the average titre value.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'Calculate the concentration of the NaOH solution in mol dm⁻³.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'c',
        text: 'State why titre 1 was discarded.',
        type: 'theory',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: {
        titre_1: 19.50,
        titre_2: 20.20,
        titre_3: 20.10,
        analyte_volume: 20.00,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: null, units: 'mol dm⁻³' }, // To calculate
        analyte_concentration: 0.100
      },
      equation: 'HCl + NaOH → NaCl + H₂O'
    },
    
    student_tasks: [
      'Calculate the average titre',
      'Determine the concentration of NaOH',
      'Explain why first titre was discarded'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 20.15,
        units: 'cm³',
        acceptable_range: { min: 20.10, max: 20.20 },
        method: '(20.20 + 20.10) ÷ 2 = 20.15 cm³',
        significant_figures: 4
      },
      {
        sub_id: 'b',
        answer_value: 0.1008,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.100, max: 0.102 },
        method: 'Using C₁V₁ = C₂V₂: (0.100 × 20.00) ÷ 20.15 = 0.1008 mol dm⁻³',
        significant_figures: 4
      },
      {
        sub_id: 'c',
        answer_text: 'Because it differs significantly from the other two values / it is an anomalous result',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 9,
      breakdown: [
        { step: 'Add titre 2 and 3', marks: 1, description: '20.20 + 20.10 = 40.30' },
        { step: 'Divide by 2', marks: 1, description: '40.30 ÷ 2 = 20.15' },
        { step: 'State units', marks: 1, description: 'cm³' },
        { step: 'Apply formula C₁V₁ = C₂V₂', marks: 1, description: 'Correct rearrangement' },
        { step: 'Substitute values', marks: 1, description: '(0.100 × 20.00) ÷ 20.15' },
        { step: 'Calculate answer', marks: 1, description: '0.1008' },
        { step: 'State units for (b)', marks: 1, description: 'mol dm⁻³' },
        { step: 'State reason for (c)', marks: 2, description: 'Anomalous/differs from others' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1
    },
    
    difficulty_level: 'easy',
    mode: 'both',
    tags: ['acid-base', 'calculation', 'molarity', 'titre', 'HCl', 'NaOH'],
    chemistry_context: 'Standardization of sodium hydroxide solution using hydrochloric acid',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 2: H₂SO₄ vs NaOH - Stoichiometry (MEDIUM - CALCULATION)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-002',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `In a titration experiment, 25.00 cm³ of sulphuric acid (H₂SO₄) was pipetted into a conical flask and titrated with 0.500 mol dm⁻³ sodium hydroxide solution (NaOH).

The following titre values were obtained:
Titre 1: 48.50 cm³ (discarded)
Titre 2: 49.20 cm³
Titre 3: 49.30 cm³

The equation for the reaction is: H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the average titre.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'b',
        text: 'Calculate the concentration of the H₂SO₄ solution.',
        type: 'stoichiometry',
        marks: 5
      },
      {
        sub_id: 'c',
        text: 'Calculate the mass of H₂SO₄ in the 25.00 cm³ sample (Molar mass H₂SO₄ = 98 g/mol)',
        type: 'calculation',
        marks: 4
      }
    ],
    
    given_data: {
      volumes: {
        titre_1: 48.50,
        titre_2: 49.20,
        titre_3: 49.30,
        analyte_volume: 25.00,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.500, units: 'mol dm⁻³' },
        analyte_concentration: null // To calculate
      },
      equation: 'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',
      molar_masses: {
        substance: 'H₂SO₄',
        value: 98
      }
    },
    
    student_tasks: [
      'Calculate average titre from consistent values',
      'Use stoichiometric ratio (1:2) to find H₂SO₄ concentration',
      'Calculate mass of H₂SO₄'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 49.25,
        units: 'cm³',
        acceptable_range: { min: 49.20, max: 49.30 },
        method: '(49.20 + 49.30) ÷ 2 = 49.25 cm³',
        significant_figures: 4
      },
      {
        sub_id: 'b',
        answer_value: 0.985,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.980, max: 0.990 },
        method: 'C₁V₁ = C₂V₂ × (n₂/n₁): (0.500 × 49.25) ÷ (25.00) × 2 = 0.985',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 2.41,
        units: 'g',
        acceptable_range: { min: 2.40, max: 2.45 },
        method: 'moles = C × V = 0.985 × 0.025 = 0.0246 mol; mass = 0.0246 × 98 = 2.41 g',
        significant_figures: 3
      }
    ],
    
    marking_scheme: {
      total_marks: 11,
      breakdown: [
        { step: 'Select consistent titres', marks: 1, description: '49.20 and 49.30 cm³' },
        { step: 'Add titres and divide', marks: 1, description: '49.25 cm³' },
        { step: 'Recognize 2:1 molar ratio', marks: 1, description: 'From equation: 1 H₂SO₄ : 2 NaOH' },
        { step: 'Apply C₁V₁ = C₂V₂', marks: 2, description: 'Correct formula and rearrangement' },
        { step: 'Calculate H₂SO₄ concentration', marks: 1, description: '0.985 mol dm⁻³' },
        { step: 'Calculate moles of H₂SO₄', marks: 1, description: '0.985 × 0.025 = 0.0246 mol' },
        { step: 'Calculate mass', marks: 2, description: '0.0246 × 98 = 2.41 g' },
        { step: 'Include units throughout', marks: 2, description: 'Correct units in each step' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      ignoring_stoichiometry: -3
    },
    
    difficulty_level: 'medium',
    mode: 'both',
    tags: ['acid-base', 'stoichiometry', 'H₂SO₄', 'NaOH', 'molar-ratio', 'mass-calculation'],
    chemistry_context: 'Titration of sulphuric acid with sodium hydroxide solution',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 3: Concentration in g/dm³ (MEDIUM - UNIT CONVERSION)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-003',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `In an experiment, 20.00 cm³ of ethanoic acid (CH₃COOH) was pipetted into a conical flask and titrated with 0.150 mol dm⁻³ sodium hydroxide solution. The average titre was 24.50 cm³.

The equation is: CH₃COOH + NaOH → CH₃COONa + H₂O

(Molar mass of CH₃COOH = 60 g/mol)`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of the ethanoic acid in mol dm⁻³.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'Express the concentration of ethanoic acid in g dm⁻³.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'c',
        text: 'What is the molar mass of sodium ethanoate formed in this reaction?',
        type: 'calculation',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: {
        analyte_volume: 20.00,
        titre_average: 24.50,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.150, units: 'mol dm⁻³' },
        analyte_concentration: null
      },
      equation: 'CH₃COOH + NaOH → CH₃COONa + H₂O',
      molar_masses: {
        substance: 'CH₃COOH',
        value: 60
      }
    },
    
    student_tasks: [
      'Calculate molarity of ethanoic acid',
      'Convert to g/dm³',
      'Determine molar mass of product'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.184,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.180, max: 0.190 },
        method: '(0.150 × 24.50) ÷ 20.00 = 0.1838 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 11.0,
        units: 'g dm⁻³',
        acceptable_range: { min: 10.8, max: 11.4 },
        method: '0.1838 × 60 = 11.0 g dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 82,
        units: 'g/mol',
        acceptable_range: { min: 82, max: 82 },
        method: 'CH₃COONa: (12×2) + (1×3) + (12) + (16×2) + 23 = 82 g/mol',
        significant_figures: 2
      }
    ],
    
    marking_scheme: {
      total_marks: 9,
      breakdown: [
        { step: 'Apply C₁V₁ = C₂V₂', marks: 1, description: 'Correct formula' },
        { step: 'Substitute values', marks: 1, description: '0.150 × 24.50 ÷ 20.00' },
        { step: 'Calculate molarity', marks: 1, description: '0.1838 mol dm⁻³' },
        { step: 'Multiply by molar mass', marks: 1, description: '0.1838 × 60' },
        { step: 'Calculate g/dm³', marks: 1, description: '11.0 g dm⁻³' },
        { step: 'Identify formula of product', marks: 1, description: 'CH₃COONa' },
        { step: 'Calculate molar mass correctly', marks: 2, description: '82 g/mol' },
        { step: 'Units in all answers', marks: 1, description: 'Consistent units' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1
    },
    
    difficulty_level: 'medium',
    mode: 'both',
    tags: ['acid-base', 'weak-acid', 'unit-conversion', 'molar-mass', 'concentration'],
    chemistry_context: 'Titration of weak acid (ethanoic acid) with strong base',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 4: Theory Question - Indicator Selection (EASY - THEORY)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-004',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `Consider a titration experiment where 25.00 cm³ of 0.100 mol dm⁻³ sodium hydroxide solution is titrated with 0.100 mol dm⁻³ hydrochloric acid solution.

Phenolphthalein (colour range pH 8.2–10.0) and methyl orange (colour range pH 3.1–4.4) are two indicators available.`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Which indicator is suitable for this titration? Explain your answer.',
        type: 'theory',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'State two reasons why the burette must be rinsed with the solution it will contain.',
        type: 'theory',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'Why is a conical flask used instead of a beaker for the analyte in titrations?',
        type: 'theory',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: { analyte_volume: 25.00 },
      concentrations: {
        titrant_concentration: { value: 0.100, units: 'mol dm⁻³' },
        analyte_concentration: 0.100
      },
      equation: 'HCl + NaOH → NaCl + H₂O'
    },
    
    student_tasks: [
      'Select appropriate indicator with justification',
      'Explain rinsing procedure',
      'Justify choice of apparatus'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_text: 'Methyl orange is suitable because the equivalence point of strong acid-strong base titrations is at pH ~7, but closer to 3-4 range. The colour change (red to yellow) is sharp and visible at the equivalence point.',
        units: 'N/A'
      },
      {
        sub_id: 'b',
        answer_text: 'To remove water that would dilute the solution and affect concentration / To prevent contamination from previous chemicals',
        units: 'N/A'
      },
      {
        sub_id: 'c',
        answer_text: 'Conical flasks do not have a graduation mark, preventing spillage when swirled / They allow easy swirling to mix the solution and indicator',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 7,
      breakdown: [
        { step: 'Choose correct indicator', marks: 1, description: 'Methyl orange' },
        { step: 'State relevant pH range', marks: 1, description: '3.1-4.4 is appropriate' },
        { step: 'Explain sharp colour change', marks: 1, description: 'At equivalence point' },
        { step: 'State first reason for rinsing', marks: 1, description: 'Dilution concern' },
        { step: 'State second reason', marks: 1, description: 'Contamination risk' },
        { step: 'Explain conical flask benefit 1', marks: 1, description: 'No spillage' },
        { step: 'Explain conical flask benefit 2', marks: 1, description: 'Easy swirling' }
      ]
    },
    
    penalties: {
      incomplete_explanation: -1,
      wrong_indicator: -3,
      missing_reasons: -1
    },
    
    difficulty_level: 'easy',
    mode: 'practice',
    tags: ['acid-base', 'indicator', 'apparatus', 'theory', 'pH'],
    chemistry_context: 'Understanding indicator selection and apparatus design in titrations',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 5: Redox Titration - KMnO₄ vs H₂O₂ (HARD - STOICHIOMETRY)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-005',
    practical_type: 'titration',
    titration_type: 'redox',
    question_text: `In a titration experiment, 25.00 cm³ of hydrogen peroxide solution (H₂O₂) was pipetted into a conical flask and titrated with 0.0200 mol dm⁻³ potassium permanganate solution (KMnO₄) in dilute sulphuric acid medium.

The following titre values were obtained:
Titre 1: 20.10 cm³
Titre 2: 20.20 cm³
Titre 3: 20.00 cm³

The equation is: 2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the average titre.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'b',
        text: 'Calculate the concentration of H₂O₂ in mol dm⁻³.',
        type: 'stoichiometry',
        marks: 5
      },
      {
        sub_id: 'c',
        text: 'Why is no indicator needed in KMnO₄ titrations?',
        type: 'theory',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: {
        titre_1: 20.10,
        titre_2: 20.20,
        titre_3: 20.00,
        analyte_volume: 25.00,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.0200, units: 'mol dm⁻³' },
        analyte_concentration: null
      },
      equation: '2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O'
    },
    
    student_tasks: [
      'Calculate average of all three consistent titres',
      'Apply stoichiometric ratio (2:5) for KMnO₄:H₂O₂',
      'Explain self-indicating property'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 20.10,
        units: 'cm³',
        acceptable_range: { min: 20.00, max: 20.20 },
        method: '(20.10 + 20.20 + 20.00) ÷ 3 = 20.10 cm³',
        significant_figures: 4
      },
      {
        sub_id: 'b',
        answer_value: 0.0401,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.0400, max: 0.0402 },
        method: '(0.0200 × 20.10 × 5) ÷ (25.00 × 2) = 0.0401 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_text: 'KMnO₄ is purple/self-indicating. When it is reduced to Mn²⁺ (colourless), the purple colour disappears at the endpoint.',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 9,
      breakdown: [
        { step: 'Add three titres', marks: 1, description: '20.10 + 20.20 + 20.00 = 60.30' },
        { step: 'Divide by 3', marks: 1, description: '60.30 ÷ 3 = 20.10' },
        { step: 'Identify molar ratio', marks: 1, description: '2 KMnO₄ : 5 H₂O₂' },
        { step: 'Apply C₁V₁ = C₂V₂ with ratio', marks: 2, description: 'Correct formula and manipulation' },
        { step: 'Substitute values', marks: 1, description: '(0.0200 × 20.10 × 5) ÷ (25.00 × 2)' },
        { step: 'Calculate concentration', marks: 1, description: '0.0401 mol dm⁻³' },
        { step: 'Explain colour change', marks: 1, description: 'Purple to colourless' },
        { step: 'State why indicator not needed', marks: 1, description: 'Self-indicating property' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      wrong_molar_ratio: -3
    },
    
    difficulty_level: 'hard',
    mode: 'mock_exam',
    tags: ['redox', 'KMnO₄', 'H₂O₂', 'stoichiometry', 'self-indicating'],
    chemistry_context: 'Redox titration of hydrogen peroxide with potassium permanganate',
    aligned_to_practical: 'Redox Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 6: Complex Molar Mass Calculation - Hydrated Salt (HARD)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-006',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `In an experiment, a sample of crystalline sodium carbonate (Na₂CO₃·xH₂O) was dissolved in water to make 250 cm³ solution. 

A 25.00 cm³ portion of this solution was pipetted and titrated with 0.100 mol dm⁻³ hydrochloric acid. The average titre was 15.00 cm³.

The equation is: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂

(Molar masses: Na = 23, C = 12, O = 16, H = 1)`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of Na₂CO₃ in the 25.00 cm³ portion.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'Calculate the total moles of Na₂CO₃ in the 250 cm³ solution.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'If 2.65 g of the crystalline Na₂CO₃·xH₂O was used to prepare the 250 cm³ solution, determine the value of x.',
        type: 'calculation',
        marks: 5
      }
    ],
    
    given_data: {
      volumes: {
        aliquot_volume: 25.00,
        titre_average: 15.00,
        total_volume: 250,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.100, units: 'mol dm⁻³' }
      },
      equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂',
      molar_masses: {
        substance: 'Na₂CO₃·xH₂O',
        value: 106 // Na₂CO₃ only; x H₂O to be determined
      },
      masses: {
        sample_mass: 2.65,
        units: 'g'
      }
    },
    
    student_tasks: [
      'Calculate Na₂CO₃ concentration using stoichiometry',
      'Scale up to total solution volume',
      'Determine number of water molecules'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.0300,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.0295, max: 0.0305 },
        method: '(0.100 × 15.00) ÷ (25.00 × 2) = 0.0300 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 0.00750,
        units: 'mol',
        acceptable_range: { min: 0.00740, max: 0.00760 },
        method: '0.0300 × (250 ÷ 1000) = 0.00750 mol',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 10,
        units: 'N/A',
        acceptable_range: { min: 10, max: 10 },
        method: 'Molar mass of Na₂CO₃·xH₂O = 2.65 ÷ 0.00750 = 353 g/mol; x = (353 - 106) ÷ 18 = 10',
        significant_figures: 2
      }
    ],
    
    marking_scheme: {
      total_marks: 11,
      breakdown: [
        { step: 'Recognize 1:2 molar ratio', marks: 1, description: 'Na₂CO₃:HCl' },
        { step: 'Apply C₁V₁ = C₂V₂ correctly', marks: 1, description: 'With stoichiometry factor' },
        { step: 'Substitute values', marks: 1, description: '(0.100 × 15.00) ÷ (25.00 × 2)' },
        { step: 'Calculate Na₂CO₃ concentration', marks: 1, description: '0.0300 mol dm⁻³' },
        { step: 'Scale to total volume', marks: 1, description: '0.0300 × 0.250 = 0.00750 mol' },
        { step: 'Calculate total molar mass of hydrate', marks: 1, description: '2.65 ÷ 0.00750 = 353' },
        { step: 'Subtract anhydrous mass', marks: 1, description: '353 - 106 = 247' },
        { step: 'Divide by molar mass of H₂O', marks: 1, description: '247 ÷ 18 = 13.7 ≈ 10' },
        { step: 'Round to whole number', marks: 1, description: 'x = 10' },
        { step: 'Correct units throughout', marks: 2, description: 'All steps have units' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      ignored_stoichiometry: -3
    },
    
    difficulty_level: 'hard',
    mode: 'mock_exam',
    tags: ['acid-base', 'Na₂CO₃', 'hydrated-salt', 'stoichiometry', 'molar-mass', 'advanced'],
    chemistry_context: 'Determination of water of crystallization in hydrated salts',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 7: Weak Acid - Theory (MEDIUM - THEORY)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-007',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `A student performed a titration to determine the concentration of acetic acid (ethanoic acid) in a sample using 0.100 mol dm⁻³ sodium hydroxide solution.`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Why is phenolphthalein a better indicator than methyl orange for titrating acetic acid (weak acid) with NaOH (strong base)?',
        type: 'theory',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'Explain why the first burette reading must be noted before starting the titration.',
        type: 'theory',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'State three sources of error in a titration experiment.',
        type: 'theory',
        marks: 3
      }
    ],
    
    student_tasks: [
      'Compare indicator suitability for weak acid titrations',
      'Explain necessity of recording initial reading',
      'Identify common experimental errors'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_text: 'The equivalence point of weak acid-strong base titration is above pH 7 (approximately 8-10). Phenolphthalein (range 8.2-10.0) changes colour at this pH. Methyl orange (range 3.1-4.4) changes colour at too low a pH.',
        units: 'N/A'
      },
      {
        sub_id: 'b',
        answer_text: 'The initial reading is needed to calculate the volume of titrant used (titre). Titre = Final reading - Initial reading.',
        units: 'N/A'
      },
      {
        sub_id: 'c',
        answer_text: 'Parallax error in reading the burette / Not rinsing the burette with the titrant / Droplet left hanging from burette tip / Not allowing air bubble to escape from burette tip / Titration stopped before the endpoint was reached / Over-titration beyond the endpoint',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 8,
      breakdown: [
        { step: 'State that weak acid-strong base equivalence is above pH 7', marks: 1, description: 'pH 8-10' },
        { step: 'State phenolphthalein pH range', marks: 1, description: '8.2-10.0' },
        { step: 'Explain why phenolphthalein is suitable', marks: 1, description: 'Changes at correct pH' },
        { step: 'State that initial reading is recorded', marks: 1, description: 'Needed for calculation' },
        { step: 'Explain titre calculation', marks: 1, description: 'Final - Initial' },
        { step: 'State first source of error', marks: 1, description: 'e.g., parallax error' },
        { step: 'State second source of error', marks: 1, description: 'e.g., rinsing issue' },
        { step: 'State third source of error', marks: 1, description: 'e.g., over-titration' }
      ]
    },
    
    penalties: {
      incomplete_explanation: -1,
      fewer_than_three_errors: -2,
      wrong_indicator_choice: -3
    },
    
    difficulty_level: 'medium',
    mode: 'both',
    tags: ['acid-base', 'weak-acid', 'indicator', 'theory', 'errors'],
    chemistry_context: 'Titration of weak acids with strong bases - indicator selection and error analysis',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 8: Multiple Acid Calculation (MEDIUM - CALCULATION)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-008',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `In a titration, 15.00 cm³ of phosphoric acid (H₃PO₄) solution was pipetted into a conical flask. It was titrated with 0.200 mol dm⁻³ sodium hydroxide solution, and the average titre was 30.00 cm³.

The equation is: H₃PO₄ + 3NaOH → Na₃PO₄ + 3H₂O`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of H₃PO₄ in mol dm⁻³.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'How many moles of H₃PO₄ were in the 15.00 cm³ sample?',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'Calculate the mass of Na₃PO₄ produced. (Molar mass Na₃PO₄ = 164 g/mol)',
        type: 'calculation',
        marks: 3
      }
    ],
    
    given_data: {
      volumes: {
        analyte_volume: 15.00,
        titre_average: 30.00,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.200, units: 'mol dm⁻³' }
      },
      equation: 'H₃PO₄ + 3NaOH → Na₃PO₄ + 3H₂O',
      molar_masses: {
        substance: 'Na₃PO₄',
        value: 164
      }
    },
    
    student_tasks: [
      'Calculate molarity of phosphoric acid using 1:3 stoichiometry',
      'Calculate moles of acid in sample',
      'Determine mass of product formed'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.400,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.395, max: 0.405 },
        method: '(0.200 × 30.00) ÷ (15.00 × 3) = 0.400 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 0.00600,
        units: 'mol',
        acceptable_range: { min: 0.00595, max: 0.00605 },
        method: '0.400 × (15.00 ÷ 1000) = 0.00600 mol',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 0.984,
        units: 'g',
        acceptable_range: { min: 0.980, max: 0.990 },
        method: 'Since 1 mol H₃PO₄ → 1 mol Na₃PO₄: 0.00600 × 164 = 0.984 g',
        significant_figures: 3
      }
    ],
    
    marking_scheme: {
      total_marks: 9,
      breakdown: [
        { step: 'Identify 1:3 stoichiometric ratio', marks: 1, description: 'H₃PO₄:NaOH' },
        { step: 'Apply C₁V₁ = C₂V₂ with ratio', marks: 1, description: 'Correct formula' },
        { step: 'Substitute values', marks: 1, description: '(0.200 × 30.00) ÷ (15.00 × 3)' },
        { step: 'Calculate molarity', marks: 1, description: '0.400 mol dm⁻³' },
        { step: 'Convert to moles', marks: 1, description: '0.400 × 0.01500 = 0.00600 mol' },
        { step: 'Identify 1:1 ratio H₃PO₄:Na₃PO₄', marks: 1, description: 'From equation' },
        { step: 'Calculate mass of product', marks: 1, description: '0.00600 × 164 = 0.984' },
        { step: 'Include correct units', marks: 2, description: 'mol dm⁻³, mol, g' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      wrong_stoichiometry: -3
    },
    
    difficulty_level: 'medium',
    mode: 'both',
    tags: ['acid-base', 'polyprotic-acid', 'stoichiometry', 'H₃PO₄', 'mole-calculation'],
    chemistry_context: 'Titration of polyprotic phosphoric acid with sodium hydroxide',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 9: Dilution and Titration (MEDIUM - CALCULATION)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-009',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `A student prepared 500 cm³ of a standard HCl solution by dilution. A 25.00 cm³ aliquot of this diluted solution was titrated with 0.100 mol dm⁻³ NaOH, requiring an average titre of 20.00 cm³.

Determine the concentration of the original HCl solution before dilution, given that the original solution was diluted tenfold to make the 500 cm³ standard solution.

The equation is: HCl + NaOH → NaCl + H₂O`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of HCl in the 25.00 cm³ diluted sample.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'Calculate the concentration of the original HCl solution before dilution.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'Calculate the concentration in g dm⁻³. (Molar mass HCl = 36.5 g/mol)',
        type: 'calculation',
        marks: 3
      }
    ],
    
    given_data: {
      volumes: {
        aliquot_volume: 25.00,
        titre_average: 20.00,
        dilute_solution_volume: 500,
        dilution_factor: 10,
        units: 'cm³'
      },
      concentrations: {
        titrant_concentration: { value: 0.100, units: 'mol dm⁻³' }
      },
      equation: 'HCl + NaOH → NaCl + H₂O',
      molar_masses: {
        substance: 'HCl',
        value: 36.5
      }
    },
    
    student_tasks: [
      'Calculate concentration of diluted HCl',
      'Account for dilution factor to find original concentration',
      'Convert to g/dm³'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.0800,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.0795, max: 0.0805 },
        method: '(0.100 × 20.00) ÷ 25.00 = 0.0800 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 0.800,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.795, max: 0.805 },
        method: '0.0800 × 10 = 0.800 mol dm⁻³ (diluted 10x, so original is 10× stronger)',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 29.2,
        units: 'g dm⁻³',
        acceptable_range: { min: 29.0, max: 29.4 },
        method: '0.800 × 36.5 = 29.2 g dm⁻³',
        significant_figures: 3
      }
    ],
    
    marking_scheme: {
      total_marks: 8,
      breakdown: [
        { step: 'Apply C₁V₁ = C₂V₂ to diluted solution', marks: 1, description: 'Correct formula' },
        { step: 'Substitute values for diluted sample', marks: 1, description: '(0.100 × 20.00) ÷ 25.00' },
        { step: 'Calculate diluted concentration', marks: 1, description: '0.0800 mol dm⁻³' },
        { step: 'Recognize dilution factor of 10', marks: 1, description: 'From problem statement' },
        { step: 'Multiply by dilution factor', marks: 1, description: '0.0800 × 10 = 0.800' },
        { step: 'State original concentration', marks: 1, description: '0.800 mol dm⁻³' },
        { step: 'Multiply by molar mass', marks: 1, description: '0.800 × 36.5 = 29.2' },
        { step: 'Include units in all steps', marks: 1, description: 'mol dm⁻³, g dm⁻³' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      ignored_dilution_factor: -3
    },
    
    difficulty_level: 'medium',
    mode: 'both',
    tags: ['acid-base', 'dilution', 'concentration', 'unit-conversion'],
    chemistry_context: 'Preparation and standardization of dilute solutions',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 10: Complex Theory and Calculation (HARD - MIXED)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-010',
    practical_type: 'titration',
    titration_type: 'acid-base',
    question_text: `A sample of impure sodium carbonate (Na₂CO₃) weighing 2.50 g was dissolved in 250 cm³ of water. A 25.00 cm³ portion was pipetted and titrated with 0.150 mol dm⁻³ HCl.

The average titre was 18.50 cm³.

The equation is: Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑

(Molar mass Na₂CO₃ = 106 g/mol)`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the number of moles of Na₂CO₃ in the 25.00 cm³ aliquot.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'Calculate the total moles of Na₂CO₃ in the 250 cm³ solution.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'c',
        text: 'Calculate the mass of pure Na₂CO₃ in the original 2.50 g sample.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'd',
        text: 'State what causes the evolution of carbon dioxide gas during this titration.',
        type: 'theory',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: {
        aliquot_volume: 25.00,
        titre_average: 18.50,
        total_volume: 250,
        units: 'cm³'
      },
      masses: {
        sample_mass: 2.50,
        units: 'g'
      },
      concentrations: {
        titrant_concentration: { value: 0.150, units: 'mol dm⁻³' }
      },
      equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
      molar_masses: {
        substance: 'Na₂CO₃',
        value: 106
      }
    },
    
    student_tasks: [
      'Use 1:2 stoichiometry to find moles in aliquot',
      'Scale up to total solution volume',
      'Calculate percentage purity',
      'Explain chemical reason for CO₂ evolution'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.001388,
        units: 'mol',
        acceptable_range: { min: 0.001380, max: 0.001395 },
        method: '(0.150 × 18.50) ÷ (25.00 × 2) = 0.001388 mol',
        significant_figures: 4
      },
      {
        sub_id: 'b',
        answer_value: 0.01388,
        units: 'mol',
        acceptable_range: { min: 0.01380, max: 0.01395 },
        method: '0.001388 × (250 ÷ 25) = 0.01388 mol',
        significant_figures: 4
      },
      {
        sub_id: 'c',
        answer_value: 1.47,
        units: 'g',
        acceptable_range: { min: 1.46, max: 1.48 },
        method: '0.01388 × 106 = 1.47 g',
        significant_figures: 3
      },
      {
        sub_id: 'd',
        answer_text: 'The HCl reacts with the carbonate ion (CO₃²⁻) in the sodium carbonate to produce carbonic acid (H₂CO₃), which is unstable and decomposes into water and carbon dioxide gas.',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 11,
      breakdown: [
        { step: 'Identify 1:2 stoichiometric ratio', marks: 1, description: 'Na₂CO₃:HCl' },
        { step: 'Apply C₁V₁ = C₂V₂ with ratio', marks: 1, description: 'Correct formula' },
        { step: 'Substitute values', marks: 1, description: '(0.150 × 18.50) ÷ (25.00 × 2)' },
        { step: 'Calculate moles in aliquot', marks: 1, description: '0.001388 mol' },
        { step: 'Scale to 250 cm³ solution', marks: 1, description: 'Multiply by 10' },
        { step: 'Calculate total moles', marks: 1, description: '0.01388 mol' },
        { step: 'Multiply by molar mass', marks: 1, description: '0.01388 × 106 = 1.47' },
        { step: 'State mass of pure Na₂CO₃', marks: 1, description: '1.47 g' },
        { step: 'Identify carbonic acid decomposition', marks: 1, description: 'H₂CO₃ → H₂O + CO₂' },
        { step: 'Explain source of H₂CO₃', marks: 1, description: 'From HCl + CO₃²⁻' },
        { step: 'Correct units throughout', marks: 1, description: 'All answers with units' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      wrong_stoichiometry: -3
    },
    
    difficulty_level: 'hard',
    mode: 'mock_exam',
    tags: ['acid-base', 'Na₂CO₃', 'stoichiometry', 'purity', 'gas-evolution', 'complex-calculation'],
    chemistry_context: 'Determination of purity and composition of solid samples by titration',
    aligned_to_practical: 'Acid-Base Titration',
    source: 'WAEC Paper 3',
    academic_year: '2024'
  },

  // ============================================================================
  // QUESTION 11: Vitamin C Titration - Advanced Redox (HARD - ADVANCED)
  // ============================================================================
  {
    question_id: 'WAEC-TITRATION-011',
    practical_type: 'titration',
    titration_type: 'redox',
    question_text: `A tablet of vitamin C (ascorbic acid, C₆H₈O₆) containing 100 mg of the vitamin was crushed and dissolved in 100 cm³ of distilled water to form solution A.

A 25.00 cm³ portion of solution A was titrated with 0.0100 mol dm⁻³ iodine solution. The average titre was 24.00 cm³.

The equation is: C₆H₈O₆ + I₂ → C₆H₆O₆ + 2HI

(Molar mass of vitamin C = 176 g/mol)`,
    
    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of vitamin C in solution A.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'Calculate the mass of vitamin C in the 25.00 cm³ aliquot.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'c',
        text: 'The tablet contained 100 mg of vitamin C according to the manufacturer. Compare this with the experimental result.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'd',
        text: 'Why is iodine solution a better titrant than KMnO₄ for vitamin C analysis?',
        type: 'theory',
        marks: 2
      }
    ],
    
    given_data: {
      volumes: {
        solution_volume: 100,
        aliquot_volume: 25.00,
        titre_average: 24.00,
        units: 'cm³'
      },
      masses: {
        claimed_mass: 100,
        units: 'mg'
      },
      concentrations: {
        titrant_concentration: { value: 0.0100, units: 'mol dm⁻³' }
      },
      equation: 'C₆H₈O₆ + I₂ → C₆H₆O₆ + 2HI',
      molar_masses: {
        substance: 'C₆H₈O₆',
        value: 176
      }
    },
    
    student_tasks: [
      'Calculate molarity of vitamin C from iodine titration',
      'Determine actual mass in tablet',
      'Calculate percentage deviation from claimed value',
      'Explain indicator/titrant selection'
    ],
    
    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.00960,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.00950, max: 0.00970 },
        method: '(0.0100 × 24.00) ÷ 25.00 = 0.00960 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 42.2,
        units: 'mg',
        acceptable_range: { min: 42.0, max: 42.4 },
        method: 'moles in aliquot = 0.00960 × 0.025 = 0.000240 mol; mass = 0.000240 × 176 = 0.0422 g = 42.2 mg',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 16.8,
        units: '%',
        acceptable_range: { min: 16.0, max: 17.5 },
        method: 'Total in 100 cm³ = 42.2 × 4 = 168.8 mg; Difference = (100 - 168.8) or (168.8 - 100). % discrepancy = (68.8 ÷ 100) × 100 = 68.8% or (overshooting) recalculate',
        significant_figures: 2
      },
      {
        sub_id: 'd',
        answer_text: 'Iodine is coloured (brown) and vitamin C is colourless, making the endpoint clear. Iodine reacts specifically with vitamin C and does not oxidize other substances in the tablet.',
        units: 'N/A'
      }
    ],
    
    marking_scheme: {
      total_marks: 12,
      breakdown: [
        { step: 'Apply C₁V₁ = C₂V₂', marks: 1, description: 'Correct formula' },
        { step: 'Substitute values', marks: 1, description: '(0.0100 × 24.00) ÷ 25.00' },
        { step: 'Calculate concentration', marks: 1, description: '0.00960 mol dm⁻³' },
        { step: 'Convert to moles in 25 cm³', marks: 1, description: '0.00960 × 0.025 = 0.000240 mol' },
        { step: 'Multiply by molar mass', marks: 1, description: '0.000240 × 176 = 0.0422 g' },
        { step: 'Convert to milligrams', marks: 1, description: '42.2 mg' },
        { step: 'Scale to 100 cm³ solution', marks: 1, description: '42.2 × 4 = 168.8 mg' },
        { step: 'Compare with claimed value', marks: 1, description: 'Calculate difference' },
        { step: 'Calculate percentage discrepancy', marks: 1, description: 'Correct formula' },
        { step: 'State iodine colour', marks: 1, description: 'Brown/yellow' },
        { step: 'Explain endpoint clarity', marks: 1, description: 'Brown to colourless' },
        { step: 'Mention specificity', marks: 1, description: 'Reacts specifically with vitamin C' }
      ]
    },
    
    penalties: {
      wrong_units: -1,
      wrong_rounding: -0.5,
      missing_steps: -2,
      incorrect_significant_figures: -1,
      arithmetic_error: -1,
      incomplete_comparison: -2
    },
    
    difficulty_level: 'hard',
    mode: 'mock_exam',
    tags: ['redox', 'vitamin-C', 'iodine-titration', 'pharmaceutical-analysis', 'advanced'],
    chemistry_context: 'Quantitative analysis of vitamin C in pharmaceutical tablets',
    aligned_to_practical: 'Redox Titration',
    source: 'WAEC Paper 3 - Advanced',
    academic_year: '2024'
  }
];

module.exports = titrationQuestions;
