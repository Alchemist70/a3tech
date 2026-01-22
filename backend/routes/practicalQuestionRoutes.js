/**
 * Practical Questions Route
 * Handles retrieval of titration practical questions from the database
 * 
 * Endpoints:
 * GET /api/practical-questions - Get all questions
 * GET /api/practical-questions/titration - Get all titration questions
 * GET /api/practical-questions/:id - Get specific question by ID
 */

const express = require('express');
const router = express.Router();
const PracticalQuestion = require('../models/PracticalQuestion');

/**
 * GET /api/practical-questions
 * Get all practical questions with filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      practical_type,
      difficulty_level,
      mode,
      tag,
      limit = 10,
      skip = 0
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (practical_type) {
      filter.practical_type = practical_type;
    }
    if (difficulty_level) {
      filter.difficulty_level = difficulty_level;
    }
    if (mode) {
      filter.mode = { $in: [mode, 'both'] }; // Include 'both' mode
    }
    if (tag) {
      filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    }

    // Query database
    const questions = await PracticalQuestion.find(filter)
      .select('-__v -sub_questions.$.marks')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Get total count
    const total = await PracticalQuestion.countDocuments(filter);

    res.json({
      success: true,
      count: questions.length,
      total,
      data: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving questions',
      message: error.message
    });
  }
});

/**
 * GET /api/practical-questions/titration
 * Get all titration questions with optional filters
 */
router.get('/titration', async (req, res) => {
  try {
    const {
      difficulty_level,
      titration_type,
      mode,
      tag,
      limit = 10,
      skip = 0
    } = req.query;

    // Build filter
    const filter = { practical_type: 'titration' };
    
    if (difficulty_level) {
      filter.difficulty_level = difficulty_level;
    }
    if (titration_type) {
      filter.titration_type = titration_type;
    }
    if (mode) {
      filter.mode = { $in: [mode, 'both'] };
    }
    if (tag) {
      filter.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    }

    // Query
    const questions = await PracticalQuestion.find(filter)
      .select('-__v')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await PracticalQuestion.countDocuments(filter);

    res.json({
      success: true,
      count: questions.length,
      total,
      type: 'titration',
      data: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving titration questions',
      message: error.message
    });
  }
});

/**
 * GET /api/practical-questions/:id
 * Get a specific question by question_id
 */
router.get('/:id', async (req, res) => {
  try {
    const question = await PracticalQuestion.findOne({
      question_id: req.params.id
    }).lean();

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving question',
      message: error.message
    });
  }
});

/**
 * GET /api/practical-questions/stats/summary
 * Get statistics about available questions
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await PracticalQuestion.countDocuments();
    
    const byType = await PracticalQuestion.aggregate([
      { $group: { _id: '$practical_type', count: { $sum: 1 } } }
    ]);

    const byDifficulty = await PracticalQuestion.aggregate([
      { $group: { _id: '$difficulty_level', count: { $sum: 1 } } }
    ]);

    const byMode = await PracticalQuestion.aggregate([
      { $group: { _id: '$mode', count: { $sum: 1 } } }
    ]);

    const allTags = await PracticalQuestion.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      total,
      byType,
      byDifficulty,
      byMode,
      allTags
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/practical-questions/random/:count
 * Get random questions (for practice)
 */
router.get('/random/:count', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 5, 20); // Max 20
    const mode = req.query.mode || 'practice';

    const filter = {
      mode: { $in: [mode, 'both'] }
    };

    const questions = await PracticalQuestion.aggregate([
      { $match: filter },
      { $sample: { size: count } }
    ]);

    res.json({
      success: true,
      count: questions.length,
      data: questions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving random questions',
      message: error.message
    });
  }
});

module.exports = router;
