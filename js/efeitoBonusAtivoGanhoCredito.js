// === efeitoBonusAtivo.js ===
// Ativa partículas douradas no fundo (fora do site) e dentro de cada .section
// SOMENTE quando #bonusEspecialCheckbox estiver marcado.
// Também expõe getBonusEspecialMultiplier() para aplicar BÔNUS em GANHOS (x1.3 por padrão).

// --- Bootstrap do bônus (garante constantes e estado) ---
// ⚠️ Importante: bônus de GANHO precisa ser > 1. Use 1.3 para +30%.
// (0.85 seria desconto de 15%, não bônus.)
window.BONUS_ESPECIAL_MULTIPLIER = typeof BONUS_ESPECIAL_MULTIPLIER === 'number' ? BONUS_ESPECIAL_MULTIPLIER : 1.3;

const BONUS_KEY = 'bonusEspecialAtivo';

// Se ainda não houver, carrega do storage (antes de qualquer uso)
if (typeof window.bonusEspecialAtivo === 'undefined') {
  try {
    window.bonusEspecialAtivo = !!JSON.parse(localStorage.getItem(BONUS_KEY) || 'false');
  } catch {
    window.bonusEspecialAtivo = false;
  }
}

// usa 1.3 se não houver constante; garante que seja > 1 (bônus)
const presetGanho = Number(typeof BONUS_GANHO_MULTIPLIER !== 'undefined' ? BONUS_GANHO_MULTIPLIER : 1.3);
window.BONUS_ESPECIAL_MULTIPLIER = presetGanho > 1 ? presetGanho : 1.3;

window.getBonusEspecialMultiplier = function () {
  return window.bonusEspecialAtivo ? window.BONUS_ESPECIAL_MULTIPLIER : 1;
};

(function () {
  let sections = [];
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
      if (Math.random() > 0.5) return; // controla densidade
      const el = document.createElement('div');
      el.className = 'money-glow block';
      if (Math.random() < 0.18) el.classList.add('purple');
      el.style.setProperty('--x', Math.random() * 100);
      sec.appendChild(el);
      setTimeout(() => el.remove(), 6000);
    });
  }

  function syncFire(chk) {
    try {
      if (!window.EdgeFire) return;
      if (chk && chk.checked) window.EdgeFire.enable();
      else window.EdgeFire.disable();
    } catch {}
  }

  function startGlowEffect() {
    if (intervalGlobal || intervalBlocks) return;
    document.body.classList.add('bonus-bg-glow');
    sections.forEach((sec) => sec.classList.add('bonus-inner-glow'));

    // Se quiser o fundo global, descomente:
    // intervalGlobal = setInterval(spawnGlobalGlow, 420);

    intervalBlocks = setInterval(spawnBlockGlow, 520); // ✅ corrigido (antes estava "spawnBlockGalow")
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
    sections.forEach((sec) => sec.classList.remove('bonus-inner-glow'));
    document.querySelectorAll('.money-glow').forEach((el) => el.remove());
  }

  // Inicializa só quando o DOM estiver pronto (evita "return" precoce)
  function init() {
    const checkbox = document.getElementById('bonusEspecialCheckbox');
    sections = Array.from(document.querySelectorAll('.section'));

    // Se não existir, não quebra o arquivo (só não ativa o efeito)
    if (!checkbox) return;

    // Estado inicial refletindo o storage
    checkbox.checked = !!window.bonusEspecialAtivo;

    // EdgeFire (fogo nas laterais) sincronizado ao bônus
    syncFire(checkbox);
    checkbox.addEventListener('change', () => syncFire(checkbox));

    // Sincroniza bônus ⇄ storage ⇄ UI
    const applyBonusStateToUI = () => {
      window.bonusEspecialAtivo = !!checkbox.checked;
      try {
        localStorage.setItem(BONUS_KEY, JSON.stringify(window.bonusEspecialAtivo));
      } catch {}
      // Sua UI (badge/labels/banners) se existir
      window.updateBonusEspecialUI();
    };

    // Aplica estado atual e liga/desliga efeitos visuais
    function handleToggle() {
      applyBonusStateToUI();
      if (checkbox.checked) startGlowEffect();
      else stopGlowEffect();
    }

    // Inicial
    handleToggle();

    // Mudanças
    checkbox.addEventListener('change', handleToggle);

    // Limpeza ao sair da página
    window.addEventListener('pagehide', stopGlowEffect, { once: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
