import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=/anatomiq|anatomy/i')).toBeVisible();
    await expect(page).toHaveTitle(/anatomiq/i);
  });

  test('exam page loads and shows topic selection', async ({ page }) => {
    await page.goto('/exam');
    await expect(page.locator('text=Build a grounded anatomy exam')).toBeVisible();
    await expect(page.locator('select:below(:text("Topic"))')).toBeVisible();
    await expect(page.locator('button:has-text("Start exam")')).toBeVisible();
  });

  test('upload page loads and shows admin gate', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.locator('text=Faculty operations')).toBeVisible();
    await expect(page.locator('input[placeholder*="ADMIN_UPLOAD_KEY"]')).toBeVisible();
    await expect(page.locator('button:has-text("Unlock dashboard")')).toBeVisible();
  });

  test('topics page loads and displays anatomy topics', async ({ page }) => {
    await page.goto('/topics');
    await expect(page.locator('text=/anatomy topics|explore topics/i')).toBeVisible();

    // Should show at least one topic
    await expect(page.locator('text=/upper limb|lower limb|thorax|head/i')).toBeVisible();
  });

  test('results page loads (even without active session)', async ({ page }) => {
    await page.goto('/results');

    // Page should load without crashing
    await expect(page.locator('text=/result|score|exam/i')).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');

    // Navigate to exam
    await page.click('a[href="/exam"]');
    await expect(page).toHaveURL(/.*\/exam/);

    // Navigate to topics
    await page.click('a[href="/topics"]');
    await expect(page).toHaveURL(/.*\/topics/);
  });

  test('all pages are keyboard accessible', async ({ page }) => {
    await page.goto('/exam');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be on an interactive element
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName;
    });

    expect(['BUTTON', 'SELECT', 'INPUT', 'A']).toContain(focusedElement);
  });
});
