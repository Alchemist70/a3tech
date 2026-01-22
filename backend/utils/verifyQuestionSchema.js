/**
 * Schema Verification & Sample Data Inspector
 * 
 * This utility helps verify that questions are properly formatted
 * and contain all required fields for WAEC titration practicals.
 * 
 * Usage: node backend/utils/verifyQuestionSchema.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config(path.join(__dirname, '../.env'));

// Import model
const PracticalQuestion = require('../models/PracticalQuestion');

// Required fields for a valid titration question
const REQUIRED_FIELDS = {
  core: ['question_id', 'practical_type', 'titration_type', 'question_text', 'difficulty_level', 'mode'],
  data: ['given_data', 'student_tasks', 'correct_answers', 'marking_scheme', 'penalties'],
  metadata: ['chemistry_context', 'aligned_to_practical', 'source', 'tags']
};

const QUESTION_TYPES = ['acid-base', 'redox'];
const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const MODES = ['practice', 'mock_exam', 'both'];

/**
 * Connect to database
 */
async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alchemist';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

/**
 * Verify a single question object
 */
function verifyQuestionStructure(question, questionIndex = 1) {
  const errors = [];
  const warnings = [];

  // Check core fields
  REQUIRED_FIELDS.core.forEach(field => {
    if (!question[field]) {
      errors.push(`Missing core field: ${field}`);
    }
  });

  // Check data fields
  REQUIRED_FIELDS.data.forEach(field => {
    if (!question[field]) {
      errors.push(`Missing data field: ${field}`);
    }
  });

  // Check metadata fields
  REQUIRED_FIELDS.metadata.forEach(field => {
    if (!question[field]) {
      warnings.push(`Missing metadata: ${field}`);
    }
  });

  // Validate specific fields
  if (question.practical_type && question.practical_type !== 'titration') {
    warnings.push(`Unexpected practical_type: ${question.practical_type}`);
  }

  if (question.titration_type && !QUESTION_TYPES.includes(question.titration_type)) {
    errors.push(`Invalid titration_type: ${question.titration_type}. Expected: ${QUESTION_TYPES.join(' | ')}`);
  }

  if (question.difficulty_level && !DIFFICULTY_LEVELS.includes(question.difficulty_level)) {
    errors.push(`Invalid difficulty_level: ${question.difficulty_level}. Expected: ${DIFFICULTY_LEVELS.join(' | ')}`);
  }

  if (question.mode && !MODES.includes(question.mode)) {
    errors.push(`Invalid mode: ${question.mode}. Expected: ${MODES.join(' | ')}`);
  }

  // Check sub_questions if they exist
  if (question.sub_questions && Array.isArray(question.sub_questions)) {
    question.sub_questions.forEach((sub, idx) => {
      if (!sub.sub_id) errors.push(`Sub-question ${idx} missing sub_id`);
      if (!sub.text) errors.push(`Sub-question ${idx} missing text`);
      if (!sub.marks) errors.push(`Sub-question ${idx} missing marks`);
    });
  }

  // Check correct_answers
  if (question.correct_answers && Array.isArray(question.correct_answers)) {
    question.correct_answers.forEach((ans, idx) => {
      if (!ans.sub_id) errors.push(`Answer ${idx} missing sub_id`);
      if (!ans.units) warnings.push(`Answer ${idx} missing units`);
    });
  }

  // Check marking_scheme
  if (question.marking_scheme) {
    if (!question.marking_scheme.total_marks) {
      errors.push('marking_scheme missing total_marks');
    }
    if (!question.marking_scheme.breakdown || !Array.isArray(question.marking_scheme.breakdown)) {
      errors.push('marking_scheme missing or invalid breakdown');
    }
  }

  // Check tags
  if (!question.tags || !Array.isArray(question.tags) || question.tags.length === 0) {
    warnings.push('No tags provided for filtering');
  }

  return { errors, warnings };
}

/**
 * Display a formatted question for inspection
 */
function displayQuestion(question) {
  console.log('─'.repeat(80));
  console.log(`📋 Question: ${question.question_id}`);
  console.log('─'.repeat(80));
  console.log(`Type: ${question.titration_type} | Difficulty: ${question.difficulty_level} | Mode: ${question.mode}`);
  console.log(`Context: ${question.chemistry_context}`);
  console.log('\n📝 Question Preview:');
  console.log(question.question_text.substring(0, 200) + '...\n');

  if (question.sub_questions) {
    console.log('Sub-questions:');
    question.sub_questions.forEach(sub => {
      console.log(`  ${sub.sub_id}) ${sub.text} (${sub.marks} marks)`);
    });
  }

  if (question.marking_scheme) {
    console.log(`\nMarking: ${question.marking_scheme.total_marks} total marks`);
    console.log('Breakdown:');
    question.marking_scheme.breakdown.slice(0, 3).forEach(item => {
      console.log(`  • ${item.step}: ${item.marks} mark(s)`);
    });
    if (question.marking_scheme.breakdown.length > 3) {
      console.log(`  ... and ${question.marking_scheme.breakdown.length - 3} more steps`);
    }
  }

  if (question.tags) {
    console.log(`\nTags: ${question.tags.join(', ')}`);
  }

  console.log();
}

/**
 * Main verification function
 */
async function verifyDatabase() {
  console.log('🔍 TITRATION QUESTION SCHEMA VERIFICATION\n');
  console.log('═'.repeat(80));

  // Connect to database
  const isConnected = await connectDB();
  if (!isConnected) {
    process.exit(1);
  }

  try {
    // Get all titration questions
    const questions = await PracticalQuestion.find({ practical_type: 'titration' }).lean();

    if (questions.length === 0) {
      console.log('⚠️  No titration questions found in database.');
      console.log('Run: node seeds/seedPracticalQuestions.js');
      process.exit(0);
    }

    console.log(`✅ Found ${questions.length} titration questions\n`);

    // Verify each question
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const results = [];

    console.log('🔎 Verifying structure of each question:\n');
    console.log('─'.repeat(80));

    questions.forEach((question, idx) => {
      const { errors, warnings } = verifyQuestionStructure(question, idx + 1);

      const status = errors.length > 0 ? '❌' : warnings.length > 0 ? '⚠️ ' : '✅';
      const qId = question.question_id || `Q${idx + 1}`;

      console.log(`${status} ${qId}`);

      if (errors.length > 0) {
        errors.forEach(err => console.log(`   ❌ ${err}`));
        errorCount += errors.length;
      }

      if (warnings.length > 0) {
        warnings.forEach(warn => console.log(`   ⚠️  ${warn}`));
        warningCount += warnings.length;
      }

      if (errors.length === 0 && warnings.length === 0) {
        validCount++;
      }

      results.push({
        question_id: question.question_id,
        errors: errors.length,
        warnings: warnings.length,
        valid: errors.length === 0
      });
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 VERIFICATION SUMMARY\n');

    console.log('Questions Status:');
    console.log(`  ✅ Valid (no errors):     ${validCount}/${questions.length}`);
    console.log(`  ⚠️  Warnings only:        ${questions.length - validCount - errorCount}/${questions.length}`);
    console.log(`  ❌ Has errors:           ${results.filter(r => r.errors > 0).length}/${questions.length}`);

    console.log('\nError Analysis:');
    const errorBreakdown = questions.reduce((acc, q) => {
      const { errors } = verifyQuestionStructure(q);
      errors.forEach(err => {
        const field = err.split(':')[0];
        acc[field] = (acc[field] || 0) + 1;
      });
      return acc;
    }, {});

    if (Object.keys(errorBreakdown).length > 0) {
      Object.entries(errorBreakdown).forEach(([field, count]) => {
        console.log(`  • ${field}: ${count} question(s)`);
      });
    } else {
      console.log('  No structural errors found! ✨');
    }

    console.log('\n📋 Question Inventory:\n');

    // Group by difficulty
    const byDifficulty = questions.reduce((acc, q) => {
      acc[q.difficulty_level] = (acc[q.difficulty_level] || 0) + 1;
      return acc;
    }, {});

    console.log('By Difficulty:');
    Object.entries(byDifficulty).forEach(([level, count]) => {
      console.log(`  • ${level.toUpperCase()}: ${count}`);
    });

    // Group by type
    const byType = questions.reduce((acc, q) => {
      acc[q.titration_type] = (acc[q.titration_type] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBy Titration Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });

    // Group by mode
    const byMode = questions.reduce((acc, q) => {
      acc[q.mode] = (acc[q.mode] || 0) + 1;
      return acc;
    }, {});

    console.log('\nBy Mode:');
    Object.entries(byMode).forEach(([mode, count]) => {
      console.log(`  • ${mode}: ${count}`);
    });

    // Show a sample question
    console.log('\n' + '═'.repeat(80));
    console.log('\n📚 SAMPLE QUESTION DETAIL\n');
    if (questions.length > 0) {
      displayQuestion(questions[0]);
    }

    // Data integrity checks
    console.log('═'.repeat(80));
    console.log('\n✅ DATA INTEGRITY CHECKS\n');

    const uniqueIds = new Set(questions.map(q => q.question_id));
    console.log(`Question ID Uniqueness: ${uniqueIds.size === questions.length ? '✅ All unique' : '❌ Duplicates found'}`);

    const allTags = questions.flatMap(q => q.tags || []);
    console.log(`Total tags used: ${new Set(allTags).size}`);
    console.log(`Most common tags: ${
      [...new Set(allTags)]
        .map(tag => [tag, allTags.filter(t => t === tag).length])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => `${tag}(${count})`)
        .join(', ')
    }`);

    console.log('\n' + '═'.repeat(80));

    if (validCount === questions.length) {
      console.log('\n🎉 All questions are properly formatted and ready for use!\n');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Review the errors above before deploying to production.\n`);
      process.exit(0);
    }

  } catch (error) {
    console.error('Error during verification:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run verification
verifyDatabase();
