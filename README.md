# Cedar Test Platform (starter framework)

A small, dependency-light starting point for the test tooling this role owns:
faster and more reliable test runs, service-level (contract) testing, CI integration,
and risk visibility.

## Layout

```
tools/
  flaky_report.py      Reads JUnit XML from many CI runs and flags flaky tests
  impacted_tests.py    Maps changed files to the test suites that should run
test_map.json          Owner-maintained map: source path prefix -> test paths
tests/
  api/                 Service-to-service contract tests (pytest)
.github/workflows/
  tests.yml            CI: runs the suite, publishes JUnit, runs the flaky report
```

## Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ --junitxml=results/junit.xml
python3 tools/flaky_report.py results/
python3 tools/impacted_tests.py --base origin/main
```

## Design notes

- **Speed:** `impacted_tests.py` runs only suites affected by a change. It falls back to the full
  suite when a change touches shared config or an unmapped path, so it never silently skips tests.
- **Reliability:** `flaky_report.py` compares the same test across runs. A test that both passes
  and fails on the same commit is flagged, with its failure messages, so the owner can fix or quarantine it.
- **Contracts:** `tests/api/` checks that each response matches the agreed schema and that
  backward-compatible fields still exist. This catches breaking changes before deployment.
- **Risk visibility:** the JUnit output feeds any dashboard or report. Add the
  owner and last-failure date to `test_map.json` to track coverage gaps per service.

## Next steps (not yet built)

- Replace the example contract with real service schemas (OpenAPI or JSON Schema files).
- Add a quarantine list so flaky tests run but do not block merges.
- Add timing history to find the slowest tests and shard them.

## TypeScript / Playwright

A Playwright framework runs alongside the Python tools. Playwright collects only `*.spec.ts`
and pytest collects only `test_*.py`, so both can share `tests/api/` and `tests/e2e/`.

```
src/
  fixtures/base.fixture.ts      `env` (worker) and `testData` fixtures; import `test`/`expect` from here
  fixtures/api.fixture.ts       adds an `api: ApiClient` fixture bound to env.apiURL
  api/api-client.ts             typed REST client (throws ApiError on non-2xx) + expectShape() contract check
  factories/test-data.factory.ts  buildPayment(), buildUser() with UUID ids for parallel safety
  utils/environment.ts          getEnvironment() / requireEnv()
  utils/retry-utils.ts          retry() with backoff, for setup calls only (use expect.poll for assertions)
  reporting/report-summary.ts   counts + slowest tests, also written to the GitHub job summary
config/environments.ts          local / staging / prod endpoints (no secrets)
scripts/analyze-flaky-tests.ts  TS port of flaky_report.py; reads pytest and Playwright JUnit XML
tests/examples/                 self-contained examples that run without an app
tests/unit/                     unit tests for src/ and the flaky analyzer (no app or network)
.github/workflows/test.yml      Playwright CI (tests.yml still runs pytest)
```

### Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env     # optional: local settings and secrets
npm run typecheck
npm test                 # or: npm run test:unit / test:api / test:e2e
npm run flaky            # flaky report over results/ (add --min-runs N, --json)
npm run report           # open the HTML report
```

### Environment variables

Set these in the shell, in CI, or in a local `.env` file (`cp .env.example .env`). `.env` is
git-ignored and loaded automatically; values already set in the shell or CI take precedence.

| Variable | Purpose |
| --- | --- |
| `TEST_ENV` | `local` (default), `staging` or `prod`; selects `config/environments.ts` |
| `BASE_URL` | overrides the UI base URL; the e2e smoke test is skipped unless this is set |
| `API_URL` | overrides the API base URL |
| `API_TOKEN` | sent as `Authorization: Bearer …` by the `api` fixture when set |
