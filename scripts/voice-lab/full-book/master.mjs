#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadTrackManifest } from "./tracks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");

function probeDuration(wav) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", wav],
    { encoding: "utf8" },
  );
  return r.status === 0 ? Number(r.stdout.trim()) : null;
}

export function masterTrack(trackId) {
  const inWav = join(BOOK, "assembled", `${trackId}.wav`);
  const mastered = join(BOOK, "mastered", `${trackId}.wav`);
  const delivery = join(BOOK, "delivery", `${trackId}.mp3`);
  if (!existsSync(inWav)) throw new Error(`missing assembled ${inWav}`);
  mkdirSync(join(BOOK, "mastered"), { recursive: true });
  mkdirSync(join(BOOK, "delivery"), { recursive: true });
  const norm = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inWav,
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      "-ar",
      "44100",
      "-c:a",
      "pcm_s24le",
      mastered,
    ],
    { encoding: "utf8" },
  );
  if (norm.status !== 0) throw new Error(`master wav failed: ${norm.stderr?.slice(0, 300)}`);
  const mp3 = spawnSync(
    "ffmpeg",
    ["-y", "-i", mastered, "-ac", "1", "-ar", "44100", "-b:a", "192k", delivery],
    { encoding: "utf8" },
  );
  if (mp3.status !== 0) throw new Error(`mp3 failed: ${mp3.stderr?.slice(0, 300)}`);
  return { duration_seconds: probeDuration(mastered), mastered, delivery };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const manifest = loadTrackManifest(ROOT);
  const only = process.argv[2];
  const tracks = only
    ? manifest.tracks.filter((t) => t.output_basename === only)
    : manifest.tracks;
  for (const track of tracks) {
    const id = track.output_basename;
    const assembled = join(BOOK, "assembled", `${id}.wav`);
    if (!existsSync(assembled)) {
      process.stdout.write(`skip master ${id}: not assembled\n`);
      continue;
    }
    const r = masterTrack(id);
    process.stdout.write(`mastered ${id} (${r.duration_seconds}s)\n`);
  }
}
