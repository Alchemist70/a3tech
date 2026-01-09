/**
 * ProctorService - Unified proctoring system
 * Coordinates webcam monitoring, network blocking, session tracking, and browser detection
 */

import WebcamProctor from './WebcamProctor';
import NetworkMonitor from './NetworkMonitor';
import {
  getBrowserInfo,
  performSecurityAssessment,
  disableCopyPaste,
  disableTextSelection,
} from '../utils/BrowserDetection';
import { getThresholds, ProctorThresholds } from '../config/ProctorConfig';
import api from '../api';

export interface ProctorConfig {
  sessionId: string;
  mockTestId: string;
  examType: 'JAMB' | 'WAEC';
  enableWebcam: boolean;
  enableNetworkMonitoring: boolean;
  enableBrowserDetection: boolean;
  enableClipboardDisable: boolean;
  thresholds?: ProctorThresholds;
}

interface ProctorMetrics {
  sessionId: string;
  totalViolations: number;
  webcamStatus: 'active' | 'inactive' | 'error';
  networkBlocked: number;
  riskScore: number;
  lastUpdate: Date;
}

export class ProctorService {
  private sessionId: string;
  private mockTestId: string;
  private examType: 'JAMB' | 'WAEC';
  private webcamProctor: WebcamProctor | null = null;
  private networkMonitor: NetworkMonitor | null = null;
  private browserInfo: any = null;
  private isActive: boolean = false;
  private metrics: ProctorMetrics | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private thresholds: ProctorThresholds;
  private violationQueue: any[] = [];

  constructor(config: ProctorConfig) {
    this.sessionId = config.sessionId;
    this.mockTestId = config.mockTestId;
    this.examType = config.examType;
    this.thresholds = config.thresholds || getThresholds(config.examType);
  }

  /**
   * Initialize and start the proctoring system
   */
  async start(): Promise<boolean> {
    try {
      console.log('[ProctorService] Starting proctoring system...');

      // Create exam session on backend
      const sessionResponse = await api.post('/exam-sessions/session/create', {
        mockTestId: this.mockTestId,
        examType: this.examType,
        browserInfo: await getBrowserInfo(),
        ipAddress: await this.getPublicIp(),
      });

      if (!sessionResponse.data.sessionId) {
        console.error('Failed to create exam session');
        return false;
      }

      // Initialize browser detection and assessment
      const assessment = await performSecurityAssessment();
      console.log('[ProctorService] Security Assessment:', assessment);

      // Warn if security issues detected
      if (assessment.recommendation === 'caution') {
        console.warn('[ProctorService] Medium security risk detected:', assessment.issues);
      } else if (assessment.recommendation === 'blocked') {
        console.error('[ProctorService] High security risk - exam should be blocked');
        await this.recordViolation('security_threat', 'critical', assessment.issues.join('; '));
        return false;
      }

      // Initialize webcam monitoring
      const webcamSuccess = await this.initializeWebcam();
      if (!webcamSuccess) {
        console.warn('[ProctorService] Webcam initialization failed, continuing without video');
      }

      // Initialize network monitoring
      this.initializeNetworkMonitoring();

      // Disable copy-paste and text selection
      disableCopyPaste();
      disableTextSelection();

      // Start heartbeat
      this.startHeartbeat();

      this.isActive = true;
      console.log('[ProctorService] Proctoring system started successfully');

      return true;
    } catch (error) {
      console.error('[ProctorService] Failed to start:', error);
      await this.recordViolation('startup_error', 'high', (error as any).message);
      return false;
    }
  }

  /**
   * Initialize webcam monitoring
   */
  private async initializeWebcam(): Promise<boolean> {
    try {
      this.webcamProctor = new WebcamProctor({
        sessionId: this.sessionId,
        onViolation: this.handleWebcamViolation.bind(this),
        onHeartbeat: this.handleHeartbeat.bind(this),
        enableLogging: true,
      });

      const success = await this.webcamProctor.initialize();
      if (success) {
        await this.webcamProctor.start();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ProctorService] Webcam initialization error:', error);
      return false;
    }
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    try {
      this.networkMonitor = new NetworkMonitor({
        sessionId: this.sessionId,
        onSuspiciousRequest: this.handleNetworkViolation.bind(this),
        allowedDomains: [
          window.location.hostname,
          'api.example.com', // Add your API domains
        ],
        blockAllExternalRequests: false,
      });

      // Disable clipboard and storage
      this.networkMonitor.disableClipboard();
      this.networkMonitor.disableStorageAccess();

      this.networkMonitor.start();
    } catch (error) {
      console.error('[ProctorService] Network monitoring initialization error:', error);
    }
  }

  /**
   * Handle webcam violation
   */
  private async handleWebcamViolation(type: string, details: any): Promise<void> {
    const severity = type === 'multiple_faces' ? 'critical' : type === 'face_not_detected' ? 'high' : 'medium';

    console.warn(`[ProctorService] Webcam violation: ${type}`, details);

    await this.recordViolation(type, severity, details.error || type);
  }

  /**
   * Handle network violation
   */
  private async handleNetworkViolation(request: any): Promise<void> {
    console.warn(`[ProctorService] Network violation: ${request.url}`, request);

    await this.recordViolation('suspicious_network', 'high', `Blocked: ${request.url}`);
  }

  /**
   * Handle heartbeat/periodic updates
   */
  private async handleHeartbeat(data: any): Promise<void> {
    try {
      await api.post('/exam-sessions/session/heartbeat', {
        ...data,
        isFullscreen: document.fullscreenElement !== null,
      });
    } catch (error) {
      console.error('[ProctorService] Heartbeat error:', error);
    }
  }

  /**
   * Record violation with batching
   */
  private async recordViolation(type: string, severity: string, description: string): Promise<void> {
    this.violationQueue.push({
      sessionId: this.sessionId,
      type,
      severity,
      description,
    });

    // Immediately send critical violations
    if (severity === 'critical') {
      await this.flushViolations();
    }
  }

  /**
   * Flush queued violations to backend
   */
  private async flushViolations(): Promise<void> {
    if (this.violationQueue.length === 0) return;

    let chunk: any[] = [];
    try {
      chunk = this.violationQueue.splice(0, this.thresholds.violationBatchSize);

      for (const violation of chunk) {
        await api.post('/exam-sessions/session/violation', violation);
      }
    } catch (error) {
      console.error('[ProctorService] Error flushing violations:', error);
      // Re-queue failed violations
      if (chunk.length > 0) this.violationQueue.unshift(...chunk);
    }
  }

  /**
   * Start periodic heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isActive) return;

      // Flush violations
      await this.flushViolations();

      // Check for session-level violations
      await this.checkSessionViolations();
    }, this.thresholds.violationFlushIntervalMs);
  }

  /**
   * Check for session-level violations
   */
  private async checkSessionViolations(): Promise<void> {
    // Check page visibility
    if (document.hidden) {
      await this.recordViolation('page_visibility_hidden', 'high', 'Page is hidden/minimized');
    }

    // Check fullscreen mode
    if (!document.fullscreenElement && !document.hidden) {
      // User may have exited fullscreen accidentally
      // Could trigger warning rather than strict violation
    }

    // Check for developer tools (basic heuristic)
    const isDevToolsOpen = this.detectDevTools();
    if (isDevToolsOpen) {
      await this.recordViolation('developer_tools', 'critical', 'Developer tools detected');
    }
  }

  /**
   * Basic developer tools detection
   */
  private detectDevTools(): boolean {
    // This is a basic heuristic and can be bypassed
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold) {
      return true; // Likely dev tools open at bottom
    }
    if (window.outerWidth - window.innerWidth > threshold) {
      return true; // Likely dev tools open on side
    }
    return false;
  }

  /**
   * Stop proctoring system
   */
  async stop(): Promise<void> {
    try {
      console.log('[ProctorService] Stopping proctoring system...');

      this.isActive = false;

      // Stop webcam monitoring
      if (this.webcamProctor) {
        this.webcamProctor.stop();
      }

      // Stop network monitoring
      if (this.networkMonitor) {
        this.networkMonitor.stop();
      }

      // Clear heartbeat
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Flush remaining violations
      await this.flushViolations();

      // End session on backend
      await api.post('/exam-sessions/session/end', {
        sessionId: this.sessionId,
      });

      console.log('[ProctorService] Proctoring system stopped');
    } catch (error) {
      console.error('[ProctorService] Error stopping proctoring:', error);
    }
  }

  /**
   * Get public IP address
   */
  private async getPublicIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): ProctorMetrics | null {
    return this.metrics;
  }

  /**
   * Get proctoring status
   */
  getStatus(): {
    isActive: boolean;
    webcam: boolean;
    networkMonitoring: boolean;
    violations: number;
  } {
    return {
      isActive: this.isActive,
      webcam: this.webcamProctor?.isActive() || false,
      networkMonitoring: this.networkMonitor !== null,
      violations: this.violationQueue.length,
    };
  }

  /**
   * Display proctoring info overlay
   */
  displayProctoringOverlay(): void {
    const overlay = document.createElement('div');
    overlay.id = 'proctor-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 250px;
      height: auto;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      border-left: 3px solid #00ff00;
      border-radius: 0 0 0 5px;
    `;

    const status = this.getStatus();
    overlay.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>🔒 PROCTOR ACTIVE</strong>
      </div>
      <div>Webcam: ${status.webcam ? '✓ ON' : '✗ OFF'}</div>
      <div>Network: ${status.networkMonitoring ? '✓ ON' : '✗ OFF'}</div>
      <div>Violations: <strong>${status.violations}</strong></div>
      <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
        Session: ${this.sessionId.substring(0, 8)}...
      </div>
    `;

    document.body.appendChild(overlay);

    // Update overlay periodically
    setInterval(() => {
      const updated = this.getStatus();
      const violationsDiv = overlay.querySelector('div:nth-child(4)');
      if (violationsDiv) {
        violationsDiv.textContent = `Violations: ${updated.violations}`;
      }
    }, 1000);
  }
}

export default ProctorService;
