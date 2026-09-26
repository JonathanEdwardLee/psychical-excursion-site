# Direct-sale handoff

**Listening edition (sellable):** opening intro + **chapters 01–23** = **24 MP3s** (no back matter, no closing credits).  
**Ch1/Ch4 audio:** founder-approved on PR #96 (no further Cedar regen).  
**24-track repackage:** 2026-09-26 — metadata + ZIP rebuild only (`audio_regenerated: false`).  
**Branch / PR:** `primary/pex-audiobook-ch1-ch4-pacing-20260925` — [PR #96](https://github.com/JonathanEdwardLee/psychical-excursion-site/pull/96) (not merged).  
**Work order:** `docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md`  
**Voice:** OpenAI `gpt-4o-mini-tts`, **cedar**

## Package (local, gitignored)

| Field | Value |
| --- | --- |
| Path | `local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip` |
| Edition | **listening-24** |
| SHA-256 | See `publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json` (`zip_sha256`) |
| MP3 tracks | **24** + README + AI disclosure + source notes |
| Measured total runtime | See `AUDIOBOOK-PRODUCTION-RECEIPT.json` (`total_duration_seconds_measured`) |
| Per-file hashes | `publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json` |
| QC | `publication/audio/AUDIOBOOK-QC-LISTENING-24-20260926.json` |

### Omitted from listening / direct-sale package (permanent)

- `PEX-AUDIO-00a-evidence-and-belief`
- `PEX-AUDIO-00b-sleep-and-safety`
- `PEX-AUDIO-24-about-the-author`
- `PEX-AUDIO-25-continue-the-experiment`
- `PEX-AUDIO-99-closing-credits`

Historical 27-track package metadata is under `superseded_packages` in the package manifest / production receipt.

### Chapter 1 section pauses (unchanged)

1250 ms before each section title; 1750 ms after (1250 ms after “The Excursion” + 1750 ms before Wilson). See `AUDIOBOOK-QC-CH1-CH4-20260925.json` (historical Ch1/Ch4 pass).

**Future sample (handoff only):** Chapter 1 free on the website — not implemented.

## Production economics (ledger)

Cumulative Cedar API usage unchanged by repackage. See `AUDIOBOOK-PRODUCTION-RECEIPT.json` (`api_request_count`, `conservative_usd_estimated`).

## AI disclosure (buyer-facing)

Use `AI-NARRATION-DISCLOSURE.txt` inside the zip.

## Next pass (not in production PR)

- Private storage upload (not git)
- Stripe + delivery
- Homepage sample player
- GA4 pathname events only

**Do not merge until founder accepts package QC.**
