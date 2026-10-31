# Questions about this repo and the audit

If you share this repo or the audit, expect them to ask about it. Know every file you show.

## 2-minute walkthrough (practice)
1. **Problem:** the role is about faster and more reliable tests, contract testing, CI, and risk visibility.
2. **Python tools:** `flaky_report.py` (flaky detection across runs), `impacted_tests.py` (run only affected suites, with a full-suite fallback).
3. **Playwright + TS framework:** fixtures (`env`, `testData`, `api`), typed `ApiClient` that throws `ApiError`, `expectShape()` contract check, data factories with UUIDs, retry for setup only, report summary in the GitHub job summary.
4. **CI:** GitHub Actions runs the suites, publishes JUnit, runs the flaky report.
5. **Audit:** 17 findings on cedar.com with reproduction steps and evidence.

---

## Likely questions

### 1. Why did you build both Python and TypeScript?
Python for CI tooling and pytest contract tests; TypeScript for Playwright UI + API tests.
Teams often have both. They share `tests/api/` and `tests/e2e/` without conflict because
Playwright collects only `*.spec.ts` and pytest only `test_*.py`.

### 2. How does `flaky_report.py` decide a test is flaky?
It reads JUnit XML from many runs and flags a test that both passed and failed on the same
commit, with its failure messages, so the owner can fix or quarantine it.
**Follow-up:** what are its limits? Needs several runs per commit; doesn't yet track trends
or auto-quarantine (listed in "Next steps").

### 3. What happens in `impacted_tests.py` if a change touches an unknown file?
It falls back to the full suite, so it never silently skips tests. Same for shared config.
**Follow-up:** how would you improve it? Use a real dependency graph or coverage data instead of
a hand-maintained map; check that every source path is mapped.

### 4. Why is `retry()` only for setup calls?
Retrying assertions hides flaky behavior and real bugs. For assertions use Playwright
auto-waiting or `expect.poll`, which waits for a condition with a timeout.

### 5. Why UUIDs in the test data factory?
So parallel workers never collide on the same user or payment.

### 6. What would you build next?
From the README: real service schemas (OpenAPI), a quarantine list, timing history for sharding.
Add: flake trend dashboard, axe accessibility checks in E2E, per-PR environments.

---

## The cedar.com audit

### 7. Walk me through one finding.
Pick **broken links** (clear and easy to verify): links inside blog posts (e.g. "38% of
patients" on the 2024 Healthcare Financial Experience Study) go to "page not found". The full-site
check found the 2024 study link broken on 14 pages, and the sitemap lists pages that return 404.
Root cause looks like old URLs not redirected after the move to Webflow. Fix: 301 redirects +
a link check in CI.

### 8. How did you find them?
A crawler script (`audit/evidence/crawl-script.cjs`, `sitecheck.py`) that checks every link and
sitemap URL for status codes, plus manual checks in Chrome DevTools and Lighthouse
(console errors, accessibility, contrast).

### 9. How would you prioritize these findings?
By user and business impact: broken "Request a demo" and privacy policy links first (lost leads,
legal), then broken content links and sitemap 404s (SEO, trust), then accessibility, then cleanup
(leftover scripts, placeholder images).

### 10. How would you stop these bugs from coming back?
Scheduled link checker in CI against production and the sitemap, redirect map checked on every
site migration, axe accessibility checks, alert on new console errors.

> Be humble when you present it: "This is the marketing site, not the product, but it shows how I
> approach testing: find it, prove it with reproduction steps and evidence, rank it, and prevent it."
