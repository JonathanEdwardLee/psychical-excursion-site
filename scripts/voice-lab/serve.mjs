#!/usr/bin/env node
/** Loopback-only static server for the Voice Lab HTML. No score upload. */
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DIR = join(ROOT, "publication/audio/voice-lab");
const TYPES = { ".html": "text/html", ".md": "text/plain", ".json": "application/json", ".js": "text/javascript" };

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }
  const rel = decodeURIComponent((req.url ?? "/").split("?")[0]);
  const name = rel === "/" ? "lab.html" : rel.replace(/^\//, "");
  const path = normalize(join(DIR, name));
  if (!path.startsWith(DIR) || !existsSync(path)) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
  res.end(readFileSync(path));
});

server.listen(4177, "127.0.0.1", () => {
  process.stdout.write("Voice Lab http://127.0.0.1:4177/ (loopback only)\n");
});
