import { readdirSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { readSite } from './content';

const DAY_IDS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
// Lunes 28 sep 2026 como base; Veracruz = UTC-6 todo el año
const utcFor = (day: string, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date(Date.UTC(2026, 8, 28 + DAY_IDS.indexOf(day), h + 6, m));
  return date;
};

test.describe('open-now badge', () => {
  const hours = readSite().hours ?? [];

  test('hidden when there are no hours', async ({ page }) => {
    test.skip(hours.length > 0, 'site has hours');
    await page.goto('/');
    await expect(page.locator('[data-open-status]')).toBeHidden();
  });

  test('shows Abierto ahora inside a shift', async ({ page }) => {
    test.skip(hours.length === 0, 'no hours yet');
    const first = hours[0];
    await page.clock.setFixedTime(utcFor(first.day, first.open));
    await page.goto('/');
    await expect(page.locator('[data-open-status]')).toHaveText('Abierto ahora');
  });

  test('shows Cerrado ahora at closing time', async ({ page }) => {
    test.skip(hours.length === 0, 'no hours yet');
    const first = hours[0];
    const sameDayLater = hours.some(
      (h: { day: string; open: string }) => h.day === first.day && h.open >= first.close,
    );
    test.skip(sameDayLater, 'split shift starts right at close');
    await page.clock.setFixedTime(utcFor(first.day, first.close));
    await page.goto('/');
    await expect(page.locator('[data-open-status]')).toHaveText('Cerrado ahora');
  });
});

const hasPromos = () => readdirSync('src/content/promotions').some((f) => f.endsWith('.yaml'));

test('promotion banner respects dates in salon time', async ({ page }) => {
  test.skip(!hasPromos(), 'no promotions in content');
  const promoText = page.locator('[data-promo]:visible');

  await page.clock.setFixedTime(new Date('2099-12-31T12:00:00Z'));
  await page.goto('/');
  await expect(promoText).toHaveCount(1);

  await page.clock.setFixedTime(new Date('2100-01-01T12:00:00Z'));
  await page.goto('/');
  await expect(promoText).toHaveCount(0);
});
