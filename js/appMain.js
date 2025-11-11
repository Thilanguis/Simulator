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
      // ESTE É O BLOCO DE "GANHO"
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

      // =======================================================
      // ✨ CÓDIGO ADICIONADO PARA A CHUVA DE DINHEIRO ✨
      // Só roda se a classe RainMoney (do outro arquivo) existir
      if (typeof RainMoney !== 'undefined') {
        const rainBurst = new RainMoney('💵', 'low');
        // Chama a nova função com o efeito de queima:
        // 1º parâmetro: 3000ms = chuva normal por 3 segundos
        // 2º parâmetro: '🔥' = emoji de fogo
        // 3º parâmetro: 2000ms = efeito de queima dura 2 segundos
        rainBurst.startBurningEffect(3000, '🔥', 2000);
      }
      // =======================================================
    }
  });

  // Listeners de Ganhos
  selectGanhoSelect.addEventListener('change', calcularValorGanho);
  document.getElementById('chkChule').addEventListener('change', calcularValorGanho);
  document.getElementById('chkFrancesinha').addEventListener('change', calcularValorGanho);

  // Listeners de Gastos
  selectTarefaSelect.addEventListener('change', function () {
    descricaoTransacaoInput.value = this.value.split('|')[2] || '';
  });

  // Listeners de Administração
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

  // Listeners de Filtro
  aplicarFiltroBtn.addEventListener('click', () => {
    renderHistorico();
  });
  limparFiltroBtn.addEventListener('click', () => {
    filterStartInput.value = '';
    filterEndInput.value = '';
    renderHistorico();
  });

  // Listener Enviar WhatsApp
  document.getElementById('enviarHistoricoWhatsApp').addEventListener('click', () => {
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

  // Listeners do Timer
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
});
