const CACHE_PREFIX = "meta-pet-shell-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const PRECACHE_URLS = [
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon.svg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined)),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();

      // Existing visitors may still be controlled by the old cache-first worker.
      // Reload each open tab once after this worker activates so the browser
      // immediately requests the current app shell instead of the stale loader.
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      await Promise.all(
        windowClients.map((client) =>
          client.navigate(client.url).catch(() => undefined),
        ),
      );
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Never cache page navigations or Next.js build assets. Both must come from
  // the current deployment so an old service worker cannot pin the UI to a
  // loading shell or mismatched JavaScript chunks.
  if (request.mode === "navigate" || url.pathname.startsWith("/_next/")) {
    return;
  }

  if (!PRECACHE_URLS.includes(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    }),
  );
});
