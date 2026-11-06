import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Link checks for www.cedar.com, from audit/cedar-com-ui-audit.md.
 *
 * Every test checks what the site should do. Tests for bugs that are still open
 * call test.fail(): they show as "Known bug" while the bug exists, and turn into a
 * real failure ("passed unexpectedly") once the bug is fixed. That is the signal
 * to delete the test.fail() line.
 */

const AUDIT = 'audit/cedar-com-ui-audit.md';
const finding = (n: number) => ({ type: 'issue', description: `${AUDIT} finding ${n}` });

/** Status after following redirects. */
async function statusOf(request: APIRequestContext, url: string): Promise<number> {
  const response = await request.get(url, { maxRedirects: 10, failOnStatusCode: false });
  return response.status();
}

/** All href values on a page (raw, as written in the HTML). */
async function hrefsOn(request: APIRequestContext, path: string): Promise<string[]> {
  const response = await request.get(path);
  expect(response.ok(), `${path} should load`).toBe(true);
  const html = await response.text();
  return [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
}

test.describe('Live pages (control)', () => {
  for (const path of [
    '/',
    '/solutions/cedar-pay',
    '/legal/privacy-policy',
    '/book-a-demo',
    '/research/2024-healthcare-financial-experience-study',
  ]) {
    test(`${path} returns 200`, async ({ request }) => {
      expect(await statusOf(request, path)).toBe(200);
    });
  }
});

test.describe('Broken links', () => {
  test('#1/#12 old 2024 study URL redirects to the study', { annotation: finding(12) }, async ({ request }) => {
    test.fail(true, 'Known bug: /2024-healthcare-financial-experience-study/ is 404 (linked from 14 pages)');
    expect(await statusOf(request, '/2024-healthcare-financial-experience-study/')).toBe(200);
  });

  test('#1 old billing-calls study URL redirects to the study', { annotation: finding(1) }, async ({ request }) => {
    test.fail(true, 'Known bug: /blog/hospital-billing-calls-ai-automation-study/ is 404 (linked from 6 posts)');
    expect(await statusOf(request, '/blog/hospital-billing-calls-ai-automation-study/')).toBe(200);
  });

  // Top old-site URLs from finding 9.
  for (const path of [
    '/cedar-suite/',
    '/pfx-benchmark/',
    '/cedar-pay/',
    '/cedar-cares/',
    '/dei-cedar/',
    '/security-details/',
    '/the-cedar-advantage/',
    '/ahn-highmark-case-study/',
  ]) {
    test(`#9 old URL ${path} is redirected`, { annotation: finding(9) }, async ({ request }) => {
      test.fail(true, `Known bug: ${path} returns 404, no 301 set up after the Webflow move`);
      expect(await statusOf(request, path)).toBe(200);
    });
  }

  test('#10 every privacy-policy link on /california-privacy-notice works', { annotation: finding(10) }, async ({ request }) => {
    test.fail(true, 'Known bug: the notice links to /privacy-policy/ which is 404');
    const links = (await hrefsOn(request, '/california-privacy-notice')).filter((h) => h.includes('privacy-policy'));
    expect(links.length).toBeGreaterThan(0);
    for (const link of new Set(links)) {
      expect.soft(await statusOf(request, link), link).toBe(200);
    }
  });

  test('#11 /request-a-demo/ redirects to /book-a-demo', { annotation: finding(11) }, async ({ request }) => {
    test.fail(true, 'Known bug: /request-a-demo/ is 404 on 5 research pages');
    expect(await statusOf(request, '/request-a-demo/')).toBe(200);
  });

  test('#13 sitemap does not list pages that return 404', { annotation: finding(13) }, async ({ request }) => {
    test.fail(true, 'Known bug: 3 "cedar-talks" blog posts in sitemap.xml return 404');
    const xml = await (await request.get('/sitemap.xml')).text();
    const known404s = ['cedar-talks-farmgirl-flowers', 'cedar-talks-leadership-lessons-from-adtium-bio', 'cedar-talks-zola-co-founder'];
    const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => known404s.some((k) => u.includes(k)));
    for (const url of listed) {
      expect.soft(await statusOf(request, url), url).toBe(200);
    }
  });

  test('#14 blog posts do not link to the old staging site', { annotation: finding(14) }, async ({ request }) => {
    test.fail(true, 'Known bug: 35 links on 24 posts point to dev-cedar-website.pantheonsite.io');
    const hrefs = await hrefsOn(request, '/blog/betting-on-growth-in-health-biotech-cedar-talks-with-marc-andreessen-scott-kupor-of-andreessen-horowitz');
    expect(hrefs.filter((h) => h.includes('pantheonsite.io'))).toEqual([]);
  });

  test('#15 blog posts do not link to dead subdomains', { annotation: finding(15) }, async ({ request }) => {
    test.fail(true, 'Known bug: links to old.cedar.com (no DNS) and decode.cedar.com (no response)');
    const dead = /\/\/(old|decode)\.cedar\.com/;
    for (const path of ['/blog/medicaid-cuts-health-system-ceos-strategies', '/blog/introducing-the-cedar-tech-decode-blog']) {
      expect.soft((await hrefsOn(request, path)).filter((h) => dead.test(h)), path).toEqual([]);
    }
  });

  test('#17 press links contain no invisible U+FFFC character', { annotation: finding(17) }, async ({ request }) => {
    test.fail(true, 'Known bug: press links end in %EF%BF%BC and return 404');
    const hrefs = await hrefsOn(request, '/all-press/cedar-expands-financial-engagement-platform-across-healthcare-ecosystem-in-2022');
    expect(hrefs.filter((h) => /%EF%BF%BC|￼/i.test(h))).toEqual([]);
  });
});
