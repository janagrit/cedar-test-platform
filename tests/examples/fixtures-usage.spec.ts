import { expect, test } from '@src/fixtures/base.fixture';

// Self-contained example: no app needed. Shows env + testData fixtures with a page.
test('renders a user built by the factory', async ({ page, env, testData }) => {
  const user = testData.buildUser({ name: 'Ada Lovelace' });

  await page.setContent(`
    <main>
      <h1>Profile</h1>
      <p data-testid="name">${user.name}</p>
      <p data-testid="email">${user.email}</p>
      <p data-testid="env">${env.name}</p>
    </main>
  `);

  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByTestId('name')).toHaveText('Ada Lovelace');
  await expect(page.getByTestId('email')).toHaveText(/@example\.test$/);
  await expect(page.getByTestId('env')).toHaveText(env.name);
});

test('factory ids are unique', ({ testData }) => {
  const ids = new Set(Array.from({ length: 50 }, () => testData.buildPayment().id));
  expect(ids.size).toBe(50);
});
