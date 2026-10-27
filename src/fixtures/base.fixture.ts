import { test as base, expect } from '@playwright/test';
import * as factories from '../factories/test-data.factory';
import { getEnvironment, type Environment } from '../utils/environment';

type WorkerFixtures = { env: Environment };
type TestFixtures = { testData: typeof factories };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  env: [async ({}, use) => use(getEnvironment()), { scope: 'worker' }],
  testData: async ({}, use) => use(factories),
});

export { expect };
