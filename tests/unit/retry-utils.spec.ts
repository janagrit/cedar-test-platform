import { expect, test } from '@playwright/test';
import { retry } from '@src/utils/retry-utils';

function failTimes(n: number, value = 'ok') {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= n) throw new Error(`fail ${calls}`);
    return value;
  };
  return { fn, calls: () => calls };
}

test('returns the first success without retrying', async () => {
  const op = failTimes(0);
  await expect(retry(op.fn, { delayMs: 1 })).resolves.toBe('ok');
  expect(op.calls()).toBe(1);
});

test('retries until the operation succeeds', async () => {
  const op = failTimes(2);
  await expect(retry(op.fn, { attempts: 3, delayMs: 1 })).resolves.toBe('ok');
  expect(op.calls()).toBe(3);
});

test('rethrows the last error once attempts run out', async () => {
  const op = failTimes(5);
  await expect(retry(op.fn, { attempts: 3, delayMs: 1 })).rejects.toThrow('fail 3');
  expect(op.calls()).toBe(3);
});

test('stops immediately when retryIf rejects the error', async () => {
  const op = failTimes(5);
  await expect(retry(op.fn, { attempts: 5, delayMs: 1, retryIf: () => false })).rejects.toThrow('fail 1');
  expect(op.calls()).toBe(1);
});

test('waits with exponential backoff between attempts', async () => {
  const stamps: number[] = [];
  const fn = async () => {
    stamps.push(performance.now());
    if (stamps.length < 3) throw new Error('not yet');
    return 'done';
  };
  await retry(fn, { attempts: 3, delayMs: 30, backoff: 2 });
  const gaps = [stamps[1] - stamps[0], stamps[2] - stamps[1]];
  // Lower bounds only: timers can run late on a busy CI box, never meaningfully early.
  expect(gaps[0]).toBeGreaterThanOrEqual(25);
  expect(gaps[1]).toBeGreaterThanOrEqual(55);
});
