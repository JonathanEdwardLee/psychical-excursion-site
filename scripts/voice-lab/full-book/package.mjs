#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { loadTrackManifest } from "./tracks.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const BOOK = join(ROOT, "local/voice-lab/full-book");
const STAGING = join(BOOK, "package-staging");

function sha256File(path) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(path)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

const DISCLOSURE = `Psychical Excursion — AI narration disclosure

This audiobook narration was generated using artificial intelligence (OpenAI text-to-speech, voice "Cedar").
It is not a recording of Jonathan Lee's natural speaking voice.

Written by Jonathan Lee.
`;

const README = `Psychical Excursion — Audiobook (direct download)

MP3 chapter files are numbered for sort order. Listen in filename order.

For source notes and citations, see the print or ebook edition.
`;

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  await (async () => {
  const manifest = loadTrackManifest(ROOT);
  rmSync(STAGING, { recursive: true, force: true });
  mkdirSync(STAGING, { recursive: true });
  const entries = [];
  for (const track of manifest.tracks) {
    const src = join(BOOK, "delivery", `${track.output_basename}.mp3`);
    if (!existsSync(src)) {
      process.stderr.write(`Missing delivery file: ${src}\n`);
      process.exit(1);
    }
    const destName = `${String(track.sequence).padStart(2, "0")}-${track.output_basename}.mp3`;
    const dest = join(STAGING, destName);
    writeFileSync(dest, readFileSync(src));
    entries.push({ file: destName, track: track.output_basename });
  }
  writeFileSync(join(STAGING, "README.txt"), README);
  writeFileSync(join(STAGING, "AI-NARRATION-DISCLOSURE.txt"), DISCLOSURE);
  writeFileSync(
    join(STAGING, "SOURCE-NOTES.txt"),
    "Full source notes appear in the print and ebook editions of Psychical Excursion.\n",
  );

  const hashes = {};
  for (const name of readdirSync(STAGING)) {
    hashes[name] = await sha256File(join(STAGING, name));
  }
  const packageMeta = {
    created_at: new Date().toISOString(),
    zip_name: "Psychical-Excursion-Audiobook-v1.zip",
    files: entries,
    sha256: hashes,
  };
  writeFileSync(join(BOOK, "PACKAGE-MANIFEST.json"), `${JSON.stringify(packageMeta, null, 2)}\n`);

  const zipOut = join(BOOK, "Psychical-Excursion-Audiobook-v1.zip");
  if (process.platform === "win32") {
    spawnSync(
      "powershell",
      ["-Command", `Compress-Archive -Path '${STAGING}\\*' -DestinationPath '${zipOut}' -Force`],
      { stdio: "inherit" },
    );
  } else {
    spawnSync("zip", ["-r", zipOut, "."], { cwd: STAGING, stdio: "inherit" });
  }
  const zipHash = await sha256File(zipOut);
  packageMeta.zip_sha256 = zipHash;
  packageMeta.zip_bytes = readFileSync(zipOut).length;
  writeFileSync(join(BOOK, "PACKAGE-MANIFEST.json"), `${JSON.stringify(packageMeta, null, 2)}\n`);
  writeFileSync(
    join(ROOT, "publication/audio/AUDIOBOOK-PACKAGE-MANIFEST.json"),
    `${JSON.stringify({ ...packageMeta, zip_path_gitignored: "local/voice-lab/full-book/Psychical-Excursion-Audiobook-v1.zip" }, null, 2)}\n`,
  );
  process.stdout.write(`Package ${zipOut} sha256=${zipHash}\n`);
  })();
}
