# Direct-sale handoff (package complete — checkout not activated)

**Production completed:** 2026-09-25 (operator laptop).  
**Work order:** `docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md`  
**Voice:** OpenAI `gpt-4o-mini-tts`, **cedar**

## Package (local, gitignored)

| Field | Value |
| --- | --- |
| Path | `local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip` |
| SHA-256 | `e5ef4837d57752eeb384b16c36db40fa156a37ccf7f5a9bbca337a922912941c` |
| Size | **543,898,279 bytes** (~519 MB) |
| MP3 tracks | **29** (00–28 sortable prefixes) |
| Measured runtime | **~6h 37m** (23,820 s summed from mastered WAV receipts) |
| Per-file hashes | `publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json` |

## Production economics (ledger)

| Metric | Value |
| --- | --- |
| API requests | **257** |
| Conservative planning total | **$8.5492** (under **$15** ceiling) |
| Rule-of-thumb audio spend | ~397 min × $0.015/min ≈ **$5.96** (not a billed export) |
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
