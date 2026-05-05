import { test, expect } from '@playwright/test';
import { UploadPage } from './pages/upload.page';
import path from 'path';
import fs from 'fs';

test.describe('Material Upload and Processing', () => {
  test.beforeEach(async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();
    await uploadPage.unlockDashboard(process.env.ADMIN_UPLOAD_KEY || 'test-key');
  });

  test('should display admin dashboard stats', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.verifyDashboardStats();

    // Verify stats are numbers
    const totalMaterials = await page.locator('text=Total materials').locator('..').locator('..').locator('p.text-4xl').textContent();
    expect(Number(totalMaterials?.replace(/,/g, ''))).toBeGreaterThanOrEqual(0);
  });

  test('should show material upload form', async ({ page }) => {
    await expect(page.locator('input[aria-label="Material title"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Course name"]')).toBeVisible();
    await expect(page.locator('input[aria-label="Topic name"]')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should validate required fields before upload', async ({ page }) => {
    // Try to upload without file
    await page.click('button:has-text("Upload and process")');

    // Should show error about missing fields
    await expect(page.locator('text=/required|select|enter/i')).toBeVisible({ timeout: 5000 });
  });

  test('should upload a text file and process it', async ({ page }) => {
    // Create a temporary test file
    const testFilePath = path.join(process.cwd(), 'e2e', 'fixtures', 'test-material.txt');
    const testFileDir = path.dirname(testFilePath);

    if (!fs.existsSync(testFileDir)) {
      fs.mkdirSync(testFileDir, { recursive: true });
    }

    fs.writeFileSync(testFilePath, `
      Test Anatomy Material

      This is a test document about the human skeletal system.
      The skeletal system provides structure and support for the body.
      It consists of bones, cartilage, ligaments, and tendons.

      Key functions include:
      1. Support and shape
      2. Protection of organs
      3. Movement facilitation
      4. Mineral storage
      5. Blood cell production
    `);

    const uploadPage = new UploadPage(page);

    await uploadPage.fillMaterialForm({
      title: 'E2E Test Material',
      course: 'Human Anatomy',
      topic: 'General Anatomy',
      subtopic: 'Body Organization',
    });

    await uploadPage.uploadFile(testFilePath);
    await uploadPage.submitUpload();

    // Wait for processing to complete
    await uploadPage.waitForProcessingComplete();

    // Verify processing stats appear
    await expect(page.locator('text=Characters')).toBeVisible();
    await expect(page.locator('text=Chunks')).toBeVisible();
    await expect(page.locator('text=Method')).toBeVisible();

    // Cleanup
    fs.unlinkSync(testFilePath);
  });

  test('should display recent materials list', async ({ page }) => {
    await expect(page.locator('text=Recent materials')).toBeVisible();
    await expect(page.locator('text=Latest upload activity')).toBeVisible();
  });

  test('should show topic coverage grid', async ({ page }) => {
    await expect(page.locator('text=Topic coverage')).toBeVisible();
    await expect(page.locator('text=Where the source library is strongest')).toBeVisible();
  });
});
