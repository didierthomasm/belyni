import { test, expect } from '@playwright/test';

test('no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('no broken images (including lazy ones)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    for (const img of Array.from(document.images)) img.loading = 'eager';
  });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  );
  expect(broken).toEqual([]);
});

test('every image has alt text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('img:not([alt])')).toHaveCount(0);
});

test('no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('first-load transfer stays under 1 MB', async ({ page }) => {
  let bytes = 0;
  page.on('response', async (res) => {
    const body = await res.body().catch(() => Buffer.alloc(0));
    bytes += body.length;
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(bytes).toBeLessThan(1_000_000);
});

test.describe('mobile viewport (375px)', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('long Spanish text never gets clipped off-screen inside main', async ({ page }) => {
    await page.goto('/');
    const overflowing = await page.evaluate(() => {
      const isInsideHorizontalScroller = (el: Element): boolean => {
        for (let node = el.parentElement; node; node = node.parentElement) {
          const overflowX = getComputedStyle(node).overflowX;
          if (overflowX === 'auto' || overflowX === 'scroll') return true;
        }
        return false;
      };
      const viewportWidth = window.innerWidth;
      return Array.from(document.querySelectorAll('main *'))
        .filter((el) => el.getBoundingClientRect().right > viewportWidth + 1)
        .filter((el) => !isInsideHorizontalScroller(el))
        .map((el) => el.tagName.toLowerCase());
    });
    expect(overflowing).toEqual([]);
  });
});
