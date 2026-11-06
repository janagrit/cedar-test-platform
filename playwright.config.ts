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
    ['./src/reporting/table-summary-reporter.ts'],
    // Markdown counts for the GitHub job summary; CI only, so local output is just the table.
    ...(process.env.CI ? [['./src/reporting/report-summary.ts'] as const] : []),
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
    {
      // Live checks against www.cedar.com; open audit findings are marked test.fail().
      name: 'cedar',
      testMatch: /tests[\\/]cedar[\\/].*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: process.env.CEDAR_URL || 'https://www.cedar.com' },
    },
  ],
});
