# PEx Core Engineering

Status of this document: engineering notes for the local-first foundation. It does not replace PEx Primary or any control-plane process.

## Purpose

Prove a trustworthy browser-native foundation:

- Capture (Dream / Experience / Sensation)
- Local audio + text journal
- Chronological journal with delete
- Manual ZIP export
- Days 1–60 progress storage (placeholders, all unlocked)
- PWA install + offline-after-load
- Honest storage-persistence reporting
- Warm light + bedtime mode
- Accessibility baseline

Canonical curriculum text is intentionally absent.

## Architecture

| Layer | Choice | Why |
| --- | --- | --- |
| Language | TypeScript | Typed domain/storage boundary |
| Bundler | Vite | Small SPA, hashed assets |
| UI | Semantic HTML + plain CSS | No component framework required |
| Routing | `location.hash` | Works from static hosting and `index.html` fallback |
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
- App/schema constants: `APP_VERSION` (`0.1.0`), `SCHEMA_VERSION` (`1`)

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

| Field | Type |
| --- | --- |
| day | 1–60 |
| unlocked | always `true` |
| visitedAt | number \| null |

No streaks. No lock flags.

**settings** (keyPath `key`)

- `schema` — `{ schemaVersion, appVersion, createdAt }`
- `persistenceReport` — last actual persistence probe (`{ key, value }`)

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

Recorded separately from product claims. Environment: Chromium in a cloud VM, viewport ~390×844, `npm run preview` at `http://127.0.0.1:4173/`. Not a real Android/iPhone device.

### Tested

- Typecheck, ESLint, Vitest (25), production build.
- Home → Capture in one click; Dream / Experience / Sensation present.
- Text-only save shows success only after IndexedDB; journal list/edit/delete with confirmation.
- Persistence probe reported **`persist granted (actual): false`** and the UI did not claim a grant.
- Local-only / not cloud-backed-up copy is visible on Data.
- Bedtime mode toggles and persists in `localStorage`.
- Days 1–60 listed as available/unlocked; Day 1 is placeholder-only.
- Manual export downloaded `pex-journal-*.zip` containing `manifest.json` + `journal.json` (text-only sample; 1 entry, 0 recordings).
- DevTools Network during journal save: requests were same-origin static assets to `127.0.0.1` only; no journal POST to an external host (inspection limited to Chromium Network panel in this VM).
- Service worker activated on the production preview; DevTools offline checkbox still allowed in-app navigation after the shell had loaded.
- After a second production preview deploy, the UI showed **App update ready** / Reload for update.
- Record with no capture device: **No microphone was found. Text capture still works.** Text save still succeeded.

### Not verified / limited

- **Live microphone record → stop → replay** was not completed: this VM did not surface a usable mic permission prompt or recording blob. Automated tests cover MIME selection, permission-denied mapping, hung `getUserMedia` timeout, and blob save/replay via fake-indexeddb.
- Quota-exceeded at the OS disk layer was not injected; `QuotaExceededError` classification is unit-tested.
- Private/incognito eviction was characterized from known browser behavior, not by running a separate incognito profile in this pass.
- Service worker *update* across two deploys: **App update ready** was shown; a full skipWaiting/reload cycle was not separately timed beyond that banner.
- First-ever visit without a completed load is **not** claimed offline.

Use export as the recovery path. This is not production verification.

## Out of scope (stop conditions honored)

Canonical Days 1–60, health/sleep advice, Google services, AI, astronomy, donations, payments, analytics, backends, remote sync, public DNS/deployment, tester communications.
