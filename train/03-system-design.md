# System design questions (test platform)

Use this structure for any design question (about 30–40 minutes):

1. **Ask questions first:** how many engineers, services, tests? Where do tests run? What hurts now?
2. **Goals and metrics:** e.g. "PR feedback under 15 min, flake rate under 1%".
3. **High-level design:** draw the boxes.
4. **Go deep on 1–2 parts** the interviewer cares about.
5. **Trade-offs and what you'd build first** (an MVP, then iterate).

---

### 1. Design a system to detect and manage flaky tests for the whole company.

**Parts:**
- **Collection:** every CI job uploads JUnit XML + metadata (commit, branch, job, duration, retry count).
- **Storage:** a results table: `test_id, commit, run_id, status, duration, error, timestamp`.
- **Detection:** flaky = passed and failed on the same commit, or passed on retry. Score = flake rate over the last N runs.
- **Action:** auto-quarantine above a threshold (test runs but doesn't block), create a ticket
  for the owner (from a CODEOWNERS / `test_map.json`-style map), un-quarantine after N clean runs.
- **Visibility:** dashboard per team: top flaky tests, trend, time lost to reruns.

**Trade-offs:** auto-quarantine can hide a real bug → alert the owner and set a time limit
on quarantine. Same-commit comparison needs enough reruns → nightly repeat runs help.

**Point to:** `tools/flaky_report.py` is the detection part of this design.

---

### 2. Design a test platform that gives developers fast feedback on every PR.

- **Test selection:** impact analysis from changed files (dependency graph or ownership map), full run on main.
- **Execution:** containerized runners, sharding by past duration, parallel workers, caching.
- **Environments:** short-lived per-PR environments or service virtualization (mocks/stubs for downstream services).
- **Reporting:** one summary in the PR (failures, flaky, slowest), links to traces.
- **Metrics:** P50/P90 pipeline time, queue time, flake rate, cost per run.

---

### 3. Design contract testing across ~50 microservices.

- Consumer-driven contracts (Pact) with a broker, or OpenAPI schemas in a shared repo.
- Provider CI verifies all consumer contracts before deploy; "can-i-deploy" check as a gate.
- Versioning: contracts tagged per environment (staging, prod).
- Rollout: start with the most critical services (payments, billing), then expand.
- Ownership: each team owns its contracts; platform team owns the tooling and the broker.

---

### 4. Design a test data service.

- API to create synthetic patients, bills, insurance, payment methods in a known state.
- Unique data per test for parallel runs; automatic cleanup or a TTL.
- **No real PHI ever.** Synthetic generators, and checks that block real data in test environments.
- Builders/factories in the client libraries (like `buildPayment()`, `buildUser()` in this repo).

---

### 5. How would you give leadership visibility into quality risk?

Dashboard per service: test coverage of critical flows, flake rate, escaped defects, time
since last failure, missing owners. `test_map.json` with owner + last-failure date is the
start of this. Weekly short report: what got better, top 3 risks.
