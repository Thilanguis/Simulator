const VERSION = '2.0.0-dee3aaddf5-gh1';
const PREFIX = 'findom-wallet-' + new URL(self.registration.scope).pathname + '-';
const CACHE = PREFIX + VERSION;
const ASSETS = ["css/app.css","css/bonusAtivoGPT.css","css/bonusAtivoGPTold.css","css/chicote.css","css/luzLateral.css","css/modern.css","icon-192.png","icon-512.jpg","index.html","js/AA_testeCodigoDiff.js","js/acceleration.js","js/appMain.js","js/backup.js","js/bonusEspecial.js","js/chicote.js","js/chovendoGrana.js","js/cloud-cipher.js","js/cloud-sync.js","js/cloud-ui.js","js/contract-rules.js","js/contract-view.js","js/dialogs.js","js/economy-catalog.js","js/economy-config.js","js/economy-ui.js","js/economy.js","js/efeitoBonusAtivo.js","js/efeitoBonusAtivoCompraServico.js","js/efeitoBonusAtivoGanhoCredito.js","js/finance-list.js","js/finance-ui.js","js/finance.js","js/firebase-transport.js","js/ganhoFixo.js","js/history-view.js","js/luzLateral.js","js/navigation-presentation.js","js/ocr.js","js/persistence.js","js/receipt.js","js/redemptions-ui.js","js/redemptions.js","js/roleta.js","js/roulette-rewards.js","js/serviceWorker.js","js/splashAmimacao.js","js/storage.js","js/tarefasPendentes.js","js/temp.js","js/timer.js","js/transaction-presentation.js","js/utils.js","js/vault.js","js/wallet-presentation.js","manifest.json","💎 Contrato de Submissão e Resgate de Saldo.pdf"];
// Live Server serves editable source files. Avoid stale caches during local review.
const LIVE_SERVER = ['127.0.0.1', 'localhost'].includes(self.location.hostname) && self.location.port === '5501';
self.addEventListener('install', (event) => {
  if (LIVE_SERVER) {
    event.waitUntil(self.skipWaiting());
    return;
  }
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
  if (LIVE_SERVER) {
    event.waitUntil(self.clients.claim());
    return;
  }
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
  if (LIVE_SERVER) return;
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
