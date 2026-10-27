import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { environments, type EnvConfig, type EnvName } from '../../config/environments';

/**
 * Load KEY=value pairs from a .env file into process.env, if the file exists.
 * Variables already set (shell, CI secrets) are not overwritten.
 */
export function loadDotEnv(path = join(__dirname, '..', '..', '.env')): void {
  if (existsSync(path)) process.loadEnvFile(path);
}

loadDotEnv();

export interface Environment extends EnvConfig {
  name: EnvName;
}

/** Resolve the target environment from TEST_ENV; BASE_URL and API_URL override the config. */
export function getEnvironment(): Environment {
  const name = process.env.TEST_ENV || 'local';
  if (!Object.hasOwn(environments, name)) {
    throw new Error(`Unknown TEST_ENV "${name}". Expected one of: ${Object.keys(environments).join(', ')}`);
  }
  const config = environments[name as EnvName];
  return {
    ...config,
    name: name as EnvName,
    baseURL: process.env.BASE_URL || config.baseURL,
    apiURL: process.env.API_URL || config.apiURL,
  };
}

/** Read a required env var (e.g. a secret) or fail with a message that names it. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}
