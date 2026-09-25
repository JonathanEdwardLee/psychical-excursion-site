#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const releaseDir = path.join(process.cwd(), "release");

const ga4MeasurementId = "G-297PE2TV2R";
const allowedGa4TagSrc = `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`;

const forbiddenNetwork = [
  "googleadservices.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com/tr",
  "connect.facebook",
  "hotjar.com",
  "mixpanel.com",
  "segment.com",
  "amplitude.com",
  "sentry.io",
  "stripe.com",
  "paypal.com",
  "venmo.com",
  "buymeacoffee",
  "patreon.com",
  "googlesyndication",
  "adsense",
  "fbq(",
];

const forbiddenPrivate = [
  "fixture-ui-note",
  "fixture-text-only",
  "fixture-with-audio",
  "fixture-note-alpha",
  "fixture-privacy-note",
  "BEGIN PRIVATE KEY",
  "AKIA",
];

const appFetchForbidden = [
  "XMLHttpRequest",
  "navigator.sendBeacon",
  "new WebSocket",
];

function walkFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

if (!statSync(releaseDir).isDirectory()) {
  console.error("Missing release/ artifact.");
  process.exit(1);
}

const files = walkFiles(releaseDir);
const textFiles = files.filter((file) => {
  const name = path.basename(file);
  return /\.(html|js|css|webmanifest|txt)$/i.test(name) || name === ".htaccess";
});

let failed = false;
for (const file of textFiles) {
  const rel = path.relative(releaseDir, file);
  const text = readFileSync(file, "utf8");
  const isServiceWorker = rel === "sw.js";
  for (const token of forbiddenNetwork) {
    if (text.toLowerCase().includes(token.toLowerCase())) {
      console.error(`${rel} contains unexpected network/product token: ${token}`);
      failed = true;
    }
  }
  if (text.includes("googletagmanager.com") || text.includes("google-analytics.com") || /\bG-[A-Z0-9]+\b/.test(text)) {
    const ids = [...text.matchAll(/\bG-[A-Z0-9]+\b/g)].map((m) => m[0]);
    const hasAdsTag = /googleadservices|googlesyndication|\bGTM-/i.test(text);
    if (hasAdsTag || !text.includes(ga4MeasurementId) || ids.some((id) => id !== ga4MeasurementId)) {
      console.error(`${rel} contains analytics/tag hosts without the authorized Measurement ID ${ga4MeasurementId}.`);
      failed = true;
    }
    if (text.includes("googletagmanager.com") && !text.includes(allowedGa4TagSrc) && rel.endsWith(".html")) {
      console.error(`${rel} is missing the authorized GA4 tag URL.`);
      failed = true;
    }
  }
  if (text.includes("555962302") || text.includes("15841198465")) {
    console.error(`${rel} exposes GA4 property/stream administrative IDs.`);
    failed = true;
  }
  for (const token of forbiddenPrivate) {
    if (text.includes(token)) {
      console.error(`${rel} contains fixture/private token: ${token}`);
      failed = true;
    }
  }
  if (!isServiceWorker) {
    const allowsGoogleSync =
      text.includes("googleapis.com") &&
      text.includes("openidconnect.googleapis.com") &&
      text.includes("google-api-host-not-allowed");
    if (/\bfetch\s*\(/.test(text) && !allowsGoogleSync) {
      console.error(`${rel} contains fetch(); application JS must not transmit (except optional Google sync).`);
      failed = true;
    }
    for (const token of appFetchForbidden) {
      if (text.includes(token)) {
        console.error(`${rel} contains unexpected network API: ${token}`);
        failed = true;
      }
    }
  } else if (!text.includes("url.origin !== self.location.origin")) {
    console.error("sw.js must ignore cross-origin requests.");
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("Runtime privacy / unexpected-network verification passed.");
