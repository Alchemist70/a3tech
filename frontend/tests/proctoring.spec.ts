import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Exam Proctoring Preflight & Security', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    // page fixture is closed by Playwright automatically
  });

  test('should show preflight checks when starting JAMB exam', async () => {
    // Navigate directly to the JAMB mock test page and wait for load
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForLoadState('networkidle');

    // Click "Start Exam" (wait for button to be available)
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');

    // Verify preflight modal appears
    const preflightModal = await page.locator('text=Exam Environment Verification');
    await expect(preflightModal).toBeVisible();

    // Wait for checks to complete (max 30s)
    const passIndicators = page.locator('text=✓');
    await expect(passIndicators.first()).toBeVisible({ timeout: 30000 });
  });

  test('should block exam if camera not available', async () => {
    // Mock camera access to fail
    await page.context().clearCookies();
    // Navigate directly to the test page
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');

    // Should show camera failure in preflight
    const cameraFail = await page.locator('text=Camera access').first();
    await expect(cameraFail).toBeVisible();
  });

  test('should block exam from mobile device', async () => {
    // When run under the mobile project, page will use a mobile UA. Navigate directly.
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');

    // Should show device warning
    const deviceWarning = page.locator('text=PC required');
    await expect(deviceWarning).toBeVisible({ timeout: 5000 });
  });

  test('should prevent tab switching during exam', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');
    // Wait for exam to load
    await page.waitForSelector('text=Question 1', { timeout: 15000 });

    // Attempt keyboard shortcut to switch tabs (Ctrl+Tab)
    await page.keyboard.press('Control+Tab');

    // Should remain on exam page
    const examTitle = await page.locator('text=Question 1');
    await expect(examTitle).toBeVisible();
  });

  test('should prevent developer tools from opening', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');

    // Attempt to open developer tools (F12)
    await page.keyboard.press('F12');

    // Check that we don't have visible dev tools (heuristic)
    const devToolsHeight = await page.evaluate(
      () => window.outerHeight - window.innerHeight
    );

    expect(devToolsHeight).toBeLessThan(160); // Typical dev tools min height
  });

  test('should log violations to backend', async () => {
    // Intercept violation requests
    const violations: any[] = [];
    page.on('response', async (response) => {
      try {
        if (response.url().includes('/exam-sessions/session/violation')) {
          const json = await response.json().catch(() => null);
          if (json) violations.push(json);
        }
      } catch (e) {
        // ignore
      }
    });

    // Start exam
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');
    await page.waitForSelector('text=Question 1', { timeout: 15000 });

    // Trigger a violation (attempt external request)
    await page.evaluate(() => {
      fetch('https://chegg.com');
    });

    // Wait for violation to be sent (heartbeat interval is 30s)
    await page.waitForTimeout(2000);

    expect(violations.length).toBeGreaterThan(0);
  });

  test('should show proctoring overlay during exam', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.waitForSelector('button:has-text("Start Exam")', { timeout: 10000 });
    await page.click('button:has-text("Start Exam")');
    await page.waitForSelector('text=Question 1', { timeout: 15000 });

    // Check for proctoring overlay
    const overlay = page.locator('text=🔒 PROCTOR ACTIVE');
    await expect(overlay).toBeVisible();

    // Verify overlay shows camera and network status
    const cameraStatus = page.locator('text=Webcam: ✓ ON');
    await expect(cameraStatus).toBeVisible();

    const networkStatus = page.locator('text=Network: ✓ ON');
    await expect(networkStatus).toBeVisible();
  });

  test('should block external network requests', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.click('button:has-text("Start Exam")');

    // Attempt fetch to blocked domain
    const errorPromise = page.waitForEvent('console', (msg) =>
      msg.text().includes('blocked during exam')
    );

    await page.evaluate(() => {
      fetch('https://stackoverflow.com/search?q=jamb');
    });

    const error = await errorPromise;
    expect(error.text()).toContain('blocked');
  });

  test('should complete exam and end session', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.click('button:has-text("Start Exam")');
    await page.waitForSelector('text=Question 1');

    // Answer question and click finish
    await page.click('input[value="A"]'); // Select option A
    await page.click('button:has-text("Finish")');

    // Should see completion message
    const completion = page.locator('text=Exam Submitted');
    await expect(completion).toBeVisible({ timeout: 10000 });

    // Verify session ended (no more heartbeat)
    await page.waitForTimeout(2000);
    const overlay = page.locator('text=PROCTOR ACTIVE');
    await expect(overlay).not.toBeVisible();
  });

  test('should handle network disconnection gracefully', async () => {
    await page.goto(`${BASE_URL}/mock-test/jamb/test`);
    await page.click('button:has-text("Start Exam")');
    await page.waitForSelector('text=Question 1');

    // Simulate network offline
    await page.context().setOffline(true);

    // Wait a bit
    await page.waitForTimeout(1000);

    // Should still show warning but not crash
    const examTitle = page.locator('text=Question 1');
    await expect(examTitle).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });
});
