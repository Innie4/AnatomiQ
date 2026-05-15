import { test, expect } from '@playwright/test';
import { getEnvValue } from './test-env';

test.describe('Admin Login Flow', () => {
  const adminKey = getEnvValue('ADMIN_UPLOAD_KEY');

  test('should login with valid credentials', async ({ page }) => {
    test.skip(!adminKey, 'ADMIN_UPLOAD_KEY is required for the valid admin login e2e test.');
    await page.goto('/upload');

    // Enter admin key
    await page.fill('input[type="password"]', adminKey || '');
    await page.click('button:has-text("Continue")');

    // Verify dashboard loads
    await expect(page.locator('text=Total materials')).toBeVisible();
    await expect(page.locator('text=Material upload and processing dashboard')).toBeVisible();
  });

  test('should reject invalid admin key', async ({ page }) => {
    await page.goto('/upload');

    await page.fill('input[type="password"]', 'invalid-key-12345');
    await page.click('button:has-text("Continue")');

    // Should show error
    await expect(page.locator('text=/unauthorized|invalid|error/i')).toBeVisible();
  });

  test('should keep admin key masked before submit', async ({ page }) => {
    await page.goto('/upload');

    const input = page.getByPlaceholder('Enter admin key');

    await expect(input).toHaveAttribute('type', 'password');
  });
});
