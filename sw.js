/* ==========================================================================
   IRON DIARY · sw.js
   Offline-first Service Worker for GitHub Pages and local PWA execution.
   ========================================================================== */
const CACHE = 'iron-diary-v5';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './img/bg-deadlift.jpg',
  './img/bg-squat.jpg',
  './img/bg-barbell.jpg',
  './img/bg-physique.jpg',
  './js/app.js',
  './js/engine.js',
  './js/program.js',
  './js/store.js',
  './js/timer.js',
  './js/ui.js',
  './js/session.js',
  './js/views/training.js',
  './js/views/protocols.js',
  './js/views/readiness.js',
  './js/views/nutrition.js',
  './js/views/analytics.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
