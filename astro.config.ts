// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  // URL pública; Parte 2 la toma de la variable SITE_URL
  site: process.env.SITE_URL ?? 'https://belyni.netlify.app',
  integrations: [icon()],
  vite: { plugins: [tailwindcss()] },
});
