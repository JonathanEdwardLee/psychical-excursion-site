import { readFileSync } from "node:fs";
import { join } from "node:path";
import { countWordsInSegments, parseSpokenSegments, sha256, spokenOnly } from "../core.mjs";
import { applyChapter1HeadingPauses } from "./chapter1-pacing.mjs";

export function loadTrackManifest(root) {
  const path = join(root, "publication/audio/TRACK-MANIFEST.json");
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(manifest.tracks)) throw new Error("TRACK-MANIFEST.json missing tracks");
  return manifest;
}

export function resolveSessionScript(root, track) {
  const rel = track.session_script.replace(/^audio\//, "");
  return join(root, "publication/audio", rel);
}

export function loadTrackSpokenText(root, track) {
  const scriptPath = resolveSessionScript(root, track);
  const raw = readFileSync(scriptPath, "utf8");
  const spoken = spokenOnly(raw);
  let segments = parseSpokenSegments(spoken);
  let chapter1_pause_log = null;
  if (track.output_basename === "PEX-AUDIO-01-what-is-a-psychical-excursion") {
    const paced = applyChapter1HeadingPauses(segments);
    segments = paced.segments;
    chapter1_pause_log = paced.pause_log;
  }
  return {
    scriptPath,
    raw,
    spoken,
    segments,
    chapter1_pause_log,
    scriptSha256: sha256(raw),
    spokenSha256: sha256(spoken),
    words: countWordsInSegments(segments),
  };
}
