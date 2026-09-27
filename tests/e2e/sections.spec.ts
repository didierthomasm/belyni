import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const servicesDir = join(process.cwd(), 'src', 'content', 'services');
const services = readdirSync(servicesDir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => parse(readFileSync(join(servicesDir, f), 'utf8')));

test('hero has the single h1 and a WhatsApp CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  const cta = page.locator('#inicio').getByRole('link', { name: /Agenda por WhatsApp/ });
  await expect(cta).toHaveAttribute('href', /^https:\/\/wa\.me\/52\d{10}\?text=/);
});

test('every service from content is rendered with price or "Precio a consultar"', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#servicios');
  for (const s of services) {
    const card = section.locator('[data-service]', { has: page.getByRole('heading', { name: s.name, exact: true }) });
    await expect(card).toHaveCount(1);
    if (typeof s.priceFrom === 'number') {
      await expect(card).toContainText('Desde $');
    } else {
      await expect(card).toContainText('Precio a consultar');
    }
    const link = card.getByRole('link', { name: new RegExp(`Agendar ${s.name}`) });
    await expect(link).toHaveAttribute('href', new RegExp(encodeURIComponent(s.name)));
  }
});

test('services without image render no <img> and no broken image', async ({ page }) => {
  await page.goto('/');
  for (const s of services.filter((x) => !x.image)) {
    const card = page.locator('[data-service]', { has: page.getByRole('heading', { name: s.name, exact: true }) });
    await expect(card.locator('img')).toHaveCount(0);
  }
});
