# Belyni: Enhancement Evaluation

_Date: 2026-09-27. Scope: `index.html`, `script.js`, `resources/css/styles.css`, `resources/img/`, repo hygiene._

> **Decision (2026-09-27):** Option B (Astro) with Tailwind instead of Bulma; the owner maintains
> the content, so a CMS is part of the plan. See [astro-migration-plan.md](./astro-migration-plan.md).

## TL;DR

The site is a prototype: the layout is fine, but most content is placeholder, several assets are
missing, and the one visible animation doesn't work. The code is small (~320 lines), so **the
cost of any bug fix is low, and the cost of switching technology is also low**. That changes
the usual "refactor vs. rewrite" math.

**Recommendation:** migrate to **Astro** (static output, zero JS by default) with plain CSS or
Tailwind, deploy to Cloudflare Pages / Netlify / GitHub Pages, and model services, prices, and
brands as data instead of hand-copied HTML. Do the **Phase 0 quick fixes first** (they take about an hour
and make the current site presentable in the meantime). Details and alternatives are in
[Technology options](#3-technology-options).

---

## 1. Bugs (things that are broken today)

| #   | Severity | Where                              | Problem                                                                                                                                                                                                                                                                                                                                                                       | Fix                                                                                                                                     |
| --- | -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | **High** | `script.js:31-34`                  | After 2.5s the hero swaps to `bannerBelyni.png`, **which doesn't exist**, so the banner turns into an empty grey gradient. That's the first thing every visitor sees. The path `../resources/...` is also wrong: inline styles resolve relative to the _document_, not the CSS file. It only works at a domain root and breaks under a sub-path like GitHub Pages `/belyni/`. | Point to an existing image (`bannerBelyniSinLetras.png` or `banner.jpg`) with a root-relative path, or drop the swap entirely (see P1). |
| B2  | **High** | `index.html:59,91,106`             | Missing images: `corteBelyni.jpg`, `olaplex-seeklogo.png`. The services and brands sections render broken-image icons. Meanwhile `corte.jpg`, `manicure.jpg`, `nieves.jpg`, `tratamientos.jpeg`, `banner.jpg`, `logo.png`, and `logo-name-svg.svg` sit in the repo unused.                                                                                                    | Wire up the existing images and add the Olaplex logo (or remove the brand until you have it).                                           |
| B3  | **High** | `index.html:118`                   | The contact form `POST`s to `#`. On a static host that's a 405 error or a silent page reload, and **the customer thinks they sent a message that went nowhere**.                                                                                                                                                                                                              | Use a form service (Formspree, Web3Forms, Netlify Forms), or replace the form with WhatsApp/phone CTAs.                                 |
| B4  | Medium   | `styles.css:29-37`                 | The hero fade-in never animates. The `transition` is declared only on the `.is-loading` state, and when the class is removed the new state has no transition, so it snaps. JS also removes the class on `DOMContentLoaded`, usually before first paint.                                                                                                                       | Put `transition` on `.hero` itself, or use a CSS `@keyframes` animation with no JS at all.                                              |
| B5  | Medium   | `script.js:1,27`                   | Two `DOMContentLoaded` listeners, and `is-loading` gets removed twice. The script is at the end of `<body>`, so the listener isn't needed at all.                                                                                                                                                                                                                             | Merge into one; use `defer` on the script tag.                                                                                          |
| B6  | Medium   | `index.html:32`, `script.js:21-24` | The "Citas" nav link points to `#appointments`, which is commented out. Calendly's widget script is still downloaded on every page view (third-party JS + cookies, for nothing).                                                                                                                                                                                              | Either restore booking or remove the link and the loader.                                                                               |
| B7  | Medium   | `index.html:178-205`               | Footer "social" icons are `<button>`s inside `<p class="button">` (button styling nested in button styling) with **no action and no accessible label**. The real links below them point to `tu_salon` placeholders.                                                                                                                                                           | Replace with real `<a href>` links and `aria-label`s; delete the duplicates.                                                            |
| B8  | Medium   | footer, WhatsApp button            | Placeholder data: `+52 123 456 7890`, `wa.me` number `521234567890`, `contacto@tusalon.com.mx`, `instagram.com/tu_salon`. The **WhatsApp button, which is the main conversion path, messages a fake number.**                                                                                                                                                                 | Fill in the real data (ideally from one config file, see A3).                                                                           |
| B9  | Low      | `styles.css:2-6`                   | `--bulma-primary-*` are Bulma 1.x variables; under 0.9.4 they do nothing. `is-primary` buttons render Bulma's default turquoise, which is likely off-brand.                                                                                                                                                                                                                   | Pick a brand palette and apply it properly (Sass vars in 0.9, CSS vars in 1.x, or your own CSS).                                        |
| B10 | Low      | navbar                             | The mobile menu doesn't close after tapping a link. It stays open over the section you jumped to.                                                                                                                                                                                                                                                                             | Close the menu on `.navbar-item` click.                                                                                                 |
| B11 | Low      | contact form                       | The phone placeholder `(55) 1234-5678` is a CDMX area code; Veracruz is `229`.                                                                                                                                                                                                                                                                                                | Cosmetic.                                                                                                                               |

## 2. Bad practices / quality issues

### Performance (the biggest real-world problem)

- **P1. The hero is an 8.1 MB GIF** (`Belyni.gif`, 1152×648). On a Mexican mobile connection
  that's the whole page budget several times over, and it's the LCP element. The same animation
  as MP4/WebM is typically 300–800 KB, and as a static AVIF/WebP about 50–150 KB.
  → Convert with `ffmpeg` to `<video autoplay muted loop playsinline poster=...>`, or just use a
  still image. The GIF → PNG swap after 2.5s also makes the browser download both.
- **P2. Font Awesome JS kit (`all.min.js`)** ships the full icon set as JS and rewrites the DOM
  just to draw about 6 icons. → Inline those 6 SVGs (or use a subset/sprite).
- **P3. Unoptimized images:** `bannerBelyniSinLetras.png` is 1.4 MB, `manicure.jpg` 412 KB, and
  the SVG logo is 174 KB (371 paths, never run through SVGO). There's no `srcset`/`sizes`,
  no WebP/AVIF, and no `width`/`height` attributes. → Use an image pipeline (Astro's `<Image>`
  handles this automatically) or `squoosh`/`sharp` by hand.
- **P4. Google Maps iframe** loads roughly 500 KB+ of Google JS. `loading="lazy"` helps, but a _facade_
  (a static map image that links to Google Maps) is cheaper and loads faster.
- **P5. Full Bulma CSS** (~200 KB unminified / ~25 KB gzipped) for a handful of components.
  That's acceptable, but a tailored stylesheet would be a fraction of that.

### Accessibility

- **A1.** `navbar-burger` is an `<a>` without `href`/`tabindex`, so it **isn't reachable by keyboard**,
  and `aria-expanded` is never updated. Use a real `<button>`.
- **A2.** Modals: no `Escape` to close, no focus moved into or trapped in the modal, no focus return,
  no `role="dialog"`/`aria-modal`. The native `<dialog>` element gives you all of that for free.
- **A3.** Icon-only controls (WhatsApp button, social icons) have no text alternative.
- **A4.** The page has **no `<h1>`** (the hero heading is commented out). That hurts both screen-reader
  navigation and SEO.
- **A5.** Logo `alt="Logo Salón"` should be `alt="Belyni"`.
- **A6.** `target="_blank"` links: add `rel="noopener"` (modern browsers imply it, but be explicit).

### SEO / local discovery (matters most for a salon)

- **S1.** No `<meta name="description">`, no Open Graph/Twitter tags (so WhatsApp/Instagram link
  previews are blank), no favicon, and a bare `<title>Belyni</title>`.
  → e.g. `Belyni | Salón de belleza en Veracruz: cortes, uñas y tratamientos`.
- **S2.** No structured data. Add JSON-LD `BeautySalon` (a `LocalBusiness` subtype) with address,
  geo, phone, opening hours, price range, and `sameAs` social links. It's cheap and can win rich results.
- **S3.** Keep the **Google Business Profile** in sync with the site (hours, phone, photos). For a
  local salon it drives more traffic than the website itself.
- **S4.** No `sitemap.xml` / `robots.txt`. Not critical for one page, but trivial with Astro.

### Maintainability / structure

- **M1. Content is hard-coded and duplicated.** Every service needs 3 edits (card, modal, mobile
  image), and prices live inside modal markup. → Model services as data (JSON/Markdown/YAML),
  render cards and modals from it.
- **M2. The responsive split is odd UX.** On mobile, images are removed from the cards and shown
  in a separate grid below, with no connection to the service they belong to. → Show the image in
  the card at every breakpoint with responsive `srcset`; delete `#mobile-service-images`.
- **M3. Business data scattered in the markup** (phone appears in 2 formats in 2 places, WhatsApp
  message, address, Maps URL). → One `site.config` source of truth.
- **M4. Dead code:** commented-out hero text, a duplicate Maps iframe, a Calendly section, a
  gradient text style, and the Swiper dependency in `package.json` (whose `main: index.js` doesn't exist).
- **M5. Inline styles set from JS** (`style.background = ...`). Toggle a class and keep styling in CSS.
- **M6. Third-party assets without SRI** (`integrity=`). Either add SRI hashes or self-host/bundle.

### Repo hygiene

- **R1.** No `.gitignore`; `.DS_Store`, `.idea/`, `node_modules/` are sitting untracked
  and one `git add .` away from being committed.
- **R2.** An 8 MB binary is already in git history. Future large media should be optimized first
  (or use Git LFS). Rewriting history is probably not worth it for a 9-commit repo.
- **R3.** No README, no deploy target documented, no CI.
- **R4.** Commit messages don't follow the conventional format (`feat:`, `fix:` …) in the global rules.

## 3. Technology options

The site is small, static, content-driven, Spanish-only, and edited rarely. Its real
requirements: **fast on mobile, easy to update prices/services, good local SEO, working contact
and booking.** Judged against those:

| Option                                                          | Pros                                                                                                                                                                                                                                                                                                                 | Cons                                                                                    | Verdict                                                           |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **A. Keep vanilla HTML + Bulma, just fix**                      | Zero learning curve, no build, free hosting anywhere                                                                                                                                                                                                                                                                 | Content duplication stays, no image pipeline, manual optimizations, Bulma 0.9 is legacy | OK as a **stopgap** (Phase 0)                                     |
| **A'. Vanilla + upgrade to Bulma 1.x**                          | CSS variables for theming, dark mode                                                                                                                                                                                                                                                                                 | Still no templating; class names mostly the same but some breaking changes              | Marginal gain                                                     |
| **B. Astro (recommended)**                                      | Static HTML output with **0 KB JS by default**; components remove duplication; **content collections** for services/brands (type-checked with Zod); built-in `<Image>` optimization (fixes P1/P3); sitemap/SEO integrations; islands if you ever need interactivity; deploys free to Cloudflare/Netlify/GitHub Pages | Needs Node + a build step; small learning curve                                         | **Best fit**                                                      |
| **C. Eleventy (11ty)**                                          | Very simple, also zero-JS, great for data-driven pages                                                                                                                                                                                                                                                               | Image handling via plugin, smaller component story than Astro                           | Solid alternative if you want something minimal                   |
| **D. Next.js / Nuxt / SvelteKit**                               | Powerful, good if it grows into an app                                                                                                                                                                                                                                                                               | Overkill: React runtime for a brochure page, more hosting complexity                    | Only if you plan the booking/admin system below                   |
| **E. Site builder / CMS (Wix, Squarespace, WordPress)**         | The salon owner could edit it themselves                                                                                                                                                                                                                                                                             | Monthly cost, slower, less control, not a dev project anymore                           | Consider **if the owner, not a developer, will maintain content** |
| **F. Astro + headless CMS** (Decap, TinaCMS, Sanity, Keystatic) | Owner edits prices/photos in a UI; the site stays static and fast                                                                                                                                                                                                                                                    | Extra setup                                                                             | **Good upgrade path** once B is done                              |

**CSS choice inside Astro:** plain modern CSS (nesting, custom properties, `clamp()`) is enough
for a site this size and gives the most distinctive result. Tailwind is fine if you already know it.
Keeping Bulma isn't worth it: the only interactive parts (burger, modal) are about 10 lines of JS, or
native `<dialog>`/`<details>`.

## 4. Feature ideas (product-level, beyond fixing)

Ordered by value to the business:

1. **Booking that actually works.** For Mexico, salon-specific tools like **Fresha, AgendaPro,
   Booksy, or Setmore** handle staff, services, reminders via WhatsApp/SMS, and deposits better
   than Calendly, and most are free or cheap. Embed their widget or link out. The simplest option is
   pre-filled WhatsApp messages per service (`wa.me/52229XXXXXXX?text=Quiero agendar: Corte Dama`).
2. **Full services & price list** grouped by category (Cabello, Uñas, Tratamientos, Faciales…),
   with duration and "desde $X" pricing. This is the #1 thing visitors look for.
3. **Gallery / portfolio** (before/after), ideally pulled from Instagram or a curated folder.
4. **Reviews / testimonials**, e.g. embedded Google reviews or a curated few. Add `aggregateRating`
   to the JSON-LD only if the reviews are genuinely first-party.
5. **Hours & "open now"** status, a "Cómo llegar" button (Maps deep link), and click-to-call.
6. **Team section**: stylists with photo and specialty.
7. **Promotions** banner (seasonal packages, bridal/XV años packages, which are very relevant locally).
8. **Analytics** that respect privacy: Cloudflare Web Analytics / Plausible / Umami, tracking
   WhatsApp and phone clicks as conversions.
9. **Bilingual (es/en)**? Probably low value unless there's tourist traffic; skip for now.
10. **PWA / "Add to home screen"**: low value for a salon; skip.

## 5. Proposed roadmap

### Phase 0: Quick fixes on the current stack (≈1–2 h)

- [ ] Add `.gitignore` (`.DS_Store`, `.idea/`, `node_modules/`)
- [ ] Fix B1/B2: use existing images, remove the broken hero swap
- [ ] Replace `Belyni.gif` with MP4/WebM + poster, or a WebP still (P1)
- [ ] Real phone/WhatsApp/email/social links (B8, B7)
- [ ] Remove or replace the fake contact form (B3); remove the "Citas" link + Calendly loader (B6)
- [ ] Add `<h1>`, meta description, OG tags, favicon, JSON-LD (A4, S1, S2)
- [ ] Burger as `<button>` with `aria-expanded`; `Escape` closes modal; close menu on link click
- [ ] Remove `swiper` from `package.json`

### Phase 1: Migrate to Astro (≈1–2 days)

- [ ] `npm create astro@latest`, move assets to `src/assets/` (auto-optimized)
- [ ] Components: `Navbar`, `Hero`, `ServiceCard`, `ServiceDialog` (native `<dialog>`), `Brands`,
      `Contact`, `Footer`, `WhatsAppButton`
- [ ] Content collection `services` (name, category, description, price, duration, image) and
      `brands`; `site.config.ts` for business data
- [ ] Custom CSS with brand tokens (colors, typography), replacing Bulma
- [ ] `@astrojs/sitemap`, JSON-LD component
- [ ] Deploy to Cloudflare Pages / Netlify with a custom domain; preview deploys on PRs
- [ ] Lighthouse CI budget: LCP < 2.5s on mobile, total page weight < 1 MB

### Phase 2: Business features

- [ ] Booking integration (Fresha/AgendaPro/…), or per-service WhatsApp deep links
- [ ] Gallery, testimonials, team, hours/"abierto ahora"
- [ ] Privacy-friendly analytics with click conversions
- [ ] Optional: headless CMS so the owner can edit prices and photos

### Testing (fits the global rules, scaled to a static site)

- Playwright smoke tests: page loads, no broken images (all `img` have `naturalWidth > 0`),
  menu toggles, dialog opens/closes with `Escape`, WhatsApp link has the correct number.
- Lighthouse CI for performance/accessibility/SEO scores.
- `html-validate` or `astro check` in CI.
  (Unit tests are basically N/A for this project; the 80% coverage rule is about JS logic this site doesn't have.)

## 6. Decision summary

| Question                       | Answer                                                                                                                                                                                                   |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refactor or change technology? | **Change to Astro.** The codebase is small enough that a rewrite costs about the same as a thorough refactor, and Astro solves the structural problems (duplication, images, SEO) that a refactor can't. |
| Keep Bulma?                    | No. It's legacy 0.9 and used for very little; replace it with your own CSS (or Tailwind).                                                                                                                |
| Do anything before migrating?  | Yes: Phase 0. The broken hero, missing images, fake phone numbers, and dead form are hurting the live site today.                                                                                        |
| Who maintains content?         | **Decide this first.** If it's the salon owner, plan for a CMS (option F) or even a site builder (option E).                                                                                             |
