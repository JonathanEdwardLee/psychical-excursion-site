# Psychical Excursion

**Psychical Excursion (PEx)** is a free, local-first 60-day practice guide for dream recall, lucid dreaming, body-sensory attention, sleep-edge awareness, and OBE-style experiences.

This repository currently contains the **Core Engineering foundation** (local storage, capture, journal, export, progress shell, PWA, accessibility baseline). Canonical Days 1–60 content is not in this build.

The project is designed to be useful without requiring a spiritual belief system or making claims that consciousness literally leaves the body.

## Product constraints

- Free, no ads, no paywall, no required account
- All 60 days unlocked (placeholder day identifiers only in this pass)
- Local-first journal and progress (IndexedDB)
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

Vanilla TypeScript + Vite. Hash routes (`#/`, `#/capture`, `#/journal`, `#/days`, `#/data`). IndexedDB database `pex-local`. See [docs/ENGINEERING.md](docs/ENGINEERING.md) for schema, export format, privacy, PWA boundary, and known limitations.

## Status

`CODE_COMPLETE / PRIMARY_REVIEW_REQUIRED` for the foundation pass when the pull request is opened. This is not production verification.

Website design and development: [Hoopsnake Designs](https://hoopsnakedesigns.com/)
