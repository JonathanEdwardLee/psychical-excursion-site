# Local execution receipt (Jonathan laptop)

Operator machine pass on **2026-09-25**. Repo baseline: `a8dc3b45e4764d5a3f7bb5246b808179eb2bd0f9` (merged PR #93). CloudDev Voice Lab scaffolding was **not** rebuilt; this pass only ran the documented npm scripts and hardware gates.

## Machine inventory

| Signal | Measured value |
| --- | --- |
| OS | Windows 11 Home, build 26200 |
| CPU | AMD Ryzen 5 5500U, 6 cores / 12 logical |
| RAM (total) | 15.3 GB |
| RAM (free at gate) | ~2.0 GB |
| GPU | AMD Radeon integrated; **no** NVIDIA (`nvidia-smi` absent) |
| Python | 3.12.3 |
| FFmpeg | 2024-03-07 gyan.dev full build (GPL) |
| Disk C: free | ~10.8–11.1 GB |

Canonical JSON: `HARDWARE-RECEIPT.json` (refreshed by `npm run voice-lab:hardware` on this machine).

## Chatterbox license re-proof (before any weights)

Re-fetched **2026-09-25** from official sources (no weights downloaded on this pass).

| Artifact | Source | License / claim |
| --- | --- | --- |
| Wrapper | [resemble-ai/chatterbox `LICENSE`](https://github.com/resemble-ai/chatterbox/blob/master/LICENSE) | **MIT**, Copyright (c) 2025 Resemble AI |
| Weights (nano) | [Hugging Face `ResembleAI/chatterbox-nano`](https://huggingface.co/ResembleAI/chatterbox-nano) API `cardData.license` | **mit** |
| Weights (family) | [Hugging Face `ResembleAI/chatterbox`](https://huggingface.co/ResembleAI/chatterbox) API `cardData.license` | **mit** |

**Smallest commercially safe variant for this product:** `ResembleAI/chatterbox-nano` (~110M English CPU path). XTTS, F5-TTS, and Fish Speech were **not** considered.

## Chatterbox install / clone — **stopped (gate refused)**

`scripts/voice-lab/hardware.mjs` gate on this laptop:

- `install`: **refused**
- `chatterbox_variant`: **none**
- Trigger: **free RAM &lt; 8 GB** at inspection (2 GB free) with no NVIDIA GPU. Torch + ~3 GB nano checkpoint on **~11 GB** free disk was judged unsafe without closing other workloads.

Additional blockers even if RAM were freed:

- No founder reference at `local/voice-lab/reference/jonathan.wav` (gitignored; not committed).
- Repo adapter (`chatterbox.mjs`) intentionally does **not** pip-install Torch or download weights in CI; operator opt-in is `VOICE_LAB_CHATTERBOX_INSTALL=1` only after the hardware gate passes.

**Result:** No Chatterbox weights installed, no local clone audio, no cloud upload of reference audio.

See `CHATTERBOX-GATE.json`.

## Chapter 10 excerpt (bounded)

- Generated via `npm run voice-lab:excerpt` → `EXCERPT.md`
- **607 words**, sha256 `2eb7f0d978ab0630d04019c2c4364638106cc8ddda30d79dc3180bff5480d71f`
- Dry-run manifest: `npm run voice-lab:pilot` → `GENERATION-MANIFEST.json`

## OpenAI Cedar (`gpt-4o-mini-tts`, voice `cedar`)

| Item | Value |
| --- | --- |
| `OPENAI_API_KEY` | Valid in operator shell; **not** written to git or `config.json` |
| Cost ceiling | **$1** (`VOICE_LAB_COST_CEILING_USD=1`) |
| Conservative excerpt estimate | **$0.0819** (607 words, 35% buffer; see manifest) |
| Execute | `VOICE_LAB_EXECUTE=1 npm run voice-lab:cedar` after **$5** prepaid credit added (2026-09-25) |
| API requests | **3** chunks (char lengths 1672, 1647, 634) |
| Raw outputs (gitignored) | `local/voice-lab/cedar/cedar-chunk-01..03.wav` (~10.7 MB total) |
| Concatenated duration | **223.0 s** (~3m 43s) @ 24 kHz mono |
| Planning spend (not a bill) | ~223/60 × $0.015 ≈ **$0.056** audio-output rule-of-thumb |
| Under ceiling? | **Yes** (estimate and duration both well under $1) |

Earlier attempts on this laptop: HTTP **401** (stale key in another shell), then **429** `credit_balance_exhausted` until billing credit was added.

Receipt copy (no secrets): `local/voice-lab/cedar/cedar-receipt.json`.

## FFmpeg normalized comparison

Produced (gitignored):

| File | Purpose |
| --- | --- |
| `local/voice-lab/compare/cedar-excerpt-raw.wav` | Concat of 3 Cedar chunks |
| `local/voice-lab/compare/cedar-excerpt-normalized.wav` | `loudnorm=I=-16:TP=-1.5:LRA=11`, 44.1 kHz |

No Chatterbox WAV to pair yet (hardware gate refused; no reference clip).

## Founder listen / QC (Cedar pilot)

| Field | Value |
| --- | --- |
| Date | 2026-09-25 |
| Approved asset | `local/voice-lab/compare/cedar-excerpt-normalized.wav` |
| Model / voice | OpenAI `gpt-4o-mini-tts`, voice **cedar** |
| Founder decision | **Approved** for Chapter 10 pilot quality (“sounds good”) |
| Scope | Pilot excerpt only; **not** authorization to generate or sell the full audiobook in this pass |

## Voice Lab UI

Loopback server: `npm run voice-lab:serve` → http://127.0.0.1:4177/  
Load generated WAVs from `local/voice-lab/` into the blind A/B form; scores stay in browser `localStorage`.

## Full-book extrapolation (estimate only)

From `GENERATION-MANIFEST.json` / `ECONOMICS.md` (63,509 narration words):

| Path | Conservative API cash | Notes |
| --- | --- | --- |
| Cedar one pass | ~**$8.57** | 150 wpm, $0.015/min × 1.35 buffer |
| Cedar + 25% QC/regen allowance | ~**$10.71** | Not a quote |
| Local Chatterbox clone | **$0** API | Generation time, disk, electricity, and founder QC **unmeasured** here (weights not installed) |

## Artifacts & scope

- **Committed in PR:** receipts, manifests, excerpt text, hardware gate JSON only.
- **Local only (gitignored):** `local/voice-lab/config.json`, reference WAV, any future WAV/MP3, API receipts with paths.

## Operator follow-ups (not automated)

1. Export a **valid** `OPENAI_API_KEY` in the shell, then re-run Cedar with `VOICE_LAB_EXECUTE=1` and ceiling `1`.
2. To retry Chatterbox-Nano: free **≥8 GB RAM**, confirm **≥15 GB** disk headroom for Torch + checkpoint, record `local/voice-lab/reference/jonathan.wav`, then `VOICE_LAB_CHATTERBOX_INSTALL=1` per README.
