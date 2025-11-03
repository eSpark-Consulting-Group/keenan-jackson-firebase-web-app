/* eslint-env serviceworker */

const CACHE_NAME = "square-trivia-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/manifest.json",
  "/screenshots/game-board.png",
  "/screenshots/trivia-question.png",
  "/screenshots/tier-selection.png",
];

// Install service worker and pre-cache assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching essential assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Activate service worker and remove old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  console.log("Service Worker: Activated and old cache cleared");
  self.clients.claim(); // Take control of open pages
});

// Fetch handler — use cache-first, then network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET requests (like POST to APIs)
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Cache dynamic assets for next time
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Optional: return a fallback page/image if offline
          if (request.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// Optional: listen for update messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
