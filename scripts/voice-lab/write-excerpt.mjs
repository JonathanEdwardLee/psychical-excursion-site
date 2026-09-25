#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chapter10Path, loadChapter10FromFs, selectPilotExcerpt } from "./core.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "publication/audio/voice-lab");

const raw = loadChapter10FromFs(chapter10Path(ROOT));
const selected = selectPilotExcerpt(raw);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "EXCERPT.md"), `${selected.excerpt}\n`);
writeFileSync(
  join(OUT, "excerpt-manifest.json"),
  `${JSON.stringify({
    source: "publication/audio/session-scripts/10-watch-the-edge.md",
    words: selected.words,
    excerpt_sha256: selected.sha256,
    source_script_sha256: selected.sourceSha256,
    planning_minutes_at_150wpm: Math.round((selected.words / 150) * 10) / 10,
    includes: ["research exposition", "humor", "EEG/hypnagogia", "reflective question", "sleep-onset instruction"],
  }, null, 2)}\n`,
);
process.stdout.write(`Excerpt ${selected.words} words, sha256 ${selected.sha256.slice(0, 12)}…\n`);
