const VERSION = '__BUILD_VERSION__';
const PREFIX = 'findom-wallet-' + new URL(self.registration.scope).pathname + '-';
const CACHE = PREFIX + VERSION;
const ASSETS = /*__PRECACHE__*/ [];
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ASSETS.map((path) => new Request(new URL(path, self.registration.scope), { cache: 'reload' })));
    })(),
  );
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'VERSION') event.ports[0]?.postMessage(VERSION);
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      for (const name of names) {
        if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
        else if (name.startsWith('simulador-cache-')) {
          const old = await caches.open(name);
          if (await old.match(new URL('index.html', self.registration.scope))) await caches.delete(name);
        }
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (!event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const shell = await cache.match(new URL('index.html', self.registration.scope));
        if (shell) return shell;
      }
      return fetch(event.request);
    })(),
  );
});
