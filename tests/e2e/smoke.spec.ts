import { test, expect } from '@playwright/test';

test('home page responds in Spanish', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle(/Belyni/);
});
