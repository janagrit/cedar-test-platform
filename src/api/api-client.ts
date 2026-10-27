import type { APIRequestContext } from '@playwright/test';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    readonly body: string,
  ) {
    super(`${status} ${url}: ${body.slice(0, 200)}`);
    this.name = 'ApiError';
  }
}

type Params = Record<string, string | number | boolean>;

/** Thin typed wrapper over Playwright's APIRequestContext. Non-2xx responses throw ApiError. */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  get<T>(path: string, params?: Params): Promise<T> {
    return this.send<T>('GET', path, { params });
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.send<T>('POST', path, { data });
  }

  put<T>(path: string, data?: unknown): Promise<T> {
    return this.send<T>('PUT', path, { data });
  }

  delete<T>(path: string): Promise<T> {
    return this.send<T>('DELETE', path, {});
  }

  private async send<T>(method: string, path: string, options: { data?: unknown; params?: Params }): Promise<T> {
    const response = await this.request.fetch(path, { method, ...options });
    const text = await response.text();
    if (!response.ok()) throw new ApiError(response.status(), response.url(), text);
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

/** Auth header for the API, sent only when API_TOKEN is set. */
export function authHeaders(): Record<string, string> {
  const token = process.env.API_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type FieldType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
export type Contract = Record<string, FieldType>;

function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function matches(value: unknown, expected: FieldType): boolean {
  if (expected === 'integer') return Number.isInteger(value);
  return typeOf(value) === expected;
}

/**
 * Check a payload against a contract: every field present with the agreed type.
 * Returns a list of errors (empty when the payload matches). Port of check_contract()
 * in tests/api/test_contract_example.py.
 */
export function expectShape(payload: Record<string, unknown>, contract: Contract): string[] {
  const errors: string[] = [];
  for (const [field, expected] of Object.entries(contract)) {
    if (!(field in payload)) {
      errors.push(`missing field: ${field}`);
    } else if (!matches(payload[field], expected)) {
      errors.push(`wrong type for ${field}: ${typeOf(payload[field])}`);
    }
  }
  return errors;
}
