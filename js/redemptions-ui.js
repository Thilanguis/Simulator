document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id),
    F = Finance,
    R = Redemptions;
  const labels = { requested: 'Solicitado · créditos reservados', approved: 'Aprovado · aguarda pagamento', completed: 'Concluído · pago', cancelled: 'Cancelado · créditos devolvidos', refunded: 'Reembolsado · créditos devolvidos' };
  let completionId = null,
    completionAction = 'complete';
  F.categories.forEach((c) => $('completionCategory').add(new Option(c, c)));
  function message(error) {
    FinanceUI.message(error.message || error, true);
    $('redemptionMessage').textContent = error.message || error;
  }
  function render() {
    const state = FinanceUI.getState(),
      rules = state.redemptionRules;
    $('redemptionEnabled').checked = rules.enabled;
    for (const [id, key] of [
      ['conversionRate', 'centsPerCredit'],
      ['redemptionMin', 'minCredits'],
      ['redemptionMax', 'maxCredits'],
      ['redemptionMaxOpen', 'maxOpen'],
    ])
      $(id).value = rules[key];
    $('redemptionBudget').value = (rules.budgetCents / 100).toFixed(2).replace('.', ',');
    $('redemptionUsdBudget').value = (rules.usdBudgetCents / 100).toFixed(2).replace('.', ',');
    $('redemptionList').innerHTML =
      state.redemptions
        .slice()
        .reverse()
        .map(
          (r) =>
            `<article class="finance-entry" data-redemption="${escapeHTML(r.id)}"><strong>${escapeHTML(r.description)}</strong><p>${(r.creditsCents / 100).toLocaleString('pt-BR')} créditos → ${F.format(r.amount, r.currency)}</p><span class="status">${labels[r.status]}</span><div>${r.status === 'requested' ? '<button data-action="approve">Aprovar</button>' : ''}${['requested', 'approved'].includes(r.status) ? '<button data-action="cancel">Cancelar e devolver créditos</button>' : ''}${r.status === 'approved' ? '<button data-action="complete">Registrar pagamento ocorrido</button>' : ''}${r.status === 'completed' ? '<button data-action="correct">Corrigir pagamento</button><button data-action="refund">Confirmar reembolso e estornar créditos</button>' : ''}</div></article>`,
        )
        .join('') || '<p class="hint">Nenhum resgate solicitado.</p>';
    updateQuote();
  }
  function updateQuote() {
    const rules = FinanceUI.getState().redemptionRules,
      credits = Number($('redemptionCredits').value);
    $('redemptionQuote').textContent =
      Number.isFinite(credits) && credits > 0 ? credits + ' créditos → ' + F.format(Math.round(credits * rules.centsPerCredit)) + ' · ' + (rules.enabled ? 'conversão configurada' : 'resgates desativados') : 'Informe os créditos desejados.';
  }
  function transact(action) {
    syncTimer();
    persistTimer();
    AppStorage.flush();
    const snapshot = WalletStore.snapshot();
    const credits = Math.round(Number(snapshot.simulator.saldoDominadora || 0) * 100);
    const blocks = JSON.parse(snapshot.simulator.tarefasBloqueadas || '[]');
    if (action.type === 'request' && action.request.serviceId && blocks.some((b) => b.nome === action.request.serviceId && b.expiraEm > Date.now())) throw new Error('O benefício ainda está em cooldown.');
    const result = R.apply(snapshot.finance, credits, action);
    const simulator = { ...snapshot.simulator, saldoDominadora: String(result.creditsCents / 100) };
    if (action.type === 'request' && action.request.serviceId) {
      const hours = Economy.config.cooldowns[action.request.serviceId];
      if (hours) blocks.push({ nome: action.request.serviceId, expiraEm: Date.now() + hours * 3600000, redemptionId: result.redemption.id });
      simulator.tarefasBloqueadas = JSON.stringify(blocks);
    } else if (['cancel', 'refund'].includes(action.type)) simulator.tarefasBloqueadas = JSON.stringify(blocks.filter((b) => b.redemptionId !== result.redemption.id));
    if (result.delta) {
      const history = JSON.parse(simulator.historico || '[]');
      history.unshift({
        id: 'resgate:' + result.redemption.id + ':' + action.type,
        timestamp: new Date().toISOString(),
        tipo: result.delta > 0 ? 'ganho' : 'gasto',
        descricao: (result.delta > 0 ? 'Estorno de resgate: ' : 'Reserva de resgate: ') + result.redemption.description,
        valor: Math.abs(result.delta) / 100,
        saldoAtual: result.creditsCents / 100,
        redemptionId: result.redemption.id,
        economyMode: getEconomy().mode,
      });
      simulator.historico = JSON.stringify(history);
    }
    WalletStore.commitBoth(result.finance, simulator);
    window.dispatchEvent(new Event('wallet:credits'));
    window.dispatchEvent(new Event('redemptions:changed'));
    render();
    $('redemptionMessage').textContent = 'Resgate atualizado. Nenhum pagamento bancário foi executado.';
  }
  $('saveRedemptionRules').onclick = () => {
    try {
      const previous = FinanceUI.getState();
      const rules = R.rules({
        enabled: $('redemptionEnabled').checked,
        centsPerCredit: Number($('conversionRate').value),
        minCredits: Number($('redemptionMin').value),
        maxCredits: Number($('redemptionMax').value),
        maxOpen: Number($('redemptionMaxOpen').value),
        budgetCents: F.cents($('redemptionBudget').value),
        usdBudgetCents: F.cents($('redemptionUsdBudget').value, 'USD'),
      });
      FinanceUI.save({ ...previous, redemptionRules: rules, revision: previous.revision + 1 });
      render();
      $('redemptionMessage').textContent = 'Regras salvas. Solicitações anteriores mantêm a conversão original.';
    } catch (error) {
      message(error);
    }
  };
  window.requestRedemption = (request) => {
    try {
      const rules = FinanceUI.getState().redemptionRules;
      const amount = request.amount ?? Math.round(request.credits * rules.centsPerCredit),
        currency = request.currency || 'BRL';
      if (!confirm('Solicitar ' + F.format(amount, currency) + ' por ' + request.credits + ' créditos? Os créditos serão reservados agora. A despesa será registrada somente após confirmar o pagamento.')) return;
      transact({ type: 'request', request: { creditsCents: Math.round(request.credits * 100), amount, currency, serviceId: request.serviceId, description: request.description || 'Resgate de créditos' } });
      document.querySelector('[data-panel=financePanel]').click();
      $('redemptionsSection').scrollIntoView();
    } catch (error) {
      message(error);
    }
  };
  $('requestRedemption').onclick = () => {
    const credits = Number($('redemptionCredits').value);
    if (!Number.isFinite(credits) || credits <= 0) return message('Informe créditos válidos.');
    window.requestRedemption({ credits, description: 'Conversão de créditos' });
  };
  $('redemptionCredits').oninput = updateQuote;
  $('redemptionList').onclick = (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.closest('[data-redemption]').dataset.redemption,
      action = button.dataset.action;
    try {
      if (action === 'complete' || action === 'correct') {
        const r = FinanceUI.getState().redemptions.find((r) => r.id === id);
        completionAction = action;
        completionId = id;
        const previous = action === 'correct' ? FinanceUI.getState().entries.find((e) => e.redemptionId === id) : null;
        $('completionAmount').value = ((previous?.amount ?? r.amount) / 100).toFixed(2).replace('.', ',');
        $('completionCurrency').value = previous?.currency ?? r.currency;
        $('completionDate').value = previous?.date ?? new Date().toLocaleDateString('sv-SE');
        $('completionStore').value = previous?.store || '';
        $('completionCategory').value = previous?.category || F.categories[7];
        $('completionError').textContent = '';
        $('completionDialog').showModal();
        return;
      }
      if (
        !confirm(
          action === 'refund'
            ? 'Confirmar que o dinheiro foi realmente reembolsado? A despesa será estornada e os créditos devolvidos uma vez.'
            : action === 'cancel'
              ? 'Cancelar a solicitação e devolver os créditos reservados?'
              : 'Aprovar esta solicitação? A despesa continua aguardando pagamento.',
        )
      )
        return;
      transact({ type: action, id });
    } catch (error) {
      message(error);
    }
  };
  $('completionForm').onsubmit = (event) => {
    event.preventDefault();
    try {
      const redemption = FinanceUI.getState().redemptions.find((r) => r.id === completionId);
      const actual = {
        amount: F.cents($('completionAmount').value, $('completionCurrency').value),
        currency: $('completionCurrency').value,
        date: $('completionDate').value,
        store: $('completionStore').value,
        description: redemption.description,
        category: $('completionCategory').value,
        status: 'paid',
      };
      if (
        F.duplicates(
          FinanceUI.getState().entries.filter((e) => e.redemptionId !== completionId),
          actual,
        ).length &&
        !confirm('Há despesa semelhante. Este pagamento ainda precisa ser registrado?')
      )
        return;
      if (!confirm((completionAction === 'correct' ? 'Confirmar correção do pagamento para ' : 'Confirmar pagamento efetivamente realizado de ') + F.format(actual.amount, actual.currency) + '?')) return;
      transact({ type: completionAction, id: completionId, actual });
      $('completionDialog').close();
    } catch (error) {
      $('completionError').textContent = error.message;
    }
  };
  $('cancelCompletion').onclick = () => $('completionDialog').close();
  window.addEventListener('finance:changed', render);
  render();
});
