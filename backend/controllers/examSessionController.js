const ExamSession = require('../models/ExamSession');
const User = require('../models/User');
const MockTest = require('../models/MockTest');
const crypto = require('crypto');

// Generate unique session ID
const generateSessionId = () => {
  return 'SESS_' + crypto.randomBytes(16).toString('hex');
};

// Calculate IP address risk
const evaluateIpChange = (previousIp, currentIp) => {
  if (!previousIp || !currentIp) return 0;
  if (previousIp === currentIp) return 0;
  
  // Check if IPs are from same range (first 3 octets)
  const prevOctets = previousIp.split('.').slice(0, 3).join('.');
  const currOctets = currentIp.split('.').slice(0, 3).join('.');
  
  if (prevOctets !== currOctets) {
    return 25; // Different subnet = higher risk
  }
  return 5; // Same subnet, minor risk
};

// Calculate risk score
const calculateRiskScore = (session) => {
  let score = 0;

  // Tab switches (each = 10 points)
  score += Math.min(session.proctoring.tabSwitchAttempts * 10, 30);

  // Window blur events (each = 5 points)
  score += Math.min(session.proctoring.windowBlurEvents * 5, 25);

  // Face detection issues (each = 15 points)
  score += Math.min(session.proctoring.webcamInterruptions * 15, 40);

  // Suspicious network requests (each = 20 points)
  score += Math.min(session.proctoring.suspiciousRequestsBlocked * 20, 35);

  // Developer tools attempts (each = 25 points)
  score += Math.min(session.proctoring.developerToolsAttempts * 25, 50);

  // Violations count (each = 5 points)
  score += Math.min(session.violations.length * 5, 20);

  // IP changes (each = 15 points)
  score += Math.min((session.ipChanges?.length || 0) * 15, 30);

  // Not using lockdown browser (30 points)
  if (!session.proctoring.isLockdownBrowser && !session.proctoring.isRespondusMonitor) {
    score += 30;
  }

  return Math.min(Math.round(score), 100);
};

// Build a richer .seb (plist) configuration for a session
function buildSebXml(examSession, options = {}) {
  // Allow overriding public host via options or env var so SEB can fetch the .seb
  const envHost = process.env.SEB_PUBLIC_HOST;
  const host = options.host || envHost || 'localhost';
  const protocol = options.protocol || 'https';
  const startUrl = `${protocol}://${host}/mock-test/${examSession.mockTestId}/start?sessionId=${encodeURIComponent(examSession.sessionId)}`;

  // Allowed hosts (strip to hostname)
  const allowedHost = host.replace(/^https?:\/\//, '').replace(/:\d+$/, '');

  // Default richer template: includes AllowedHosts, QuitURL, BrowserWindow settings
  const quitUrl = `${protocol}://${host}/mock-test/${examSession.mockTestId}/ended?sessionId=${encodeURIComponent(examSession.sessionId)}`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n  <key>org_safeexambrowser</key>\n  <dict>\n    <key>StartURL</key>\n    <string>${startUrl}</string>\n    <key>LockDown</key>\n    <true/>\n    <key>AllowedHosts</key>\n    <array>\n      <string>${allowedHost}</string>\n    </array>\n    <key>QuitURL</key>\n    <string>${quitUrl}</string>\n    <key>BrowserWindow</key>\n    <dict>\n      <key>ViewMode</key>\n      <string>fullscreen</string>\n      <key>ShowAddressField</key>\n      <false/>\n    </dict>\n    <key>Title</key>\n    <string>Secure Exam Session</string>\n  </dict>\n</dict>\n</plist>`;
}

// Create new exam session
exports.createExamSession = async (req, res) => {
  try {
    const { mockTestId, examType, browserInfo, ipAddress } = req.body;

    // Ensure caller is authenticated - create should be performed by a logged-in user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.user.id || req.user._id;

    // Verify mock test exists
    const mockTest = await MockTest.findById(mockTestId);
    if (!mockTest) {
      return res.status(404).json({ error: 'Mock test not found' });
    }

    const sessionId = generateSessionId();

    const examSession = new ExamSession({
      sessionId,
      mockTestId,
      userId,
      examType,
      startTime: new Date(),
      heartbeatLastReceived: new Date(),
      startingIpAddress: ipAddress,
      currentIpAddress: ipAddress,
      proctoring: {
        browserName: browserInfo?.name,
        browserVersion: browserInfo?.version,
        userAgent: browserInfo?.userAgent,
        isLockdownBrowser: browserInfo?.isLockdownBrowser || false,
        isRespondusMonitor: browserInfo?.isRespondusMonitor || false,
        isFullscreenMode: browserInfo?.isFullscreenMode || false,
        webcamEnabled: browserInfo?.webcamRequested || false,
      },
      violations: [],
    });

    await examSession.save();

    res.json({
      sessionId,
      examSession,
    });
  } catch (error) {
    console.error('Error creating exam session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Record violation
exports.recordViolation = async (req, res) => {
  try {
    const { sessionId, type, severity, description, details } = req.body;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Don't add violations after exam completed
    if (examSession.status !== 'active') {
      return res.status(400).json({ error: 'Exam session is not active' });
    }

    examSession.violations.push({
      type,
      severity: severity || 'medium',
      description,
      details,
      timestamp: new Date(),
    });

    // Auto-flag if critical violation
    if (severity === 'critical' || examSession.violations.length > 10) {
      examSession.flagged = true;
      examSession.flagReason = `Multiple violations detected: ${type}`;
    }

    // Update heartbeat
    examSession.heartbeatLastReceived = new Date();
    examSession.heartbeatMissedCount = 0;

    await examSession.save();

    // Recalculate risk score
    examSession.riskScore = calculateRiskScore(examSession);
    await examSession.save();

    res.json({
      success: true,
      riskScore: examSession.riskScore,
      flagged: examSession.flagged,
    });
  } catch (error) {
    console.error('Error recording violation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update session heartbeat (sent periodically to keep session alive)
exports.sessionHeartbeat = async (req, res) => {
  try {
    const { sessionId, webcamData, ipAddress, isFullscreen } = req.body;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (examSession.status !== 'active') {
      return res.status(400).json({ error: 'Exam session is not active' });
    }

    // Update heartbeat
    examSession.heartbeatLastReceived = new Date();
    examSession.heartbeatMissedCount = 0;

    // Check IP address change
    if (ipAddress && ipAddress !== examSession.currentIpAddress) {
      const risk = evaluateIpChange(examSession.currentIpAddress, ipAddress);
      if (risk > 0) {
        examSession.ipChanges.push({
          oldIp: examSession.currentIpAddress,
          newIp: ipAddress,
          timestamp: new Date(),
        });

        // Add violation if high risk
        if (risk > 15) {
          examSession.violations.push({
            type: 'suspicious_network',
            severity: 'high',
            description: 'IP address changed significantly during exam',
            details: { oldIp: examSession.currentIpAddress, newIp: ipAddress },
            timestamp: new Date(),
          });
        }
      }
      examSession.currentIpAddress = ipAddress;
    }

    // Update webcam data if provided
    if (webcamData) {
      examSession.proctoring.faceDetectionFramesAnalyzed += 1;
      examSession.proctoring.faceDetectionAccuracy = webcamData.confidence || 0;

      if (!webcamData.faceDetected && webcamData.confidence < 0.3) {
        examSession.proctoring.webcamInterruptions += 1;
        examSession.violations.push({
          type: 'face_not_detected',
          severity: 'high',
          description: 'Face not detected in webcam',
          details: { confidence: webcamData.confidence },
          timestamp: new Date(),
        });
      }

      if (webcamData.multiplefaces) {
        examSession.violations.push({
          type: 'multiple_faces',
          severity: 'critical',
          description: 'Multiple faces detected in webcam',
          details: { faceCount: webcamData.faceCount },
          timestamp: new Date(),
        });
        examSession.flagged = true;
        examSession.flagReason = 'Multiple faces detected during exam';
      }

      // Calculate average confidence
      const totalFrames = examSession.proctoring.faceDetectionFramesAnalyzed;
      const oldAvg = examSession.proctoring.averageConfidence;
      examSession.proctoring.averageConfidence = (oldAvg * (totalFrames - 1) + webcamData.confidence) / totalFrames;
    }

    // Update fullscreen status
    if (isFullscreen !== undefined) {
      examSession.proctoring.isFullscreenMode = isFullscreen;
    }

    // Recalculate risk score every 10 heartbeats
    if (examSession.proctoring.faceDetectionFramesAnalyzed % 10 === 0) {
      examSession.riskScore = calculateRiskScore(examSession);

      // Auto-flag if risk score too high
      if (examSession.riskScore > 70) {
        examSession.flagged = true;
        examSession.flagReason = `High risk score: ${examSession.riskScore}`;
      }
    }

    await examSession.save();

    res.json({
      success: true,
      riskScore: examSession.riskScore,
      flagged: examSession.flagged,
      sessionStatus: examSession.status,
    });
  } catch (error) {
    console.error('Error in session heartbeat:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update proctor metrics
exports.updateProctorMetrics = async (req, res) => {
  try {
    const { sessionId, metric, value } = req.body;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update metric
    const validMetrics = [
      'tabSwitchAttempts',
      'windowBlurEvents',
      'fullscreenExitAttempts',
      'pageVisibilityHiddenEvents',
      'suspiciousRequestsBlocked',
      'externalDomainAccessAttempts',
      'keyboardShortcutAttempts',
      'rightClickAttempts',
      'developerToolsAttempts',
    ];

    if (validMetrics.includes(metric)) {
      examSession.proctoring[metric] = (examSession.proctoring[metric] || 0) + (value || 1);
      
      // Update heartbeat
      examSession.heartbeatLastReceived = new Date();

      // Recalculate risk score
      examSession.riskScore = calculateRiskScore(examSession);

      await examSession.save();

      res.json({
        success: true,
        riskScore: examSession.riskScore,
        metric,
        newValue: examSession.proctoring[metric],
      });
    } else {
      res.status(400).json({ error: 'Invalid metric' });
    }
  } catch (error) {
    console.error('Error updating proctor metrics:', error);
    res.status(500).json({ error: error.message });
  }
};

// End exam session
exports.endExamSession = async (req, res) => {
  try {
    const { sessionId, reason, delayResultProcessing } = req.body;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    examSession.status = 'completed';
    examSession.endTime = new Date();
    examSession.duration = Math.round((examSession.endTime - examSession.startTime) / 1000);

    // If caller requested delayed result processing, set flag and timestamp
    if (delayResultProcessing) {
      examSession.delayedResultProcessing = true;
      examSession.resultProcessingDelayedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    }

    // Final risk assessment
    examSession.riskScore = calculateRiskScore(examSession);

    await examSession.save();

    res.json({
      success: true,
      examSession,
      finalRiskScore: examSession.riskScore,
    });
  } catch (error) {
    console.error('Error ending exam session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get session details (for admin review)
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const examSession = await ExamSession.findOne({ sessionId })
      .populate('mockTestId', 'examId examType')
      .populate('userId', 'name email');

    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify user is admin or session owner
    if (req.user._id.toString() !== examSession.userId._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(examSession);
  } catch (error) {
    console.error('Error getting session details:', error);
    res.status(500).json({ error: error.message });
  }
};

// Serve a .seb configuration file for a given exam session
exports.getSebConfig = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Allow either authenticated access (owner/admin) OR a valid signed token
    const { expires, sig } = req.query || {};
    const secret = process.env.SEB_SIGNING_SECRET || 'default_seb_secret_change_me';

    const tokenValid = (() => {
      try {
        if (!expires || !sig) return false;
        const expiresNum = parseInt(expires, 10);
        if (isNaN(expiresNum) || Date.now() > expiresNum) return false;
        const msg = `${sessionId}:${expiresNum}`;
        const expected = crypto.createHmac('sha256', secret).update(msg).digest('hex');
        return expected === sig;
      } catch (e) {
        return false;
      }
    })();

    // If not authorized via token, require authenticated owner/admin
    if (!tokenValid) {
      if (!req.user || (req.user._id.toString() !== examSession.userId.toString() && !req.user.isAdmin)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Construct the URL SEB should open (the exam start route for this session)
    const startUrl = `${req.protocol}://${req.get('host')}/mock-test/${examSession.mockTestId}/start?sessionId=${encodeURIComponent(sessionId)}`;

    // Build richer SEB XML using helper; allow overriding protocol/host via query
    const host = req.query.host || req.get('host');
    const protocol = req.query.protocol || req.protocol || 'https';
    const sebXml = buildSebXml(examSession, { host, protocol });

    res.setHeader('Content-Type', 'application/x-seb');
    res.setHeader('Content-Disposition', `attachment; filename="exam-${sessionId}.seb"`);
    res.send(sebXml);
  } catch (error) {
    console.error('Error generating SEB config:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get flagged sessions (for admin dashboard)
exports.getFlaggedSessions = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { examType, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { flagged: true };
    if (examType) {
      query.examType = examType;
    }

    const sessions = await ExamSession.find(query)
      .populate('mockTestId', 'examId examType')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await ExamSession.countDocuments(query);

    res.json({
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting flagged sessions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mark session as reviewed
exports.markSessionReviewed = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { sessionId } = req.params;
    const { status, notes } = req.body;

    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update status to suspended or terminated based on review
    if (status === 'terminated' || status === 'suspended') {
      examSession.status = status;
      examSession.flagReason = notes || examSession.flagReason;
    }

    await examSession.save();

    res.json({
      success: true,
      examSession,
    });
  } catch (error) {
    console.error('Error marking session reviewed:', error);
    res.status(500).json({ error: error.message });
  }
};

// Return a short-lived signed URL for fetching the .seb file. This endpoint
// is authenticated and intended for the browser to request a signed URL,
// which can then be opened via the `seb://open?url=` handler.
exports.getSebConfigUrl = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const examSession = await ExamSession.findOne({ sessionId });
    if (!examSession) return res.status(404).json({ error: 'Session not found' });

    // Only owner or admin can request a signed URL
    if (req.user._id.toString() !== examSession.userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const secret = process.env.SEB_SIGNING_SECRET || 'default_seb_secret_change_me';
    const ttlMs = parseInt(process.env.SEB_SIGNING_TTL_MS || '120000', 10); // default 2 minutes
    const expires = Date.now() + ttlMs;
    const msg = `${sessionId}:${expires}`;
    const sig = crypto.createHmac('sha256', secret).update(msg).digest('hex');

    const qs = require('querystring');
    // Allow overriding the public host used for the signed URL via env var.
    // Useful when backend binds to :5000 but public-facing host is :3000 or a domain.
    const publicHost = process.env.SEB_PUBLIC_HOST || req.get('host');
    const protocol = req.protocol || 'http';
    const sebUrl = `${protocol}://${publicHost}/api/exam-sessions/session/${encodeURIComponent(sessionId)}/seb-config?${qs.stringify({ expires, sig })}`;

    res.json({ url: sebUrl, expires, host: publicHost });
  } catch (error) {
    console.error('Error creating signed SEB URL:', error);
    res.status(500).json({ error: error.message });
  }
};
