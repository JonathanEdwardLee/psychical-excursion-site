#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { estimateCedarUsd, FULL_BOOK_COST_CEILING_USD } from "../core.mjs";
import { generateTrackRaw, planTrackChunks } from "./track-generate.mjs";
import { assembleTrack } from "./assemble.mjs";
import { masterTrack } from "./master.mjs";
import { assertLedgerHeadroom, readLedger, writeLedger } from "./ledger.mjs";
import { loadTrackManifest, loadTrackSpokenText } from "./tracks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");
const RECEIPTS = join(BOOK, "receipts");

function envExecute(env) {
  return env.PEX_AUDIOBOOK_EXECUTE === "1" || env.VOICE_LAB_EXECUTE === "1";
}

function ceilingUsd(env) {
  return Number(env.PEX_AUDIOBOOK_COST_CEILING_USD ?? FULL_BOOK_COST_CEILING_USD);
}

function parseArgs(argv) {
  const opts = { dryRun: false, track: null, fromSequence: null, force: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--dry-run") opts.dryRun = true;
    else if (argv[i] === "--force") opts.force = true;
    else if (argv[i] === "--track" && argv[i + 1]) {
      opts.track = argv[++i];
    } else if (argv[i] === "--from" && argv[i + 1]) {
      opts.fromSequence = Number(argv[++i]);
    }
  }
  return opts;
}

function syncPublicationReceipt(ledger, manifestTracks) {
  const out = {
    updated_at: new Date().toISOString(),
    work_order: "docs/work-orders/PEX-FULL-CEDAR-AUDIOBOOK.md",
    model: "gpt-4o-mini-tts",
    voice: "cedar",
    cost_ceiling_usd: ledger.cost_ceiling_usd,
    conservative_usd_estimated: ledger.conservative_usd_estimated,
    api_request_count: ledger.api_request_count,
    track_count_planned: manifestTracks.length,
    tracks_completed: Object.values(ledger.tracks).filter((t) => t.status === "mastered").length,
    tracks: ledger.tracks,
    note: "Audio binaries gitignored under local/voice-lab/full-book/",
  };
  writeFileSync(
    join(ROOT, "publication/audio/AUDIOBOOK-PRODUCTION-RECEIPT.json"),
    `${JSON.stringify(out, null, 2)}\n`,
  );
}

export async function runFullBookGeneration({ env = process.env, opts = {} } = {}) {
  const execute = envExecute(env) && !opts.dryRun;
  const ceiling = ceilingUsd(env);
  const manifest = loadTrackManifest(ROOT);
  let tracks = manifest.tracks;
  if (opts.track) tracks = tracks.filter((t) => t.output_basename === opts.track);
  if (opts.fromSequence != null) tracks = tracks.filter((t) => t.sequence >= opts.fromSequence);

  const ledger = readLedger(BOOK);
  ledger.cost_ceiling_usd = ceiling;

  const plan = {
    pass: "full-cedar-audiobook",
    execute,
    cost_ceiling_usd: ceiling,
    track_count: tracks.length,
    publication_words: manifest.totals?.publication_narration_words,
    conservative_usd_total_estimate: 0,
    tracks: [],
  };

  for (const track of tracks) {
    const id = track.output_basename;
    const textInfo = loadTrackSpokenText(ROOT, track);
    const estimate = estimateCedarUsd(textInfo.words, false);
    plan.conservative_usd_total_estimate += estimate.conservative_usd_this_run;
    plan.tracks.push({
      sequence: track.sequence,
      id,
      title: track.title,
      words: textInfo.words,
      chunks: planTrackChunks(textInfo),
      conservative_usd: estimate.conservative_usd_this_run,
    });
  }
  plan.conservative_usd_total_estimate = Math.round(plan.conservative_usd_total_estimate * 10000) / 10000;

  writeFileSync(join(BOOK, "GENERATION-PLAN.json"), `${JSON.stringify(plan, null, 2)}\n`);
  if (!execute) {
    process.stdout.write(
      `Dry run: ${tracks.length} tracks, conservative ~$${plan.conservative_usd_total_estimate} (ceiling $${ceiling}). Set PEX_AUDIOBOOK_EXECUTE=1 to generate.\n`,
    );
    return plan;
  }

  for (const track of tracks) {
    const id = track.output_basename;
    if (!opts.force && ledger.tracks[id]?.status === "mastered") {
      process.stdout.write(`skip ${id}: already mastered\n`);
      continue;
    }
    const textInfo = loadTrackSpokenText(ROOT, track);
    const estimate = estimateCedarUsd(textInfo.words, false);
    assertLedgerHeadroom(ledger, estimate.conservative_usd_this_run, ceiling);

    const rawDir = join(BOOK, "raw", id);
    mkdirSync(RECEIPTS, { recursive: true });
    process.stdout.write(`\n=== Track ${track.sequence}: ${id} (${textInfo.words} words) ===\n`);

    const raw = await generateTrackRaw({
      textInfo,
      rawDir,
      env,
      ceilingUsd: Math.max(ceiling, estimate.conservative_usd_this_run),
      force: opts.force,
    });

    const trackReceipt = {
      sequence: track.sequence,
      output_basename: id,
      title: track.title,
      script_sha256: textInfo.scriptSha256,
      spoken_sha256: textInfo.spokenSha256,
      words: textInfo.words,
      assembly: raw,
      status: "raw-complete",
      updated_at: new Date().toISOString(),
    };

    ledger.conservative_usd_estimated = Math.round(
      (ledger.conservative_usd_estimated + estimate.conservative_usd_this_run) * 10000,
    ) / 10000;
    ledger.api_request_count += raw.request_count;
    writeFileSync(join(RECEIPTS, `${id}.json`), `${JSON.stringify(trackReceipt, null, 2)}\n`);

    assembleTrack(id);
    const mastered = masterTrack(id);
    trackReceipt.status = "mastered";
    trackReceipt.master = mastered;
    writeFileSync(join(RECEIPTS, `${id}.json`), `${JSON.stringify(trackReceipt, null, 2)}\n`);

    ledger.tracks[id] = {
      sequence: track.sequence,
      status: "mastered",
      words: textInfo.words,
      duration_seconds: mastered.duration_seconds,
      conservative_usd: estimate.conservative_usd_this_run,
    };
    writeLedger(BOOK, ledger);
    syncPublicationReceipt(ledger, manifest.tracks);
    process.stdout.write(`Track ${id} done.\n`);
  }

  writeFileSync(
    join(BOOK, "PACKAGE-MANIFEST.json"),
    `${JSON.stringify({ ledger, updated_at: new Date().toISOString() }, null, 2)}\n`,
  );
  process.stdout.write(`\nFull book generation pass complete (${tracks.length} tracks).\n`);
  return plan;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const opts = parseArgs(process.argv);
  runFullBookGeneration({ opts }).catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
