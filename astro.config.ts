// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { ICON_INCLUDE } from './src/lib/icons';

export default defineConfig({
  // URL pública; Parte 2 la toma de la variable SITE_URL
  site: process.env.SITE_URL ?? 'https://belyni.netlify.app',
  integrations: [icon({ include: ICON_INCLUDE })],
  vite: { plugins: [tailwindcss()] },
});
