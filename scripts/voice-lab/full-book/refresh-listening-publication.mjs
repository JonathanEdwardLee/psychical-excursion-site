#!/usr/bin/env node
/**
 * Sync publication receipts after a listening-edition repackage (no Cedar regen).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import {
  LISTENING_EDITION_TRACK_COUNT,
  OMITTED_LISTENING_OUTPUT_BASENAMES,
} from "../../generate-session-scripts.mjs";
import { loadTrackManifest } from "./tracks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const PUB_AUDIO = join(ROOT, "publication/audio");
const BOOK = join(ROOT, "local/voice-lab/full-book");

const APPROVED_27_TRACK_PACKAGE_SHA256 = {
  zip_sha256: "9678a911c9c140c94db1ed85fb095b2f853a471dba7c1379bb31689c45ce373e",
  zip_bytes: 534513171,
  note: "PR #96 founder-approved 27-track package (includes back matter + closing).",
};

/** Staged MP3 hashes from approved 27-track package (tracks 00–23 only). */
const APPROVED_RETAINED_MP3_SHA256 = {
  "00-PEX-AUDIO-00-opening-credits.mp3": "177d49773a06f861f5de76107654179b5159e3b3f9a194af32449f3ee0c9cbc0",
  "01-PEX-AUDIO-01-what-is-a-psychical-excursion.mp3": "a590fd33ec7683f15901b3c7fbf28d0d13b0bcc7ba9dc1cd23f293f7f47c577c",
  "02-PEX-AUDIO-02-remember-your-dreams.mp3": "21c2c4bde84eb720755cf7017dd870b43d6b4129ca7b3fca1368c5406b89e3da",
  "03-PEX-AUDIO-03-notice-your-dreams.mp3": "99dc14fa329f41f0521db0cad61e2c2d72b6990d08bd97d227ee0466cd735db1",
  "04-PEX-AUDIO-04-recognize-the-dream.mp3": "12fa7367ba43797c4eb2979938e09a2642192cfb8d2614797dcad97629fea3d8",
  "05-PEX-AUDIO-05-feel-the-body.mp3": "0d8a4bb874d4a90c6b203fa817e2cf0d8b1d621dee0d723adcc37cc693571ac8",
  "06-PEX-AUDIO-06-move-your-attention.mp3": "f101ba488ddf05e01e04098e3956cedb24e9e646d85096fd6323db6519f670f2",
  "07-PEX-AUDIO-07-build-the-current.mp3": "5480927bded25897e7d5074be0cafe5dd239b7ce11d5f528a6427f6b7bf0ecc4",
  "08-PEX-AUDIO-08-quiet-the-mind.mp3": "62c60e751aa5535f5c9ed1edd3847c4a8f94ad26e59b3d5049f485e702f59e7a",
  "09-PEX-AUDIO-09-see-the-image.mp3": "159f834904e169578c906ef8f78fd0ea70f376c12fd423b83e5076c5f5ed6f9c",
  "10-PEX-AUDIO-10-watch-the-edge.mp3": "aa6d80a4c91ff325d3a7d5a374c61829f3261d263f2a6b8e808d46ca6b5c50c9",
  "11-PEX-AUDIO-11-let-the-body-sleep.mp3": "9536ebf3fb013cf84519b5f991d77cab9b9279d7c87ed42380530284a27a57fc",
  "12-PEX-AUDIO-12-move-without-moving.mp3": "b78c7537d812785b5c23a816ffeb16353df72f9934674fa909878646fd7d3084",
  "13-PEX-AUDIO-13-feel-the-shift.mp3": "d1cf583aad6cf998349c95a04c71b0409f1c177cbe7e07cb297faee23521fe90",
  "14-PEX-AUDIO-14-know-the-threshold.mp3": "735c0f88918376fcb9ebde3d33a913c68ad058f5b94f55a6527f46d82fbf23a7",
  "15-PEX-AUDIO-15-stabilize-the-dream.mp3": "9658580a6e0b1094a2f0d8c6c9182724e1f72fe33c39825a77051e9f57d7b888",
  "16-PEX-AUDIO-16-explore-the-dream.mp3": "7b0084fc711b4a394b47922a91711dde92a109d71037c15586ed51bba5400148",
  "17-PEX-AUDIO-17-loosen-the-body.mp3": "aaf3ec5d21defb223b49871f706e158de18e10e9b36ba6b5a70f279852db8440",
  "18-PEX-AUDIO-18-cross-the-threshold.mp3": "e2af5ffccbef3a9b9f2fe13c840cb465bd785ae8dd711b3f924e30a367e44b5a",
  "19-PEX-AUDIO-19-test-the-experience.mp3": "40e74d729a191abce66cb34c2029bc7e5168a166b10b0686c9cd85c640a54477",
  "20-PEX-AUDIO-20-compare-the-maps.mp3": "6fa21a00c579b01895ac38ef40b2bdb8cfbfe9ae9334a7fe5505de646ecc7cb6",
  "21-PEX-AUDIO-21-floating-in-space.mp3": "7a3284c5859963e0e473dbe2303d708e4c1376d65bd15d7d8bc2bc316a717cdb",
  "22-PEX-AUDIO-22-notice-the-coincidence.mp3": "731196f50dbbeabf22644e3f6b8b20b501aa137727dd46466ae686d87f8d69b7",
  "23-PEX-AUDIO-23-return-record-repeat.mp3": "334a37150b5ae13683e45d14d515348941e88b20dd3e89ae70ff658d882a4209",
};

export async function refreshListeningPublication() {
  const manifest = loadTrackManifest(ROOT);
  if (manifest.tracks.length !== LISTENING_EDITION_TRACK_COUNT) {
    throw new Error(`Expected ${LISTENING_EDITION_TRACK_COUNT} tracks; got ${manifest.tracks.length}`);
  }

  const packageMeta = JSON.parse(readFileSync(join(PUB_AUDIO, "AUDIOBOOK-PACKAGE-MANIFEST.json"), "utf8"));
  const mp3Files = packageMeta.files.filter((f) => f.file.endsWith(".mp3"));
  if (mp3Files.length !== LISTENING_EDITION_TRACK_COUNT) {
    throw new Error(`Package manifest has ${mp3Files.length} MP3s; expected ${LISTENING_EDITION_TRACK_COUNT}`);
  }

  const hashChecks = [];
  for (const { file, track } of mp3Files) {
    const expected = APPROVED_RETAINED_MP3_SHA256[file];
    const actual = packageMeta.sha256[file];
    if (!expected) throw new Error(`No approved baseline hash for ${file}`);
    const unchanged = expected === actual;
    hashChecks.push({ file, track, unchanged, sha256: actual });
    if (!unchanged) {
      throw new Error(`Retained MP3 hash changed: ${file}`);
    }
  }

  const receiptPath = join(PUB_AUDIO, "AUDIOBOOK-PRODUCTION-RECEIPT.json");
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8"));
  const priorTracks = receipt.tracks ?? {};
  const historical = receipt.historical_ledger_tracks ?? {};
  for (const id of OMITTED_LISTENING_OUTPUT_BASENAMES) {
    if (priorTracks[id]) {
      historical[id] = { ...priorTracks[id], historical_reason: "omitted-from-listening-edition-24" };
      delete priorTracks[id];
    }
  }
  for (const id of ["PEX-AUDIO-00a-evidence-and-belief", "PEX-AUDIO-00b-sleep-and-safety"]) {
    if (priorTracks[id]) {
      historical[id] = { ...priorTracks[id], historical_reason: "retired-front-matter" };
      delete priorTracks[id];
    }
  }

  const activeTracks = {};
  let totalDuration = 0;
  for (const track of manifest.tracks) {
    const id = track.output_basename;
    const row = priorTracks[id];
    if (!row) throw new Error(`Missing ledger row for active track ${id}`);
    activeTracks[id] = { ...row, sequence: track.sequence };
    totalDuration += row.duration_seconds ?? 0;
  }

  receipt.status = "package-complete";
  receipt.updated_at = new Date().toISOString();
  receipt.track_count_planned = LISTENING_EDITION_TRACK_COUNT;
  receipt.tracks_completed = LISTENING_EDITION_TRACK_COUNT;
  receipt.total_duration_seconds_measured = Math.round(totalDuration * 100) / 100;
  receipt.planning_spend_usd_rule_of_thumb = Math.round((totalDuration / 60) * 0.015 * 100) / 100;
  receipt.package_zip_sha256 = packageMeta.zip_sha256;
  receipt.package_zip_bytes = packageMeta.zip_bytes;
  if (receipt.ch1_ch4_pass) {
    receipt.ch1_ch4_pass.historical_note =
      "27-track Ch1/Ch4 Cedar pass; listening edition is now 24 tracks (opening + ch 01–23).";
  }

  receipt.listening_edition = {
    track_count: LISTENING_EDITION_TRACK_COUNT,
    omitted_output_basenames: OMITTED_LISTENING_OUTPUT_BASENAMES,
    audio_regenerated: false,
    repackaged_at: new Date().toISOString(),
  };
  receipt.tracks = activeTracks;
  receipt.historical_ledger_tracks = historical;
  receipt.superseded_packages = [
    ...(receipt.superseded_packages ?? []),
    { ...APPROVED_27_TRACK_PACKAGE_SHA256, track_count: 27 },
  ];

  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);

  packageMeta.superseded_packages = [
    ...(packageMeta.superseded_packages ?? []),
    {
      edition: "listening-27",
      ...APPROVED_27_TRACK_PACKAGE_SHA256,
    },
  ];
  writeFileSync(join(PUB_AUDIO, "AUDIOBOOK-PACKAGE-MANIFEST.json"), `${JSON.stringify(packageMeta, null, 2)}\n`);

  const qc = {
    status: "listening-24-repackage-verified",
    updated_at: new Date().toISOString(),
    pr: 96,
    audio_regenerated: false,
    listening_track_count: LISTENING_EDITION_TRACK_COUNT,
    sequence: manifest.tracks.map((t) => ({
      sequence: t.sequence,
      output_basename: t.output_basename,
      chapter_number: t.chapter_number,
    })),
    omitted_output_basenames: OMITTED_LISTENING_OUTPUT_BASENAMES,
    retained_mp3_hash_checks: hashChecks,
    all_retained_hashes_unchanged_from_approved_27: hashChecks.every((c) => c.unchanged),
    package_zip_sha256: packageMeta.zip_sha256,
    package_zip_bytes: packageMeta.zip_bytes,
    package_zip_path_gitignored: packageMeta.zip_path_gitignored,
    total_duration_seconds_measured: receipt.total_duration_seconds_measured,
    staging_cleared_before_package: true,
    superseded_27_track_package: APPROVED_27_TRACK_PACKAGE_SHA256,
  };
  writeFileSync(join(PUB_AUDIO, "AUDIOBOOK-QC-LISTENING-24-20260926.json"), `${JSON.stringify(qc, null, 2)}\n`);

  return { receipt, packageMeta, qc };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  refreshListeningPublication().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  });
}
