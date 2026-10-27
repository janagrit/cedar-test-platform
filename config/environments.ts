// Per-environment endpoints. No secrets here: tokens come from env vars (see src/utils/environment.ts).
export type EnvName = 'local' | 'staging' | 'prod';

export interface EnvConfig {
  baseURL: string;
  apiURL: string;
  timeoutMs: number;
}

export const environments: Record<EnvName, EnvConfig> = {
  local: { baseURL: 'http://localhost:3000', apiURL: 'http://localhost:8080', timeoutMs: 30_000 },
  staging: { baseURL: 'https://staging.example.com', apiURL: 'https://api.staging.example.com', timeoutMs: 45_000 },
  prod: { baseURL: 'https://example.com', apiURL: 'https://api.example.com', timeoutMs: 45_000 },
};
