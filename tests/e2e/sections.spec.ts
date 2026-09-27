import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { countEntries, hoursCount, readSite } from './content';

// Escapa caracteres especiales de regex en nombres de servicio como "Uñas (gel)" o "Corte + peinado"
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
      const navLink = page
        .getByRole('navigation', { name: 'Principal' })
        .getByRole('link', { name: section.label });
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

test('every service from content is rendered with price or "Precio a consultar"', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#servicios');
  for (const s of services) {
    const card = section.locator('[data-service]', {
      has: page.getByRole('heading', { name: s.name, exact: true }),
    });
    await expect(card).toHaveCount(1);
    if (typeof s.priceFrom === 'number') {
      await expect(card).toContainText('Desde $');
    } else {
      await expect(card).toContainText('Precio a consultar');
    }
    const link = card.getByRole('link', { name: new RegExp(`Agendar ${escapeRegExp(s.name)}`) });
    await expect(link).toHaveAttribute(
      'href',
      new RegExp(escapeRegExp(encodeURIComponent(s.name))),
    );
  }
});

test('services without image render no <img> and no broken image', async ({ page }) => {
  await page.goto('/');
  for (const s of services.filter((x) => !x.image)) {
    const card = page.locator('[data-service]', {
      has: page.getByRole('heading', { name: s.name, exact: true }),
    });
    await expect(card.locator('img')).toHaveCount(0);
  }
});

test('map loads only after the visitor asks for it', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#ubicacion');
  await expect(section.locator('iframe')).toHaveCount(0);
  await section.getByRole('button', { name: 'Ver mapa' }).click();
  await expect(section.locator('iframe')).toHaveAttribute('src', /google\.com\/maps\/embed/);
  await expect(section.locator('iframe')).toHaveAttribute('title', /Mapa/);
});

test('directions link opens Google Maps', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.locator('#ubicacion').getByRole('link', { name: 'Cómo llegar' }),
  ).toHaveAttribute('href', /google\.com\/maps/);
});

test('schedule: 7-day table when hours exist, WhatsApp hint otherwise', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#ubicacion');
  if (hoursCount() > 0) {
    await expect(section.locator('table tbody tr')).toHaveCount(7);
  } else {
    await expect(section.locator('table')).toHaveCount(0);
    await expect(section).toContainText('Escríbenos para confirmar el horario');
  }
});

test('contact offers WhatsApp and phone with valid links', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#contacto');
  await expect(section.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/52\d{10}/,
  );
  await expect(section.getByRole('link', { name: /Llamar/ })).toHaveAttribute(
    'href',
    /^tel:\+52\d{10}$/,
  );
});
