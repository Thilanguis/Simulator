// === efeitoBonusAtivo.js ===
// Ativa partículas douradas no fundo (fora do site) e dentro de cada .section
// somente quando #bonusEspecialCheckbox estiver marcado.

(function () {
  const checkbox = document.getElementById('bonusEspecialCheckbox');
  if (!checkbox) return;

  const sections = Array.from(document.querySelectorAll('.section'));

  let intervalGlobal = null;
  let intervalBlocks = null;

  // Partículas no fundo inteiro (fora do container)
  function spawnGlobalGlow() {
    const el = document.createElement('div');
    el.className = 'money-glow global';

    if (Math.random() < 0.18) el.classList.add('purple');

    el.style.setProperty('--x', Math.random() * 100);
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 6000);
  }

  // Partículas dentro de cada bloco .section
  function spawnBlockGlow() {
    sections.forEach((sec) => {
      if (!sec.classList.contains('bonus-inner-glow')) return;

      // controla densidade
      if (Math.random() > 0.5) return;

      const el = document.createElement('div');
      el.className = 'money-glow block';
      if (Math.random() < 0.18) el.classList.add('purple');

      el.style.setProperty('--x', Math.random() * 100);
      sec.appendChild(el);

      setTimeout(() => el.remove(), 6000);
    });
  }

  function startGlowEffect() {
    if (intervalGlobal || intervalBlocks) return;

    // brilho no fundo
    document.body.classList.add('bonus-bg-glow');

    // brilho em cada bloco
    sections.forEach((sec) => {
      sec.classList.add('bonus-inner-glow');
    });

    // intervalGlobal = setInterval(spawnGlobalGlow, 420);
    intervalBlocks = setInterval(spawnBlockGlow, 520);
  }

  function stopGlowEffect() {
    if (intervalGlobal) {
      clearInterval(intervalGlobal);
      intervalGlobal = null;
    }
    if (intervalBlocks) {
      clearInterval(intervalBlocks);
      intervalBlocks = null;
    }

    document.body.classList.remove('bonus-bg-glow');

    sections.forEach((sec) => {
      sec.classList.remove('bonus-inner-glow');
    });

    // Remove todas as partículas restantes
    document.querySelectorAll('.money-glow').forEach((el) => el.remove());
  }

  function handleToggle() {
    if (checkbox.checked) startGlowEffect();
    else stopGlowEffect();
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleToggle();
    checkbox.addEventListener('change', handleToggle);
  });

  window.addEventListener('pagehide', stopGlowEffect, { once: true });
})();
