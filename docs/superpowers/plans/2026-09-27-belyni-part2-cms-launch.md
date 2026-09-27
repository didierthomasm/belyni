# Belyni Part 2: CMS, Conversion, SEO, CI & Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the salon owner edit the site from a web admin (Keystatic), add conversion features (open-now badge, promotions, optional contact form), make the site discoverable (SEO, JSON-LD, sitemap), and ship it on Netlify with CI, a production-data gate, and an owner guide in Spanish.

**Architecture:** Builds on Part 1's static Astro site. Keystatic's admin UI (`/keystatic`) reads and writes the same YAML files Part 1 created. In production it commits to GitHub, which triggers a Netlify rebuild. The Netlify adapter is added only so Keystatic's admin/API routes can run on demand; every public page stays prerendered. Time-dependent UI (open now, promotions) is computed in the browser in `America/Mexico_City`, with a nightly rebuild so stale HTML never lingers.

**Tech Stack:** Astro 7.3, `@astrojs/netlify` 8.2 (`imageCDN: false`), `@astrojs/react` 7 + React 19 (required by Keystatic), `@keystatic/core` 0.6 + `@keystatic/astro` 6, `@astrojs/sitemap` 3.7, Web3Forms (optional form), Umami Cloud (optional analytics), `@lhci/cli` 0.15, GitHub Actions, Node 24 (built-in TypeScript type stripping for scripts).

**Spec:** [`docs/astro-migration-plan.md`](../../astro-migration-plan.md) (Phases 2–7).

**Depends on:** [`2026-09-27-belyni-part1-foundation-ui.md`](./2026-09-27-belyni-part1-foundation-ui.md), which must be complete (all tests green, owner approved the look).

## Global Constraints

- Everything in Part 1's Global Constraints still applies (Spanish copy, no hard-coded owner content, Keystatic-compatible content layout, `''`/`null` = missing, Mexican phone normalization, `America/Mexico_City`, conventional commits with the Co-Authored-By trailer).
- Every public page remains prerendered static HTML; only `/keystatic` and `/api/keystatic/*` run on demand.
- `@astrojs/netlify` must use `imageCDN: false` so image URLs work when E2E tests serve `dist/` locally.
- Keystatic admin field labels and help text are in Spanish.
- Secrets never go in the repo: Keystatic GitHub App credentials and the Netlify build hook live in Netlify/GitHub secrets. `PUBLIC_*` keys (Web3Forms, Umami) are public by design.
- Production deploys are blocked while any `PENDIENTE` marker remains in `src/content/` or opening hours are empty.
- Lighthouse (mobile) ≥ 0.9 in performance, accessibility, best practices and SEO; LCP ≤ 2.5 s; CLS ≤ 0.1.

## Review Focus

1. **Owner saves invalid data in the admin** (bad phone, closing before opening, end date before start date): the build must fail with the Spanish schema message, the **live site must keep the last good version**, and someone must get an email. Pinned in Task 3 (date schema tests) and Task 9 (deploy notifications + failed-deploy check).
2. **Promotions around date boundaries**: a promo ending "2026-10-31" must still show at 23:30 Veracruz time on Oct 31 (05:30 UTC Nov 1), must not show before its start date, and must disappear the next day even if the HTML is stale. Pinned in Task 3.
3. **Owner-written text containing `</script>`, quotes or `<`** ending up in JSON-LD: must not break the page or inject markup. Pinned in Task 5.
4. **Bots and no-JS visitors on the contact form**: honeypot rejects bots; the form still works without JavaScript (POST + redirect to `/gracias/`). Pinned in Task 4.
5. **The admin being indexed or exposed**: `/keystatic` and `/gracias/` must be absent from the sitemap, `/keystatic` disallowed in robots.txt, and production admin must require GitHub sign-in. Pinned in Task 5 (E2E on sitemap/robots) and Task 9 (auth check).

---

## File Structure

```
astro.config.ts                          # Task 1 (adapter, react, keystatic), Task 5 (sitemap)
keystatic.config.ts                      # Task 1, Task 3 (promotions)
netlify.toml                             # Task 7, Task 9
lighthouserc.json                        # Task 8
.github/workflows/ci.yml                 # Task 8
.github/workflows/nightly-rebuild.yml    # Task 9
.env.example                             # Task 4, Task 6, Task 9
scripts/check-production-data.mjs        # Task 7
scripts/make-og-image.mjs                # Task 5
public/og.jpg                            # Task 5 (generated)
src/env.d.ts                             # Task 4
src/lib/content-schema.ts (+test)        # Task 3: dateOnlySchema
src/lib/promotions.ts (+test)            # Task 3
src/lib/seo.ts (+test)                   # Task 5
src/lib/production-gate.ts (+test)       # Task 7
src/content.config.ts                    # Task 3 (promotions collection)
src/content/promotions/.gitkeep          # Task 3
src/components/sections/Location.astro   # Task 2 (open-now badge)
src/components/sections/PromoBanner.astro# Task 3
src/components/sections/ContactForm.astro# Task 4
src/components/sections/Contact.astro    # Task 4
src/layouts/BaseLayout.astro             # Task 5 (SEO), Task 6 (analytics)
src/pages/index.astro                    # Tasks 3, 5
src/pages/gracias.astro                  # Task 4
src/pages/robots.txt.ts                  # Task 5
tests/e2e/cms.spec.ts                    # Task 1
tests/e2e/conversion.spec.ts             # Tasks 2–4
tests/e2e/seo.spec.ts                    # Task 5
docs/guia-del-propietario.md             # Task 10
```

---

### Task 1: Keystatic admin (local mode) on the existing content

**Files:**
- Create: `keystatic.config.ts`, `tests/e2e/cms.spec.ts`
- Modify: `astro.config.ts`, `package.json`, `CLAUDE.md`

**Interfaces:**
- Consumes: `CATEGORIES` (`src/lib/categories.ts`), `DAYS` (`src/lib/hours.ts`), `HIGHLIGHT_ICONS` (`src/lib/icons.ts`), content layout from Part 1 Task 7
- Produces: `keystatic.config.ts` default export (a Keystatic `config`) with singleton `site` and collections `services`, `team`, `gallery`, `brands`, `reviews`; admin at `/keystatic` in `npm run dev`

- [ ] **Step 1: Install**

```bash
npm install @astrojs/netlify@^8.2.6 @astrojs/react@^7 react react-dom @keystatic/core @keystatic/astro
npm install -D @types/react @types/react-dom
```

- [ ] **Step 2: Update `astro.config.ts`**

```ts
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
  adapter: netlify({ imageCDN: false }),
  integrations: [icon({ include: ICON_INCLUDE }), react(), keystatic()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 3: Write `keystatic.config.ts`**

```ts
import { collection, config, fields, singleton } from '@keystatic/core';
import { CATEGORIES } from './src/lib/categories';
import { DAYS } from './src/lib/hours';
import { HIGHLIGHT_ICONS } from './src/lib/icons';

// Las imágenes se guardan en src/assets/img/<carpeta> para que Astro las optimice.
// publicPath es relativo al archivo YAML (src/content/<colección>/<slug>.yaml).
const image = (label: string, folder: string, isRequired = true) =>
  fields.image({
    label,
    directory: `src/assets/img/${folder}`,
    publicPath: `../../assets/img/${folder}/`,
    validation: { isRequired },
  });

const text = (label: string, max: number, opts: { multiline?: boolean; description?: string; min?: number } = {}) =>
  fields.text({
    label,
    description: opts.description,
    multiline: opts.multiline,
    validation: { length: { min: opts.min ?? 1, max } },
  });

const order = fields.integer({
  label: 'Orden',
  description: 'Número menor = aparece primero',
  defaultValue: 100,
  validation: { isRequired: true },
});

const TIME_HELP = 'Formato 24 h: HH:MM, por ejemplo 09:30 o 19:00';

export default config({
  storage: { kind: 'local' },
  ui: { brand: { name: 'Belyni' } },
  singletons: {
    site: singleton({
      label: 'Datos del salón',
      path: 'src/content/site/',
      format: { data: 'yaml' },
      schema: {
        name: text('Nombre del salón', 60),
        tagline: text('Frase principal (título grande)', 80),
        intro: text('Presentación corta', 220, { multiline: true }),
        heroImage: image('Foto principal', 'site'),
        heroImageAlt: text('Descripción de la foto principal', 140, {
          description: 'Qué se ve en la foto (para personas con discapacidad visual y para Google)',
        }),
        phone: text('Teléfono para llamadas', 25, { description: '10 dígitos, por ejemplo 229 225 8060' }),
        whatsapp: text('WhatsApp', 25, { description: '10 dígitos, por ejemplo 229 225 8060' }),
        whatsappMessage: text('Mensaje inicial de WhatsApp', 200, { multiline: true }),
        email: fields.text({ label: 'Correo (opcional)' }),
        address: fields.object(
          {
            street: text('Calle y número', 80),
            neighborhood: text('Colonia', 80),
            city: text('Ciudad', 60),
            region: text('Estado', 60),
            postalCode: fields.text({ label: 'Código postal (opcional)' }),
          },
          { label: 'Dirección' },
        ),
        geo: fields.object(
          {
            lat: fields.number({ label: 'Latitud', validation: { isRequired: true } }),
            lng: fields.number({ label: 'Longitud', validation: { isRequired: true } }),
          },
          { label: 'Coordenadas (para Google)' },
        ),
        mapsUrl: fields.url({ label: 'Enlace "Cómo llegar" (Google Maps)', validation: { isRequired: true } }),
        mapsEmbedUrl: fields.url({ label: 'Enlace del mapa incrustado', validation: { isRequired: true } }),
        instagram: fields.url({ label: 'Instagram (opcional)' }),
        facebook: fields.url({ label: 'Facebook (opcional)' }),
        hours: fields.array(
          fields.object({
            day: fields.select({
              label: 'Día',
              options: DAYS.map((d) => ({ label: d.label, value: d.id })),
              defaultValue: 'lunes',
            }),
            open: text('Abre', 5, { description: TIME_HELP, min: 5 }),
            close: text('Cierra', 5, { description: TIME_HELP, min: 5 }),
          }),
          {
            label: 'Horario',
            description: 'Un renglón por turno. Si cierran a mediodía, agrega dos renglones para ese día.',
            itemLabel: (p) => `${p.fields.day.value} ${p.fields.open.value}–${p.fields.close.value}`,
          },
        ),
        highlights: fields.array(
          fields.object({
            icon: fields.select({
              label: 'Ícono',
              options: HIGHLIGHT_ICONS.map((i) => ({ label: i, value: i })),
              defaultValue: 'sparkles',
            }),
            title: text('Título', 40),
            text: text('Texto', 140, { multiline: true }),
          }),
          {
            label: '¿Por qué Belyni? (máximo 4)',
            itemLabel: (p) => p.fields.title.value,
            validation: { length: { max: 4 } },
          },
        ),
        servicesNote: fields.text({ label: 'Nota bajo "Nuestros servicios" (opcional)', multiline: true }),
      },
    }),
  },
  collections: {
    services: collection({
      label: 'Servicios',
      path: 'src/content/services/*',
      slugField: 'name',
      format: { data: 'yaml' },
      columns: ['category', 'priceFrom'],
      schema: {
        name: fields.slug({ name: { label: 'Nombre', validation: { length: { min: 1, max: 60 } } } }),
        category: fields.select({
          label: 'Categoría',
          options: CATEGORIES.map((c) => ({ label: c.label, value: c.id })),
          defaultValue: 'cabello',
        }),
        description: text('Descripción', 160, { multiline: true }),
        priceFrom: fields.integer({ label: 'Precio desde (MXN, opcional)', validation: { min: 0 } }),
        durationMin: fields.integer({ label: 'Duración en minutos (opcional)', validation: { min: 0 } }),
        image: image('Foto (opcional)', 'services', false),
        imageAlt: fields.text({ label: 'Descripción de la foto' }),
        order,
      },
    }),
    team: collection({
      label: 'Equipo',
      path: 'src/content/team/*',
      slugField: 'name',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Nombre', validation: { length: { min: 1, max: 60 } } } }),
        role: text('Puesto', 60),
        photo: image('Foto', 'team'),
        photoAlt: fields.text({ label: 'Descripción de la foto' }),
        order,
      },
    }),
    gallery: collection({
      label: 'Galería',
      path: 'src/content/gallery/*',
      slugField: 'alt',
      format: { data: 'yaml' },
      schema: {
        alt: fields.slug({ name: { label: 'Descripción de la foto', validation: { length: { min: 1, max: 140 } } } }),
        image: image('Foto', 'gallery'),
        order,
      },
    }),
    brands: collection({
      label: 'Marcas',
      path: 'src/content/brands/*',
      slugField: 'name',
      format: { data: 'yaml' },
      schema: {
        name: fields.slug({ name: { label: 'Marca', validation: { length: { min: 1, max: 40 } } } }),
        logo: image('Logo', 'brands'),
        url: fields.url({ label: 'Sitio web (opcional)' }),
        order,
      },
    }),
    reviews: collection({
      label: 'Opiniones',
      path: 'src/content/reviews/*',
      slugField: 'author',
      format: { data: 'yaml' },
      schema: {
        author: fields.slug({ name: { label: 'Nombre de la clienta', validation: { length: { min: 1, max: 60 } } } }),
        text: text('Opinión', 300, { multiline: true }),
        rating: fields.integer({ label: 'Estrellas (1 a 5)', defaultValue: 5, validation: { min: 1, max: 5, isRequired: true } }),
        order,
      },
    }),
  },
});
```

- [ ] **Step 4: Round-trip check (the critical one)**

Run: `npm run dev` and open http://localhost:4321/keystatic

For each of these, open the item, confirm every field shows the current value, **change something small, save**, then run `git diff`:

1. Datos del salón: change `tagline`, save.
   Expected: `git diff` shows only `tagline` changed in **`src/content/site/index.yaml`**. If Keystatic wrote a different file (e.g. `src/content/site.yaml`), change `path` to match the existing file location and retry. The Astro loader in `content.config.ts` must keep reading the same file.
2. Servicios → Corte Dama: change `priceFrom` to 550, save.
   Expected: only `priceFrom` changes in `src/content/services/corte-dama.yaml`. The image preview shows `corte.jpg`. If the preview is empty (Keystatic expects `<folder>/<slug>/image.jpg`), re-upload the photo in the admin and confirm the new path resolves: `npx astro sync` passes.
3. Create a new service "Prueba", save, then delete it in the admin.
   Expected: file created then removed; `git status` clean apart from the two edits above.

Then revert the edits: `git checkout src/content`.

Run: `npm run build && npm test && npm run test:e2e`
Expected: all green (the adapter doesn't change the static output in `dist/`).

- [ ] **Step 5: E2E guard that the admin never reaches the static output**

`tests/e2e/cms.spec.ts`:
```ts
import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

test('admin UI is not part of the static build', async () => {
  expect(existsSync('dist/keystatic/index.html')).toBe(false);
});
```

Run: `npm run test:e2e -- cms`
Expected: PASS.

- [ ] **Step 6: Update `CLAUDE.md`** (append to Architecture):

```markdown
- **CMS**: Keystatic (`keystatic.config.ts`) edits the same YAML files at `/keystatic` (local mode in dev, GitHub mode in production). Any schema change must be made in **both** `keystatic.config.ts` and `src/content.config.ts`.
- `@astrojs/netlify` is only there for Keystatic's on-demand routes (`imageCDN: false`). Public pages are prerendered; `astro preview` is not supported, so use `npm run serve:dist`.
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Keystatic admin mirroring the content schemas

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: "Abierto ahora" badge

**Files:**
- Modify: `src/components/sections/Location.astro`
- Create: `tests/e2e/conversion.spec.ts`

**Interfaces:**
- Consumes: `isOpenAt`, `OpeningHours`, `DAY_IDS` (Part 1 Task 6); the `<p data-open-status hidden>` placeholder from Part 1 Task 12
- Produces: badge text `Abierto ahora` / `Cerrado ahora`; hidden when there are no hours

- [ ] **Step 1: Write failing E2E `tests/e2e/conversion.spec.ts`**

```ts
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
    const sameDayLater = hours.some((h: { day: string; open: string }) => h.day === first.day && h.open >= first.close);
    test.skip(sameDayLater, 'split shift starts right at close');
    await page.clock.setFixedTime(utcFor(first.day, first.close));
    await page.goto('/');
    await expect(page.locator('[data-open-status]')).toHaveText('Cerrado ahora');
  });
});
```

Run: `npm run test:e2e -- conversion`
Expected: with seed data (no hours) the "hidden" test passes and the others skip. To see the failing path, temporarily add to `site/index.yaml`:
```yaml
hours:
  - { day: lunes, open: '10:00', close: '19:00' }
```
Expected: "shows Abierto ahora" FAILS (badge stays hidden). Keep this temporary edit until Step 3.

- [ ] **Step 2: Implement in `Location.astro`**

Replace the placeholder `<p data-open-status …>` with:
```astro
<p
  data-open-status
  data-hours={JSON.stringify(site.hours)}
  hidden
  class="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
>
</p>
```

Add this second `<script>` at the end of the file:
```astro
<script>
  import { isOpenAt, type OpeningHours } from '../../lib/hours';

  // Se calcula en el navegador para que no dependa de cuándo se hizo el build
  const badge = document.querySelector<HTMLElement>('[data-open-status]');
  const hours = JSON.parse(badge?.dataset.hours ?? '[]') as OpeningHours[];

  if (badge && hours.length > 0) {
    const open = isOpenAt(hours, new Date());
    badge.textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
    badge.classList.add(...(open ? ['bg-green-100', 'text-green-800'] : ['bg-plum-100', 'text-plum-700']));
    badge.hidden = false;
  }
</script>
```

- [ ] **Step 3: Run tests, then remove the temporary hours**

Run: `npm run test:e2e -- conversion`
Expected: PASS (open and closed cases).

Undo the temporary `hours` edit in `site/index.yaml` (back to `hours: [] # PENDIENTE…`), then run again.
Expected: PASS (hidden case; others skipped).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Location.astro tests/e2e/conversion.spec.ts
git commit -m "feat: show open-now badge computed in salon timezone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Promotions with automatic expiry

**Files:**
- Modify: `src/lib/content-schema.ts`, `src/lib/content-schema.test.ts`, `src/content.config.ts`, `keystatic.config.ts`, `src/pages/index.astro`, `tests/e2e/conversion.spec.ts`
- Create: `src/lib/promotions.ts`, `src/lib/promotions.test.ts`, `src/components/sections/PromoBanner.astro`, `src/content/promotions/.gitkeep`

**Interfaces:**
- Consumes: `SALON_TIME_ZONE` (Part 1 Task 6), `whatsappUrl` (Part 1 Task 4)
- Produces:
  - `dateOnlySchema` (accepts `'YYYY-MM-DD'` or a YAML-parsed `Date`, outputs `'YYYY-MM-DD'`)
  - `localDate(date: Date, timeZone?: string): string` → `'YYYY-MM-DD'`
  - `isPromotionActive(p: PromotionWindow, now: Date, timeZone?): boolean` (inclusive both ends)
  - `isPromotionExpired(p: PromotionWindow, now: Date, timeZone?): boolean`
  - `interface PromotionWindow { startDate: string; endDate: string }`
  - collection `promotions`: `{ title, text, startDate, endDate, order }`
  - `<PromoBanner promos: PromotionData[] whatsapp: string>`

- [ ] **Step 1: Failing tests for `dateOnlySchema`** (append to `src/lib/content-schema.test.ts`, adding `dateOnlySchema` to the existing import)

```ts
describe('dateOnlySchema', () => {
  it('accepts YYYY-MM-DD strings', () => {
    expect(dateOnlySchema.parse('2026-10-31')).toBe('2026-10-31');
  });
  it('accepts Date objects produced by YAML parsers and keeps the calendar day', () => {
    expect(dateOnlySchema.parse(new Date('2026-10-31T00:00:00Z'))).toBe('2026-10-31');
  });
  it('rejects other formats with a Spanish message', () => {
    const result = dateOnlySchema.safeParse('31/10/2026');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/AAAA-MM-DD/);
  });
});
```

Run: `npm test -- content-schema`
Expected: FAIL, `dateOnlySchema` is not exported.

- [ ] **Step 2: Implement** (append to `src/lib/content-schema.ts`)

```ts
// Fechas sin hora; algunos parsers de YAML convierten 2026-10-31 en Date (a medianoche UTC)
export const dateOnlySchema = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato de fecha AAAA-MM-DD'),
);
```

Run: `npm test -- content-schema`
Expected: PASS.

- [ ] **Step 3: Failing tests `src/lib/promotions.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { isPromotionActive, isPromotionExpired, localDate } from './promotions';

const PROMO = { startDate: '2026-10-01', endDate: '2026-10-31' };

describe('localDate', () => {
  it('returns the calendar day in Veracruz, not UTC', () => {
    // 1 nov 05:30 UTC = 31 oct 23:30 en Veracruz
    expect(localDate(new Date('2026-11-01T05:30:00Z'))).toBe('2026-10-31');
  });
});

describe('isPromotionActive', () => {
  it('is inactive before the start date (local)', () => {
    // 1 oct 05:59 UTC = 30 sep 23:59 local
    expect(isPromotionActive(PROMO, new Date('2026-10-01T05:59:00Z'))).toBe(false);
  });
  it('is active from 00:00 local on the start date', () => {
    expect(isPromotionActive(PROMO, new Date('2026-10-01T06:00:00Z'))).toBe(true);
  });
  it('is still active late on the end date (local), even if UTC is the next day', () => {
    expect(isPromotionActive(PROMO, new Date('2026-11-01T05:30:00Z'))).toBe(true);
  });
  it('is inactive the day after the end date', () => {
    expect(isPromotionActive(PROMO, new Date('2026-11-01T06:00:00Z'))).toBe(false);
  });
  it('supports single-day promotions', () => {
    const oneDay = { startDate: '2026-12-24', endDate: '2026-12-24' };
    expect(isPromotionActive(oneDay, new Date('2026-12-24T18:00:00Z'))).toBe(true);
  });
});

describe('isPromotionExpired', () => {
  it('is false before and during, true after the end date', () => {
    expect(isPromotionExpired(PROMO, new Date('2026-09-15T12:00:00Z'))).toBe(false);
    expect(isPromotionExpired(PROMO, new Date('2026-10-15T12:00:00Z'))).toBe(false);
    expect(isPromotionExpired(PROMO, new Date('2026-11-02T12:00:00Z'))).toBe(true);
  });
});
```

Run: `npm test -- promotions`
Expected: FAIL, unresolved import.

- [ ] **Step 4: Implement `src/lib/promotions.ts`**

```ts
import { SALON_TIME_ZONE } from './hours';

export interface PromotionWindow {
  startDate: string;
  endDate: string;
}

// Día calendario (AAAA-MM-DD) en la zona horaria del salón
export function localDate(date: Date, timeZone: string = SALON_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

// Inclusivo en ambos extremos; las cadenas AAAA-MM-DD se comparan correctamente como texto
export function isPromotionActive(p: PromotionWindow, now: Date, timeZone: string = SALON_TIME_ZONE): boolean {
  const today = localDate(now, timeZone);
  return p.startDate <= today && today <= p.endDate;
}

export function isPromotionExpired(p: PromotionWindow, now: Date, timeZone: string = SALON_TIME_ZONE): boolean {
  return localDate(now, timeZone) > p.endDate;
}
```

Run: `npm test -- promotions`
Expected: PASS.

- [ ] **Step 5: Collection + admin**

In `src/content.config.ts`, add `dateOnlySchema` to the `./lib/content-schema` import and add:
```ts
const promotions = defineCollection({
  loader: yamlIn('promotions'),
  schema: z
    .object({
      title: z.string().min(1).max(60),
      text: z.string().min(1).max(160),
      startDate: dateOnlySchema,
      endDate: dateOnlySchema,
      order,
    })
    .refine((p) => p.startDate <= p.endDate, {
      message: 'La fecha de fin debe ser igual o posterior a la de inicio',
      path: ['endDate'],
    }),
});

export const collections = { site, services, team, gallery, brands, reviews, promotions };
```

```bash
touch src/content/promotions/.gitkeep
```

In `keystatic.config.ts`, add to `collections`:
```ts
    promotions: collection({
      label: 'Promociones',
      path: 'src/content/promotions/*',
      slugField: 'title',
      format: { data: 'yaml' },
      columns: ['startDate', 'endDate'],
      schema: {
        title: fields.slug({ name: { label: 'Título', validation: { length: { min: 1, max: 60 } } } }),
        text: text('Texto', 160, { multiline: true }),
        startDate: fields.date({ label: 'Empieza', validation: { isRequired: true } }),
        endDate: fields.date({ label: 'Termina (incluido)', validation: { isRequired: true } }),
        order,
      },
    }),
```

- [ ] **Step 6: `src/components/sections/PromoBanner.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { whatsappUrl } from '../../lib/whatsapp';

interface Props {
  promos: CollectionEntry<'promotions'>['data'][];
  whatsapp: string;
}
const { promos, whatsapp } = Astro.props;
---

<div class="bg-plum-900 text-sm text-white">
  {
    promos.map((promo) => (
      <p
        data-promo
        data-start={promo.startDate}
        data-end={promo.endDate}
        hidden
        class="mx-auto max-w-6xl px-4 py-2 text-center"
      >
        <strong class="font-semibold">{promo.title}:</strong> {promo.text}{' '}
        <a
          href={whatsappUrl(whatsapp, `Hola, me interesa la promoción: ${promo.title}`)}
          target="_blank"
          rel="noopener noreferrer"
          data-umami-event="whatsapp-promo"
          class="font-semibold underline underline-offset-2"
        >
          Aprovéchala
        </a>
      </p>
    ))
  }
</div>

<script>
  import { isPromotionActive } from '../../lib/promotions';

  // Muestra solo la primera promoción vigente hoy (hora de Veracruz)
  const now = new Date();
  const active = Array.from(document.querySelectorAll<HTMLElement>('[data-promo]')).find((el) =>
    isPromotionActive({ startDate: el.dataset.start ?? '', endDate: el.dataset.end ?? '' }, now),
  );
  if (active) active.hidden = false;
</script>
```

- [ ] **Step 7: Wire into `src/pages/index.astro`**

Imports:
```astro
import PromoBanner from '../components/sections/PromoBanner.astro';
import { isPromotionExpired } from '../lib/promotions';
```

Frontmatter (after the other collections):
```ts
// Las vencidas se excluyen en el build; las futuras se muestran solas al llegar su fecha
const promotions = (await getCollection('promotions'))
  .map((e) => e.data)
  .filter((p) => !isPromotionExpired(p, new Date()))
  .toSorted((a, b) => a.startDate.localeCompare(b.startDate) || a.order - b.order);
```

Markup, directly before `<Header …/>`:
```astro
  {promotions.length > 0 && <PromoBanner promos={promotions} whatsapp={site.whatsapp} />}
```

- [ ] **Step 8: E2E with a temporary promo** (append to `tests/e2e/conversion.spec.ts`)

```ts
import { readdirSync } from 'node:fs';

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
```

Create a temporary promo:
```bash
cat > src/content/promotions/prueba.yaml <<'EOF'
title: Prueba
text: Promoción de prueba
startDate: '2099-12-31'
endDate: '2099-12-31'
order: 1
EOF
```

Run: `npm run test:e2e -- conversion`
Expected: PASS. Then delete `src/content/promotions/prueba.yaml` and run again (Expected: skipped).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add promotions with salon-timezone date window

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Contact form (only if the owner wants one)

**Decision gate (ask both questions in the same conversation):**

1. "¿Quieres un formulario de contacto además de WhatsApp?" If **no**, skip this task and note it in `docs/astro-migration-plan.md`. If **yes**, create a free Web3Forms access key with the salon's email at https://web3forms.com.
2. "¿Quieres reservas en línea (Fresha, AgendaPro, Booksy) o seguimos solo con WhatsApp?" If **WhatsApp only**, nothing to do: Part 1 already gives every service its own pre-filled WhatsApp link. If they pick a tool, record the choice in `docs/astro-migration-plan.md` and write a separate follow-up plan: it needs an optional `bookingUrl` in the `site` schema and in Keystatic, plus a CTA swap in Header/Hero/Services, and the tool's account must be set up first. Don't reintroduce Calendly.

**Files:**
- Create: `src/env.d.ts`, `src/components/sections/ContactForm.astro`, `src/pages/gracias.astro`, `.env.example`
- Modify: `src/components/sections/Contact.astro`, `tests/e2e/conversion.spec.ts`

**Interfaces:**
- Consumes: `BaseLayout` (Part 1), env `PUBLIC_WEB3FORMS_KEY`
- Produces: `<ContactForm accessKey: string siteName: string>`; page `/gracias/` (noindex)

- [ ] **Step 1: Failing E2E** (append to `tests/e2e/conversion.spec.ts`)

```ts
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
```

Run: `PUBLIC_WEB3FORMS_KEY=test npm run test:e2e -- conversion`
Expected: FAIL (no form).

- [ ] **Step 2: `src/env.d.ts` and `.env.example`**

```ts
interface ImportMetaEnv {
  readonly PUBLIC_WEB3FORMS_KEY?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

`.env.example`:
```dotenv
# Formulario de contacto (Web3Forms). Vacío = sin formulario
PUBLIC_WEB3FORMS_KEY=
# Analítica (Umami Cloud). Vacío = sin analítica
PUBLIC_UMAMI_WEBSITE_ID=
# URL pública del sitio
SITE_URL=https://belyni.netlify.app
```

- [ ] **Step 3: `src/components/sections/ContactForm.astro`**

```astro
---
interface Props {
  accessKey: string;
  siteName: string;
}
const { accessKey, siteName } = Astro.props;
const redirectUrl = new URL('/gracias/', Astro.site).href;
const FIELD = 'w-full rounded-2xl border border-plum-200 bg-white px-4 py-3 focus:border-plum-500';
---

<form action="https://api.web3forms.com/submit" method="POST" class="mx-auto mt-10 grid max-w-3xl gap-4 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2">
  <input type="hidden" name="access_key" value={accessKey} />
  <input type="hidden" name="subject" value={`Nuevo mensaje desde el sitio de ${siteName}`} />
  <input type="hidden" name="from_name" value={siteName} />
  <input type="hidden" name="redirect" value={redirectUrl} />
  <!-- Trampa para bots: las personas no la ven -->
  <input type="checkbox" name="botcheck" class="hidden" style="display: none" tabindex="-1" autocomplete="off" />

  <label class="grid gap-1 text-sm font-medium">
    Nombre
    <input name="name" required maxlength="80" autocomplete="name" class={FIELD} />
  </label>
  <label class="grid gap-1 text-sm font-medium">
    Teléfono
    <input name="phone" type="tel" required maxlength="25" autocomplete="tel" inputmode="tel" class={FIELD} />
  </label>
  <label class="grid gap-1 text-sm font-medium sm:col-span-2">
    Mensaje
    <textarea name="message" required maxlength="1000" rows="4" class={FIELD}></textarea>
  </label>
  <button type="submit" class="rounded-full bg-plum-500 px-6 py-3 text-sm font-semibold text-white hover:bg-plum-600 sm:col-span-2 sm:justify-self-start" data-umami-event="contact-form">
    Enviar mensaje
  </button>
</form>
```

- [ ] **Step 4: Render it in `Contact.astro`** (after the `</ul>`)

Frontmatter addition:
```ts
import ContactForm from './ContactForm.astro';
const formKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;
```

Markup:
```astro
  {formKey && <ContactForm accessKey={formKey} siteName={site.name} />}
```

- [ ] **Step 5: `src/pages/gracias.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import Button from '../components/ui/Button.astro';
import { getSite } from '../lib/site';

const site = await getSite();
---

<BaseLayout title={`Gracias | ${site.name}`} description="Recibimos tu mensaje." noindex>
  <main id="contenido" class="grid min-h-screen place-items-center px-4 text-center">
    <div>
      <h1 class="text-5xl font-semibold text-plum-900">¡Gracias por escribirnos!</h1>
      <p class="mt-4 text-muted">Te responderemos lo antes posible en horario de atención.</p>
      <Button href="/" class="mt-8">Volver al inicio</Button>
    </div>
  </main>
</BaseLayout>
```

(`noindex` is added to `BaseLayout` in Task 5. If you do this task first, add `noindex?: boolean` to its `Props` now and render `{noindex && <meta name="robots" content="noindex" />}` in `<head>`.)

- [ ] **Step 6: Run and commit**

Run: `PUBLIC_WEB3FORMS_KEY=test npm run test:e2e -- conversion` → PASS
Run: `npm run test:e2e -- conversion` → form tests skipped, rest PASS

Manual: with the real key in `.env`, submit once from `npm run dev`; the owner's inbox receives the message.

```bash
git add -A
git commit -m "feat: add optional Web3Forms contact form with honeypot and thank-you page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: SEO: meta, Open Graph, JSON-LD, sitemap, robots

**Files:**
- Create: `src/lib/seo.ts`, `src/lib/seo.test.ts`, `src/pages/robots.txt.ts`, `scripts/make-og-image.mjs`, `public/og.jpg`, `tests/e2e/seo.spec.ts`
- Modify: `src/layouts/BaseLayout.astro`, `src/pages/index.astro`, `astro.config.ts`, `package.json`

**Interfaces:**
- Consumes: `normalizeMxPhone` (Part 1), `OpeningHours`, `DayId`
- Produces:
  - `interface LocalBusinessInput { name; intro; phone; email?; address: {street; neighborhood; city; region; postalCode?}; geo: {lat; lng}; hours: OpeningHours[]; instagram?; facebook? }` (`SiteData` satisfies it)
  - `buildLocalBusinessJsonLd(site: LocalBusinessInput, pageUrl: string, imageUrl: string): Record<string, unknown>`
  - `serializeJsonLd(data: unknown): string` (escapes `<`)
  - `BaseLayout` props: `title: string; description: string; image?: string; noindex?: boolean; jsonLd?: Record<string, unknown>`

- [ ] **Step 1: Failing tests `src/lib/seo.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { buildLocalBusinessJsonLd, serializeJsonLd, type LocalBusinessInput } from './seo';

const SITE: LocalBusinessInput = {
  name: 'Belyni',
  intro: 'Salón de belleza en Veracruz.',
  phone: '229 225 8060',
  address: { street: 'Juan Enríquez 431', neighborhood: 'Ricardo Flores Magón', city: 'Veracruz', region: 'Veracruz' },
  geo: { lat: 19.18, lng: -96.12 },
  hours: [
    { day: 'lunes', open: '10:00', close: '19:00' },
    { day: 'sabado', open: '09:00', close: '14:00' },
  ],
  instagram: 'https://www.instagram.com/belynisalon/',
};

describe('buildLocalBusinessJsonLd', () => {
  const ld = buildLocalBusinessJsonLd(SITE, 'https://belyni.mx/', 'https://belyni.mx/og.jpg');

  it('describes a BeautySalon with international phone and MX address', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('BeautySalon');
    expect(ld.telephone).toBe('+522292258060');
    expect(ld.address).toMatchObject({
      '@type': 'PostalAddress',
      streetAddress: 'Juan Enríquez 431, Ricardo Flores Magón',
      addressLocality: 'Veracruz',
      addressCountry: 'MX',
    });
    expect(ld).not.toHaveProperty('address.postalCode');
  });

  it('maps opening hours to schema.org days', () => {
    expect(ld.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '10:00', closes: '19:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Saturday', opens: '09:00', closes: '14:00' },
    ]);
  });

  it('lists only existing social profiles and omits empty hours/email', () => {
    expect(ld.sameAs).toEqual(['https://www.instagram.com/belynisalon/']);
    expect(ld).not.toHaveProperty('email');
    const noHours = buildLocalBusinessJsonLd({ ...SITE, hours: [], instagram: undefined }, 'https://belyni.mx/', 'x');
    expect(noHours).not.toHaveProperty('openingHoursSpecification');
    expect(noHours).not.toHaveProperty('sameAs');
  });
});

describe('serializeJsonLd', () => {
  it('cannot close the script tag or inject markup', () => {
    const out = serializeJsonLd({ name: 'Belyni </script><script>alert(1)</script>' });
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe('Belyni </script><script>alert(1)</script>');
  });
});
```

Run: `npm test -- seo`
Expected: FAIL, unresolved import.

- [ ] **Step 2: Implement `src/lib/seo.ts`**

```ts
import type { DayId, OpeningHours } from './hours';
import { normalizeMxPhone } from './phone';

export interface LocalBusinessInput {
  name: string;
  intro: string;
  phone: string;
  email?: string;
  address: { street: string; neighborhood: string; city: string; region: string; postalCode?: string };
  geo: { lat: number; lng: number };
  hours: OpeningHours[];
  instagram?: string;
  facebook?: string;
}

const SCHEMA_DAY: Record<DayId, string> = {
  lunes: 'Monday',
  martes: 'Tuesday',
  miercoles: 'Wednesday',
  jueves: 'Thursday',
  viernes: 'Friday',
  sabado: 'Saturday',
  domingo: 'Sunday',
};

// Datos estructurados para Google (BeautySalon ⊂ LocalBusiness)
export function buildLocalBusinessJsonLd(
  site: LocalBusinessInput,
  pageUrl: string,
  imageUrl: string,
): Record<string, unknown> {
  const sameAs = [site.instagram, site.facebook].filter((u): u is string => Boolean(u));
  return {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: site.name,
    description: site.intro,
    url: pageUrl,
    image: imageUrl,
    telephone: `+52${normalizeMxPhone(site.phone)}`,
    ...(site.email && { email: site.email }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${site.address.street}, ${site.address.neighborhood}`,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      ...(site.address.postalCode && { postalCode: site.address.postalCode }),
      addressCountry: 'MX',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    ...(site.hours.length > 0 && {
      openingHoursSpecification: site.hours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${SCHEMA_DAY[h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
    }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

// JSON seguro dentro de <script>: "<" se escapa para que no pueda cerrar la etiqueta
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
```

Run: `npm test -- seo`
Expected: PASS.

- [ ] **Step 3: OG image generator** (`scripts/make-og-image.mjs`)

```js
// Genera public/og.jpg (1200×630) para vistas previas en WhatsApp/Facebook
import sharp from 'sharp';

const WIDTH = 1200;
const HEIGHT = 630;

const hero = await sharp('src/assets/img/site/hero.png').resize(HEIGHT, HEIGHT, { fit: 'cover' }).toBuffer();
const logo = await sharp('src/assets/img/logo-name.png').resize({ width: 460 }).toBuffer();
const { height: logoHeight = 0 } = await sharp(logo).metadata();

await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: '#fbeceb' } })
  .composite([
    { input: hero, left: WIDTH - HEIGHT, top: 0 },
    { input: logo, left: 70, top: Math.round((HEIGHT - logoHeight) / 2) },
  ])
  .jpeg({ quality: 82 })
  .toFile('public/og.jpg');

console.log('public/og.jpg generado');
```

```bash
npm install -D sharp
npm pkg set scripts.og="node scripts/make-og-image.mjs"
npm run og
```
Expected: `public/og.jpg` exists, 1200×630, < 150 KB. Open it and check the logo sits on the left over blush, with the photo on the right. (If the owner changes the hero photo in the admin, rerun `npm run og`; the owner guide mentions it.)

- [ ] **Step 4: Sitemap + robots**

```bash
npm install @astrojs/sitemap@^3.7.4
```

`astro.config.ts`: add `import sitemap from '@astrojs/sitemap';` and extend integrations:
```ts
  integrations: [
    icon({ include: ICON_INCLUDE }),
    react(),
    keystatic(),
    sitemap({ filter: (page) => !page.includes('/gracias') && !page.includes('/keystatic') }),
  ],
```

`src/pages/robots.txt.ts`:
```ts
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\nDisallow: /keystatic\nDisallow: /gracias\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
```

- [ ] **Step 5: Failing E2E `tests/e2e/seo.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('meta, Open Graph and canonical are present', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\.jpg$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'es_MX');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
});

test('JSON-LD is valid BeautySalon data', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').textContent();
  const ld = JSON.parse(raw ?? '{}');
  expect(ld['@type']).toBe('BeautySalon');
  expect(ld.telephone).toMatch(/^\+52\d{10}$/);
});

test('robots.txt blocks admin and points to the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Disallow: /keystatic');
  expect(body).toMatch(/Sitemap: https:\/\/.+\/sitemap-index\.xml/);
});

test('sitemap excludes admin and thank-you pages', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  const child = index.match(/<loc>[^<]*\/(sitemap-\d+\.xml)<\/loc>/)?.[1];
  expect(child).toBeTruthy();
  const urls = await (await request.get(`/${child}`)).text();
  expect(urls).not.toContain('/keystatic');
  expect(urls).not.toContain('/gracias');
});

test('thank-you page is noindex', async ({ page }) => {
  const res = await page.goto('/gracias/');
  test.skip(res?.status() === 404, 'contact form not enabled');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
```

Run: `npm run test:e2e -- seo`
Expected: FAIL on meta/OG/JSON-LD (not rendered yet); robots/sitemap tests pass.

- [ ] **Step 6: Update `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/manrope';
import '../styles/global.css';
import { serializeJsonLd } from '../lib/seo';

interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}
const { title, description, image = '/og.jpg', noindex = false, jsonLd } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site).href;
const imageUrl = new URL(image, Astro.site).href;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    {noindex && <meta name="robots" content="noindex" />}
    <link rel="icon" href="/favicon.png" type="image/png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <meta name="theme-color" content="#a44c7e" />

    <meta property="og:type" content="website" />
    <meta property="og:locale" content="es_MX" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />

    {jsonLd && <script is:inline type="application/ld+json" set:html={serializeJsonLd(jsonLd)} />}
    <slot name="head" />
  </head>
  <body>
    <a
      href="#contenido"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >Saltar al contenido</a
    >
    <slot />
  </body>
</html>
```

- [ ] **Step 7: Pass JSON-LD from `src/pages/index.astro`**

Frontmatter:
```ts
import { buildLocalBusinessJsonLd } from '../lib/seo';

const pageUrl = new URL('/', Astro.site).href;
const jsonLd = buildLocalBusinessJsonLd(site, pageUrl, new URL('/og.jpg', Astro.site).href);
```

Layout tag:
```astro
<BaseLayout
  title={`${site.name} | Salón de belleza en ${site.address.city}`}
  description={site.intro}
  jsonLd={jsonLd}
>
```

- [ ] **Step 8: Run all tests and validate externally**

Run: `npm test && npm run test:e2e`
Expected: PASS.

Manual: paste the built `dist/index.html` JSON-LD into https://validator.schema.org. Expected: `BeautySalon`, 0 errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add SEO meta, Open Graph image, BeautySalon JSON-LD, sitemap and robots

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Privacy-friendly analytics (Umami, optional)

**Files:**
- Modify: `src/layouts/BaseLayout.astro`, `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `PUBLIC_UMAMI_WEBSITE_ID`; the `data-umami-event` attributes already placed in Part 1 (header, hero, FAB, services, directions, contact) and Tasks 3–4
- Produces: Umami script only when the env var is set

- [ ] **Step 1: Failing E2E** (append to `tests/e2e/seo.spec.ts`)

```ts
test('analytics script only when configured', async ({ page }) => {
  await page.goto('/');
  const expected = process.env.PUBLIC_UMAMI_WEBSITE_ID ? 1 : 0;
  await expect(page.locator('script[src="https://cloud.umami.is/script.js"]')).toHaveCount(expected);
});

test('conversion links are tagged for analytics', async ({ page }) => {
  await page.goto('/');
  for (const event of ['whatsapp-fab', 'whatsapp-hero', 'directions', 'call']) {
    await expect(page.locator(`[data-umami-event="${event}"]`).first()).toBeAttached();
  }
});
```

Run: `PUBLIC_UMAMI_WEBSITE_ID=test npm run test:e2e -- seo`
Expected: "analytics script" FAILS.

- [ ] **Step 2: Add to `<head>` in `BaseLayout.astro`** (just before `<slot name="head" />`)

```astro
    {
      import.meta.env.PUBLIC_UMAMI_WEBSITE_ID && (
        <script
          is:inline
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id={import.meta.env.PUBLIC_UMAMI_WEBSITE_ID}
        />
      )
    }
```

- [ ] **Step 3: Run and commit**

Run: `PUBLIC_UMAMI_WEBSITE_ID=test npm run test:e2e -- seo` → PASS
Run: `npm run test:e2e -- seo` → PASS

```bash
git add src/layouts/BaseLayout.astro tests/e2e/seo.spec.ts
git commit -m "feat: add optional Umami analytics with tagged conversion events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Production-data gate

**Files:**
- Create: `src/lib/production-gate.ts`, `src/lib/production-gate.test.ts`, `scripts/check-production-data.mjs`, `netlify.toml`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `interface ContentFile { path: string; content: string }`
  - `findPendingMarkers(files: readonly ContentFile[]): string[]` → `"path:line: text"`
  - `productionProblems(files: readonly ContentFile[], site: { hours?: unknown[] | null }): string[]`
  - `npm run check:production` (exits 1 with a Spanish list of problems)

- [ ] **Step 1: Failing tests `src/lib/production-gate.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { findPendingMarkers, productionProblems } from './production-gate';

const files = [
  { path: 'src/content/site/index.yaml', content: 'name: Belyni\nphone: 229 # PENDIENTE: confirmar\n' },
  { path: 'src/content/services/corte.yaml', content: 'name: Corte\n' },
];

describe('findPendingMarkers', () => {
  it('reports file and line of every PENDIENTE (case-insensitive)', () => {
    expect(findPendingMarkers([...files, { path: 'x.yaml', content: 'a\nb # pendiente' }])).toEqual([
      'src/content/site/index.yaml:2: phone: 229 # PENDIENTE: confirmar',
      'x.yaml:2: b # pendiente',
    ]);
  });
  it('returns [] when everything is confirmed', () => {
    expect(findPendingMarkers([files[1]])).toEqual([]);
  });
});

describe('productionProblems', () => {
  it('requires opening hours', () => {
    expect(productionProblems([files[1]], { hours: [] })).toEqual([
      'Falta el horario de atención (hours) en src/content/site/index.yaml',
    ]);
    expect(productionProblems([files[1]], { hours: null })).toHaveLength(1);
  });
  it('passes with confirmed data and hours', () => {
    expect(productionProblems([files[1]], { hours: [{ day: 'lunes' }] })).toEqual([]);
  });
  it('lists pending markers as problems', () => {
    expect(productionProblems(files, { hours: [{}] })[0]).toMatch(/^Dato sin confirmar → src\/content\/site/);
  });
});
```

Run: `npm test -- production-gate`
Expected: FAIL, unresolved import.

- [ ] **Step 2: Implement `src/lib/production-gate.ts`** (only erasable TypeScript syntax, so Node can run it directly)

```ts
export interface ContentFile {
  path: string;
  content: string;
}

export function findPendingMarkers(files: readonly ContentFile[]): string[] {
  return files.flatMap((file) =>
    file.content
      .split('\n')
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => /PENDIENTE/i.test(line))
      .map(({ line, number }) => `${file.path}:${number}: ${line.trim()}`),
  );
}

export function productionProblems(
  files: readonly ContentFile[],
  site: { hours?: unknown[] | null },
): string[] {
  const pending = findPendingMarkers(files).map((m) => `Dato sin confirmar → ${m}`);
  const missingHours =
    !site.hours || site.hours.length === 0
      ? ['Falta el horario de atención (hours) en src/content/site/index.yaml']
      : [];
  return [...pending, ...missingHours];
}
```

Run: `npm test -- production-gate`
Expected: PASS.

- [ ] **Step 3: `scripts/check-production-data.mjs`**

```js
// Bloquea el deploy a producción si hay datos sin confirmar (Node ≥ 22.18 ejecuta .ts directamente)
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { productionProblems } from '../src/lib/production-gate.ts';

const contentDir = join(import.meta.dirname, '..', 'src', 'content');

const files = readdirSync(contentDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
  .map((entry) => {
    const fullPath = join(entry.parentPath, entry.name);
    return { path: relative(process.cwd(), fullPath), content: readFileSync(fullPath, 'utf8') };
  });

const site = parse(readFileSync(join(contentDir, 'site', 'index.yaml'), 'utf8')) ?? {};
const problems = productionProblems(files, site);

if (problems.length > 0) {
  console.error('❌ El sitio no está listo para producción:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log('✅ Datos de producción confirmados');
```

```bash
npm pkg set scripts.check:production="node scripts/check-production-data.mjs"
npm run check:production
```
Expected (with seed data): exit 1, listing every `PENDIENTE` line plus the missing hours.

- [ ] **Step 4: `netlify.toml`** (production runs the gate; deploy previews don't)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"

[context.production]
  command = "npm run check:production && npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: block production deploys while content has unconfirmed data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CI with Lighthouse budgets

**Files:**
- Create: `.github/workflows/ci.yml`, `lighthouserc.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `npm run test:coverage`, `npm run test:e2e`, `npm run serve:dist`
- Produces: required PR check "CI / test"

- [ ] **Step 1: Install and configure Lighthouse CI**

```bash
npm install -D @lhci/cli@^0.15.1
npm pkg set scripts.lhci="lhci autorun"
```

`lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run serve:dist",
      "startServerReadyPattern": "Accepting connections",
      "url": ["http://localhost:4322/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Run: `npm run build && npm run lhci`
Expected: all assertions pass. If performance fails on LCP, check the hero `<Picture>` has `loading="eager"` and `fetchpriority="high"` and that the AVIF is < 150 KB.

- [ ] **Step 2: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          CI: true
      - run: npm run lhci
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

- [ ] **Step 3: Verify on GitHub**

```bash
git add -A
git commit -m "ci: run unit, E2E and Lighthouse checks on every PR

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/astro-migration
gh pr create --draft --title "feat: migrate site to Astro + Tailwind with Keystatic CMS" --body "Implements docs/superpowers/plans/2026-09-27-belyni-part1-foundation-ui.md and part2-cms-launch.md.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh pr checks --watch
```
Expected: "CI / test" passes. Then in GitHub → Settings → Branches, protect `main` and require "CI / test".

---

### Task 9: Deploy to Netlify, Keystatic GitHub mode, domain, nightly rebuild

**Files:**
- Modify: `keystatic.config.ts`, `.env.example`
- Create: `.github/workflows/nightly-rebuild.yml`

**Interfaces:**
- Consumes: `netlify.toml` (Task 7), CI (Task 8)
- Produces: production site, deploy previews per PR, owner-accessible `/keystatic` in production

- [ ] **Step 1: Switch Keystatic storage to GitHub in production** (`keystatic.config.ts`)

```ts
export default config({
  // Local en desarrollo; en producción cada guardado es un commit en GitHub
  storage: import.meta.env.PROD
    ? { kind: 'github', repo: 'didierthomasm/belyni' }
    : { kind: 'local' },
  // …resto igual
```

Append to `.env.example`:
```dotenv
# Keystatic (modo GitHub, solo en producción). Los genera el asistente de /keystatic
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
KEYSTATIC_SECRET=
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=
```

- [ ] **Step 2: Create the Netlify site** (owner's account, developer as collaborator)

1. The owner creates a Netlify account (free) and invites the developer.
2. Netlify → Add new site → Import from GitHub → `didierthomasm/belyni`. Build settings come from `netlify.toml`.
3. Environment variables: `SITE_URL` (the final URL), plus `PUBLIC_WEB3FORMS_KEY` / `PUBLIC_UMAMI_WEBSITE_ID` if Tasks 4/6 are enabled.
4. Deploy notifications → **Email on "Deploy failed"** to the developer **and** the owner. (This is how a bad edit in the admin gets noticed; the live site keeps the last good deploy.)

Expected: the PR's deploy preview builds (the gate doesn't run on previews).

- [ ] **Step 3: Create the Keystatic GitHub App**

1. Locally, set `SITE_URL` to the Netlify URL, run `npm run build && npx netlify dev` (or deploy a preview), open `/keystatic`, and follow the "Create GitHub App" wizard. It writes the four `KEYSTATIC_*` values into `.env`.
2. Copy those four values into Netlify environment variables. **Never commit `.env`** (it's gitignored since Part 1).
3. In the GitHub App settings, set the callback URL to `https://<site>/api/keystatic/github/oauth/callback`.
4. Add the owner's GitHub account as a collaborator on the repo (write access) and install the app on the repo.

Verify: in an incognito window, `https://<site>/keystatic` asks for GitHub sign-in (Review Focus 5). After signing in as the owner, editing `tagline` creates a commit on `main` and Netlify redeploys within ~2 minutes.

> If the owner finds GitHub sign-in too technical: Keystatic Cloud (`storage: { kind: 'cloud' }` + `cloud: { project: '<team>/<project>' }`) lets them sign in with email. Check current Keystatic Cloud pricing and limits before switching.

- [ ] **Step 4: Failed-edit drill**

As the owner in production admin, set WhatsApp to `229 000` and save.
Expected: Netlify deploy fails with `Teléfono inválido: usa 10 dígitos…`, the failure email arrives, and the live site still shows the previous number. Fix the value in the admin; the next deploy succeeds.

- [ ] **Step 5: Nightly rebuild** (keeps promotions and the footer year fresh in the static HTML)

Netlify → Build hooks → create "nightly". Save its URL as GitHub secret `NETLIFY_BUILD_HOOK`.

`.github/workflows/nightly-rebuild.yml`:
```yaml
name: Nightly rebuild

on:
  schedule:
    - cron: '0 7 * * *' # 01:00 en Veracruz
  workflow_dispatch:

jobs:
  rebuild:
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsS -X POST -d '{}' "$HOOK"
        env:
          HOOK: ${{ secrets.NETLIFY_BUILD_HOOK }}
```

Verify: Actions → "Nightly rebuild" → Run workflow. Expected: a new Netlify deploy starts.

- [ ] **Step 6: Go live**

1. Resolve every `PENDIENTE` with the owner (in the admin or YAML) and add the real hours. `npm run check:production` exits 0.
2. Merge the PR. The production deploy runs the gate and succeeds.
3. Custom domain: Netlify → Domain management → add the owner's domain (e.g. `belyni.mx`), follow the DNS instructions, enable HTTPS, and set `SITE_URL` to the final domain, then redeploy.
4. Google Business Profile: make sure name, address, phone, hours and website URL match the site exactly.
5. Submit `https://<domain>/sitemap-index.xml` in Google Search Console (owner's account).

- [ ] **Step 7: Commit**

```bash
git add keystatic.config.ts .env.example .github/workflows/nightly-rebuild.yml
git commit -m "chore: enable Keystatic GitHub storage in production and nightly rebuilds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Owner guide (Spanish) and handoff

**Files:**
- Create: `docs/guia-del-propietario.md`
- Modify: `docs/astro-migration-plan.md` (tick Phases 2–7), `CLAUDE.md`

- [ ] **Step 1: Write `docs/guia-del-propietario.md`**

```markdown
# Guía para administrar el sitio de Belyni

## Entrar al panel

1. Abre **https://<tu-dominio>/keystatic** desde tu computadora o celular.
2. Toca **Iniciar sesión con GitHub** y usa tu cuenta.
3. Verás el menú: **Datos del salón, Servicios, Promociones, Equipo, Galería, Marcas, Opiniones**.

Cada vez que guardas, el sitio se actualiza solo en **1 a 2 minutos**.

## Cambiar un precio

1. **Servicios** → toca el servicio.
2. Cambia **Precio desde (MXN)**. Solo números, sin "$" ni comas (ej. `550`).
3. Si lo dejas vacío, el sitio muestra "Precio a consultar".
4. Toca **Guardar**.

## Agregar un servicio

1. **Servicios** → **Agregar**.
2. Llena **Nombre**, **Categoría** y **Descripción** (máximo 160 letras).
3. Foto opcional: horizontal, bien iluminada. **Orden**: número menor = aparece primero.
4. **Guardar**.

## Cambiar el horario

1. **Datos del salón** → **Horario**.
2. Un renglón por turno: día, hora de apertura y cierre en formato 24 h (`09:30`, `19:00`).
3. Si cierran a mediodía, pon **dos renglones** para ese día (ej. `09:00–14:00` y `16:00–19:00`).
4. Días sin renglón aparecen como **Cerrado**.

## Crear una promoción

1. **Promociones** → **Agregar**.
2. Título corto, texto, fecha de inicio y de fin (el día de fin **sí** cuenta).
3. Aparece sola en la franja superior del sitio en esas fechas y desaparece al terminar.

## Fotos

- Usa fotos **reales** del salón y de tu trabajo; generan más confianza que las de internet.
- Horizontales para servicios y galería, verticales para el equipo.
- Siempre llena **Descripción de la foto** (ej. "Balayage rubio en cabello largo").
- Si tu foto pesa más de 5 MB, reduce su tamaño antes de subirla (en el celular: compartir → "Tamaño mediano").
- Si cambias la **foto principal**, avísale a tu desarrollador para actualizar la imagen que aparece al compartir el enlace en WhatsApp.

## Si algo sale mal

- Si guardas un dato con formato incorrecto (ej. teléfono incompleto), **el sitio no se rompe**: sigue mostrando la versión anterior y te llegará un correo "Deploy failed". Corrige el dato y guarda de nuevo.
- Todo cambio queda registrado y se puede deshacer. Escríbele a tu desarrollador con la fecha y lo que cambiaste.

## Cuentas que son tuyas

| Servicio | Para qué |
|---|---|
| GitHub | Guardar el contenido del sitio |
| Netlify | Publicar el sitio |
| Dominio (ej. belyni.mx) | La dirección del sitio |
| Google Business Profile | Aparecer en Google Maps |
| Web3Forms / Umami (si aplica) | Formulario y estadísticas |
```

- [ ] **Step 2: Handoff session (30 min, with the owner)**

Checklist to run through together, with the owner driving:
- [ ] Sign in to `/keystatic` from their own phone
- [ ] Change a price and see it live
- [ ] Create and delete a test promotion
- [ ] Confirm they receive the Netlify "Deploy failed" email (from the Task 9 drill)
- [ ] Confirm they own the Netlify, GitHub, domain and Google Business Profile accounts

- [ ] **Step 3: Close out docs**

Tick Phases 2–7 in `docs/astro-migration-plan.md` and add a "Launched on <date>" line at the top. In `CLAUDE.md`, add under "Known state / gotchas":

```markdown
- Production deploys run `npm run check:production`, which fails on any `PENDIENTE` marker or empty hours.
- A nightly GitHub Action triggers a Netlify rebuild (promotions, footer year).
- Owner-facing instructions live in `docs/guia-del-propietario.md` (Spanish); keep them in sync with `keystatic.config.ts` labels.
```

- [ ] **Step 4: Commit**

```bash
git add docs CLAUDE.md
git commit -m "docs: add Spanish owner guide and close out migration plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
