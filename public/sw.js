const CACHE_NAME = 'estate-contacts-v2';

// Install: activate immediately without caching files.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate: clear all old PWA caches, then take control.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();

  // Notify all clients about the update
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'SW_UPDATED' });
    });
  });
});

// Fetch: always use the network. Do not cache API, pages, or assets.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  event.respondWith(fetch(request));
});
