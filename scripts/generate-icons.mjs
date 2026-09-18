import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const publicDir = join(root, "../public");

const required = [
  "brand/pex-logo-primary.svg",
  "brand/pex-logo-primary-reverse.svg",
  "icons/pex-favicon.ico",
  "icons/pex-favicon-symbol-16.png",
  "icons/pex-favicon-symbol-32.png",
  "icons/pex-favicon-symbol-48.png",
  "icons/pex-favicon-symbol-64.png",
  "icons/pex-favicon-dark-16.png",
  "icons/pex-favicon-dark-32.png",
  "icons/pex-favicon-dark-48.png",
  "icons/pex-favicon-dark-64.png",
  "icons/pex-app-icon-dark-180.png",
  "icons/pex-app-icon-dark-192.png",
  "icons/pex-app-icon-dark-512.png",
  "icons/pex-app-icon-light-180.png",
  "icons/pex-app-icon-light-192.png",
  "icons/pex-app-icon-light-512.png",
];

const missing = required.filter((rel) => !existsSync(join(publicDir, rel)));
if (missing.length) {
  throw new Error(
    `Founder brand assets missing from public/: ${missing.join(", ")}. Copy from the approved pack; do not regenerate a substitute mark.`,
  );
}

const forbidden = ["icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
const leftover = forbidden.filter((rel) => existsSync(join(publicDir, rel)));
if (leftover.length) {
  throw new Error(`Placeholder generated mark still present: ${leftover.join(", ")}`);
}

console.log(`Verified ${required.length} founder brand files in public/.`);
