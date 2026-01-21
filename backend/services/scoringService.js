/**
 * Lab Scoring and Grading Service
 * Handles calculation of scores, grades, and performance metrics
 */

const calculateAccuracy = (actualValue, expectedValue, tolerance = 0.1) => {
  if (expectedValue === 0) return actualValue === 0 ? 100 : 0;
  const difference = Math.abs((actualValue - expectedValue) / expectedValue);
  const accuracy = Math.max(0, 100 - (difference * 100 / tolerance));
  return Math.round(accuracy);
};

const calculateGrade = (totalScore) => {
  if (totalScore >= 90) return 'A';
  if (totalScore >= 80) return 'B';
  if (totalScore >= 70) return 'C';
  if (totalScore >= 60) return 'D';
  return 'F';
};

/**
 * Score a lab result based on various criteria
 * @param {Object} labResult - The lab result object
 * @param {Object} expectedResults - Expected values for the experiment
 * @returns {Object} Scoring breakdown
 */
const scoreLabResult = (labResult, expectedResults = null) => {
  const scoring = {
    accuracyScore: 0,
    procedureScore: 0,
    dataQualityScore: 0,
    reportScore: 0,
    totalScore: 0
  };

  // 1. Accuracy Score (40% weight) - Compare with expected values
  if (expectedResults && labResult.results) {
    const accuracies = [];
    if (labResult.results.calculatedValues) {
      Object.keys(labResult.results.calculatedValues).forEach((key) => {
        if (expectedResults[key] !== undefined) {
          const acc = calculateAccuracy(
            labResult.results.calculatedValues[key],
            expectedResults[key]
          );
          accuracies.push(acc);
        }
      });
    }
    scoring.accuracyScore = accuracies.length > 0 
      ? Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length)
      : 0;
  }

  // 2. Data Quality Score (30% weight) - Based on measurements and observations
  if (labResult.experimentData) {
    let dataQuality = 0;
    
    // Check if measurements exist and have multiple values
    if (labResult.experimentData.measurements && labResult.experimentData.measurements.length > 0) {
      dataQuality += 20;
    }
    
    // Check if observations are detailed
    if (labResult.experimentData.observations && labResult.experimentData.observations.length > 50) {
      dataQuality += 10;
    }

    scoring.dataQualityScore = dataQuality;
  }

  // 3. Procedure Score (20% weight) - User input or system evaluation
  scoring.procedureScore = labResult.scoring?.procedureFollowed || 0;

  // 4. Report Quality Score (10% weight)
  if (labResult.report && labResult.report.htmlContent) {
    scoring.reportScore = 10; // Awarded if report exists
  }

  // Calculate total score with weights
  scoring.totalScore = Math.round(
    (scoring.accuracyScore * 0.4) +
    (scoring.dataQualityScore * 0.3) +
    (scoring.procedureScore * 0.2) +
    (scoring.reportScore * 0.1)
  );

  // Assign grade
  const grade = calculateGrade(scoring.totalScore);

  return {
    ...scoring,
    grade,
    feedback: generateFeedback(scoring.totalScore, grade)
  };
};

/**
 * Generate feedback based on performance
 */
const generateFeedback = (score, grade) => {
  const feedbackMap = {
    'A': score >= 95 
      ? 'Excellent! Outstanding experimental execution and analysis.'
      : 'Great work! Very good understanding and execution of the practical.',
    'B': 'Good work! Your experimental procedure was sound with minor areas for improvement.',
    'C': 'Satisfactory. Review the procedure and calculations to improve accuracy.',
    'D': 'Needs improvement. Please consult with your instructor about specific areas.',
    'F': 'Incomplete. Please redo the experiment following proper procedures carefully.'
  };

  return feedbackMap[grade] || 'Please review your work and try again.';
};

/**
 * Calculate statistics for a set of lab results
 */
const calculateStatistics = (labResults) => {
  if (labResults.length === 0) {
    return {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
      completionRate: 0
    };
  }

  const scores = labResults
    .filter(r => r.scoring && r.scoring.totalScore !== undefined)
    .map(r => r.scoring.totalScore);

  const grades = labResults
    .filter(r => r.scoring && r.scoring.grade)
    .map(r => r.scoring.grade);

  const gradeDistribution = {
    A: grades.filter(g => g === 'A').length,
    B: grades.filter(g => g === 'B').length,
    C: grades.filter(g => g === 'C').length,
    D: grades.filter(g => g === 'D').length,
    F: grades.filter(g => g === 'F').length
  };

  const completedCount = labResults.filter(r => 
    r.status === 'graded' || r.status === 'submitted'
  ).length;

  return {
    averageScore: scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    gradeDistribution,
    completionRate: Math.round((completedCount / labResults.length) * 100)
  };
};

/**
 * Chemistry-specific scoring
 */
const scoreChemistryLab = (labResult, expectedResults) => {
  const baseScoring = scoreLabResult(labResult, expectedResults);

  // Add chemistry-specific criteria
  if (labResult.experimentData && labResult.experimentData.observations) {
    const obs = labResult.experimentData.observations.toLowerCase();
    let bonusPoints = 0;

    // Check for color change observations
    if (obs.includes('color') || obs.includes('precipitate')) bonusPoints += 5;
    
    // Check for temperature observations
    if (obs.includes('temperature') || obs.includes('heat')) bonusPoints += 3;

    baseScoring.totalScore = Math.min(100, baseScoring.totalScore + bonusPoints);
    baseScoring.grade = calculateGrade(baseScoring.totalScore);
  }

  return baseScoring;
};

/**
 * Physics-specific scoring
 */
const scorePhysicsLab = (labResult, expectedResults) => {
  const baseScoring = scoreLabResult(labResult, expectedResults);

  // Add physics-specific criteria
  if (labResult.results && labResult.results.graphData) {
    let bonusPoints = 0;

    // Bonus for having proper graph data
    if (labResult.results.graphData.dataPoints && 
        labResult.results.graphData.dataPoints.length >= 5) {
      bonusPoints += 10;
    }

    baseScoring.totalScore = Math.min(100, baseScoring.totalScore + bonusPoints);
    baseScoring.grade = calculateGrade(baseScoring.totalScore);
  }

  return baseScoring;
};

/**
 * Biology-specific scoring
 */
const scoreBiologyLab = (labResult, expectedResults) => {
  const baseScoring = scoreLabResult(labResult, expectedResults);

  // Add biology-specific criteria
  if (labResult.experimentData && labResult.experimentData.images && 
      labResult.experimentData.images.length > 0) {
    bonusPoints = 5; // Bonus for including diagrams/images
    baseScoring.totalScore = Math.min(100, baseScoring.totalScore + bonusPoints);
    baseScoring.grade = calculateGrade(baseScoring.totalScore);
  }

  return baseScoring;
};

module.exports = {
  scoreLabResult,
  scoreChemistryLab,
  scorePhysicsLab,
  scoreBiologyLab,
  calculateAccuracy,
  calculateGrade,
  calculateStatistics,
  generateFeedback
};
