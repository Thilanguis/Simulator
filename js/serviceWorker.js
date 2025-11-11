/* =================================================================== */
/* SERVICE WORKER (PWA)                         */
/* =================================================================== */

// Dentro do seu arquivo serviceWorker.js ou script de registro
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js', { scope: './' })
    .then(function (registration) {
      console.log('ServiceWorker registrado com sucesso no escopo: ', registration.scope);
    })
    .catch(function (err) {
      console.warn('Falha no registro do ServiceWorker: ', err);
    });
}
