# Psychical Excursion

**Psychical Excursion (PEx)** is a free, local-first 60-day practice guide for dream recall, lucid dreaming, body-sensory attention, sleep-edge awareness, and OBE-style experiences.

This repository contains the **Complete Product Surface** built on the accepted Core Engineering foundation (local storage, capture, journal, export, PWA). Canonical Days 1–60 are rendered from a local content packet. Until PEx Primary transports that locked packet, day screens show unmistakably marked **DEVELOPMENT FIXTURE** copy and must not be treated as curriculum.

The project is designed to be useful without requiring a spiritual belief system or making claims that consciousness literally leaves the body.

## Product constraints

- Free, no ads, no paywall, no required account
- All 60 days unlocked
- Local-first journal and progress (IndexedDB)
- Explicit Complete Day / undo (no scroll-depth completion, no streak punishment)
- Optional local audio capture (MediaRecorder)
- Installable PWA with application-shell offline behavior after a successful load
- Private journal text and audio are not transmitted to a server, analytics service, or external API
- No AI, Google identity/Drive/Docs, astronomy, donations, payments, backend, or public launch infrastructure

## Local development

```bash
npm install
npm run dev
```

Open the printed local URL. Service worker registration is **disabled in `npm run dev`** so that Vite’s module graph is not cached aggressively. Use a production preview to exercise offline/install behavior.

## Build and preview

```bash
npm run build
npm run preview
```

`preview` serves the production assets, including the generated `sw.js`.

## Tests and checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Architecture (short)

Vanilla TypeScript + Vite. Hash routes (`#/`, `#/today`, `#/day/1`–`#/day/60`, `#/days`, `#/phase/…`, `#/capture`, `#/journal`, `#/method`, `#/about`, `#/data`). IndexedDB database `pex-local`. See [docs/ENGINEERING.md](docs/ENGINEERING.md).

## Status

Worker maximum for this pass: `CODE_COMPLETE / PRIMARY_REVIEW_REQUIRED`. Complete Product acceptance still requires the locked 60-day packet and removal of all development fixtures. This is not production verification and is not a public launch.

Website design and development: [Hoopsnake Designs](https://hoopsnakedesigns.com/)
