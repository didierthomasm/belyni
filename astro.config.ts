// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import { ICON_INCLUDE } from './src/lib/icons';

export default defineConfig({
  // URL pública (variable SITE_URL en Netlify)
  site: process.env.SITE_URL ?? 'https://belyni.netlify.app',
  // Solo /keystatic se ejecuta bajo demanda; las páginas públicas siguen siendo estáticas.
  // imageCDN: false → las imágenes se optimizan en el build (y funcionan al servir dist/ localmente)
  // devFeatures.edgeFunctions: false → `astro dev` no depende del runtime Deno de Netlify Edge
  // Functions (no hay funciones edge en este proyecto; solo se necesita para `netlify dev`)
  adapter: netlify({
    imageCDN: false,
    devFeatures: { images: true, environmentVariables: false, edgeFunctions: false },
  }),
  integrations: [icon({ include: ICON_INCLUDE }), react(), keystatic()],
  vite: { plugins: [tailwindcss()] },
});
