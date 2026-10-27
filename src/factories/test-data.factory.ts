import { randomUUID } from 'node:crypto';

// Builders return valid defaults; pass overrides for the fields a test cares about.
// UUID-based ids keep parallel workers from colliding on shared environments.

export type PaymentStatus = 'pending' | 'succeeded' | 'failed';

export interface Payment {
  id: string;
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
}

export function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return { id: `pay_${randomUUID()}`, status: 'succeeded', amount_cents: 2500, currency: 'USD', ...overrides };
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export function buildUser(overrides: Partial<User> = {}): User {
  const id = randomUUID();
  return { id: `user_${id}`, email: `user+${id.slice(0, 8)}@example.test`, name: 'Test User', ...overrides };
}
