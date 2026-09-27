# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static, single-page marketing site for **Belyni**, a beauty salon in Veracruz, Mexico. All user-facing copy is in Spanish (`<html lang="es">`), and code comments are in Spanish too — keep both conventions.

## Running

There is no build step, bundler, linter, or test suite (`npm test` is the npm placeholder and just fails). Serve the repo root with any static server and open it in a browser:

```bash
npx serve .            # or: python3 -m http.server 8000
```

Serve from the root, not via `file://`: asset paths are written relative to the root (`./resources/...`), and the Google Maps iframe and CDN assets need HTTP.

## Architecture

Three files make up the whole site:

- `index.html`: all markup. The sections are navbar → hero banner → `#services` (cards + Bulma modals) → `#mobile-service-images` → `#brands` → `#contact` form → footer (Maps embed, social/contact) → floating WhatsApp button.
- `resources/css/styles.css`: small overrides on top of Bulma.
- `script.js`: vanilla JS, no modules.

**Bulma 0.9.4 is loaded from the jsDelivr CDN**, and Font Awesome 6.4 from cdnjs. They are not npm dependencies. The layout relies on Bulma classes (`columns`, `card`, `modal`, `navbar`, `is-hidden-mobile`, etc.), so check Bulma **0.9.x** docs rather than 1.x. The `--bulma-primary-*` CSS variables in `styles.css` are Bulma 1.x syntax, so they have no effect under 0.9.4.

**`script.js` wiring conventions:**
- The navbar burger toggles `is-active` on the element named by its `data-target`.
- Any `.modal-button` opens the modal whose id matches its `data-target`. `.modal-close` and `.modal-background` close the enclosing `.modal`. To add a service, add a card with a `.modal-button` plus a matching `<div id="modal-..." class="modal">`. No JS changes are needed.
- `body.is-loading` drives the hero fade-in (CSS). JS removes that class on `DOMContentLoaded`.
- The hero first shows `Belyni.gif` (set in CSS). After 2.5s JS swaps it to a static banner image via inline style.
- The Calendly widget script is injected dynamically, but the `#appointments` section is commented out in the HTML. The "Citas" nav link therefore points to nothing.

**Responsive split:** service card images are hidden on mobile (`is-hidden-mobile`). A separate `#mobile-service-images` grid appears only at ≤768px, controlled by a media query in `styles.css`. Update both places when adding service imagery.

## Known state / gotchas

- `swiper` is in `package.json` but is no longer used. The Swiper carousel was dropped in the Bulma refactor (commit `6516f38`).
- Some images referenced in the HTML/JS do not exist in `resources/img/`: `corteBelyni.jpg`, `bannerBelyni.png`, `olaplex-seeklogo.png`.
- Footer contact info, social URLs, and the WhatsApp number are still placeholders (`tu_salon`, `+52 123 456 7890`). The contact form posts to `#` and has no backend.
