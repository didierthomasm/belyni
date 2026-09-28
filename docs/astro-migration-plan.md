# Belyni: Astro + Tailwind Migration Plan

_Date: 2026-09-27. Follows [enhacement.md](./enhacement.md)._

## Decisions

| Topic                 | Decision                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Framework             | **Astro** (option B), static output, zero client JS by default                                                                          |
| Styling               | **Tailwind CSS v4**; Bulma, Font Awesome, and `script.js` are removed                                                                   |
| Who maintains content | **The salon owner**, so every text, price, photo, and contact detail must be editable without touching code (a git-based CMS, option F) |
| Order                 | **UI first**, then content editing, conversion features, SEO/perf, deploy, handoff                                                      |

## Guiding principles

1. **No content in components.** Components only receive data. Every string the owner might
   change lives in a content collection or in `site` settings. This is what makes Phase 2 (CMS)
   a plug-in step instead of a rewrite.
2. **Mobile-first.** Most visitors arrive from Instagram/WhatsApp/Google Maps on a phone.
   Design at 375px first, then scale up.
3. **Zero JS unless it earns its place.** Use native `<dialog>`, `<details>`, and CSS for menus and
   accordions. Any JS goes in a small `<script>` inside the component that needs it.
4. **One conversion goal per screen:** "Agenda por WhatsApp" is always one tap away.
5. **Spanish copy, Spanish code comments** (project convention).

---

## Phase 0: Project setup (½ day)

Goal: an empty Astro + Tailwind site running in this repo, with the old site still available
for reference until the switch.

- [x] Create branch `feat/astro-migration`
- [x] Add `.gitignore` (`node_modules/`, `dist/`, `.astro/`, `.DS_Store`, `.idea/`, `.env*`)
- [x] Move the current site to `legacy/` (`index.html`, `script.js`, `resources/css/`) so it can
      be compared side by side; it gets deleted at the end of Phase 1
- [x] Scaffold Astro in the repo root: `npm create astro@latest .` (minimal template, TypeScript strict)
- [x] Add Tailwind: `npx astro add tailwind` (sets up Tailwind v4 via `@tailwindcss/vite`,
      configured in CSS with `@theme`, with no `tailwind.config.js`)
- [x] Add Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss` (class sorting)
- [x] Move images to `src/assets/img/` so Astro's `<Image>`/`<Picture>` optimizes them
      (AVIF/WebP, `srcset`, width/height). Move the favicon source to `public/`
- [x] Remove `swiper` from `package.json`
- [x] Update `CLAUDE.md` with the new commands (`npm run dev`, `npm run build`, `npm run preview`)

Target structure:

```
src/
  assets/img/            # optimized by Astro
  components/
    layout/              # Header, Footer, WhatsAppFab, Section
    ui/                  # Button, Card, Badge, Icon
    sections/            # Hero, Services, Gallery, Brands, About, Location, Contact
  content/               # owner-editable content (Phase 2 wires a CMS on top)
    services/*.md
    brands/*.json
    site.json            # business name, phone, WhatsApp, address, hours, socials
  content.config.ts      # Zod schemas for collections
  layouts/BaseLayout.astro   # <head>, SEO, fonts, JSON-LD
  pages/index.astro
  styles/global.css      # @import "tailwindcss"; @theme { brand tokens }
public/                  # favicon, robots.txt, og-image
```

---

## Phase 1: New UI (3–5 days) ← start here

### 1.1 Design direction

Built on the brand assets that already exist:

- **Logo**: plum script wordmark with a hair illustration (`logo-name.png` / `logo-name-svg.svg`).
- **Brand color** sampled from the logo: `#A44C7E` (plum). White text on it is ~5.4:1 contrast,
  which passes WCAG AA.
- **Accent** sampled from the banner background: `#EDB7B4` (blush).
- **Mood**: elegant, warm, feminine, uncluttered. Lots of whitespace, soft blush surfaces,
  plum for actions, near-black for text.

Draft tokens (`src/styles/global.css`):

```css
@import 'tailwindcss';

@theme {
  --color-plum-50: #fbf4f8;
  --color-plum-100: #f5e4ee;
  --color-plum-500: #a44c7e; /* marca: logo */
  --color-plum-600: #8c3f6b; /* hover */
  --color-plum-900: #3d1a2f;
  --color-blush-100: #fbeceb;
  --color-blush-300: #edb7b4; /* marca: fondo del banner */
  --color-ink: #1f1a1d;

  --font-display: 'Cormorant Garamond', ui-serif, serif; /* títulos */
  --font-sans: 'Manrope', ui-sans-serif, system-ui, sans-serif; /* texto */
}
```

- **Typography**: an elegant serif for headings (Cormorant Garamond, Playfair Display, or Fraunces;
  pick one) + a clean sans for body. **Self-host** the fonts via Fontsource (no Google Fonts
  request), preloading only the weights actually used.
- **Icons**: inline SVG via `astro-icon` + Iconify sets (e.g. `mdi`, `simple-icons` for
  WhatsApp/Instagram/Facebook). Only the icons used get shipped.
- Output of this step: the tokens above finalized plus one mobile + one desktop mockup of the hero and
  services section (Figma, or directly in code) **approved by the owner before building the rest**.

### 1.2 Page structure (single page, mobile-first)

| #   | Section                 | Content                                                                                                                        | Notes                                                                                                                       |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Header**              | Logo, anchor links, "Agendar" button                                                                                           | Sticky, turns solid on scroll; mobile menu via `<details>` or a tiny script; `aria-expanded` handled                        |
| 2   | **Hero**                | `<h1>` headline, one-line value prop, primary CTA (WhatsApp), secondary CTA (Ver servicios), photo                             | Replaces the 8 MB GIF with an optimized still image (or short MP4 with poster). Text is real HTML, not baked into the image |
| 3   | **Servicios**           | Categories (Cabello, Uñas, Tratamientos…) as tabs or chips; each service: name, short description, duration, "desde $X", photo | Replaces cards + modals + the separate mobile image grid. Details via native `<dialog>` only if descriptions are long       |
| 4   | **Por qué Belyni**      | 3–4 highlights (products, experience, hygiene, location)                                                                       | Short, icon + text                                                                                                          |
| 5   | **Galería**             | Grid of real work (before/after)                                                                                               | Lazy-loaded, optimized; lightbox optional (later)                                                                           |
| 6   | **Marcas**              | Brand logos (Olaplex, …)                                                                                                       | Grayscale → color on hover                                                                                                  |
| 7   | **Opiniones**           | 3 curated reviews                                                                                                              | Phase 5 can connect Google reviews                                                                                          |
| 8   | **Ubicación y horario** | Address, hours table, "Cómo llegar" button, map                                                                                | Map as a **static image facade** linking to Google Maps (no iframe on load)                                                 |
| 9   | **Contacto**            | WhatsApp, click-to-call, email, socials; optional form                                                                         | The form is only kept if Phase 3 connects it to a service                                                                   |
| 10  | **Footer**              | Logo, socials, hours, copyright                                                                                                |                                                                                                                             |
| —   | **WhatsApp FAB**        | Floating button                                                                                                                | `aria-label`, doesn't cover content on mobile                                                                               |

### 1.3 Components to build

- `layouts/BaseLayout.astro`: `<html lang="es">`, meta, fonts, skip-link
- `ui/Button.astro` (variants: primary / secondary / ghost; renders `<a>` or `<button>`)
- `ui/Card.astro`, `ui/Badge.astro`, `ui/SectionHeading.astro`
- `layout/Header.astro`, `layout/Footer.astro`, `layout/WhatsAppFab.astro`
- `sections/*.astro`, one per row in the table above
- Helper `lib/whatsapp.ts`: builds `https://wa.me/<number>?text=<mensaje>` from `site.json`, with an
  optional service name so each service can have its own "Agendar este servicio" link

### 1.4 Content, local first

Even before the CMS exists, all content goes in `src/content/` with Zod schemas, e.g.:

```ts
// content.config.ts (sketch)
services: {
  name: string, category: enum, description: string,
  priceFrom: number, durationMin?: number, image?: image(), order: number, featured: boolean
}
brands:  { name: string, logo: image(), url?: string }
reviews: { author: string, text: string, rating: 1-5 }
site:    { phone, whatsapp, email, address, mapsUrl, hours[], socials{} }
```

Seed with the one known service (Corte Dama, $500 MXN) plus the existing images
(`corte.jpg`, `manicure.jpg`, `nieves.jpg`, `tratamientos.jpeg`) and **placeholder entries that
are clearly marked** until the owner provides the real list (see [Open questions](#open-questions-for-the-owner)).

### 1.5 Phase 1 done when

- [x] Every section above renders from content files, with no hard-coded copy in components
- [x] Looks right at 375px, 768px, 1280px; no horizontal scroll
- [x] Keyboard-navigable; visible focus; one `<h1>`; images have `alt`
- [x] Lighthouse mobile ≥ 90 in all four categories
- [x] Page weight < 1 MB on first load; no client JS except the menu (if needed)
- [ ] Owner approves the look
- [x] `legacy/` deleted

---

## Phase 2: Owner-editable content / CMS (1–2 days)

Goal: the owner changes prices, services, photos, hours, and promotions from a web UI on their phone or
laptop, with no code, and the site rebuilds automatically.

**Recommended: [Keystatic](https://keystatic.com).**

- Built for Astro; the schemas mirror the Zod collections from Phase 1
- Content stays in this git repo as Markdown/JSON, so there's no external database and no monthly cost
- Images uploaded by the owner land in the repo and still go through Astro's optimization
- Admin UI at `/keystatic`; each save is a commit, which triggers a redeploy
- Trade-offs: the admin route needs a server adapter (Netlify / Vercel / Cloudflare), and in
  GitHub mode the owner signs in with GitHub (or via Keystatic Cloud; confirm current auth
  options at setup time)

**Alternatives** if the owner finds that too technical: **Sanity** (hosted studio with a polished editor
and a free tier, but content lives outside the repo and needs a rebuild webhook) or
**Pages CMS** (free, GitHub-based, no adapter needed).

Tasks:

- [ ] Install Keystatic + adapter; mirror `services`, `brands`, `reviews`, `gallery`, `site`
      as Keystatic collections/singletons with Spanish labels and help text
- [ ] Field validation so the owner can't break the layout (max lengths, required images, price ≥ 0)
- [ ] Protect `/keystatic` (auth via GitHub/Keystatic Cloud only)
- [ ] Test the full loop: owner edits a price, commit, deploy, change live in < 2 min

---

## Phase 3: Conversion features (1–2 days)

- [ ] **WhatsApp everywhere**: FAB, hero CTA, and a per-service "Agendar" link with a pre-filled message
- [ ] **Click-to-call** (`tel:`) and **Cómo llegar** (Google Maps deep link)
- [ ] **Hours + "Abierto ahora / Cerrado"** badge (small client script using `America/Mexico_City`)
- [ ] **Booking**: decide with the owner between WhatsApp-only (simplest), or a salon tool
      (Fresha / AgendaPro / Booksy) linked or embedded. Don't bring back Calendly
- [ ] **Contact form**: only if wanted; wire to Web3Forms / Formspree / Netlify Forms, with
      honeypot spam protection, validation, and success/error messages in Spanish
- [ ] **Promotions banner** driven by a CMS entry with start/end dates (hidden automatically when expired)

---

## Phase 4: SEO & performance (1 day)

- [ ] `<title>` / meta description / canonical / Open Graph / Twitter card per page;
      OG image 1200×630 with logo (link previews on WhatsApp/Instagram)
- [ ] JSON-LD `BeautySalon` from `site.json` (address, geo, phone, hours, priceRange, `sameAs`)
- [ ] `@astrojs/sitemap`, `robots.txt`, favicon set (SVG + PNG + apple-touch-icon)
- [ ] Align name/address/phone exactly with the **Google Business Profile**
- [ ] Performance budget: LCP < 2.5s, CLS < 0.1 on mobile 4G; hero image preloaded, fonts subset
- [ ] Privacy-friendly analytics (Cloudflare Web Analytics / Plausible / Umami) with events for
      WhatsApp, call, and directions clicks

---

## Phase 5: Testing & QA (ongoing, formalized here)

- [ ] `astro check` (types + content schemas) in CI
- [ ] **Playwright** smoke tests:
  - page loads with no console errors and **no broken images** (`naturalWidth > 0`)
  - mobile menu opens/closes, closes on link tap, and works with keyboard
  - WhatsApp links contain the number from `site.json`
  - service with an expired promotion is hidden
- [ ] **Lighthouse CI** with budgets from Phase 1/4 (fails the PR if it regresses)
- [ ] Unit tests for the small logic helpers (`whatsapp.ts`, open-now calculation, promo date filter)
- [ ] Manual check on a real low-end Android phone + iPhone Safari

---

## Phase 6: Deploy & domain (½ day)

- [ ] Host on **Netlify** or **Cloudflare Pages** (free tier; both support the Keystatic adapter)
- [ ] Preview deploys on every PR; production on `main`
- [ ] Custom domain (e.g. `belyni.mx`) + HTTPS; redirect `www` ↔ apex
- [ ] GitHub Actions: `astro check` + build + Playwright + Lighthouse on PRs

---

## Phase 7: Owner handoff (½ day)

- [ ] `docs/guia-del-propietario.md` **in Spanish**, with screenshots: how to sign in, edit a price,
      add a service, upload photos (recommended size/orientation), change hours, create a promotion
- [ ] 30-minute walkthrough session with the owner
- [ ] Owner has their own accounts (hosting, GitHub/CMS, domain), not tied to the developer
- [ ] Rollback explained: every change is a commit and can be reverted

---

## Later (backlog)

- Gallery synced from Instagram
- Google reviews widget
- Team / stylists section
- Package pages (novias, XV años) as separate SEO landing pages
- English version, only if analytics show tourist traffic

## Open questions for the owner

Needed before or during Phase 1:

1. Full **service list** with categories, descriptions, prices ("desde"), and durations
2. **Real photos** of the salon, team, and work. The current banner looks like stock/AI imagery;
   real photos build more trust
3. Real **phone, WhatsApp, email, Instagram, Facebook**, and **opening hours**
4. **Brands** used (logos)
5. Booking preference: WhatsApp only, or an online booking tool?
6. Domain: already owned? Which one?
7. Any **testimonials** they're happy to publish

## Timeline estimate

| Phase        | Effort                                         |
| ------------ | ---------------------------------------------- |
| 0 Setup      | ½ day                                          |
| 1 UI         | 3–5 days (depends on owner feedback + content) |
| 2 CMS        | 1–2 days                                       |
| 3 Conversion | 1–2 days                                       |
| 4 SEO/perf   | 1 day                                          |
| 5 Testing    | 1 day (+ ongoing)                              |
| 6 Deploy     | ½ day                                          |
| 7 Handoff    | ½ day                                          |
| **Total**    | **≈ 2 weeks part-time**                        |

## Owner feedback

_Pending: walk the owner through the preview and record their feedback here._

Checklist of every `# PENDIENTE` item in `src/content/` that needs an answer before Part 2's production gate:

| File                                     | Field                | Note                                                                    |
| ---------------------------------------- | -------------------- | ----------------------------------------------------------------------- |
| `src/content/site/index.yaml`            | `intro`              | validar texto con la dueña                                              |
| `src/content/site/index.yaml`            | `phone`              | confirmar número para llamadas (tomado del WhatsApp del sitio anterior) |
| `src/content/site/index.yaml`            | `whatsapp`           | confirmar (sitio anterior, abril 2025)                                  |
| `src/content/site/index.yaml`            | `address.postalCode` | código postal                                                           |
| `src/content/site/index.yaml`            | `geo.lat`            | verificar contra Google Business Profile                                |
| `src/content/site/index.yaml`            | `instagram`          | confirmar                                                               |
| `src/content/site/index.yaml`            | `facebook`           | confirmar                                                               |
| `src/content/site/index.yaml`            | `hours`              | horario real (lista de `{ day, open, close }`)                          |
| `src/content/site/index.yaml`            | `highlights`         | validar textos con la dueña                                             |
| `src/content/site/index.yaml`            | `servicesNote`       | validar                                                                 |
| `src/content/team/nieves-munoz.yaml`     | `role`               | confirmar cargo                                                         |
| `src/content/services/corte-dama.yaml`   | `durationMin`        | duración                                                                |
| `src/content/services/manicura.yaml`     | `priceFrom`          | precio                                                                  |
| `src/content/services/manicura.yaml`     | `durationMin`        | duración                                                                |
| `src/content/services/masajes.yaml`      | `priceFrom`          | precio                                                                  |
| `src/content/services/masajes.yaml`      | `durationMin`        | duración                                                                |
| `src/content/services/masajes.yaml`      | `image`              | falta foto                                                              |
| `src/content/services/tratamientos.yaml` | `priceFrom`          | precio                                                                  |
| `src/content/services/tratamientos.yaml` | `durationMin`        | duración                                                                |
| `src/content/services/tratamientos.yaml` | `image`              | falta foto                                                              |
