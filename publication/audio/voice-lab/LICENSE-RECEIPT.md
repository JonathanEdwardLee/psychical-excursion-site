# Chatterbox license receipt (no weights downloaded in this pass)

Retrieved 2026-09-25 from official sources. **Re-verified 2026-09-25 on Jonathan’s Windows laptop** (GitHub `LICENSE` + Hugging Face API for `ResembleAI/chatterbox` and `ResembleAI/chatterbox-nano`; no weights downloaded). Re-verify the LICENSE inside any checkpoint tarball before selling audio.

## Wrapper / repository

- Repository: https://github.com/resemble-ai/chatterbox
- File: `LICENSE`
- Text: **MIT License**, Copyright (c) **2025 Resemble AI**
- Grants use, copy, modify, merge, publish, distribute, sublicense, and **sell** copies of the Software, with notice preservation.

## Model cards (claimed; not a downloaded tarball)

- Hugging Face `ResembleAI/chatterbox` lists `license: mit`
- Hugging Face `ResembleAI/chatterbox-nano` is the CPU-oriented 110M English variant described in the official README
- Resemble’s product page states Chatterbox, Multilingual, and Turbo are MIT and may be used commercially

## Gate for this implementation PR

This cloud/CI environment **did not download weights**. Commercial compatibility of generated output is **provisionally** aligned with MIT + Resemble’s commercial statement, **conditional** on the operator confirming the LICENSE of the exact files they pull.

If that confirmation is ambiguous, **do not use the clone in a sellable audiobook**.

## Do not install for this product

- Coqui XTTS-v2 (CPML, non-commercial)
- F5-TTS public weights (CC-BY-NC)
- Fish Speech public weights (separate commercial agreement)

## Hardware decision on the implementing machine

See `HARDWARE-RECEIPT.json`. No NVIDIA GPU; installing Torch + weights here was **refused** to avoid destabilizing a RAM-tight CPU VM. An operator laptop with spare RAM and preferably 8 CPU cores may opt into **Chatterbox-Nano** only (`VOICE_LAB_CHATTERBOX_INSTALL=1`) with a gitignored Jonathan reference WAV.
