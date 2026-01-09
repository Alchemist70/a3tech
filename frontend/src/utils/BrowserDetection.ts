/**
 * Lockdown Browser Detection Utility
 * Detects if exam is running in secure exam environments
 */

export interface BrowserInfo {
  name: string;
  version: string;
  userAgent: string;
  isLockdownBrowser: boolean;
  isRespondusMonitor: boolean;
  isFullscreenCapable: boolean;
  isFullscreenMode: boolean;
  canAccessCamera: boolean;
  canAccessMicrophone: boolean;
  canDisableCopyPaste: boolean;
}

/**
 * Detect if running in LockDown Browser
 */
const detectLockdownBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();

  // LockDown Browser specific user agent strings and behaviors
  const lockdownIndicators = [
    ua.includes('lockdown'),
    ua.includes('respondus'),
    ua.includes('examplify'),
    // Check for specific window properties
    (window as any).respondusLDB !== undefined,
    (window as any).LDB !== undefined,
    // Check for specific Chrome extensions that only run in LDB
    (window as any).secureExam !== undefined,
  ];

  return lockdownIndicators.some((indicator) => indicator === true);
};

/**
 * Detect if running in Respondus Monitor
 */
const detectRespondusMonitor = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();

  // Respondus Monitor specific indicators
  const respondusIndicators = [
    ua.includes('respondus'),
    ua.includes('proctortrack'),
    ua.includes('examity'),
    ua.includes('exammonitor'),
    // Check for monitor-specific window properties
    (window as any).respondusMonitor !== undefined,
    (window as any).proctorAPIAvailable !== undefined,
  ];

  return respondusIndicators.some((indicator) => indicator === true);
};

/**
 * Get detailed browser information
 */
export const getBrowserInfo = async (): Promise<BrowserInfo> => {
  const ua = navigator.userAgent;

  // Parse browser name and version
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Chrome') && !ua.includes('Chromium')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Safari')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Edge')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || 'Unknown';
  } else if (ua.includes('Opera')) {
    browserName = 'Opera';
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] || 'Unknown';
  }

  // Check fullscreen capability
  const isFullscreenCapable =
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled ||
    false;

  // Check fullscreen mode
  const isFullscreenMode =
    !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

  // Check camera access permission
  let canAccessCamera = false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    canAccessCamera = devices.some((device) => device.kind === 'videoinput');
  } catch (error) {
    // If error, assume can access (permission may be granted on request)
    canAccessCamera = true;
  }

  // Check microphone access permission
  let canAccessMicrophone = false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    canAccessMicrophone = devices.some((device) => device.kind === 'audioinput');
  } catch (error) {
    canAccessMicrophone = true;
  }

  // Check copy-paste disable capability
  const canDisableCopyPaste =
    document.oncontextmenu !== null ||
    document.oncopy !== null ||
    document.oncut !== null ||
    document.onpaste !== null;

  return {
    name: browserName,
    version: browserVersion,
    userAgent: ua,
    isLockdownBrowser: detectLockdownBrowser(),
    isRespondusMonitor: detectRespondusMonitor(),
    isFullscreenCapable,
    isFullscreenMode,
    canAccessCamera,
    canAccessMicrophone,
    canDisableCopyPaste,
  };
};

/**
 * Get risk assessment for browser environment
 */
export const assessBrowserRisk = async (): Promise<{ score: number; warnings: string[] }> => {
  const info = await getBrowserInfo();
  let riskScore = 0;
  const warnings: string[] = [];

  // Risk factors
  if (!info.isLockdownBrowser && !info.isRespondusMonitor) {
    riskScore += 30;
    warnings.push('Not using dedicated lockdown browser');
  }

  if (!info.isFullscreenMode) {
    riskScore += 15;
    warnings.push('Not in fullscreen mode');
  }

  if (!info.canAccessCamera) {
    riskScore += 20;
    warnings.push('Cannot access camera for monitoring');
  }

  // Risky browsers
  if (info.name === 'Firefox' || info.name === 'Opera') {
    riskScore += 10;
    warnings.push(`${info.name} browser (less secure for exams)`);
  }

  return {
    score: Math.min(riskScore, 100),
    warnings,
  };
};

/**
 * Disable copy-paste functionality
 */
export const disableCopyPaste = (): void => {
  document.addEventListener('copy', (e) => {
    e.preventDefault();
    console.warn('Copy disabled during exam');
  });

  document.addEventListener('cut', (e) => {
    e.preventDefault();
    console.warn('Cut disabled during exam');
  });

  document.addEventListener('paste', (e) => {
    e.preventDefault();
    console.warn('Paste disabled during exam');
  });
};

/**
 * Disable text selection
 */
export const disableTextSelection = (): void => {
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  (document.body.style as any).mozUserSelect = 'none';
  (document.body.style as any).msUserSelect = 'none';
};

/**
 * Detect screen sharing or recording
 */
export const detectScreenSharing = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Try to get screen display media to see if already in use
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((stream) => {
        // User granted permission to share, so nothing was already sharing
        stream.getTracks().forEach((track) => track.stop());
        resolve(false);
      })
      .catch(() => {
        // User denied or error occurred
        resolve(true); // Assume already sharing
      });
  });
};

/**
 * Check for virtual machine or emulator
 */
export const detectVirtualEnvironment = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();

  const vmIndicators = [
    ua.includes('virtualbox'),
    ua.includes('vmware'),
    ua.includes('hyperv'),
    ua.includes('xen'),
    ua.includes('kvm'),
    ua.includes('parallels'),
    // Screen resolution commonly used in VMs
    window.screen.availWidth === 1024 && window.screen.availHeight === 768,
    window.screen.availWidth === 800 && window.screen.availHeight === 600,
    // Device memory (VMs often report low memory)
    ((navigator as any).deviceMemory || 0) < 2,
  ];

  return vmIndicators.filter(Boolean).length > 2;
};

/**
 * Check browser plugins and extensions
 */
export const detectSuspiciousExtensions = (): string[] => {
  const suspiciousExtensions: string[] = [];

  // Check for known suspicious extensions
  // Note: _suspiciousKeywords kept for future extension validation
  // const _suspiciousKeywords = [
  //   'vpn', 'proxy', 'anonymizer', 'answer', 'cheat',
  //   'homework', 'auto-answer', 'auto-fill', 'password-manager',
  // ];

  // Note: Direct access to extensions list is restricted in modern browsers
  // This is a limited check based on observable behaviors
  try {
    // Check if certain APIs are available (extension indicators)
    if ((window as any).chrome?.runtime?.id) {
      suspiciousExtensions.push('Chrome extension environment detected');
    }
  } catch (e) {
    // Ignore
  }

  return suspiciousExtensions;
};

/**
 * Full security assessment
 */
export const performSecurityAssessment = async (): Promise<{
  overall: number;
  categories: {
    browser: number;
    environment: number;
    permissions: number;
    detection: number;
  };
  issues: string[];
  recommendation: 'safe' | 'caution' | 'blocked';
}> => {
  const browserInfo = await getBrowserInfo();
  const browserRisk = await assessBrowserRisk();
  const isVirtual = detectVirtualEnvironment();
  const extensions = detectSuspiciousExtensions();

  let issues: string[] = [];

  // Add warnings
  issues.push(...browserRisk.warnings);

  // Virtual environment
  if (isVirtual) {
    issues.push('Virtual machine or emulator detected');
  }

  // Suspicious extensions
  if (extensions.length > 0) {
    issues.push(...extensions);
  }

  // Calculate category scores
  const categoryScores = {
    browser: browserInfo.isLockdownBrowser || browserInfo.isRespondusMonitor ? 0 : 40,
    environment: isVirtual ? 40 : 0,
    permissions: !browserInfo.canAccessCamera ? 30 : 0,
    detection: extensions.length > 0 ? 30 : 0,
  };

  const overallScore = Math.min(Object.values(categoryScores).reduce((a, b) => a + b, 0), 100);

  let recommendation: 'safe' | 'caution' | 'blocked' = 'safe';
  if (overallScore > 70) {
    recommendation = 'blocked';
  } else if (overallScore > 40) {
    recommendation = 'caution';
  }

  return {
    overall: overallScore,
    categories: categoryScores,
    issues,
    recommendation,
  };
};

const BrowserDetectionModule = {
  getBrowserInfo,
  assessBrowserRisk,
  disableCopyPaste,
  disableTextSelection,
  detectScreenSharing,
  detectVirtualEnvironment,
  detectSuspiciousExtensions,
  performSecurityAssessment,
};

export default BrowserDetectionModule;
