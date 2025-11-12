// Aplica -15% em COMPRAS quando o bônus-lingerie estiver ativo,
// sem editar appMain.js (usa listener em captura no botão Registrar).

(function () {
  const DISCOUNT_RATE = 0.15; //15% de desconto
  const PCT_LABEL = `-${Math.round(DISCOUNT_RATE * 100)}%`;
  const MULT = 1 - DISCOUNT_RATE; // 0.85

  // Helpers de estado já existentes no app:
  function bonusOn() {
    try {
      return !!window.bonusEspecialAtivo;
    } catch {
      return false;
    }
  }
  function isReducerOption(opt) {
    return !!(opt && opt.dataset && opt.dataset.reduzHoras); // opções que reduzem bloqueio têm data-reduz-horas
  }
  function parseVal(v) {
    const [valorStr, tarefa, descricao] = String(v || '').split('|');
    return {
      valor: parseInt(valorStr, 10) || 0,
      tarefa: tarefa || '',
      descricao: descricao || '',
    };
  }
  function fmtBR(n) {
    return (n || 0).toLocaleString('pt-BR');
  }

  const tipoTransacao = document.getElementById('tipoTransacao');
  const selectTarefa = document.getElementById('selectTarefa');
  const adicionarBtn = document.getElementById('adicionar');
  const chkBonus = document.getElementById('bonusEspecialCheckbox');

  if (!selectTarefa || !adicionarBtn) return;

  // ---------- UI: chip “-15% Bônus lingerie” + preview de preço ----------
  let chip, preview;

  function ensureChip() {
    if (chip) return chip;
    chip = document.createElement('div');
    chip.className = 'chip-desconto-lingerie';
    chip.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'margin-top:6px',
      'padding:4px 8px',
      'border-radius:999px',
      'border:1px solid rgba(212,162,26,.75)',
      'background:rgba(212,162,26,.08)',
      'color:#ffd54d',
      'font-weight:800',
      'font-size:12px',
      'letter-spacing:.3px',
      'box-shadow:inset 0 0 12px rgba(212,162,26,.05)',
    ].join(';');
    const pct = document.createElement('span');
    pct.textContent = PCT_LABEL;
    pct.style.cssText = 'border:1px solid rgba(212,162,26,.6);padding:2px 6px;border-radius:999px;background:rgba(255,215,0,.1)';
    const txt = document.createElement('span');
    txt.textContent = 'Bônus lingerie';
    chip.append(pct, txt);
    selectTarefa.parentElement.appendChild(chip);
    return chip;
  }

  function ensurePreview() {
    if (preview) return preview;
    preview = document.createElement('div');
    preview.id = 'previewDescontoCompra';
    preview.style.cssText = 'margin-top:6px;color:#d1c089;font-size:12px';
    selectTarefa.parentElement.appendChild(preview);
    return preview;
  }

  function updateUI() {
    // Mostra chip só quando: bônus ON, tipo = gasto e opção não-redutor selecionada
    const isGasto = !tipoTransacao || tipoTransacao.value === 'gasto';
    const opt = selectTarefa.selectedOptions && selectTarefa.selectedOptions[0];
    const show = bonusOn() && isGasto && opt && !isReducerOption(opt) && opt.value && opt.value !== '0';

    // chip
    if (show) ensureChip().style.display = 'inline-flex';
    else if (chip) chip.style.display = 'none';

    // preview
    const block = ensurePreview();
    if (show) {
      const { valor } = parseVal(selectTarefa.value);
      if (valor > 0) {
        const desc = Math.round(valor * MULT);
        block.innerHTML = ['<span style="opacity:.8">Preço com bônus: </span>', `<span style="text-decoration:line-through;opacity:.6;margin-right:6px">R$ ${fmtBR(valor)}</span>`, `<strong style="color:#ffda55">R$ ${fmtBR(desc)}</strong>`].join('');
        block.style.display = 'block';
      } else {
        block.style.display = 'none';
        block.textContent = '';
      }
    } else {
      block.style.display = 'none';
      block.textContent = '';
    }
  }

  // Eventos que mudam a UI
  selectTarefa.addEventListener('change', updateUI);
  if (tipoTransacao) tipoTransacao.addEventListener('change', updateUI);
  if (chkBonus) chkBonus.addEventListener('change', updateUI);
  document.addEventListener('DOMContentLoaded', updateUI);
  updateUI();

  // ---------- Aplicação do desconto na HORA DE REGISTRAR ----------
  // Estratégia: listener em CAPTURA no botão. Antes do handler do appMain,
  // trocamos TEMPORARIAMENTE o value da <option> selecionada para o valor com desconto.
  // Depois restauramos imediatamente (setTimeout 0).
  adicionarBtn.addEventListener(
    'click',
    function onCapture(e) {
      // quer COMPRAR?
      const isGasto = !tipoTransacao || tipoTransacao.value === 'gasto';
      if (!isGasto) return;

      const opt = selectTarefa.selectedOptions && selectTarefa.selectedOptions[0];
      if (!opt) return;

      // só aplica quando bônus ativo e não for redutor
      if (!bonusOn() || isReducerOption(opt)) return;

      const parsed = parseVal(opt.value);
      if (!parsed || !parsed.valor || parsed.valor <= 0) return;

      // aplica desconto
      const original = opt.value;
      const descontado = Math.round(parsed.valor * MULT);
      // salva original para restaurar
      opt.dataset.originalValueTmp = original;
      opt.value = `${descontado}|${parsed.tarefa}|${parsed.descricao}`;

      // restaura após os listeners do appMain rodarem
      setTimeout(() => {
        if (opt.dataset.originalValueTmp) {
          opt.value = opt.dataset.originalValueTmp;
          delete opt.dataset.originalValueTmp;
        }
        // re-render UI preview (caso necessário)
        updateUI();
      }, 0);
    },
    { capture: true }
  );
})();
