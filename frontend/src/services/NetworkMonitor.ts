/**
 * Network Request Monitor - Prevents network-based cheating
 * Monitors and blocks suspicious network requests during exam
 */

import { ProctorThresholds, DEFAULT_PROCTOR_THRESHOLDS } from '../config/ProctorConfig';

export interface NetworkRequest {
  method: string;
  url: string;
  timestamp: Date;
  blocked: boolean;
  reason?: string;
}

export interface NetworkMonitorConfig {
  sessionId: string;
  onSuspiciousRequest: (request: NetworkRequest) => Promise<void>;
  allowedDomains?: string[];
  blockAllExternalRequests?: boolean;
  thresholds?: ProctorThresholds;
}

interface RequestInterceptor {
  (request: NetworkRequest): Promise<boolean>; // Return true to allow, false to block
}

export class NetworkMonitor {
  private sessionId: string;
  private onSuspiciousRequest: (request: NetworkRequest) => Promise<void>;
  private allowedDomains: Set<string>;
  private blockAllExternal: boolean;
  private interceptors: RequestInterceptor[] = [];
  private requestHistory: NetworkRequest[] = [];
  private maxHistorySize: number = 1000;
  private suspiciousPatterns: RegExp[] = [];
  private originalFetch: typeof fetch | null = null;
  private originalXhr: typeof XMLHttpRequest | null = null;
  private thresholds: ProctorThresholds;

  constructor(config: NetworkMonitorConfig) {
    this.sessionId = config.sessionId;
    this.onSuspiciousRequest = config.onSuspiciousRequest;
    this.blockAllExternal = config.blockAllExternalRequests !== undefined
      ? config.blockAllExternalRequests
      : config.thresholds?.blockAllExternalRequests ?? DEFAULT_PROCTOR_THRESHOLDS.blockAllExternalRequests;
    this.thresholds = config.thresholds || DEFAULT_PROCTOR_THRESHOLDS;

    // Default allowed domains
    const defaults = [
      window.location.hostname,
      'localhost',
      '127.0.0.1',
      'cdn.jsdelivr.net',
      'cdnjs.cloudflare.com',
      'cdn.tailwindcss.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'unpkg.com',
    ];

    this.allowedDomains = new Set([...defaults, ...(config.allowedDomains || [])]);

    // Initialize suspicious patterns
    this.initializeSuspiciousPatterns();
  }

  /**
   * Initialize patterns that indicate cheating
   */
  private initializeSuspiciousPatterns(): void {
    this.suspiciousPatterns = [
      /chegg|brainly|stackoverflow|github|chatgpt|openai/i, // Answer sites
      /exam|test|quiz|answer.*bank/i, // Exam-related keywords
      /screenshot|clip|share|pastebin|paste\.ee/i, // Content sharing
      /vpn|proxy|tor|anonymizer/i, // Privacy tools
      /remote.*desktop|teamviewer|chrome.*remote/i, // Remote access
      /recording|stream|broadcast/i, // Recording tools
    ];
  }

  /**
   * Start monitoring network requests
   */
  start(): void {
    this.interceptFetch();
    this.interceptXHR();
    this.blockWindowOpen();
    this.blockNavigationEvents();

    console.log('[NetworkMonitor] Monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.restoreFetch();
    this.restoreXHR();
    console.log('[NetworkMonitor] Monitoring stopped');
  }

  /**
   * Intercept Fetch API calls
   */
  private interceptFetch(): void {
    this.originalFetch = window.fetch;

    window.fetch = (async (...args: any[]): Promise<Response> => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      const method = args[1]?.method || 'GET';

      const request: NetworkRequest = {
        method,
        url,
        timestamp: new Date(),
        blocked: false,
      };

      // Check if request should be allowed
      const allowed = await this.evaluateRequest(request);

      if (!allowed) {
        request.blocked = true;
        await this.onSuspiciousRequest(request);
        throw new Error(`Network request blocked during exam: ${url}`);
      }

      // Allow request to proceed
      try {
        // Use apply to avoid spread tuple errors with older TS targets
        return await (this.originalFetch as any).apply(window, args);
      } catch (error) {
        throw error;
      }
    }) as typeof fetch;
  }

  /**
   * Restore original Fetch API
   */
  private restoreFetch(): void {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
    }
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    this.originalXhr = window.XMLHttpRequest;
    const monitor = this;

    // Create proxy for XMLHttpRequest
    window.XMLHttpRequest = function (...args: any[]) {
      // Construct the original XHR instance using Reflect.construct to support dynamic args
      const xhr: any = Reflect.construct(monitor.originalXhr!, args);
      const originalOpen = xhr.open;

      xhr.open = function (method: string, url: string, ...rest: any[]) {
        const request: NetworkRequest = {
          method,
          url,
          timestamp: new Date(),
          blocked: false,
        };

        // Evaluate request asynchronously
        (async () => {
          const allowed = await monitor.evaluateRequest(request);
          if (!allowed) {
            request.blocked = true;
            await monitor.onSuspiciousRequest(request);
            xhr.abort();
          }
        })();

        // Use apply to avoid spread tuple restrictions
        return originalOpen.apply(xhr, [method, url, ...rest]);
      };

      return xhr;
    } as any;

    // Copy properties from original XMLHttpRequest
    Object.assign(window.XMLHttpRequest, this.originalXhr);
  }

  /**
   * Restore original XMLHttpRequest
   */
  private restoreXHR(): void {
    if (this.originalXhr) {
      window.XMLHttpRequest = this.originalXhr;
    }
  }

  /**
   * Block window.open() to prevent opening new tabs
   */
  private blockWindowOpen(): void {
    const originalOpen = window.open;

    window.open = function (...args: any[]): Window | null {
      console.warn('[NetworkMonitor] window.open() blocked during exam');
      return null;
    };
  }

  /**
   * Block navigation to new pages
   */
  private blockNavigationEvents(): void {
    // Block beforeunload
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = '';
    });

    // Block history changes
    window.addEventListener('popstate', (e) => {
      e.preventDefault();
      history.pushState(null, '', window.location.href);
    });

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('a');
      if (target && target.href) {
        const href = target.href;
        const currentDomain = window.location.hostname;
        const targetDomain = new URL(href, window.location.href).hostname;

        if (targetDomain !== currentDomain && !this.isAllowedDomain(targetDomain)) {
          e.preventDefault();
          console.warn(`[NetworkMonitor] Navigation blocked to ${href}`);

          this.onSuspiciousRequest({
            method: 'NAVIGATION',
            url: href,
            timestamp: new Date(),
            blocked: true,
            reason: 'External navigation attempt',
          });
        }
      }
    });
  }

  /**
   * Evaluate if a network request is allowed
   */
  private async evaluateRequest(request: NetworkRequest): Promise<boolean> {
    // Track request
    this.requestHistory.push(request);
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory.shift();
    }

    // Run custom interceptors
    for (const interceptor of this.interceptors) {
      const allowed = await interceptor(request);
      if (!allowed) {
        return false;
      }
    }

    // Check URL against suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(request.url)) {
        console.warn(`[NetworkMonitor] Suspicious URL pattern detected: ${request.url}`);
        return false;
      }
    }

    // Check domain
    try {
      const url = new URL(request.url, window.location.href);
      const hostname = url.hostname;

      // Allow same domain
      if (hostname === window.location.hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }

      // Check against allowed domains
      if (this.isAllowedDomain(hostname)) {
        return true;
      }

      // Block if configured to block all external
      if (this.blockAllExternal) {
        console.warn(`[NetworkMonitor] External request blocked: ${hostname}`);
        return false;
      }

      // Block by default for unknown domains
      if (!this.isAllowedDomain(hostname)) {
        console.warn(`[NetworkMonitor] Unknown external domain blocked: ${hostname}`);
        return false;
      }
    } catch (error) {
      console.warn(`[NetworkMonitor] Could not parse URL: ${request.url}`);
      return false;
    }

    return true;
  }

  /**
   * Check if domain is allowed
   */
  private isAllowedDomain(domain: string): boolean {
    // Check exact matches
    if (this.allowedDomains.has(domain)) {
      return true;
    }

    // Check wildcard domains (e.g., *.example.com)
    for (const allowed of Array.from(this.allowedDomains)) {
      if (allowed.startsWith('*.')) {
        const wildcard = allowed.slice(2);
        if (domain.endsWith(wildcard) || domain === wildcard) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Add custom request interceptor
   */
  addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  /**
   * Add allowed domain
   */
  addAllowedDomain(domain: string): void {
    this.allowedDomains.add(domain);
  }

  /**
   * Get request history
   */
  getRequestHistory(): NetworkRequest[] {
    return [...this.requestHistory];
  }

  /**
   * Get suspicious requests only
   */
  getSuspiciousRequests(): NetworkRequest[] {
    return this.requestHistory.filter((req) => req.blocked);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.requestHistory = [];
  }

  /**
   * Disable clipboard operations
   */
  disableClipboard(): void {
    document.addEventListener('copy', (e) => {
      e.preventDefault();
      console.warn('[NetworkMonitor] Copy disabled during exam');
    });

    document.addEventListener('cut', (e) => {
      e.preventDefault();
      console.warn('[NetworkMonitor] Cut disabled during exam');
    });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      console.warn('[NetworkMonitor] Paste disabled during exam');
    });

    // Disable drag and drop
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      console.warn('[NetworkMonitor] Drag and drop disabled during exam');
    });
  }

  /**
   * Disable browser storage access
   */
  disableStorageAccess(): void {
    const proxy = new Proxy(localStorage, {
      get: (target, prop) => {
        if (prop === 'setItem' || prop === 'removeItem' || prop === 'clear') {
          console.warn(`[NetworkMonitor] localStorage.${String(prop)} blocked during exam`);
          return () => {};
        }
        return (target as any)[prop];
      },
    });

    // Note: Cannot fully replace localStorage, but we can track attempts
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key: string, value: string) {
      console.warn(`[NetworkMonitor] localStorage write attempt blocked: ${key}`);
      throw new Error('localStorage access disabled during exam');
    };
  }
}

export default NetworkMonitor;
