if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js');
}

const FIXED_VALUES_GANHO = {
  'Pés na cara': 400,
  'Tapa de pé na cara': 1,
  'Chupar peito': 400,
  'Cuspir na cara com catarro': 500,
  'Mijar na boca': 300,
  'Dedo do meio com desprezo': 20,
  'Vestir cinta e comer dominado': 3000,
  'Dar uma meleca para comer': 200,
  'Comer cutícula e peles dos pés': 800,
  'Cuspir porra (Sêmen) na boca': 1200,
  'Chupar buceta': 200,
  'Peidar na cara': 150,
};

let saldoDominadora = parseInt(localStorage.getItem('saldoDominadora') || '0');
let historico = JSON.parse(localStorage.getItem('historico') || '[]');
// Array para tarefas pendentes, persistente
let tarefasPendentes = JSON.parse(localStorage.getItem('tarefasPendentes') || '[]');

// garantir que todos os registros antigos ganhem timestamp (se não tiverem)
historico = historico.map((h) => (h.timestamp ? h : Object.assign({}, h, { timestamp: new Date().toISOString() })));
localStorage.setItem('historico', JSON.stringify(historico));

function formatBR(v) {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
function formatBR_Numeric(v) {
  return Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch (e) {
    return iso;
  }
}

/* ========== BÔNUS ESPECIAL (checkbox Langerie Especial) ========== */

const BONUS_ESPECIAL_MULTIPLIER = 1.3; // 1.3x

// carrega do localStorage se já estava ativo
let bonusEspecialAtivo = JSON.parse(localStorage.getItem('bonusEspecialAtivo') || 'false');

function getBonusEspecialMultiplier() {
  return bonusEspecialAtivo ? BONUS_ESPECIAL_MULTIPLIER : 1;
}

// Badge ao lado do "Como ganhou"
function renderBonusEspecialInlineBadge() {
  try {
    const mult = BONUS_ESPECIAL_MULTIPLIER;
    let badge = document.getElementById('bonusEspecialInline');
    const active = bonusEspecialAtivo;

    if (!badge) {
      badge = document.createElement('span');
      badge.id = 'bonusEspecialInline';
      badge.style.cssText = [
        'margin-left:8px',
        'font-size:12px',
        'padding:3px 8px',
        'border-radius:999px',
        'background:#0f172a',
        'color:#fff',
        'display:inline-flex',
        'gap:6px',
        'align-items:center',
        'vertical-align:middle',
        'box-shadow:0 1px 3px rgba(0,0,0,.15)',
      ].join(';');

      const bolt = document.createElement('span');
      bolt.textContent = '⚡';
      bolt.style.fontSize = '14px';

      const text = document.createElement('span');
      text.id = 'bonusEspecialInlineText';

      badge.append(bolt, text);

      const label = document.querySelector('label[for="selectGanho"]');
      if (label && label.parentElement) {
        label.parentElement.insertBefore(badge, label.nextSibling);
      } else {
        const select = document.getElementById('selectGanho');
        if (select && select.parentElement) {
          select.parentElement.insertBefore(badge, select.nextSibling);
        } else {
          document.body.appendChild(badge);
        }
      }
    }

    const text = document.getElementById('bonusEspecialInlineText');
    if (text) {
      if (active) {
        text.textContent = `Bônus x${mult.toLocaleString('pt-BR')} ativo (langerie especial)`;
      } else {
        text.textContent = `Bônus x${mult.toLocaleString('pt-BR')} desligado`;
      }
    }
    badge.style.opacity = active ? '1' : '.5';
  } catch (e) {}
}

// Decorar as opções do select "Como ganhou" com (Bônus x2)
function decorateSelectGanhoForBonus() {
  try {
    const sel = document.getElementById('selectGanho');
    if (!sel) return;
    for (const opt of Array.from(sel.options)) {
      if (!opt.dataset.originalText) opt.dataset.originalText = opt.textContent;
      if (bonusEspecialAtivo) {
        opt.textContent = opt.dataset.originalText + ` (⚡)`;
      } else {
        opt.textContent = opt.dataset.originalText;
      }
    }
  } catch (e) {}
}

// Faixinha embaixo explicando o bônus
function renderBonusEspecialBanner() {
  try {
    let banner = document.getElementById('bonusEspecialBanner');

    if (!bonusEspecialAtivo) {
      if (banner) banner.remove();
      return;
    }

    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'bonusEspecialBanner';
      banner.style.cssText = ['margin-top:6px', 'font-size:11px', 'color:#bbf7d0', 'background:#052e16', 'border-radius:999px', 'padding:4px 10px', 'display:inline-flex', 'align-items:center', 'gap:6px'].join(';');

      const icon = document.createElement('span');
      icon.textContent = '👙';

      const text = document.createElement('span');
      text.id = 'bonusEspecialBannerText';

      banner.append(icon, text);

      const ganhoFields = document.getElementById('ganhoFields');
      if (ganhoFields) {
        ganhoFields.appendChild(banner);
      } else {
        const select = document.getElementById('selectGanho');
        if (select && select.parentElement) {
          select.parentElement.appendChild(banner);
        } else {
          document.body.appendChild(banner);
        }
      }
    }

    const text = document.getElementById('bonusEspecialBannerText');
    if (text) {
      text.textContent = `Bônus x${BONUS_ESPECIAL_MULTIPLIER.toLocaleString('pt-BR')} aplicado em todos os créditos enquanto a langerie especial estiver ativa.`;
    }
  } catch (e) {}
}

function updateBonusEspecialUI() {
  renderBonusEspecialInlineBadge();
  decorateSelectGanhoForBonus();
  renderBonusEspecialBanner();
}

/* ===================== GANHO FIXO POR TIPO ====================== */

function calcularValorGanho() {
  const selectGanho = document.getElementById('selectGanho');
  const valorGanhoInput = document.getElementById('valorGanho');
  const pesNaCaraOptions = document.getElementById('pesNaCaraOptions');
  const quantidadeInput = document.getElementById('quantidadeMultiplicador');
  const labelQuantidade = document.getElementById('labelQuantidadeMultiplicador');
  const valorSelecionado = selectGanho.value;

  // esconder opções por padrão
  pesNaCaraOptions.style.display = 'none';
  quantidadeInput.style.display = 'none';
  labelQuantidade.style.display = 'none';
  valorGanhoInput.readOnly = false;
  // reset do campo valor para evitar confusões
  valorGanhoInput.value = '';

  if (FIXED_VALUES_GANHO[valorSelecionado]) {
    valorGanhoInput.readOnly = true;
    let valorBase = FIXED_VALUES_GANHO[valorSelecionado];

    // Pés na cara tem checkboxes extras
    if (valorSelecionado === 'Pés na cara') {
      pesNaCaraOptions.style.display = 'block';
      if (document.getElementById('chkChule').checked) valorBase += parseInt(document.getElementById('chkChule').dataset.value);
      if (document.getElementById('chkFrancesinha').checked) valorBase += parseInt(document.getElementById('chkFrancesinha').dataset.value);
      valorGanhoInput.value = valorBase;
      return;
    }

    // Tapa de pé na cara: mostrar multiplicador de quantidade
    if (valorSelecionado === 'Tapa de pé na cara') {
      quantidadeInput.style.display = 'block';
      labelQuantidade.style.display = 'block';
      // garantir pelo menos 1
      let quantidade = parseInt(quantidadeInput.value) || 1;
      if (quantidade < 1) quantidade = 1;
      quantidadeInput.value = quantidade;
      // multiplicar valor base pelo número escolhido
      valorGanhoInput.value = valorBase * quantidade;
      return;
    }

    // casos fixos simples
    valorGanhoInput.value = valorBase;
  }
}

// Controle mudança tipo transação (mostrar/ocultar blocos)
document.getElementById('tipoTransacao').addEventListener('change', function () {
  document.getElementById('compraFields').style.display = this.value === 'gasto' ? 'block' : 'none';
  document.getElementById('ganhoFields').style.display = this.value === 'ganho' ? 'block' : 'none';
  // quando trocar para gasto, garantir que multiplicador e checkboxes sejam resetados/ocultos
  if (this.value !== 'ganho') {
    const quantidadeInput = document.getElementById('quantidadeMultiplicador');
    if (quantidadeInput) {
      quantidadeInput.style.display = 'none';
      document.getElementById('labelQuantidadeMultiplicador').style.display = 'none';
      quantidadeInput.value = 1;
    }
  }
});

// Função para renderizar as tarefas pendentes
function renderTarefasPendentes() {
  const tarefasContainer = document.getElementById('tarefasPendentes');
  tarefasContainer.innerHTML = '';

  if (tarefasPendentes.length === 0) {
    tarefasContainer.innerHTML = '<p style="color:#999; text-align:center;">Nenhuma tarefa pendente. 👑</p>';
    return;
  }

  tarefasPendentes.forEach((tarefa) => {
    const div = document.createElement('div');
    div.className = 'tarefa-item';
    div.setAttribute('data-id', tarefa.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        tarefasPendentes.splice(
          tarefasPendentes.findIndex((t) => t.id === tarefa.id),
          1
        );
        localStorage.setItem('tarefasPendentes', JSON.stringify(tarefasPendentes));
        div.remove();
        renderTarefasPendentes();
      }
    });

    const spanDescricao = document.createElement('span');
    spanDescricao.className = 'tarefa-descricao';
    spanDescricao.textContent = `${tarefa.tarefa} (${tarefa.descricao}) - Comprada em ${formatDate(tarefa.timestamp)}`;

    const spanValor = document.createElement('span');
    spanValor.className = 'tarefa-valor';
    spanValor.textContent = formatBR(tarefa.valor);

    div.appendChild(checkbox);
    div.appendChild(spanDescricao);
    div.appendChild(spanValor);
    tarefasContainer.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const saldoElement = document.getElementById('saldoDominadora');
  const historicoElement = document.getElementById('historico');
  const adicionarBtn = document.getElementById('adicionar');
  const resetBtn = document.getElementById('resetSaldo');
  const limparBtn = document.getElementById('limparHistorico');
  const tipoTransacaoSelect = document.getElementById('tipoTransacao');
  const selectTarefaSelect = document.getElementById('selectTarefa');
  const descricaoTransacaoInput = document.getElementById('descricaoTransacao');
  const selectGanhoSelect = document.getElementById('selectGanho');
  const valorGanhoInput = document.getElementById('valorGanho');

  const filterStartInput = document.getElementById('filterStart');
  const filterEndInput = document.getElementById('filterEnd');
  const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
  const limparFiltroBtn = document.getElementById('limparFiltro');

  // Checkbox de bônus especial (Langerie especial)
  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');
  if (bonusCheckbox) {
    bonusCheckbox.checked = bonusEspecialAtivo;
    bonusCheckbox.addEventListener('change', () => {
      bonusEspecialAtivo = bonusCheckbox.checked;
      localStorage.setItem('bonusEspecialAtivo', JSON.stringify(bonusEspecialAtivo));
      updateBonusEspecialUI();
    });
  }

  function atualizarSaldo() {
    saldoElement.textContent = formatBR(saldoDominadora);
    localStorage.setItem('saldoDominadora', saldoDominadora);
  }

  function getFilteredHistorico() {
    const startVal = filterStartInput.value;
    const endVal = filterEndInput.value;
    let start = startVal ? new Date(startVal) : null;
    let end = endVal ? new Date(endVal) : null;
    return historico
      .filter((h) => {
        if (!h.timestamp) return false;
        const t = new Date(h.timestamp);
        if (start && t < start) return false;
        if (end && t > end) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function renderHistorico() {
    historicoElement.innerHTML = '';
    const filtered = getFilteredHistorico();
    if (filtered.length === 0) {
      const p = document.createElement('div');
      p.textContent = 'Sem registros para o período filtrado.';
      p.style.color = '#999';
      historicoElement.appendChild(p);
      return;
    }

    filtered.forEach((h) => {
      const div = document.createElement('div');
      div.className = h.tipo;
      const dateStr = formatDate(h.timestamp);
      div.innerHTML = `<strong>${h.tipo === 'ganho' ? 'Crédito' : 'Gasto'}:</strong> <span class="${h.tipo}">${h.descricao}</span> (${formatBR(h.valor)}) — Saldo: ${formatBR(h.saldoAtual)}<br><small style="color:#888">${dateStr}</small>`;
      historicoElement.appendChild(div);
    });
  }

  function adicionarHistorico(descricao, valor, tipo) {
    const timestamp = new Date().toISOString();
    historico.unshift({
      descricao,
      valor,
      tipo,
      saldoAtual: saldoDominadora,
      timestamp,
    });
    localStorage.setItem('historico', JSON.stringify(historico));
    renderHistorico();
  }

  // CONTADOR DE TEMPO
  let tempoSegundos = 0;
  let timerInterval = null;
  let wakeLock = null;

  const tempoDisplay = document.getElementById('tempoDisplay');
  const valorAcumuladoDisplay = document.getElementById('valorAcumuladoDisplay');
  const btnPlayPause = document.getElementById('btnPlayPauseTempo');
  const btnTerminar = document.getElementById('btnTerminarTempo');
  const valorPorMinutoInput = document.getElementById('valorPorMinuto');

  let timerEmSessao = false;
  let contadorTarefasTimer = 0;
  let somaIncrementosValorSessao = 0;
  let baseMultiplicadorSessao = 1;

  let sessionHasEligibleTask = false;
  const ELIGIBLE_TASKS = new Set(['Videogames Competitivos', 'Perfil', 'Jogos de tabuleiro com amigas', 'Buraco']);

  function ensureToastContainer() {
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      document.body.appendChild(c);
    }
    return c;
  }
  function showMultiplicadorToast({ atual, novo, incrementoValor, incrementoTarefas, repeticaoTotal, valorTarefa, tarefaIndex, totalValorSessao }) {
    try {
      const c = ensureToastContainer();
      const t = document.createElement('div');
      t.className = 'toast';
      t.style.position = 'relative';

      const format2 = (n) => (Number(n) || 0).toFixed(2);
      const valorStr = (valorTarefa ?? 0).toLocaleString ? valorTarefa.toLocaleString('pt-BR') : String(valorTarefa);

      t.innerHTML = `
        <button class="close" aria-label="Fechar">×</button>
        <div class="title"><span class="dot"></span>⏱️ Multiplicador atualizado</div>
        <div class="line"><span class="strong">${format2(atual)}</span> → <span class="strong">${format2(novo)}</span></div>
        <div class="line">+ <span class="strong">${format2(incrementoValor)}</span> pelo valor da tarefa (R$ ${valorStr})</div>
        <div class="line">+ <span class="strong">${format2(incrementoTarefas)}</span> pela repetição (tarefa #${tarefaIndex}) <span class="meta">(total: +${format2(repeticaoTotal)})</span></div>
        <div class="line meta">Total da sessão: +<span class="strong">${format2(incrementoTarefas + incrementoValor)}</span></div>
      `;

      c.appendChild(t);

      t.querySelector('.close').addEventListener('click', () => {
        t.remove();
      });

      const ttl = 9000;
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / ttl);
        if (p < 1) requestAnimationFrame(step);
        else t.remove();
      }
      requestAnimationFrame(step);
    } catch (e) {}
  }

  function incrementoPorValorDaTarefa(v) {
    if (!v || v <= 0) return 0;
    if (v >= 10000) return 6.3;
    if (v >= 9000) return 5.3;
    if (v >= 8000) return 4.8;
    if (v >= 7000) return 4.3;
    if (v >= 6000) return 3.8;
    if (v >= 5000) return 3.1;
    if (v >= 4000) return 2.6;
    if (v >= 3500) return 2.3;
    if (v >= 3000) return 2.1;
    if (v >= 2500) return 1.8;
    if (v >= 2000) return 1.5;
    if (v >= 1500) return 1.3;
    if (v >= 1100) return 1.1;
    if (v >= 800) return 0.8;
    if (v >= 400) return 0.6;
    return 0.4;
  }

  function aplicarBonusDeTarefaDuranteTimer(valorTarefa, tarefaName) {
    if (!timerEmSessao) return;

    if (typeof tarefaName === 'string' && ELIGIBLE_TASKS.has(tarefaName.trim())) {
      sessionHasEligibleTask = true;
    }

    contadorTarefasTimer += 1;
    const incValorAtual = incrementoPorValorDaTarefa(valorTarefa);
    somaIncrementosValorSessao += incValorAtual;

    const bonusRepeticaoDaVez = 0.13 * contadorTarefasTimer;
    const bonusRepeticaoTotal = ((contadorTarefasTimer * (contadorTarefasTimer + 1)) / 2) * 0.13;

    const atual = parseFloat(valorPorMinutoInput.value) || baseMultiplicadorSessao;
    const novo = atual + incValorAtual + bonusRepeticaoDaVez;

    valorPorMinutoInput.value = novo.toFixed(2);
    atualizarValorAcumulado();

    showMultiplicadorToast({
      atual,
      novo,
      incrementoValor: incValorAtual,
      incrementoTarefas: bonusRepeticaoDaVez,
      repeticaoTotal: bonusRepeticaoTotal,
      valorTarefa,
      tarefaIndex: contadorTarefasTimer,
      totalValorSessao: somaIncrementosValorSessao,
    });
  }

  function calcularValorTotal(segundos, valorPorMinuto) {
    if (segundos === 0 || valorPorMinuto === 0) return 0;
    return Math.round(segundos * (valorPorMinuto / 60));
  }

  function atualizarValorAcumulado() {
    const valorPorMinuto = parseFloat(valorPorMinutoInput.value) || 0;
    const valorTotal = calcularValorTotal(tempoSegundos, valorPorMinuto);
    valorAcumuladoDisplay.textContent = formatBR(valorTotal);
  }

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          wakeLock = null;
        });
      } catch (err) {
        console.error(`Erro ao solicitar Wake Lock: ${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  };

  function atualizarDisplay() {
    const min = String(Math.floor(tempoSegundos / 60)).padStart(2, '0');
    const sec = String(tempoSegundos % 60).padStart(2, '0');
    tempoDisplay.textContent = `${min}:${sec}`;
    atualizarValorAcumulado();
  }

  btnPlayPause.addEventListener('click', () => {
    if (!timerEmSessao) {
      baseMultiplicadorSessao = 1;
      somaIncrementosValorSessao = 0;
      contadorTarefasTimer = 0;
      valorPorMinutoInput.value = baseMultiplicadorSessao;
      timerEmSessao = true;
      sessionHasEligibleTask = false;
      atualizarValorAcumulado();
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      btnPlayPause.textContent = '▶️ Continuar';
      releaseWakeLock();
    } else {
      requestWakeLock();

      const INCREMENT_INTERVAL_SECONDS = 3;
      const INCREMENT_VALUE = 0.33;

      timerInterval = setInterval(() => {
        tempoSegundos++;

        if (tempoSegundos % INCREMENT_INTERVAL_SECONDS === 0) {
          if (sessionHasEligibleTask) {
            let valorPorMinuto = parseFloat(valorPorMinutoInput.value) || 0;
            valorPorMinuto += INCREMENT_VALUE;
            valorPorMinutoInput.value = valorPorMinuto.toFixed(2);
          }
        }

        atualizarDisplay();
      }, 1000);
      btnPlayPause.textContent = '⏸️ Pausar';
    }
  });

  btnTerminar.addEventListener('click', () => {
    if (!timerEmSessao) return;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    releaseWakeLock();

    const valorPorMinuto = parseFloat(valorPorMinutoInput.value);
    if (isNaN(valorPorMinuto) || valorPorMinuto <= 0) {
      return alert('Insira um valor válido por minuto antes de terminar.');
    }

    const valorTotal = calcularValorTotal(tempoSegundos, valorPorMinuto);
    const multBonus = getBonusEspecialMultiplier();
    const valorCredito = Math.round(valorTotal * multBonus);

    if (valorCredito > 0) {
      saldoDominadora += valorCredito;
      adicionarHistorico(`Ganho por tempo (${tempoDisplay.textContent})`, valorCredito, 'ganho');
      atualizarSaldo();
      valorPorMinutoInput.value = 1;
      contadorTarefasTimer = 0;
      somaIncrementosValorSessao = 0;
      baseMultiplicadorSessao = 1;
      timerEmSessao = false;
      sessionHasEligibleTask = false;
    }

    tempoSegundos = 0;
    atualizarDisplay();
    btnPlayPause.textContent = '▶️ Começar';
  });

  adicionarBtn.addEventListener('click', () => {
    const tipo = tipoTransacaoSelect.value;
    let valor, tarefa, descricao;

    if (tipo === 'gasto') {
      const tarefaSelecionada = selectTarefaSelect.value;
      if (!tarefaSelecionada) return alert('Por favor, selecione uma tarefa.');
      [valor, tarefa, descricao] = tarefaSelecionada.split('|');
      valor = parseInt(valor);
      if (saldoDominadora < valor) return alert('Saldo insuficiente!');

      saldoDominadora -= valor;
      adicionarHistorico(tarefa, valor, tipo);

      const novaTarefa = {
        id: Date.now(),
        tarefa: tarefa,
        descricao: descricao,
        valor: valor,
        timestamp: new Date().toISOString(),
      };
      tarefasPendentes.push(novaTarefa);
      localStorage.setItem('tarefasPendentes', JSON.stringify(tarefasPendentes));
      renderTarefasPendentes();

      atualizarSaldo();
      aplicarBonusDeTarefaDuranteTimer(valor, tarefa);

      const numeroWhatsApp = '+14386305973';
      const ultimo = historico[0];
      const dataHora = formatDate(ultimo.timestamp);
      const mensagem = `\n🧾 *RECIBO DE COMPRA* 🧾\n----------------------------------------\n🗓 *Data/Hora:* ${dataHora}\n📌 *Tarefa:* ${tarefa}\n📝 *Descrição:* ${descricao}\n----------------------------------------\n💰 *Valor:* R$ ${valor.toLocaleString(
        'pt-BR'
      )}\n👑 *Saldo Atual:* R$ ${saldoDominadora.toLocaleString('pt-BR')}\n----------------------------------------\n✅ Ganhe saldo e compre serviços sem moderação! 🙏\n`;
      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
      window.open(urlWhatsApp, '_blank');
    } else {
      const ganhoSelecionado = selectGanhoSelect.value;
      const valorInput = valorGanhoInput.value;
      if (!ganhoSelecionado || !valorInput || parseInt(valorInput) <= 0) return alert('Por favor, selecione uma forma de ganho e insira um valor válido.');

      valor = parseInt(valorInput);
      tarefa = ganhoSelecionado;

      if (ganhoSelecionado === 'Pés na cara') {
        const chule = document.getElementById('chkChule').checked;
        const francesinha = document.getElementById('chkFrancesinha').checked;
        let options = [];
        if (chule) options.push('chulé');
        if (francesinha) options.push('francesinha');
        if (options.length > 0) tarefa += ` (${options.join(' e ')})`;
      }

      if (ganhoSelecionado === 'Tapa de pé na cara') {
        const quantidade = parseInt(document.getElementById('quantidadeMultiplicador').value) || 1;
        if (quantidade > 1) {
          tarefa += ` (x${quantidade})`;
        }
      }

      const multBonus = getBonusEspecialMultiplier();
      valor = Math.round(valor * multBonus * 100) / 100;

      saldoDominadora += valor;
      adicionarHistorico(tarefa, valor, tipo);

      selectGanhoSelect.value = '';
      valorGanhoInput.value = '0';
      document.getElementById('chkChule').checked = false;
      document.getElementById('chkFrancesinha').checked = false;
      const quantidadeInput = document.getElementById('quantidadeMultiplicador');
      quantidadeInput.value = 1;
      quantidadeInput.style.display = 'none';
      document.getElementById('labelQuantidadeMultiplicador').style.display = 'none';

      atualizarSaldo();
      aplicarBonusDeTarefaDuranteTimer(valor, ganhoSelecionado);
    }
  });

  selectTarefaSelect.addEventListener('change', function () {
    descricaoTransacaoInput.value = this.value.split('|')[2] || '';
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja RESETAR O SALDO?')) {
      saldoDominadora = 0;
      atualizarSaldo();
      tarefasPendentes = [];
      localStorage.setItem('tarefasPendentes', '[]');
      renderTarefasPendentes();
    }
  });

  limparBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja LIMPAR O HISTÓRICO?')) {
      historico = [];
      localStorage.setItem('historico', '[]');
      renderHistorico();
      tarefasPendentes = [];
      localStorage.setItem('tarefasPendentes', '[]');
      renderTarefasPendentes();
    }
  });

  selectGanhoSelect.addEventListener('change', calcularValorGanho);
  document.getElementById('chkChule').addEventListener('change', calcularValorGanho);
  document.getElementById('chkFrancesinha').addEventListener('change', calcularValorGanho);

  aplicarFiltroBtn.addEventListener('click', () => {
    renderHistorico();
  });
  limparFiltroBtn.addEventListener('click', () => {
    filterStartInput.value = '';
    filterEndInput.value = '';
    renderHistorico();
  });

  const enviarHistoricoBtn = document.getElementById('enviarHistoricoWhatsApp');
  enviarHistoricoBtn.addEventListener('click', () => {
    const filtered = getFilteredHistorico();
    if (!filtered || filtered.length === 0) return alert('Nenhum registro encontrado para o período/filtro selecionado.');
    const numeroWhatsApp = '+14386305973';
    const dataHora = new Date().toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    let mensagem = `📜 *HISTÓRICO DE TRANSAÇÕES*\n\nData de envio: ${dataHora}\n\n`;
    filtered.forEach((h, idx) => {
      mensagem += `${idx + 1}. ${h.tipo === 'ganho' ? 'Crédito' : 'Gasto'} — ${h.descricao} — Valor: R$ ${h.valor.toLocaleString('pt-BR')} — Saldo: R$ ${h.saldoAtual.toLocaleString('pt-BR')} — ${formatDate(h.timestamp)}\n`;
    });
    mensagem += `\n— Fim do histórico.`;
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsApp, '_blank');
  });

  atualizarSaldo();
  renderHistorico();
  renderTarefasPendentes();
  updateBonusEspecialUI();
});

// ---- break ----

if ('serviceWorker' in navigator) {
  // Apenas a linha de registro do Service Worker para o PWA (se o arquivo 'service-worker.js' existir)
}

// ---- break ----

(function () {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const skipBtn = splash.querySelector('.splash-skip');
  const hide = () => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 650);
  };
  window.addEventListener('load', () => setTimeout(hide, 5200));
  skipBtn && skipBtn.addEventListener('click', hide);
  splash.addEventListener('click', (e) => {
    if (e.target === splash) hide();
  });
})();

(function enhanceSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const card = splash.querySelector('.splash-card');
  const particles = splash.querySelector('.splash-particles');
  const symbols = ['$', '€', '¥', '£', '₿', '¢', '₩', '₹', '%'];
  const count = 28;

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'p';
    s.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const delay = (Math.random() * 3).toFixed(2) + 's';
    const dur = (4 + Math.random() * 3).toFixed(2) + 's';
    const x = (Math.random() * 240 - 120).toFixed(0) + 'px';
    const rot = (Math.random() * 120 - 60).toFixed(0) + 'deg';
    s.style.setProperty('--delay', delay);
    s.style.setProperty('--dur', dur);
    s.style.setProperty('--x', x);
    s.style.setProperty('--rot', rot);
    s.style.left = 40 + Math.random() * 20 + '%';
    s.style.bottom = '-10%';
    s.style.fontSize = (14 + Math.random() * 12).toFixed(0) + 'px';
    particles.appendChild(s);
  }

  function handleMove(e) {
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    const maxTilt = 6;
    const rx = (dy * -maxTilt).toFixed(2);
    const ry = (dx * maxTilt).toFixed(2);
    card.classList.add('tilt');
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function resetTilt() {
    card.classList.remove('tilt');
    card.style.transform = '';
  }
  splash.addEventListener('mousemove', handleMove);
  splash.addEventListener('mouseleave', resetTilt);
})();
