import { expectShape, type Contract } from '@src/api/api-client';
import { expect, test } from '@src/fixtures/api.fixture';

// Same contract as tests/api/test_contract_example.py. Replace the sample payload
// with a recorded or live response (e.g. `await api.get('/payments/pay_123')`).
const PAYMENT_CONTRACT_V1: Contract = {
  id: 'string',
  status: 'string',
  amount_cents: 'integer',
  currency: 'string',
};
const ALLOWED_STATUS = ['pending', 'succeeded', 'failed'];

const sampleResponse = (): Record<string, unknown> => ({
  id: 'pay_123',
  status: 'succeeded',
  amount_cents: 2500,
  currency: 'USD',
});

test('response matches payment contract v1', () => {
  expect(expectShape(sampleResponse(), PAYMENT_CONTRACT_V1)).toEqual([]);
});

test('status is a known value', () => {
  expect(ALLOWED_STATUS).toContain(sampleResponse().status);
});

test('factory payments satisfy the contract', ({ testData }) => {
  expect(expectShape({ ...testData.buildPayment() }, PAYMENT_CONTRACT_V1)).toEqual([]);
});

for (const missing of Object.keys(PAYMENT_CONTRACT_V1)) {
  test(`checker detects missing field: ${missing}`, () => {
    const payload = sampleResponse();
    delete payload[missing];
    expect(expectShape(payload, PAYMENT_CONTRACT_V1)).toEqual([`missing field: ${missing}`]);
  });
}

test('checker detects wrong type', () => {
  const payload = { ...sampleResponse(), amount_cents: 25.5 };
  expect(expectShape(payload, PAYMENT_CONTRACT_V1)).toEqual(['wrong type for amount_cents: number']);
});
