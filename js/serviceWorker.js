/* Updates wait for an explicit user choice. No storage is cleared. */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' });
      let reloading = false;
      const banner = document.getElementById('updateBanner');
      function offer() {
        banner.hidden = false;
        if (registration.waiting) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => (document.getElementById('updateVersion').textContent = 'Nova versão disponível: ' + event.data);
          registration.waiting.postMessage({ type: 'VERSION' }, [channel.port2]);
        }
      }
      if (registration.waiting) offer();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offer();
        });
      });
      document.getElementById('updateLater').onclick = () => (banner.hidden = true);
      document.getElementById('updateNow').onclick = () => {
        try {
          syncTimer();
          persistTimer();
          AppStorage.flush();
          reloading = true;
          if (registration.waiting) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          else location.reload();
        } catch (error) {
          storageFailure(error);
        }
      };
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) location.reload();
        else if (navigator.serviceWorker.controller && registration.active) {
          // First install needs no reload. A changed controller in another tab is offered explicitly.
          if (window.__hadController) offer();
        }
        window.__hadController = true;
      });
      window.__hadController = !!navigator.serviceWorker.controller;
      let lastCheck = Date.now();
      async function check() {
        if (Date.now() - lastCheck < 60000) return;
        lastCheck = Date.now();
        try {
          await registration.update();
        } catch {}
      }
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) check();
      });
      setInterval(check, 5 * 60 * 1000);
      document.getElementById('checkUpdate').onclick = async () => {
        try {
          await registration.update();
          document.getElementById('backupMessage').textContent = registration.waiting ? 'Atualização pronta para instalar.' : 'Verificação concluída. Nenhuma atualização pronta no momento.';
          if (registration.waiting) offer();
        } catch {
          document.getElementById('backupMessage').textContent = 'Não foi possível verificar a atualização. Confira a conexão.';
        }
      };
    } catch (error) {
      console.warn('PWA indisponível:', error);
      document.getElementById('backupMessage').textContent = 'PWA indisponível. O cadastro local continua disponível. ' + error.message;
    }
  });
}
