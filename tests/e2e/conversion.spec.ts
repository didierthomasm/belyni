import { test, expect } from '@playwright/test';
import { readSite, firstNonExpiredPromotion } from './content';

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

// Mediodía en Veracruz (UTC-6 todo el año) para una fecha AAAA-MM-DD, con un
// desplazamiento de días opcional (para probar el día siguiente a endDate).
const veracruzNoonUtc = (isoDate: string, dayOffset = 0): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + dayOffset, 18, 0));
};

test('promotion banner respects dates in salon time', async ({ page }) => {
  const promo = firstNonExpiredPromotion();
  test.skip(!promo, 'no non-expired promotion in content');
  const promoLocator = page.locator('[data-promo]:visible');

  await page.clock.setFixedTime(veracruzNoonUtc(promo!.startDate));
  await page.goto('/');
  await expect(promoLocator).toHaveCount(1);

  await page.clock.setFixedTime(veracruzNoonUtc(promo!.endDate, 1));
  await page.goto('/');
  await expect(promoLocator).toHaveCount(0);
});

test.describe('contact form', () => {
  test.skip(!process.env.PUBLIC_WEB3FORMS_KEY, 'form disabled (no PUBLIC_WEB3FORMS_KEY)');

  test('requires fields, has a honeypot, and redirects to /gracias/', async ({ page }) => {
    await page.route('https://api.web3forms.com/submit', (route) =>
      route.fulfill({ status: 303, headers: { location: 'http://localhost:4322/gracias/' } }),
    );
    await page.goto('/');
    const form = page.locator('#contacto form');
    await expect(form.locator('input[name="botcheck"]')).toBeHidden();
    await expect(form.getByLabel('Nombre')).toHaveAttribute('required', '');

    await form.getByLabel('Nombre').fill('Ana López');
    await form.getByLabel('Teléfono').fill('229 111 2233');
    await form.getByLabel('Mensaje').fill('¿Tienen disponibilidad el sábado?');
    await form.getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(page).toHaveURL(/\/gracias\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gracias');
  });
});
