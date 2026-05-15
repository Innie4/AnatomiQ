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

test.describe('Exam Setup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await signInAsGuest(page);
  });

  test('should show current exam setup controls', async ({ page }) => {
    await page.goto('/exam');

    await expect(page.getByRole('heading', { name: /grounded anatomy exam/i })).toBeVisible();
    await expect(page.getByLabel('Course')).toBeVisible();
    await expect(page.locator('select').nth(1)).toBeVisible();
    await expect(page.getByLabel('Question type')).toBeVisible();
    await expect(page.getByLabel('Questions')).toBeVisible();
    await expect(page.getByLabel('Exam timer')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate exam/i })).toBeVisible();
  });

  test('should support random exam entry point', async ({ page }) => {
    await page.goto('/exam');
    await expect(page.getByRole('button', { name: /randomize exam/i })).toBeVisible();
  });

  test('should allow topic query params without crashing', async ({ page }) => {
    await page.goto('/exam?topic=general-anatomy');
    await expect(page.locator('select').nth(1)).toBeVisible();
  });
});
