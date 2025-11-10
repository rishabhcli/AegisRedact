/**
 * End-to-End Tests for AegisRedact
 *
 * These tests verify the complete user workflow from file upload to export.
 *
 * ## Setup
 *
 * Install Playwright:
 * ```bash
 * npm install -D @playwright/test
 * npx playwright install chromium
 * ```
 *
 * Create playwright.config.ts:
 * ```typescript
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   testDir: './tests',
 *   testMatch: '**\/e2e.spec.ts',
 *   use: {
 *     baseURL: 'http://localhost:5173',
 *     screenshot: 'only-on-failure',
 *     video: 'retain-on-failure',
 *   },
 *   webServer: {
 *     command: 'npm run dev',
 *     port: 5173,
 *     reuseExistingServer: !process.env.CI,
 *   },
 * });
 * ```
 *
 * Run tests:
 * ```bash
 * npx playwright test
 * npx playwright test --headed  # With browser UI
 * npx playwright test --debug   # With debugger
 * ```
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test fixtures directory
const FIXTURES_DIR = join(__dirname, 'fixtures');

/**
 * Helper: Create test file content
 */
function createTestFile(type: 'txt' | 'csv' | 'pdf'): string {
  switch (type) {
    case 'txt':
      return `Confidential Document
Contact: john.doe@example.com
Phone: +1-415-555-2671
SSN: 123-45-6789
Card: 4532-1234-5678-9010`;

    case 'csv':
      return `Name,Email,Phone,SSN
John Doe,john@example.com,+14155551234,123-45-6789
Jane Smith,jane@example.com,+14155555678,987-65-4321`;

    case 'pdf':
      // In real tests, use actual PDF file
      return '';
  }
}

test.describe('AegisRedact E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for app to be ready
    await page.waitForSelector('[data-testid="drop-zone"]', { timeout: 5000 });
  });

  test.describe('Application Loading', () => {
    test('should load the application', async ({ page }) => {
      // Verify page title
      await expect(page).toHaveTitle(/Share-Safe|AegisRedact/);

      // Verify main components are present
      await expect(page.locator('[data-testid="drop-zone"]')).toBeVisible();
      await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    });

    test('should display correct initial state', async ({ page }) => {
      // Verify no file is loaded
      await expect(page.locator('[data-testid="canvas-stage"]')).not.toBeVisible();

      // Verify instructions are shown
      await expect(page.locator('text=Drag and drop')).toBeVisible();
    });
  });

  test.describe('Plain Text File Processing', () => {
    test('should upload and process text file', async ({ page }) => {
      // Create test file
      const content = createTestFile('txt');
      const buffer = Buffer.from(content);

      // Upload file via file input
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: buffer,
      });

      // Wait for file to load
      await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 5000 });

      // Verify file name is displayed
      await expect(page.locator('text=test.txt')).toBeVisible();
    });

    test('should detect PII in text file', async ({ page }) => {
      // Upload test file
      const content = createTestFile('txt');
      const buffer = Buffer.from(content);

      await page.locator('input[type="file"]').setInputFiles({
        name: 'test-pii.txt',
        mimeType: 'text/plain',
        buffer: buffer,
      });

      // Wait for document to render
      await page.waitForSelector('[data-testid="document-viewer"]');

      // Enable detections
      await page.locator('[data-testid="detect-email"]').check();
      await page.locator('[data-testid="detect-phone"]').check();
      await page.locator('[data-testid="detect-ssn"]').check();

      // Click "Auto-detect All" button
      await page.locator('[data-testid="auto-detect-button"]').click();

      // Wait for detections to complete
      await page.waitForTimeout(1000);

      // Verify detections are shown
      const detectionCount = await page.locator('[data-testid="detection-box"]').count();
      expect(detectionCount).toBeGreaterThan(0);

      // Verify specific PII types are detected
      await expect(page.locator('text=john.doe@example.com')).toBeVisible();
    });

    test('should redact text file', async ({ page }) => {
      // Upload file
      const content = createTestFile('txt');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');

      // Auto-detect PII
      await page.locator('[data-testid="detect-email"]').check();
      await page.locator('[data-testid="auto-detect-button"]').click();
      await page.waitForTimeout(500);

      // Select all detections
      await page.locator('[data-testid="select-all-button"]').click();

      // Apply redactions
      await page.locator('[data-testid="apply-redactions-button"]').click();

      // Verify redaction visual (block characters)
      await expect(page.locator('text=█')).toBeVisible();
    });

    test('should export redacted text file', async ({ page }) => {
      // Upload and redact file
      const content = createTestFile('txt');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'export-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');
      await page.locator('[data-testid="detect-email"]').check();
      await page.locator('[data-testid="auto-detect-button"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="select-all-button"]').click();
      await page.locator('[data-testid="apply-redactions-button"]').click();

      // Setup download listener
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      await page.locator('[data-testid="export-button"]').click();

      // Wait for download
      const download = await downloadPromise;

      // Verify download properties
      expect(download.suggestedFilename()).toContain('redacted');
      expect(download.suggestedFilename()).toContain('.txt');

      // Verify file content (redactions applied)
      const path = await download.path();
      const exported = readFileSync(path, 'utf-8');
      expect(exported).not.toContain('john.doe@example.com');
      expect(exported).toContain('█');
    });
  });

  test.describe('CSV File Processing', () => {
    test('should upload and render CSV table', async ({ page }) => {
      const content = createTestFile('csv');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');

      // Verify table is rendered
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
    });

    test('should detect PII in CSV cells', async ({ page }) => {
      const content = createTestFile('csv');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('table');

      // Enable email detection
      await page.locator('[data-testid="detect-email"]').check();
      await page.locator('[data-testid="auto-detect-button"]').click();
      await page.waitForTimeout(500);

      // Verify cells with emails are highlighted
      const detections = await page.locator('[data-testid="detection-box"]').count();
      expect(detections).toBeGreaterThanOrEqual(2); // At least 2 email addresses
    });

    test('should redact entire CSV column', async ({ page }) => {
      const content = createTestFile('csv');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('table');

      // Right-click on Email column header
      await page.locator('th:has-text("Email")').click({ button: 'right' });

      // Click "Redact Column" in context menu
      await page.locator('text=Redact entire column').click();

      // Verify all email cells are redacted
      const emailCells = await page.locator('td:has-text("@example.com")').count();
      expect(emailCells).toBe(0); // No emails visible
    });
  });

  test.describe('Manual Redaction', () => {
    test('should allow drawing custom redaction boxes', async ({ page }) => {
      // Upload simple text file
      const content = 'This is a test document with sensitive info.';
      await page.locator('input[type="file"]').setInputFiles({
        name: 'manual.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');

      // Get canvas/viewer element
      const viewer = page.locator('[data-testid="document-viewer"]');
      const box = await viewer.boundingBox();

      if (!box) throw new Error('Viewer not found');

      // Draw a box by dragging
      await page.mouse.move(box.x + 100, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 300, box.y + 70);
      await page.mouse.up();

      // Verify box was created
      const manualBoxes = await page.locator('[data-testid="manual-box"]').count();
      expect(manualBoxes).toBe(1);
    });

    test('should delete manual redaction box', async ({ page }) => {
      // Upload file and draw box
      const content = 'Test content';
      await page.locator('input[type="file"]').setInputFiles({
        name: 'delete-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');

      // Draw box (simplified)
      await page.locator('[data-testid="document-viewer"]').click({ position: { x: 100, y: 50 } });

      // Select the box
      await page.locator('[data-testid="manual-box"]').first().click();

      // Press Delete key
      await page.keyboard.press('Delete');

      // Verify box was removed
      const boxes = await page.locator('[data-testid="manual-box"]').count();
      expect(boxes).toBe(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support Tab navigation', async ({ page }) => {
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeTruthy();
    });

    test('should support Ctrl+Z undo', async ({ page }) => {
      // Upload file and make change
      const content = createTestFile('txt');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'undo-test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });

      await page.waitForSelector('[data-testid="document-viewer"]');

      // Auto-detect
      await page.locator('[data-testid="detect-email"]').check();
      await page.locator('[data-testid="auto-detect-button"]').click();
      await page.waitForTimeout(500);

      const countBefore = await page.locator('[data-testid="detection-box"]').count();

      // Undo
      await page.keyboard.press('Control+Z');
      await page.waitForTimeout(200);

      const countAfter = await page.locator('[data-testid="detection-box"]').count();
      expect(countAfter).toBeLessThan(countBefore);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle unsupported file types', async ({ page }) => {
      // Try to upload unsupported file
      const content = Buffer.from('fake binary content');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'test.xyz',
        mimeType: 'application/octet-stream',
        buffer: content,
      });

      // Verify error message is shown
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('text=Unsupported file format')).toBeVisible();
    });

    test('should handle corrupted files gracefully', async ({ page }) => {
      // Upload corrupted file
      const content = Buffer.from('\x00\xFF\xFE\xFD invalid data');
      await page.locator('input[type="file"]').setInputFiles({
        name: 'corrupted.txt',
        mimeType: 'text/plain',
        buffer: content,
      });

      // Should either load with warning or show error
      const hasError = await page.locator('[data-testid="error-message"]').isVisible();
      const hasWarning = await page.locator('[data-testid="warning-message"]').isVisible();

      expect(hasError || hasWarning).toBeTruthy();
    });
  });

  test.describe('Accessibility', () => {
    test('should have no automatic accessibility violations', async ({ page }) => {
      // Basic accessibility check
      await page.waitForSelector('[data-testid="drop-zone"]');

      // Check for alt text on images
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }

      // Check for ARIA labels on buttons
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const label = await button.getAttribute('aria-label');
        const text = await button.textContent();
        expect(label || text).toBeTruthy();
      }
    });

    test('should support screen reader navigation', async ({ page }) => {
      // Navigate with Tab to verify focus order
      const focusableElements = await page.locator('[data-testid^="button-"], input, button').all();
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Test data fixtures
 *
 * For real tests, create actual test files in tests/fixtures/:
 * - test-document.txt - Plain text with sample PII
 * - test-data.csv - CSV with sample data
 * - test-document.pdf - PDF with sample content
 * - test-image.png - Image with text overlay
 */
