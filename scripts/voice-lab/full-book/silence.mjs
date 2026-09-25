import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

/** Cedar raw chunks are 24 kHz mono PCM; match for lossless concat. */
export function createSilenceWav(outPath, durationMs, sampleRate = 24000) {
  const seconds = durationMs / 1000;
  const r = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=${sampleRate}:cl=mono`,
      "-t",
      String(seconds),
      "-c:a",
      "pcm_s16le",
      outPath,
    ],
    { encoding: "utf8" },
  );
  if (r.status !== 0 || !existsSync(outPath)) {
    throw new Error(`ffmpeg silence failed: ${r.stderr?.slice(0, 300)}`);
  }
  return { durationMs, sampleRate, path: outPath };
}
