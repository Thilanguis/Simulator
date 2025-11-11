/* =================================================================== */
/* APP PRINCIPAL (Main)                       */
/* =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Seleção de Elementos ---
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

  // Timer
  const tempoDisplay = document.getElementById('tempoDisplay');
  const valorAcumuladoDisplay = document.getElementById('valorAcumuladoDisplay');
  const btnPlayPause = document.getElementById('btnPlayPauseTempo');
  const btnTerminar = document.getElementById('btnTerminarTempo');
  const valorPorMinutoInput = document.getElementById('valorPorMinuto');

  // --- Funções de "Estado" e "Renderização" ---
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

  /* =============================================================== */
  /* 🕒 SISTEMA DE LIMITES DE TAREFAS (14 DIAS)                      */
  /* =============================================================== */

  const LIMITE_DIAS = 14;
  const tarefasLimitadas = ['Ela decide toda a agenda do dia'];
  let tarefasBloqueadas = JSON.parse(localStorage.getItem('tarefasBloqueadas') || '[]');

  window.removerTarefaLimitada = function (nome) {
    tarefasBloqueadas = tarefasBloqueadas.filter((t) => t.nome !== nome);
    localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));
    atualizarTarefasLimitadasUI();
  };

  function atualizarTarefasLimitadasUI() {
    const lista = document.getElementById('tarefasLimitadasLista');
    if (!lista) return;

    const agora = Date.now();
    lista.innerHTML = '';

    // Remove expiradas
    tarefasBloqueadas = tarefasBloqueadas.filter((t) => t.expiraEm > agora);
    localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));

    if (tarefasBloqueadas.length === 0) {
      lista.innerHTML = '<p style="color:#aaa;">Nenhuma tarefa limitada ativa.</p>';
      return;
    }

    tarefasBloqueadas.forEach((tarefa) => {
      const diffMs = tarefa.expiraEm - agora;
      const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const div = document.createElement('div');
      div.innerHTML = `
        <span>🔒 <b>${tarefa.nome}</b> — libera em ${diffDias}d ${diffHoras}h ${diffMin}m</span>
        <button onclick="removerTarefaLimitada('${tarefa.nome}')">🗑️</button>
      `;
      lista.appendChild(div);
    });
  }

  // Atualiza lista a cada minuto
  setInterval(atualizarTarefasLimitadasUI, 60000);
  atualizarTarefasLimitadasUI();

  // --- Event Listeners ---

  // Bônus Especial (Langerie)
  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');
  if (bonusCheckbox) {
    bonusCheckbox.checked = bonusEspecialAtivo;
    bonusCheckbox.addEventListener('change', () => {
      bonusEspecialAtivo = bonusCheckbox.checked;
      localStorage.setItem('bonusEspecialAtivo', JSON.stringify(bonusEspecialAtivo));
      updateBonusEspecialUI();
    });
  }

  // Controle de Abas (Ganho/Gasto)
  tipoTransacaoSelect.addEventListener('change', function () {
    document.getElementById('compraFields').style.display = this.value === 'gasto' ? 'block' : 'none';
    document.getElementById('ganhoFields').style.display = this.value === 'ganho' ? 'block' : 'none';
    if (this.value !== 'ganho') {
      const quantidadeInput = document.getElementById('quantidadeMultiplicador');
      if (quantidadeInput) {
        quantidadeInput.style.display = 'none';
        document.getElementById('labelQuantidadeMultiplicador').style.display = 'none';
        quantidadeInput.value = 1;
      }
    }
  });

  // Botão Principal "Adicionar"
  adicionarBtn.addEventListener('click', () => {
    const tipo = tipoTransacaoSelect.value;
    let valor, tarefa, descricao;

    if (tipo === 'gasto') {
      const tarefaSelecionada = selectTarefaSelect.value;
      if (!tarefaSelecionada) return alert('Por favor, selecione uma tarefa.');
      [valor, tarefa, descricao] = tarefaSelecionada.split('|');
      valor = parseInt(valor);
      if (saldoDominadora < valor) return alert('Saldo insuficiente!');

      // Limite de 14 dias
      if (tarefasLimitadas.includes(tarefa)) {
        const agora = Date.now();
        const bloqueada = tarefasBloqueadas.find((t) => t.nome === tarefa && t.expiraEm > agora);
        if (bloqueada) {
          alert(`❌ "${tarefa}" ainda está bloqueada por limite de ${LIMITE_DIAS} dias.`);
          return;
        }
        const expiraEm = agora + LIMITE_DIAS * 24 * 60 * 60 * 1000;
        tarefasBloqueadas.push({ nome: tarefa, expiraEm });
        localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));
        atualizarTarefasLimitadasUI();
      }

      // Gasto normal
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
      // BLOCO DE "GANHO" — preservado
      const ganhoSelecionado = selectGanhoSelect.value;
      const valorInput = valorGanhoInput.value;
      if (!ganhoSelecionado || !valorInput || parseInt(valorInput) <= 0) return alert('Por favor, selecione uma forma de ganho e insira um valor válido.');

      valor = parseInt(valorInput);
      tarefa = ganhoSelecionado;

      const multBonus = getBonusEspecialMultiplier();
      valor = Math.round(valor * multBonus * 100) / 100;

      saldoDominadora += valor;
      adicionarHistorico(tarefa, valor, tipo);

      selectGanhoSelect.value = '';
      valorGanhoInput.value = '0';
      atualizarSaldo();
      aplicarBonusDeTarefaDuranteTimer(valor, ganhoSelecionado);

      if (typeof RainMoney !== 'undefined') {
        const rainBurst = new RainMoney('💵', 'low');
        rainBurst.startBurningEffect(3000, '🔥', 2000);
      }
    }
  });

  // Listeners do Timer (preservado)
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

  // --- Chamadas Iniciais ---
  atualizarSaldo();
  renderHistorico();
  renderTarefasPendentes();
  updateBonusEspecialUI();
  atualizarTarefasLimitadasUI();
});
