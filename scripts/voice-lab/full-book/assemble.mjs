#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadTrackManifest } from "./tracks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");

function ffmpegOk() {
  return spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).status === 0;
}

function listAssemblyFiles(rawDir) {
  const orderPath = join(rawDir, "assembly-order.json");
  if (existsSync(orderPath)) {
    return JSON.parse(readFileSync(orderPath, "utf8"));
  }
  return readdirSync(rawDir)
    .filter((f) => /^chunk-\d+\.wav$/i.test(f))
    .sort();
}

function concatRaw(trackId, rawDir, outWav) {
  const files = listAssemblyFiles(rawDir);
  if (!files.length) throw new Error(`No assembly files in ${rawDir}`);
  const listPath = join(rawDir, "concat-list.txt");
  const lines = files
    .map((f) => {
      const rel = f.replace(/\\/g, "/");
      return `file '${rel.replace(/'/g, "'\\''")}'`;
    })
    .join("\n");
  writeFileSync(listPath, `${lines}\n`);
  mkdirSync(dirname(outWav), { recursive: true });
  let r = spawnSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", "concat-list.txt", "-c", "copy", outWav],
    { cwd: rawDir, encoding: "utf8" },
  );
  if (r.status !== 0) {
    r = spawnSync(
      "ffmpeg",
      ["-y", "-f", "concat", "-safe", "0", "-i", "concat-list.txt", "-c:a", "pcm_s16le", outWav],
      { cwd: rawDir, encoding: "utf8" },
    );
  }
  if (r.status !== 0 || !existsSync(outWav)) {
    throw new Error(`ffmpeg concat failed for ${trackId}: ${r.stderr?.slice(0, 400)}`);
  }
  return { file_count: files.length };
}

export function assembleTrack(trackId) {
  const rawDir = join(BOOK, "raw", trackId);
  const outWav = join(BOOK, "assembled", `${trackId}.wav`);
  return concatRaw(trackId, rawDir, outWav);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (!ffmpegOk()) {
    process.stderr.write("ffmpeg required\n");
    process.exit(1);
  }
  const manifest = loadTrackManifest(ROOT);
  const only = process.argv[2];
  const tracks = only
    ? manifest.tracks.filter((t) => t.output_basename === only)
    : manifest.tracks;
  for (const track of tracks) {
    const id = track.output_basename;
    const rawDir = join(BOOK, "raw", id);
    if (!existsSync(rawDir)) {
      process.stdout.write(`skip assemble ${id}: no raw dir\n`);
      continue;
    }
    assembleTrack(id);
    process.stdout.write(`assembled ${id}\n`);
  }
}
