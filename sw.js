/* PEx application-shell service worker. Generated at build time. */
const CACHE_NAME = "pex-shell-muh5xpx4";
const PRECACHE = ["/","/index.html","/assets/index-C5-K9JsM.css","/assets/index-Dyzi6wtU.js","/astral-projection-obe-techniques/index.html","/attention-body-awareness/index.html","/body-scan-meditation/index.html","/brand/pex-logo-primary-reverse.svg","/brand/pex-logo-primary.svg","/dream-awareness-signs/index.html","/dream-recall/index.html","/energy-sensations-meditation/index.html","/entering-a-lucid-dream/index.html","/hypnagogia-lucid-dreaming/index.html","/icons/pex-app-icon-dark-180.png","/icons/pex-app-icon-dark-192.png","/icons/pex-app-icon-dark-512.png","/icons/pex-app-icon-light-180.png","/icons/pex-app-icon-light-192.png","/icons/pex-app-icon-light-512.png","/icons/pex-favicon-dark-16.png","/icons/pex-favicon-dark-32.png","/icons/pex-favicon-dark-48.png","/icons/pex-favicon-dark-64.png","/icons/pex-favicon-symbol-16.png","/icons/pex-favicon-symbol-32.png","/icons/pex-favicon-symbol-48.png","/icons/pex-favicon-symbol-64.png","/icons/pex-favicon.ico","/lucid-dream-experiments/index.html","/lucid-dream-stabilization/index.html","/lucid-dreaming-astral-projection-bedtime-routine/index.html","/lucid-dreaming-reality-checks/index.html","/lucid-dreaming-vs-astral-projection/index.html","/manifest.webmanifest","/meditation-for-lucid-dreaming/index.html","/mind-awake-body-asleep/index.html","/motor-imagery-lucid-dreaming/index.html","/out-of-body-experience-body-ownership/index.html","/out-of-body-sensations-sleep/index.html","/psychical-excursion/index.html","/robots.txt","/sitemap.xml","/sun-moon-planets-sleep-dreams/index.html","/synchronicity-recurring-shared-dreams/index.html","/testing-out-of-body-experiences/index.html","/visualization-hypnagogic-imagery/index.html"];

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
                || (await caches.match("/"))
                || (await caches.match("/index.html"))
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
