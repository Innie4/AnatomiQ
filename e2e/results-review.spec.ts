import { test, expect } from '@playwright/test';

test.describe('Exam Results and Review', () => {
  test('should show an empty-state review when no session result exists', async ({ page }) => {
    await page.goto('/results');

    await expect(page.getByRole('heading', { name: 'No active session result' })).toBeVisible();
    await expect(page.getByRole('link', { name: /open exam mode/i })).toBeVisible();
  });

  test('should allow starting a new exam from results', async ({ page }) => {
    await page.goto('/results');
    await page.getByRole('link', { name: /open exam mode/i }).click();

    await expect(page).toHaveURL(/.*\/exam/);
    await expect(page.getByRole('heading', { name: /topic-grounded exam/i })).toBeVisible({ timeout: 15000 });
  });
});
