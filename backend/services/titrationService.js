/**
 * Titration Service
 * Handles calculations, validations, and grading for acid-base and redox titrations
 */

/**
 * Validate and calculate molarity using the titration formula: C₁V₁ = C₂V₂
 * C₁ = concentration of standard (titrant)
 * V₁ = volume of standard used (titre)
 * C₂ = concentration of unknown (analyte)
 * V₂ = volume of analyte
 */
const calculateMolarity = (titrantConcentration, titreVolume, analyteVolume, stoichiometry = 1) => {
  if (!titrantConcentration || titreVolume <= 0 || analyteVolume <= 0) {
    return null;
  }

  // For HCl vs NaOH: HCl + NaOH → NaCl + H₂O (1:1 stoichiometry)
  // Formula: C₁V₁ = C₂V₂ (accounting for stoichiometry)
  const analyteConcentration = (titrantConcentration * titreVolume * stoichiometry) / analyteVolume;
  
  return {
    molarity: parseFloat(analyteConcentration.toFixed(4)),
    moles: {
      titrant: (titrantConcentration * titreVolume) / 1000,
      analyte: (analyteConcentration * analyteVolume) / 1000
    }
  };
};

/**
 * Validate titre value is within realistic range
 * Typical burettes are 50 mL with 0.1 mL precision
 */
const validateTitre = (titreVolume) => {
  const validations = {
    isValid: true,
    issues: [],
    warnings: []
  };

  if (titreVolume < 0.5) {
    validations.issues.push('Titre value too small - likely measurement error');
    validations.isValid = false;
  }

  if (titreVolume > 50) {
    validations.issues.push('Titre value exceeds burette capacity (50 mL)');
    validations.isValid = false;
  }

  if (titreVolume < 10) {
    validations.warnings.push('Small titre volume - may indicate insufficient analyte or dilute standard');
  }

  if (titreVolume > 45) {
    validations.warnings.push('Large titre volume - may indicate over-titration or very dilute analyte');
  }

  return validations;
};

/**
 * Calculate percentage error in molarity
 */
const calculatePercentageError = (actualMolarity, expectedMolarity) => {
  if (expectedMolarity === 0) return 0;
  return Math.abs((actualMolarity - expectedMolarity) / expectedMolarity) * 100;
};

/**
 * Validate indicator choice for given titration
 */
const validateIndicator = (indicatorName, titrationRxn) => {
  const indicatorRanges = {
    'methyl-orange': {
      pHRange: [3.1, 4.4],
      suitable: ['strong-acid-strong-base'],
      unsuitable: ['weak-acid-strong-base', 'strong-acid-weak-base', 'weak-acid-weak-base']
    },
    'phenolphthalein': {
      pHRange: [8.2, 10.0],
      suitable: ['weak-acid-strong-base', 'strong-acid-weak-base'],
      unsuitable: ['strong-acid-strong-base']
    },
    'methyl-red': {
      pHRange: [4.5, 6.2],
      suitable: ['weak-acid-strong-base'],
      unsuitable: ['strong-acid-strong-base']
    }
  };

  const indicator = indicatorRanges[indicatorName];
  if (!indicator) return { isValid: false, message: 'Unknown indicator' };

  if (indicator.suitable.includes(titrationRxn)) {
    return { isValid: true, message: 'Indicator is appropriate for this titration' };
  } else {
    return { isValid: false, message: `Indicator not suitable for ${titrationRxn}. Try ${indicator.suitable.join(' or ')}` };
  }
};

/**
 * Calculate standard deviation for multiple titres (consistency check)
 */
const calculateTitreConsistency = (titreValues) => {
  if (titreValues.length < 2) {
    return { stdDev: null, message: 'Need at least 2 titre values for consistency check' };
  }

  const mean = titreValues.reduce((a, b) => a + b) / titreValues.length;
  const variance = titreValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / titreValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Acceptable if std dev is less than 5% of mean
  const isConsistent = (stdDev / mean) * 100 < 5;

  return {
    mean: parseFloat(mean.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    percentVariation: parseFloat(((stdDev / mean) * 100).toFixed(1)),
    isConsistent,
    message: isConsistent ? 'Titrations are consistent' : 'Titration results vary more than acceptable'
  };
};

/**
 * Determine endpoint based on indicator and solution color
 */
const determineEndpoint = (flaskColor, indicatorName) => {
  const endpoints = {
    'methyl-orange': {
      beforeEndpoint: ['Red'],
      atEndpoint: ['Orange'],
      afterEndpoint: ['Yellow']
    },
    'phenolphthalein': {
      beforeEndpoint: ['Colorless'],
      atEndpoint: ['Pale Pink'],
      afterEndpoint: ['Pink', 'Deep Pink']
    }
  };

  const indicator = endpoints[indicatorName];
  if (!indicator) return null;

  if (indicator.atEndpoint.includes(flaskColor)) {
    return { endpointReached: true, status: 'at endpoint' };
  } else if (indicator.afterEndpoint.includes(flaskColor)) {
    return { endpointReached: true, status: 'over-titrated' };
  } else {
    return { endpointReached: false, status: 'before endpoint' };
  }
};

/**
 * Grade a titration based on accuracy and procedure
 */
const gradeTitration = (actualMolarity, expectedMolarity, titreAccuracy, procedureScore) => {
  let totalScore = 0;

  // Accuracy Score (50%)
  const percentError = calculatePercentageError(actualMolarity, expectedMolarity);
  let accuracyScore = 0;
  
  if (percentError <= 5) accuracyScore = 50; // Within 5%
  else if (percentError <= 10) accuracyScore = 40; // Within 10%
  else if (percentError <= 15) accuracyScore = 30; // Within 15%
  else accuracyScore = 0; // Too much error

  // Titre Accuracy Score (30%)
  let titreScore = titreAccuracy * 0.3 || 0;

  // Procedure Score (20%)
  let procScore = procedureScore * 0.2 || 0;

  totalScore = accuracyScore + titreScore + procScore;

  // Determine grade
  let grade;
  if (totalScore >= 90) grade = 'A';
  else if (totalScore >= 80) grade = 'B';
  else if (totalScore >= 70) grade = 'C';
  else if (totalScore >= 60) grade = 'D';
  else grade = 'F';

  return {
    score: Math.round(totalScore),
    grade,
    breakdown: {
      accuracy: accuracyScore,
      titre: titreScore,
      procedure: procScore
    },
    percentError
  };
};

/**
 * Generate detailed feedback on titration performance
 */
const generateTitrationFeedback = (score, grade, actualMolarity, expectedMolarity, titreValue) => {
  const percentError = calculatePercentageError(actualMolarity, expectedMolarity);
  const suggestion = percentError > 15 
    ? 'Your results show significant variation. Focus on accurate meniscus reading and careful endpoint detection.'
    : percentError > 10
    ? 'Minor improvements needed. Review your burette reading technique and ensure you stop exactly at the endpoint.'
    : 'Good technique! Continue practicing to maintain this level of accuracy.';

  return {
    summary: `Grade: ${grade} (${score}/100)`,
    accuracy: `Molarity error: ${percentError.toFixed(1)}% (Expected: ${expectedMolarity.toFixed(4)} M, Got: ${actualMolarity.toFixed(4)} M)`,
    titre: `Titre volume recorded: ${titreValue.toFixed(2)} mL`,
    suggestion
  };
};

module.exports = {
  calculateMolarity,
  validateTitre,
  calculatePercentageError,
  validateIndicator,
  calculateTitreConsistency,
  determineEndpoint,
  gradeTitration,
  generateTitrationFeedback
};
