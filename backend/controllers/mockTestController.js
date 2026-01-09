const MockTest = require('../models/MockTest');
const JambQuestion = require('../models/JambQuestion');
const WaecQuestion = require('../models/WaecQuestion');
const User = require('../models/User');

// Generate an exam ID with a single-letter prefix ('J' or 'W') followed by alphanumeric chars to total 12
const generateExamId = (prefix) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  // prefix should be single char like 'J' or 'W'
  if (prefix && typeof prefix === 'string') {
    result = prefix.toUpperCase();
  }
  const remaining = 12 - result.length;
  for (let i = 0; i < remaining; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if user can attempt mock test (once per week)
const canAttemptTest = async (userId, examType) => {
  try {
    const lastTest = await MockTest.findOne({
      userId,
      examType,
      status: { $in: ['submitted', 'completed'] },
    }).sort({ lastAttemptDate: -1 });

    if (!lastTest || !lastTest.lastAttemptDate) {
      return { canAttempt: true, nextAttemptDate: null };
    }

    const now = new Date();
    const nextAttemptDate = new Date(lastTest.lastAttemptDate);
    nextAttemptDate.setDate(nextAttemptDate.getDate() + 7); // 7 days later

    if (now < nextAttemptDate) {
      return { canAttempt: false, nextAttemptDate };
    }

    return { canAttempt: true, nextAttemptDate: null };
  } catch (error) {
    console.error('Error checking test attempt:', error);
    throw error;
  }
};

// Initialize a new mock test
const initializeMockTest = async (req, res) => {
  try {
    const { examType } = req.body;
    const userId = req.user.id || req.user._id;

    // Bypass attempt limit for specific user email (unlimited attempts)
    // Fetch user to check email. This keeps behavior unchanged for other users.
    let bypassAttemptLimit = false;
    try {
      const user = await User.findById(userId).select('email');
      if (user && typeof user.email === 'string' && user.email.toLowerCase() === 'akanniabdulhadi70@gmail.com') {
        bypassAttemptLimit = true;
      }
    } catch (e) {
      // If user fetch fails, proceed with normal checks below
      console.warn('Could not verify user email for attempt bypass', e && e.message ? e.message : e);
    }

    // Check if user can attempt (unless bypassed for specific user)
    if (!bypassAttemptLimit) {
      const { canAttempt, nextAttemptDate } = await canAttemptTest(userId, examType);
      if (!canAttempt) {
        return res.status(429).json({
          message: 'You can only attempt this test once per week',
          nextAttemptDate,
        });
      }
    }

    // Create new mock test record
    const mockTest = new MockTest({
      userId,
      examType,
      status: 'draft',
    });

    await mockTest.save();

    // Also return the user's last subject combination change info (if any)
    // Filter by examType to keep JAMB and WAEC separate
    const lastChanged = await MockTest.findOne({ userId, examType, subjectCombinationChangedDate: { $exists: true } }).sort({ subjectCombinationChangedDate: -1 });

    res.status(201).json({
      mockTestId: mockTest._id,
      message: 'Mock test initialized',
      lastSubjectCombination: lastChanged ? lastChanged.subjectCombination : null,
      lastSubjectCombinationChangedDate: lastChanged ? lastChanged.subjectCombinationChangedDate : null,
    });
  } catch (error) {
    console.error('Error initializing mock test:', error);
    res.status(500).json({ message: 'Error initializing mock test', error: error.message });
  }
};

// Update subject combination for both JAMB and WAEC
const updateJambSubjectCombination = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { subjects } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Validate based on exam type
    if (mockTest.examType === 'JAMB') {
      // JAMB validation: exactly 4 subjects (English + 3 others)
      if (!subjects || subjects.length !== 4) {
        return res.status(400).json({ message: 'Must select exactly 4 subjects (English + 3 others)' });
      }
      if (!subjects.includes('Use of English')) {
        return res.status(400).json({ message: 'Use of English is compulsory' });
      }
    } else if (mockTest.examType === 'WAEC') {
      // WAEC validation: 7-9 subjects (English Language + Mathematics + 5-7 others)
      if (!subjects || subjects.length < 7 || subjects.length > 9) {
        return res.status(400).json({ message: 'Please select between 7 and 9 subjects (English Language + Mathematics compulsory)' });
      }
      if (!subjects.includes('English Language')) {
        return res.status(400).json({ message: 'English Language is compulsory' });
      }
      if (!subjects.includes('Mathematics')) {
        return res.status(400).json({ message: 'Mathematics is compulsory' });
      }
    }

    // Check if subject combination has been changed in the last 8 months (per-exam-type)
    // But only if the user is trying to CHANGE to a DIFFERENT combination
    // Reusing the same locked combination should be allowed
    const lastChanged = await MockTest.findOne({ userId, examType: mockTest.examType, subjectCombinationChangedDate: { $exists: true } }).sort({ subjectCombinationChangedDate: -1 });
    if (lastChanged && lastChanged.subjectCombinationChangedDate) {
      // Check if the new subjects are different from the last saved combination
      const isSameCombination = lastChanged.subjectCombination && 
        Array.isArray(lastChanged.subjectCombination) && 
        lastChanged.subjectCombination.length === subjects.length &&
        lastChanged.subjectCombination.every(s => subjects.includes(s));

      // Only enforce the 8-month lock if they're trying to change to a DIFFERENT combination
      if (!isSameCombination) {
        const now = new Date();
        const lastChangeDate = new Date(lastChanged.subjectCombinationChangedDate);
        const monthsDiff = (now.getFullYear() - lastChangeDate.getFullYear()) * 12 + (now.getMonth() - lastChangeDate.getMonth());

        if (monthsDiff < 8) {
          const nextChange = new Date(lastChangeDate);
          nextChange.setMonth(nextChange.getMonth() + 8);
          return res.status(429).json({
            message: 'Subject combination can only be changed once every 8 months',
            nextChangeDate: nextChange,
          });
        }
      }
    }

    // Only update the changedDate if we're actually changing the combination
    mockTest.subjectCombination = subjects;
    const lastChanged2 = await MockTest.findOne({ userId, examType: mockTest.examType, subjectCombinationChangedDate: { $exists: true } }).sort({ subjectCombinationChangedDate: -1 });
    const isSameCombination2 = lastChanged2 && lastChanged2.subjectCombination && 
      Array.isArray(lastChanged2.subjectCombination) && 
      lastChanged2.subjectCombination.length === subjects.length &&
      lastChanged2.subjectCombination.every(s => subjects.includes(s));
    
    // Only set a new changedDate if this is a new/different combination
    if (!isSameCombination2) {
      mockTest.subjectCombinationChangedDate = new Date();
    }
    await mockTest.save();

    res.json({ message: 'Subject combination updated', mockTest });
  } catch (error) {
    console.error('Error updating subject combination:', error);
    res.status(500).json({ message: 'Error updating subject combination', error: error.message });
  }
};

// Generate exam ID
const generateExamID = async (req, res) => {
  try {
    const { mockTestId } = req.params;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Ensure exam IDs are prefixed so they can be distinguished by exam type
    const prefix = mockTest.examType === 'JAMB' ? 'J' : 'W';
    const examId = generateExamId(prefix);
    mockTest.examId = examId;
    await mockTest.save();

    res.json({ examId, message: 'Exam ID generated successfully' });
  } catch (error) {
    console.error('Error generating exam ID:', error);
    res.status(500).json({ message: 'Error generating exam ID', error: error.message });
  }
};

// Get mock test questions based on exam type and subject
const getMockTestQuestions = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { subject } = req.query;

    const mockTest = await MockTest.findById(mockTestId).populate('userId');
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    let questionModel = mockTest.examType === 'JAMB' ? JambQuestion : WaecQuestion;
    const questions = await questionModel.find({ subject, isActive: true });

    // Shuffle questions
    const shuffled = questions.sort(() => 0.5 - Math.random());

    // Get question count based on subject
    const questionCount = subject === 'Use of English' ? 60 : 40;
    const limitedQuestions = shuffled.slice(0, questionCount);

    res.json({ questions: limitedQuestions, totalQuestions: limitedQuestions.length });
  } catch (error) {
    console.error('Error fetching mock test questions:', error);
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
};

// Save answer response
const saveAnswerResponse = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { questionId, answer, isBookmarked } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find or create response
    const existingResponse = mockTest.responses.find((r) => r.questionId.toString() === questionId);

    if (existingResponse) {
      existingResponse.selectedAnswer = answer;
      existingResponse.isBookmarked = isBookmarked;
    } else {
      mockTest.responses.push({
        questionId,
        selectedAnswer: answer,
        isBookmarked,
      });
    }

    await mockTest.save();
    res.json({ message: 'Answer saved successfully' });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'Error saving answer', error: error.message });
  }
};

// Submit mock test
const submitMockTest = async (req, res) => {
  try {
    const { mockTestId } = req.params;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Calculate score
    let score = 0;
    let questionModel = mockTest.examType === 'JAMB' ? JambQuestion : WaecQuestion;

    for (const response of mockTest.responses) {
      const question = await questionModel.findById(response.questionId);
      if (question && response.selectedAnswer === question.correctAnswer) {
        score++;
      }
    }

    // Store score and submission time
    mockTest.score = score;
    mockTest.submittedAt = new Date();
    
    // Store performance data for later retrieval
    mockTest.performanceData = {
      correctCount: score,
      totalCount: mockTest.responses.length,
      bySubject: {}
    };

    // Calculate performance by subject (normalize subject to a string label)
    for (const response of mockTest.responses) {
      const question = await questionModel.findById(response.questionId);
      if (question) {
        // Normalize subject name: if populated object with name, use it; else stringify
        let subjectName = 'Unknown';
        if (question.subject) {
          if (typeof question.subject === 'string') {
            subjectName = question.subject;
          } else if (typeof question.subject === 'object') {
            subjectName = question.subject.name || question.subject.title || String(question.subject);
          } else {
            subjectName = String(question.subject);
          }
        }

        if (!mockTest.performanceData.bySubject[subjectName]) {
          mockTest.performanceData.bySubject[subjectName] = { correct: 0, total: 0 };
        }
        mockTest.performanceData.bySubject[subjectName].total++;
        if (response.selectedAnswer === question.correctAnswer) {
          mockTest.performanceData.bySubject[subjectName].correct++;
        }
      }
    }

    mockTest.status = 'submitted';
    mockTest.endTime = new Date();
    mockTest.lastAttemptDate = new Date();
    mockTest.nextAttemptDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await mockTest.save();

    res.json({
      message: 'Test submitted successfully',
      score,
      totalQuestions: mockTest.responses.length,
      examId: mockTest.examId,
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ message: 'Error submitting test', error: error.message });
  }
};

// Get mock test status
const getMockTestStatus = async (req, res) => {
  try {
    const { mockTestId } = req.params;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      status: mockTest.status,
      examType: mockTest.examType,
      subjectCombination: mockTest.subjectCombination,
      currentSubject: mockTest.currentSubject,
      completedSubjects: mockTest.completedSubjects,
      score: mockTest.score,
      examId: mockTest.examId,
    });
  } catch (error) {
    console.error('Error fetching test status:', error);
    res.status(500).json({ message: 'Error fetching test status', error: error.message });
  }
};

// Update current subject
const updateCurrentSubject = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { subject } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if user is trying to switch to a completed subject
    if (mockTest.completedSubjects.includes(subject)) {
      return res.status(400).json({ message: 'Cannot go back to a completed subject' });
    }

    mockTest.currentSubject = subject;
    await mockTest.save();

    res.json({ message: 'Current subject updated' });
  } catch (error) {
    console.error('Error updating current subject:', error);
    res.status(500).json({ message: 'Error updating current subject', error: error.message });
  }
};

// Mark subject as completed
const completeSubject = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { subject } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!mockTest.completedSubjects.includes(subject)) {
      mockTest.completedSubjects.push(subject);
    }

    await mockTest.save();

    res.json({ message: 'Subject marked as completed', completedSubjects: mockTest.completedSubjects });
  } catch (error) {
    console.error('Error completing subject:', error);
    res.status(500).json({ message: 'Error completing subject', error: error.message });
  }
};

// Record a fullscreen or exam violation for a mock test (best-effort logging)
const recordViolation = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { sessionId, count, note } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    mockTest.violations = mockTest.violations || [];
    const violation = {
      timestamp: new Date(),
      userId,
      sessionId: sessionId || null,
      count: typeof count === 'number' ? count : undefined,
      note: note || undefined,
    };
    mockTest.violations.push(violation);
    await mockTest.save();

    // Try to notify proctor via email and WebSocket (best-effort, non-blocking)
    const io = req.app.get('io');
    notifyProctorOfViolation(mockTest, violation, req.user, io).catch(err => {
      console.error('Non-critical: Failed to notify proctor of violation:', err.message);
    });

    res.json({ message: 'Violation recorded', violations: mockTest.violations });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({ message: 'Error recording violation', error: error.message });
  }
};

// Helper function to notify proctor of violation (email + WebSocket)
const notifyProctorOfViolation = async (mockTest, violation, user, io) => {
  const nodemailer = require('nodemailer');

  const violationNumber = (mockTest.violations || []).length;
  const examType = mockTest.examType || 'Unknown';
  const userName = user.name || user.email || 'Unknown Student';

  // Email notification
  if (process.env.PROCTOR_EMAIL && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.PROCTOR_EMAIL,
        subject: `Exam Violation Alert - ${examType} (${userName})`,
        html: `
          <h2>Exam Violation Recorded</h2>
          <p><strong>Student:</strong> ${userName}</p>
          <p><strong>Exam Type:</strong> ${examType}</p>
          <p><strong>Exam ID:</strong> ${mockTest.examId}</p>
          <p><strong>Violation Number:</strong> ${violationNumber}</p>
          <p><strong>Violation Type:</strong> ${violation.note || 'Fullscreen exit'}</p>
          <p><strong>Time:</strong> ${new Date(violation.timestamp).toLocaleString()}</p>
          <p>Please review this violation in the admin panel.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send proctor email notification:', emailErr.message);
    }
  }

  // WebSocket notification to connected admin/proctor clients
  if (io) {
    try {
      io.emit('exam:violation', {
        mockTestId: mockTest._id,
        examId: mockTest.examId,
        examType,
        userName,
        violationNumber,
        violationType: violation.note || 'Fullscreen exit',
        timestamp: new Date(violation.timestamp),
      });
    } catch (wsErr) {
      console.error('Failed to emit WebSocket violation notification:', wsErr.message);
    }
  }
};


// Request a proctor unlock for a locked/auto-submitted exam
const requestUnlock = async (req, res) => {
  try {
    const { mockTestId } = req.params;
    const { sessionId, note } = req.body;

    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ message: 'Mock test not found' });
    }

    const userId = req.user.id || req.user._id;
    if (mockTest.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    mockTest.unlockRequests = mockTest.unlockRequests || [];
    const reqObj = {
      timestamp: new Date(),
      userId,
      sessionId: sessionId || null,
      status: 'pending',
      note: note || undefined,
    };
    mockTest.unlockRequests.push(reqObj);
    await mockTest.save();

    // Notify proctor / admin via email/websocket (best-effort, non-blocking)
    const io = req.app.get('io');
    notifyProctorOfUnlockRequest(mockTest, reqObj, req.user, io).catch(err => {
      console.error('Non-critical: Failed to notify proctor of unlock request:', err.message);
    });

    res.json({ message: 'Unlock request recorded', unlockRequest: reqObj });
  } catch (error) {
    console.error('Error requesting unlock:', error);
    res.status(500).json({ message: 'Error requesting unlock', error: error.message });
  }
};

// Helper function to notify proctor of unlock request (email + WebSocket)
const notifyProctorOfUnlockRequest = async (mockTest, unlockRequest, user, io) => {
  const nodemailer = require('nodemailer');

  const examType = mockTest.examType || 'Unknown';
  const userName = user.name || user.email || 'Unknown Student';

  // Email notification
  if (process.env.PROCTOR_EMAIL && process.env.SMTP_HOST) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.PROCTOR_EMAIL,
        subject: `Unlock Request - ${examType} (${userName})`,
        html: `
          <h2>Student Unlock Request</h2>
          <p><strong>Student:</strong> ${userName}</p>
          <p><strong>Exam Type:</strong> ${examType}</p>
          <p><strong>Exam ID:</strong> ${mockTest.examId}</p>
          <p><strong>Request Reason:</strong> ${unlockRequest.note || 'Exam was auto-submitted due to violations'}</p>
          <p><strong>Time:</strong> ${new Date(unlockRequest.timestamp).toLocaleString()}</p>
          <p>Please review and respond to this unlock request in the admin panel.</p>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send proctor unlock email notification:', emailErr.message);
    }
  }

  // WebSocket notification to connected admin/proctor clients
  if (io) {
    try {
      io.emit('exam:unlock-request', {
        mockTestId: mockTest._id,
        examId: mockTest.examId,
        examType,
        userName,
        requestReason: unlockRequest.note || 'Auto-submitted due to violations',
        timestamp: new Date(unlockRequest.timestamp),
      });
    } catch (wsErr) {
      console.error('Failed to emit WebSocket unlock request notification:', wsErr.message);
    }
  }
};

// Get last attempt info and countdown
const getLastAttemptInfo = async (req, res) => {
  try {
    const { examType } = req.query;
    const userId = req.user.id || req.user._id;

    // Allow bypass for the special user email
    try {
      const user = await User.findById(userId).select('email');
      if (user && typeof user.email === 'string' && user.email.toLowerCase() === 'akanniabdulhadi70@gmail.com') {
        return res.json({ canAttempt: true, nextAttemptDate: null, timeUntilNextAttempt: null });
      }
    } catch (e) {
      console.warn('Could not verify user email for attempt bypass', e && e.message ? e.message : e);
    }

    const { canAttempt, nextAttemptDate } = await canAttemptTest(userId, examType);

    res.json({
      canAttempt,
      nextAttemptDate,
      timeUntilNextAttempt: nextAttemptDate ? Math.ceil((nextAttemptDate - new Date()) / 1000) : null,
    });
  } catch (error) {
    console.error('Error fetching attempt info:', error);
    res.status(500).json({ message: 'Error fetching attempt info', error: error.message });
  }
};

// Check results using exam ID
const checkResults = async (req, res) => {
  try {
    const { examId } = req.params;
    
    if (!examId || examId.trim().length === 0) {
      return res.status(400).json({ message: 'Exam ID is required' });
    }

    const mockTest = await MockTest.findOne({ examId });
    
    if (!mockTest) {
      return res.status(404).json({ message: 'Exam ID not found' });
    }

    // Ensure the examId prefix matches the recorded exam type (J => JAMB, W => WAEC)
    const prefix = (examId && examId.length > 0) ? examId[0].toUpperCase() : null;
    if (!prefix || (prefix !== 'J' && prefix !== 'W')) {
      return res.status(400).json({ message: 'Invalid Exam ID format. ID must begin with J or W.' });
    }

    if ((prefix === 'J' && mockTest.examType !== 'JAMB') || (prefix === 'W' && mockTest.examType !== 'WAEC')) {
      return res.status(400).json({ message: 'Exam ID does not match exam type.' });
    }

    // Check if results are ready (available after 1 hour of submission)
    if (mockTest.status !== 'submitted' && mockTest.status !== 'completed') {
      return res.status(400).json({ message: 'Test not yet submitted', status: 'not_ready' });
    }

    const now = new Date();
    const submittedTime = new Date(mockTest.submittedAt || mockTest.endTime || mockTest.completedAt || mockTest.lastAttemptDate);
    if (!submittedTime || !isFinite(submittedTime.getTime())) {
      // If we cannot determine a valid submission time, do not expose results yet
      return res.status(200).json({ message: 'Results not yet available', status: 'not_ready', examId: mockTest.examId });
    }

    const hoursPassed = (now - submittedTime) / (1000 * 60 * 60);

    if (hoursPassed < 1) {
      return res.status(200).json({ 
        message: 'Results not yet available',
        status: 'not_ready',
        examId: mockTest.examId
      });
    }

    // Calculate performance
    const totalQuestions = mockTest.responses && Array.isArray(mockTest.responses) ? mockTest.responses.length : (mockTest.performanceData && mockTest.performanceData.totalCount) || 0;
    let correctAnswers = mockTest.score || (mockTest.performanceData && mockTest.performanceData.correctCount) || 0;
    let performanceArray = [];

    // Use pre-calculated performance data if available
    if (mockTest.performanceData && mockTest.performanceData.bySubject && Object.keys(mockTest.performanceData.bySubject).length > 0) {
      // Filter out Mongoose schema properties and only include valid subject data
      performanceArray = Object.entries(mockTest.performanceData.bySubject)
        .filter(([key, value]) => {
          // Exclude Mongoose internals: keys starting with $ or _
          if (key.startsWith('$') || key.startsWith('_')) return false;
          // Exclude non-objects or objects without the correct structure
          if (!value || typeof value !== 'object' || value.total === undefined) return false;
          return true;
        })
        .map(([subject, data]) => ({
          subject: typeof subject === 'string' ? subject : (data && data.name) || String(subject),
          score: data.correct || 0,
          totalQuestions: data.total,
        }));
    }
    
    // If we still don't have performance data, rebuild from responses (always as fallback)
    if ((!performanceArray || performanceArray.length === 0) && mockTest.responses && Array.isArray(mockTest.responses) && mockTest.responses.length > 0) {
      const questionModel = mockTest.examType === 'JAMB' ? JambQuestion : WaecQuestion;
      const perf = {};
      for (const response of mockTest.responses) {
        try {
          const q = await questionModel.findById(response.questionId).select('subject');
          let subjectName = 'Unknown';
          if (q && q.subject) {
            if (typeof q.subject === 'string') subjectName = q.subject;
            else if (typeof q.subject === 'object') subjectName = q.subject.name || q.subject.title || String(q.subject);
            else subjectName = String(q.subject);
          } else if (response.subject) {
            subjectName = response.subject;
          }

          if (!perf[subjectName]) perf[subjectName] = { correct: 0, total: 0 };
          perf[subjectName].total++;
          // Attempt to determine correctness: prefer explicit isCorrect, otherwise compare selectedAnswer with question.correctAnswer
          if (response.isCorrect) {
            perf[subjectName].correct++;
          } else {
            try {
              const q2 = await questionModel.findById(response.questionId).select('correctAnswer');
              if (q2 && response.selectedAnswer === q2.correctAnswer) perf[subjectName].correct++;
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // best-effort; skip problematic entries
          console.warn('Error rebuilding per-subject performance for response', e && e.message ? e.message : e);
        }
      }
      performanceArray = Object.entries(perf).map(([subject, data]) => ({
        subject,
        score: data.correct,
        totalQuestions: data.total,
      }));
    } else if ((!performanceArray || performanceArray.length === 0)) {
      // Fallback: build from responses (older tests)
      const performanceBySubject = {};
      if (mockTest.responses && Array.isArray(mockTest.responses)) {
        for (const response of mockTest.responses) {
          const subject = response.subject || 'Unknown';
          if (!performanceBySubject[subject]) {
            performanceBySubject[subject] = { correct: 0, total: 0 };
          }
          performanceBySubject[subject].total++;
          if (response.isCorrect) {
            performanceBySubject[subject].correct++;
          }
        }
      }
      performanceArray = Object.entries(performanceBySubject).map(([subject, data]) => ({
        subject,
        score: data.correct,
        totalQuestions: data.total,
      }));
    }

    // Fetch user name for the response
    let userName = 'Candidate';
    try {
      const user = await User.findById(mockTest.userId).select('name');
      if (user && user.name) userName = user.name;
    } catch (e) {
      console.warn('Could not fetch user name for results', e && e.message ? e.message : e);
    }

    // Use most reliable score/total sources
    const finalTotalQuestions = (mockTest.performanceData && mockTest.performanceData.totalCount) || totalQuestions || 0;
    const finalCorrectAnswers = (mockTest.performanceData && mockTest.performanceData.correctCount !== undefined) ? mockTest.performanceData.correctCount : correctAnswers;

    res.json({
      status: 'ready',
      examId: mockTest.examId,
      examType: mockTest.examType,
      candidateName: userName,
      score: finalCorrectAnswers,
      totalQuestions: finalTotalQuestions,
      percentage: finalTotalQuestions > 0 ? (finalCorrectAnswers / finalTotalQuestions) * 100 : 0,
      subjectCombination: mockTest.subjectCombination,
      performanceBySubject: performanceArray,
      submittedAt: mockTest.submittedAt || mockTest.endTime,
    });
  } catch (error) {
    console.error('Error checking results:', error);
    res.status(500).json({ message: 'Error checking results', error: error.message });
  }
};

module.exports = {
  initializeMockTest,
  updateJambSubjectCombination,
  generateExamID,
  getMockTestQuestions,
  saveAnswerResponse,
  submitMockTest,
  getMockTestStatus,
  updateCurrentSubject,
  completeSubject,
  getLastAttemptInfo,
  canAttemptTest,
  checkResults,
  recordViolation,
  requestUnlock,
};
