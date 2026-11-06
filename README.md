# cedar.com audit + test platform

[![playwright](https://github.com/janagrit/cedar-test-platform/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/janagrit/cedar-test-platform/actions/workflows/test.yml)

An independent quality check of www.cedar.com, plus automated tests that track each issue found.

The full report is in [audit/cedar-com-ui-audit.md](audit/cedar-com-ui-audit.md), with severity, steps to reproduce and a suggested fix for each issue. The tests are in [tests/cedar/](tests/cedar/) (Playwright + TypeScript, one test per issue). The framework they run on is described [below](#test-platform).

Iana Grytsenko, Senior SDET · [janagrit.github.io](https://janagrit.github.io) · [linkedin.com/in/ianagrytsenko](https://linkedin.com/in/ianagrytsenko). I'm happy to walk through the tests or the findings.

## What I checked

- The homepage and 28 linked pages in Chromium at desktop (1440×900) and mobile (iPhone 13) sizes: console errors, failed requests, broken images, accessibility basics (headings, duplicate ids, hidden focusable links, contrast).
- All 438 pages in `sitemap.xml` and every link and image on them (~1,900 URLs): 404s, missing redirects, links to old or dead domains.
- Lighthouse (mobile) on the homepage.

The check was passive. I submitted no forms, logged into nothing and did no load or security testing. It ran from one location, in Chromium only.

Checked 2026-10-27, re-checked 2026-10-29. Every issue was still live on 2026-11-06.

Main findings (17 in total; the report has all of them):

| # | Severity | Issue |
| --- | --- | --- |
| 10 | High | Privacy policy link on `/california-privacy-notice` (and 5 research pages) returns 404 |
| 11 | High | "Request a demo" link returns 404 on 5 research pages |
| 9 | High | 58 old URLs not redirected after the move to Webflow (linked from 72 pages) |
| 12 | Medium | Link to the 2024 study is broken on 14 pages |
| 13 | Medium | Sitemap lists 3 pages that return 404 |
| 14 | Medium | 35 links point to the old staging site |
| 2 | Medium | JavaScript `TypeError` on `/resources` |

## How to run the tests

Requires Node.js 18 or later.

```bash
npm install
npx playwright install chromium
npm run test:cedar
```

The tests run against the live site, which takes about 30 seconds. To point them at another environment (staging, for example):

```bash
CEDAR_URL=https://staging.example.com npm run test:cedar
```

## How to read the results table

Each test checks what the site should do. Tests for issues that are still open are marked with `test.fail()`, so the run stays green while the bug exists, and the table still shows it.

| Status | Meaning |
| --- | --- |
| **Passed** | Works as expected. These are control checks, e.g. the live pages return 200. |
| **Known bug** | The issue is still on the site. The test failed, as expected. |
| **Failed** | Something changed and needs a look. Usually it means the bug was fixed: the test now passes, and its `test.fail()` line should be removed. It can also mean a real new failure. |
| **Skipped** | Not run. |

Example (shortened):

```
┌──────────────────────────────┬──────────────────────────────────────────────────┬───────────┬──────────┐
│ Test Suite                   │ Test Name                                        │ Status    │ Duration │
├──────────────────────────────┼──────────────────────────────────────────────────┼───────────┼──────────┤
│ cedar › links.spec.ts        │ /legal/privacy-policy returns 200                │ Passed    │ 1s       │
│ cedar › links.spec.ts        │ #10 every privacy-policy link on                 │ Known bug │ 802ms    │
│                              │ /california-privacy-notice works                 │           │          │
│ cedar › links.spec.ts        │ #11 /request-a-demo/ redirects to /book-a-demo   │ Known bug │ 174ms    │
│ cedar › pages.spec.ts        │ #2 /resources loads without JavaScript errors    │ Known bug │ 5s       │
└──────────────────────────────┴──────────────────────────────────────────────────┴───────────┴──────────┘

Total: 30
Passed: 6
Failed: 0
Known bugs (expected fail): 24
Skipped: 0
```

The `#` in each test name matches the finding number in the report.

One caveat: if the site can't be reached, the known-bug tests still fail "as expected" and show as Known bug. The control tests catch this: if they fail, the run didn't actually reach the site.

## Test platform

A small test framework with few dependencies. It has Python tools for picking which tests to run
and finding flaky ones, contract tests for API responses, and a Playwright/TypeScript setup with CI.

### Layout

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

### Quick start

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ --junitxml=results/junit.xml
python3 tools/flaky_report.py results/
python3 tools/impacted_tests.py --base origin/master
```

### Design notes

`impacted_tests.py` runs only the suites a change touches. If the change hits shared config or a
path that isn't in `test_map.json`, it runs everything instead, so tests are never skipped by accident.

`flaky_report.py` compares the same test across CI runs and lists any test that both passed and
failed, with its failure messages.

`tests/api/` checks each response against the agreed schema, including fields kept for backward
compatibility, so a breaking API change fails here before it ships.

The JUnit XML can go into any dashboard. To track gaps per service, add an owner and a
last-failure date to `test_map.json`.

### Next steps (not yet built)

- Replace the example contract with real service schemas (OpenAPI or JSON Schema files).
- Add a quarantine list so flaky tests run but do not block merges.
- Add timing history to find the slowest tests and shard them.

### TypeScript / Playwright

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
  reporting/table-summary-reporter.ts  per-test results table; separates known bugs (test.fail) from failures
  reporting/report-summary.ts   counts + slowest tests for the GitHub job summary (CI only)
config/environments.ts          local / staging / prod endpoints (no secrets)
scripts/analyze-flaky-tests.ts  TS port of flaky_report.py; reads pytest and Playwright JUnit XML
tests/examples/                 self-contained examples that run without an app
tests/cedar/                    live checks of www.cedar.com, one per audit finding
tests/unit/                     unit tests for src/ and the flaky analyzer (no app or network)
.github/workflows/test.yml      Playwright CI (tests.yml still runs pytest)
```

#### Quick start

```bash
npm install
npx playwright install chromium
cp .env.example .env     # optional: local settings and secrets
npm run typecheck
npm test                 # or: npm run test:unit / test:api / test:e2e / test:cedar
npm run flaky            # flaky report over results/ (add --min-runs N, --json)
npm run report           # open the HTML report
```

#### Environment variables

Set these in the shell, in CI, or in a local `.env` file (`cp .env.example .env`). `.env` is
git-ignored and loaded automatically; values already set in the shell or CI take precedence.

| Variable | Purpose |
| --- | --- |
| `TEST_ENV` | `local` (default), `staging` or `prod`; selects `config/environments.ts` |
| `BASE_URL` | overrides the UI base URL; the e2e smoke test is skipped unless this is set |
| `API_URL` | overrides the API base URL |
| `API_TOKEN` | sent as `Authorization: Bearer …` by the `api` fixture when set |
