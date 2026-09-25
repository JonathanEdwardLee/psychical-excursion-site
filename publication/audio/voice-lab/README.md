# Voice Lab

Local comparison of **OpenAI Cedar** vs a **commercially gated Jonathan Chatterbox clone** for Chapter 10. Direct-sale-first strategy. ACX human-narration path remains for a later edition.

## Operator steps (laptop)

1. Copy `publication/audio/voice-lab/config.example.json` to `local/voice-lab/config.json` (gitignored).
2. Export `OPENAI_API_KEY` in the shell. Never put it in git.
3. Optionally place `local/voice-lab/reference/jonathan.wav` (clean, dry, 10–30 s, 44.1 kHz, founder-owned, gitignored).
4. `npm run voice-lab:excerpt && npm run voice-lab:pilot` — dry-run by default.
5. To spend API budget: `VOICE_LAB_EXECUTE=1 VOICE_LAB_COST_CEILING_USD=1 npm run voice-lab:cedar`  
   Hard default ceiling **$1**. Marin is off unless the estimate still fits.
6. Chatterbox weights: only if `HARDWARE-RECEIPT.json` gate is not `refused`, then `VOICE_LAB_CHATTERBOX_INSTALL=1` on that machine. This PR does not pip-install Torch.
7. `npm run voice-lab:serve` → http://127.0.0.1:4177/ — score in the browser (localStorage only).

## This environment

No API key used. No audio generated. No model download. See `GENERATION-MANIFEST.json`.
