# Direct-sale handoff (after package acceptance)

**Status:** Production in progress. Fill measured fields when `npm run audiobook:package` completes.

## Package (local, gitignored)

| Field | Value |
| --- | --- |
| Filename | `local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip` |
| SHA-256 | _(see `AUDIOBOOK-PACKAGE-MANIFEST.json`)_ |
| Size bytes | _(see manifest)_ |
| Track count | 29 |
| Runtime | _(sum delivery durations)_ |

## AI disclosure (buyer-facing)

Narration is **AI-generated** using OpenAI text-to-speech (voice Cedar). Written by Jonathan Lee. This is **not** a recording of Jonathan's natural voice. Not positioned for Audible/ACX.

## Product SKUs (next pass)

- Audiobook-only download
- Optional later: ebook-only, audiobook+ebook bundle
- **Do not** activate Stripe in the production pass

## Next pass requirements

- Host zip on authenticated storage (not public git)
- Stripe product + payment link + post-purchase delivery
- Homepage **Read** placement and refund/support policy
- GA4 pathname events only (no PII, no audio payloads)
