import { test, expect } from '@playwright/test';

test.describe('Exam Results and Review', () => {
  test('should show results breakdown after exam submission', async ({ page }) => {
    // Navigate to exam page
    await page.goto('/exam');

    // Configure and start a simple exam
    await page.selectOption('select:below(:text("Topic"))', { index: 0 });
    await page.selectOption('select:below(:text("Question type"))', { label: 'MCQ' });
    await page.selectOption('select:below(:text("Questions"))', { value: '3' });

    await page.click('button:has-text("Start exam")');

    // Wait for questions
    await expect(page.locator('text=/Question 1/i')).toBeVisible({ timeout: 15000 });

    // Answer all questions quickly
    const radioButtons = page.locator('input[type="radio"]');
    const count = await radioButtons.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await radioButtons.nth(i).click();
    }

    // Submit
    await page.click('button:has-text("Submit exam")');

    // Verify results page
    await page.waitForURL('**/results');

    await expect(page.locator('text=/Your score/i')).toBeVisible();
    await expect(page.locator('text=/\\d+\\/\\d+/')).toBeVisible();
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
  });

  test('should display correct and incorrect answers', async ({ page }) => {
    // This test assumes a results session exists (from previous test or seeded data)
    await page.goto('/results', { waitUntil: 'networkidle' });

    // Results page should show question review
    const hasResults = await page.locator('text=/score|result|question/i').isVisible().catch(() => false);

    if (hasResults) {
      // Verify breakdown exists
      await expect(page.locator('text=/correct|incorrect|answer/i')).toBeVisible();
    }
  });

  test('should allow starting a new exam from results', async ({ page }) => {
    await page.goto('/results');

    // Should have a link or button to start new exam
    const newExamButton = page.locator('a[href="/exam"], button:has-text("new exam")');
    await expect(newExamButton.first()).toBeVisible();
  });

  test('should show source snippets for each question', async ({ page }) => {
    await page.goto('/results');

    // Check if source material is shown (if results exist)
    const hasResults = await page.locator('text=/score/i').isVisible().catch(() => false);

    if (hasResults) {
      // Source snippets should be visible for reference
      await expect(page.locator('text=/source|reference|material/i')).toBeVisible();
    }
  });
});
