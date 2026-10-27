/**
 * Retry an async operation with exponential backoff.
 *
 * Use this for setup/teardown calls (seeding data, waiting for a service to boot).
 * Do not wrap assertions in it: use expect.poll() or expect(...).toPass() so a real
 * failure is still reported as a failure instead of being retried away.
 */
export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  backoff?: number;
  retryIf?: (error: unknown) => boolean;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { attempts = 3, delayMs = 200, backoff = 2, retryIf = () => true } = options;
  let wait = delayMs;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !retryIf(error)) throw error;
      await new Promise((resolve) => setTimeout(resolve, wait));
      wait *= backoff;
    }
  }
}
