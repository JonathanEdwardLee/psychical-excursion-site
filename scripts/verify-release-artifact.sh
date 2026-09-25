#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"

required=(
  "index.html"
  ".htaccess"
  "SOURCE_SHA.txt"
  "sitemap.xml"
  "robots.txt"
  "psychical-excursion/index.html"
  "dream-recall/index.html"
  "lucid-dream-experiments/index.html"
  "out-of-body-experience-body-ownership/index.html"
  "astral-projection-obe-techniques/index.html"
  "testing-out-of-body-experiences/index.html"
  "lucid-dreaming-vs-astral-projection/index.html"
  "sun-moon-planets-sleep-dreams/index.html"
  "synchronicity-recurring-shared-dreams/index.html"
  "lucid-dreaming-astral-projection-bedtime-routine/index.html"
  "manifest.webmanifest"
  "sw.js"
  "brand/pex-logo-primary.svg"
  "brand/pex-logo-primary-reverse.svg"
  "icons/pex-favicon.ico"
  "icons/pex-app-icon-dark-192.png"
  "icons/pex-app-icon-dark-512.png"
  "icons/pex-app-icon-light-192.png"
  "icons/pex-app-icon-light-512.png"
  "icons/pex-app-icon-dark-180.png"
)

forbidden=(
  "src"
  "tests"
  "node_modules"
  "package.json"
  "package-lock.json"
  "tsconfig.json"
  "eslint.config.js"
  "vitest.config.ts"
  "vite.config.ts"
  "scripts"
  ".git"
  ".env"
  "docs"
  "brand/SOURCE.txt"
)

if [[ ! -d "$RELEASE" ]]; then
  echo "Missing release/ artifact. Run npm run build && npm run package:release first." >&2
  exit 1
fi

for path in "${required[@]}"; do
  if [[ ! -e "$RELEASE/$path" ]]; then
    echo "Missing required release artifact path: $path" >&2
    exit 1
  fi
done

if ! find "$RELEASE/assets" -type f \( -name '*.js' -o -name '*.css' \) | grep -q .; then
  echo "Missing hashed assets/ in release artifact." >&2
  exit 1
fi

for path in "${forbidden[@]}"; do
  if [[ -e "$RELEASE/$path" ]]; then
    echo "Forbidden path present in release artifact: $path" >&2
    exit 1
  fi
done

if find "$RELEASE" -type f -name '*.map' | grep -q .; then
  echo "Source maps must not be published in the release artifact." >&2
  find "$RELEASE" -type f -name '*.map' >&2
  exit 1
fi

if find "$RELEASE" -type f \( -name '*.ts' -o -name '*.tsx' \) | grep -q .; then
  echo "TypeScript source files must not be present in the release artifact." >&2
  find "$RELEASE" -type f \( -name '*.ts' -o -name '*.tsx' \) >&2
  exit 1
fi

if ! grep -q 'source_sha=' "$RELEASE/SOURCE_SHA.txt"; then
  echo "SOURCE_SHA.txt must record source provenance." >&2
  exit 1
fi

if grep -q 'RewriteRule ^$ /psychical-excursion/' "$RELEASE/.htaccess"; then
  echo "Root must not 301 to the introduction." >&2
  exit 1
fi

sitemap_count="$(grep -c '<loc>' "$RELEASE/sitemap.xml" || true)"
if [[ "$sitemap_count" != "24" ]]; then
  echo "sitemap.xml must contain 24 canonical URLs, found ${sitemap_count}." >&2
  exit 1
fi
if grep -q '#' "$RELEASE/sitemap.xml"; then
  echo "sitemap.xml must not contain hash URLs." >&2
  exit 1
fi
if ! grep -q 'https://psychicalexcursion.com/</loc>' "$RELEASE/sitemap.xml"; then
  echo "sitemap.xml must include the root homepage." >&2
  exit 1
fi
if ! grep -q 'rel="canonical" href="https://psychicalexcursion.com/"' "$RELEASE/index.html"; then
  echo "Root index.html must canonicalize to https://psychicalexcursion.com/." >&2
  exit 1
fi

echo "Release artifact layout verification passed."
