# Interview prep: Cedar, Platform Testing

Expected questions for the Cedar Platform Testing interview. Each question has a short note on
what the interviewer is checking and an answer outline. Put your own examples in place of
the `[your example]` markers.

| File | What's in it |
|---|---|
| [01-behavioral.md](01-behavioral.md) | Background, teamwork, conflict, ownership (STAR format) |
| [02-technical.md](02-technical.md) | Flaky tests, speed, CI, contract tests, Playwright, Python, test strategy |
| [03-system-design.md](03-system-design.md) | "Design a test platform / flaky-test system / test data service" |
| [04-cedar-and-domain.md](04-cedar-and-domain.md) | Cedar, healthcare billing, HIPAA/PHI, why Cedar |
| [05-project-walkthrough.md](05-project-walkthrough.md) | Questions about this repo and the cedar.com audit |
| [06-questions-to-ask.md](06-questions-to-ask.md) | Questions for you to ask them |
| [07-codesignal.md](07-codesignal.md) | CodeSignal coding test: formats, strategy, runnable practice tasks in `codesignal/` |

## Your 60-second intro (practice out loud)

> I'm a QA / test automation engineer. Most of my work is building test tooling that other
> engineers use, not only writing test cases. [1–2 lines on your background and years.]
>
> To prepare for this role I built a small test platform for it: a Playwright + TypeScript
> framework with typed API fixtures and contract checks, plus Python tools that find flaky
> tests across CI runs and choose which suites to run based on the files a change touches.
> I also audited cedar.com and found 17 issues, including broken links on 14 pages and
> sitemap entries that return 404.
>
> I want to work on Platform Testing because faster, more reliable feedback helps every
> team ship, and at Cedar a bug can mean a patient gets a wrong bill.

## The night before

- Re-read the job description and match each requirement to one story or one piece of this repo.
- Open `audit/cedar-com-ui-audit.md` and be ready to show one finding in under 2 minutes.
- Run `npx playwright test` and `pytest` once so you can demo them if asked.
- Prepare 3 STAR stories you can reuse: a hard bug, a conflict, something you built that others adopted.
