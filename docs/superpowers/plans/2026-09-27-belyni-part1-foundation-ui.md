# Belyni Part 1: Foundation + New UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Bulma prototype with an Astro 7 + Tailwind 4 single-page site whose every owner-editable string, price, photo and contact detail lives in YAML content files that a CMS (Part 2) can edit.

**Architecture:** Static Astro site. Content lives in `src/content/<collection>/*.yaml`, validated by Zod schemas in `src/content.config.ts`, laid out to match Keystatic's file conventions so Part 2 can add a CMS without moving files. Pure logic (phone normalization, WhatsApp links, price formatting, opening hours, grouping) lives in `src/lib/*.ts` and is unit-tested with Vitest. Components in `src/components/` only receive data. Client JS is limited to the mobile menu and the click-to-load map.

**Tech Stack:** Astro 7.3, Tailwind CSS 4.3 (`@tailwindcss/vite`), astro-icon 1.2 + Iconify (`lucide`, `simple-icons`), Fontsource variable fonts, Vitest 5 (+ `@vitest/coverage-v8`), Playwright 1.63, `serve` for testing the built output, Prettier. Node ≥ 22.12 (dev machine: 24.8).

**Spec:** [`docs/astro-migration-plan.md`](../../astro-migration-plan.md) (Phases 0–1). Background: [`docs/enhacement.md`](../../enhacement.md).

**Continues in:** [`2026-09-27-belyni-part2-cms-launch.md`](./2026-09-27-belyni-part2-cms-launch.md) (Phases 2–7).

## Global Constraints

- All user-facing copy in Spanish; `<html lang="es">`; code comments in Spanish (project convention). Identifiers, commit messages and test names in English.
- Brand colors: plum `#A44C7E` (logo), blush `#EDB7B4` (banner). Fonts: Cormorant Garamond (headings), Manrope (body), self-hosted via Fontsource.
- **No owner-editable content hard-coded in components.** Section headings may stay in components; everything else comes from `src/content/`.
- Zero client JS except: mobile menu (Task 9) and click-to-load map (Task 12).
- Content file layout must stay Keystatic-compatible: singleton `src/content/site/index.yaml`; collections `src/content/<name>/<slug>.yaml`; images referenced by paths relative to the YAML file (`../../assets/img/...`).
- Optional fields must accept `''` and `null` as "missing" (that's what Keystatic writes for empty fields).
- Phone numbers: Mexican, stored in any human format, normalized to 10 national digits; WhatsApp links are `https://wa.me/52<10 digits>`.
- Opening hours are always evaluated in `America/Mexico_City`.
- Never invent business data. Anything not confirmed by the owner is marked with a `# PENDIENTE` YAML comment (Part 2 adds a production gate that fails on it).
- Commits follow conventional format (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) and end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Lighthouse mobile ≥ 90 in all categories; first-load weight < 1 MB.

## Review Focus

1. **Phone typed in any format** ("(229) 225-8060", "+52 1 229 225 8060", "229.225.80.60"): every WhatsApp/tel link must normalize to the same number, and an invalid number must **fail the build with a Spanish message**, not ship a broken link. Pinned in Task 4 (unit) and Task 7 (schema).
2. **Spanish characters, `&`, emoji in names/messages** ("Uñas & pestañas 💅"): WhatsApp `?text=` must be correctly URL-encoded. Pinned in Task 4.
3. **Empty optional fields written by a CMS as `''` or `null`** (no price, no duration, no image, no email): must render "Precio a consultar", omit the image, and not throw. Pinned in Task 7 (schema) and Task 10 (E2E).
4. **Empty collections** (no gallery, brands, reviews, team, or hours yet): the section **and its nav link** must disappear, with no empty headings. Pinned in Task 8 (nav unit), Task 11 and Task 12 (E2E driven by the actual content files).
5. **Visitor or server outside Mexico's timezone / UTC day rollover**: Monday 19:30 in Veracruz is Tuesday 01:30 UTC; the schedule must use salon local time. Pinned in Task 6. Also, **long Spanish text at 375px** must not cause horizontal scroll. Pinned in Task 13.

---

## File Structure

```
.gitignore                         # Task 1
.prettierrc                        # Task 1
package.json                       # Task 1 (replaced), Task 2 (test scripts)
astro.config.ts                    # Task 1, Task 3 (icons)
tsconfig.json                      # Task 1
vitest.config.ts                   # Task 2
playwright.config.ts               # Task 2
public/favicon.png                 # Task 1
src/
  assets/img/
    hero.png                       # Task 1 (was bannerBelyniSinLetras.png)
    logo-name.png                  # Task 1
    services/corte.jpg             # Task 1
    services/manicure.jpg          # Task 1
    team/nieves.jpg                # Task 1
  styles/global.css                # Task 3: Tailwind + brand tokens
  layouts/BaseLayout.astro         # Task 3
  components/
    ui/Button.astro                # Task 3
    ui/Section.astro               # Task 3
    ui/SectionHeading.astro        # Task 3
    layout/Header.astro            # Task 9: nav + mobile menu script
    layout/Footer.astro            # Task 9
    layout/WhatsAppFab.astro       # Task 9
    sections/Hero.astro            # Task 10
    sections/Services.astro        # Task 10
    sections/Highlights.astro      # Task 11
    sections/Team.astro            # Task 11
    sections/Gallery.astro         # Task 11
    sections/Brands.astro          # Task 11
    sections/Reviews.astro         # Task 11
    sections/Location.astro        # Task 12: hours table + map facade
    sections/Contact.astro         # Task 12
  lib/
    phone.ts        (+ .test.ts)   # Task 4
    whatsapp.ts     (+ .test.ts)   # Task 4
    format.ts       (+ .test.ts)   # Task 5: price, duration
    hours.ts        (+ .test.ts)   # Task 6
    categories.ts                  # Task 7
    icons.ts                       # Task 3: icon whitelist shared with astro.config
    content-schema.ts (+ .test.ts) # Task 7: reusable Zod pieces
    services.ts     (+ .test.ts)   # Task 8: grouping/sorting
    nav.ts          (+ .test.ts)   # Task 8
    order.ts                       # Task 8
    site.ts                        # Task 8: getSite()
  content.config.ts                # Task 7
  content/
    site/index.yaml                # Task 7
    services/*.yaml                # Task 7
    team/nieves-munoz.yaml         # Task 7
    gallery/.gitkeep  brands/.gitkeep  reviews/.gitkeep   # Task 7
  pages/index.astro                # Task 1 (stub) → Tasks 9–12
tests/e2e/
  content.ts                       # Task 2: reads YAML so tests follow owner edits
  smoke.spec.ts                    # Task 2
  layout.spec.ts                   # Task 9
  sections.spec.ts                 # Tasks 10–12
  quality.spec.ts                  # Task 13
legacy/                            # Task 1 (old site, deleted in Task 13)
```

---

### Task 1: Scaffold Astro + Tailwind, move the old site aside

**Files:**

- Create: `.gitignore`, `.prettierrc`, `astro.config.ts`, `tsconfig.json`, `src/pages/index.astro`, `src/styles/global.css` (stub), `public/favicon.png`
- Replace: `package.json`
- Move: `index.html`, `script.js`, `resources/` → `legacy/`; selected images → `src/assets/img/`
- Delete: `package-lock.json`, `node_modules/` (both untracked)

**Interfaces:**

- Produces: `npm run dev|build|check`; image paths under `src/assets/img/` used by Tasks 7 and 9.

- [ ] **Step 1: Create the branch**

```bash
git checkout -b feat/astro-migration
```

- [ ] **Step 2: Add `.gitignore`**

```gitignore
# dependencias y builds
node_modules/
dist/
.astro/
.netlify/
coverage/
playwright-report/
test-results/
# entorno
.env
.env.*
!.env.example
# sistema / IDE
.DS_Store
.idea/
```

- [ ] **Step 3: Move the old site and pick the images to keep**

```bash
mkdir -p src/assets/img/services src/assets/img/team public legacy
git mv resources/img/bannerBelyniSinLetras.png src/assets/img/hero.png
git mv resources/img/logo-name.png src/assets/img/logo-name.png
git mv resources/img/corte.jpg src/assets/img/services/corte.jpg
git mv resources/img/manicure.jpg src/assets/img/services/manicure.jpg
git mv resources/img/nieves.jpg src/assets/img/team/nieves.jpg
git mv resources/img/logo.png public/favicon.png
find . -name .DS_Store -not -path './node_modules/*' -delete
git mv index.html script.js resources legacy/
rm -rf node_modules package-lock.json
```

Expected: `legacy/` holds `index.html`, `script.js`, `resources/css/styles.css` and the unused images (`Belyni.gif`, `banner.jpg`, `logo-name-svg.svg`, `tratamientos.jpeg`).

- [ ] **Step 4: Replace `package.json`**

```json
{
  "name": "belyni",
  "type": "module",
  "version": "2.0.0",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "check": "astro check",
    "format": "prettier --write ."
  }
}
```

- [ ] **Step 5: Install dependencies**

```bash
npm install astro@^7.3.5 @tailwindcss/vite@^4.3.3 tailwindcss@^4.3.3 astro-icon@^1.2.0 \
  @iconify-json/lucide @iconify-json/simple-icons \
  @fontsource-variable/cormorant-garamond @fontsource-variable/manrope
npm install -D @astrojs/check typescript prettier prettier-plugin-astro prettier-plugin-tailwindcss
```

- [ ] **Step 6: Add `astro.config.ts`, `tsconfig.json`, `.prettierrc`**

`astro.config.ts`:

```ts
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
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "legacy"]
}
```

`.prettierrc`:

```json
{
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/styles/global.css",
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

- [ ] **Step 7: Stub stylesheet and page**

`src/styles/global.css`:

```css
@import 'tailwindcss';
```

`src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Belyni</title>
  </head>
  <body>
    <h1 class="p-8 text-4xl text-pink-700">Belyni: en construcción</h1>
  </body>
</html>
```

- [ ] **Step 8: Verify build and dev server**

Run: `npm run build`
Expected: `astro check` reports `0 errors`, build finishes, `dist/index.html` exists.

Run: `npm run dev`, open http://localhost:4321
Expected: large pink "Belyni: en construcción" heading (Tailwind is working). Stop the server.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 + Tailwind 4, move Bulma site to legacy/

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Test harness (Vitest + Playwright)

**Files:**

- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/content.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (scripts)

**Interfaces:**

- Produces: `npm test` (unit), `npm run test:coverage`, `npm run test:e2e`; helpers `readSite(): Record<string, any>` and `countEntries(collection: string): number` in `tests/e2e/content.ts` for later E2E tasks.

- [ ] **Step 1: Install**

```bash
npm install -D vitest@^5 @vitest/coverage-v8 @playwright/test serve yaml
npx playwright install chromium
```

- [ ] **Step 2: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro check && astro build",
  "check": "astro check",
  "serve:dist": "serve dist -l 4321 --no-clipboard",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "format": "prettier --write ."
}
```

(`serve dist` is used instead of `astro preview` because the Netlify adapter added in Part 2 doesn't support `astro preview`.)

- [ ] **Step 3: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      // site.ts depende de astro:content (runtime de Astro); se cubre con E2E
      exclude: ['src/lib/**/*.test.ts', 'src/lib/site.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
```

- [ ] **Step 4: `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:4321', trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run build && npm run serve:dist',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 5: `tests/e2e/content.ts`** (tests derive expectations from the real content, so they keep passing when the owner edits it)

```ts
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const CONTENT_DIR = join(process.cwd(), 'src', 'content');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readSite(): Record<string, any> {
  return parse(readFileSync(join(CONTENT_DIR, 'site', 'index.yaml'), 'utf8'));
}

export function countEntries(collection: string): number {
  const dir = join(CONTENT_DIR, collection);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.yaml')).length;
}

export function hoursCount(): number {
  return (readSite().hours ?? []).length;
}
```

- [ ] **Step 6: Write the smoke test `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('home page responds in Spanish', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page).toHaveTitle(/Belyni/);
});
```

- [ ] **Step 7: Run it**

Run: `npm run test:e2e`
Expected: 2 passed (mobile + desktop).

Run: `npm test`
Expected: Vitest exits with "No test files found". That's expected until Task 4. Exit code 1 is OK here.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: add Vitest and Playwright harness with smoke test

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Design tokens, fonts, base layout, UI primitives

**Files:**

- Modify: `src/styles/global.css`, `astro.config.ts`, `src/pages/index.astro`
- Create: `src/lib/icons.ts`, `src/layouts/BaseLayout.astro`, `src/components/ui/Button.astro`, `src/components/ui/Section.astro`, `src/components/ui/SectionHeading.astro`
- Test: `tests/e2e/smoke.spec.ts`

**Interfaces:**

- Produces:
  - Tailwind tokens: `plum-{50,100,200,500,600,700,900}`, `blush-{50,100,300}`, `ink`, `muted`, `font-display`, `font-sans`
  - `HIGHLIGHT_ICONS` (readonly tuple of lucide names) and `HighlightIcon` type from `src/lib/icons.ts`
  - `<BaseLayout title: string description: string>` with a named slot `head`
  - `<Button href: string variant?: 'primary'|'secondary'|'ghost' external?: boolean ...a-attrs>`
  - `<Section id: string class?: string>`: renders `<section id aria-labelledby={`${id}-titulo`}>`
  - `<SectionHeading id: string title: string eyebrow?: string intro?: string>`: `id` must be `${sectionId}-titulo`

- [ ] **Step 1: Extend the smoke test (failing)**

Append to `tests/e2e/smoke.spec.ts`:

```ts
test('brand fonts and skip link', async ({ page }) => {
  await page.goto('/');
  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(bodyFont).toContain('Manrope');
  const h1Font = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(h1Font).toContain('Cormorant Garamond');

  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Saltar al contenido' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});
```

Run: `npm run test:e2e -- smoke`
Expected: FAIL (body font is the default sans; no skip link).

- [ ] **Step 2: Brand tokens in `src/styles/global.css`**

```css
@import 'tailwindcss';

/* Tokens de marca: plum del logo (#A44C7E) y blush del banner (#EDB7B4) */
@theme {
  --color-plum-50: #fbf4f8;
  --color-plum-100: #f5e4ee;
  --color-plum-200: #ebc9dc;
  --color-plum-500: #a44c7e;
  --color-plum-600: #8c3f6b;
  --color-plum-700: #733356;
  --color-plum-900: #3d1a2f;
  --color-blush-50: #fdf6f5;
  --color-blush-100: #fbeceb;
  --color-blush-300: #edb7b4;
  --color-ink: #1f1a1d;
  --color-muted: #6b5f66;

  --font-display: 'Cormorant Garamond Variable', ui-serif, Georgia, serif;
  --font-sans: 'Manrope Variable', ui-sans-serif, system-ui, sans-serif;
}

@layer base {
  html {
    scroll-behavior: smooth;
    scroll-padding-top: 5rem;
  }
  body {
    @apply bg-blush-50 font-sans text-ink antialiased;
  }
  h1,
  h2,
  h3 {
    @apply font-display text-balance;
  }
  :focus-visible {
    @apply outline-2 outline-offset-2 outline-plum-500;
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

- [ ] **Step 3: Icon whitelist `src/lib/icons.ts`** (astro-icon can only bundle icons it knows about; dynamic names from content must be listed here)

```ts
// Íconos que la dueña puede elegir para los "highlights" (Por qué Belyni)
export const HIGHLIGHT_ICONS = [
  'sparkles',
  'leaf',
  'shield-check',
  'heart',
  'award',
  'gem',
] as const;
export type HighlightIcon = (typeof HIGHLIGHT_ICONS)[number];

// Todos los íconos usados en el sitio, por set de Iconify
export const ICON_INCLUDE = {
  lucide: [
    ...HIGHLIGHT_ICONS,
    'menu',
    'x',
    'phone',
    'mail',
    'map-pin',
    'clock',
    'navigation',
    'map',
    'star',
  ],
  'simple-icons': ['whatsapp', 'instagram', 'facebook'],
};
```

Update `astro.config.ts`:

```ts
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
```

- [ ] **Step 4: `src/layouts/BaseLayout.astro`**

```astro
---
import '@fontsource-variable/cormorant-garamond';
import '@fontsource-variable/manrope';
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
---

<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.png" type="image/png" />
    <slot name="head" />
  </head>
  <body>
    <a
      href="#contenido"
      class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
    >
      Saltar al contenido
    </a>
    <slot />
  </body>
</html>
```

- [ ] **Step 5: UI primitives**

`src/components/ui/Button.astro`:

```astro
---
import type { HTMLAttributes } from 'astro/types';

type Variant = 'primary' | 'secondary' | 'ghost';
interface Props extends HTMLAttributes<'a'> {
  href: string;
  variant?: Variant;
  external?: boolean;
}
const { href, variant = 'primary', external = false, class: className, ...rest } = Astro.props;

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-plum-500 text-white shadow-sm hover:bg-plum-600',
  secondary: 'border border-plum-500 text-plum-700 hover:bg-plum-50',
  ghost: 'text-plum-700 hover:bg-plum-50',
};
const externalAttrs = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
---

<a
  href={href}
  class:list={[
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors',
    VARIANTS[variant],
    className,
  ]}
  {...externalAttrs}
  {...rest}
>
  <slot />
</a>
```

`src/components/ui/Section.astro`:

```astro
---
interface Props {
  id: string;
  class?: string;
}
const { id, class: className } = Astro.props;
---

<section id={id} aria-labelledby={`${id}-titulo`} class:list={['px-4 py-16 sm:py-24', className]}>
  <div class="mx-auto max-w-6xl">
    <slot />
  </div>
</section>
```

`src/components/ui/SectionHeading.astro`:

```astro
---
interface Props {
  id: string;
  title: string;
  eyebrow?: string;
  intro?: string;
}
const { id, title, eyebrow, intro } = Astro.props;
---

<header class="mx-auto mb-10 max-w-2xl text-center">
  {eyebrow && (
    <p class="mb-2 text-xs font-semibold tracking-[0.2em] text-plum-600 uppercase">{eyebrow}</p>
  )}
  <h2 id={id} class="text-4xl font-semibold text-plum-900 sm:text-5xl">
    {title}
  </h2>
  {intro && <p class="mt-4 text-muted">{intro}</p>}
</header>
```

- [ ] **Step 6: Use the layout in `src/pages/index.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="Belyni" description="Salón de belleza en Veracruz">
  <main id="contenido">
    <h1 class="p-8 text-5xl font-semibold text-plum-900">Belyni</h1>
  </main>
</BaseLayout>
```

- [ ] **Step 7: Run tests**

Run: `npm run test:e2e -- smoke`
Expected: all smoke tests PASS on mobile and desktop.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add brand tokens, self-hosted fonts, base layout and UI primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Phone normalization + WhatsApp links (TDD)

**Files:**

- Create: `src/lib/phone.ts`, `src/lib/phone.test.ts`, `src/lib/whatsapp.ts`, `src/lib/whatsapp.test.ts`

**Interfaces:**

- Produces:
  - `normalizeMxPhone(raw: string): string` (10 digits; throws `Error` with a Spanish message if invalid)
  - `isValidMxPhone(raw: string): boolean`
  - `telHref(raw: string): string` → `tel:+52XXXXXXXXXX`
  - `formatMxPhone(raw: string): string` → `229 225 8060`
  - `whatsappUrl(phone: string, message?: string): string`
  - `bookingMessage(baseMessage: string, serviceName?: string): string`

- [ ] **Step 1: Write failing tests `src/lib/phone.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { formatMxPhone, isValidMxPhone, normalizeMxPhone, telHref } from './phone';

describe('normalizeMxPhone', () => {
  it.each([
    ['2292258060', '2292258060'],
    ['229 225 8060', '2292258060'],
    ['(229) 225-8060', '2292258060'],
    ['229.225.80.60', '2292258060'],
    ['+52 229 225 8060', '2292258060'],
    ['52 2292258060', '2292258060'],
    ['+52 1 229 225 8060', '2292258060'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizeMxPhone(raw)).toBe(expected);
  });

  it.each(['', '12345', '229 225 806', '+1 555 123 4567 89', 'llámanos'])('rejects %s', (raw) => {
    expect(() => normalizeMxPhone(raw)).toThrow(/Número de teléfono inválido/);
  });
});

describe('isValidMxPhone', () => {
  it('returns true for valid and false for invalid numbers', () => {
    expect(isValidMxPhone('229 225 8060')).toBe(true);
    expect(isValidMxPhone('229 000')).toBe(false);
  });
});

describe('telHref / formatMxPhone', () => {
  it('builds an international tel: link', () => {
    expect(telHref('(229) 225-8060')).toBe('tel:+522292258060');
  });
  it('formats for display as 3-3-4', () => {
    expect(formatMxPhone('+52 1 2292258060')).toBe('229 225 8060');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- phone`
Expected: FAIL, "Failed to resolve import './phone'".

- [ ] **Step 3: Implement `src/lib/phone.ts`**

```ts
// Normaliza teléfonos mexicanos a 10 dígitos nacionales
const MX_COUNTRY_CODE = '52';
const NATIONAL_LENGTH = 10;

export function normalizeMxPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === NATIONAL_LENGTH) return digits;
  if (digits.length === 12 && digits.startsWith(MX_COUNTRY_CODE)) return digits.slice(2);
  // Prefijo "1" de celulares (formato anterior a 2019)
  if (digits.length === 13 && digits.startsWith(`${MX_COUNTRY_CODE}1`)) return digits.slice(3);
  throw new Error(
    `Número de teléfono inválido: "${raw}". Usa 10 dígitos, por ejemplo 229 225 8060.`,
  );
}

export function isValidMxPhone(raw: string): boolean {
  try {
    normalizeMxPhone(raw);
    return true;
  } catch {
    return false;
  }
}

export function telHref(raw: string): string {
  return `tel:+${MX_COUNTRY_CODE}${normalizeMxPhone(raw)}`;
}

export function formatMxPhone(raw: string): string {
  const d = normalizeMxPhone(raw);
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- phone`
Expected: PASS (all cases).

- [ ] **Step 5: Write failing tests `src/lib/whatsapp.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { bookingMessage, whatsappUrl } from './whatsapp';

describe('whatsappUrl', () => {
  it('builds a wa.me link with country code and no text', () => {
    expect(whatsappUrl('(229) 225-8060')).toBe('https://wa.me/522292258060');
  });

  it('URL-encodes Spanish characters, ampersands and emoji', () => {
    const url = whatsappUrl('2292258060', 'Hola, quiero: Uñas & pestañas 💅');
    expect(url).toBe(
      'https://wa.me/522292258060?text=Hola%2C%20quiero%3A%20U%C3%B1as%20%26%20pesta%C3%B1as%20%F0%9F%92%85',
    );
    expect(decodeURIComponent(new URL(url).searchParams.get('text') ?? '')).toBe(
      'Hola, quiero: Uñas & pestañas 💅',
    );
  });

  it('omits text when message is blank', () => {
    expect(whatsappUrl('2292258060', '   ')).toBe('https://wa.me/522292258060');
  });

  it('throws on an invalid phone instead of building a broken link', () => {
    expect(() => whatsappUrl('123')).toThrow(/Número de teléfono inválido/);
  });
});

describe('bookingMessage', () => {
  it('returns the base message when there is no service', () => {
    expect(bookingMessage('  Hola, quiero agendar una cita. ')).toBe(
      'Hola, quiero agendar una cita.',
    );
  });
  it('appends the service name', () => {
    expect(bookingMessage('Hola, quiero agendar una cita.', 'Corte Dama')).toBe(
      'Hola, quiero agendar una cita. Me interesa: Corte Dama.',
    );
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npm test -- whatsapp`
Expected: FAIL, "Failed to resolve import './whatsapp'".

- [ ] **Step 7: Implement `src/lib/whatsapp.ts`**

```ts
import { normalizeMxPhone } from './phone';

// Construye el enlace de WhatsApp (wa.me) con mensaje prellenado opcional
export function whatsappUrl(phone: string, message?: string): string {
  const base = `https://wa.me/52${normalizeMxPhone(phone)}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Mensaje de reserva; si hay servicio, se agrega al final
export function bookingMessage(baseMessage: string, serviceName?: string): string {
  const base = baseMessage.trim();
  return serviceName ? `${base} Me interesa: ${serviceName}.` : base;
}
```

- [ ] **Step 8: Run to verify pass**

Run: `npm test`
Expected: PASS (phone + whatsapp suites).

- [ ] **Step 9: Commit**

```bash
git add src/lib/phone.ts src/lib/phone.test.ts src/lib/whatsapp.ts src/lib/whatsapp.test.ts
git commit -m "feat: add Mexican phone normalization and WhatsApp link helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Price and duration formatting (TDD)

**Files:**

- Create: `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**

- Produces: `formatPrice(mxn: number): string` → `"$1,500"`; `formatDuration(minutes: number): string` → `"1 h 30 min"`

- [ ] **Step 1: Write failing tests `src/lib/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { formatDuration, formatPrice } from './format';

describe('formatPrice', () => {
  it.each([
    [0, '$0'],
    [500, '$500'],
    [1500, '$1,500'],
    [12500, '$12,500'],
  ])('formats %i MXN as %s', (value, expected) => {
    expect(formatPrice(value)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it.each([
    [30, '30 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [150, '2 h 30 min'],
  ])('formats %i minutes as %s', (value, expected) => {
    expect(formatDuration(value)).toBe(expected);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- format`
Expected: FAIL, "Failed to resolve import './format'".

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
// Precios en pesos mexicanos sin decimales: $1,500
const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(mxn: number): string {
  return priceFormatter.format(mxn);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- format`
Expected: PASS. (If `formatPrice` returns `"MX$1,500"` on your ICU build, the Node version is too old; Node ≥ 22 with full ICU returns `"$1,500"` for `es-MX`.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts src/lib/format.test.ts
git commit -m "feat: add MXN price and duration formatting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Opening hours in salon time (TDD)

**Files:**

- Create: `src/lib/hours.ts`, `src/lib/hours.test.ts`

**Interfaces:**

- Produces:
  - `DAYS` (readonly `{ id, label }[]`, Monday first), `DayId`, `DAY_IDS: [DayId, ...DayId[]]`
  - `interface OpeningHours { day: DayId; open: string; close: string }` (`"HH:MM"`, 24 h)
  - `SALON_TIME_ZONE = 'America/Mexico_City'`
  - `isOpenAt(hours: readonly OpeningHours[], date: Date, timeZone?: string): boolean`
  - `interface HoursRow { day: DayId; label: string; text: string }`
  - `weeklySchedule(hours: readonly OpeningHours[]): HoursRow[]` (7 rows, "Cerrado" for missing days, split shifts joined with ", ")

- [ ] **Step 1: Write failing tests `src/lib/hours.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { DAY_IDS, isOpenAt, weeklySchedule, type OpeningHours } from './hours';

// 2026-09-28 es lunes. Veracruz = UTC-6 todo el año (sin horario de verano desde 2022).
const HOURS: OpeningHours[] = [
  { day: 'lunes', open: '10:00', close: '19:00' },
  { day: 'sabado', open: '09:00', close: '14:00' },
  { day: 'sabado', open: '16:00', close: '18:00' },
];

describe('isOpenAt', () => {
  it('is open Monday 10:00 local (16:00 UTC)', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-28T16:00:00Z'))).toBe(true);
  });

  it('is closed Monday 09:59 local', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-28T15:59:00Z'))).toBe(false);
  });

  it('treats closing time as exclusive (19:00 local is closed)', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-29T01:00:00Z'))).toBe(false);
  });

  it('uses salon time even when UTC is already the next day', () => {
    // Lunes 18:30 en Veracruz = martes 00:30 UTC
    expect(isOpenAt(HOURS, new Date('2026-09-29T00:30:00Z'))).toBe(true);
  });

  it('handles split shifts', () => {
    // Sábado 3 oct 2026: 15:00 local cerrado, 16:30 abierto
    expect(isOpenAt(HOURS, new Date('2026-10-03T21:00:00Z'))).toBe(false);
    expect(isOpenAt(HOURS, new Date('2026-10-03T22:30:00Z'))).toBe(true);
  });

  it('is closed on days without hours and when there are no hours at all', () => {
    expect(isOpenAt(HOURS, new Date('2026-09-27T18:00:00Z'))).toBe(false); // domingo
    expect(isOpenAt([], new Date('2026-09-28T16:00:00Z'))).toBe(false);
  });
});

describe('weeklySchedule', () => {
  it('returns 7 rows Monday-first with Cerrado and joined split shifts', () => {
    const rows = weeklySchedule(HOURS);
    expect(rows.map((r) => r.day)).toEqual(DAY_IDS);
    expect(rows[0]).toEqual({ day: 'lunes', label: 'Lunes', text: '10:00 – 19:00' });
    expect(rows[1].text).toBe('Cerrado');
    expect(rows[5].text).toBe('09:00 – 14:00, 16:00 – 18:00');
  });

  it('sorts shifts by opening time regardless of input order', () => {
    const rows = weeklySchedule([...HOURS].reverse());
    expect(rows[5].text).toBe('09:00 – 14:00, 16:00 – 18:00');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- hours`
Expected: FAIL, "Failed to resolve import './hours'".

- [ ] **Step 3: Implement `src/lib/hours.ts`**

```ts
// Horario del salón, siempre evaluado en la hora local de Veracruz
export const DAYS = [
  { id: 'lunes', label: 'Lunes' },
  { id: 'martes', label: 'Martes' },
  { id: 'miercoles', label: 'Miércoles' },
  { id: 'jueves', label: 'Jueves' },
  { id: 'viernes', label: 'Viernes' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
] as const;

export type DayId = (typeof DAYS)[number]['id'];
export const DAY_IDS = DAYS.map((d) => d.id) as [DayId, ...DayId[]];

export interface OpeningHours {
  day: DayId;
  open: string;
  close: string;
}

export interface HoursRow {
  day: DayId;
  label: string;
  text: string;
}

export const SALON_TIME_ZONE = 'America/Mexico_City';

const WEEKDAY_TO_DAY: Record<string, DayId> = {
  Mon: 'lunes',
  Tue: 'martes',
  Wed: 'miercoles',
  Thu: 'jueves',
  Fri: 'viernes',
  Sat: 'sabado',
  Sun: 'domingo',
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function localDayAndMinutes(date: Date, timeZone: string): { day: DayId; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: WEEKDAY_TO_DAY[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function isOpenAt(
  hours: readonly OpeningHours[],
  date: Date,
  timeZone: string = SALON_TIME_ZONE,
): boolean {
  const { day, minutes } = localDayAndMinutes(date, timeZone);
  return hours.some(
    (h) => h.day === day && minutes >= toMinutes(h.open) && minutes < toMinutes(h.close),
  );
}

export function weeklySchedule(hours: readonly OpeningHours[]): HoursRow[] {
  return DAYS.map(({ id, label }) => {
    const shifts = hours
      .filter((h) => h.day === id)
      .toSorted((a, b) => toMinutes(a.open) - toMinutes(b.open));
    const text = shifts.length ? shifts.map((s) => `${s.open} – ${s.close}`).join(', ') : 'Cerrado';
    return { day: id, label, text };
  });
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- hours`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hours.ts src/lib/hours.test.ts
git commit -m "feat: add opening hours helpers evaluated in salon timezone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Content schemas + seed content

**Files:**

- Create: `src/lib/categories.ts`, `src/lib/content-schema.ts`, `src/lib/content-schema.test.ts`, `src/content.config.ts`
- Create: `src/content/site/index.yaml`, `src/content/services/{corte-dama,manicura,masajes,tratamientos}.yaml`, `src/content/team/nieves-munoz.yaml`, `src/content/{gallery,brands,reviews}/.gitkeep`

**Interfaces:**

- Consumes: `DAY_IDS` (Task 6), `isValidMxPhone` (Task 4), `HIGHLIGHT_ICONS` (Task 3)
- Produces:
  - `CATEGORIES`, `CategoryId`, `CATEGORY_IDS` from `src/lib/categories.ts`
  - `emptyToUndefined`, `optionalText`, `optionalUrl`, `optionalInt`, `phoneSchema`, `timeSchema`, `openingHoursSchema` from `src/lib/content-schema.ts`
  - Collections `site`, `services`, `team`, `gallery`, `brands`, `reviews`. Data shapes (after parsing):
    - `site`: `{ name, tagline, intro, heroImage: ImageMetadata, heroImageAlt, phone, whatsapp, whatsappMessage, email?, address: { street, neighborhood, city, region, postalCode? }, geo: { lat, lng }, mapsUrl, mapsEmbedUrl, instagram?, facebook?, hours: OpeningHours[], highlights: { icon: HighlightIcon, title, text }[], servicesNote? }`
    - `services`: `{ name, category: CategoryId, description, priceFrom?: number, durationMin?: number, image?: ImageMetadata, imageAlt?, order: number, featured: boolean }`
    - `team`: `{ name, role, photo: ImageMetadata, photoAlt?, order }`
    - `gallery`: `{ image: ImageMetadata, alt, order }`
    - `brands`: `{ name, logo: ImageMetadata, url?, order }`
    - `reviews`: `{ author, text, rating: 1..5, order }`

- [ ] **Step 1: `src/lib/categories.ts`**

```ts
// Categorías fijas de servicios (el orden aquí es el orden en la página)
export const CATEGORIES = [
  { id: 'cabello', label: 'Cabello' },
  { id: 'color', label: 'Color' },
  { id: 'unas', label: 'Uñas' },
  { id: 'tratamientos', label: 'Tratamientos' },
  { id: 'masajes', label: 'Masajes' },
  { id: 'maquillaje', label: 'Maquillaje' },
  { id: 'cejas-pestanas', label: 'Cejas y pestañas' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
```

- [ ] **Step 2: Write failing tests `src/lib/content-schema.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  emptyToUndefined,
  openingHoursSchema,
  optionalInt,
  optionalText,
  optionalUrl,
  phoneSchema,
  timeSchema,
} from './content-schema';

describe('empty values written by the CMS', () => {
  it('maps "" and null to undefined, keeps everything else', () => {
    expect(emptyToUndefined('')).toBeUndefined();
    expect(emptyToUndefined(null)).toBeUndefined();
    expect(emptyToUndefined(0)).toBe(0);
    expect(emptyToUndefined('x')).toBe('x');
  });
  it('optionalText / optionalUrl / optionalInt accept empty values', () => {
    expect(optionalText.parse('')).toBeUndefined();
    expect(optionalUrl.parse(null)).toBeUndefined();
    expect(optionalInt.parse(null)).toBeUndefined();
    expect(optionalInt.parse(45)).toBe(45);
  });
  it('optionalUrl still rejects garbage', () => {
    expect(optionalUrl.safeParse('instagram belyni').success).toBe(false);
  });
  it('optionalInt rejects negatives and decimals', () => {
    expect(optionalInt.safeParse(-5).success).toBe(false);
    expect(optionalInt.safeParse(1.5).success).toBe(false);
  });
});

describe('phoneSchema', () => {
  it('accepts human formats and rejects invalid numbers with a Spanish message', () => {
    expect(phoneSchema.parse('(229) 225-8060')).toBe('(229) 225-8060');
    const result = phoneSchema.safeParse('229 000');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/10 dígitos/);
  });
});

describe('timeSchema / openingHoursSchema', () => {
  it('accepts HH:MM 24h and rejects other formats', () => {
    expect(timeSchema.safeParse('09:30').success).toBe(true);
    expect(timeSchema.safeParse('9:30').success).toBe(false);
    expect(timeSchema.safeParse('24:00').success).toBe(false);
    expect(timeSchema.safeParse('7 pm').success).toBe(false);
  });
  it('rejects closing before opening', () => {
    const result = openingHoursSchema.safeParse({ day: 'lunes', open: '19:00', close: '10:00' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/cierre/);
  });
  it('rejects unknown days', () => {
    expect(
      openingHoursSchema.safeParse({ day: 'monday', open: '10:00', close: '19:00' }).success,
    ).toBe(false);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- content-schema`
Expected: FAIL, "Failed to resolve import './content-schema'".

- [ ] **Step 4: Implement `src/lib/content-schema.ts`**

```ts
import { z } from 'astro/zod';
import { DAY_IDS } from './hours';
import { isValidMxPhone } from './phone';

// Keystatic guarda los campos vacíos como '' o null: los tratamos como "sin valor"
export const emptyToUndefined = (value: unknown): unknown =>
  value === '' || value === null ? undefined : value;

export const optionalText = z.preprocess(emptyToUndefined, z.string().optional());
export const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
export const optionalInt = z.preprocess(
  emptyToUndefined,
  z.number().int().nonnegative().optional(),
);

export const phoneSchema = z
  .string()
  .refine(isValidMxPhone, 'Teléfono inválido: usa 10 dígitos, por ejemplo 229 225 8060');

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:MM de 24 horas, por ejemplo 09:30');

export const openingHoursSchema = z
  .object({ day: z.enum(DAY_IDS), open: timeSchema, close: timeSchema })
  .refine((h) => h.open < h.close, {
    message: 'La hora de cierre debe ser posterior a la de apertura',
    path: ['close'],
  });
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- content-schema`
Expected: PASS.

- [ ] **Step 6: `src/content.config.ts`**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './lib/categories';
import {
  emptyToUndefined,
  openingHoursSchema,
  optionalInt,
  optionalText,
  optionalUrl,
  phoneSchema,
} from './lib/content-schema';
import { HIGHLIGHT_ICONS } from './lib/icons';

// Un archivo YAML por entrada (misma estructura que usa Keystatic)
const yamlIn = (dir: string) => glob({ base: `./src/content/${dir}`, pattern: '*.yaml' });
const order = z.number().int().default(100);

const site = defineCollection({
  loader: yamlIn('site'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1),
      tagline: z.string().min(1).max(80),
      intro: z.string().min(1).max(220),
      heroImage: image(),
      heroImageAlt: z.string().min(1),
      phone: phoneSchema,
      whatsapp: phoneSchema,
      whatsappMessage: z.string().min(1).max(200),
      email: z.preprocess(emptyToUndefined, z.email().optional()),
      address: z.object({
        street: z.string().min(1),
        neighborhood: z.string().min(1),
        city: z.string().min(1),
        region: z.string().min(1),
        postalCode: optionalText,
      }),
      geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
      mapsUrl: z.url(),
      mapsEmbedUrl: z.url(),
      instagram: optionalUrl,
      facebook: optionalUrl,
      hours: z.preprocess((v) => v ?? [], z.array(openingHoursSchema)),
      highlights: z.preprocess(
        (v) => v ?? [],
        z
          .array(
            z.object({
              icon: z.enum(HIGHLIGHT_ICONS),
              title: z.string().min(1).max(40),
              text: z.string().min(1).max(140),
            }),
          )
          .max(4),
      ),
      servicesNote: optionalText,
    }),
});

const services = defineCollection({
  loader: yamlIn('services'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(60),
      category: z.enum(CATEGORY_IDS),
      description: z.string().min(1).max(160),
      priceFrom: optionalInt,
      durationMin: optionalInt,
      image: z.preprocess(emptyToUndefined, image().optional()),
      imageAlt: optionalText,
      order,
      featured: z.boolean().default(false),
    }),
});

const team = defineCollection({
  loader: yamlIn('team'),
  schema: ({ image }) =>
    z.object({
      name: z.string().min(1).max(60),
      role: z.string().min(1).max(60),
      photo: image(),
      photoAlt: optionalText,
      order,
    }),
});

const gallery = defineCollection({
  loader: yamlIn('gallery'),
  schema: ({ image }) => z.object({ image: image(), alt: z.string().min(1).max(140), order }),
});

const brands = defineCollection({
  loader: yamlIn('brands'),
  schema: ({ image }) =>
    z.object({ name: z.string().min(1).max(40), logo: image(), url: optionalUrl, order }),
});

const reviews = defineCollection({
  loader: yamlIn('reviews'),
  schema: z.object({
    author: z.string().min(1).max(60),
    text: z.string().min(1).max(300),
    rating: z.number().int().min(1).max(5).default(5),
    order,
  }),
});

export const collections = { site, services, team, gallery, brands, reviews };
```

- [ ] **Step 7: Seed `src/content/site/index.yaml`**

Values marked `# PENDIENTE` come from the old site's git history or are drafts; the owner must confirm them (Part 2 blocks production deploys while any `PENDIENTE` remains).

```yaml
name: Belyni
tagline: Tu belleza en manos expertas
intro: Salón de belleza en Veracruz. Cortes, color, uñas y tratamientos con productos profesionales y atención personalizada. # PENDIENTE: validar texto con la dueña
heroImage: ../../assets/img/hero.png
heroImageAlt: Mujer con corte bob ondulado sobre fondo rosa
phone: 229 225 8060 # PENDIENTE: confirmar número para llamadas (tomado del WhatsApp del sitio anterior)
whatsapp: 229 225 8060 # PENDIENTE: confirmar (sitio anterior, abril 2025)
whatsappMessage: Hola, me gustaría agendar una cita en Belyni.
email: ''
address:
  street: Juan Enríquez 431
  neighborhood: Ricardo Flores Magón
  city: Veracruz
  region: Veracruz
  postalCode: '' # PENDIENTE: código postal
geo:
  lat: 19.1863473 # PENDIENTE: verificar contra Google Business Profile
  lng: -96.1289616
mapsUrl: https://www.google.com/maps/search/?api=1&query=Belyni%2C%20Juan%20Enr%C3%ADquez%20431%2C%20Veracruz
mapsEmbedUrl: https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3640.633225233502!2d-96.1289616249451!3d19.18634728204117!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c346cc65298d87%3A0xbfc4904f9770a6ac!2sBelyni!5e1!3m2!1ses-419!2sus!4v1745218076842!5m2!1ses-419!2sus
instagram: https://www.instagram.com/belynisalon/ # PENDIENTE: confirmar
facebook: https://www.facebook.com/salonbelyni # PENDIENTE: confirmar
hours: [] # PENDIENTE: horario real (lista de { day, open, close })
highlights: # PENDIENTE: validar textos con la dueña
  - icon: sparkles
    title: Productos profesionales
    text: Trabajamos con marcas profesionales para cuidar tu cabello, piel y uñas.
  - icon: heart
    title: Atención personalizada
    text: Escuchamos lo que buscas y te recomendamos lo que mejor va contigo.
  - icon: shield-check
    title: Higiene y cuidado
    text: Herramientas desinfectadas y un espacio limpio en cada cita.
servicesNote: Precios de referencia; el costo final puede variar según el largo y tipo de cabello. # PENDIENTE: validar
```

- [ ] **Step 8: Seed services, team and empty collections**

Service copy comes from the pre-Bulma site (commit `8a8a2b5`) and the current modal (Corte Dama $500).

`src/content/services/corte-dama.yaml`:

```yaml
name: Corte Dama
category: cabello
description: Lavado, corte, secado y estilizado.
priceFrom: 500
durationMin: null # PENDIENTE: duración
image: ../../assets/img/services/corte.jpg
imageAlt: Estilista peinando a una clienta con cabello ondulado
order: 1
featured: true
```

`src/content/services/manicura.yaml`:

```yaml
name: Manicura
category: unas
description: Manos elegantes con productos de alta calidad.
priceFrom: null # PENDIENTE: precio
durationMin: null
image: ../../assets/img/services/manicure.jpg
imageAlt: Manicurista limando las uñas de una clienta
order: 1
featured: true
```

`src/content/services/masajes.yaml`:

```yaml
name: Masajes
category: masajes
description: Masajes diseñados para liberar el estrés y revitalizar tu cuerpo.
priceFrom: null # PENDIENTE: precio
durationMin: null
image: ''
imageAlt: ''
order: 1
featured: false
```

`src/content/services/tratamientos.yaml`:

```yaml
name: Tratamientos capilares
category: tratamientos
description: Cuida tu cabello con tratamientos personalizados.
priceFrom: null # PENDIENTE: precio
durationMin: null
image: ''
imageAlt: ''
order: 1
featured: false
```

`src/content/team/nieves-munoz.yaml`:

```yaml
name: Nieves Muñoz
role: Estilista Senior # PENDIENTE: confirmar cargo
photo: ../../assets/img/team/nieves.jpg
photoAlt: Nieves Muñoz sentada en un pasillo iluminado con luces neón moradas
order: 1
```

```bash
touch src/content/gallery/.gitkeep src/content/brands/.gitkeep src/content/reviews/.gitkeep
```

No gallery, brand or review entries are seeded: the only candidate photos are stock images, the Olaplex logo doesn't exist in the repo, and reviews must be real.

- [ ] **Step 9: Verify schemas against content**

Run: `npx astro sync && npm run check`
Expected: `0 errors`. Empty `gallery/brands/reviews` may log "No files found matching '*.yaml'". That's expected.

Negative check (then revert): change `whatsapp` in `site/index.yaml` to `229 000`, run `npx astro sync`.
Expected: fails with `Teléfono inválido: usa 10 dígitos…`. Revert with `git checkout src/content/site/index.yaml` if already committed, otherwise undo the edit.

- [ ] **Step 10: Commit**

```bash
git add src/lib/categories.ts src/lib/content-schema.ts src/lib/content-schema.test.ts src/content.config.ts src/content
git commit -m "feat: add content collections with Keystatic-compatible layout and seed data

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Data access helpers: site, ordering, service grouping, nav (TDD)

**Files:**

- Create: `src/lib/order.ts`, `src/lib/services.ts`, `src/lib/services.test.ts`, `src/lib/nav.ts`, `src/lib/nav.test.ts`, `src/lib/site.ts`

**Interfaces:**

- Consumes: `CATEGORIES`, `CategoryId` (Task 7)
- Produces:
  - `byOrder<T extends { order: number }>(a: T, b: T): number`
  - `groupServices<T extends { name: string; category: CategoryId; order: number }>(services: readonly T[]): ServiceGroup<T>[]` where `ServiceGroup<T> = { id: CategoryId; label: string; items: T[] }`
  - `navItems(sections: readonly NavSection[]): NavItem[]` with `NavSection = { id: string; label: string; visible: boolean }`, `NavItem = { href: string; label: string }`
  - `getSite(): Promise<SiteData>`, `type SiteData`

- [ ] **Step 1: Write failing tests `src/lib/services.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { groupServices } from './services';

const s = (name: string, category: 'cabello' | 'unas' | 'masajes', order = 100) => ({
  name,
  category,
  order,
});

describe('groupServices', () => {
  it('groups in CATEGORIES order and drops empty categories', () => {
    const groups = groupServices([
      s('Masaje', 'masajes'),
      s('Manicura', 'unas'),
      s('Corte', 'cabello'),
    ]);
    expect(groups.map((g) => g.id)).toEqual(['cabello', 'unas', 'masajes']);
    expect(groups[1].label).toBe('Uñas');
  });

  it('sorts by order, then by name in Spanish collation', () => {
    const groups = groupServices([
      s('Peinado', 'cabello', 2),
      s('Ñongo', 'cabello', 1),
      s('Alaciado', 'cabello', 1),
      s('Corte', 'cabello', 1),
    ]);
    expect(groups[0].items.map((i) => i.name)).toEqual(['Alaciado', 'Corte', 'Ñongo', 'Peinado']);
  });

  it('does not mutate the input', () => {
    const input = [s('B', 'cabello', 2), s('A', 'cabello', 1)];
    groupServices(input);
    expect(input.map((i) => i.name)).toEqual(['B', 'A']);
  });

  it('returns [] for no services', () => {
    expect(groupServices([])).toEqual([]);
  });
});
```

`src/lib/nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { navItems } from './nav';

describe('navItems', () => {
  it('keeps only visible sections, in order, as anchor links', () => {
    expect(
      navItems([
        { id: 'servicios', label: 'Servicios', visible: true },
        { id: 'galeria', label: 'Galería', visible: false },
        { id: 'contacto', label: 'Contacto', visible: true },
      ]),
    ).toEqual([
      { href: '#servicios', label: 'Servicios' },
      { href: '#contacto', label: 'Contacto' },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- services nav`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Implement**

`src/lib/order.ts`:

```ts
// Orden manual definido por la dueña (menor primero)
export const byOrder = <T extends { order: number }>(a: T, b: T): number => a.order - b.order;
```

`src/lib/services.ts`:

```ts
import { CATEGORIES, type CategoryId } from './categories';

interface GroupableService {
  name: string;
  category: CategoryId;
  order: number;
}

export interface ServiceGroup<T> {
  id: CategoryId;
  label: string;
  items: T[];
}

export function groupServices<T extends GroupableService>(
  services: readonly T[],
): ServiceGroup<T>[] {
  const compare = (a: T, b: T) => a.order - b.order || a.name.localeCompare(b.name, 'es');
  return CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    items: services.filter((s) => s.category === id).toSorted(compare),
  })).filter((group) => group.items.length > 0);
}
```

`src/lib/nav.ts`:

```ts
export interface NavSection {
  id: string;
  label: string;
  visible: boolean;
}

export interface NavItem {
  href: string;
  label: string;
}

// Solo se enlazan las secciones que tienen contenido
export function navItems(sections: readonly NavSection[]): NavItem[] {
  return sections.filter((s) => s.visible).map(({ id, label }) => ({ href: `#${id}`, label }));
}
```

`src/lib/site.ts`:

```ts
import { getEntry, type CollectionEntry } from 'astro:content';

export type SiteData = CollectionEntry<'site'>['data'];

export async function getSite(): Promise<SiteData> {
  const entry = await getEntry('site', 'index');
  if (!entry) throw new Error('Falta el archivo de configuración src/content/site/index.yaml');
  return entry.data;
}
```

- [ ] **Step 4: Run to verify pass + coverage**

Run: `npm run test:coverage`
Expected: all suites PASS; coverage of `src/lib` ≥ 80% on lines/functions/branches/statements.

- [ ] **Step 5: Commit**

```bash
git add src/lib/order.ts src/lib/services.ts src/lib/services.test.ts src/lib/nav.ts src/lib/nav.test.ts src/lib/site.ts
git commit -m "feat: add service grouping, nav and site data helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Page shell: header + mobile menu, footer, WhatsApp button

**Files:**

- Create: `src/components/layout/Header.astro`, `src/components/layout/Footer.astro`, `src/components/layout/WhatsAppFab.astro`, `tests/e2e/layout.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**

- Consumes: `getSite`, `SiteData`, `navItems`, `NavItem`, `whatsappUrl`, `telHref`, `formatMxPhone`, `Button`
- Produces:
  - `<Header items: NavItem[] bookingHref: string siteName: string>`
  - `<Footer site: SiteData>`
  - `<WhatsAppFab href: string>`
  - `index.astro` computes `site`, `bookingHref`, collections, and `nav`; later tasks add sections inside `<main id="contenido">`

- [ ] **Step 1: Write failing E2E `tests/e2e/layout.spec.ts`**

```ts
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
  await expect(fab).toHaveAttribute(
    'href',
    new RegExp(`^https://wa\\.me/52${digits(readSite().whatsapp)}`),
  );
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
  await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
    'aria-expanded',
    'true',
  );
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
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Servicios' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeHidden();
});

test('footer shows social links from content with safe rel', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  const site = readSite();
  if (site.instagram) {
    await expect(footer.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      site.instagram,
    );
  }
  for (const link of await footer.locator('a[target="_blank"]').all()) {
    await expect(link).toHaveAttribute('rel', /noopener/);
  }
});
```

Run: `npm run test:e2e -- layout`
Expected: FAIL (no FAB, no menu).

- [ ] **Step 2: `src/components/layout/Header.astro`**

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import logo from '../../assets/img/logo-name.png';
import Button from '../ui/Button.astro';
import type { NavItem } from '../../lib/nav';

interface Props {
  items: NavItem[];
  bookingHref: string;
  siteName: string;
}
const { items, bookingHref, siteName } = Astro.props;
---

<header class="sticky top-0 z-40 border-b border-plum-100 bg-blush-50/90 backdrop-blur">
  <nav
    aria-label="Principal"
    class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3"
  >
    <a href="#inicio" class="shrink-0">
      <Image src={logo} alt={siteName} width={140} class="h-10 w-auto" loading="eager" />
    </a>
    <ul class="hidden items-center gap-6 text-sm font-medium md:flex">
      {items.map((item) => (
        <li>
          <a href={item.href} class="hover:text-plum-600">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
    <div class="flex items-center gap-2">
      <Button
        href={bookingHref}
        external
        class="hidden sm:inline-flex"
        data-umami-event="whatsapp-header"
      >
        Agendar cita
      </Button>
      <button
        type="button"
        class="rounded-full p-2 text-plum-900 hover:bg-plum-50 md:hidden"
        aria-expanded="false"
        aria-controls="menu-movil"
        data-menu-toggle
      >
        <span class="sr-only" data-menu-label>
          Abrir menú
        </span>
        <span data-icon-open>
          <Icon name="lucide:menu" class="size-6" aria-hidden="true" />
        </span>
        <span data-icon-close class="hidden">
          <Icon name="lucide:x" class="size-6" aria-hidden="true" />
        </span>
      </button>
    </div>
  </nav>
  <div id="menu-movil" class="hidden border-t border-plum-100 md:hidden" data-menu>
    <ul class="flex flex-col px-4 py-2">
      {items.map((item) => (
        <li>
          <a href={item.href} class="block py-3 text-lg">
            {item.label}
          </a>
        </li>
      ))}
      <li class="py-3">
        <Button href={bookingHref} external class="w-full" data-umami-event="whatsapp-menu">
          Agendar cita
        </Button>
      </li>
    </ul>
  </div>
</header>

<script>
  // Menú móvil: abre/cierra, se cierra al tocar un enlace o con Escape
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');

  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('hidden', !open);
      toggle.querySelector('[data-icon-open]')?.classList.toggle('hidden', open);
      toggle.querySelector('[data-icon-close]')?.classList.toggle('hidden', !open);
      const label = toggle.querySelector('[data-menu-label]');
      if (label) label.textContent = open ? 'Cerrar menú' : 'Abrir menú';
    };
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    menu.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
  }
</script>
```

- [ ] **Step 3: `src/components/layout/WhatsAppFab.astro`**

```astro
---
import { Icon } from 'astro-icon/components';

interface Props {
  href: string;
}
const { href } = Astro.props;
---

<a
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Escríbenos por WhatsApp"
  data-umami-event="whatsapp-fab"
  class="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
>
  <Icon name="simple-icons:whatsapp" class="size-7" aria-hidden="true" />
</a>
```

- [ ] **Step 4: `src/components/layout/Footer.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import { formatMxPhone, telHref } from '../../lib/phone';
import type { SiteData } from '../../lib/site';

interface Props {
  site: SiteData;
}
const { site } = Astro.props;
const socials = [
  { label: 'Instagram', href: site.instagram, icon: 'simple-icons:instagram' },
  { label: 'Facebook', href: site.facebook, icon: 'simple-icons:facebook' },
].filter((s): s is { label: string; href: string; icon: string } => Boolean(s.href));
const year = new Date().getFullYear();
---

<footer class="bg-plum-900 px-4 pt-12 pb-24 text-plum-100 sm:pb-12">
  <div class="mx-auto grid max-w-6xl gap-8 text-sm sm:grid-cols-3">
    <div>
      <p class="font-display text-3xl font-semibold text-white">{site.name}</p>
      <p class="mt-2">{site.tagline}</p>
    </div>
    <address class="not-italic">
      <p>
        {site.address.street}, {site.address.neighborhood}
      </p>
      <p>
        {site.address.city}, {site.address.region}
      </p>
      <p class="mt-2">
        <a href={telHref(site.phone)} class="hover:text-white">
          {formatMxPhone(site.phone)}
        </a>
      </p>
      {site.email && (
        <p>
          <a href={`mailto:${site.email}`} class="hover:text-white">
            {site.email}
          </a>
        </p>
      )}
    </address>
    {socials.length > 0 && (
      <ul class="flex gap-3 sm:justify-end">
        {socials.map((s) => (
          <li>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              class="grid size-10 place-items-center rounded-full bg-plum-700 hover:bg-plum-500"
            >
              <Icon name={s.icon} class="size-5" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    )}
  </div>
  <p class="mx-auto mt-10 max-w-6xl border-t border-plum-700 pt-6 text-xs text-plum-200">
    © {year} {site.name}. Todos los derechos reservados.
  </p>
</footer>
```

- [ ] **Step 5: Rewrite `src/pages/index.astro`** with data loading and the shell

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';
import WhatsAppFab from '../components/layout/WhatsAppFab.astro';
import { getSite } from '../lib/site';
import { byOrder } from '../lib/order';
import { navItems } from '../lib/nav';
import { whatsappUrl } from '../lib/whatsapp';

const site = await getSite();
const services = (await getCollection('services')).map((e) => e.data);
const team = (await getCollection('team')).map((e) => e.data).toSorted(byOrder);
const gallery = (await getCollection('gallery')).map((e) => e.data).toSorted(byOrder);
const brands = (await getCollection('brands')).map((e) => e.data).toSorted(byOrder);
const reviews = (await getCollection('reviews')).map((e) => e.data).toSorted(byOrder);

const bookingHref = whatsappUrl(site.whatsapp, site.whatsappMessage);

const nav = navItems([
  { id: 'servicios', label: 'Servicios', visible: services.length > 0 },
  { id: 'nosotros', label: 'Nosotros', visible: site.highlights.length > 0 },
  { id: 'equipo', label: 'Equipo', visible: team.length > 0 },
  { id: 'galeria', label: 'Galería', visible: gallery.length > 0 },
  { id: 'opiniones', label: 'Opiniones', visible: reviews.length > 0 },
  { id: 'ubicacion', label: 'Ubicación', visible: true },
  { id: 'contacto', label: 'Contacto', visible: true },
]);
---

<BaseLayout
  title={`${site.name} | Salón de belleza en ${site.address.city}`}
  description={site.intro}
>
  <Header items={nav} bookingHref={bookingHref} siteName={site.name} />
  <main id="contenido">
    <!-- Secciones: Tareas 10–12 (este h1 temporal lo reemplaza el Hero) -->
    <h1 class="p-8 text-5xl font-semibold text-plum-900">{site.name}</h1>
    <section id="servicios" class="min-h-screen"></section>
    <section id="ubicacion" class="min-h-screen"></section>
    <section id="contacto" class="min-h-screen"></section>
  </main>
  <Footer site={site} />
  <WhatsAppFab href={bookingHref} />
</BaseLayout>
```

(The three placeholder `<section>`s give the menu links real targets until Tasks 10–12 replace them. `brands` is loaded now and used in Task 11.)

- [ ] **Step 6: Run E2E**

Run: `npm run test:e2e -- layout smoke`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout src/pages/index.astro tests/e2e/layout.spec.ts
git commit -m "feat: add header with accessible mobile menu, footer and WhatsApp button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Hero + Services sections

**Files:**

- Create: `src/components/sections/Hero.astro`, `src/components/sections/Services.astro`, `tests/e2e/sections.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**

- Consumes: `SiteData`, `groupServices`, `formatPrice`, `formatDuration`, `whatsappUrl`, `bookingMessage`, `Button`, `Section`, `SectionHeading`
- Produces: `<Hero site: SiteData bookingHref: string>`, `<Services services: ServiceData[] whatsapp: string whatsappMessage: string note?: string>` where `ServiceData = CollectionEntry<'services'>['data']`

- [ ] **Step 1: Write failing E2E `tests/e2e/sections.spec.ts`**

```ts
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
    const link = card.getByRole('link', { name: new RegExp(`Agendar ${s.name}`) });
    await expect(link).toHaveAttribute('href', new RegExp(encodeURIComponent(s.name)));
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
```

Run: `npm run test:e2e -- sections`
Expected: FAIL.

- [ ] **Step 2: `src/components/sections/Hero.astro`**

```astro
---
import { Picture } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import Button from '../ui/Button.astro';
import type { SiteData } from '../../lib/site';

interface Props {
  site: SiteData;
  bookingHref: string;
}
const { site, bookingHref } = Astro.props;
---

<section id="inicio" class="overflow-hidden bg-blush-100">
  <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
    <div class="text-center md:text-left">
      <p class="mb-3 text-xs font-semibold tracking-[0.2em] text-plum-600 uppercase">
        {site.name} · Salón de belleza en {site.address.city}
      </p>
      <h1 class="text-5xl leading-tight font-semibold text-plum-900 sm:text-6xl">{site.tagline}</h1>
      <p class="mx-auto mt-5 max-w-md text-lg text-muted md:mx-0">{site.intro}</p>
      <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
        <Button href={bookingHref} external data-umami-event="whatsapp-hero">
          <Icon name="simple-icons:whatsapp" class="size-5" aria-hidden="true" />
          Agenda por WhatsApp
        </Button>
        <Button href="#servicios" variant="secondary">
          Ver servicios
        </Button>
      </div>
    </div>
    <Picture
      src={site.heroImage}
      alt={site.heroImageAlt}
      formats={['avif', 'webp']}
      widths={[480, 768, 1024]}
      sizes="(min-width: 768px) 50vw, 100vw"
      loading="eager"
      fetchpriority="high"
      class="aspect-square w-full rounded-[2rem] object-cover shadow-xl"
    />
  </div>
</section>
```

- [ ] **Step 3: `src/components/sections/Services.astro`**

```astro
---
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import type { CollectionEntry } from 'astro:content';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';
import { groupServices } from '../../lib/services';
import { formatDuration, formatPrice } from '../../lib/format';
import { bookingMessage, whatsappUrl } from '../../lib/whatsapp';

interface Props {
  services: CollectionEntry<'services'>['data'][];
  whatsapp: string;
  whatsappMessage: string;
  note?: string;
}
const { services, whatsapp, whatsappMessage, note } = Astro.props;
const groups = groupServices(services);
---

<Section id="servicios" class="bg-white">
  <SectionHeading
    id="servicios-titulo"
    eyebrow="Lo que hacemos"
    title="Nuestros servicios"
    intro={note}
  />

  {groups.length > 1 && (
    <nav
      aria-label="Categorías de servicios"
      class="mb-10 flex gap-2 overflow-x-auto pb-2 md:justify-center"
    >
      {groups.map((g) => (
        <a
          href={`#servicios-${g.id}`}
          class="shrink-0 rounded-full border border-plum-200 px-4 py-2 text-sm font-medium text-plum-700 hover:bg-plum-50"
        >
          {g.label}
        </a>
      ))}
    </nav>
  )}

  <div class="space-y-14">
    {groups.map((group) => (
      <div id={`servicios-${group.id}`} class="scroll-mt-24">
        <h3 class="mb-6 text-3xl font-semibold text-plum-900">{group.label}</h3>
        <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {group.items.map((service) => (
            <li
              class="flex flex-col overflow-hidden rounded-3xl border border-plum-100 bg-blush-50"
              data-service
            >
              {service.image && (
                <Image
                  src={service.image}
                  alt={service.imageAlt ?? service.name}
                  widths={[400, 800]}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  class="aspect-[4/3] w-full object-cover"
                />
              )}
              <div class="flex flex-1 flex-col gap-3 p-6">
                <h4 class="font-display text-2xl font-semibold break-words text-plum-900">
                  {service.name}
                </h4>
                <p class="text-muted">{service.description}</p>
                <p class="mt-auto flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span class="text-lg font-semibold text-plum-700">
                    {service.priceFrom !== undefined
                      ? `Desde ${formatPrice(service.priceFrom)}`
                      : 'Precio a consultar'}
                  </span>
                  {service.durationMin !== undefined && (
                    <span class="text-muted">· {formatDuration(service.durationMin)}</span>
                  )}
                </p>
                <a
                  href={whatsappUrl(whatsapp, bookingMessage(whatsappMessage, service.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="whatsapp-service"
                  class="inline-flex items-center gap-2 self-start text-sm font-semibold text-plum-600 hover:text-plum-700"
                >
                  <Icon name="simple-icons:whatsapp" class="size-4" aria-hidden="true" />
                  Agendar<span class="sr-only"> {service.name}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</Section>
```

- [ ] **Step 4: Wire into `src/pages/index.astro`**

Add imports:

```astro
import Hero from '../components/sections/Hero.astro'; import Services from
'../components/sections/Services.astro';
```

Replace the `<main>` body:

```astro
<main id="contenido">
  <Hero site={site} bookingHref={bookingHref} />
  {services.length > 0 && (
    <Services
      services={services}
      whatsapp={site.whatsapp}
      whatsappMessage={site.whatsappMessage}
      note={site.servicesNote}
    />
  )}
  <section id="ubicacion" class="min-h-screen"></section>
  <section id="contacto" class="min-h-screen"></section>
</main>
```

- [ ] **Step 5: Run E2E**

Run: `npm run test:e2e`
Expected: PASS (smoke, layout, sections).

Manual: `npm run dev`, check at 375px and 1280px that the hero stacks on mobile, sits side by side on desktop, and category chips scroll horizontally on mobile.

**Owner checkpoint (spec 1.1):** send the owner two screenshots (mobile + desktop) of the hero and services. Don't start Task 11 until they approve the look (colors, fonts, tone). Adjusting tokens in `global.css` now is cheap; after five more sections it isn't.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Hero.astro src/components/sections/Services.astro src/pages/index.astro tests/e2e/sections.spec.ts
git commit -m "feat: add hero and data-driven services sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Highlights, Team, Gallery, Brands, Reviews (hidden when empty)

**Files:**

- Create: `src/components/sections/{Highlights,Team,Gallery,Brands,Reviews}.astro`
- Modify: `src/pages/index.astro`, `tests/e2e/sections.spec.ts`

**Interfaces:**

- Consumes: collections data from Task 9's `index.astro`; `HighlightIcon`
- Produces: `<Highlights items: SiteData['highlights']>`, `<Team members: TeamData[]>`, `<Gallery items: GalleryData[]>`, `<Brands items: BrandData[]>`, `<Reviews items: ReviewData[]>` (each `XData = CollectionEntry<'x'>['data']`)

- [ ] **Step 1: Append failing E2E to `tests/e2e/sections.spec.ts`** (put the import with the others at the top of the file)

```ts
import { countEntries, readSite } from './content';

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
```

Run: `npm run test:e2e -- sections`
Expected: FAIL for `#equipo` and `#nosotros` (content exists, sections not yet rendered).

- [ ] **Step 2: `src/components/sections/Highlights.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';
import type { SiteData } from '../../lib/site';

interface Props {
  items: SiteData['highlights'];
}
const { items } = Astro.props;
---

<Section id="nosotros">
  <SectionHeading id="nosotros-titulo" eyebrow="Nosotros" title="¿Por qué Belyni?" />
  <ul class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <li class="rounded-3xl bg-white p-6 text-center shadow-sm">
        <span class="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-plum-50 text-plum-600">
          <Icon name={`lucide:${item.icon}`} class="size-6" aria-hidden="true" />
        </span>
        <h3 class="text-2xl font-semibold text-plum-900">{item.title}</h3>
        <p class="mt-2 text-sm text-muted">{item.text}</p>
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 3: `src/components/sections/Team.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';

interface Props {
  members: CollectionEntry<'team'>['data'][];
}
const { members } = Astro.props;
---

<Section id="equipo" class="bg-white">
  <SectionHeading id="equipo-titulo" eyebrow="Equipo" title="Manos expertas" />
  <ul class="flex flex-wrap justify-center gap-8">
    {members.map((m) => (
      <li class="w-full max-w-xs text-center">
        <Image
          src={m.photo}
          alt={m.photoAlt ?? m.name}
          widths={[320, 640]}
          sizes="320px"
          class="aspect-[3/4] w-full rounded-3xl object-cover"
        />
        <p class="mt-4 font-display text-2xl font-semibold text-plum-900">{m.name}</p>
        <p class="text-muted">{m.role}</p>
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 4: `src/components/sections/Gallery.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';

interface Props {
  items: CollectionEntry<'gallery'>['data'][];
}
const { items } = Astro.props;
---

<Section id="galeria">
  <SectionHeading id="galeria-titulo" eyebrow="Galería" title="Nuestro trabajo" />
  <ul class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
    {items.map((item) => (
      <li>
        <Image
          src={item.image}
          alt={item.alt}
          widths={[300, 600]}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          class="aspect-square w-full rounded-2xl object-cover"
        />
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 5: `src/components/sections/Brands.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';

interface Props {
  items: CollectionEntry<'brands'>['data'][];
}
const { items } = Astro.props;
const LOGO_CLASS =
  'h-14 w-auto opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0';
---

<Section id="marcas" class="bg-white">
  <SectionHeading id="marcas-titulo" eyebrow="Marcas" title="Trabajamos con" />
  <ul class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
    {items.map((brand) => (
      <li>
        {brand.url ? (
          <a href={brand.url} target="_blank" rel="noopener noreferrer">
            <Image src={brand.logo} alt={brand.name} height={56} class={LOGO_CLASS} />
          </a>
        ) : (
          <Image src={brand.logo} alt={brand.name} height={56} class={LOGO_CLASS} />
        )}
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 6: `src/components/sections/Reviews.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import type { CollectionEntry } from 'astro:content';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';

interface Props {
  items: CollectionEntry<'reviews'>['data'][];
}
const { items } = Astro.props;
---

<Section id="opiniones">
  <SectionHeading
    id="opiniones-titulo"
    eyebrow="Opiniones"
    title="Lo que dicen nuestras clientas"
  />
  <ul class="grid gap-6 md:grid-cols-3">
    {items.map((review) => (
      <li class="flex flex-col rounded-3xl bg-white p-6 shadow-sm">
        <p class="flex gap-1 text-plum-500" aria-label={`${review.rating} de 5 estrellas`}>
          {Array.from({ length: review.rating }, () => (
            <Icon name="lucide:star" class="size-4 fill-current" aria-hidden="true" />
          ))}
        </p>
        <blockquote class="mt-4 flex-1 text-ink">“{review.text}”</blockquote>
        <p class="mt-4 text-sm font-semibold text-plum-700">{review.author}</p>
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 7: Wire into `src/pages/index.astro`** (after `<Services …/>`)

Imports:

```astro
import Highlights from '../components/sections/Highlights.astro'; import Team from
'../components/sections/Team.astro'; import Gallery from '../components/sections/Gallery.astro';
import Brands from '../components/sections/Brands.astro'; import Reviews from
'../components/sections/Reviews.astro';
```

Markup:

```astro
{site.highlights.length > 0 && <Highlights items={site.highlights} />}
{team.length > 0 && <Team members={team} />}
{gallery.length > 0 && <Gallery items={gallery} />}
{brands.length > 0 && <Brands items={brands} />}
{reviews.length > 0 && <Reviews items={reviews} />}
```

- [ ] **Step 8: Run E2E**

Run: `npm run test:e2e -- sections`
Expected: PASS.

- [ ] **Step 9: Manual check that hidden sections render when they get content**

```bash
cat > src/content/gallery/prueba.yaml <<'EOF'
image: ../../assets/img/services/corte.jpg
alt: Prueba temporal
order: 1
EOF
npm run test:e2e -- sections
```

Expected: PASS (the test now expects `#galeria` to exist, and it does). Then delete it:

```bash
rm src/content/gallery/prueba.yaml
```

- [ ] **Step 10: Commit**

```bash
git add src/components/sections src/pages/index.astro tests/e2e/sections.spec.ts
git commit -m "feat: add highlights, team, gallery, brands and reviews sections

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Location & hours (click-to-load map) + Contact

**Files:**

- Create: `src/components/sections/Location.astro`, `src/components/sections/Contact.astro`
- Modify: `src/pages/index.astro`, `tests/e2e/sections.spec.ts`

**Interfaces:**

- Consumes: `weeklySchedule`, `telHref`, `formatMxPhone`, `whatsappUrl`, `SiteData`
- Produces: `<Location site: SiteData>` (Part 2 adds the open-now badge inside it via `data-open-status`), `<Contact site: SiteData bookingHref: string>`

- [ ] **Step 1: Append failing E2E to `tests/e2e/sections.spec.ts`** (merge the import into the existing `./content` import at the top)

```ts
import { hoursCount } from './content';

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
```

Run: `npm run test:e2e -- sections`
Expected: FAIL (placeholder sections are empty).

- [ ] **Step 2: `src/components/sections/Location.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';
import Button from '../ui/Button.astro';
import { weeklySchedule } from '../../lib/hours';
import type { SiteData } from '../../lib/site';

interface Props {
  site: SiteData;
}
const { site } = Astro.props;
const schedule = site.hours.length > 0 ? weeklySchedule(site.hours) : [];
---

<Section id="ubicacion" class="bg-white">
  <SectionHeading id="ubicacion-titulo" eyebrow="Visítanos" title="Ubicación y horario" />
  <div class="grid gap-10 md:grid-cols-2">
    <div class="space-y-8">
      <div class="flex gap-3">
        <Icon name="lucide:map-pin" class="mt-1 size-5 shrink-0 text-plum-500" aria-hidden="true" />
        <address class="not-italic">
          <p class="font-semibold">{site.address.street}</p>
          <p>{site.address.neighborhood}</p>
          <p>
            {site.address.city}, {site.address.region} {site.address.postalCode}
          </p>
        </address>
      </div>

      <div class="flex gap-3">
        <Icon name="lucide:clock" class="mt-1 size-5 shrink-0 text-plum-500" aria-hidden="true" />
        <div class="w-full">
          <!-- Parte 2: indicador "Abierto ahora" -->
          <p
            data-open-status
            hidden
            class="mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
          ></p>
          {schedule.length > 0 ? (
            <table class="w-full max-w-sm text-sm">
              <caption class="sr-only">Horario de atención</caption>
              <tbody>
                {schedule.map((row) => (
                  <tr class="border-b border-plum-100 last:border-0">
                    <th scope="row" class="py-2 text-left font-medium">
                      {row.label}
                    </th>
                    <td class:list={['py-2 text-right', row.text === 'Cerrado' && 'text-muted']}>
                      {row.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p class="text-muted">Escríbenos para confirmar el horario de atención.</p>
          )}
        </div>
      </div>

      <Button href={site.mapsUrl} external variant="secondary" data-umami-event="directions">
        <Icon name="lucide:navigation" class="size-4" aria-hidden="true" />
        Cómo llegar
      </Button>
    </div>

    <div class="relative aspect-[4/3] overflow-hidden rounded-3xl bg-plum-50">
      <button
        type="button"
        data-map-load={site.mapsEmbedUrl}
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-plum-700 hover:bg-plum-100"
      >
        <Icon name="lucide:map" class="size-10" aria-hidden="true" />
        <span class="font-semibold">Ver mapa</span>
        <span class="text-xs text-muted">Se cargará Google Maps</span>
      </button>
    </div>
  </div>
</Section>

<script>
  // El mapa de Google (~500 KB) solo se carga cuando la visitante lo pide
  document.querySelectorAll<HTMLButtonElement>('[data-map-load]').forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        const iframe = document.createElement('iframe');
        iframe.src = button.dataset.mapLoad ?? '';
        iframe.title = 'Mapa de ubicación del salón';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.allowFullscreen = true;
        iframe.className = 'absolute inset-0 h-full w-full border-0';
        button.replaceWith(iframe);
      },
      { once: true },
    );
  });
</script>
```

- [ ] **Step 3: `src/components/sections/Contact.astro`**

```astro
---
import { Icon } from 'astro-icon/components';
import Section from '../ui/Section.astro';
import SectionHeading from '../ui/SectionHeading.astro';
import { formatMxPhone, telHref } from '../../lib/phone';
import type { SiteData } from '../../lib/site';

interface Props {
  site: SiteData;
  bookingHref: string;
}
const { site, bookingHref } = Astro.props;

interface Channel {
  label: string;
  detail: string;
  href: string;
  icon: string;
  external: boolean;
  event: string;
}
const channels: Channel[] = [
  {
    label: 'WhatsApp',
    detail: formatMxPhone(site.whatsapp),
    href: bookingHref,
    icon: 'simple-icons:whatsapp',
    external: true,
    event: 'whatsapp-contact',
  },
  {
    label: 'Llamar',
    detail: formatMxPhone(site.phone),
    href: telHref(site.phone),
    icon: 'lucide:phone',
    external: false,
    event: 'call',
  },
  ...(site.instagram
    ? [
        {
          label: 'Instagram',
          detail: 'Síguenos',
          href: site.instagram,
          icon: 'simple-icons:instagram',
          external: true,
          event: 'instagram',
        },
      ]
    : []),
  ...(site.facebook
    ? [
        {
          label: 'Facebook',
          detail: 'Síguenos',
          href: site.facebook,
          icon: 'simple-icons:facebook',
          external: true,
          event: 'facebook',
        },
      ]
    : []),
  ...(site.email
    ? [
        {
          label: 'Correo',
          detail: site.email,
          href: `mailto:${site.email}`,
          icon: 'lucide:mail',
          external: false,
          event: 'email',
        },
      ]
    : []),
];
---

<Section id="contacto">
  <SectionHeading
    id="contacto-titulo"
    eyebrow="Contacto"
    title="Agenda tu cita"
    intro="La forma más rápida es por WhatsApp; te respondemos en horario de atención."
  />
  <ul class="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
    {channels.map((c) => (
      <li>
        <a
          href={c.href}
          data-umami-event={c.event}
          {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          class="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <span class="grid size-12 shrink-0 place-items-center rounded-full bg-plum-50 text-plum-600">
            <Icon name={c.icon} class="size-6" aria-hidden="true" />
          </span>
          <span class="min-w-0">
            <span class="block font-semibold text-plum-900">{c.label}</span>
            <span class="block truncate text-sm text-muted">{c.detail}</span>
          </span>
        </a>
      </li>
    ))}
  </ul>
</Section>
```

- [ ] **Step 4: Wire into `src/pages/index.astro`**

Imports:

```astro
import Location from '../components/sections/Location.astro'; import Contact from
'../components/sections/Contact.astro';
```

Replace the two placeholder sections with:

```astro
<Location site={site} />
<Contact site={site} bookingHref={bookingHref} />
```

- [ ] **Step 5: Run all tests**

Run: `npm test && npm run test:e2e`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/Location.astro src/components/sections/Contact.astro src/pages/index.astro tests/e2e/sections.spec.ts
git commit -m "feat: add location with schedule and click-to-load map, and contact channels

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Quality gate, cleanup, owner sign-off

**Files:**

- Create: `tests/e2e/quality.spec.ts`
- Modify: `CLAUDE.md`, `docs/astro-migration-plan.md` (tick Phase 0–1 boxes)
- Delete: `legacy/`

**Interfaces:**

- Consumes: the whole page.
- Produces: a green `npm test && npm run test:e2e && npm run build`, and an updated `CLAUDE.md` that Part 2 builds on.

- [ ] **Step 1: Write `tests/e2e/quality.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('no horizontal scroll', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('no broken images (including lazy ones)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    for (const img of Array.from(document.images)) img.loading = 'eager';
  });
  await page.waitForFunction(() => Array.from(document.images).every((img) => img.complete));
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
  );
  expect(broken).toEqual([]);
});

test('every image has alt text', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('img:not([alt])')).toHaveCount(0);
});

test('no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('first-load transfer stays under 1 MB', async ({ page }) => {
  let bytes = 0;
  page.on('response', async (res) => {
    const body = await res.body().catch(() => Buffer.alloc(0));
    bytes += body.length;
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(bytes).toBeLessThan(1_000_000);
});
```

- [ ] **Step 2: Run and fix until green**

Run: `npm run test:e2e -- quality`
Expected: PASS. Likely failure: horizontal overflow from the category chip row or a long email in Contact. The chip row already uses `overflow-x-auto` and the contact detail uses `truncate`; if something else overflows, find it with:

```js
// en la consola del navegador a 375px
[...document.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth);
```

- [ ] **Step 3: Lighthouse check (manual, mobile)**

```bash
npm run build && npm run serve:dist
npx lighthouse http://localhost:4321 --preset=perf --form-factor=mobile --screenEmulation.mobile --view
npx lighthouse http://localhost:4321 --only-categories=accessibility,best-practices,seo --view
```

Expected: ≥ 90 in all four categories. (Part 2 automates this with Lighthouse CI.)

Also open the site on a real low-end Android phone and an iPhone (Safari) on the same Wi-Fi (`npx serve dist -l 4321` then `http://<your-LAN-IP>:4321`). Check menu, WhatsApp links (they should open the app), and map loading.

- [ ] **Step 4: Delete the legacy site**

```bash
git rm -r legacy
```

- [ ] **Step 5: Update `CLAUDE.md`** by replacing the "Running", "Architecture" and "Known state / gotchas" sections with:

````markdown
## Running

Requires Node ≥ 22.12.

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # astro check + static build to dist/
npm test               # Vitest unit tests (src/lib)
npm run test:coverage  # coverage, 80% threshold on src/lib
npm run test:e2e       # Playwright against the built dist/ (mobile + desktop)
```
````

## Architecture

Astro 7 static site + Tailwind 4 (`@tailwindcss/vite`, tokens in `src/styles/global.css` `@theme`).

- **Content** (owner-editable) lives in `src/content/` as one YAML file per entry; schemas in `src/content.config.ts`. The singleton `site/index.yaml` holds business data (phone, WhatsApp, address, hours, highlights). Layout is Keystatic-compatible: don't move files.
- **Logic** lives in `src/lib/*.ts` (pure, unit-tested): phone/WhatsApp links, price/duration formatting, opening hours in `America/Mexico_City`, service grouping, nav.
- **Components**: `src/components/{ui,layout,sections}`. They receive data and hold no business copy. Sections with no content are not rendered, and their nav link disappears.
- **Icons**: astro-icon; any icon used must be listed in `src/lib/icons.ts` (`ICON_INCLUDE`).
- **Client JS**: only the mobile menu (`Header.astro`) and the click-to-load map (`Location.astro`).
- Adding a service = add `src/content/services/<slug>.yaml`. Categories are fixed in `src/lib/categories.ts`.

## Known state / gotchas

- Fields marked `# PENDIENTE` in `src/content/` are unconfirmed with the owner.
- Empty optional fields may be `''` or `null` (Keystatic's convention); schemas treat both as missing.
- E2E tests read the YAML content to build their expectations, so they follow content edits.

````

- [ ] **Step 6: Tick Phases 0–1 in `docs/astro-migration-plan.md`**, changing `- [ ]` to `- [x]` for the completed items in Phase 0 and Phase 1.5, except "Owner approves the look" (leave it until the owner does).

- [ ] **Step 7: Full verification**

Run: `npm run test:coverage && npm run test:e2e && npm run build`
Expected: all green; coverage ≥ 80%.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add quality E2E checks, remove legacy site, update CLAUDE.md

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
````

- [ ] **Step 9: Owner sign-off**

Share a preview (e.g. `npx serve dist` + a tunnel, or wait for the Part 2 deploy preview) and walk the owner through it. Record the feedback and the list of `# PENDIENTE` answers in a new section, "Owner feedback", at the bottom of `docs/astro-migration-plan.md`.
