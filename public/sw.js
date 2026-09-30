// Minimal app-shell service worker.
//
// Strategy: cache-first-with-background-refresh (stale-while-revalidate) for
// same-origin GET requests. This makes the NeuraGuard routes (charter,
// ledger, lab, decode) and their static assets/JS/CSS available offline
// after a first successful load. NeuraProbe's sensor pages still load their
// JS/CSS shell offline, but obviously can't do anything useful without live
// hardware access.
const CACHE_NAME = "neuraguard-shell-v2";
const CORE_ASSETS = [
  "/",
  "/charter",
  "/ledger",
  "/lab",
  "/decode",
  "/probe",
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url))))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    })
  );
});
