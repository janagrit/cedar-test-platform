# Technical questions

Grouped by topic. The Platform Testing team cares most about: **speed, reliability (flaky
tests), service/contract testing, CI, and visibility of risk.** Expect deep follow-ups there.

---

## A. Flaky tests

### 1. What is a flaky test? What usually causes it?
A test that passes and fails on the same code. Common causes:
- Timing: fixed `sleep`, waiting for the wrong thing, animations, async work not finished.
- Shared state: tests that depend on order, shared users/data, leftover data from another test.
- Environment: slow or unstable test environment, third-party services, network.
- Test data: hard-coded IDs that collide when tests run in parallel.
- Real product bugs: race conditions in the app (don't hide these!).

### 2. How would you detect flaky tests across a large suite?
Collect results (JUnit XML) from every CI run. A test that both passed and failed **on the same
commit** is flaky. Track flake rate over time per test and per owner.
This is what `tools/flaky_report.py` does; show it.

### 3. You found a flaky test. What do you do?
1. Quarantine it: it still runs and reports, but doesn't block merges. Open a ticket with an owner.
2. Reproduce: run it many times (`--repeat-each=50`), in parallel, under CPU load.
3. Look at the trace, video, logs, and network from failed runs.
4. Fix the root cause (wait for the right condition, isolate data). Never just add retries or sleeps.
5. Take it out of quarantine after N clean runs.

### 4. Are retries good or bad?
Retries in CI help keep the pipeline green, but they **hide** flakiness. Record "passed on retry"
as flaky and report it. In this repo, `retry()` is only for setup calls; assertions use
`expect.poll` / auto-waiting.

---

## B. Making test runs faster

### 5. The CI suite takes 60 minutes. How do you make it faster?
- Measure first: find the slowest tests and slowest steps (install, build, environment start-up).
- Run in parallel and shard across machines, balanced by past run times.
- Test impact analysis: run only the tests affected by the change (`tools/impacted_tests.py`),
  with a full run on merge to main / nightly as a safety net.
- Move checks down the pyramid: replace slow UI tests with API or contract tests.
- Set up data through the API instead of clicking through the UI; reuse login state.
- Cache dependencies, Docker layers, and browsers.

### 6. What are the risks of test impact analysis?
It can skip a test that should have run (hidden dependencies, shared config). Reduce the risk:
fall back to the full suite when shared files or unmapped paths change (the repo does this),
run everything on main and nightly, and keep the map up to date with an owner.

---

## C. Contract / service testing

### 7. What is contract testing and why use it?
Checks that a service's API matches what its consumers expect (fields, types, status codes)
without starting the whole system. It's faster and more stable than E2E and catches breaking
changes before deploy. Tools: Pact (consumer-driven), OpenAPI/JSON Schema validation.

### 8. Consumer-driven vs provider-driven contracts?
- **Consumer-driven (Pact):** each consumer writes what it needs; the provider checks it in its CI.
  Good when many teams own different services.
- **Schema-based (OpenAPI):** the provider publishes a schema; tests validate responses against it.
  Simpler, but doesn't show which consumer needs which field.

### 9. What counts as a breaking change in an API?
Removing or renaming a field, changing a type, making an optional request field required,
changing status codes or enum values. Adding an optional field is usually safe.
In this repo, `payment-contract.spec.ts` / `expectShape()` checks that required fields still exist.

---

## D. Playwright / E2E

### 10. Why Playwright over Selenium / Cypress?
Auto-waiting, built-in parallel runs, multiple browsers, network interception, trace viewer,
fixtures, and API testing in the same tool. Runs outside the browser, so multi-tab and
multi-domain flows work.

### 11. Explain Playwright fixtures. How did you use them?
Fixtures give each test what it needs (page, API client, data) and clean up afterwards.
Scope can be per test or per worker. In this repo: `env` (worker scope), `testData`, and
`api: ApiClient` in `src/fixtures/`. Tests import `test`/`expect` from the base fixture.

### 12. How do you choose a good locator?
Prefer what the user sees: `getByRole`, `getByLabel`, `getByText`, then `data-testid`. Avoid
CSS chains and XPath tied to page structure. Locators auto-wait and retry.

### 13. How do you handle login in E2E tests?
Log in once (API or UI) in a setup project, save `storageState`, reuse it in all tests.
Use a separate user per worker if tests change user state.

### 14. How do you test something that depends on a third-party service (payment gateway)?
Mock it in most tests (`page.route` or a stub service), and keep a small number of tests
against the provider's sandbox. Contract-test your integration with the provider.

---

## E. Test strategy / general

### 15. Explain the test pyramid. Do you agree with it?
Many unit tests, fewer integration/contract tests, a small number of E2E tests. Mostly agree;
for microservices, a "test honeycomb" with more integration/contract tests also makes sense.
The main idea: get the fastest feedback that still catches the risk.

### 16. How would you test a patient payment flow?
- Unit: amount math, rounding, currency, discounts, payment plans.
- API/contract: payment service responses, error codes, idempotency (paying twice must not charge twice).
- E2E: happy path (view bill, pay by card), declined card, partial payment, payment plan.
- Edge cases: $0 balance, very large amounts, refunds, timezones on due dates, session timeout mid-payment.
- Non-functional: accessibility (patients of all ages and abilities), mobile, performance, security (no PHI in logs or URLs).

### 17. How do you manage test data?
Factories that create unique data per test (UUIDs, see `test-data.factory.ts`), created through the API,
cleaned up after. Never use real patient data (PHI). Use synthetic data only.

### 18. How do you measure test quality / success of a platform team?
Pipeline duration, flake rate, % of merges blocked by flaky tests, escaped defects (bugs found in prod),
time to detect, adoption of the tools. Not "number of tests" or "coverage %" alone.

### 19. What should a good test failure message look like?
Says what was expected, what happened, and has links to the trace/logs/screenshot. The developer
should understand the failure without rerunning it.

---

## F. CI/CD

### 20. Walk me through a CI pipeline you would set up for tests.
On PR: lint + unit tests → impacted API/contract tests → small smoke E2E. On merge: full suite.
Nightly: full suite on all browsers + flaky report. Publish JUnit, HTML report, traces as
artifacts, and a summary in the job (this repo writes to the GitHub job summary).

### 21. How do you test in environments with shared state (staging)?
Unique data per test, no tests that depend on what another test created, clean up, and if
possible create short-lived environments per PR.

---

## G. Coding (possible live exercise)

Practice these in Python and TypeScript (15–20 min each):
- Parse a JUnit XML file and print failed tests with their messages.
- Given results from several runs `[{test, commit, status}]`, return tests that are flaky.
- Write a `retry(fn, attempts, backoff)` function with exponential backoff and tests for it.
- Given a list of changed files and a map of path prefix → tests, return the tests to run
  (fall back to "all" for unknown paths).
- Find the N slowest tests from a results file.
- Classic: reverse a string, find duplicates in a list, check balanced brackets, group anagrams.

Tips: say your plan before typing, write a small test first, handle empty input, talk about
time complexity at the end.

## H. SQL / API basics (quick answers)
- HTTP codes: 200, 201, 204, 400, 401 vs 403, 404, 409, 422, 429, 500, 502/503.
- Idempotency: PUT/DELETE are idempotent; POST is not, so use an idempotency key for payments.
- SQL: `JOIN` types, `GROUP BY ... HAVING`, find duplicates, find rows in A not in B.
