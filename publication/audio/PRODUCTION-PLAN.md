# Audiobook production plan

Publication Master baseline: `c08aa9c5265af96d7c7f8b38a1cd11a38653e858`  
Web Edition baseline (unchanged): `c969ebb5650e4f854b3d1a1284458a818eb71cfb`

This pass is **scripts + plan only**. No audio, accounts, or spend.

## Architecture

Canonical prose stays in `publication/chapters/*.md` (inline `[n]` and `## References` remain).

`scripts/generate-session-scripts.mjs` renders `publication/audio/session-scripts/` plus `publication/audio/TRACK-MANIFEST.json`.

HTML comments are removable production cues. Regenerating the scripts is the only allowed way to update them.

## Recommended pilot

**Chapter 10 — Watch the Edge** (`PEX-AUDIO-10-watch-the-edge`).

Why not chapter 01: the introduction is definitional and citation-heavy; it does not fully test exercise pacing or sleep-onset practice.

Chapter 10 is mid-length (~2,776 publication narration words; about 17–21 minutes at 135–165 wpm). It includes research prose (EEG, N1, sleep-onset reviews), Jonathan’s observational voice and dry humor (“Let yourself fall asleep.”), technical terms (hypnagogia, EEG, REM/NREM), and a real attention experiment without turning into a meditation app.

The pilot must not be recorded in this pass.

## Recommended default narrator path (reversible)

**Jonathan records the one-chapter pilot himself.**

Reasons: no cash outlay; commercial reuse rights are obvious; pronunciation can be corrected on the next take; the authorial voice is the product. If the pilot is too slow or the room is unusable, stop. A hired human narrator remains available for later chapters. Licensed synthetic narration is a separate, non-ACX-default path (see below).

Do not clone Jonathan’s voice unless he later authorizes it in a new work order.

## Narrator paths (no purchase, no contact)

### 1. Jonathan narrates

- Authenticity: high; humor and caution survive.
- Burden: quiet room, consistent mic distance, editing. Inexperienced nonfiction often costs **four to eight hours of work per finished hour**.
- Full-book founder time at ~6.5–8 finished hours: **on the order of 30–60 hours**, unknown until the pilot; unknown is not zero.
- Corrections: re-take the sentence; update the session script if a cue was wrong, not the chapter prose.
- Rights: his performance.
- **ACX/Audible:** a human performance is the currently compatible path. ACX’s official audio submission requirements (effective 15 Apr 2026) require human narration unless Audible/ACX explicitly authorizes another workflow for that title.

### 2. Licensed synthetic narration

Vendor license and retailer acceptance are **not the same thing**.

- **Vendor commercial license (separate):** ElevenLabs documents commercial use on paid plans and noncommercial-only use on the free plan (terms and billing docs, retrieved 2026-09-25). Re-read the live terms before any signup. **No voice cloning** in this recommendation. Cost model (illustrative, not a quote): on the order of **one credit per character** for TTS; ~63,500 narration words is hundreds of thousands of characters, i.e. a **Creator/Pro monthly credit tier**, not the free tier. Recurring if you regenerate. Editing: regenerate a sentence, then re-level the chapter.
- **ACX/Audible (current planning, Apr 15 2026 rules):** submitted audiobooks must be **narrated by a human unless otherwise authorized**. Unauthorized TTS, AI, or other automated recordings are **prohibited**. Do not treat ACX as a retailer that merely “may label” AI audio. **Do not assume** an ElevenLabs (or similar) file is ACX-eligible. Synthetic remains a separate path for YouTube/podcast or other outlets only if those outlets allow it, and for ACX only if Audible/ACX later explicitly authorizes that title/workflow.
- Other retailers may have their own AI-disclosure rules. Founder decision; no signup in this pass.

### 3. Human narrator

- Quality ceiling can be high; authorial asides may flatten.
- Money: non-union per-finished-hour quotes commonly land around **low hundreds of USD per finished hour**; union/SAG-AFTRA work is higher. A ~7-hour book is **roughly $1,500–$4,000+** before pickup fees — ranges, not bids.
- Time: casting, direction, pickups, contracts.
- Rights: contract must cover **audiobook + YouTube + podcast** explicitly. Do not hire or email talent in this pass.
- **ACX/Audible:** a contracted human narrator is compatible with the current human-narration requirement, subject to the usual technical specs.

## Runtime range (planning only, not a promise)

Publication narration words (23 chapters, references omitted): **63,509**.

| Rate | Chapter-only duration |
| --- | --- |
| 135 wpm | ~471 min (~7 h 51 m) |
| 150 wpm | ~423 min (~7 h 3 m) |
| 165 wpm | ~385 min (~6 h 25 m) |

Credits and short front/back matter add a few minutes. Longest chapter: **21 Floating in Space** (~4,615 words; ~28–34 min). Shortest: **02 Remember Your Dreams** (~1,588 words; ~10–12 min). No chapter approaches ACX/Spotify’s 120-minute file cap.

**Session splits:** default one chapter = one final track. Optional internal recording segments only for menu **21** if live recording fatigue appears; still bounce one `PEX-AUDIO-21-…` master.

## Mastering: archive vs delivery

Sources checked 2026-09-25: ACX production/help articles (44.1 kHz; MP3 ≥192 kbps CBR; RMS −23 to −18 dB; peak ≤ −3 dB; noise floor ≤ −60 dB RMS; ≤120 min / 170 MB; opening + closing credits; 1–5 min retail sample; consistent mono **or** stereo); Spotify for Authors / Findaway 2024 asset guide (MP3 192+ CBR 44.1 kHz 16-bit preferred; WAV 44.1 kHz 16-bit; RMS **−24 to −14 dB**; noise < −60 dB; 0.5–1 s head / 1–5 s tail); Apple Books Audiobooks Specification 5.3.5 (WAV/CAF/ALAC/AAC/FLAC/MP3; partner delivery, not a self-serve ACX clone).

### Archive / production master (keep)

- 44.1 kHz, 24-bit PCM WAV (mono unless a future stereo room is deliberately chosen)
- Peak ceiling about −3.5 dB while mixing; do not clip
- 0.5–1 s room tone at head, 1–5 s at tail on each file
- No brickwall streaming loudness that later fails ACX RMS

### Platform delivery derivatives (convert later)

- **ACX/Audible:** 44.1 kHz MP3, 192 kbps or higher CBR, all-mono or all-stereo, RMS −23 to −18 dB, peak ≤ −3 dB, noise ≤ −60 dB
- **Spotify for Authors / Findaway:** same family; their RMS window is slightly wider (−24 to −14 dB). Stay inside the **overlap** with ACX (−23 to −18) so one master can feed both
- **Apple Books:** deliver through a preferred partner; keep a WAV/ALAC copy from the archive
- **YouTube/podcast:** AAC or high-CBR MP3 from the same WAV; 44.1 or 48 kHz; do not change chapter performance

### Metadata (when a real release exists)

Title, author, narrator, track titles matching `TRACK-MANIFEST.json` `output_basename`, language English. Publisher/ISBN remain blank until assigned.

## File naming

Sortable: `PEX-AUDIO-00-opening-credits.wav` … `PEX-AUDIO-10-watch-the-edge.wav` … `PEX-AUDIO-99-closing-credits.wav`.

## Cost / founder time (rough)

| Path | One-time cash | Recurring | Founder time | Outsourcing |
| --- | --- | --- | --- | --- |
| Jonathan, one-chapter pilot | $0 if existing mic/room; unknown if hardware is needed | $0 | several hours including edits | $0 |
| Jonathan, full book | same hardware question | $0 | tens of hours | optional editor |
| Licensed TTS, full book | $0 this pass; later a paid monthly credit tier | monthly if regenerating | listen/QC hours | $0 hire |
| Human narrator, full book | typically thousands USD PFH | pickups | direction/QC | narrator + possibly studio |

## Pronunciation

See `PRONUNCIATION.md`. **Founder confirmation still required** for **Tenzin Wangyal Rinpoche** and **Stephen LaBerge** before locking a full-book performance. Standard English forms are listed; they are not a substitute for those two proper names.

## Founder decisions before any audio generation

1. Approve Chapter 10 as the pilot (or name another).
2. Approve Jonathan as pilot narrator (or choose TTS/human instead).
3. Confirm Rinpoche and LaBerge pronunciations.
4. Treat ACX retail as **human narration only** unless Audible/ACX later explicitly authorizes a synthetic workflow for this title.
5. Hardware/room check if Jonathan records.

No audio generation is authorized until a later work order.
