/**
 * Proctoring System Configuration
 * Tuned thresholds and timeouts for exam security checks
 */

export interface ProctorThresholds {
  // Webcam settings
  webcamTimeoutMs: number; // Max time to initialize webcam and detect face (ms)
  faceDetectionWarmupMs: number; // How long to calibrate face detection (ms)
  faceConfidenceThreshold: number; // Minimum confidence for valid face (0-1)
  faceDetectionFpsMin: number; // Minimum FPS for reliable detection
  faceContinuityFrames: number; // Consecutive frames without face before violation
  
  // Risk scoring
  riskScoreWarningThreshold: number; // Risk score to show warning (0-100)
  riskScoreBlockThreshold: number; // Risk score to block exam (0-100)
  
  // Browser & security
  blockLockdownBrowserAbsent: boolean; // Force LockDown or Respondus browser
  allowVirtualEnvironment: boolean; // Allow exams from VMs
  requireFullscreen: boolean; // Enforce fullscreen mode
  requireCamera: boolean; // Require camera access to start
  requireSEB: boolean; // Require Safe Exam Browser (SEB) to launch
  
  // Network settings
  networkTimeoutMs: number; // Timeout for network checks (ms)
  blockAllExternalRequests: boolean; // Block all non-whitelisted domains
  
  // Violation batching
  violationFlushIntervalMs: number; // Interval to send violations to backend (ms)
  violationBatchSize: number; // Max violations per batch
  
  // Session management
  sessionHeartbeatIntervalMs: number; // Heartbeat interval (ms)
  sessionInactivityTimeoutMs: number; // Max inactivity before auto-logout (ms)
  
  // Retry logic
  maxPreflightRetries: number; // Max preflight check retries
  preflightRetryDelayMs: number; // Delay between preflight retries (ms)
}

export const DEFAULT_PROCTOR_THRESHOLDS: ProctorThresholds = {
  // Webcam: ~10s max init + warmup, 50% confidence, continuous detection
  webcamTimeoutMs: 10000,
  faceDetectionWarmupMs: 3000,
  faceConfidenceThreshold: 0.5,
  faceDetectionFpsMin: 5,
  faceContinuityFrames: 10, // ~0.17s at 60 FPS without face = violation
  
  // Risk: warn at 50, block at 80 (0-100 scale)
  riskScoreWarningThreshold: 50,
  riskScoreBlockThreshold: 80,
  
  // Browser: require camera, allow VM, optional fullscreen
  blockLockdownBrowserAbsent: false, // Info only, not blocking
  allowVirtualEnvironment: true,
  requireFullscreen: true,
  requireCamera: true,
  requireSEB: false,
  
  // Network: allow requests to whitelisted domains only
  networkTimeoutMs: 5000,
  blockAllExternalRequests: true,
  
  // Violations: batch every 30s, max 10 per batch
  violationFlushIntervalMs: 30000,
  violationBatchSize: 10,
  
  // Session: heartbeat every 5s, timeout after 30 min
  sessionHeartbeatIntervalMs: 5000,
  sessionInactivityTimeoutMs: 1800000,
  
  // Retries: 2 attempts, 2s delay
  maxPreflightRetries: 2,
  preflightRetryDelayMs: 2000,
};

/**
 * Get thresholds for a specific exam type
 * Can override defaults per exam if needed
 */
export function getThresholds(examType?: 'JAMB' | 'WAEC'): ProctorThresholds {
  // Could customize per exam type here
  return { ...DEFAULT_PROCTOR_THRESHOLDS };
}
