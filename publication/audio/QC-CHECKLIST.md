# Full Cedar audiobook — QC checklist

## Automated (generator)

- [ ] All 29 tracks in `TRACK-MANIFEST.json` have delivery MP3s
- [ ] No zero-byte WAV/MP3 under `local/voice-lab/full-book/`
- [ ] Per-track receipts include `script_sha256` and `spoken_sha256`
- [ ] `PRODUCTION-LEDGER.json` conservative total ≤ **$15**
- [ ] `AUDIOBOOK-PRODUCTION-RECEIPT.json` synced (no API keys)

## Operator listening (minimum)

- [ ] Opening credits
- [ ] First 2–3 minutes of every chapter
- [ ] Every chapter ending
- [ ] Tracks with pronunciation flags in manifest
- [ ] Exercise / sleep-onset sections
- [ ] Closing credits
- [ ] Any regenerated chunk

## Package

- [ ] `Psychical-Excursion-Audiobook-v1.zip` built
- [ ] `AI-NARRATION-DISCLOSURE.txt` present and accurate
- [ ] `AUDIOBOOK-PACKAGE-MANIFEST.json` hashes recorded
