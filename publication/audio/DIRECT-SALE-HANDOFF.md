# Direct-sale handoff

**Production completed:** 2026-09-25 (operator laptop).  
**Ch1/Ch4 pacing pass completed:** 2026-09-26 — Chapter 1 section-heading silence + Chapter 4 accepted rewrite; **27-track** listening edition (no `00a`/`00b`).  
**Branch / PR:** `primary/pex-audiobook-ch1-ch4-pacing-20260925` — [PR #96](https://github.com/JonathanEdwardLee/psychical-excursion-site/pull/96) (not merged).  
**Work order:** `docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md`  
**Voice:** OpenAI `gpt-4o-mini-tts`, **cedar**

## Package (local, gitignored)

| Field | Value |
| --- | --- |
| Path | `local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip` |
| Status | **Current** — founder QC on LaptopDev |
| SHA-256 | `9678a911c9c140c94db1ed85fb095b2f853a471dba7c1379bb31689c45ce373e` |
| Size | **534,513,171 bytes** (~510 MB) |
| MP3 tracks | **27** + README + AI disclosure + source notes |
| Measured total runtime | **23,509.25 s** (~391.8 min) |
| Per-file hashes | `publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json` |
| Prior 29-track package (superseded) | SHA `d612ae97…`, 542,919,884 bytes — retained in manifest history if present |

### Chapter 1 section pauses (deterministic assembly)

| Target | ms |
| --- | ---: |
| Before each spoken section title | 1250 |
| After each title (except Excursion) | 1750 |
| After “The Excursion” | 1250 |
| Section pause before “Robert Anton Wilson…” | 1750 |

Full log: `publication/audio/AUDIOBOOK-QC-CH1-CH4-20260925.json`

**Future sample (handoff only):** founder wants **Chapter 1 playable free on the website** as an audiobook sample — not implemented in this pass.

## Production economics (ledger)

| Metric | Value |
| --- | --- |
| API requests (cumulative) | **296** |
| Ch1/Ch4 pass additional requests | **27** |
| Conservative planning total | **$8.4092** (under **$15** ceiling) |
| Ch1/Ch4 pass additional (conservative) | **$0.5328** |
| Rule-of-thumb audio spend | ~392 min × $0.015/min ≈ **$5.88** (not a billed export) |
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
