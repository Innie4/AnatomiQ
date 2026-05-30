import { test, expect } from '@playwright/test';
import { getEnvValue } from './test-env';

test.describe('Admin Login Flow', () => {
  const adminKey = getEnvValue('ADMIN_UPLOAD_KEY');

  test('should login with valid credentials', async ({ page }) => {
    test.skip(!adminKey, 'ADMIN_UPLOAD_KEY is required for the valid admin login e2e test.');

    await page.goto('/upload');
    await page.getByLabel('Admin upload key').fill(adminKey || '');
    await page.getByRole('button', { name: /unlock dashboard/i }).click();

    await expect(page).toHaveURL(/.*\/upload\/dashboard/, { timeout: 30000 });
    await expect(page.getByRole('heading', { name: /dashboard overview/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/total materials/i)).toBeVisible({ timeout: 30000 });
  });

  test('should reject invalid admin key', async ({ page }) => {
    await page.goto('/upload');

    await page.getByLabel('Admin upload key').fill('invalid-key-12345');
    await page.getByRole('button', { name: /unlock dashboard/i }).click();

    await expect(page.getByText(/invalid admin key/i)).toBeVisible();
  });

  test('should show/hide admin key with eye toggle', async ({ page }) => {
    await page.goto('/upload');

    const input = page.getByLabel('Admin upload key');
    await expect(input).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /show admin key/i }).click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /hide admin key/i }).click();
    await expect(input).toHaveAttribute('type', 'password');
  });
});
