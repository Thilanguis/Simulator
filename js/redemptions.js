(function (root, factory) {
  const api = factory(typeof module === 'object' ? require('./finance.js') : root.Finance);
  if (typeof module === 'object') module.exports = api;
  else root.Redemptions = api;
})(typeof window === 'object' ? window : globalThis, function (F) {
  const statuses = ['requested', 'approved', 'completed', 'cancelled', 'refunded'];
  function rules(input) {
    if (!input || typeof input.enabled !== 'boolean') throw new Error('Regras de resgate inválidas.');
    for (const key of ['centsPerCredit', 'minCredits', 'maxCredits', 'budgetCents', 'usdBudgetCents', 'maxOpen']) if (!Number.isSafeInteger(input[key]) || input[key] < 0 || input[key] > 100000000) throw new Error('Regra inválida: ' + key);
    if (!input.centsPerCredit || !input.minCredits || (input.maxCredits && input.maxCredits < input.minCredits)) throw new Error('Conversão e limites inválidos.');
    return { ...input };
  }
  function validate(state) {
    rules(state.redemptionRules);
    const ids = new Set();
    for (const r of state.redemptions) {
      if (
        typeof r.id !== 'string' ||
        ids.has(r.id) ||
        !statuses.includes(r.status) ||
        !Number.isSafeInteger(r.creditsCents) ||
        r.creditsCents <= 0 ||
        !Number.isSafeInteger(r.amount) ||
        r.amount <= 0 ||
        !['BRL', 'USD'].includes(r.currency) ||
        typeof r.description !== 'string'
      )
        throw new Error('Solicitação de resgate inválida.');
      ids.add(r.id);
      const linked = state.entries.filter((e) => e.redemptionId === r.id);
      if (['completed', 'refunded'].includes(r.status)) {
        if (linked.length !== 1 || linked[0].status !== (r.status === 'completed' ? 'paid' : 'refunded')) throw new Error('Despesa de resgate inconsistente.');
      } else if (linked.length) throw new Error('Resgate não pago com despesa vinculada.');
    }
    if (state.entries.some((e) => e.redemptionId && !ids.has(e.redemptionId))) throw new Error('Despesa vinculada a resgate inexistente.');
    return state;
  }
  function apply(finance, creditsCents, action) {
    if (!Number.isSafeInteger(creditsCents)) throw new Error('Saldo fictício inválido.');
    const next = structuredClone(finance),
      now = new Date().toISOString();
    let delta = 0,
      redemption;
    if (action.type === 'request') {
      const config = rules(next.redemptionRules),
        c = action.request;
      if (!config.enabled) throw new Error('Ative e configure as regras de resgate antes de solicitar.');
      if (!Number.isSafeInteger(c.creditsCents) || c.creditsCents < config.minCredits * 100 || (config.maxCredits && c.creditsCents > config.maxCredits * 100)) throw new Error('Quantidade de créditos fora dos limites de resgate.');
      if (c.creditsCents > creditsCents) throw new Error('Créditos insuficientes.');
      if (config.maxOpen && next.redemptions.filter((r) => ['requested', 'approved'].includes(r.status)).length >= config.maxOpen) throw new Error('Limite de solicitações abertas atingido.');
      if (!['BRL', 'USD'].includes(c.currency) || !Number.isSafeInteger(c.amount) || c.amount <= 0) throw new Error('Valor do benefício inválido.');
      const budget = c.currency === 'BRL' ? config.budgetCents : config.usdBudgetCents;
      const reserved = next.redemptions.filter((r) => r.currency === c.currency && !['cancelled', 'refunded'].includes(r.status)).reduce((sum, r) => sum + r.amount, 0);
      if (budget && reserved + c.amount > budget) throw new Error('Orçamento de resgates nesta moeda esgotado (inclui reservas e concluídos).');
      redemption = { ...c, id: crypto.randomUUID(), status: 'requested', createdAt: now };
      next.redemptions.push(redemption);
      delta = -c.creditsCents;
    } else {
      redemption = next.redemptions.find((r) => r.id === action.id);
      if (!redemption) throw new Error('Resgate não encontrado.');
      const before = redemption.status;
      if (action.type === 'approve' && before === 'requested') redemption.status = 'approved';
      else if (action.type === 'cancel' && ['requested', 'approved'].includes(before)) {
        redemption.status = 'cancelled';
        delta = redemption.creditsCents;
      } else if (action.type === 'complete' && before === 'approved') {
        const actual = F.validate({
          ...action.actual,
          id: crypto.randomUUID(),
          category: action.actual.category || F.categories[7],
          status: 'paid',
          redemptionId: redemption.id,
          originalMoney: [{ currency: redemption.currency, amount: redemption.amount }],
          createdAt: now,
        });
        next.entries.push(actual);
        redemption.status = 'completed';
        redemption.expenseId = actual.id;
      } else if (action.type === 'correct' && before === 'completed') {
        const index = next.entries.findIndex((e) => e.redemptionId === redemption.id);
        if (index < 0) throw new Error('Despesa vinculada não encontrada.');
        const old = next.entries[index];
        next.entries[index] = F.validate({ ...old, ...action.actual, id: old.id, redemptionId: redemption.id, status: 'paid', originalMoney: old.originalMoney, updatedAt: now });
        next.audit.push({ id: crypto.randomUUID(), at: now, type: 'correção de pagamento', entryId: old.id, before: old, after: next.entries[index] });
      } else if (action.type === 'refund' && before === 'completed') {
        const expense = next.entries.find((e) => e.redemptionId === redemption.id);
        if (!expense || expense.status !== 'paid') throw new Error('Despesa vinculada não encontrada.');
        expense.status = 'refunded';
        expense.updatedAt = now;
        redemption.status = 'refunded';
        delta = redemption.creditsCents;
      } else throw new Error('Transição de resgate inválida ou já aplicada.');
      redemption.updatedAt = now;
      next.audit.push({ id: crypto.randomUUID(), at: now, type: 'resgate: ' + before + ' → ' + redemption.status, entryId: redemption.id });
    }
    next.revision++;
    F.totals(next.entries, next.budget);
    validate(next);
    return { finance: next, creditsCents: creditsCents + delta, delta, redemption };
  }
  return { rules, apply, validate };
});
