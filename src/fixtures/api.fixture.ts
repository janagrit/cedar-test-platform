import { request } from '@playwright/test';
import { ApiClient, authHeaders } from '../api/api-client';
import { test as base } from './base.fixture';

// Paths passed to the client are resolved against env.apiURL. A leading "/" replaces
// any path segment in apiURL, so use relative paths ("v1/payments") when apiURL has one.
export const test = base.extend<{ api: ApiClient }>({
  api: async ({ env }, use) => {
    const context = await request.newContext({
      baseURL: env.apiURL,
      extraHTTPHeaders: authHeaders(),
      timeout: env.timeoutMs,
    });
    await use(new ApiClient(context));
    await context.dispose();
  },
});

export { expect } from './base.fixture';
