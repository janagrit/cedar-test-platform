import { expect, test } from '@playwright/test';

/**
 * Browser checks for www.cedar.com, from audit/cedar-com-ui-audit.md.
 * Same rule as links.spec.ts: assert the correct behaviour, and mark open bugs
 * with test.fail() so a fix shows up as "passed unexpectedly".
 */

const AUDIT = 'audit/cedar-com-ui-audit.md';
const finding = (n: number) => ({ type: 'issue', description: `${AUDIT} finding ${n}` });

test('home page loads with a Cedar title (control)', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/cedar/i);
});

test('#2 /resources loads without JavaScript errors', { annotation: finding(2) }, async ({ page }) => {
  test.fail(true, "Known bug: TypeError: Cannot read properties of undefined (reading 'redraw')");
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/resources', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

test('#3 /about-us has no Webflow placeholder images', { annotation: finding(3) }, async ({ page }) => {
  test.fail(true, 'Known bug: 26 <img> still use placeholder.60f9b1840c.svg');
  await page.goto('/about-us');
  await expect(page.locator('img[src*="placeholder.60f9b1840c.svg"]')).toHaveCount(0);
});

test('#4 #5 home page does not load dead third-party files (403)', { annotation: [finding(4), finding(5)] }, async ({ page }) => {
  test.fail(true, 'Known bug: CookieYes script and Webflow placeholder Lottie both return 403 on every page');
  const forbidden: string[] = [];
  page.on('response', (r) => {
    if (r.status() === 403 && /cdn-cookieyes\.com|wf-placeholder/.test(r.url())) forbidden.push(r.url());
  });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  expect(forbidden).toEqual([]);
});

test('#6 no keyboard-focusable links are hidden from screen readers', { annotation: finding(6) }, async ({ page }) => {
  test.fail(true, 'Known bug: card overlay links have aria-hidden="true" but are still focusable');
  await page.goto('/');
  await expect(page.locator('a[href][aria-hidden="true"]:not([tabindex="-1"])')).toHaveCount(0);
});

test('#7 element ids are unique (id="Email")', { annotation: finding(7) }, async ({ page }) => {
  test.fail(true, 'Known bug: two newsletter forms both use id="Email"');
  await page.goto('/');
  expect(await page.locator('[id="Email"]').count()).toBeLessThanOrEqual(1);
});

for (const path of ['/careers', '/book-a-demo']) {
  test(`#8 ${path} has exactly one <h1>`, { annotation: finding(8) }, async ({ page }) => {
    test.fail(true, 'Known bug: /careers has 4 h1, /book-a-demo has none');
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
  });
}

test('#16 footer links meet WCAG AA contrast (4.5:1)', { annotation: finding(16) }, async ({ page }) => {
  test.fail(true, 'Known bug: "My Privacy Choices" #70904f on #dbffb5 = 3.27:1 (mobile footer links 3.54:1)');
  await page.goto('/');
  // The site has no <footer> element; the footer is div.footer.
  const footerLinks = page.locator('.footer a');
  expect(await footerLinks.count(), 'footer links found').toBeGreaterThan(0);
  const worst = await footerLinks.evaluateAll((links) => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const background = (el: Element | null): number[] => {
      for (; el; el = el.parentElement) {
        const c = rgb(getComputedStyle(el).backgroundColor);
        if (c.length >= 3 && (c[3] ?? 1) > 0) return c;
      }
      return [255, 255, 255];
    };
    let min = 21;
    for (const a of links) {
      if (!a.textContent?.trim()) continue;
      const [l1, l2] = [lum(rgb(getComputedStyle(a).color)), lum(background(a))].sort((x, y) => y - x);
      min = Math.min(min, (l1 + 0.05) / (l2 + 0.05));
    }
    return Math.round(min * 100) / 100;
  });
  expect(worst).toBeGreaterThanOrEqual(4.5);
});
