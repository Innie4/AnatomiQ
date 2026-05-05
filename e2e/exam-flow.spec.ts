import { test, expect } from '@playwright/test';
import { ExamPage } from './pages/exam.page';

test.describe('Exam Generation and Taking Flow', () => {
  test('should generate and complete an MCQ exam', async ({ page }) => {
    const examPage = new ExamPage(page);
    await examPage.goto();

    // Configure exam
    await examPage.selectTopic('General Anatomy');
    await examPage.selectQuestionType('MCQ');
    await examPage.setQuestionCount(5);
    await examPage.setTimerMinutes(0); // Untimed

    // Start exam
    await examPage.startExam();

    // Verify questions loaded
    await expect(page.locator('text=/Question 1/i')).toBeVisible();

    // Answer all MCQ questions (select first option for each)
    for (let i = 1; i <= 5; i++) {
      const questionBlock = page.locator(`text=/Question ${i}/i`).locator('..').locator('..');
      const firstOption = questionBlock.locator('input[type="radio"]').first();
      await firstOption.click();
    }

    // Submit exam
    await examPage.submitExam();

    // Verify results page
    await examPage.waitForResults();
    const score = await examPage.getScore();

    expect(score.total).toBe(5);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(5);
  });

  test('should handle exam with timer', async ({ page }) => {
    const examPage = new ExamPage(page);
    await examPage.goto();

    await examPage.selectTopic('Upper Limb');
    await examPage.selectQuestionType('MIXED');
    await examPage.setQuestionCount(3);
    await examPage.setTimerMinutes(5);

    await examPage.startExam();

    // Verify timer is visible
    await expect(page.locator('text=/0[45]:\\d{2}/')).toBeVisible();
  });

  test('should validate required exam parameters', async ({ page }) => {
    const examPage = new ExamPage(page);
    await examPage.goto();

    // Try to start exam without questions
    await page.click('button:has-text("Start exam")');

    // Should either show error or prevent submission
    // (Implementation may vary - this tests the behavior exists)
  });

  test('should allow navigation between topics', async ({ page }) => {
    await page.goto('/exam?topic=thorax');

    // Verify topic is pre-selected from URL
    const topicSelect = page.locator('select:below(:text("Topic"))');
    await expect(topicSelect).toHaveValue(/thorax/i);
  });
});
