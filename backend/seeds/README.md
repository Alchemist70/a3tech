# WAEC Titration Practical Questions

## Overview

This directory contains seed data and scripts for generating and managing WAEC-style titration practical questions in the Alchemist education platform.

## Contents

### 1. **titrationQuestions.js**
Comprehensive dataset containing **11 WAEC-style titration practical questions** covering:

#### Question Types
- **Acid-Base Titrations** (8 questions)
  - Basic HCl vs NaOH calculations
  - H₂SO₄ vs NaOH with stoichiometry
  - Weak acid (ethanoic acid) titrations
  - Concentration conversions (mol/dm³ to g/dm³)
  - Hydrated salt determinations
  - Polyprotic acids (H₃PO₄)
  - Dilution and standardization

- **Redox Titrations** (3 questions)
  - KMnO₄ vs H₂O₂ titrations
  - Iodine titrations (vitamin C analysis)

#### Difficulty Levels
- **Easy** (3 questions): WAEC-TITRATION-001, 004, 009
- **Medium** (5 questions): WAEC-TITRATION-002, 003, 007, 008, 009
- **Hard** (3 questions): WAEC-TITRATION-005, 006, 010, 011

#### Question Coverage by Topic
- **Calculations**: Average titre, molarity, concentration conversions
- **Stoichiometry**: Mole ratios, mass calculations
- **Theory**: Indicator selection, apparatus design, error analysis
- **Advanced**: Hydrated salts, purity analysis, pharmaceutical analysis

### 2. **seedPracticalQuestions.js**
Automated seeding script that:
- Connects to MongoDB
- Clears existing titration questions (optional)
- Inserts all questions into the `PracticalQuestion` collection
- Validates data integrity
- Displays statistics and summary

**Usage:**
```bash
# From the backend directory
node seeds/seedPracticalQuestions.js
```

**Expected Output:**
```
✅ Connected to MongoDB successfully

📚 Starting Titration Questions Seeding...

✅ Successfully seeded 11 titration questions

📊 Seeding Summary:
──────────────────────────────────────────────
Total Titration Questions: 11

By Difficulty Level:
  • EASY: 3
  • MEDIUM: 5
  • HARD: 3

By Mode:
  • both: 5
  • practice: 2
  • mock_exam: 4

By Titration Type:
  • acid-base: 8
  • redox: 3

📝 Sample Questions Seeded:
  1. WAEC-TITRATION-001 [easy]
     "In an experiment to standardize sodium hydroxide solution..."
  2. WAEC-TITRATION-002 [medium]
     "In a titration experiment, 25.00 cm³ of sulphuric acid..."
  [... and more ...]

✅ Seeding completed successfully!

💡 You can now retrieve questions using:
   GET /api/practical-questions/titration
   GET /api/practical-questions/titration?difficulty=medium
   GET /api/practical-questions/titration?mode=practice
   GET /api/practical-questions/titration?tag=stoichiometry
```

## API Endpoints

### Retrieve All Practical Questions
```http
GET /api/practical-questions
```

**Query Parameters:**
- `practical_type`: Filter by type (e.g., 'titration')
- `difficulty_level`: Filter by difficulty ('easy', 'medium', 'hard')
- `mode`: Filter by mode ('practice', 'mock_exam', 'both')
- `tag`: Filter by tag (e.g., 'stoichiometry', 'H₂SO₄')
- `limit`: Number of results (default: 10)
- `skip`: Number of results to skip (default: 0)

**Example:**
```http
GET /api/practical-questions?practical_type=titration&difficulty_level=medium&limit=5
```

### Retrieve Titration Questions
```http
GET /api/practical-questions/titration
```

**Query Parameters:**
- `difficulty_level`: Filter by difficulty
- `titration_type`: Filter by type ('acid-base', 'redox')
- `mode`: Filter by mode
- `tag`: Filter by tag
- `limit`: Number of results (default: 10)
- `skip`: Pagination offset (default: 0)

**Examples:**
```http
GET /api/practical-questions/titration?difficulty_level=easy
GET /api/practical-questions/titration?titration_type=redox&mode=practice
GET /api/practical-questions/titration?tag=stoichiometry
```

### Get Specific Question by ID
```http
GET /api/practical-questions/:question_id
```

**Example:**
```http
GET /api/practical-questions/WAEC-TITRATION-001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question_id": "WAEC-TITRATION-001",
    "practical_type": "titration",
    "titration_type": "acid-base",
    "question_text": "In an experiment to standardize sodium hydroxide solution...",
    "given_data": { ... },
    "student_tasks": [ ... ],
    "correct_answers": [ ... ],
    "marking_scheme": { ... },
    "penalties": { ... },
    "difficulty_level": "easy",
    "mode": "both",
    "tags": ["acid-base", "calculation", "molarity", ...],
    "chemistry_context": "Standardization of sodium hydroxide solution",
    "aligned_to_practical": "Acid-Base Titration",
    "source": "WAEC Paper 3",
    "academic_year": "2024"
  }
}
```

### Get Statistics
```http
GET /api/practical-questions/stats/summary
```

**Response:**
```json
{
  "success": true,
  "total": 11,
  "byType": [
    { "_id": "titration", "count": 11 }
  ],
  "byDifficulty": [
    { "_id": "easy", "count": 3 },
    { "_id": "medium", "count": 5 },
    { "_id": "hard", "count": 3 }
  ],
  "byMode": [
    { "_id": "both", "count": 5 },
    { "_id": "practice", "count": 2 },
    { "_id": "mock_exam", "count": 4 }
  ],
  "allTags": [
    { "_id": "acid-base", "count": 8 },
    { "_id": "stoichiometry", "count": 5 },
    { "_id": "calculation", "count": 9 },
    ...
  ]
}
```

### Get Random Questions (for Practice)
```http
GET /api/practical-questions/random/:count?mode=practice
```

**Example:**
```http
GET /api/practical-questions/random/3?mode=practice
```

## Question Data Structure

Each question document includes:

### Basic Fields
- `question_id` (string): Unique identifier (e.g., "WAEC-TITRATION-001")
- `practical_type` (string): Type of practical ("titration")
- `titration_type` (string): Acid-base or redox ("acid-base", "redox")
- `question_text` (string): Full question text with given data
- `chemistry_context` (string): Learning context
- `aligned_to_practical` (string): Related virtual practical

### Given Data
```javascript
given_data: {
  volumes: { titre_1, titre_2, titre_3, analyte_volume, units },
  concentrations: { titrant_concentration, analyte_concentration },
  equation: "HCl + NaOH → NaCl + H₂O",
  molar_masses: { substance, value }
}
```

### Sub-questions and Answers
```javascript
sub_questions: [
  {
    sub_id: "a",
    text: "Calculate the average titre",
    type: "calculation",
    marks: 3
  }
]

correct_answers: [
  {
    sub_id: "a",
    answer_value: 20.15,
    units: "cm³",
    acceptable_range: { min: 20.10, max: 20.20 },
    method: "Step-by-step method",
    significant_figures: 4
  }
]
```

### Marking Scheme
```javascript
marking_scheme: {
  total_marks: 9,
  breakdown: [
    { step: "Add titre 2 and 3", marks: 1, description: "40.30" },
    { step: "Divide by 2", marks: 1, description: "20.15" },
    ...
  ]
}
```

### Penalties
```javascript
penalties: {
  wrong_units: -1,
  wrong_rounding: -0.5,
  missing_steps: -2,
  incorrect_significant_figures: -1,
  arithmetic_error: -1
}
```

### Classification
- `difficulty_level` (string): "easy", "medium", "hard"
- `mode` (string): "practice", "mock_exam", "both"
- `tags` (array): Topic tags for filtering
- `source` (string): "WAEC Paper 3"
- `academic_year` (string): "2024"

## Integration with Virtual Practical

The questions are designed to complement the **EnhancedLabSimulation** component:

1. **After titration simulation**: Display related question
2. **Question-guided practice**: Use questions to guide students through virtual labs
3. **Assessment**: Use mock_exam mode questions for evaluation
4. **Feedback integration**: Map question answers to simulation results

## How to Use in Frontend

### Fetch questions for a specific difficulty
```javascript
const response = await fetch('/api/practical-questions/titration?difficulty_level=medium');
const { data: questions } = await response.json();
```

### Get random practice questions
```javascript
const response = await fetch('/api/practical-questions/random/3?mode=practice');
const { data: questions } = await response.json();
```

### Fetch specific question by ID
```javascript
const response = await fetch('/api/practical-questions/WAEC-TITRATION-001');
const { data: question } = await response.json();
```

## Question Categories

### SECTION A: Calculations (4-5 questions)
- Average titre determination
- Molarity calculations using C₁V₁ = C₂V₂
- Concentration conversions
- Stoichiometric calculations

### SECTION B: Stoichiometry (3-4 questions)
- Mole ratio determination
- Mass calculations
- Product formation
- Percentage purity

### SECTION C: Theory (2-3 questions)
- Indicator selection rationale
- Apparatus design
- Sources of error
- Chemical principles

### SECTION D: Advanced (1-2 questions)
- Hydrated salt analysis
- Pharmaceutical assays
- Complex stoichiometry
- Real-world applications

## MongoDB Collection

**Collection Name:** `practicalquestions`

**Indexes:** 
- `question_id` (unique)
- `practical_type`
- `difficulty_level`
- `mode`
- `tags`

## Next Steps

1. ✅ Questions generated and seeded
2. ✅ API endpoints created
3. ⏳ **NEXT**: Integrate question retrieval into EnhancedLabSimulation UI
4. ⏳ **NEXT**: Add answer submission and validation logic
5. ⏳ **NEXT**: Connect to student progress tracking

## Maintenance

### Add more questions
Update `titrationQuestions.js` and re-run the seeding script:
```bash
node backend/seeds/seedPracticalQuestions.js
```

### Update existing questions
Modify the question in `titrationQuestions.js` and re-seed (old questions will be replaced).

### Archive questions
Modify the seed script to filter by year or difficulty.

## Support & Notes

- All questions follow **WAEC Paper 3** format
- Realistic titre values (20-30 cm³) based on typical lab conditions
- Partial credit structure matches WAEC marking scheme
- Molar masses and calculations verified
- Balanced chemical equations confirmed

## Questions Index

| ID | Type | Difficulty | Mode | Topic |
|---|---|---|---|---|
| WAEC-TITRATION-001 | Acid-Base | Easy | Both | HCl vs NaOH (Basic) |
| WAEC-TITRATION-002 | Acid-Base | Medium | Both | H₂SO₄ vs NaOH (Stoichiometry) |
| WAEC-TITRATION-003 | Acid-Base | Medium | Both | Ethanoic Acid (Weak Acid) |
| WAEC-TITRATION-004 | Acid-Base | Easy | Practice | Indicator Selection (Theory) |
| WAEC-TITRATION-005 | Redox | Hard | Mock Exam | KMnO₄ vs H₂O₂ |
| WAEC-TITRATION-006 | Acid-Base | Hard | Mock Exam | Hydrated Salt (Na₂CO₃·xH₂O) |
| WAEC-TITRATION-007 | Acid-Base | Medium | Both | Weak Acid Theory |
| WAEC-TITRATION-008 | Acid-Base | Medium | Both | Polyprotic Acid (H₃PO₄) |
| WAEC-TITRATION-009 | Acid-Base | Medium | Both | Dilution & Standardization |
| WAEC-TITRATION-010 | Acid-Base | Hard | Mock Exam | Purity Analysis (Na₂CO₃) |
| WAEC-TITRATION-011 | Redox | Hard | Mock Exam | Vitamin C Analysis (Advanced) |

---

**Last Updated:** December 2024  
**Status:** ✅ Complete - Ready for integration  
**Contact:** Chemistry Team
