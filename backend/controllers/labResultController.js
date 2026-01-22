const LabResult = require('../models/LabResult');
const Lab = require('../models/Lab');
const { v4: uuidv4 } = require('uuid');
const scoringService = require('../services/scoringService');
const reportService = require('../services/reportService');
const titrationService = require('../services/titrationService');

// Create a new lab session
exports.createLabSession = async (req, res) => {
  try {
    const { userId, labId } = req.body;

    if (!userId || !labId) {
      return res.status(400).json({ message: 'userId and labId are required' });
    }

    // Get lab details
    const lab = await Lab.findById(labId);
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    const labResult = new LabResult({
      userId,
      labId,
      labTitle: lab.title,
      subject: lab.subject,
      uuid: uuidv4(),
      status: 'in-progress'
    });

    const savedResult = await labResult.save();
    res.status(201).json({ success: true, data: savedResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get lab session by ID
exports.getLabSession = async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id).populate('labId userId');
    if (!labResult) {
      return res.status(404).json({ message: 'Lab session not found' });
    }
    res.json(labResult);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all lab sessions for a user
exports.getUserLabSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await LabResult.find({ userId })
      .populate('labId')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lab session with measurements
exports.updateLabMeasurements = async (req, res) => {
  try {
    const { measurements, observations, notes } = req.body;
    
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      {
        'experimentData.measurements': measurements || [],
        'experimentData.observations': observations || '',
        'experimentData.notes': notes || '',
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, data: labResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update lab results/calculations
exports.updateLabResults = async (req, res) => {
  try {
    const { calculatedValues, expectedValues, errors, graphData } = req.body;
    
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      {
        'results.calculatedValues': calculatedValues || {},
        'results.expectedValues': expectedValues || {},
        'results.errors': errors || {},
        'results.graphData': graphData || {},
        'experimentData.measurements': req.body.measurements || [],
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, data: labResult });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Submit lab for grading
exports.submitLab = async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      {
        status: 'submitted',
        submittedAt: new Date(),
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, data: labResult, message: 'Lab submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Grade lab and calculate score
exports.gradeLab = async (req, res) => {
  try {
    const { procedureFollowed, feedback } = req.body;
    
    let labResult = await LabResult.findById(req.params.id).populate('labId');
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }

    // Get expected values for the lab (could be stored in a separate reference)
    const expectedResults = req.body.expectedResults || null;

    // Score based on subject
    let scoring;
    switch (labResult.subject) {
      case 'Chemistry':
        scoring = scoringService.scoreChemistryLab(labResult.toObject(), expectedResults);
        break;
      case 'Physics':
        scoring = scoringService.scorePhysicsLab(labResult.toObject(), expectedResults);
        break;
      case 'Biology':
        scoring = scoringService.scoreBiologyLab(labResult.toObject(), expectedResults);
        break;
      default:
        scoring = scoringService.scoreLabResult(labResult.toObject(), expectedResults);
    }

    // Update scoring in database
    labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      {
        'scoring.totalScore': scoring.totalScore,
        'scoring.accuracy': scoring.accuracyScore,
        'scoring.procedureFollowed': procedureFollowed || 0,
        'scoring.dataQuality': scoring.dataQualityScore,
        'scoring.reportQuality': scoring.reportScore,
        'scoring.grade': scoring.grade,
        'scoring.feedback': feedback || scoring.feedback,
        status: 'graded',
        gradedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, data: labResult, scoring });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate lab report
exports.generateLabReport = async (req, res) => {
  try {
    const labResult = await LabResult.findById(req.params.id).populate('labId');
    if (!labResult) {
      return res.status(404).json({ message: 'Lab result not found' });
    }

    const lab = labResult.labId;
    const htmlContent = reportService.generateHTMLReport(labResult.toObject(), lab.toObject());
    const summary = reportService.generateReportSummary(labResult.toObject(), lab.toObject());

    // Save report content
    labResult.report = {
      htmlContent,
      generatedAt: new Date()
    };
    await labResult.save();

    res.json({
      success: true,
      html: htmlContent,
      summary,
      message: 'Report generated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get lab statistics for a user
exports.getUserLabStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await LabResult.find({ userId });
    
    const statistics = scoringService.calculateStatistics(results);
    
    res.json({
      success: true,
      statistics,
      totalLabs: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get statistics by subject
exports.getSubjectStatistics = async (req, res) => {
  try {
    const { userId, subject } = req.params;
    const results = await LabResult.find({ userId, subject });
    
    const statistics = scoringService.calculateStatistics(results);
    
    res.json({
      success: true,
      subject,
      statistics,
      totalLabs: results.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete lab session
exports.deleteLab = async (req, res) => {
  try {
    await LabResult.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lab session deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate titration data
exports.validateTitration = async (req, res) => {
  try {
    const { titreVolume, titrantConcentration, analyteVolume, analyteConcentration, expectedMolarity } = req.body;

    // Validate inputs
    if (!titreVolume || !titrantConcentration || !analyteVolume) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required titration parameters' 
      });
    }

    // Validate titre
    const titreValidation = titrationService.validateTitre(titreVolume);

    // Calculate molarity
    const molarityResult = titrationService.calculateMolarity(
      titrantConcentration,
      titreVolume,
      analyteVolume,
      1 // Standard 1:1 stoichiometry for HCl:NaOH
    );

    // Calculate percentage error if expected value provided
    let percentError = null;
    if (expectedMolarity) {
      percentError = titrationService.calculatePercentageError(
        molarityResult.molarity,
        expectedMolarity
      );
    }

    res.json({
      success: true,
      validation: titreValidation,
      calculations: {
        molarity: molarityResult.molarity,
        moles: molarityResult.moles
      },
      percentError,
      feedback: titrationService.generateTitrationFeedback(
        molarityResult.molarity,
        expectedMolarity || molarityResult.molarity,
        titreVolume
      )
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
