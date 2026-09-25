import { readFileSync } from "node:fs";
import { join } from "node:path";
import { countWordsInSegments, parseSpokenSegments, sha256, spokenOnly } from "../core.mjs";

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
  const segments = parseSpokenSegments(spoken);
  return {
    scriptPath,
    raw,
    spoken,
    segments,
    scriptSha256: sha256(raw),
    spokenSha256: sha256(spoken),
    words: countWordsInSegments(segments),
  };
}
