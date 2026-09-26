#!/usr/bin/env node
/**
 * LaptopDev pass: regenerate Chapter 1 (section-heading pacing) and Chapter 4 only;
 * reuse other delivery MP3s; rebuild 27-track package (no 00a/00b).
 */
import { createHash } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import {
  CHAPTER1_PAUSE_AFTER_EXCURSION_MS,
  CHAPTER1_PAUSE_AFTER_HEADING_MS,
  CHAPTER1_PAUSE_BEFORE_HEADING_MS,
} from "./chapter1-pacing.mjs";
import { estimateCedarUsd, FULL_BOOK_COST_CEILING_USD } from "../core.mjs";
import { assembleTrack } from "./assemble.mjs";
import { masterTrack } from "./master.mjs";
import { assertLedgerHeadroom, readLedger, writeLedger } from "./ledger.mjs";
import { loadTrackManifest, loadTrackSpokenText } from "./tracks.mjs";
import { generateTrackRaw, planTrackChunks } from "./track-generate.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");
const RECEIPTS = join(BOOK, "receipts");

const REGEN_TRACKS = [
  "PEX-AUDIO-01-what-is-a-psychical-excursion",
  "PEX-AUDIO-04-recognize-the-dream",
];

const REMOVED_TRACKS = ["PEX-AUDIO-00a-evidence-and-belief", "PEX-AUDIO-00b-sleep-and-safety"];

function envExecute(env) {
  return env.PEX_AUDIOBOOK_EXECUTE === "1" || env.VOICE_LAB_EXECUTE === "1";
}

function ceilingUsd(env) {
  return Number(
    env.PEX_AUDIOBOOK_CORRECTION_CEILING_USD ?? env.PEX_AUDIOBOOK_COST_CEILING_USD ?? FULL_BOOK_COST_CEILING_USD,
  );
}

function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

function syncPublicationReceipt(ledger, pass) {
  const manifest = loadTrackManifest(ROOT);
  const totalDuration = Object.values(ledger.tracks).reduce((a, t) => a + (t.duration_seconds ?? 0), 0);
  let packageMeta = {};
  try {
    packageMeta = JSON.parse(readFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json"), "utf8"));
  } catch {
    packageMeta = {};
  }
  const out = {
    status: pass?.verified ? "package-complete" : "ch1-ch4-regeneration-pending",
    updated_at: new Date().toISOString(),
    work_order: "docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md",
    model: "gpt-4o-mini-tts",
    voice: "cedar",
    cost_ceiling_usd: ledger.cost_ceiling_usd,
    conservative_usd_estimated: ledger.conservative_usd_estimated,
    api_request_count: ledger.api_request_count,
    track_count_planned: manifest.tracks.length,
    tracks_completed: manifest.tracks.filter((t) => ledger.tracks[t.output_basename]?.status === "mastered").length,
    total_duration_seconds_measured: Math.round(totalDuration * 100) / 100,
    planning_spend_usd_rule_of_thumb: Math.round((totalDuration / 60) * 0.015 * 100) / 100,
    package_zip_sha256: packageMeta.zip_sha256 ?? null,
    package_zip_bytes: packageMeta.zip_bytes ?? null,
    ch1_ch4_pass: pass,
    tracks: ledger.tracks,
    note: "Audio binaries gitignored under local/voice-lab/full-book/",
  };
  writeFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PRODUCTION-RECEIPT.json"), `${JSON.stringify(out, null, 2)}\n`);
}

function updateDirectSaleHandoff(packageMeta, pass) {
  const path = join(ROOT, "publication/audio/DIRECT-SALE-HANDOFF.md");
  let md = readFileSync(path, "utf8");
  const zipLine = `- **Package ZIP SHA-256:** \`${packageMeta.zip_sha256}\``;
  const bytesLine = `- **Package ZIP size:** ${packageMeta.zip_bytes} bytes`;
  const runtimeLine = `- **Measured total runtime:** ${pass.total_duration_seconds_measured} seconds`;
  const tracksLine = `- **Track count:** ${pass.track_count} MP3 chapter files (27-track listening edition; 00a/00b removed)`;
  const replaceBlock = (label, line) => {
    const re = new RegExp(`- \\*\\*${label}:\\*\\*[^\n]*`, "g");
    if (re.test(md)) md = md.replace(re, line);
    else md += `\n${line}\n`;
  };
  replaceBlock("Package ZIP SHA-256", zipLine.replace(/^- /, ""));
  replaceBlock("Package ZIP size", bytesLine.replace(/^- /, ""));
  replaceBlock("Measured total runtime", runtimeLine.replace(/^- /, ""));
  replaceBlock("Track count", tracksLine.replace(/^- /, ""));
  writeFileSync(path, md);
}

export async function runCh1Ch4Pass({ env = process.env } = {}) {
  if (!envExecute(env)) {
    throw new Error("Set PEX_AUDIOBOOK_EXECUTE=1 to run Ch1/Ch4 regeneration");
  }
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const ceiling = ceilingUsd(env);
  const manifest = loadTrackManifest(ROOT);
  if (manifest.tracks.length !== 27) {
    throw new Error(`Expected 27 tracks in TRACK-MANIFEST; got ${manifest.tracks.length}`);
  }
  for (const removed of REMOVED_TRACKS) {
    if (manifest.tracks.some((t) => t.output_basename === removed)) {
      throw new Error(`Removed track still in manifest: ${removed}`);
    }
  }

  const reusedIds = manifest.tracks.map((t) => t.output_basename).filter((id) => !REGEN_TRACKS.includes(id));
  if (reusedIds.length !== 25) {
    throw new Error(`Expected 25 reused tracks; got ${reusedIds.length}`);
  }

  const deliveryBaseline = {};
  for (const id of reusedIds) {
    const mp3 = join(BOOK, "delivery", `${id}.mp3`);
    deliveryBaseline[id] = await sha256File(mp3);
  }

  const ledger = readLedger(BOOK);
  ledger.cost_ceiling_usd = ceiling;

  const pass = {
    started_at: new Date().toISOString(),
    accepted_main_sha: "4e370202039dff603836170b836383800b1e580c",
    tracks_regenerated: REGEN_TRACKS,
    tracks_reused_unchanged: reusedIds,
    tracks_removed_permanently: REMOVED_TRACKS,
    chapter1_pause_targets_ms: {
      before_heading: CHAPTER1_PAUSE_BEFORE_HEADING_MS,
      after_heading: CHAPTER1_PAUSE_AFTER_HEADING_MS,
      after_excursion_before_wilson: CHAPTER1_PAUSE_AFTER_EXCURSION_MS,
      section_pause_before_wilson: 1750,
    },
    additional_api_requests: 0,
    additional_conservative_usd: 0,
    delivery_baseline_sha256: deliveryBaseline,
    reused_hashes_unchanged: null,
    chapter1_section_pause_durations: null,
    chapter1_spoken_sha256: null,
    chapter4_spoken_sha256: null,
  };

  syncPublicationReceipt(ledger, pass);

  for (const id of REGEN_TRACKS) {
    const track = manifest.tracks.find((t) => t.output_basename === id);
    if (!track) throw new Error(`track missing: ${id}`);
    const textInfo = loadTrackSpokenText(ROOT, track);
    if (id === "PEX-AUDIO-01-what-is-a-psychical-excursion") {
      pass.chapter1_spoken_sha256 = textInfo.spokenSha256;
      pass.chapter1_section_pause_durations = textInfo.chapter1_pause_log;
    }
    if (id === "PEX-AUDIO-04-recognize-the-dream") {
      pass.chapter4_spoken_sha256 = textInfo.spokenSha256;
    }

    const estimate = estimateCedarUsd(textInfo.words, false);
    assertLedgerHeadroom(ledger, estimate.conservative_usd_this_run, ceiling);

    const prior = ledger.tracks[id];
    if (prior?.conservative_usd) {
      ledger.conservative_usd_estimated =
        Math.round((ledger.conservative_usd_estimated - prior.conservative_usd) * 10000) / 10000;
    }

    const rawDir = join(BOOK, "raw", id);
    process.stdout.write(
      `\n=== Ch1/Ch4 regenerate: ${id} (${textInfo.words} words, ${planTrackChunks(textInfo)} cedar chunks) ===\n`,
    );

    const raw = await generateTrackRaw({
      textInfo,
      rawDir,
      env,
      ceilingUsd: Math.max(ceiling, estimate.conservative_usd_this_run),
      force: true,
    });

    pass.additional_api_requests += raw.request_count;
    pass.additional_conservative_usd =
      Math.round((pass.additional_conservative_usd + estimate.conservative_usd_this_run) * 10000) / 10000;

    ledger.api_request_count += raw.request_count;
    ledger.conservative_usd_estimated =
      Math.round((ledger.conservative_usd_estimated + estimate.conservative_usd_this_run) * 10000) / 10000;

    assembleTrack(id);
    const mastered = masterTrack(id);

    const trackReceipt = {
      sequence: track.sequence,
      output_basename: id,
      title: track.title,
      script_sha256: textInfo.scriptSha256,
      spoken_sha256: textInfo.spokenSha256,
      words: textInfo.words,
      ch1_ch4_regenerated_at: new Date().toISOString(),
      chapter1_pause_log: textInfo.chapter1_pause_log ?? undefined,
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
      ch1_ch4_regenerated_at: trackReceipt.ch1_ch4_regenerated_at,
    };
    writeLedger(BOOK, ledger);
    syncPublicationReceipt(ledger, pass);
  }

  const reusedAfter = {};
  const mismatches = [];
  for (const id of reusedIds) {
    const mp3 = join(BOOK, "delivery", `${id}.mp3`);
    reusedAfter[id] = await sha256File(mp3);
    if (reusedAfter[id] !== deliveryBaseline[id]) {
      mismatches.push(id);
    }
  }
  pass.reused_hashes_unchanged = mismatches.length === 0;
  pass.reused_hash_mismatches = mismatches;

  process.stdout.write("\nRebuilding 27-track package zip…\n");
  const pack = spawnSync(process.execPath, [join(ROOT, "scripts/voice-lab/full-book/package.mjs")], {
    stdio: "inherit",
    env,
  });
  if (pack.status !== 0) throw new Error("audiobook package failed");

  const packageMeta = JSON.parse(readFileSync(join(ROOT, "publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json"), "utf8"));
  const mp3InPackage = packageMeta.files.map((f) => f.file);
  pass.track_count = manifest.tracks.length;
  pass.package_mp3_count = mp3InPackage.length;
  pass.package_zip_sha256 = packageMeta.zip_sha256;
  pass.package_zip_bytes = packageMeta.zip_bytes;
  pass.package_zip_path = join(BOOK, "Psychical-Excursion-Audiobook-v1.zip");
  pass.cumulative_api_request_count = ledger.api_request_count;
  pass.cumulative_conservative_usd = ledger.conservative_usd_estimated;

  const totalDuration = Object.values(ledger.tracks).reduce((a, t) => a + (t.duration_seconds ?? 0), 0);
  pass.total_duration_seconds_measured = Math.round(totalDuration * 100) / 100;

  const ch1Receipt = JSON.parse(readFileSync(join(RECEIPTS, "PEX-AUDIO-01-what-is-a-psychical-excursion.json"), "utf8"));
  const pauseFiles = ch1Receipt.assembly?.assembly_order?.filter((f) => f.startsWith("_pause-")) ?? [];
  pass.chapter1_assembly_pause_wav_count = pauseFiles.length;
  pass.chapter1_assembly_pause_durations_ms = ch1Receipt.assembly?.pause_durations_ms ?? [];
  pass.chapter1_wilson_section_pause_ms = 1750;
  pass.chapter1_heading_pause_verified =
    Array.isArray(pass.chapter1_section_pause_durations) &&
    pass.chapter1_section_pause_durations.length === 16 &&
    (ch1Receipt.assembly?.pause_durations_ms ?? []).some((p) => p.label === "after:The Excursion") &&
    (ch1Receipt.assembly?.pause_durations_ms ?? []).some((p) => p.label === "section-pause");

  pass.verified =
    pass.reused_hashes_unchanged &&
    pass.package_mp3_count === 27 &&
    !mp3InPackage.some((n) => n.includes("00a") || n.includes("00b")) &&
    pass.chapter1_heading_pause_verified &&
    pauseFiles.length >= 17;

  pass.completed_at = new Date().toISOString();
  writeFileSync(join(BOOK, "CH1-CH4-PASS.json"), `${JSON.stringify(pass, null, 2)}\n`);
  writeFileSync(
    join(ROOT, "publication/audio/AUDIOBOOK-QC-CH1-CH4-20260925.json"),
    `${JSON.stringify(pass, null, 2)}\n`,
  );
  syncPublicationReceipt(ledger, pass);
  updateDirectSaleHandoff(packageMeta, pass);

  return { ledger, pass, packageMeta };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  runCh1Ch4Pass().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
