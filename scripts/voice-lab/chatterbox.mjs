#!/usr/bin/env node
/** Chatterbox local adapter. Never uploads reference audio. Does not auto-install weights. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectHardware } from "./hardware.mjs";

export function chatterboxGate({ referenceWav, hardware = inspectHardware() }) {
  const receipt = {
    candidate: "official Resemble AI Chatterbox (resemble-ai/chatterbox)",
    wrapper_license: "MIT (GitHub LICENSE, Copyright (c) 2025 Resemble AI, retrieved 2026-09-25)",
    weights_license_claimed: "Hugging Face ResembleAI/chatterbox and chatterbox-nano model cards list license: mit (re-verify after any download)",
    commercial_claim: "Resemble states Chatterbox family is MIT and may be used commercially; this is not a substitute for the LICENSE file inside the exact checkpoint tarball the operator downloads.",
    do_not_use: ["Coqui XTTS-v2 (CPML non-commercial)", "F5-TTS public weights (CC-BY-NC)", "Fish Speech public weights (separate commercial agreement)"],
    hardware: hardware.gate,
    reference_wav_present: Boolean(referenceWav && existsSync(referenceWav)),
    cloud_upload: false,
    installed: false,
    generated: false,
  };

  if (hardware.gate.install === "refused") {
    receipt.stop = hardware.gate.reason;
    return receipt;
  }
  if (!referenceWav || !existsSync(referenceWav)) {
    receipt.stop =
      "No local Jonathan reference WAV. Place a founder-owned WAV at local/voice-lab/reference/jonathan.wav (gitignored). Do not commit samples.";
    return receipt;
  }
  if (process.env.VOICE_LAB_CHATTERBOX_INSTALL !== "1") {
    receipt.stop =
      "Install/run is opt-in. Set VOICE_LAB_CHATTERBOX_INSTALL=1 on a machine that passed the hardware gate. This pass does not pip-install Torch.";
    return receipt;
  }
  receipt.ready_for_operator_install = true;
  return receipt;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const referenceWav = process.env.PEX_JONATHAN_REF_WAV || join(ROOT, "local/voice-lab/reference/jonathan.wav");
  const receipt = chatterboxGate({ referenceWav });
  const outDir = join(ROOT, "publication/audio/voice-lab");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "CHATTERBOX-GATE.json"), `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${receipt.stop ?? "gate open"}\n`);
}
