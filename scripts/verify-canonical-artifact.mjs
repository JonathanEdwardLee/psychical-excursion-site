#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const releaseDir = path.join(root, "release");
const canonicalPath = path.join(root, "src", "content", "canonical.ts");
const knownRevision =
  "ANLCKQk1sCjAcWQUDnd6ERHm2I9LDaK3RYhzPS4K_Zqk6WunObJ94DOxIwPF50TAuakdTGi39KFiFr7FK-MeRFw5D5vXdxcwyrsDKsg-9dQ";

function walkFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

const source = readFileSync(canonicalPath, "utf8");
const titles = [...source.matchAll(/"title": "([^"]+)"/g)].map((match) => match[1]);
if (titles.length !== 60) {
  console.error(`Expected 60 canonical titles in source packet, found ${titles.length}.`);
  process.exit(1);
}

const revisionMatch = source.match(/EXPECTED_PACKET_REVISION\s*=\s*"([^"]+)"/);
if (!revisionMatch) {
  console.error("Could not read EXPECTED_PACKET_REVISION from canonical source.");
  process.exit(1);
}
if (revisionMatch[1] !== knownRevision) {
  console.error("Canonical packet revision drifted from the accepted Primary transport.");
  process.exit(1);
}

if (!statSync(releaseDir).isDirectory()) {
  console.error("Missing release/ artifact.");
  process.exit(1);
}

const textFiles = walkFiles(releaseDir).filter((file) => {
  const name = path.basename(file);
  return /\.(html|js|css|webmanifest|txt)$/i.test(name) || name === ".htaccess";
});
const corpus = textFiles.map((file) => readFileSync(file, "utf8")).join("\n");

const missingTitles = titles.filter((title) => !corpus.includes(title));
if (missingTitles.length) {
  console.error("Runtime artifact is missing canonical day titles:", missingTitles.join(", "));
  process.exit(1);
}

const requiredSnippets = [
  knownRevision,
  "CATCH THE DREAM",
  "Start with recall. Do not try to change your dreams yet. Catch what is already there.",
  "INDEPENDENT ATTEMPT",
  "canonical-packet",
];
for (const snippet of requiredSnippets) {
  if (!corpus.includes(snippet)) {
    console.error(`Runtime artifact is missing canonical snippet: ${snippet}`);
    process.exit(1);
  }
}

const forbidden = ["DEVELOPMENT FIXTURE", "development-fixture", "https:/https://"];
for (const token of forbidden) {
  if (corpus.includes(token)) {
    console.error(`Runtime artifact contains forbidden curriculum token: ${token}`);
    process.exit(1);
  }
}

console.log("Canonical 60-day integrity verification passed.");
