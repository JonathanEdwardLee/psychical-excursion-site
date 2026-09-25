import catalog from "./src/content/guidebookCatalog.json";
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function listFiles(dir: string, prefix = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === "sw.js") continue;
    if (entry.name.endsWith(".map")) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFiles(join(dir, entry.name), rel));
    } else {
      files.push(`/${rel}`);
    }
  }
  return files;
}

function pexServiceWorker(): Plugin {
  let outDir = "dist";
  return {
    name: "pex-service-worker",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      execFileSync("node", ["scripts/generate-guidebook-seo.mjs", resolve(outDir)], {
        cwd: process.cwd(),
        stdio: "inherit",
      });
      const files = listFiles(outDir);
      const precache = Array.from(new Set(["/", "/index.html", ...files]));
      const buildId = `pex-shell-${Date.now().toString(36)}`;
      const source = `/* PEx application-shell service worker. Generated at build time. */
const CACHE_NAME = ${JSON.stringify(buildId)};
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PEX_SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

      if (request.mode === "navigate") {
        event.respondWith(
          (async () => {
            try {
              const fresh = await fetch(request);
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, fresh.clone());
              return fresh;
            } catch {
              const cached = (await caches.match(request))
                || (await caches.match("/psychical-excursion/"))
                || (await caches.match("/psychical-excursion/index.html"));
              if (cached) return cached;
              return Response.error();
            }
          })()
        );
        return;
      }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    })()
  );
});
`;
      writeFileSync(resolve(outDir, "sw.js"), source);
    },
  };
}

function guidebookDevFallback(): Plugin {
  const prefixes = catalog.pages.map((page) => page.path.replace(/\/$/, ""));
  return {
    name: "guidebook-dev-paths",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = (req.url ?? "").split("?")[0] ?? "";
        if (prefixes.some((prefix) => url === prefix || url === `${prefix}/` || url.startsWith(`${prefix}/`))) {
          req.url = "/";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [guidebookDevFallback(), pexServiceWorker()],
  build: {
    // Production artifact is public on the real domain. Do not ship source maps.
    sourcemap: false,
    // Single hashed app chunk; skip Vite's modulepreload polyfill so application JS
    // does not contain a fetch() helper.
    modulePreload: { polyfill: false },
  },
});
