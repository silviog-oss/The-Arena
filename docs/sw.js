/* The Arena — service worker
 *
 * • Precaches the full built app on install (list injected at build time).
 * • Serves the app shell offline (cache-first for assets, network-first for pages).
 * • Handles Web Push messages and notification clicks.
 */
const VERSION = 'muyd8ako';
const CACHE = `arena-${VERSION}`;
const PRECACHE = ["./.nojekyll","./assets/index-D1EU4DIm.css","./assets/index-SmRp9XC7.js","./favicon.png","./icons/apple-touch-icon.png","./icons/badge-96.png","./icons/icon-192.png","./icons/icon-512.png","./icons/logo-1024.png","./icons/maskable-512.png","./index.html","./logo.svg","./manifest.json","./"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(Array.isArray(PRECACHE) ? PRECACHE : ['./', './index.html']))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('arena-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first (to get updates), fall back to cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }

  // Assets: cache first, then network (and store for next time).
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

/* ───────── Web Push ─────────
 * Expected payload (JSON): { title, body, tag?, url? }
 */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  const title = data.title || 'The Arena';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Your daily mission is waiting.',
      tag: data.tag || 'arena',
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      data: { url: data.url || './' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
