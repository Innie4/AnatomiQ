import { test, expect } from '@playwright/test';

test.describe('Admin Login Flow', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/upload');

    // Enter admin key
    await page.fill('input[type="password"]', process.env.ADMIN_UPLOAD_KEY || 'test-key');
    await page.click('button:has-text("Unlock dashboard")');

    // Verify dashboard loads
    await expect(page.locator('text=Total materials')).toBeVisible();
    await expect(page.locator('text=Material upload and processing dashboard')).toBeVisible();
  });

  test('should reject invalid admin key', async ({ page }) => {
    await page.goto('/upload');

    await page.fill('input[type="password"]', 'invalid-key-12345');
    await page.click('button:has-text("Unlock dashboard")');

    // Should show error
    await expect(page.locator('text=/unauthorized|invalid|error/i')).toBeVisible();
  });

  test('should show/hide admin key with eye toggle', async ({ page }) => {
    await page.goto('/upload');

    const input = page.locator('input[placeholder*="ADMIN_UPLOAD_KEY"]');

    // Initially password type
    await expect(input).toHaveAttribute('type', 'password');

    // Click eye icon to show
    await page.click('button[aria-label*="Show admin key"]');
    await expect(input).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.click('button[aria-label*="Hide admin key"]');
    await expect(input).toHaveAttribute('type', 'password');
  });
});
