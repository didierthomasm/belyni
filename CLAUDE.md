# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static, single-page marketing site for **Belyni**, a beauty salon in Veracruz, Mexico. All user-facing copy is in Spanish (`<html lang="es">`), and code comments are in Spanish too — keep both conventions.

## Running

Requires Node ≥ 22.12.

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # astro check + static build to dist/
npm test               # Vitest unit tests (src/lib)
npm run test:coverage  # coverage, 80% threshold on src/lib
npm run test:e2e       # Playwright against the built dist/, served on :4322 (mobile + desktop)
```

## Architecture

Astro 7 static site + Tailwind 4 (`@tailwindcss/vite`, tokens in `src/styles/global.css` `@theme`).

- **Content** (owner-editable) lives in `src/content/` as one YAML file per entry; schemas in `src/content.config.ts`. The singleton `site/index.yaml` holds business data (phone, WhatsApp, address, hours, highlights). Layout is Keystatic-compatible: don't move files.
- **Logic** lives in `src/lib/*.ts` (pure, unit-tested): phone/WhatsApp links, price/duration formatting, opening hours in `America/Mexico_City`, service grouping, nav.
- **Components**: `src/components/{ui,layout,sections}`. They receive data and hold no business copy. Sections with no content are not rendered, and their nav link disappears.
- **Icons**: astro-icon; any icon used must be listed in `src/lib/icons.ts` (`ICON_INCLUDE`).
- **Client JS**: only the mobile menu (`Header.astro`) and the click-to-load map (`Location.astro`).
- Adding a service = add `src/content/services/<slug>.yaml`. Categories are fixed in `src/lib/categories.ts`.
- **CMS**: Keystatic (`keystatic.config.ts`) edits the same YAML files at `/keystatic` (local mode in dev, GitHub mode in production). Any schema change must be made in **both** `keystatic.config.ts` and `src/content.config.ts`.
- `@astrojs/netlify` is only there for Keystatic's on-demand routes (`imageCDN: false`). Public pages are prerendered; `astro preview` is not supported, so use `npm run serve:dist`.

## Known state / gotchas

- Fields marked `# PENDIENTE` in `src/content/` are unconfirmed with the owner.
- Empty optional fields may be `''` or `null` (Keystatic's convention); schemas treat both as missing.
- E2E tests read the YAML content to build their expectations, so they follow content edits.
