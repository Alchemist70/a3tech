/**
 * Redox Titration Practical Questions Seed Data
 * WAEC Paper 3 Style Questions for High School Chemistry
 * 
 * Questions covering Permanganate (KMnO₄) Redox Titrations
 * Based on actual WAEC exam papers
 */

const redoxTitrationQuestions = [
  // ============================================================================
  // REDOX QUESTION 1: KMnO₄ vs FeSO₄ Redox Titration (ADVANCED)
  // ============================================================================
  {
    question_id: 'WAEC-REDOX-001',
    practical_type: 'titration',
    titration_type: 'redox-permanganate',
    question_text: `A KMnO₄ solution containing 1.58 g of the salt in 500 cm³ of solution was prepared. 
Dilute H₂SO₄ was added to different portions of this solution and treated with FeSO₄ solution which was prepared by dissolving 5.55 g of the hydrated salt FeSO₄.xH₂O in distilled water to make 250 cm³ of solution.

The equation for the reaction is:
MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O

The average titre obtained from the titration was 24.80 cm³
[H⁺ = 0, O⁻ = 6.0, Vm⁻ = 55.0, Fe⁻ = 56.0]`,

    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the concentration of the KMnO₄ solution in mol dm⁻³.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'b',
        text: 'Calculate the concentration of the FeSO₄ solution in g dm⁻³.',
        type: 'calculation',
        marks: 4
      },
      {
        sub_id: 'c',
        text: 'Determine the value of x in the hydrated salt FeSO₄.xH₂O.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'd',
        text: 'Why is it not advisable to acidify the KMnO₄ solution with HCl?',
        type: 'theory',
        marks: 2
      }
    ],

    given_data: {
      permanganate: {
        mass_salt: 1.58,
        volume_prepared: 500,
        units: 'g in cm³'
      },
      ferrous_sulfate: {
        mass_hydrated: 5.55,
        volume_prepared: 250,
        units: 'g in cm³'
      },
      titration: {
        average_titre: 24.80,
        units: 'cm³'
      },
      equation: 'MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O',
      atomic_masses: {
        H: 1,
        O: 16,
        Fe: 56,
        S: 32,
        K: 39,
        Mn: 55
      }
    },

    student_tasks: [
      'Calculate molar mass of KMnO₄',
      'Calculate moles of KMnO₄ dissolved',
      'Calculate concentration of KMnO₄ in mol dm⁻³',
      'Calculate mass of FeSO₄ in hydrated salt',
      'Determine concentration of FeSO₄ in g dm⁻³',
      'Calculate molar mass of FeSO₄.xH₂O',
      'Determine value of x',
      'Explain why HCl cannot be used'
    ],

    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.0126,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.0125, max: 0.0127 },
        method: `Molar mass of KMnO₄ = 39 + 55 + 4(16) = 158 g/mol
Moles = 1.58 ÷ 158 = 0.01 mol
Concentration = 0.01 ÷ 0.5 = 0.02 mol dm⁻³`,
        significant_figures: 3,
        note: 'Volume must be converted from cm³ to dm³'
      },
      {
        sub_id: 'b',
        answer_value: 27.75,
        units: 'g dm⁻³',
        acceptable_range: { min: 27.5, max: 28.0 },
        method: `From equation: MnO₄⁻ + 5Fe²⁺
1 mole of KMnO₄ reacts with 5 moles of FeSO₄
24.80 cm³ × 0.02 mol/dm³ = amount of KMnO₄ used
Moles of FeSO₄ = 5 × moles of KMnO₄
Mass = moles × molar mass of FeSO₄
Concentration = mass ÷ 0.25 dm³`,
        significant_figures: 4
      },
      {
        sub_id: 'c',
        answer_value: 7,
        units: 'x (unitless)',
        acceptable_range: { min: 6.5, max: 7.5 },
        method: `Molar mass of FeSO₄ = 56 + 32 + 4(16) = 152 g/mol
Mass of FeSO₄ in 5.55 g = calculated from concentration
Molar mass of FeSO₄.xH₂O = mass ÷ moles
x = (Molar mass of FeSO₄.xH₂O - 152) ÷ 18`,
        significant_figures: 1
      },
      {
        sub_id: 'd',
        answer_text: 'HCl is a reducing agent and would be oxidized by the permanganate ion (purple), resulting in the loss of color and inaccurate results. Permanganate would oxidize Cl⁻ to Cl₂. H₂SO₄ is used instead because it is not oxidizable by permanganate.',
        units: 'N/A'
      }
    ],

    marking_scheme: {
      total_marks: 13,
      breakdown: [
        { step: 'Calculate molar mass of KMnO₄', marks: 1, description: 'K(39) + Mn(55) + 4O(16) = 158' },
        { step: 'Calculate moles of KMnO₄', marks: 1, description: '1.58 ÷ 158 = 0.01 mol' },
        { step: 'Convert volume to dm³ and calculate concentration', marks: 2, description: '0.01 ÷ 0.5 = 0.02 mol dm⁻³' },
        { step: 'Use stoichiometry to find moles of FeSO₄', marks: 1, description: '5:1 ratio from equation' },
        { step: 'Calculate mass and concentration of FeSO₄', marks: 2, description: 'Correct units (g dm⁻³)' },
        { step: 'Calculate molar mass of FeSO₄.xH₂O', marks: 1, description: 'From mass and moles' },
        { step: 'Determine x value', marks: 1, description: 'x = 7' },
        { step: 'Explain HCl issue', marks: 1, description: 'HCl is reducing agent / permanganate oxidizes Cl⁻ / causes loss of color' },
        { step: 'State alternative acid', marks: 1, description: 'H₂SO₄ is suitable' }
      ]
    },

    penalties: {
      wrong_units: -1,
      incomplete_working: -0.5,
      rounding_errors: -0.5,
      missing_molar_mass: -1,
      conceptual_error: -2
    },

    difficulty_level: 'Advanced',
    mode: 'exam',
    tags: ['redox', 'permanganate', 'stoichiometry', 'calculations', 'waec', 'advanced', 'hydrated-salt'],
    
    created_at: new Date(),
    updated_at: new Date()
  },

  // ============================================================================
  // REDOX QUESTION 2: KMnO₄ vs Oxalic Acid (INTERMEDIATE)
  // ============================================================================
  {
    question_id: 'WAEC-REDOX-002',
    practical_type: 'titration',
    titration_type: 'redox-permanganate',
    question_text: `In an experiment to determine the concentration of potassium permanganate solution, 20.00 cm³ 
of dilute H₂SO₄ was pipetted into a conical flask. A standard solution of oxalic acid (H₂C₂O₄) of concentration 0.020 mol dm⁻³ was added to the acid. 
The mixture was heated gently, and potassium permanganate solution was added from a burette until the pink color just remained.

The equation for the reaction is:
2MnO₄⁻ + 5H₂C₂O₄ + 6H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O

The average titre of KMnO₄ required was 16.50 cm³.
[H = 1, C = 12, O = 16, K = 39, Mn = 55]`,

    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the number of moles of oxalic acid in 20.00 cm³ of the 0.020 mol dm⁻³ solution.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'Using the stoichiometry of the equation, calculate the number of moles of KMnO₄ that reacted.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'c',
        text: 'Calculate the concentration of the KMnO₄ solution in mol dm⁻³.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'd',
        text: 'Why must the solution be heated during the titration?',
        type: 'theory',
        marks: 2
      }
    ],

    given_data: {
      oxalic_acid: {
        volume: 20.00,
        concentration: 0.020,
        units: 'cm³ and mol dm⁻³'
      },
      permanganate: {
        average_titre: 16.50,
        units: 'cm³'
      },
      equation: '2MnO₄⁻ + 5H₂C₂O₄ + 6H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O',
      atomic_masses: {
        H: 1,
        C: 12,
        O: 16,
        K: 39,
        Mn: 55
      }
    },

    student_tasks: [
      'Calculate moles of oxalic acid from concentration and volume',
      'Use equation stoichiometry to find moles of permanganate',
      'Calculate concentration of permanganate',
      'Explain heating requirement'
    ],

    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.0004,
        units: 'mol',
        acceptable_range: { min: 0.00039, max: 0.00041 },
        method: 'n = c × v = 0.020 × (20.00/1000) = 0.0004 mol',
        significant_figures: 1
      },
      {
        sub_id: 'b',
        answer_value: 0.00016,
        units: 'mol',
        acceptable_range: { min: 0.00015, max: 0.00017 },
        method: 'From equation: 5H₂C₂O₄ : 2MnO₄⁻, so moles of KMnO₄ = (2/5) × 0.0004 = 0.00016 mol',
        significant_figures: 1
      },
      {
        sub_id: 'c',
        answer_value: 0.0097,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.009, max: 0.010 },
        method: 'c = n/v = 0.00016 / (16.50/1000) = 0.0097 mol dm⁻³',
        significant_figures: 2
      },
      {
        sub_id: 'd',
        answer_text: 'Heating increases the rate of reaction between permanganate and oxalic acid / provides activation energy / ensures reaction goes to completion / produces more consistent results',
        units: 'N/A'
      }
    ],

    marking_scheme: {
      total_marks: 11,
      breakdown: [
        { step: 'Convert volume to dm³', marks: 1, description: '20.00 cm³ = 0.02000 dm³' },
        { step: 'Calculate moles of oxalic acid', marks: 2, description: 'n = 0.020 × 0.02000 = 0.0004 mol' },
        { step: 'Apply stoichiometry ratio', marks: 1, description: '2:5 ratio from equation' },
        { step: 'Calculate moles of permanganate', marks: 2, description: '(2/5) × 0.0004 = 0.00016 mol' },
        { step: 'Convert titre to dm³', marks: 1, description: '16.50 cm³ = 0.01650 dm³' },
        { step: 'Calculate permanganate concentration', marks: 2, description: 'c = 0.00016 / 0.01650 = 0.0097 mol dm⁻³' },
        { step: 'Explain heating', marks: 1, description: 'Increases reaction rate / ensures completion' }
      ]
    },

    penalties: {
      wrong_stoichiometry: -2,
      forgot_conversion: -1,
      arithmetic_error: -0.5
    },

    difficulty_level: 'Intermediate',
    mode: 'practice',
    tags: ['redox', 'permanganate', 'oxalic-acid', 'stoichiometry', 'waec', 'intermediate'],
    
    created_at: new Date(),
    updated_at: new Date()
  },

  // ============================================================================
  // REDOX QUESTION 3: KMnO₄ vs Hydrogen Peroxide (ADVANCED)
  // ============================================================================
  {
    question_id: 'WAEC-REDOX-003',
    practical_type: 'titration',
    titration_type: 'redox-permanganate',
    question_text: `A sample of hydrogen peroxide solution was diluted with distilled water and titrated against a standard 
solution of potassium permanganate. 25.00 cm³ of the diluted hydrogen peroxide required 21.60 cm³ of 0.0200 mol dm⁻³ 
potassium permanganate solution for complete reaction.

The equation for the reaction in acidic solution is:
2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O

[H = 1, O = 16, K = 39, Mn = 55]`,

    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the number of moles of KMnO₄ used in the titration.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'b',
        text: 'Using the equation, calculate the moles of H₂O₂ that reacted.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'c',
        text: 'Calculate the concentration of the diluted hydrogen peroxide solution in mol dm⁻³.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'd',
        text: 'The undiluted hydrogen peroxide solution was diluted 10 times. Calculate the concentration of the original H₂O₂ solution.',
        type: 'calculation',
        marks: 2
      }
    ],

    given_data: {
      hydrogen_peroxide: {
        volume_diluted: 25.00,
        dilution_factor: 10,
        units: 'cm³'
      },
      permanganate: {
        concentration: 0.0200,
        titre_volume: 21.60,
        units: 'mol dm⁻³ and cm³'
      },
      equation: '2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O',
      atomic_masses: {
        H: 1,
        O: 16,
        K: 39,
        Mn: 55
      }
    },

    student_tasks: [
      'Calculate moles of permanganate used',
      'Apply stoichiometry to find moles of hydrogen peroxide',
      'Calculate concentration of diluted peroxide',
      'Calculate concentration of original solution'
    ],

    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.000432,
        units: 'mol',
        acceptable_range: { min: 0.000430, max: 0.000434 },
        method: 'n = c × v = 0.0200 × (21.60/1000) = 0.000432 mol',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 0.00108,
        units: 'mol',
        acceptable_range: { min: 0.001, max: 0.0011 },
        method: 'From equation: 2MnO₄⁻ : 5H₂O₂, so moles H₂O₂ = (5/2) × 0.000432 = 0.00108 mol',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_value: 0.0432,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.040, max: 0.045 },
        method: 'c = n/v = 0.00108 / (25.00/1000) = 0.0432 mol dm⁻³',
        significant_figures: 3
      },
      {
        sub_id: 'd',
        answer_value: 0.432,
        units: 'mol dm⁻³',
        acceptable_range: { min: 0.40, max: 0.45 },
        method: 'Original concentration = diluted concentration × dilution factor = 0.0432 × 10 = 0.432 mol dm⁻³',
        significant_figures: 3
      }
    ],

    marking_scheme: {
      total_marks: 11,
      breakdown: [
        { step: 'Convert titre volume to dm³', marks: 1, description: '21.60 cm³ = 0.02160 dm³' },
        { step: 'Calculate moles of permanganate', marks: 2, description: 'n = 0.0200 × 0.02160 = 0.000432 mol' },
        { step: 'Apply stoichiometry (2:5 ratio)', marks: 1, description: 'Moles of H₂O₂ = (5/2) × 0.000432' },
        { step: 'Calculate moles of peroxide', marks: 1, description: '= 0.00108 mol' },
        { step: 'Convert sample volume to dm³', marks: 1, description: '25.00 cm³ = 0.02500 dm³' },
        { step: 'Calculate diluted concentration', marks: 2, description: 'c = 0.00108 / 0.02500 = 0.0432 mol dm⁻³' },
        { step: 'Apply dilution factor', marks: 2, description: 'Original = 0.0432 × 10 = 0.432 mol dm⁻³' }
      ]
    },

    penalties: {
      wrong_stoichiometry: -2,
      forgot_dilution_factor: -2,
      unit_error: -1
    },

    difficulty_level: 'Advanced',
    mode: 'exam',
    tags: ['redox', 'permanganate', 'hydrogen-peroxide', 'stoichiometry', 'dilution', 'waec', 'advanced'],
    
    created_at: new Date(),
    updated_at: new Date()
  },

  // ============================================================================
  // REDOX QUESTION 4: KMnO₄ vs Sodium Thiosulfate (ADVANCED)
  // ============================================================================
  {
    question_id: 'WAEC-REDOX-004',
    practical_type: 'titration',
    titration_type: 'redox-permanganate',
    question_text: `A solution containing iodine was prepared and 25.00 cm³ of this solution was pipetted into a flask 
containing excess sodium thiosulfate. The iodine was reduced to iodide ions, and the excess sodium thiosulfate was 
back-titrated with 0.0100 mol dm⁻³ potassium permanganate solution. 18.20 cm³ of the permanganate solution was required.

The equation for the reaction between MnO₄⁻ and S₂O₃²⁻ in acidic conditions is:
2MnO₄⁻ + 5S₂O₃²⁻ + 4H₂O → 2MnO₂ + 10SO₄²⁻ + 8H⁺

[Mn = 55, S = 32, O = 16, H = 1, K = 39]`,

    sub_questions: [
      {
        sub_id: 'a',
        text: 'Calculate the moles of KMnO₄ used.',
        type: 'calculation',
        marks: 2
      },
      {
        sub_id: 'b',
        text: 'Calculate the moles of S₂O₃²⁻ that reacted with the permanganate.',
        type: 'calculation',
        marks: 3
      },
      {
        sub_id: 'c',
        text: 'Explain why excess sodium thiosulfate was added to the iodine solution.',
        type: 'theory',
        marks: 2
      },
      {
        sub_id: 'd',
        text: 'Why would using KMnO₄ directly to titrate the iodine solution (without thiosulfate) be unsuitable?',
        type: 'theory',
        marks: 2
      }
    ],

    given_data: {
      iodine_solution: {
        volume: 25.00,
        units: 'cm³'
      },
      permanganate: {
        concentration: 0.0100,
        titre_volume: 18.20,
        units: 'mol dm⁻³ and cm³'
      },
      equation: '2MnO₄⁻ + 5S₂O₃²⁻ + 4H₂O → 2MnO₂ + 10SO₄²⁻ + 8H⁺',
      atomic_masses: {
        Mn: 55,
        S: 32,
        O: 16,
        H: 1,
        K: 39
      }
    },

    student_tasks: [
      'Calculate moles of permanganate',
      'Use stoichiometry to find moles of thiosulfate',
      'Explain excess thiosulfate addition',
      'Explain why direct permanganate titration unsuitable'
    ],

    correct_answers: [
      {
        sub_id: 'a',
        answer_value: 0.000182,
        units: 'mol',
        acceptable_range: { min: 0.000180, max: 0.000184 },
        method: 'n = c × v = 0.0100 × (18.20/1000) = 0.000182 mol',
        significant_figures: 3
      },
      {
        sub_id: 'b',
        answer_value: 0.000455,
        units: 'mol',
        acceptable_range: { min: 0.00045, max: 0.00046 },
        method: 'From equation: 2MnO₄⁻ : 5S₂O₃²⁻, so moles S₂O₃²⁻ = (5/2) × 0.000182 = 0.000455 mol',
        significant_figures: 3
      },
      {
        sub_id: 'c',
        answer_text: 'Excess sodium thiosulfate ensures complete reduction of all iodine present / ensures all iodine is converted to iodide ions / the excess can then be back-titrated with permanganate',
        units: 'N/A'
      },
      {
        sub_id: 'd',
        answer_text: 'Permanganate would oxidize iodide ions (formed from reduction) back to iodine / the endpoint would be unclear / iodine gives its own color which would interfere with the purple permanganate color / the reaction would not be quantitative',
        units: 'N/A'
      }
    ],

    marking_scheme: {
      total_marks: 9,
      breakdown: [
        { step: 'Convert titre to dm³', marks: 1, description: '18.20 cm³ = 0.01820 dm³' },
        { step: 'Calculate moles of permanganate', marks: 1, description: 'n = 0.0100 × 0.01820 = 0.000182 mol' },
        { step: 'Apply stoichiometry ratio 5:2', marks: 1, description: 'S₂O₃²⁻ : MnO₄⁻ = 5:2' },
        { step: 'Calculate moles of thiosulfate', marks: 2, description: '(5/2) × 0.000182 = 0.000455 mol' },
        { step: 'Explain excess thiosulfate', marks: 2, description: 'Ensures complete reduction / allows back-titration' },
        { step: 'Explain why direct permanganate unsuitable', marks: 2, description: 'Oxidation of product / color interference / non-quantitative' }
      ]
    },

    penalties: {
      wrong_stoichiometry: -2,
      incomplete_explanation: -1
    },

    difficulty_level: 'Advanced',
    mode: 'exam',
    tags: ['redox', 'permanganate', 'thiosulfate', 'iodine', 'back-titration', 'waec', 'advanced'],
    
    created_at: new Date(),
    updated_at: new Date()
  }
];

module.exports = redoxTitrationQuestions;
