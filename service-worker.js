// sw.js
// IMPORTANTE: Mude para a próxima versão (ex: v26)
const CACHE_NAME = 'simulador-cache-13';
const urlsToCache = [
  '.',
  'index.html', // --- CSS ---
  'css/app.css', // CORRIGIDO
  'css/bonusAtivoGPT.css', // CORRIGIDO // --- JAVASCRIPT ---
  'js/storage.js', // CORRIGIDO
  'js/utils.js', // CORRIGIDO
  'js/bonusEspecial.js', // CORRIGIDO
  'js/ganhoFixo.js', // CORRIGIDO
  'js/tarefasPendentes.js', // CORRIGIDO
  'js/appMain.js', // CORRIGIDO
  'js/app.js', // CORRIGIDO (se for usado)
  'js/efeitoBonusAtivo.js', // CORRIGIDO
  'js/splashAmimacao.js', // CORRIGIDO
  'js/chovendoGrana.js', // CORRIGIDO
  'js/timer.js', // INCLUÍDO (Estava no index.html mas não no sw.js)
  'js/serviceWorker.js', // INCLUÍDO (Estava no index.html mas não no sw.js) // --- MÍDIA E ÍCONES ---
  'icon-512.jpg', // CORRIGIDO
  'icon-192.png', // CORRIGIDO
  'manifest.json', // CORRIGIDO
];

// O restante do código pode permanecer o mesmo

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of urlsToCache) {
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (res && res.ok) {
            await cache.put(url, res.clone());
          } else {
            console.warn('SW install: recurso não encontrado (ignorado):', url, res && res.status);
          }
        } catch (err) {
          console.warn('SW install: erro ao buscar (ignorado):', url, err);
        }
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request).then((r) => r || fetch(event.request)));
});
