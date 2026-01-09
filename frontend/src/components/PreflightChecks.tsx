import React, { useState, useEffect } from 'react';
import { performSecurityAssessment, getBrowserInfo } from '../utils/BrowserDetection';
import { DEFAULT_PROCTOR_THRESHOLDS } from '../config/ProctorConfig';
import api from '../api';

export interface PreflightResult {
  name: string;
  status: 'pending' | 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
}

interface PreflightChecksProps {
  mockTestId: string;
  examType: 'JAMB' | 'WAEC';
  onComplete: (success: boolean, sessionId?: string) => void;
  onCancel?: () => void;
}

export const PreflightChecks: React.FC<PreflightChecksProps> = ({
  mockTestId,
  examType,
  onComplete,
  onCancel,
}) => {
  const [allowingCamera, setAllowingCamera] = useState(false);
  const [results, setResults] = useState<PreflightResult[]>([
    { name: 'Browser Detection', status: 'pending', message: 'Checking browser...' },
    { name: 'Security Assessment', status: 'pending', message: 'Analyzing environment...' },
    { name: 'Camera Access', status: 'pending', message: 'Requesting camera permission...' },
    { name: 'Network Connectivity', status: 'pending', message: 'Testing network...' },
    { name: 'Fullscreen Capability', status: 'pending', message: 'Checking fullscreen support...' },
    { name: 'Session Creation', status: 'pending', message: 'Creating exam session...' },
  ]);
  const [overallRiskScore, setOverallRiskScore] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Note: Fullscreen is maintained by the parent JambTest/WaecTest component.
  // Do not request fullscreen here as setInterval callbacks lack user gesture context,
  // which violates the requestFullscreen() API requirements.

  const updateResult = (index: number, update: Partial<PreflightResult>) => {
    setResults((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...update };
      return updated;
    });
  };

  const runPreflightChecks = async () => {
    try {
      // Runtime debug: log any camera pre-warm status set during the Start Test click
      try {
        const prewarm = sessionStorage.getItem('proctor_camera_status');
        // eslint-disable-next-line no-console
        console.debug('[PreflightChecks] proctor_camera_status:', prewarm);
      } catch (e) {
        // ignore
      }
      // Local snapshot of results to avoid relying on React state updates
      // which are asynchronous. Use `setLocalResult` below to update both
      // the local snapshot and the component state so decisions here are
      // deterministic.
      let localResults = [...results];
      const setLocalResult = (index: number, update: Partial<PreflightResult>) => {
        localResults[index] = { ...localResults[index], ...update };
        updateResult(index, update);
      };
      // Check 1: Browser Detection
      const browserInfo = await getBrowserInfo();
      const browserStatus = 
        !DEFAULT_PROCTOR_THRESHOLDS.blockLockdownBrowserAbsent || 
        browserInfo.isLockdownBrowser || 
        browserInfo.isRespondusMonitor 
          ? 'pass' 
          : 'warning';
      setLocalResult(0, {
        status: browserStatus,
        message: `${browserInfo.name} ${browserInfo.version}${
          browserInfo.isLockdownBrowser ? ' (LockDown)' : 
          browserInfo.isRespondusMonitor ? ' (Respondus)' : ''
        }`,
        details: browserInfo,
      });

      // Check 2: Security Assessment
      const assessment = await performSecurityAssessment();
      setOverallRiskScore(assessment.overall);
      const securityStatus =
        assessment.overall > DEFAULT_PROCTOR_THRESHOLDS.riskScoreBlockThreshold
          ? 'fail'
          : assessment.overall > DEFAULT_PROCTOR_THRESHOLDS.riskScoreWarningThreshold
          ? 'warning'
          : 'pass';
      
      if (securityStatus === 'fail') {
        setLocalResult(1, {
          status: 'fail',
          message: `High security risk (${assessment.overall}/100): ${assessment.issues.join(', ')}`,
          details: assessment,
        });
        localResults = localResults.map((r, i) => (i > 1 ? { ...r, status: 'fail', message: 'Skipped due to security risk' } : r));
        setResults((prev) => prev.map((r, i) => (i > 1 ? { ...r, status: 'fail', message: 'Skipped due to security risk' } : r)));
        onComplete(false);
        return;
      }

      setLocalResult(1, {
        status: securityStatus,
        message: `Risk score: ${assessment.overall}/100${securityStatus === 'warning' ? ' - ' + assessment.issues[0] : ''}`,
        details: assessment,
      });

      // Check 3: Camera Access
      try {
        // If the start-click pre-warmed the camera, a flag will be present
        // in sessionStorage indicating the result. Respect that to avoid
        // triggering a permission prompt while in fullscreen.
        let stored: string | null = null;
        try {
          stored = sessionStorage.getItem('proctor_camera_status');
        } catch (e) {
          stored = null;
        }

        if (stored === 'granted') {
          setLocalResult(2, {
            status: 'pass',
            message: 'Camera access previously granted',
          });
        } else if (stored === 'denied') {
          if (DEFAULT_PROCTOR_THRESHOLDS.requireCamera) {
            setLocalResult(2, {
              status: 'fail',
              message: 'Camera access previously denied',
            });
            localResults = localResults.map((r, i) => (i > 2 ? { ...r, status: 'fail', message: 'Skipped due to camera error' } : r));
            setResults((prev) => prev.map((r, i) => (i > 2 ? { ...r, status: 'fail', message: 'Skipped due to camera error' } : r)));
            onComplete(false);
            return;
          } else {
            setLocalResult(2, {
              status: 'warning',
              message: 'Camera access previously denied',
            });
          }
        } else {
          // No stored info — show the explicit CTA so camera permission and fullscreen
          // are requested under a direct user gesture.
          setLocalResult(2, {
            status: 'pending',
            message: 'Awaiting user action to allow camera and enter fullscreen',
          });
        }
      } catch (outerErr) {
        setLocalResult(2, {
          status: 'warning',
          message: 'Camera check skipped due to error',
        });
      }

      // Check 4: Network Connectivity
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), DEFAULT_PROCTOR_THRESHOLDS.networkTimeoutMs);
        
        const response = await fetch('https://api.ipify.org?format=json', {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          setLocalResult(3, {
            status: 'pass',
            message: 'Network connectivity verified',
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        setLocalResult(3, {
          status: 'warning',
          message: `Network check failed: ${(error as Error).message}`,
        });
      }

      // Check 5: Fullscreen Capability
      const fullscreenCapable = !!document.documentElement.requestFullscreen;
      if (DEFAULT_PROCTOR_THRESHOLDS.requireFullscreen && !fullscreenCapable) {
        updateResult(4, {
          status: 'fail',
          message: 'Fullscreen not supported by browser',
        });
        setResults((prev) => prev.map((r, i) => (i > 4 ? { ...r, status: 'fail', message: 'Skipped' } : r)));
        onComplete(false);
        return;
      }

      setLocalResult(4, {
        status: 'pass',
        message: 'Fullscreen supported',
      });

      // If any required checks are still pending (e.g. Camera awaiting user action),
      // do not attempt to create the session yet — wait for the CTA to resolve.
      // If SEB is required, the camera check pending state should not block
      // session creation because the .seb flow will handle launching the exam.
      const pendingRequired = localResults.slice(0, 5).some((r) => r.status === 'pending');
      if (pendingRequired) {
        // Push updated local results into state so the UI reflects pending status
        setResults(localResults);
        return;
      }

      // Check 6: Session Creation
      try {
        // Create an AbortController to enforce a session creation timeout
        const controller = new AbortController();
        const sessionTimeout = setTimeout(() => controller.abort(), DEFAULT_PROCTOR_THRESHOLDS.networkTimeoutMs);
        
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[PreflightChecks] Creating session for mockTestId:', mockTestId);
        }
        
        const sessionResponse = await api.post(
          '/exam-sessions/session/create',
          {
            mockTestId,
            examType,
            browserInfo,
            ipAddress: await getPublicIp(),
          },
          { signal: (controller as any).signal }
        );
        clearTimeout(sessionTimeout);

        if (sessionResponse.data.sessionId) {
          setLocalResult(5, {
            status: 'pass',
            message: 'Exam session created successfully',
            details: { sessionId: sessionResponse.data.sessionId },
          });
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[PreflightChecks] Session created successfully', { 
              sessionId: sessionResponse.data.sessionId 
            });
          }
          const hasFails = localResults.slice(0, 5).some((r) => r.status === 'fail');
          onComplete(!hasFails, sessionResponse.data.sessionId);
        } else {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[PreflightChecks] session create returned no sessionId', sessionResponse?.data);
          }
          throw new Error('No session ID received');
        }
      } catch (error) {
        const errorMsg = (error as any)?.message || String(error);
        const isAborted = (error as any)?.name === 'AbortError';
        
        if (process.env.NODE_ENV !== 'production') {
          console.error('[PreflightChecks] Session creation failed:', {
            isAborted,
            message: errorMsg,
            error
          });
        }
        
        setLocalResult(5, {
          status: 'fail',
          message: `Session creation failed: ${isAborted ? 'request timeout' : errorMsg}`,
        });
        if (process.env.NODE_ENV !== 'production') {
          console.error('[PreflightChecks] Preflight checks aborted due to session creation failure');
        }
        onComplete(false);
      }
    } catch (error) {
      console.error('[PreflightChecks] Unexpected error:', error);
      setResults((prev) =>
        prev.map((r) =>
          r.status === 'pending' ? { ...r, status: 'fail', message: 'Check skipped' } : r
        )
      );
      onComplete(false);
    }
  };

  useEffect(() => {
    runPreflightChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = async () => {
    if (retryCount < DEFAULT_PROCTOR_THRESHOLDS.maxPreflightRetries) {
      setRetryCount(retryCount + 1);
      setResults((prev) =>
        prev.map((r) => ({ ...r, status: 'pending', message: 'Retrying...' }))
      );
      await new Promise((resolve) =>
        setTimeout(resolve, DEFAULT_PROCTOR_THRESHOLDS.preflightRetryDelayMs)
      );
      runPreflightChecks();
    }
  };

  const handleAllowCameraAndFullscreen = async () => {
    setAllowingCamera(true);
    try {
      const win: any = window as any;
      let warm: MediaStream | undefined = win.__proctorWarmStream;

      if (!warm) {
        try {
          warm = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          // keep the warm stream available for later use
          win.__proctorWarmStream = warm;
          try {
            sessionStorage.setItem('proctor_camera_status', 'granted');
          } catch (e) {
            // ignore storage errors
          }
        } catch (err: any) {
          // Camera permission was denied
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.warn('[PreflightChecks] Camera access denied in allowCameraAndFullscreen:', err?.name, err?.message);
          }
          try {
            sessionStorage.setItem('proctor_camera_status', 'denied');
          } catch (e) {
            // ignore
          }
          // Re-run checks to let the component respond to denial
          setAllowingCamera(false);
          await runPreflightChecks();
          return;
        }
      } else {
        // Stream already exists from pre-warm
        try {
          sessionStorage.setItem('proctor_camera_status', 'granted');
        } catch (e) {
          // ignore
        }
      }

      // Try requesting fullscreen in the same user gesture if possible
      // Fullscreen request MUST happen in a user-gesture context (which this is)
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
         let isInFullscreen = false;
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          // Check if we're already in fullscreen
          if (!document.fullscreenElement) {
            // Request fullscreen and wait for it to complete
            try {
              await elem.requestFullscreen();
              if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.log('[PreflightChecks] Entered fullscreen successfully');
              }
            } catch (fsErr: any) {
              // Fullscreen was rejected - this is OK, we proceed anyway
              if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.warn('[PreflightChecks] Fullscreen request failed:', fsErr?.name, fsErr?.message);
              }
              // Continue anyway - fullscreen is preferred but not absolutely required
            }
          }
        }
      } catch (e: any) {
        // Ignore any errors
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[PreflightChecks] Unexpected error in fullscreen logic:', e?.message);
        }
      }

      // Re-run preflight checks so stored 'proctor_camera_status' is picked up
      // At this point we have:
      // - camera permission either granted or denied (stored in sessionStorage)
      // - fullscreen either active or failed gracefully
      setAllowingCamera(false);
      await runPreflightChecks();
    } catch (unexpectedErr) {
      // Catch any unexpected errors to prevent hang
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[PreflightChecks] Unexpected error in handleAllowCameraAndFullscreen:', unexpectedErr);
      }
      setAllowingCamera(false);
      await runPreflightChecks();
    }
  };

  const allComplete = results.every((r) => r.status !== 'pending');
  const anyFails = results.some((r) => r.status === 'fail');
  const canRetry = retryCount < DEFAULT_PROCTOR_THRESHOLDS.maxPreflightRetries;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50000,
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          color: '#fff',
          borderRadius: 8,
          padding: 40,
          maxWidth: 600,
          boxShadow: '0 0 20px rgba(0, 200, 255, 0.3)',
          border: '1px solid #00c8ff',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 30, textAlign: 'center', fontSize: 24 }}>
          🔒 Exam Environment Verification
        </h2>

        <div style={{ marginBottom: 30, maxHeight: 400, overflowY: 'auto' }}>
          {results.map((result, index) => (
            <div
              key={index}
              style={{
                marginBottom: 15,
                padding: 12,
                background: '#16213e',
                borderLeft: `4px solid ${
                  result.status === 'pass'
                    ? '#00ff00'
                    : result.status === 'warning'
                    ? '#ffaa00'
                    : result.status === 'fail'
                    ? '#ff0000'
                    : '#666'
                }`,
                borderRadius: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ marginRight: 10, fontSize: 18 }}>
                  {result.status === 'pass'
                    ? '✓'
                    : result.status === 'warning'
                    ? '⚠'
                    : result.status === 'fail'
                    ? '✗'
                    : '○'}
                </span>
                <strong style={{ flex: 1 }}>{result.name}</strong>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {result.status === 'pending' ? 'Checking...' : result.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginLeft: 28 }}>
                {result.message}
              </div>
            </div>
          ))}
        </div>

        {/* SEB Prompt removed - no external SEB UI shown */}
        {allComplete && (
          <div style={{ marginBottom: 20, padding: 15, background: '#0f3d66', borderRadius: 4, textAlign: 'center' }}>
            <strong>Overall Risk Score: {overallRiskScore}/100</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          {results[2]?.status === 'pending' && (
            <button
              onClick={handleAllowCameraAndFullscreen}
              disabled={allowingCamera}
              style={{
                padding: '10px 20px',
                background: '#0077ff',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: allowingCamera ? 'not-allowed' : 'pointer',
                fontSize: 14,
              }}
            >
              {allowingCamera ? 'Processing...' : 'Allow Camera & Continue (enter fullscreen)'}
            </button>
          )}
          {onCancel && !allComplete && (
            <button
              onClick={onCancel}
              style={{
                padding: '10px 20px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          )}
          {allComplete && anyFails && canRetry && (
            <button
              onClick={handleRetry}
              style={{
                padding: '10px 20px',
                background: '#ff8800',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Retry ({retryCount}/{DEFAULT_PROCTOR_THRESHOLDS.maxPreflightRetries})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

async function getPublicIp(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_PROCTOR_THRESHOLDS.networkTimeoutMs);
    const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return 'unknown';
    const data = await response.json();
    return data?.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

export default PreflightChecks;
