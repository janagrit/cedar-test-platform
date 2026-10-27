# UI audit: www.cedar.com

**Date:** 2026-10-27 · **Scope:** homepage + 28 internal pages linked from it, each at desktop (1440×900) and mobile (iPhone 13) · 176 unique links checked
**Method:** passive headless Chromium crawl (Playwright) from one location. No form submissions, no logins. Findings below were re-checked by hand after the crawl.

## Summary

| # | Severity | Finding | Where |
| --- | --- | --- | --- |
| 1 | Medium | Two internal links return 404 | 2 blog posts |
| 2 | Medium | JavaScript `TypeError` on page load | `/resources` |
| 3 | Low | Broken placeholder images | `/about-us` |
| 4 | Low | Leftover CookieYes script returns 403 on every page | site-wide |
| 5 | Low | Placeholder Lottie animation file returns 403 on every page | site-wide |
| 6 | Low (a11y) | Focusable links marked `aria-hidden="true"` | site-wide |
| 7 | Low (a11y) | Duplicate `id="Email"` | 15 pages |
| 8 | Low (a11y/SEO) | Multiple `<h1>` per page; none on Book a demo | most pages |

## Findings

### 1. Two internal links return 404
| Broken link | Linked from |
| --- | --- |
| `https://www.cedar.com/blog/hospital-billing-calls-ai-automation-study/` | `/blog/ai-reducing-patient-billing-confusion` |
| `https://www.cedar.com/2024-healthcare-financial-experience-study/` | `/blog/why-self-pay-collections-matter-what-good-looks-like` |

Both return 404 with and without the trailing slash (re-checked with `curl -L`).
**Repro:** open the blog post, click the inline link.
**Fix:** point to the current URL of each study, or add a redirect.

### 2. JavaScript error on `/resources`
`TypeError: Cannot read properties of undefined (reading 'redraw')`, thrown on page load at both desktop and mobile widths.
Likely a slider/filter script calling `.redraw()` on an instance that was never created. Visible impact not confirmed.
**Repro:** open `/resources` with DevTools console open.

### 3. Placeholder images on `/about-us`
26 `<img>` elements still use Webflow's default `cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg`, all with empty `alt`. About 5 are visible per load and fail to render (`net::ERR_BLOCKED_BY_ORB`).
**Fix:** set the image field on those CMS items or hide the element when the field is empty.

### 4. Leftover CookieYes script (403) on every page
Consent is handled by **DataGrail** (`api.consentjs.datagrail.io/.../consent.js`) and works: the "Your Privacy Matters" banner shows on load, and **My Privacy Choices** reopens it after it is closed (see screenshots).
The page also still loads `https://cdn-cookieyes.com/client_data/1edeb539bca5ec331155fc67c90b328b/script.js`, which returns **403** (also to a plain `curl`). This is a dead vendor script: one wasted request and one console error (`Failed to load resource: 403`) on every page.
**Fix:** remove the CookieYes `<script>` from the site-wide custom code.

### 5. Placeholder Lottie animation (403) on every page
Every page requests `cdn.prod.website-files.com/plugins/Animation/assets/wf-placeholder.cd67a2c2ba.json` (Webflow's default Lottie file), which returns 403: an animation element in a shared component was never given its own file.
**Fix:** assign the animation's JSON or delete the element.

### 6. Focusable links hidden from screen readers
Card overlay links (`<a aria-hidden="true" class="btn_link w-inline-block" href="...">` with no text) are keyboard-focusable but hidden from assistive tech, so screen-reader users tab onto an unnamed link. Seen 338 times across the crawl (e.g. 110× for `/book-a-demo`). Social share links (`fs-socialshare-element`) also have `href="#"` and no accessible name.
**Fix:** add `tabindex="-1"` to the duplicate overlay links, or drop `aria-hidden` and give them an `aria-label`.

### 7. Duplicate `id="Email"`
Two newsletter forms on the same page both use `id="Email"` (15 pages). `<label for="Email">` then targets the first field only, and autofill can mix them up.
**Fix:** give each form instance a unique id.

### 8. Heading structure
Most pages have 2–4 `<h1>` (section headings and "Subscribe to our newsletter" use `h1`); `/book-a-demo` has none. Example: `/careers` has 4.
**Fix:** one `h1` per page; use `h2` for section headings and the newsletter block.

## Checked and not bugs
- **13 external links flagged 403/999** (LinkedIn profiles, x.com, themuse.com, cbo.gov, experian.com): these sites block automated requests; links are expected to work in a browser.
- **"My Privacy Choices" (`href="#"`)** works: it reopens the DataGrail banner via script.
- **Google Ads / remarketing requests before a consent choice**: consistent with the banner's stated opt-out model ("If you do not make a choice, our default settings will control").
- **`input type=submit` without a label**: its `value="Submit"` is its accessible name.
- No horizontal overflow on mobile, no HTTP errors on any audited page itself, no visible broken images outside `/about-us`.

## Limits
One location, headless Chromium only, a single crawl depth (pages linked from the homepage). No Safari/Firefox, no screen-reader testing, no visual review of every page.

## Evidence
- `evidence/crawl-results.json`: raw per-page results (console errors, failed requests, a11y checks, broken links)
- `evidence/crawl-script.cjs`: the crawl script. Run with `BASE_URL=https://www.cedar.com NODE_PATH=$PWD/node_modules node audit/evidence/crawl-script.cjs <out-dir>` (`<out-dir>` needs a `shots/` folder)
- `evidence/screenshots/desktop-home.png`, `mobile-home.png`: full-page homepage
- `evidence/screenshots/consent-banner-on-load.png`: DataGrail banner on first load
- `evidence/screenshots/privacy-reopen.png`: banner reopened by My Privacy Choices
