import { test, expect } from '@playwright/test';

test('home page responds in Spanish', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle(/Belyni/);
});

test('brand fonts and skip link', async ({ page }) => {
  await page.goto('/');
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFont).toContain('Manrope');
  const h1Font = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(h1Font).toContain('Cormorant Garamond');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
