# Psychical Excursion

**Psychical Excursion (PEx)** is a free, local-first 60-day practice guide for dream recall, lucid dreaming, body-sensory attention, sleep-edge awareness, and OBE-style experiences.

The project is designed to be useful without requiring a spiritual belief system or making claims that consciousness literally leaves the body. The emphasis is on practical exercises, careful observation, privacy, and letting users interpret unusual experiences for themselves.

## Project goals

- Free access with no ads or paywall
- No account required
- All 60 days available
- Local-first journal and progress
- Optional local audio capture
- Installable PWA
- Useful offline behavior
- Mobile-first responsive design
- Accessible, calm, low-friction interaction
- No private journal content sent to a server

## Design direction

PEx follows a **Soft Instrument** visual direction: warm, quiet, typography-led, and subtly strange without falling into generic mystical or wellness aesthetics.

The interface should feel finished, focused, and easy to use—especially at night and on a phone.

## Technical direction

The initial implementation favors a small browser-native stack:

- TypeScript
- Vite
- semantic HTML
- plain CSS
- IndexedDB
- MediaRecorder
- Web App Manifest
- Service Worker

Additional dependencies should earn their maintenance cost.

## Privacy

The Phase 1 architecture is local-first. Journal text, recordings, and progress are intended to remain on the user's device.

Browser storage is not guaranteed permanent, so the product will provide clear storage status and a manual export path rather than pretending local data is automatically backed up.

## Status

Early development.

The first engineering milestone is the local PWA foundation: storage, capture, journal, export, progress, offline behavior, and accessibility before the complete 60-day experience is integrated.

## About

Psychical Excursion is created by Jonathan Edward Lee as a free public project and developer portfolio piece.

Website design and development: [Hoopsnake Designs](https://hoopsnakedesigns.com/)
