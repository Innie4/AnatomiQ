import { test, expect } from '@playwright/test';

test.describe('Exam Setup Flow', () => {
  test('should show current exam setup controls', async ({ page }) => {
    await page.goto('/exam');

    await expect(page.getByRole('heading', { name: /topic-grounded exam/i })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Course$/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Topic$/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Subtopic$/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Question type$/ })).toBeVisible();
    await expect(page.getByRole('combobox', { name: /^Question number$/ })).toBeVisible();
    await expect(page.getByLabel('Exam timer')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate exam/i })).toBeVisible();
  });

  test('should support random exam entry point', async ({ page }) => {
    await page.goto('/exam');
    await expect(page.getByRole('button', { name: /randomize exam/i })).toBeVisible();
  });

  test('should allow topic query params without crashing', async ({ page }) => {
    await page.goto('/exam?topic=general-anatomy');
    await expect(page.getByRole('combobox', { name: /^Topic$/ })).toBeVisible();
  });
});
