# PEx Engineering

Status of this document: engineering notes for the local-first foundation and complete product surface. It does not replace PEx Primary or any control-plane process.

## Purpose

Keep a trustworthy browser-native product:

- Capture (Dream / Experience / Sensation)
- Local audio + text journal
- Chronological journal with delete
- Manual ZIP export
- Days 1–60 routes, eight phases, Today resume, explicit complete/undo
- Local content packet renderer (canonical packet when present; otherwise marked development fixtures)
- Method, About, evidence/safety/source copy
- PWA install + offline-after-load, including hashed app-shell + bundled day renderer
- Honest storage-persistence reporting
- Soft Instrument presentation (warm light default, optional bedtime mode)
- Accessibility baseline

CloudDev must not invent canonical curriculum. `src/content/canonical.ts` stays `null` until the Primary-transported packet is integrated. Fixture copy is labeled `DEVELOPMENT FIXTURE` and is not eligible for Complete Product acceptance.

## Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | Typed domain/storage boundary |
| Bundler | Vite | Small SPA, hashed assets |
| UI | Semantic HTML + plain CSS | No component framework required |
| Routing | `location.hash` (`#/today`, `#/day/n`, `#/phase/id`, …) | Works from static hosting and `index.html` fallback |
| Content | Bundled TypeScript packet | Offline after a successful load; no lesson API |
| Storage | IndexedDB (`pex-local`) | Journal, blobs, progress, settings |
| Audio | `MediaRecorder` + `getUserMedia` | On-device only |
| Export | Store-only ZIP (no compression lib) | Multi-file recovery without a paid service |
| PWA | Web App Manifest + generated `sw.js` | Install + application-shell cache |

There is no backend, no analytics, no cookies, and no account system.

## Local development, build, tests

See the root README. Commands:

- `npm install`
- `npm run dev` — development server, **no service worker**
- `npm run build` — icons + typecheck + production bundle + `dist/sw.js`
- `npm run preview` — production preview (service worker registers)
- `npm test` — Vitest (jsdom + fake-indexeddb)
- `npm run typecheck`
- `npm run lint`

## IndexedDB schema

- Database name: `pex-local`
- IndexedDB version: `1`
- App/schema constants: `APP_VERSION` (`0.2.0`), `SCHEMA_VERSION` (`1`)

### Object stores

**entries** (keyPath `id`)

| Field | Type | Notes |
| --- | --- | --- |
| id | string | `entry-` + UUID |
| type | `"dream" \| "experience" \| "sensation"` | Organizational label |
| createdAt | number | epoch ms |
| updatedAt | number | epoch ms |
| note | string | May be empty if audio exists |
| audioId | string \| null | FK to `media.id` |
| audioMimeType | string \| null | Recorded MIME |
| audioByteLength | number \| null | Size in bytes |

Indexes: `createdAt`, `type`.

**media** (keyPath `id`)

| Field | Type |
| --- | --- |
| id | string |
| entryId | string |
| mimeType | string |
| blob | Blob |
| byteLength | number |
| createdAt | number |

Index: `entryId` (unique).

**progress** (keyPath `day`)

| Field | Type | Notes |
| --- | --- | --- |
| day | 1–60 | |
| unlocked | always `true` | |
| visitedAt | number \| null | Opening a day is not completion |
| completedAt | number \| null | Set only by Complete Day; cleared by undo |

No streaks. No lock flags. Scroll depth is not stored.

**settings** (keyPath `key`)

- `schema` — `{ schemaVersion, appVersion, createdAt }`
- `persistenceReport` — last actual persistence probe (`{ key, value }`)
- `resumeDay` — last opened day number so `#/today` can resume. If that day is complete, Today uses the first incomplete day.

Writes that create an entry plus audio use one `readwrite` transaction. The UI does not show a successful save until that transaction completes. Failed writes surface an error; the in-memory draft remains so it is not silently discarded.

## Audio-format strategy

Capability-driven. Candidates, in order:

1. `audio/webm;codecs=opus`
2. `audio/webm`
3. `audio/mp4`
4. `audio/ogg;codecs=opus`
5. `audio/ogg`

`MediaRecorder.isTypeSupported` selects the first match. If none match, recording is refused and text capture remains available.

Microphone permission is requested only inside the Record action (`getUserMedia`). Denial is mapped to a non-looping error. Stop/interrupt (track `ended`, recorder error) is handled; empty interrupted recordings are not auto-saved.

**Microphone lifecycle:** Save is disabled while a recording is starting or active. Save during recording does not complete and does not drop the live stream. Leaving Capture, a successful save after Stop, reset, timeout, recorder error, and explicit `release()` all stop the recorder and every acquired media track. A `getUserMedia()` result that arrives after timeout or abandon is stopped immediately.

## PWA / offline boundary

- Manifest: `/manifest.webmanifest`
- Icons: original neutral mark (circle + stem), SVG + 192/512 PNG
- Service worker: generated at **production build** into `dist/sw.js`
- Precaches the built application shell (HTML, hashed assets, manifest, icons)
- Navigation: network first, fallback to cached `index.html`
- Other same-origin GET: cache, then network, then cache
- Dev server does **not** register the worker

**Actual offline boundary:** a visit that never successfully loaded and cached the shell will not work offline. After a successful production load (preview/build hosting), reload without network should serve the shell. IndexedDB data is independent of the Cache Storage shell. Journal entries are not stored in the service worker cache.

Update behavior: a new build uses a new cache name; old caches are deleted on activate. If a controller already exists, the UI can show “App update ready”.

## Privacy architecture

Private journal material (text, audio blobs) is written only to IndexedDB and, on explicit export, to a user-download ZIP via `blob:` URLs.

The app does not:

- send journal contents to a URL, query string, or API
- include analytics, ads, or trackers
- attach journal contents to the service worker
- use Google identity, Drive, or Docs

Static asset requests (JS/CSS/HTML/icons/manifest/sw) during load are not journal-content transmission.

Inspection method and limits are recorded in the “Tested facts / limitations” section of the pull request return packet and should be updated when a network capture is performed.

## Export format

Deterministic **store-only ZIP** (compression method 0), filename `pex-journal-<ISO-stamp>.zip`.

```
manifest.json
journal.json
recordings/<entryId>.<ext>
```

`manifest.json`:

- `format`: `pex-journal-export`
- `formatVersion`: `1`
- `appVersion`, `schemaVersion`, `exportedAt`
- `entryCount`, `recordingCount`, `files`

`journal.json` lists each entry’s type, timestamps, note, and optional `{ file, mimeType, byteLength }`.

This is a manual recovery file, not a cloud backup.

## Bedtime mode

Default: warm light (`data-theme` omitted / `light`). Optional bedtime mode persisted in `localStorage` key `pex-theme`. `prefers-reduced-motion` and `prefers-contrast: more` are respected in CSS. Missing `localStorage` (some private modes) still applies the in-memory theme.

Day screens are typography-led continuous surfaces. Primary navigation on narrow viewports is a fixed bottom bar: Today, Capture, Journal, Days. Capture remains reachable in one action from Home and from that bar.

## Accessibility baseline

Semantic landmarks, skip link, labeled controls, visible `:focus-visible`, 44px-class tap targets, type labels in text (not color-only), reduced-motion, fluid layout for ordinary mobile widths. Zoom and contrast should be re-checked in a real browser.

## Known browser limitations (engineering, not marketing)

- **Persistent storage:** `navigator.storage.persist()` may no-op, prompt, or return false until site engagement or install. The UI reports the **actual** boolean and never claims a grant that did not happen.
- **IndexedDB / private browsing:** some modes allow IDB with aggressive eviction; others throw. Failures must be visible.
- **Quota:** `QuotaExceededError` is classified and shown. Synthetic OS-level disk-full is not always injectable.
- **Microphone:** permission is sticky at the browser level; the app does not re-prompt except when the user taps Record. Headless/CI environments usually have no device.
- **MIME types:** iOS Safari historically prefers `audio/mp4`; Chromium prefers webm/opus. Selection is probed, not assumed.
- **Incognito:** storage may be discarded when the last context closes. Export remains the recovery path.
- **Offline:** first visit is not offline-capable. `file://` is unsupported.
- **Installability:** Chromium install criteria include manifest icons, SW, HTTPS (or localhost). This environment may not equal real Android/iPhone install UI.

## Rollback / recovery

- Git branch + pull request; do not rewrite shared history.
- User data recovery in this phase: **manual export**.
- Schema changes later should bump `DB_VERSION` with an `onupgradeneeded` migration; this pass is version 1 only.
- Service worker rollback: deploy previous `dist` so a new cache name replaces a bad shell. IndexedDB is not wiped by SW updates.

## Dependencies

Runtime dependencies: **none**.

Development dependencies (Vite, TypeScript, Vitest, jsdom, fake-indexeddb, ESLint) are local toolchain only. No paid or recurring service.

## Tested facts vs limitations (this worker pass)

Recorded separately from product claims after the complete-product-surface implementation. Environment notes belong on the pull request.

### Core engineering invariants retained

Capture, journal, export, microphone lifecycle, persist reporting, and no-journal-network behavior remain as specified in the accepted Core Engineering baseline.

## Out of scope (stop conditions honored)

Inventing canonical Days 1–60, health/sleep treatment advice, Google services, AI, astronomy, donations, payments, analytics, backends, remote sync, public DNS/deployment, tester communications.
