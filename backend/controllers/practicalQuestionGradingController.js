/**
 * Practical Question Grading Controller
 * Auto-grades student answers against marking schemes
 * Provides detailed feedback and performance metrics
 */

const PracticalQuestion = require('../models/PracticalQuestion');

/**
 * Grade practical question answers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * Request body:
 * {
 *   question_id: 'WAEC-TITRATION-001',
 *   student_answers: {
 *     'a': '0.184 mol dm⁻³',
 *     'b': '11.0 g dm⁻³',
 *     'c': '82 g/mol'
 *   }
 * }
 */
exports.gradeAnswers = async (req, res) => {
  try {
    const { question_id, student_answers } = req.body;

    if (!question_id || !student_answers) {
      return res.status(400).json({
        success: false,
        message: 'Missing question_id or student_answers'
      });
    }

    // Fetch the question with marking scheme
    const question = await PracticalQuestion.findOne({ question_id });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
        question_id
      });
    }

    // Grade the answers
    const gradingResult = gradeStudentAnswers(question, student_answers);

    // Return results with detailed feedback
    return res.status(200).json({
      success: true,
      data: {
        question_id,
        question_text: question.question_text,
        total_marks: question.marking_scheme.total_marks,
        marks_obtained: gradingResult.totalMarks,
        percentage: Math.round((gradingResult.totalMarks / question.marking_scheme.total_marks) * 100),
        sub_question_results: gradingResult.subQuestionResults,
        grading_details: gradingResult.gradingDetails,
        correct_answers: question.correct_answers,
        marking_scheme: question.marking_scheme
      }
    });
  } catch (error) {
    console.error('Grading error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error grading answers',
      error: error.message
    });
  }
};

/**
 * Grade answers against a question's marking scheme
 * @param {Object} question - Question document from DB
 * @param {Object} studentAnswers - Student's submitted answers
 * @returns {Object} Grading result with marks and feedback
 */
function gradeStudentAnswers(question, studentAnswers) {
  const subQuestionResults = [];
  let totalMarks = 0;
  const gradingDetails = [];

  question.sub_questions.forEach((subQuestion) => {
    const subId = subQuestion.sub_id;
    const studentAnswer = studentAnswers[subId] || '';
    const correctAnswer = question.correct_answers.find(ca => ca.sub_id === subId);
    const maxMarks = subQuestion.marks;

    if (!correctAnswer) {
      subQuestionResults.push({
        sub_id: subId,
        marks_obtained: 0,
        max_marks: maxMarks,
        feedback: 'Error: No marking information available'
      });
      return;
    }

    // Grade based on question type
    const result = gradeSubQuestion(
      subQuestion,
      correctAnswer,
      studentAnswer,
      maxMarks,
      question.penalties
    );

    subQuestionResults.push({
      sub_id: subId,
      question_text: subQuestion.text,
      student_answer: studentAnswer,
      marks_obtained: result.marks,
      max_marks: maxMarks,
      feedback: result.feedback,
      is_correct: result.isCorrect
    });

    totalMarks += result.marks;
    gradingDetails.push(result.details);
  });

  return {
    totalMarks: Math.max(0, totalMarks),
    subQuestionResults,
    gradingDetails,
    performanceLevel: getPerformanceLevel(totalMarks, question.marking_scheme.total_marks)
  };
}

/**
 * Grade individual sub-question
 */
function gradeSubQuestion(subQuestion, correctAnswer, studentAnswer, maxMarks, penalties) {
  const questionType = subQuestion.type;
  const trimmedStudentAnswer = studentAnswer.trim();
  const trimmedCorrectAnswer = (correctAnswer.answer_text || correctAnswer.answer_value || '').toString().trim();

  let marks = 0;
  let feedback = '';
  let isCorrect = false;
  const details = {
    sub_id: subQuestion.sub_id,
    type: questionType,
    student_answer: trimmedStudentAnswer,
    correct_answer: trimmedCorrectAnswer,
    marks_awarded: 0,
    max_marks: maxMarks,
    penalties_applied: []
  };

  // Grade based on question type
  if (questionType === 'calculation' || questionType === 'stoichiometry') {
    // For numerical answers, check if within acceptable range
    const result = gradeNumericalAnswer(
      trimmedStudentAnswer,
      correctAnswer,
      maxMarks,
      penalties
    );
    marks = result.marks;
    feedback = result.feedback;
    isCorrect = result.isCorrect;
    details.marks_awarded = marks;
    details.penalties_applied = result.penalties_applied;
  } else if (questionType === 'theory') {
    // For theory answers, check for key concepts
    const result = gradeTheoryAnswer(
      trimmedStudentAnswer,
      correctAnswer,
      maxMarks,
      penalties
    );
    marks = result.marks;
    feedback = result.feedback;
    isCorrect = result.isCorrect;
    details.marks_awarded = marks;
    details.penalties_applied = result.penalties_applied;
  } else {
    // Default: exact match
    if (compareAnswers(trimmedStudentAnswer, trimmedCorrectAnswer)) {
      marks = maxMarks;
      feedback = '✓ Correct answer';
      isCorrect = true;
    } else {
      marks = 0;
      feedback = '✗ Incorrect answer';
    }
    details.marks_awarded = marks;
  }

  return {
    marks,
    feedback,
    isCorrect,
    details
  };
}

/**
 * Grade numerical answers with tolerance
 */
function gradeNumericalAnswer(studentAnswer, correctAnswer, maxMarks, penalties) {
  const penalties_applied = [];
  let marks = 0;
  let feedback = '';
  let isCorrect = false;

  // Extract numeric value from student answer
  const studentNumeric = extractNumericValue(studentAnswer);
  
  if (studentNumeric === null) {
    return {
      marks: 0,
      feedback: '✗ No numeric value found',
      isCorrect: false,
      penalties_applied: [{ penalty: 'No numeric answer', marks: -maxMarks }]
    };
  }

  // Get acceptable range
  const acceptableRange = correctAnswer.acceptable_range || {
    min: correctAnswer.answer_value * 0.95,
    max: correctAnswer.answer_value * 1.05
  };

  // Check if within acceptable range
  if (studentNumeric >= acceptableRange.min && studentNumeric <= acceptableRange.max) {
    marks = maxMarks;
    feedback = `✓ Correct (${studentNumeric} is within acceptable range)`;
    isCorrect = true;
  } else {
    // Partial credit for reasonable attempt
    marks = Math.round(maxMarks * 0.4);
    feedback = `✗ Answer ${studentNumeric} is outside acceptable range [${acceptableRange.min} - ${acceptableRange.max}]`;
    penalties_applied.push({ 
      penalty: 'Outside acceptable range', 
      marks: -(maxMarks - marks)
    });

    // Check for rounding errors
    const roundingErrorPenalty = checkRoundingError(studentNumeric, correctAnswer.answer_value);
    if (roundingErrorPenalty) {
      marks = Math.round(maxMarks * 0.7);
      feedback = `~ Likely rounding error (expected ${correctAnswer.answer_value})`;
      penalties_applied.push({ penalty: 'Rounding error', marks: -(maxMarks - marks) });
      isCorrect = false;
    }
  }

  return {
    marks,
    feedback,
    isCorrect,
    penalties_applied
  };
}

/**
 * Grade theory answers based on key concept keywords
 */
function gradeTheoryAnswer(studentAnswer, correctAnswer, maxMarks, penalties) {
  const penalties_applied = [];
  let marks = 0;
  let feedback = '';
  let isCorrect = false;

  if (!studentAnswer || studentAnswer.length < 5) {
    return {
      marks: 0,
      feedback: '✗ Answer too short or missing',
      isCorrect: false,
      penalties_applied: [{ penalty: 'Insufficient answer', marks: -maxMarks }]
    };
  }

  const correctAnswerText = (correctAnswer.answer_text || '').toLowerCase();
  const studentAnswerLower = studentAnswer.toLowerCase();

  // Check for exact match
  if (compareAnswers(studentAnswer, correctAnswer.answer_text)) {
    marks = maxMarks;
    feedback = '✓ Correct answer';
    isCorrect = true;
  } else {
    // Extract key phrases/keywords from correct answer
    const keyPhrases = extractKeyPhrases(correctAnswerText);
    
    if (keyPhrases.length === 0) {
      // Fallback: simple comparison if no phrases extracted
      marks = 0;
      feedback = '✗ Unable to grade - insufficient data';
      penalties_applied.push({ penalty: 'No grading data', marks: -maxMarks });
    } else {
      // Use semantic similarity matching to find conceptually similar answers
      const matchedPhrases = findSimilarPhrases(studentAnswer, keyPhrases);
      
      // Calculate match percentage based on semantic similarity
      let totalSimilarity = 0;
      matchedPhrases.forEach(match => {
        totalSimilarity += match.similarity;
      });
      
      const matchPercentage = keyPhrases.length > 0 ? totalSimilarity / keyPhrases.length : 0;

      if (matchPercentage >= 0.85) {
        marks = maxMarks;
        feedback = '✓ Correct - All key concepts identified';
        isCorrect = true;
      } else if (matchPercentage >= 0.7) {
        marks = Math.round(maxMarks * 0.8);
        feedback = `✓ Good - Most key concepts present (${Math.round(matchPercentage * 100)}%)`;
        isCorrect = true;
        penalties_applied.push({ penalty: 'Minor omission', marks: -(maxMarks - marks) });
      } else if (matchPercentage >= 0.5) {
        marks = Math.round(maxMarks * 0.6);
        feedback = `~ Partial credit - Some key concepts present (${Math.round(matchPercentage * 100)}%)`;
        penalties_applied.push({ penalty: 'Incomplete explanation', marks: -(maxMarks - marks) });
      } else if (matchPercentage >= 0.25) {
        marks = Math.round(maxMarks * 0.35);
        feedback = `✗ Limited understanding - Few key concepts identified (${Math.round(matchPercentage * 100)}%)`;
        penalties_applied.push({ penalty: 'Inadequate explanation', marks: -(maxMarks - marks) });
      } else {
        marks = 0;
        feedback = '✗ Incorrect - Key concepts missing';
        penalties_applied.push({ penalty: 'Wrong answer', marks: -maxMarks });
      }
    }
  }

  return {
    marks,
    feedback,
    isCorrect,
    penalties_applied
  };
}

/**
 * Extract numeric value from answer string
 */
function extractNumericValue(answer) {
  // Remove units and whitespace
  const cleaned = answer.replace(/[^\d.-]/g, '');
  const numeric = parseFloat(cleaned);
  
  return isNaN(numeric) ? null : numeric;
}

/**
 * Check if student answer has rounding error compared to correct answer
 */
function checkRoundingError(studentValue, correctValue) {
  const tolerance = Math.abs(correctValue * 0.02); // 2% tolerance for rounding
  return Math.abs(studentValue - correctValue) <= tolerance && studentValue !== correctValue;
}

/**
 * Extract key phrases from answer
 * Intelligently identifies important keywords, concepts, and phrases
 */
function extractKeyPhrases(text) {
  if (!text || text.length === 0) return [];
  
  const lowerText = text.toLowerCase();
  
  // Step 1: Extract sentences (split by . ! ? and /)
  const sentences = text.split(/[.!?/]+/).filter(s => s.trim().length > 0);
  
  // Step 2: Extract important keywords and phrases
  const keyPhrases = new Set();
  
  // Add full sentences (meaningful units)
  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (trimmed.length > 5) {
      // Add the whole phrase if meaningful
      keyPhrases.add(trimmed.toLowerCase());
      
      // Also extract individual important words (3+ chars, skip common words)
      const words = trimmed.split(/\s+/);
      const commonWords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'into', 'will', 'are', 'was', 'were', 'been', 'have', 'has', 'or', 'of', 'to', 'in', 'on', 'at', 'by', 'be', 'is', 'not', 'but', 'as', 'can', 'it', 'an', 'a']);
      
      words.forEach(word => {
        const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (cleaned.length >= 3 && !commonWords.has(cleaned)) {
          keyPhrases.add(cleaned);
        }
      });
    }
  });
  
  // Step 3: Also split by separators for backward compatibility
  const separatedPhrases = text.split(/[/;,\n]+/).map(p => p.trim()).filter(p => p.length > 3);
  separatedPhrases.forEach(phrase => keyPhrases.add(phrase.toLowerCase()));
  
  return Array.from(keyPhrases);
}

/**
 * Calculate semantic similarity between two phrases
 * Uses word overlap and substring matching to detect similar concepts
 */
function calculateSemanticSimilarity(phrase1, phrase2) {
  if (!phrase1 || !phrase2) return 0;
  
  const p1 = phrase1.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  const p2 = phrase2.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  
  // Exact match
  if (p1 === p2) return 1.0;
  
  // Check if one phrase is substring of other
  if (p1.includes(p2) || p2.includes(p1)) return 0.85;
  
  // Word-based similarity
  const words1 = p1.split(/\s+/).filter(w => w.length > 2);
  const words2 = p2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = (2 * commonWords.length) / (words1.length + words2.length);
  
  return similarity;
}

/**
 * Check if student answer contains the essence of correct answer
 * Uses semantic similarity instead of exact keyword matching
 */
function findSimilarPhrases(studentAnswer, correctAnswerPhrases) {
  const studentLower = studentAnswer.toLowerCase();
  const matched = [];
  
  correctAnswerPhrases.forEach(phrase => {
    // Try to find similar concepts in student answer
    const words = phrase.split(/\s+/).filter(w => w.length > 2);
    
    // Check for exact phrase match
    if (studentLower.includes(phrase)) {
      matched.push({ phrase, similarity: 1.0 });
      return;
    }
    
    // Check for semantic similarity with student answer
    const avgSimilarity = words.reduce((sum, word) => {
      return sum + (studentLower.includes(word) ? 1 : 0);
    }, 0) / Math.max(words.length, 1);
    
    if (avgSimilarity > 0.5) {
      matched.push({ phrase, similarity: avgSimilarity });
    } else {
      // Last resort: check for concept-related terms (synonyms)
      const conceptMatches = checkConceptualMatch(phrase, studentAnswer);
      if (conceptMatches > 0) {
        matched.push({ phrase, similarity: conceptMatches });
      }
    }
  });
  
  return matched;
}

/**
 * Check for conceptually similar terms (synonyms and related concepts)
 */
function checkConceptualMatch(correctPhrase, studentAnswer) {
  const conceptMap = {
    // Anomaly-related concepts
    'anomalous': ['rough', 'non-concordant', 'outlier', 'inconsistent', 'different', 'odd', 'unusual'],
    'differs significantly': ['rough', 'non-concordant', 'anomalous', 'outlier', 'inconsistent'],
    'significantly': ['greatly', 'substantially', 'markedly', 'considerably'],
    
    // Accuracy/precision concepts
    'parallax error': ['reading error', 'eye level', 'misreading', 'angle error'],
    'rounding error': ['rounding', 'significant figures', 'decimal places'],
    'dilution': ['diluted', 'diluting', 'water', 'concentration'],
    'contamination': ['contaminated', 'impure', 'foreign substance'],
    
    // Apparatus concepts
    'conical flask': ['flask', 'allows swirling', 'prevents spillage', 'no mark'],
    'burette': ['graduated', 'meniscus', 'gravity', 'precise'],
    'pipette': ['accurate', 'delivery', 'fixed volume'],
    
    // Indicator concepts
    'indicator': ['colour change', 'endpoint', 'pH range', 'visible'],
    'phenolphthalein': ['pink', 'colorless', 'pH 8.2-10.0'],
    'methyl orange': ['red', 'yellow', 'pH 3.1-4.4'],
    
    // Reaction concepts
    'carbonic acid': ['CO2', 'carbon dioxide', 'decomposes', 'unstable'],
    'self-indicating': ['colored', 'colour change', 'endpoint visible'],
    'endpoint': ['colour change', 'first drop', 'excess'],
    'equivalence point': ['neutral', 'endpoint', 'reaction complete']
  };
  
  const studentLower = studentAnswer.toLowerCase();
  const phraseWords = correctPhrase.toLowerCase().split(/\s+/);
  
  // Check if any concept from map matches
  for (const [concept, synonyms] of Object.entries(conceptMap)) {
    if (phraseWords.some(w => concept.includes(w) || w.length > 3 && concept.includes(w))) {
      // Found a concept word, check for synonyms in student answer
      const matchedSynonyms = synonyms.filter(syn => studentLower.includes(syn));
      if (matchedSynonyms.length > 0) {
        return 0.7; // Good conceptual match
      }
    }
  }
  
  return 0;
}

/**
 * Compare two answers (case-insensitive, ignore whitespace)
 */
function compareAnswers(answer1, answer2) {
  if (!answer1 || !answer2) return false;
  
  const clean1 = answer1.toLowerCase().replace(/\s+/g, ' ').trim();
  const clean2 = answer2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  return clean1 === clean2;
}

/**
 * Determine performance level
 */
function getPerformanceLevel(marksObtained, totalMarks) {
  const percentage = (marksObtained / totalMarks) * 100;

  if (percentage >= 90) return { level: 'Excellent', symbol: '🌟' };
  if (percentage >= 80) return { level: 'Very Good', symbol: '✓' };
  if (percentage >= 70) return { level: 'Good', symbol: '✓' };
  if (percentage >= 60) return { level: 'Satisfactory', symbol: '~' };
  if (percentage >= 50) return { level: 'Pass', symbol: '~' };
  return { level: 'Needs Improvement', symbol: '✗' };
}

/**
 * Get grading statistics for a student
 */
exports.getGradingStats = async (req, res) => {
  try {
    const { student_id } = req.params;

    // This would fetch from a grading results collection
    // For now, return placeholder
    return res.status(200).json({
      success: true,
      data: {
        message: 'Grading statistics feature coming soon',
        student_id
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};
