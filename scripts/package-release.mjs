#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const releaseDir = path.join(root, "release");
const htaccess = path.join(root, "deploy", ".htaccess");

if (!existsSync(path.join(distDir, "index.html"))) {
  console.error("Missing Vite build output at dist/. Run npm run build first.");
  process.exit(1);
}

function sourceSha() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function copyWithoutMaps(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.name.endsWith(".map")) continue;
    if (entry.name === ".git") continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyWithoutMaps(src, dest);
    } else {
      cpSync(src, dest);
    }
  }
}

rmSync(releaseDir, { recursive: true, force: true });
copyWithoutMaps(distDir, releaseDir);
cpSync(htaccess, path.join(releaseDir, ".htaccess"));

const sha = sourceSha();
writeFileSync(
  path.join(releaseDir, "SOURCE_SHA.txt"),
  [
    "Psychical Excursion runtime artifact",
    "source_repository=JonathanEdwardLee/psychical-excursion-site",
    `source_sha=${sha}`,
    "branch_after_publish=hostinger-deploy",
    "",
  ].join("\n"),
);

const indexHtml = path.join(releaseDir, "index.html");
if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
  console.error("Packaged release is missing index.html.");
  process.exit(1);
}

console.log(`Packaged runtime artifact at release/ from source ${sha}`);
