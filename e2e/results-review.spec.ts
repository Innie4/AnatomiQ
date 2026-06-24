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

  test('should auto-grade and show results when timer and grace period expire', async ({ page }) => {
    await page.addInitScript(() => {
      const originalSetInterval = window.setInterval;
      window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
        originalSetInterval(handler, Math.min(timeout ?? 0, 5), ...args)) as typeof window.setInterval;
    });

    let gradeRequests = 0;
    await page.route('**/api/grade-exam', async (route) => {
      gradeRequests += 1;
      const payload = await route.request().postDataJSON();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 0,
          total: 1,
          percentage: 0,
          breakdown: [
            {
              questionId: payload.answers[0].questionId,
              questionType: 'MCQ',
              submittedAnswer: payload.answers[0].response,
              correctAnswer: 'The femur',
              correct: false,
              explanation: 'The femur is the longest bone in the body.',
              sourceSnippet: 'The femur is the longest bone in the body.',
            },
          ],
        }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem(
        'academiq:active-exam',
        JSON.stringify({
          selection: {
            topicName: 'Timed Anatomy',
            subtopicName: 'Bones',
          },
          questions: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              type: 'MCQ',
              stem: 'Which bone is the longest in the body?',
              options: ['The femur', 'The tibia', 'The radius', 'The humerus'],
              difficulty: 'FOUNDATIONAL',
              sourceSnippet: 'The femur is the longest bone in the body.',
              answer: 'The femur',
              explanation: 'The femur is the longest bone in the body.',
            },
          ],
          config: {
            topicSlug: 'timed-anatomy',
            subtopicSlug: 'bones',
            type: 'MCQ',
            count: 1,
            durationMinutes: 0.001,
          },
        }),
      );
    });

    await page.goto('/exam-session');

    await expect(page.getByRole('heading', { name: /time's up/i })).toBeVisible();
    await expect(page).toHaveURL(/.*\/results/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /timed anatomy/i })).toBeVisible();
    await expect(page.getByText('0/1')).toBeVisible();

    const stored = await page.evaluate(() => ({
      activeExam: sessionStorage.getItem('academiq:active-exam'),
      lastResult: JSON.parse(sessionStorage.getItem('academiq:last-result') ?? '{}'),
    }));

    expect(gradeRequests).toBe(1);
    expect(stored.activeExam).toBeNull();
    expect(stored.lastResult.timedOut).toBe(true);
  });
});
