#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { chapter10Path, loadChapter10FromFs, selectPilotExcerpt, estimateCedarUsd } from "./core.mjs";
import { inspectHardware } from "./hardware.mjs";
import { chatterboxGate } from "./chatterbox.mjs";
import { synthesizeCedar } from "./cedar.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "publication/audio/voice-lab");

function maybeNormalize(rawPath, outPath) {
  const ffmpeg = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (ffmpeg.status !== 0) {
    return { normalized: false, reason: "ffmpeg not available" };
  }
  return { normalized: false, reason: "no generated audio to normalize in this pass" , tool: "ffmpeg", rawPath, outPath };
}

const excerpt = selectPilotExcerpt(loadChapter10FromFs(chapter10Path(ROOT)));
const hardware = inspectHardware();
const chatterbox = chatterboxGate({
  referenceWav: process.env.PEX_JONATHAN_REF_WAV || join(ROOT, "local/voice-lab/reference/jonathan.wav"),
  hardware,
});
const cedar = await synthesizeCedar({
  text: excerpt.excerpt,
  words: excerpt.words,
  outDir: join(ROOT, "local/voice-lab/cedar"),
});
const fullBook = estimateCedarUsd(63509, false);
fullBook.qc_and_regen_usd = Math.round(fullBook.conservative_usd_this_run * 1.25 * 100) / 100;
fullBook.label = "estimate-only-not-a-quote";

mkdirSync(OUT, { recursive: true });
const manifest = {
  pass: "local-ai-narration-pilot",
  publication_baseline: "c2de1bdd95fcdd0d85ab38195f2bd0c9121e427f",
    excerpt: {
      words: excerpt.words,
      excerpt_sha256: excerpt.sha256,
      source_script_sha256: excerpt.sourceSha256,
      path: "publication/audio/voice-lab/EXCERPT.md",
    },
  hardware: hardware.gate,
  cedar,
  chatterbox,
  normalize: maybeNormalize(null, null),
  full_book_cedar_estimate: fullBook,
  local_clone_economics: {
    software_cash_usd: 0,
    generation_time: "unmeasured-this-environment-did-not-run-weights",
    hardware_utilization: hardware.gate,
    disk_use: "unmeasured",
    founder_qc_time: "unknown-not-zero; full book is hours of listening",
    electricity: "unallocated-unknown",
  },
};
writeFileSync(join(OUT, "GENERATION-MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(OUT, "HARDWARE-RECEIPT.json"), `${JSON.stringify(hardware, null, 2)}\n`);
writeFileSync(join(OUT, "CHATTERBOX-GATE.json"), `${JSON.stringify(chatterbox, null, 2)}\n`);
process.stdout.write("Voice lab dry-run manifest written. No API call. No model download.\n");
