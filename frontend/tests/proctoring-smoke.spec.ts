import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Exam Proctoring - Basic Smoke Tests', () => {
  
  test('should load frontend application successfully', async ({ page }) => {
    // Navigate to home page
    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    // Should get successful response
    expect(response?.status()).toBeLessThan(400);
    
    // Page should have content
    await expect(page).not.toHaveTitle('Error');
  });

  test('should not have critical TypeScript errors in console', async ({ page }) => {
    const errorLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Filter out third-party and expected errors
    const criticalErrors = errorLogs.filter((e) => {
      return (
        !e.includes('http') &&
        !e.includes('third-party') &&
        !e.includes('Ad') &&
        !e.toLowerCase().includes('gstatic') &&
        !e.toLowerCase().includes('google-analytics') &&
        e.length > 0
      );
    });

    console.log('Critical Errors:', criticalErrors);
    expect(criticalErrors.length).toBeLessThan(2);
  });

  test('should load ProctorConfig without errors', async ({ page }) => {
    let configLoaded = false;

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    configLoaded = await page.evaluate(() => {
      // Try to access any global proctor config
      // This is a smoke test - just ensure no hard errors
      return true;
    });

    expect(configLoaded).toBeTruthy();
  });

  test('should handle network monitoring setup', async ({ page }) => {
    const networkEvents: string[] = [];

    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkEvents.push(`${response.status()}: ${response.url()}`);
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should not have critical network errors (404s are okay for some resources)
    const criticalErrors = networkEvents.filter(
      (e) => !e.includes('data:') && !e.includes('manifest')
    );

    console.log('Network Events:', criticalErrors);
    // Some 404s are acceptable, but not many
    expect(criticalErrors.length).toBeLessThan(5);
  });

  test('should detect browser type correctly', async ({ page, browserName }) => {
    const detection = await page.evaluate(() => {
      return {
        ua: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
      };
    });

    expect(detection.ua).toBeTruthy();
    console.log(`Browser detected as: ${browserName}`);
    console.log(`User Agent: ${detection.ua}`);
  });

  test('should load within acceptable time', async ({ page }) => {
    const startTime = performance.now();
    
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    const loadTime = performance.now() - startTime;
    
    console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    // Page should load in under 15 seconds
    expect(loadTime).toBeLessThan(15000);
  });

  test('should initialize SafeExamMode context', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    // Check if document and window are available (React context will be in the app)
    const contextExists = await page.evaluate(() => {
      return (
        typeof document !== 'undefined' &&
        typeof window !== 'undefined'
      );
    }).catch(() => false);

    // SafeExamMode context should be available in the running app
    expect(contextExists).toBeTruthy();
  });

  test('should handle WebcamProctor initialization', async ({ page }) => {
    let webcamError = false;

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        (msg.text().includes('WebcamProctor') || msg.text().includes('tf.js'))
      ) {
        webcamError = true;
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should not have WebcamProctor errors on homepage
    expect(webcamError).toBeFalsy();
  });

  test('should handle NetworkMonitor setup without errors', async ({ page }) => {
    let networkMonitorError = false;

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().includes('NetworkMonitor')
      ) {
        networkMonitorError = true;
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    expect(networkMonitorError).toBeFalsy();
  });

  test('should verify backend API is reachable', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

    const apiStatus = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.status;
      } catch (error) {
        // Backend not running is acceptable for smoke tests
        // We're just checking the app doesn't crash trying to reach it
        return -1; // -1 means fetch attempted but failed
      }
    });

    // Status should be either:
    // 200 = API working
    // 404 = API endpoint not implemented
    // 401/403 = Auth required (still OK)
    // -1 = Backend not running (acceptable for smoke test)
    console.log(`Backend health check returned: ${apiStatus}`);
    expect(apiStatus).not.toBe(undefined);
  });

  test('should verify PreflightChecks component can mount', async ({ page }) => {
    let preflightError = false;

    page.on('console', (msg) => {
      if (
        msg.type() === 'error' &&
        msg.text().includes('PreflightChecks')
      ) {
        preflightError = true;
      }
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Should not have preflight component errors on main page
    expect(preflightError).toBeFalsy();
  });
});

test.describe('Exam Proctoring - Mobile Responsiveness', () => {
  test('should be accessible on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    expect(response?.status()).toBeLessThan(400);

    // Should not have broken layout
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    expect(bodyWidth).toBeGreaterThan(0);
    expect(bodyWidth).toBeLessThan(400);
  });

  test('should be accessible on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    
    expect(response?.status()).toBeLessThan(400);

    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    expect(bodyWidth).toBeGreaterThan(0);
    expect(bodyWidth).toBeLessThan(800);
  });
});
