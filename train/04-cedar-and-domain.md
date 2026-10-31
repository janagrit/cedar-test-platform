# Cedar and the healthcare domain

> Check these facts on cedar.com and recent news before the interview. Some details may have changed.

## What Cedar does (in your own words)
Cedar builds software that helps patients understand and pay their medical bills. Hospitals
and health systems use it for patient billing, payments, payment plans, and financial
support. It also works before the visit (estimates, insurance info) and after it (billing,
payment, support). It connects data from the provider (hospital) and the payer (insurance).
Founded in 2016 in New York. Bought OODA Health in 2021 to work more closely with insurers.
They have recently been working on AI for billing calls (see their billing-calls AI study, the
one with the broken link in your audit).

## Why quality matters more here
- **Money:** a wrong amount, a double charge, or a lost payment hurts patients and hospitals.
- **Trust:** medical bills are stressful; a confusing or broken page makes it worse.
- **Regulation:** HIPAA (protected health information), PCI DSS (card data), accessibility (ADA / WCAG).
- **Integrations:** many hospital systems (EHRs like Epic), clearinghouses, payment processors. These are good places for contract testing.

---

## Questions you might get

### 1. Why Cedar?
**Outline:** the mission (making healthcare billing less stressful for patients), the role
(Platform Testing affects every engineering team), and evidence of interest: "I audited
cedar.com and built a small test platform that matches the work in the job description."

### 2. What do you know about our product?
**Outline:** see the summary above. Mention one product area you looked at closely.

### 3. What is PHI and how does it affect testing?
PHI = Protected Health Information: names, dates, addresses, medical record numbers, bills
linked to a person. In testing: never use production patient data; use synthetic data;
don't log PHI; mask data in screenshots, videos, and traces; restrict who can access test
environments; check that PHI doesn't appear in URLs or analytics.

### 4. What would you test in a feature that shows patients their bill?
Correct amounts (insurance paid, adjustments, patient responsibility), clear explanation,
mobile layout, accessibility (screen reader, contrast, which your audit checked), language
support, links to payment and payment plans, data matches the hospital system, no other
patient's data shown (authorization).

### 5. How do you think about accessibility testing?
Automated checks (axe in Playwright) in CI catch about a third of issues. Add manual checks:
keyboard only, screen reader, zoom 200%, contrast. Patients include older people and people
with disabilities, so this matters a lot. Your audit found low contrast in the footer, focusable
links hidden from screen readers, and a duplicate `id`.
