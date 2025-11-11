// === efeitoBonusAtivo.js ===
// Brilho dourado + roxo subindo pelo fundo — ativo somente quando o bônus está marcado.

(function () {
  const checkbox = document.getElementById('bonusEspecialCheckbox');
  if (!checkbox) return;

  let intervalId = null;

  function spawnGlow() {
    const el = document.createElement('div');
    el.className = 'money-glow';

    // 1 em cada 5 partículas sai roxa
    if (Math.random() < 0.2) el.classList.add('purple');

    el.style.setProperty('--x', Math.random() * 100);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }

  function startGlowEffect() {
    if (intervalId) return;
    document.body.classList.add('bonus-inner-glow');
    intervalId = setInterval(spawnGlow, 400);
  }

  function stopGlowEffect() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    document.body.classList.remove('bonus-inner-glow');
    document.querySelectorAll('.money-glow').forEach((el) => el.remove());
  }

  function handleToggle() {
    if (checkbox.checked) startGlowEffect();
    else stopGlowEffect();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (checkbox.checked) startGlowEffect();
    checkbox.addEventListener('change', handleToggle);
  });

  window.addEventListener('pagehide', stopGlowEffect, { once: true });
})();
