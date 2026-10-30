/* Economia do jogo: escala apenas NOVAS operações, sem reescrever histórico. */
(function () {
  'use strict';
  const KEY = 'simulatorEconomyFactorV1';
  const ALLOWED = [0.05, 0.1, 0.2, 1];
  const money = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  let factor = Number(localStorage.getItem(KEY) || 0.1);
  if (!ALLOWED.includes(factor)) factor = 0.1;

  window.EconomiaSimulada = {
    getFator: () => factor,
    valor: (original) => round(Number(original) * factor),
  };

  function atualizarPrecos() {
    document.querySelectorAll('#selectTarefa option').forEach((opt) => {
      if (!opt.value || opt.value === '0') return;
      if (!opt.dataset.precoBase) {
        opt.dataset.precoBase = String(parseFloat(opt.value.split('|')[0]) || 0);
        opt.dataset.textoBase = opt.textContent;
      }
      const partes = opt.value.split('|');
      const novo = round(Number(opt.dataset.precoBase) * factor);
      partes[0] = String(novo);
      opt.value = partes.join('|');
      // Conserva a descrição original, substituindo somente o preço final.
      const base = opt.dataset.textoBase;
      const texto = base.replace(/(—\s*)R\$\s*[\d.,]+\s*$/, (all, prefixo) => prefixo + money(novo));
      opt.dataset.labelOriginal = texto;
      opt.textContent = opt.disabled ? '🔒 ' + texto : texto;
    });

    if (typeof FIXED_VALUES_GANHO === 'object') {
      Object.keys(FIXED_VALUES_GANHO).forEach((nome) => {
        const valorOriginal = valoresFixosBase[nome];
        if (typeof valorOriginal === 'number') FIXED_VALUES_GANHO[nome] = round(valorOriginal * factor);
      });
    }

    document.querySelectorAll('#selectGanho option').forEach((opt) => {
      if (!opt.dataset.textoBase) opt.dataset.textoBase = opt.textContent;
      const base = opt.dataset.textoBase;
      const match = base.match(/R\$\s*([\d.,]+)/);
      if (!match) return;
      const original = Number(match[1].replace(/\./g, '').replace(',', '.'));
      opt.textContent = base.replace(/R\$\s*[\d.,]+/, money(round(original * factor)));
    });
    document.querySelectorAll('#ganhoFields input[data-value]').forEach((input) => {
      if (!input.dataset.valorBase) input.dataset.valorBase = input.dataset.value;
      input.dataset.value = String(round(Number(input.dataset.valorBase) * factor));
    });
    const sel = document.getElementById('selectGanho');
    if (sel && sel.value && typeof window.calcularValorGanho === 'function') window.calcularValorGanho();
  }

  // No escopo global do script anterior, FIXED_VALUES_GANHO já existe.
  const valoresFixosBase = typeof FIXED_VALUES_GANHO === 'object' ? { ...FIXED_VALUES_GANHO } : {};

  function configurarPainel() {
    const seletor = document.getElementById('escalaEconomia');
    if (!seletor) return;
    seletor.value = String(factor);
    seletor.addEventListener('change', () => {
      const novo = Number(seletor.value);
      if (!ALLOWED.includes(novo)) return;
      if (typeof timerEmSessao !== 'undefined' && timerEmSessao) {
        alert('Finalize o cronômetro antes de trocar a escala.');
        seletor.value = String(factor);
        return;
      }
      factor = novo;
      localStorage.setItem(KEY, String(factor));
      atualizarPrecos();
      document.getElementById('selectTarefa')?.dispatchEvent(new Event('change'));
    });
  }

  // Este arquivo é executado antes de DOMContentLoaded, mas após storage.js.
  atualizarPrecos();
  document.addEventListener('DOMContentLoaded', configurarPainel);
})();