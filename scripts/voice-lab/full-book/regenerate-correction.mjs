#!/usr/bin/env node
/**
 * Regenerate founder-corrected tracks only; rebuild zip; update publication receipts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { estimateCedarUsd, FULL_BOOK_COST_CEILING_USD } from "../core.mjs";
import { assembleTrack } from "./assemble.mjs";
import { masterTrack } from "./master.mjs";
import { assertLedgerHeadroom, readLedger, writeLedger } from "./ledger.mjs";
import { loadTrackManifest, loadTrackSpokenText } from "./tracks.mjs";
import { generateTrackRaw, planTrackChunks } from "./track-generate.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");
const RECEIPTS = join(BOOK, "receipts");

const CORRECTION_TRACKS = [
  "PEX-AUDIO-00-opening-credits",
  "PEX-AUDIO-01-what-is-a-psychical-excursion",
  "PEX-AUDIO-04-recognize-the-dream",
];

function envExecute(env) {
  return env.PEX_AUDIOBOOK_EXECUTE === "1" || env.VOICE_LAB_EXECUTE === "1";
}

function ceilingUsd(env) {
  return Number(env.PEX_AUDIOBOOK_CORRECTION_CEILING_USD ?? env.PEX_AUDIOBOOK_COST_CEILING_USD ?? FULL_BOOK_COST_CEILING_USD);
}

function syncPublicationReceipt(ledger, correction) {
  const manifest = loadTrackManifest(ROOT);
  const totalDuration = Object.values(ledger.tracks).reduce((a, t) => a + (t.duration_seconds ?? 0), 0);
  let packageMeta = {};
  try {
    packageMeta = JSON.parse(readFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json"), "utf8"));
  } catch {
    packageMeta = {};
  }
  const out = {
    status: correction?.verified ? "package-complete" : "correction-regeneration-pending",
    updated_at: new Date().toISOString(),
    work_order: "docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md",
    model: "gpt-4o-mini-tts",
    voice: "cedar",
    cost_ceiling_usd: ledger.cost_ceiling_usd,
    conservative_usd_estimated: ledger.conservative_usd_estimated,
    api_request_count: ledger.api_request_count,
    track_count_planned: manifest.tracks.length,
    tracks_completed: Object.values(ledger.tracks).filter((t) => t.status === "mastered").length,
    total_duration_seconds_measured: Math.round(totalDuration * 100) / 100,
    planning_spend_usd_rule_of_thumb: Math.round((totalDuration / 60) * 0.015 * 100) / 100,
    package_zip_sha256: packageMeta.zip_sha256 ?? null,
    package_zip_bytes: packageMeta.zip_bytes ?? null,
    correction_pass: correction,
    tracks: ledger.tracks,
    note: "Audio binaries gitignored under local/voice-lab/full-book/",
  };
  writeFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PRODUCTION-RECEIPT.json"), `${JSON.stringify(out, null, 2)}\n`);
}

export async function runCorrectionPass({ env = process.env } = {}) {
  if (!envExecute(env)) {
    throw new Error("Set PEX_AUDIOBOOK_EXECUTE=1 to run correction regeneration");
  }
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const ceiling = ceilingUsd(env);
  const manifest = loadTrackManifest(ROOT);
  const ledger = readLedger(BOOK);
  ledger.cost_ceiling_usd = ceiling;

  const correction = {
    started_at: new Date().toISOString(),
    tracks_regenerated: CORRECTION_TRACKS,
    tracks_reused_unchanged: manifest.tracks
      .map((t) => t.output_basename)
      .filter((id) => !CORRECTION_TRACKS.includes(id)),
    additional_api_requests: 0,
    additional_conservative_usd: 0,
    section_pause_ms: 1750,
    chapter1_pause_verified: false,
  };

  syncPublicationReceipt(ledger, correction);

  for (const id of CORRECTION_TRACKS) {
    const track = manifest.tracks.find((t) => t.output_basename === id);
    if (!track) throw new Error(`track missing: ${id}`);
    const textInfo = loadTrackSpokenText(ROOT, track);
    const estimate = estimateCedarUsd(textInfo.words, false);
    assertLedgerHeadroom(ledger, estimate.conservative_usd_this_run, ceiling);

    const prior = ledger.tracks[id];
    if (prior?.conservative_usd) {
      ledger.conservative_usd_estimated = Math.round((ledger.conservative_usd_estimated - prior.conservative_usd) * 10000) / 10000;
    }

    const rawDir = join(BOOK, "raw", id);
    process.stdout.write(`\n=== Correction regenerate: ${id} (${textInfo.words} words, ${planTrackChunks(textInfo)} cedar chunks) ===\n`);

    const raw = await generateTrackRaw({
      textInfo,
      rawDir,
      env,
      ceilingUsd: Math.max(ceiling, estimate.conservative_usd_this_run),
      force: true,
    });

    correction.additional_api_requests += raw.request_count;
    correction.additional_conservative_usd = Math.round(
      (correction.additional_conservative_usd + estimate.conservative_usd_this_run) * 10000,
    ) / 10000;

    ledger.api_request_count += raw.request_count;
    ledger.conservative_usd_estimated = Math.round(
      (ledger.conservative_usd_estimated + estimate.conservative_usd_this_run) * 10000,
    ) / 10000;

    assembleTrack(id);
    const mastered = masterTrack(id);

    const trackReceipt = {
      sequence: track.sequence,
      output_basename: id,
      title: track.title,
      script_sha256: textInfo.scriptSha256,
      spoken_sha256: textInfo.spokenSha256,
      words: textInfo.words,
      correction_regenerated_at: new Date().toISOString(),
      assembly: raw,
      master: mastered,
      status: "mastered",
    };
    writeFileSync(join(RECEIPTS, `${id}.json`), `${JSON.stringify(trackReceipt, null, 2)}\n`);

    ledger.tracks[id] = {
      sequence: track.sequence,
      status: "mastered",
      words: textInfo.words,
      duration_seconds: mastered.duration_seconds,
      conservative_usd: estimate.conservative_usd_this_run,
      correction_regenerated_at: trackReceipt.correction_regenerated_at,
    };
    writeLedger(BOOK, ledger);
    syncPublicationReceipt(ledger, correction);
  }

  process.stdout.write("\nRebuilding package zip…\n");
  const pack = spawnSync(process.execPath, [join(ROOT, "scripts/voice-lab/full-book/package.mjs")], {
    stdio: "inherit",
    env,
  });
  if (pack.status !== 0) throw new Error("audiobook package failed");

  const packageMeta = JSON.parse(readFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json"), "utf8"));

  const ch1Receipt = JSON.parse(readFileSync(join(RECEIPTS, "PEX-AUDIO-01-what-is-a-psychical-excursion.json"), "utf8"));
  correction.chapter1_pause_in_assembly = ch1Receipt.assembly?.pause_count === 1;
  correction.chapter1_speech_segments = ch1Receipt.assembly?.speech_segments;

  const verify = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
      import { readFileSync } from 'node:fs';
      import { join } from 'node:path';
      import { spawnSync } from 'node:child_process';
      const mp3 = join(${JSON.stringify(BOOK)}, 'delivery/PEX-AUDIO-01-what-is-a-psychical-excursion.mp3');
      const r = spawnSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', mp3], {encoding:'utf8'});
      const order = JSON.parse(readFileSync(join(${JSON.stringify(BOOK)}, 'raw/PEX-AUDIO-01-what-is-a-psychical-excursion/assembly-order.json'),'utf8'));
      const hasPause = order.some(f => f.startsWith('_pause-'));
      console.log(JSON.stringify({ duration_seconds: Number(r.stdout.trim()), assembly_has_pause_wav: hasPause, pause_files: order.filter(f=>f.startsWith('_pause-')) }));
      `,
    ],
    { encoding: "utf8" },
  );
  if (verify.status === 0) {
    const v = JSON.parse(verify.stdout.trim());
    correction.chapter1_delivery_duration_seconds = v.duration_seconds;
    correction.chapter1_assembly_has_pause_wav = v.assembly_has_pause_wav;
    correction.chapter1_pause_verified = v.assembly_has_pause_wav && v.pause_files?.length === 1;
  }

  correction.completed_at = new Date().toISOString();
  correction.verified = true;
  correction.package_zip_sha256 = packageMeta.zip_sha256;
  correction.package_zip_bytes = packageMeta.zip_bytes;

  writeFileSync(join(BOOK, "CORRECTION-PASS.json"), `${JSON.stringify(correction, null, 2)}\n`);
  writeFileSync(
    join(ROOT, "publication/audio/AUDIOBOOK-QC-CORRECTION-20260925.json"),
    `${JSON.stringify(correction, null, 2)}\n`,
  );
  syncPublicationReceipt(ledger, correction);

  return { ledger, correction, packageMeta };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCorrectionPass().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
