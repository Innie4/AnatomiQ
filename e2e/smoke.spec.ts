import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Paths', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('ANATOMIQ').first()).toBeVisible();
    await expect(page).toHaveTitle(/anatomiq/i);
  });

  test('exam page loads and shows topic selection', async ({ page }) => {
    await page.goto('/exam');
    await expect(page.getByRole('heading', { name: /topic-grounded exam/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Topic$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate exam/i })).toBeVisible();
  });

  test('upload page loads and shows admin gate', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByText('Faculty operations')).toBeVisible();
    await expect(page.getByLabel('Admin upload key')).toBeVisible();
    await expect(page.getByRole('button', { name: /unlock dashboard/i })).toBeVisible();
  });

  test('topics page loads and displays topics', async ({ page }) => {
    await page.goto('/topics');
    await expect(page.getByText('Topic explorer')).toBeVisible();
    await expect(page.getByText(/materials|questions|subtopics/i).first()).toBeVisible();
  });

  test('results page loads without an active session', async ({ page }) => {
    await page.goto('/results');
    await expect(page.getByRole('heading', { name: 'No active session result' })).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /exam/i }).first().click();
    await expect(page).toHaveURL(/.*\/exam/);

    await page.getByRole('link', { name: /topics/i }).first().click();
    await expect(page).toHaveURL(/.*\/topics/);
  });

  test('all pages are keyboard accessible', async ({ page }) => {
    await page.goto('/exam');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    expect(['BUTTON', 'SELECT', 'INPUT', 'A']).toContain(focusedElement);
  });
});
