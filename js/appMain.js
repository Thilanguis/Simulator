/* ===================================================================
   APP PRINCIPAL (Main)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // ELEMENTOS DA UI
  // -----------------------------
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

  const filterDateInput = document.getElementById('filterDate');
  const aplicarFiltroBtn = document.getElementById('aplicarFiltro');
  const limparFiltroBtn = document.getElementById('limparFiltro');

  // Timer (se estiver usando os botões do timer neste arquivo)
  const tempoDisplay = document.getElementById('tempoDisplay');
  const valorAcumuladoDisplay = document.getElementById('valorAcumuladoDisplay');
  const btnPlayPause = document.getElementById('btnPlayPauseTempo');
  const btnTerminar = document.getElementById('btnTerminarTempo');
  const valorPorMinutoInput = document.getElementById('valorPorMinuto');

  // Bônus
  const bonusCheckbox = document.getElementById('bonusEspecialCheckbox');

  // -----------------------------
  // ESTADO / STORAGE
  // -----------------------------
  // historico, saldoDominadora, tarefasPendentes devem existir via outros arquivos (storage.js)
  // Garante arrays
  window.historico = Array.isArray(window.historico) ? window.historico : JSON.parse(localStorage.getItem('historico') || '[]');
  window.tarefasPendentes = Array.isArray(window.tarefasPendentes) ? window.tarefasPendentes : JSON.parse(localStorage.getItem('tarefasPendentes') || '[]');

  // Sistema de bloqueios
  let tarefasBloqueadas = JSON.parse(localStorage.getItem('tarefasBloqueadas') || '[]');

  // -----------------------------
  // HELPERS / TABELAS
  // -----------------------------

  // IDs canônicos para os redutores (mapeia "horas" -> ID)
  const REDUTOR_IDS_BY_HOURS = {
    6: 'REDUZIR_BLOQUEIO_6H',
    12: 'REDUZIR_BLOQUEIO_12H',
    24: 'REDUZIR_BLOQUEIO_1D',
    72: 'REDUZIR_BLOQUEIO_3D',
  };

  // horas de bloqueio por tarefa/redutor
  const LIMITES_TAREFA_HORAS = {
    'Ela decide toda a agenda do dia': 24 * 14, // 14 dias
    'Vale de escolha de FILME': 24 * 10, // 10 dias
    // redutores (IDs canônicos)
    REDUZIR_BLOQUEIO_6H: 6,
    REDUZIR_BLOQUEIO_12H: 12,
    REDUZIR_BLOQUEIO_1D: 24,
    REDUZIR_BLOQUEIO_3D: 72,
  };

  function getBloqueioMsPorTarefa(nome) {
    const horas = LIMITES_TAREFA_HORAS[nome] || 0;
    return horas * 60 * 60 * 1000;
  }

  // Pega o ID canônico do redutor a partir da option selecionada (usa data-reduz-horas)
  function getRedutorIdFromOption(opt) {
    const h = parseInt(opt?.dataset?.reduzHoras || '0', 10);
    return REDUTOR_IDS_BY_HOURS[h] || null;
  }

  // rótulos bonitos para redutores na lista bloqueada
  const REDUTOR_LABELS = {
    REDUZIR_BLOQUEIO_6H: 'Reduzir 6h',
    REDUZIR_BLOQUEIO_12H: 'Reduzir 12h',
    REDUZIR_BLOQUEIO_1D: 'Reduzir 1 dia',
    REDUZIR_BLOQUEIO_3D: 'Reduzir 3 dias',
  };

  function getBlockedDisplayName(nome) {
    if (REDUTOR_LABELS[nome]) return `🔻 ${REDUTOR_LABELS[nome]}`;
    return nome;
  }

  // ms -> "Xd Yh Zm"
  function fmtTempoRestante(ms) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${d}d ${h}h ${m}m`;
  }

  // Parser para "VALOR|NOME|DESCRICAO"
  function parseTarefa(val) {
    const [valorStr, tarefa, descricao] = (val || '').split('|');
    return {
      valor: parseInt(valorStr, 10) || 0,
      tarefa: tarefa || '',
      descricao: descricao || '',
    };
  }

  // -----------------------------
  // ATUALIZAÇÕES DE UI
  // -----------------------------

  function atualizarSaldo() {
    if (!saldoElement) return;
    saldoElement.textContent = typeof formatBR === 'function' ? formatBR(saldoDominadora) : (saldoDominadora || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    localStorage.setItem('saldoDominadora', saldoDominadora);
  }

  function getFilteredHistorico() {
    const selected = filterDateInput && filterDateInput.value ? new Date(filterDateInput.value) : null;
    const dayStart = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 0, 0, 0, 0) : null;
    const dayEnd = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999) : null;

    return historico
      .filter((h) => {
        if (!h.timestamp) return false;
        if (!selected) return true;
        const t = new Date(h.timestamp);
        return t >= dayStart && t <= dayEnd;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function renderHistorico() {
    if (!historicoElement) return;
    historicoElement.innerHTML = '';

    const filtered = getFilteredHistorico();
    if (!filtered.length) {
      historicoElement.innerHTML = '<div style="color:#999;border:1px dashed #444;padding:12px;border-radius:10px;text-align:center">Sem registros para o período.</div>';
      return;
    }

    // agrupa por dia
    const byDay = {};
    for (const h of filtered) {
      const key = new Date(h.timestamp).toISOString().slice(0, 10);
      (byDay[key] ||= []).push(h);
    }

    const days = Object.keys(byDay).sort((a, b) => new Date(b) - new Date(a));

    for (const key of days) {
      const d = new Date(key + 'T00:00:00');
      const header = document.createElement('div');
      header.style.cssText = 'margin:14px 0 6px; color:#ffd700; font-weight:900; letter-spacing:.5px; border-left:4px solid #8b0000; padding-left:10px; font-size:14px;';
      header.textContent = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      historicoElement.appendChild(header);

      byDay[key].forEach((h) => {
        const card = document.createElement('div');
        card.style.cssText = 'background:#121212;border:1px solid #2e2e2e;border-radius:10px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.35), inset 0 0 8px rgba(184,134,11,.06)';
        const isGanho = h.tipo === 'ganho';
        const valorHTML = `<strong style="min-width:120px;display:inline-block;text-align:right;color:${isGanho ? '#0fdc81' : '#ff6a5f'}">${
          typeof formatBR === 'function' ? formatBR(h.valor) : 'R$ ' + (h.valor || 0).toLocaleString('pt-BR')
        }</strong>`;
        const badge = `<span style="font-size:12px;font-weight:800;padding:4px 8px;border-radius:999px;border:1px solid ${isGanho ? 'rgba(15,220,129,.6)' : 'rgba(255,106,95,.6)'};background:${
          isGanho ? 'rgba(15,220,129,.1)' : 'rgba(255,106,95,.08)'
        };color:${isGanho ? '#0fdc81' : '#ff6a5f'};text-transform:uppercase;letter-spacing:.5px;margin-right:10px">${isGanho ? 'Ganho' : 'Gasto'}</span>`;
        const hora = new Date(h.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px">
            ${badge}
            <div style="flex:1;color:#ddd">${h.descricao}</div>
            ${valorHTML}
          </div>
          <div style="margin-top:4px;display:flex;justify-content:space-between;color:#8d8d8d;font-size:12px">
            <span>${hora}</span>
            <span>Saldo: ${typeof formatBR === 'function' ? formatBR(h.saldoAtual) : 'R$ ' + (h.saldoAtual || 0).toLocaleString('pt-BR')}</span>
          </div>
        `;
        historicoElement.appendChild(card);
      });
    }
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

  // -----------------------------
  // TAREFAS LIMITADAS (bloqueios)
  // -----------------------------

  window.removerTarefaLimitada = function (nome) {
    tarefasBloqueadas = tarefasBloqueadas.filter((t) => t.nome !== nome);
    localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));
    atualizarTarefasLimitadasUI();
    atualizarBloqueiosNoSelectTarefa(); // desbloqueia no select na hora
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
      const diffDias = Math.floor(diffMs / 86400000);
      const diffHoras = Math.floor((diffMs % 86400000) / 3600000);
      const diffMin = Math.floor((diffMs % 3600000) / 60000);

      const div = document.createElement('div');
      const nomeBonito = getBlockedDisplayName(tarefa.nome);
      div.innerHTML = `
        <span title="Libera em ${fmtTempoRestante(diffMs)}">🔒 <b>${nomeBonito}</b> — libera em ${diffDias}d ${diffHoras}h ${diffMin}m</span>
        <button onclick="removerTarefaLimitada('${tarefa.nome}')" title="Remover bloqueio">🗑️</button>
      `;
      lista.appendChild(div);
    });
  }

  // Desabilita opções bloqueadas no select e mostra cadeado
  function atualizarBloqueiosNoSelectTarefa() {
    const agora = Date.now();

    const bloqueadas = JSON.parse(localStorage.getItem('tarefasBloqueadas') || '[]').filter((t) => t.expiraEm > agora);

    const map = new Map(bloqueadas.map((t) => [t.nome, t.expiraEm]));

    Array.from(selectTarefaSelect.options).forEach((opt) => {
      if (!opt || !opt.value || opt.value === '0' || opt.dataset.placeholder === '1') return;

      // se for redutor, usa ID canônico; senão, usa o nome da tarefa do value
      const redId = getRedutorIdFromOption(opt);
      const { tarefa: nomeTarefa } = parseTarefa(opt.value);
      const keyName = redId || nomeTarefa;

      if (!opt.dataset.labelOriginal) opt.dataset.labelOriginal = opt.textContent;

      const expira = map.get(keyName);
      const isLocked = typeof expira === 'number';

      opt.disabled = !!isLocked;
      opt.classList.toggle('locked', !!isLocked);

      if (isLocked) {
        const restante = fmtTempoRestante(expira - agora);
        const base = opt.dataset.labelOriginal;
        opt.textContent = base.startsWith('🔒') ? base : `🔒 ${base}`;
        opt.title = `Bloqueada — libera em ${restante}`;
      } else {
        opt.textContent = opt.dataset.labelOriginal;
        opt.title = '';
      }
    });
  }

  // -----------------------------
  // EVENTOS
  // -----------------------------

  // Toggle bônus especial
  if (bonusCheckbox) {
    try {
      bonusCheckbox.checked = !!bonusEspecialAtivo;
    } catch {}
    bonusCheckbox.addEventListener('change', () => {
      window.bonusEspecialAtivo = bonusCheckbox.checked;
      localStorage.setItem('bonusEspecialAtivo', JSON.stringify(bonusEspecialAtivo));
      if (typeof updateBonusEspecialUI === 'function') updateBonusEspecialUI();
    });
  }

  // Controle de abas (gasto/ganho)
  if (tipoTransacaoSelect) {
    tipoTransacaoSelect.addEventListener('change', function () {
      const compraFields = document.getElementById('compraFields');
      const ganhoFields = document.getElementById('ganhoFields');
      if (compraFields) compraFields.style.display = this.value === 'gasto' ? 'block' : 'none';
      if (ganhoFields) ganhoFields.style.display = this.value === 'ganho' ? 'block' : 'none';

      // ao sair de "ganho", esconder multiplicador extra
      if (this.value !== 'ganho') {
        const quantidadeInput = document.getElementById('quantidadeMultiplicador');
        const labelQuantidadeMultiplicador = document.getElementById('labelQuantidadeMultiplicador');
        if (quantidadeInput) {
          quantidadeInput.style.display = 'none';
          if (labelQuantidadeMultiplicador) labelQuantidadeMultiplicador.style.display = 'none';
          quantidadeInput.value = 1;
        }
      }
    });
  }

  // Preenche descrição ao escolher a tarefa (OPÇÃO 2 — data attributes no option são opcionais aqui)
  if (selectTarefaSelect) {
    selectTarefaSelect.addEventListener('change', () => {
      const { descricao } = parseTarefa(selectTarefaSelect.value);
      if (descricaoTransacaoInput) descricaoTransacaoInput.value = descricao || '';
    });
  }

  // Filtro do histórico (data única)
  if (aplicarFiltroBtn) aplicarFiltroBtn.addEventListener('click', () => renderHistorico());
  if (limparFiltroBtn)
    limparFiltroBtn.addEventListener('click', () => {
      if (filterDateInput) filterDateInput.value = '';
      renderHistorico();
    });

  // Botão: Resetar Saldo
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Tem certeza que deseja zerar o saldo?')) return;
      window.saldoDominadora = 0;
      atualizarSaldo();
    });
  }

  // Botão: Limpar Histórico
  if (limparBtn) {
    limparBtn.addEventListener('click', () => {
      if (!window.historico || window.historico.length === 0) {
        alert('O histórico já está vazio.');
        return;
      }
      if (!confirm('Apagar todo o histórico de transações?')) return;
      window.historico = [];
      localStorage.setItem('historico', JSON.stringify(window.historico));
      renderHistorico();
    });
  }

  // Botão principal: Adicionar / Registrar
  if (adicionarBtn) {
    adicionarBtn.addEventListener('click', () => {
      const tipo = (tipoTransacaoSelect && tipoTransacaoSelect.value) || 'gasto';
      let valor, tarefa, descricao;

      if (tipo === 'gasto') {
        const tarefaSelecionada = (selectTarefaSelect && selectTarefaSelect.value) || '';
        if (!tarefaSelecionada) return alert('Por favor, selecione uma tarefa.');
        ({ valor, tarefa, descricao } = parseTarefa(tarefaSelecionada));

        // Detecta se é um "redutor de bloqueios"
        const optSel = selectTarefaSelect?.selectedOptions?.[0] || null;
        const horasReducao = optSel && optSel.dataset && optSel.dataset.reduzHoras ? parseInt(optSel.dataset.reduzHoras, 10) : 0;

        // ------------------------------
        // RAMO ESPECIAL: REDUTORES
        // ------------------------------
        if (horasReducao > 0) {
          const agora = Date.now();
          const redutorId = getRedutorIdFromOption(optSel) || 'REDUTOR';
          const cooldownMs = getBloqueioMsPorTarefa(redutorId);

          // (A) checa cooldown do próprio redutor
          if (cooldownMs > 0) {
            const jaBloqueado = tarefasBloqueadas.find((t) => t.nome === redutorId && t.expiraEm > agora);
            if (jaBloqueado) {
              alert(`⏳ "${descricao || tarefa}" ainda está em cooldown.\nLibera em ${fmtTempoRestante(jaBloqueado.expiraEm - agora)}.`);
              return;
            }
          }

          // (B) cobra
          if (saldoDominadora < valor) return alert('Saldo insuficiente!');
          saldoDominadora -= valor;
          atualizarSaldo();

          // (C) reduz TODOS os bloqueios ativos (exceto cooldowns dos redutores)
          const msReducao = horasReducao * 60 * 60 * 1000;
          tarefasBloqueadas = (tarefasBloqueadas || [])
            .map((t) => {
              if (t.expiraEm > agora) {
                if (/^REDUZIR_BLOQUEIO_/.test(t.nome)) return t; // não reduzir cooldowns de redutores
                const novo = Math.max(agora, t.expiraEm - msReducao);
                return { ...t, expiraEm: novo };
              }
              return t;
            })
            .filter((t) => t.expiraEm > agora);
          localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));

          // (D) grava cooldown do redutor
          if (cooldownMs > 0) {
            tarefasBloqueadas.push({ nome: redutorId, expiraEm: agora + cooldownMs });
            localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));
          }

          // (E) histórico + UI
          adicionarHistorico(`Redução de limites (-${horasReducao}h)`, valor, 'gasto');
          atualizarTarefasLimitadasUI();
          atualizarBloqueiosNoSelectTarefa();
          return; // não cria tarefa pendente para redutor
        }

        // ------------------------------
        // FLUXO NORMAL DE COMPRA (tarefa)
        // ------------------------------
        if (saldoDominadora < valor) return alert('Saldo insuficiente!');

        // Limite específico por tarefa
        const agora = Date.now();
        const msBloqueio = getBloqueioMsPorTarefa(tarefa);
        if (msBloqueio > 0) {
          const bloqueada = tarefasBloqueadas.find((t) => t.nome === tarefa && t.expiraEm > agora);
          if (bloqueada) {
            alert(`❌ "${tarefa}" ainda está bloqueada por tempo.\nLibera em ${fmtTempoRestante(bloqueada.expiraEm - agora)}.`);
            return;
          }
          const expiraEm = agora + msBloqueio;
          tarefasBloqueadas.push({ nome: tarefa, expiraEm });
          localStorage.setItem('tarefasBloqueadas', JSON.stringify(tarefasBloqueadas));
          atualizarTarefasLimitadasUI();
          atualizarBloqueiosNoSelectTarefa();
        }

        // Debita e registra histórico
        saldoDominadora -= valor;
        adicionarHistorico(tarefa, valor, 'gasto');

        // Cria pendente
        const novaTarefa = {
          id: Date.now(),
          tarefa: tarefa,
          descricao: descricao,
          valor: valor,
          timestamp: new Date().toISOString(),
        };
        tarefasPendentes.unshift(novaTarefa);
        localStorage.setItem('tarefasPendentes', JSON.stringify(tarefasPendentes));
        if (typeof renderTarefasPendentes === 'function') renderTarefasPendentes();

        // Atualiza saldo e bônus do timer (se existir)
        atualizarSaldo();
        if (typeof aplicarBonusDeTarefaDuranteTimer === 'function') {
          try {
            aplicarBonusDeTarefaDuranteTimer(valor, tarefa);
          } catch {}
        }

        // (Opcional) WhatsApp recibo
        try {
          const numeroWhatsApp = '+14386305973';
          const ultimo = historico[0];
          const dataHora = typeof formatDate === 'function' ? formatDate(ultimo.timestamp) : new Date(ultimo.timestamp).toLocaleString('pt-BR');
          const mensagem = `\n🧾 *RECIBO DE COMPRA* 🧾\n----------------------------------------\n🗓 *Data/Hora:* ${dataHora}\n📌 *Tarefa:* ${tarefa}\n📝 *Descrição:* ${descricao}\n----------------------------------------\n💰 *Valor:* R$ ${valor.toLocaleString(
            'pt-BR'
          )}\n👑 *Saldo Atual:* R$ ${saldoDominadora.toLocaleString('pt-BR')}\n----------------------------------------\n✅ Ganhe saldo e compre serviços sem moderação! 🙏\n`;
          const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
          // window.open(urlWhatsApp, '_blank'); // habilite se quiser abrir automaticamente
        } catch {}
      } else {
        // ------------------------------
        // FLUXO "GANHO"
        // ------------------------------
        const ganhoSelecionado = (selectGanhoSelect && selectGanhoSelect.value) || '';
        const valorInput = valorGanhoInput && valorGanhoInput.value;
        if (!ganhoSelecionado || !valorInput || parseInt(valorInput) <= 0) return alert('Por favor, selecione uma forma de ganho e insira um valor válido.');

        valor = parseInt(valorInput);
        tarefa = ganhoSelecionado;

        const multBonus = typeof getBonusEspecialMultiplier === 'function' ? getBonusEspecialMultiplier() : 1;
        valor = Math.round(valor * multBonus * 100) / 100;

        saldoDominadora += valor;
        adicionarHistorico(tarefa, valor, 'ganho');

        if (selectGanhoSelect) selectGanhoSelect.value = '';
        if (valorGanhoInput) valorGanhoInput.value = '0';
        atualizarSaldo();

        if (typeof aplicarBonusDeTarefaDuranteTimer === 'function') {
          try {
            aplicarBonusDeTarefaDuranteTimer(valor, ganhoSelecionado);
          } catch {}
        }

        // efeito de chuva de dinheiro (se a classe existir)
        if (typeof RainMoney !== 'undefined') {
          try {
            const rainBurst = new RainMoney('💵', 'low');
            rainBurst.startBurningEffect(3000, '🔥', 2000);
          } catch {}
        }
      }
    });
  }

  // ===========================
  // TIMER — usa as vars do timer.js
  // ===========================
  if (btnPlayPause && btnTerminar && tempoDisplay && valorAcumuladoDisplay && valorPorMinutoInput) {
    // 1) primeira pintura (evita UI "parada")
    if (typeof atualizarDisplay === 'function') atualizarDisplay();

    btnPlayPause.addEventListener('click', () => {
      try {
        // inicia sessão se ainda não começou
        if (!timerEmSessao) {
          baseMultiplicadorSessao = 1;
          somaIncrementosValorSessao = 0;
          contadorTarefasTimer = 0;
          valorPorMinutoInput.value = baseMultiplicadorSessao;
          timerEmSessao = true;
          sessionHasEligibleTask = false;
          if (typeof atualizarValorAcumulado === 'function') atualizarValorAcumulado();
        }

        // pausando?
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
          btnPlayPause.textContent = '▶️ Continuar';
          if (typeof releaseWakeLock === 'function') releaseWakeLock();
          return;
        }

        // iniciando contagem
        if (typeof requestWakeLock === 'function') requestWakeLock();

        const INCREMENT_INTERVAL_SECONDS = 3;
        const INCREMENT_VALUE = 0.33;

        timerInterval = setInterval(() => {
          // >>> usa a MESMA variável do timer.js
          tempoSegundos = (typeof tempoSegundos === 'number' ? tempoSegundos : 0) + 1;

          // incremento automático do R$/min quando há tarefa elegível
          if (tempoSegundos % INCREMENT_INTERVAL_SECONDS === 0 && sessionHasEligibleTask) {
            let vpm = parseFloat(valorPorMinutoInput.value) || 0;
            vpm += INCREMENT_VALUE;
            valorPorMinutoInput.value = vpm.toFixed(2);
            if (typeof atualizarValorAcumulado === 'function') atualizarValorAcumulado();
          }

          // atualiza Tempo e Valor na UI (timer.js)
          if (typeof atualizarDisplay === 'function') atualizarDisplay();
        }, 1000);

        btnPlayPause.textContent = '⏸️ Pausar';
      } catch (e) {
        console.error('Erro no timer:', e);
      }
    });

    btnTerminar.addEventListener('click', () => {
      try {
        if (!timerEmSessao) return;

        // parar intervalo e wakelock
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        if (typeof releaseWakeLock === 'function') releaseWakeLock();

        const vpm = parseFloat(valorPorMinutoInput.value) || 0;
        if (vpm <= 0) {
          alert('Insira um valor válido por minuto antes de terminar.');
          return;
        }

        // usa calcularValorTotal do timer.js
        const valorTotal = typeof calcularValorTotal === 'function' ? calcularValorTotal(tempoSegundos, vpm) : Math.round((tempoSegundos / 60) * vpm);

        const multBonus = typeof getBonusEspecialMultiplier === 'function' ? getBonusEspecialMultiplier() : 1;
        const valorCredito = Math.round(valorTotal * multBonus);

        if (valorCredito > 0) {
          saldoDominadora += valorCredito;
          adicionarHistorico(`Ganho por tempo (${tempoDisplay.textContent})`, valorCredito, 'ganho');
          atualizarSaldo();
        }

        // reset de sessão
        valorPorMinutoInput.value = 1;
        contadorTarefasTimer = 0;
        somaIncrementosValorSessao = 0;
        baseMultiplicadorSessao = 1;
        timerEmSessao = false;
        sessionHasEligibleTask = false;
        tempoSegundos = 0;

        if (typeof atualizarDisplay === 'function') atualizarDisplay();
        btnPlayPause.textContent = '▶️ Começar';
      } catch (e) {
        console.error('Erro ao finalizar timer:', e);
      }
    });
  }

  // -----------------------------
  // INICIALIZAÇÃO
  // -----------------------------
  atualizarSaldo();
  renderHistorico();
  if (typeof renderTarefasPendentes === 'function') renderTarefasPendentes();
  if (typeof updateBonusEspecialUI === 'function') updateBonusEspecialUI();
  atualizarTarefasLimitadasUI();
  atualizarBloqueiosNoSelectTarefa();

  // Atualização automática a cada 60s (lista e select)
  setInterval(() => {
    atualizarTarefasLimitadasUI();
    atualizarBloqueiosNoSelectTarefa();
  }, 60000);
});
