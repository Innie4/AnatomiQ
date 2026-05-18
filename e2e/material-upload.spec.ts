import { test, expect } from '@playwright/test';
import { UploadPage } from './pages/upload.page';
import path from 'path';
import fs from 'fs';
import { getEnvValue } from './test-env';

test.describe('Material Upload and Processing', () => {
  test.setTimeout(120000);

  const adminKey = getEnvValue('ADMIN_UPLOAD_KEY');
  test.skip(!adminKey, 'ADMIN_UPLOAD_KEY is required for material upload e2e tests.');

  test.beforeEach(async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.authenticate(adminKey || '');
  });

  test('should display admin dashboard stats', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.gotoDashboard();
    await uploadPage.verifyDashboardStats();

    const totalMaterials = await page.getByText(/total materials/i).locator('..').locator('..').locator('p.text-4xl').textContent();
    expect(Number(totalMaterials?.replace(/,/g, ''))).toBeGreaterThanOrEqual(0);
  });

  test('should show material upload form', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.gotoUploadForm();

    await expect(page.getByRole('textbox', { name: /^Title/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Course Name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Topic/i })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeVisible();
  });

  test('should validate required fields before upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.gotoUploadForm();

    await expect(page.getByRole('button', { name: /upload and process/i })).toBeDisabled();
  });

  test('should upload a text file and process it', async ({ page }) => {
    const testFilePath = path.join(process.cwd(), 'test-results', 'e2e-test-material.txt');
    const testFileDir = path.dirname(testFilePath);
    let uploadedMaterialId: string | null = null;

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
    await uploadPage.gotoUploadForm();

    await uploadPage.fillMaterialForm({
      title: 'E2E Test Material',
      course: 'GENERAL BIOCHEMISTRY II',
      courseCode: 'MBC 221',
      topic: 'AMINO ACID METABOLISM',
    });

    await uploadPage.uploadFile(testFilePath);
    try {
      const uploadResponsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/upload-material') && response.request().method() === 'POST',
      );
      const processResponsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/process-material') && response.request().method() === 'POST',
      );

      await uploadPage.submitUpload();
      const uploadResponse = await uploadResponsePromise;
      const uploadPayload = await uploadResponse.json().catch(() => null) as { error?: string; material?: { id?: string } } | null;
      uploadedMaterialId = uploadPayload?.material?.id ?? null;
      expect(uploadResponse.ok(), uploadPayload?.error || 'Material upload request failed').toBeTruthy();

      const processResponse = await processResponsePromise;
      const processPayload = await processResponse.json().catch(() => null) as { error?: string } | null;
      expect(processResponse.ok(), processPayload?.error || 'Material processing request failed').toBeTruthy();

      await uploadPage.waitForProcessingComplete();

      await expect(page.getByText('Characters')).toBeVisible();
      await expect(page.getByText('Chunks')).toBeVisible();
      await expect(page.getByText('Method')).toBeVisible();
    } finally {
      if (uploadedMaterialId) {
        const deleteResponse = await page.request.delete('/api/delete-material', {
          headers: {
            'Content-Type': 'application/json',
            'x-admin-upload-key': adminKey || '',
          },
          data: { materialId: uploadedMaterialId },
        });
        expect(deleteResponse.ok()).toBeTruthy();
      }

      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('should display recent materials list', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.gotoMaterialsManager();

    await expect(page.getByText(/view, search, and delete uploaded materials/i)).toBeVisible();
    await expect(page.getByPlaceholder(/search materials/i)).toBeVisible();
  });

  test('should show topic coverage grid', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.gotoDashboard();

    await expect(page.getByText(/system statistics and recent activity/i)).toBeVisible({ timeout: 30000 });
  });
});
