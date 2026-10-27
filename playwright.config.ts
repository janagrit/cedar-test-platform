import { defineConfig, devices } from '@playwright/test';
import { getEnvironment } from './src/utils/environment';

const env = getEnvironment();

// Only *.spec.ts files are collected, so the pytest files in tests/ are ignored (and vice versa).
export default defineConfig({
  testDir: 'tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: env.timeoutMs,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'results/playwright-junit.xml' }],
    ['./src/reporting/report-summary.ts'],
  ],
  use: {
    baseURL: env.baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'unit', testMatch: /tests[\\/]unit[\\/].*\.spec\.ts$/ },
    { name: 'api', testMatch: /tests[\\/]api[\\/].*\.spec\.ts$/ },
    {
      name: 'e2e',
      testMatch: /tests[\\/](e2e|examples)[\\/].*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
