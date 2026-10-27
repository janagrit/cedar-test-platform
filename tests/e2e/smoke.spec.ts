import { expect, test } from '@src/fixtures/base.fixture';

// Skipped until a real app is configured, so CI stays green on the starter.
test.skip(!process.env.BASE_URL, 'Set BASE_URL to run the smoke test against a running app');

test('home page loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/.+/);
});
