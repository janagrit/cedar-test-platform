# Behavioral questions

Use STAR: **S**ituation (1 line), **T**ask (1 line), **A**ction (most of the answer, say "I"),
**R**esult (a number if you have one). Aim for 1.5–2 minutes per answer.

---

### 1. Tell me about yourself.
**Checking:** a clear story, and whether your experience fits a platform/tooling role.
**Outline:** use the 60-second intro in [README.md](README.md). End with why this role.

### 2. Why do you want to leave your current role / why now?
**Checking:** you're moving toward something, not running away.
**Outline:** you want to own test infrastructure that many teams use, and work on a product
where quality has a real effect on people (patient bills). Don't criticize your current employer.

### 3. Tell me about a test framework or tool you built that other people used.
**Checking:** platform mindset: you build for other engineers, think about adoption, docs, and DX.
**Outline:** [your example]. Cover: the problem, who used it, how you got them to adopt it
(docs, examples, pairing), and what you measured (run time, flake rate, number of teams).

### 4. Describe the hardest bug you found. How did you find it?
**Checking:** debugging method, persistence, root-cause thinking.
**Outline:** [your example]. Show the steps: reproduce, narrow down (logs, network, bisect),
find root cause, fix or hand off with clear reproduction steps, add a test so it can't come back.

### 5. Tell me about a time you disagreed with a developer about a bug or its priority.
**Checking:** you can push back with data and still keep a good working relationship.
**Outline:** [your example]. You showed user impact with evidence (screenshots, logs, how many
users), you listened to their reasons, you agreed on an outcome together (fix now / ticket / accept the risk).

### 6. Tell me about a time a bug you missed reached production.
**Checking:** ownership, no blame, learning.
**Outline:** [your example]. Say what happened plainly, what you did right away, why the
tests missed it, and what you changed (new test, new check in CI, change to the process).

### 7. How do you decide what to automate and what not to?
**Checking:** judgment and ROI thinking.
**Outline:** automate stable, high-risk, frequently run flows (payments, login, money
calculations). Don't automate things that change every week, one-off checks, or visual
"does this feel right" checks. Push tests down the pyramid: unit > API/contract > a small number of E2E.

### 8. Tell me about a time you had to deliver with a tight deadline.
**Checking:** prioritizing by risk.
**Outline:** [your example]. You listed the risks, tested the highest-risk paths first, told
stakeholders clearly what was *not* tested, and followed up after release.

### 9. How do you get developers to care about test quality / fix flaky tests?
**Checking:** influence without authority. This is the main challenge of a platform team.
**Outline:** make it easy and visible. Dashboards showing flaky tests by owner, quarantine
so flaky tests stop blocking merges, fast feedback, good error messages, fixing the first few
yourself to show how. Make the right thing the easy thing.

### 10. Tell me about a time you learned a new technology quickly.
**Outline:** [your example] or this repo: you built a Playwright + TypeScript framework and the
Python tools for this interview. Explain how you learned (docs, small prototype, tests).

### 11. Tell me about a mistake you made / a weakness.
**Outline:** a real but not critical weakness plus what you're doing about it. Example: "I used
to try to automate everything; now I first ask what risk the test reduces."

### 12. Where do you see yourself in 2–3 years?
**Outline:** owning bigger parts of the test platform, helping teams improve quality, mentoring.
Keep it tied to this role.

---

## Cedar values (check their careers page before the interview)
Connect each story to one value. Typical themes for Cedar: patient-first, ownership, honesty,
working together. If they ask "which of our values matters most to you", pick one and give a story.
