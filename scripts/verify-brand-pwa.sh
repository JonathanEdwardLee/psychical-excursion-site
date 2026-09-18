#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"
MANIFEST="$RELEASE/manifest.webmanifest"

required=(
  "brand/pex-logo-primary.svg"
  "brand/pex-logo-primary-reverse.svg"
  "icons/pex-favicon.ico"
  "icons/pex-favicon-symbol-16.png"
  "icons/pex-favicon-symbol-32.png"
  "icons/pex-favicon-symbol-48.png"
  "icons/pex-favicon-symbol-64.png"
  "icons/pex-favicon-dark-16.png"
  "icons/pex-favicon-dark-32.png"
  "icons/pex-favicon-dark-48.png"
  "icons/pex-favicon-dark-64.png"
  "icons/pex-app-icon-dark-180.png"
  "icons/pex-app-icon-dark-192.png"
  "icons/pex-app-icon-dark-512.png"
  "icons/pex-app-icon-light-180.png"
  "icons/pex-app-icon-light-192.png"
  "icons/pex-app-icon-light-512.png"
)

forbidden=(
  "icons/icon.svg"
  "icons/icon-192.png"
  "icons/icon-512.png"
)

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing packaged manifest.webmanifest." >&2
  exit 1
fi

for path in "${required[@]}"; do
  if [[ ! -f "$RELEASE/$path" ]]; then
    echo "Founder brand/PWA file missing from release artifact: $path" >&2
    exit 1
  fi
  if [[ ! -s "$RELEASE/$path" ]]; then
    echo "Founder brand/PWA file is empty: $path" >&2
    exit 1
  fi
done

for path in "${forbidden[@]}"; do
  if [[ -e "$RELEASE/$path" ]]; then
    echo "Placeholder generated mark still present in release artifact: $path" >&2
    exit 1
  fi
done

python3 - <<'PY'
import json, sys
from pathlib import Path
manifest_path = Path("release/manifest.webmanifest")
manifest = json.loads(manifest_path.read_text())
required_icons = {
    "/icons/pex-app-icon-dark-192.png",
    "/icons/pex-app-icon-dark-512.png",
    "/icons/pex-app-icon-light-192.png",
    "/icons/pex-app-icon-light-512.png",
    "/icons/pex-app-icon-dark-180.png",
    "/icons/pex-app-icon-light-180.png",
}
found = {icon.get("src") for icon in manifest.get("icons", [])}
missing = sorted(required_icons - found)
if missing:
    print("Manifest is missing founder PWA icons:", ", ".join(missing), file=sys.stderr)
    sys.exit(1)
if manifest.get("name") != "Psychical Excursion" or manifest.get("short_name") != "PEx":
    print("Manifest name/short_name drifted from founder brand.", file=sys.stderr)
    sys.exit(1)
if manifest.get("display") != "standalone":
    print("Manifest display must remain standalone.", file=sys.stderr)
    sys.exit(1)
index_html = Path("release/index.html").read_text()
if "/icons/pex-favicon.ico" not in index_html:
    print("index.html must reference founder favicon.", file=sys.stderr)
    sys.exit(1)
if "/icons/pex-app-icon-dark-180.png" not in index_html:
    print("index.html must reference founder apple-touch-icon.", file=sys.stderr)
    sys.exit(1)
sw = Path("release/sw.js").read_text()
for token in ("/manifest.webmanifest", "/icons/pex-app-icon-dark-192.png", "/brand/pex-logo-primary.svg"):
    if token not in sw:
        print(f"Service worker precache is missing {token}", file=sys.stderr)
        sys.exit(1)
print("Founder brand/PWA verification passed.")
PY
