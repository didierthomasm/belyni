import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { countEntries, readSite } from './content';

const servicesDir = join(process.cwd(), 'src', 'content', 'services');
const services = readdirSync(servicesDir)
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => parse(readFileSync(join(servicesDir, f), 'utf8')));

const OPTIONAL_SECTIONS = [
  { id: 'equipo', label: 'Equipo', count: () => countEntries('team') },
  { id: 'galeria', label: 'Galería', count: () => countEntries('gallery') },
  { id: 'opiniones', label: 'Opiniones', count: () => countEntries('reviews') },
  { id: 'marcas', label: null, count: () => countEntries('brands') },
  { id: 'nosotros', label: 'Nosotros', count: () => (readSite().highlights ?? []).length },
];

for (const section of OPTIONAL_SECTIONS) {
  test(`#${section.id} is shown only when it has content`, async ({ page, isMobile }) => {
    await page.goto('/');
    const hasContent = section.count() > 0;
    await expect(page.locator(`#${section.id}`)).toHaveCount(hasContent ? 1 : 0);
    if (section.label && !isMobile) {
      const navLink = page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: section.label });
      await expect(navLink).toHaveCount(hasContent ? 1 : 0);
    }
  });
}

test('no section renders an empty list', async ({ page }) => {
  await page.goto('/');
  for (const list of await page.locator('main section ul').all()) {
    expect(await list.locator('li').count()).toBeGreaterThan(0);
  }
});

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
