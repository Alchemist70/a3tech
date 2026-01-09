import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

/**
 * WebcamProctor - AI-powered webcam monitoring for secure exam proctoring
 * Uses BlazeFace model for real-time face detection
 */

interface FaceDetectionResult {
  faceDetected: boolean;
  confidence: number;
  faceCount: number;
  multipleFaces: boolean;
  faceBounds?: Array<{
    start: [number, number];
    end: [number, number];
  }>;
  landmarks?: Array<Array<number>>;
  fps?: number;
}

interface WebcamProctorConfig {
  sessionId: string;
  onViolation: (type: string, details: any) => Promise<void>;
  onHeartbeat: (data: any) => Promise<void>;
  videoWidth?: number;
  videoHeight?: number;
  analyzeInterval?: number; // ms between analysis frames
  enableLogging?: boolean;
}

export class WebcamProctor {
  private sessionId: string;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private model: blazeface.BlazeFaceModel | null = null;
  private isRunning: boolean = false;
  private onViolation: (type: string, details: any) => Promise<void>;
  private onHeartbeat: (data: any) => Promise<void>;
  private videoWidth: number;
  private videoHeight: number;
  private analyzeInterval: number;
  private lastAnalysisTime: number = 0;
  private enableLogging: boolean;
  private frameCount: number = 0;
  private startTime: number = Date.now();
  private lastViolationTime: { [key: string]: number } = {};
  private violationThrottleMs: number = 3000; // Prevent spam of same violation
  private noFaceConsecutiveFrames: number = 0;
  private maxNoFaceFrames: number = 10; // 10 frames without face before violation

  constructor(config: WebcamProctorConfig) {
    this.sessionId = config.sessionId;
    this.onViolation = config.onViolation;
    this.onHeartbeat = config.onHeartbeat;
    this.videoWidth = config.videoWidth || 640;
    this.videoHeight = config.videoHeight || 480;
    this.analyzeInterval = config.analyzeInterval || 500; // Analyze every 500ms
    this.enableLogging = config.enableLogging || false;
  }

  /**
   * Initialize webcam access and load face detection model
   */
  async initialize(): Promise<boolean> {
    try {
      this.log('Initializing WebcamProctor...');

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.width = this.videoWidth;
      this.videoElement.height = this.videoHeight;
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;

      // Create canvas for visualization
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = this.videoWidth;
      this.canvasElement.height = this.videoHeight;

      // Prefer a pre-warmed stream if available on the window (set by the Start Test flow)
      const win: any = window as any;
      try {
        let stream: MediaStream | undefined = win.__proctorWarmStream;

        if (!stream) {
          // No warm stream — request camera access now
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: this.videoWidth },
              height: { ideal: this.videoHeight },
              facingMode: 'user',
            },
            audio: false,
          });
        }

        this.videoElement.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve) => {
          this.videoElement!.onloadedmetadata = () => {
            this.videoElement!.play();
            resolve(null);
          };
        });

        this.log('Camera stream initialized' + (win.__proctorWarmStream ? ' (reused warm stream)' : ''));
      } catch (error: any) {
        console.error('Camera access denied or unavailable:', error);
        await this.onViolation('webcam_access_denied', {
          error: error?.message || String(error),
          timestamp: new Date().toISOString(),
        });
        return false;
      }

      // Load face detection model
      try {
        this.model = await blazeface.load();
        this.log('BlazeFace model loaded');
      } catch (error) {
        console.error('Failed to load face detection model:', error);
        await this.onViolation('face_detection_model_failed', {
          error: (error as any).message,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('WebcamProctor initialization failed:', error);
      return false;
    }
  }

  /**
   * Start continuous face detection monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning || !this.videoElement || !this.model) {
      this.log('Cannot start: not initialized or already running');
      return;
    }

    this.isRunning = true;
    this.frameCount = 0;
    this.startTime = Date.now();
    this.log('WebcamProctor monitoring started');

    this.detectFacesLoop();
  }

  /**
   * Stop face detection monitoring
   */
  stop(): void {
    this.isRunning = false;

    // Stop video stream
    if (this.videoElement?.srcObject) {
      const win: any = window as any;
      const src = this.videoElement.srcObject as MediaStream;
      // If this stream is the global warm stream, do not stop it here —
      // the warm stream is owned by the broader flow and will be cleaned up
      // by the instruction/test page when appropriate.
      if (win.__proctorWarmStream && win.__proctorWarmStream === src) {
        this.log('Preserving global warm stream; not stopping tracks here');
      } else {
        const tracks = src.getTracks();
        tracks.forEach((track) => track.stop());
      }
    }

    this.log('WebcamProctor monitoring stopped');
  }

  /**
   * Main face detection loop
   */
  private async detectFacesLoop(): Promise<void> {
    if (!this.isRunning) return;

    const now = Date.now();
    const timeSinceLastAnalysis = now - this.lastAnalysisTime;

    // Only analyze at specified interval
    if (timeSinceLastAnalysis >= this.analyzeInterval) {
      await this.analyzeFaces();
      this.lastAnalysisTime = now;
    }

    requestAnimationFrame(() => this.detectFacesLoop());
  }

  /**
   * Analyze current video frame for faces
   */
  private async analyzeFaces(): Promise<void> {
    if (!this.videoElement || !this.model || this.videoElement.videoWidth === 0) {
      return;
    }

    try {
      this.frameCount++;

      // Run face detection
      const predictions = await this.model.estimateFaces(this.videoElement, false);

      const result: FaceDetectionResult = {
        faceDetected: predictions.length > 0,
        confidence: predictions.length > 0 ? predictions[0].probability?.[0] || 0.9 : 0,
        faceCount: predictions.length,
        multipleFaces: predictions.length > 1,
        fps: this.calculateFps(),
      };

      // Add face bounds and landmarks if detected
      if (predictions.length > 0) {
        result.faceBounds = predictions.map((pred: any) => ({
          start: pred.start,
          end: pred.end,
        }));
        result.landmarks = predictions.map((pred: any) => pred.landmarks);

        this.noFaceConsecutiveFrames = 0; // Reset counter
      } else {
        this.noFaceConsecutiveFrames++;
      }

      // Check for violations
      await this.checkForViolations(result);

      // Send heartbeat with detection data
      if (this.frameCount % 10 === 0) {
        // Every 10 frames
        await this.onHeartbeat({
          sessionId: this.sessionId,
          webcamData: {
            faceDetected: result.faceDetected,
            confidence: result.confidence,
            multipleFaces: result.multipleFaces,
            faceCount: result.faceCount,
            fps: result.fps,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Draw visualization if canvas available
      if (this.canvasElement) {
        this.drawFaceDetection(result);
      }
    } catch (error) {
      console.error('Error analyzing faces:', error);
    }
  }

  /**
   * Check for proctoring violations
   */
  private async checkForViolations(result: FaceDetectionResult): Promise<void> {
    // Check for multiple faces
    if (result.multipleFaces) {
      await this.triggerViolation('multiple_faces', {
        faceCount: result.faceCount,
        confidence: result.confidence,
      });
    }

    // Check for no face detected (with hysteresis to prevent spam)
    if (!result.faceDetected) {
      if (this.noFaceConsecutiveFrames > this.maxNoFaceFrames) {
        await this.triggerViolation('face_not_detected', {
          consecutiveFramesWithoutFace: this.noFaceConsecutiveFrames,
        });
      }
    }

    // Check for low confidence face detection
    if (result.faceDetected && result.confidence < 0.5) {
      await this.triggerViolation('low_face_confidence', {
        confidence: result.confidence,
      });
    }
  }

  /**
   * Trigger violation with throttling
   */
  private async triggerViolation(type: string, details: any): Promise<void> {
    const now = Date.now();
    const lastTime = this.lastViolationTime[type] || 0;

    // Throttle violations of same type
    if (now - lastTime < this.violationThrottleMs) {
      return;
    }

    this.lastViolationTime[type] = now;

    this.log(`⚠️  Violation detected: ${type}`, details);

    try {
      await this.onViolation(type, {
        ...details,
        frameNumber: this.frameCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error reporting violation:', error);
    }
  }

  /**
   * Draw face detection visualization on canvas
   */
  private drawFaceDetection(result: FaceDetectionResult): void {
    if (!this.canvasElement || !this.videoElement) return;

    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(this.videoElement, 0, 0, this.videoWidth, this.videoHeight);

    // Draw detection results
    if (result.faceBounds) {
      result.faceBounds.forEach((bound: any, index: number) => {
        const [x1, y1] = bound.start;
        const [x2, y2] = bound.end;
        const width = x2 - x1;
        const height = y2 - y1;

        // Color based on confidence
        const color = result.confidence > 0.8 ? '#00ff00' : result.confidence > 0.5 ? '#ffff00' : '#ff0000';

        // Draw bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);

        // Draw confidence text
        if (result.confidence) {
          ctx.fillStyle = color;
          ctx.font = '12px Arial';
          ctx.fillText(`${(result.confidence * 100).toFixed(0)}%`, x1, y1 - 5);
        }
      });
    }

    // Draw status text
    const statusText = result.faceDetected ? `✓ Face Detected (${result.faceCount})` : '✗ No Face';
    const statusColor = result.faceDetected ? '#00ff00' : '#ff0000';
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 14px Arial';
    ctx.fillText(statusText, 10, 30);

    // Draw FPS
    if (result.fps) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`FPS: ${result.fps.toFixed(0)}`, 10, 50);
    }
  }

  /**
   * Calculate frames per second
   */
  private calculateFps(): number {
    const elapsed = Date.now() - this.startTime;
    return this.frameCount / (elapsed / 1000);
  }

  /**
   * Get canvas stream for display or recording
   */
  getCanvasStream(): HTMLCanvasElement | null {
    return this.canvasElement;
  }

  /**
   * Get video stream for direct access
   */
  getVideoStream(): HTMLVideoElement | null {
    return this.videoElement;
  }

  /**
   * Logging utility
   */
  private log(message: string, data?: any): void {
    if (this.enableLogging) {
      console.log(`[WebcamProctor] ${message}`, data);
    }
  }

  /**
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get current session statistics
   */
  getStats() {
    return {
      frameCount: this.frameCount,
      fps: this.calculateFps(),
      uptime: Date.now() - this.startTime,
      isActive: this.isRunning,
    };
  }
}

export default WebcamProctor;
