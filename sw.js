/* PEx application-shell service worker. Generated at build time. */
const CACHE_NAME = "pex-shell-muezywga";
const PRECACHE = ["/","/index.html","/assets/index-ND5VLHXS.css","/assets/index-qkn0u0fU.js","/brand/pex-logo-primary-reverse.svg","/brand/pex-logo-primary.svg","/icons/pex-app-icon-dark-180.png","/icons/pex-app-icon-dark-192.png","/icons/pex-app-icon-dark-512.png","/icons/pex-app-icon-light-180.png","/icons/pex-app-icon-light-192.png","/icons/pex-app-icon-light-512.png","/icons/pex-favicon-dark-16.png","/icons/pex-favicon-dark-32.png","/icons/pex-favicon-dark-48.png","/icons/pex-favicon-dark-64.png","/icons/pex-favicon-symbol-16.png","/icons/pex-favicon-symbol-32.png","/icons/pex-favicon-symbol-48.png","/icons/pex-favicon-symbol-64.png","/icons/pex-favicon.ico","/manifest.webmanifest"];

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
          cache.put("/index.html", fresh.clone());
          return fresh;
        } catch {
          const cached = (await caches.match("/index.html")) || (await caches.match("/"));
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
