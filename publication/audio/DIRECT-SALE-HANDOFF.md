# Direct-sale handoff (corrected package complete — checkout not activated)

**Production completed:** 2026-09-25 (operator laptop).  
**Correction pass completed:** 2026-09-25 (4 tracks regenerated, 25 reused).  
**Work order:** `docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md`  
**Voice:** OpenAI `gpt-4o-mini-tts`, **cedar**

## Package (local, gitignored)

| Field | Value |
| --- | --- |
| Path | `local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip` |
| SHA-256 | `d612ae97e3e6847a1c951ded371c8b61128a19427bbe63fbe5956b4dac95d4ca` |
| Size | **542,919,884 bytes** (~518 MB) |
| MP3 tracks | **29** (00–28 sortable prefixes) |
| Measured runtime | **~6h 36m** (23,770.4 s summed from mastered WAV receipts) |
| Per-file hashes | `publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json` |
| Chapter 1 section pause | **1.75 s** silence after “The Excursion” (verified in assembly) |

## Production economics (ledger)

| Metric | Value |
| --- | --- |
| API requests (total) | **269** |
| Correction pass additional requests | **12** |
| Conservative planning total | **$8.538** (under **$15** ceiling) |
| Correction pass additional (conservative) | **$0.3298** |
| Rule-of-thumb audio spend | ~396 min × $0.015/min ≈ **$5.94** (not a billed export) |
| Founder QC time | Not measured |

## AI disclosure (buyer-facing)

Use `AI-NARRATION-DISCLOSURE.txt` inside the zip. Summary:

- Narration is **AI-generated** (OpenAI Cedar).
- Written by **Jonathan Lee**.
- **Not** a recording of Jonathan's natural voice.
- **Not** positioned for Audible/ACX.

## Product SKUs (next pass)

- Audiobook-only download (this zip)
- Optional later: ebook-only, audiobook+ebook bundle

## Next pass (not in production PR)

- Upload zip to **private** authenticated storage (not git)
- Stripe product + payment link + post-purchase delivery
- Homepage **Read** placement, refund/support copy
- GA4 pathname events only (no PII, no audio payloads)

**Do not merge production PR until founder accepts package QC.**
