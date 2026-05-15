import { test, expect, type Page } from '@playwright/test';

async function signInAsGuest(page: Page) {
  const response = await page.request.post('/api/auth/guest', {
    headers: { 'x-forwarded-for': `127.0.0.${Math.floor(Math.random() * 200) + 1}` },
  });
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  await page.context().addCookies([
    {
      name: 'anatomiq:auth-token',
      value: data.token,
      domain: 'localhost',
      path: '/',
    },
  ]);
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('anatomiq:auth-token', token);
    localStorage.setItem('anatomiq:user', JSON.stringify(user));
  }, { token: data.token, user: data.user });
}

test.describe('Exam Results and Review', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
  });

  test('should show an empty-state review when no session result exists', async ({ page }) => {
    await page.goto('/results');

    await expect(page.getByRole('heading', { name: 'No active session result' })).toBeVisible();
    await expect(page.getByRole('link', { name: /open exam mode/i })).toBeVisible();
  });

  test('should allow starting a new exam from results', async ({ page }) => {
    await page.goto('/results');
    await page.getByRole('link', { name: /open exam mode/i }).click();

    await expect(page).toHaveURL(/.*\/exam/);
    await expect(page.getByRole('heading', { name: /grounded anatomy exam/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /generate exam/i })).toBeVisible();
  });
});
