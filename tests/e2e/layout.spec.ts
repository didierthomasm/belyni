import { test, expect } from '@playwright/test';
import { readSite } from './content';

const digits = (raw: string) => {
  const d = raw.replace(/\D/g, '');
  return d.length === 13 ? d.slice(3) : d.length === 12 ? d.slice(2) : d;
};

test('floating WhatsApp button uses the configured number and is labelled', async ({ page }) => {
  await page.goto('/');
  const fab = page.getByRole('link', { name: 'Escríbenos por WhatsApp' });
  await expect(fab).toBeVisible();
  await expect(fab).toHaveAttribute('href', new RegExp(`^https://wa\\.me/52${digits(readSite().whatsapp)}`));
  await expect(fab).toHaveAttribute('rel', /noopener/);
});

test('mobile menu: toggles, closes on link tap and on Escape', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menú' });
  const menu = page.locator('#menu-movil');

  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(menu).toBeHidden();

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toBeVisible();

  await menu.getByRole('link', { name: 'Contacto' }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#contacto$/);

  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
});

test('desktop nav is visible without a menu button', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Servicios' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeHidden();
});

test('footer shows social links from content with safe rel', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  const site = readSite();
  if (site.instagram) {
    await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', site.instagram);
  }
  for (const link of await footer.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});
