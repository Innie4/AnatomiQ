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

test.describe('Smoke Tests - Critical Paths', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /anatomiq/i }).first()).toBeVisible();
    await expect(page).toHaveTitle(/anatomiq/i);
  });

  test('exam page loads and shows topic selection', async ({ page }) => {
    await signInAsGuest(page);
    await page.goto('/exam');
    await expect(page.getByRole('heading', { name: /exam/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /generate exam/i })).toBeVisible();
  });

  test('upload page loads and shows admin gate', async ({ page }) => {
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: 'Admin Authentication' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter admin key')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test('topics page loads and displays anatomy topics', async ({ page }) => {
    await signInAsGuest(page);
    await page.goto('/topics');
    await expect(page.getByText('Topic explorer')).toBeVisible();

    // Should show at least one topic
    await expect(page.locator('text=/upper limb|lower limb|thorax|abdomen/i').first()).toBeVisible();
  });

  test('results page loads (even without active session)', async ({ page }) => {
    await signInAsGuest(page);
    await page.goto('/results');

    // Page should load without crashing
    await expect(page.getByRole('heading', { name: 'No active session result' })).toBeVisible();
  });

  test('navigation between pages works', async ({ page }) => {
    await signInAsGuest(page);
    await page.goto('/');

    // Navigate to exam
    await page.getByRole('link', { name: /exam/i }).first().click();
    await expect(page).toHaveURL(/.*\/exam/);

    // Navigate to topics
    await page.getByRole('link', { name: /topics/i }).first().click();
    await expect(page).toHaveURL(/.*\/topics/);
  });

  test('all pages are keyboard accessible', async ({ page }) => {
    await signInAsGuest(page);
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
