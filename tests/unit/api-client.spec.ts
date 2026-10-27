import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { ApiClient, ApiError, authHeaders } from '@src/api/api-client';

// A local HTTP server stands in for the service, so these tests need no network.
interface Seen {
  method?: string;
  url?: string;
  auth?: string;
  body: string;
}

let server: Server;
let baseURL: string;
let seen: Seen;

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
  });
}

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    seen = { method: req.method, url: req.url, auth: req.headers.authorization, body: await readBody(req) };
    if (req.url?.startsWith('/missing')) {
      res.writeHead(404, { 'Content-Type': 'application/json' }).end('{"error":"not found"}');
    } else if (req.method === 'DELETE') {
      res.writeHead(204).end();
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, echo: seen.body || null }));
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

let context: APIRequestContext;
let api: ApiClient;

test.beforeEach(async () => {
  context = await request.newContext({ baseURL, extraHTTPHeaders: { Authorization: 'Bearer t0ken' } });
  api = new ApiClient(context);
});

test.afterEach(async () => {
  await context.dispose();
});

test('get parses JSON and sends query params', async () => {
  const body = await api.get<{ ok: boolean }>('/payments', { status: 'pending', limit: 5 });
  expect(body.ok).toBe(true);
  expect(seen).toMatchObject({ method: 'GET', url: '/payments?status=pending&limit=5' });
});

test('post and put send a JSON body', async () => {
  await api.post('/payments', { amount_cents: 100 });
  expect(seen).toMatchObject({ method: 'POST', body: '{"amount_cents":100}' });
  await api.put('/payments/1', { status: 'failed' });
  expect(seen).toMatchObject({ method: 'PUT', url: '/payments/1', body: '{"status":"failed"}' });
});

test('delete with an empty response resolves to undefined', async () => {
  await expect(api.delete('/payments/1')).resolves.toBeUndefined();
  expect(seen.method).toBe('DELETE');
});

test('context headers reach the server', async () => {
  await api.get('/payments');
  expect(seen.auth).toBe('Bearer t0ken');
});

test('non-2xx responses throw ApiError with status, url and body', async () => {
  const error = await api.get('/missing/7').catch((e: unknown) => e);
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status: 404, url: `${baseURL}/missing/7`, body: '{"error":"not found"}' });
  expect((error as ApiError).message).toContain('404');
});

test.describe('authHeaders', () => {
  let saved: string | undefined;
  test.beforeEach(() => {
    saved = process.env.API_TOKEN;
  });
  test.afterEach(() => {
    if (saved === undefined) delete process.env.API_TOKEN;
    else process.env.API_TOKEN = saved;
  });

  test('is empty without API_TOKEN', () => {
    delete process.env.API_TOKEN;
    expect(authHeaders()).toEqual({});
  });

  test('sends a bearer token when API_TOKEN is set', () => {
    process.env.API_TOKEN = 'abc';
    expect(authHeaders()).toEqual({ Authorization: 'Bearer abc' });
  });
});
