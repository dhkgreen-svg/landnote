// Service Worker for ParkGolf All-in-One (파크골프 올인원) PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first pass-through handler satisfying Android Chromium PWA install criteria
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
