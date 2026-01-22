/**
 * Practical Question Grading Routes
 * Endpoints for grading student answers
 */

const express = require('express');
const router = express.Router();
const {
  gradeAnswers,
  getGradingStats
} = require('../controllers/practicalQuestionGradingController');

/**
 * POST /api/grade-practical-questions
 * Grade student answers against marking scheme
 * 
 * Request body:
 * {
 *   question_id: 'WAEC-TITRATION-001',
 *   student_answers: {
 *     'a': 'student answer text',
 *     'b': 'another answer',
 *     'c': 'third answer'
 *   }
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     question_id: 'WAEC-TITRATION-001',
 *     total_marks: 9,
 *     marks_obtained: 7,
 *     percentage: 78,
 *     feedback: {...},
 *     sub_question_results: [...],
 *     correct_answers: [...],
 *     marking_scheme: {...}
 *   }
 * }
 */
router.post('/', async (req, res) => {
  await gradeAnswers(req, res);
});

/**
 * GET /api/grade-practical-questions/stats/:student_id
 * Get grading statistics for a student
 * (Future implementation)
 */
router.get('/stats/:student_id', async (req, res) => {
  await getGradingStats(req, res);
});

module.exports = router;
