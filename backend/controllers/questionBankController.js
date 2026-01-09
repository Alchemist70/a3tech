const JambQuestion = require('../models/JambQuestion');
const WaecQuestion = require('../models/WaecQuestion');

// Add JAMB Question
const addJambQuestion = async (req, res) => {
  try {
    const { subject, questionText, options, correctAnswer, explanation, difficulty, tables, charts, images } = req.body;

    // Validate input
    if (!subject || !questionText || !options || !correctAnswer) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (options.length !== 4) {
      return res.status(400).json({ message: 'Must provide exactly 4 options' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ message: 'Correct answer must be A, B, C, or D' });
    }

    const question = new JambQuestion({
      subject,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      tables: tables || [],
      charts: charts || [],
      images: images || [],
      isActive: true,
    });

    await question.save();
    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    console.error('Error adding JAMB question:', error);
    res.status(500).json({ message: 'Error adding question', error: error.message });
  }
};

// Add WAEC Question
const addWaecQuestion = async (req, res) => {
  try {
    const { subject, questionText, options, correctAnswer, explanation, difficulty, tables, charts, images } = req.body;

    // Validate input
    if (!subject || !questionText || !options || !correctAnswer) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (options.length !== 4) {
      return res.status(400).json({ message: 'Must provide exactly 4 options' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      return res.status(400).json({ message: 'Correct answer must be A, B, C, or D' });
    }

    const question = new WaecQuestion({
      subject,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
      tables: tables || [],
      charts: charts || [],
      images: images || [],
      isActive: true,
    });

    await question.save();
    res.status(201).json({ message: 'Question added successfully', question });
  } catch (error) {
    console.error('Error adding WAEC question:', error);
    res.status(500).json({ message: 'Error adding question', error: error.message });
  }
};

// Get all JAMB Questions (for admin)
const getAllJambQuestions = async (req, res) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (subject) {
      filter.subject = subject;
    }

    const questions = await JambQuestion.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await JambQuestion.countDocuments(filter);

    res.json({
      questions,
      totalQuestions: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching JAMB questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
};

// Get all WAEC Questions (for admin)
const getAllWaecQuestions = async (req, res) => {
  try {
    const { subject, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (subject) {
      filter.subject = subject;
    }

    const questions = await WaecQuestion.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await WaecQuestion.countDocuments(filter);

    res.json({
      questions,
      totalQuestions: total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching WAEC questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
};

// Update JAMB Question
const updateJambQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, questionText, options, correctAnswer, explanation, difficulty, isActive, tables, charts, images } = req.body;

    const question = await JambQuestion.findByIdAndUpdate(
      id,
      {
        subject,
        questionText,
        options,
        correctAnswer,
        explanation,
        difficulty,
        isActive,
        tables: tables || [],
        charts: charts || [],
        images: images || [],
      },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Error updating JAMB question:', error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
};

// Update WAEC Question
const updateWaecQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, questionText, options, correctAnswer, explanation, difficulty, isActive, tables, charts, images } = req.body;

    const question = await WaecQuestion.findByIdAndUpdate(
      id,
      {
        subject,
        questionText,
        options,
        correctAnswer,
        explanation,
        difficulty,
        isActive,
        tables: tables || [],
        charts: charts || [],
        images: images || [],
      },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Error updating WAEC question:', error);
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
};

// Delete JAMB Question
const deleteJambQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await JambQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting JAMB question:', error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
};

// Delete WAEC Question
const deleteWaecQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await WaecQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting WAEC question:', error);
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
};

// Get JAMB subjects for dropdown
const getJambSubjects = async (req, res) => {
  try {
    const subjects = await JambQuestion.distinct('subject');
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching JAMB subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
};

// Get WAEC subjects for dropdown
const getWaecSubjects = async (req, res) => {
  try {
    const subjects = await WaecQuestion.distinct('subject');
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching WAEC subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
};

module.exports = {
  addJambQuestion,
  addWaecQuestion,
  getAllJambQuestions,
  getAllWaecQuestions,
  updateJambQuestion,
  updateWaecQuestion,
  deleteJambQuestion,
  deleteWaecQuestion,
  getJambSubjects,
  getWaecSubjects,
};
