import { expect, test } from '@playwright/test';
import { buildPayment, buildUser } from '@src/factories/test-data.factory';

test('buildPayment returns valid defaults', () => {
  expect(buildPayment()).toMatchObject({ status: 'succeeded', amount_cents: 2500, currency: 'USD' });
  expect(buildPayment().id).toMatch(/^pay_[0-9a-f-]{36}$/);
});

test('buildPayment applies overrides without touching other fields', () => {
  const payment = buildPayment({ status: 'failed', amount_cents: 1 });
  expect(payment).toMatchObject({ status: 'failed', amount_cents: 1, currency: 'USD' });
});

test('buildUser derives a unique test email from its id', () => {
  const user = buildUser();
  expect(user.id).toMatch(/^user_[0-9a-f-]{36}$/);
  expect(user.email).toBe(`user+${user.id.slice('user_'.length, 'user_'.length + 8)}@example.test`);
});

test('builders never repeat ids', () => {
  const ids = new Set(Array.from({ length: 500 }, () => [buildPayment().id, buildUser().id]).flat());
  expect(ids.size).toBe(1000);
});
