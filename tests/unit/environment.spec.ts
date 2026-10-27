import { writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { environments } from '@config/environments';
import { getEnvironment, loadDotEnv, requireEnv } from '@src/utils/environment';

const KEYS = ['TEST_ENV', 'BASE_URL', 'API_URL', 'CEDAR_TEST_SECRET'] as const;
let saved: Record<string, string | undefined>;

test.beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

test.afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test('defaults to local', () => {
  expect(getEnvironment()).toEqual({ ...environments.local, name: 'local' });
});

test('selects the environment named by TEST_ENV', () => {
  process.env.TEST_ENV = 'staging';
  const env = getEnvironment();
  expect(env.name).toBe('staging');
  expect(env.apiURL).toBe(environments.staging.apiURL);
});

test('BASE_URL and API_URL override the config', () => {
  process.env.TEST_ENV = 'prod';
  process.env.BASE_URL = 'http://ui.test';
  process.env.API_URL = 'http://api.test';
  const env = getEnvironment();
  expect(env).toMatchObject({ name: 'prod', baseURL: 'http://ui.test', apiURL: 'http://api.test' });
  expect(env.timeoutMs).toBe(environments.prod.timeoutMs);
});

for (const name of ['qa', 'constructor']) {
  test(`rejects unknown TEST_ENV ${JSON.stringify(name)}`, () => {
    process.env.TEST_ENV = name;
    expect(() => getEnvironment()).toThrow(/Unknown TEST_ENV/);
  });
}

test('requireEnv returns a set value and names a missing one', () => {
  process.env.CEDAR_TEST_SECRET = 's3cret';
  expect(requireEnv('CEDAR_TEST_SECRET')).toBe('s3cret');
  delete process.env.CEDAR_TEST_SECRET;
  expect(() => requireEnv('CEDAR_TEST_SECRET')).toThrow('Missing required environment variable CEDAR_TEST_SECRET');
});

test('empty values fall back to the config', () => {
  process.env.TEST_ENV = '';
  process.env.BASE_URL = '';
  expect(getEnvironment()).toMatchObject({ name: 'local', baseURL: environments.local.baseURL });
});

test.describe('loadDotEnv', () => {
  test('loads values from the file', ({}, testInfo) => {
    const file = testInfo.outputPath('.env');
    writeFileSync(file, 'TEST_ENV=staging\nAPI_URL=http://from-file.test\n');
    loadDotEnv(file);
    expect(getEnvironment()).toMatchObject({ name: 'staging', apiURL: 'http://from-file.test' });
  });

  test('does not overwrite variables that are already set', ({}, testInfo) => {
    const file = testInfo.outputPath('.env');
    writeFileSync(file, 'API_URL=http://from-file.test\n');
    process.env.API_URL = 'http://from-shell.test';
    loadDotEnv(file);
    expect(process.env.API_URL).toBe('http://from-shell.test');
  });

  test('is a no-op when the file is missing', ({}, testInfo) => {
    expect(() => loadDotEnv(testInfo.outputPath('missing.env'))).not.toThrow();
    expect(process.env.API_URL).toBeUndefined();
  });
});
