import { test, expect } from '@playwright/test';

test('meta, Open Graph and canonical are present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.jpg$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_MX');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
});

test('JSON-LD is valid BeautySalon data', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const ld = JSON.parse(raw ?? '{}');
  expect(ld['@type']).toBe('BeautySalon');
  expect(ld.telephone).toMatch(/^\+52\d{10}$/);
});

test('robots.txt blocks admin and API, allows the thank-you page, and points to the sitemap', async ({
  request,
}) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Disallow: /keystatic');
  expect(body).toContain('Disallow: /api/');
  expect(body).not.toContain('Disallow: /gracias');
  expect(body).toMatch(/Sitemap: https:\/\/.+\/sitemap-index\.xml/);
});

test('sitemap excludes admin and thank-you pages', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const child = index.match(/<loc>[^<]*\/(sitemap-\d+\.xml)<\/loc>/)?.[1];
  expect(child).toBeTruthy();
  const urls = await (await request.get(`/${child}`)).text();
  expect(urls).not.toContain('/keystatic');
  expect(urls).not.toContain('/gracias');
});

test('thank-you page is noindex', async ({ page }) => {
  const res = await page.goto('/gracias/');
  test.skip(res?.status() === 404, 'contact form not enabled');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});

test('analytics script only when configured', async ({ page }) => {
  await page.goto('/');
  const expected = process.env.PUBLIC_UMAMI_WEBSITE_ID ? 1 : 0;
  await expect(page.locator('script[src="https://cloud.umami.is/script.js"]')).toHaveCount(
    expected,
  );
});

test('conversion links are tagged for analytics', async ({ page }) => {
  await page.goto('/');
  for (const event of ['whatsapp-fab', 'whatsapp-hero', 'directions', 'call']) {
    await expect(page.locator(`[data-umami-event="${event}"]`).first()).toBeAttached();
  }
});
