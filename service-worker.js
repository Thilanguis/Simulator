// The former Simulator site now forwards to the canonical Wallet-Simulator.
// Preserve browser storage and caches; stop serving the old application shell.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
