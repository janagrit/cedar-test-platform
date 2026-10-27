// Passive UI audit: loads pages, records problems. No form submits, no logins.
const { chromium, devices } = require('@playwright/test');
const fs = require('fs');
const BASE = process.env.BASE_URL;
const OUT = process.argv[2];
const MAX_PAGES = 25;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pageChecks = () => {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.innerText || el.querySelector('img[alt]:not([alt=""]),svg title')?.textContent || el.querySelector('img[alt]')?.alt || '').trim();
  const ids = {}; document.querySelectorAll('[id]').forEach((e) => (ids[e.id] = (ids[e.id] || 0) + 1));
  const docW = document.documentElement.clientWidth;
  const overflowing = [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.getBoundingClientRect().right > docW + 2 && !e.closest('[aria-hidden="true"]'))
    .slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].slice(0, 2).join('.')} right=${Math.round(e.getBoundingClientRect().right)}`);
  return {
    title: document.title,
    lang: document.documentElement.lang,
    metaDescription: document.querySelector('meta[name="description"]')?.content || '',
    h1: [...document.querySelectorAll('h1')].filter(vis).map((h) => h.innerText.trim().slice(0, 80)),
    horizontalOverflow: document.documentElement.scrollWidth > docW + 2 ? { scrollWidth: document.documentElement.scrollWidth, clientWidth: docW, overflowing } : null,
    brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc && vis(i)).map((i) => i.currentSrc),
    imagesNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt') && vis(i)).map((i) => i.currentSrc).slice(0, 10),
    unnamedControls: [...document.querySelectorAll('a[href],button,[role="button"]')].filter((e) => vis(e) && !name(e)).map((e) => e.outerHTML.slice(0, 160)).slice(0, 10),
    inputsNoLabel: [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((e) => vis(e) && !e.labels?.length && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.getAttribute('title')).map((e) => e.outerHTML.slice(0, 160)),
    duplicateIds: Object.entries(ids).filter(([, n]) => n > 1).map(([id, n]) => `${id} x${n}`).slice(0, 10),
    emptyHrefs: [...document.querySelectorAll('a')].filter((a) => vis(a) && (!a.getAttribute('href') || a.getAttribute('href') === '#')).map((a) => `${a.innerText.trim().slice(0, 40)} -> "${a.getAttribute('href')}"`).slice(0, 10),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => /^https?:/.test(h)),
  };
};

async function audit(context, url, label) {
  const page = await context.newPage();
  const issues = { url, label, console: [], pageErrors: [], httpErrors: [], failedRequests: [] };
  page.on('console', (m) => m.type() === 'error' && issues.console.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => issues.pageErrors.push(String(e).slice(0, 300)));
  page.on('response', (r) => r.status() >= 400 && issues.httpErrors.push(`${r.status()} ${r.request().resourceType()} ${r.url().slice(0, 200)}`));
  page.on('requestfailed', (r) => issues.failedRequests.push(`${r.failure()?.errorText} ${r.url().slice(0, 200)}`));
  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    issues.status = res?.status();
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    // scroll to trigger lazy images
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
    await sleep(800);
    Object.assign(issues, await page.evaluate(pageChecks));
    if (label.endsWith('home')) await page.screenshot({ path: `${OUT}/shots/${label}.png`, fullPage: true });
  } catch (e) { issues.loadError = String(e).slice(0, 300); }
  await page.close();
  return issues;
}

(async () => {
  const browser = await chromium.launch();
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const mobile = await browser.newContext({ ...devices['iPhone 13'] });
  const results = [];
  const home = await audit(desktop, BASE, 'desktop-home');
  results.push(home, await audit(mobile, BASE, 'mobile-home'));
  const origin = new URL(BASE).origin;
  const internal = [...new Set(home.links.filter((h) => new URL(h).origin === origin).map((h) => h.split('#')[0]))].filter((h) => h !== BASE && h !== BASE + '/');
  for (const url of internal.slice(0, MAX_PAGES)) {
    results.push(await audit(desktop, url, 'desktop'));
    results.push(await audit(mobile, url, 'mobile'));
    await sleep(300);
  }
  // Link check: every unique link seen on any page.
  const allLinks = [...new Set(results.flatMap((r) => r.links || []).map((h) => h.split('#')[0]))];
  const linkStatus = [];
  for (const href of allLinks) {
    try {
      const r = await desktop.request.get(href, { maxRedirects: 10, timeout: 20000, failOnStatusCode: false });
      if (r.status() >= 400) linkStatus.push({ href, status: r.status(), foundOn: results.filter((p) => p.links?.some((l) => l.split('#')[0] === href)).map((p) => p.url).slice(0, 3) });
    } catch (e) { linkStatus.push({ href, status: 'ERR ' + String(e).slice(0, 80) }); }
    await sleep(100);
  }
  for (const r of results) delete r.links;
  fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ internalPagesFound: internal.length, linksChecked: allLinks.length, pages: results, brokenLinks: linkStatus }, null, 2));
  await browser.close();
  console.log(`pages audited: ${results.length}, internal found: ${internal.length}, links checked: ${allLinks.length}, broken: ${linkStatus.length}`);
})();
