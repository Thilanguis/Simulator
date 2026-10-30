(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.Finance = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const categories = ['Jogo de Buraco', 'Buscar na Casa da Nathalia', 'Comida para Luana e Mel', 'Comida para Luana e Adriana', 'Perfil', 'Match Masters', 'Salário', 'Lista de Compras'];
  const norm = (text) =>
    String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const hash = (text) => {
    let n = 2166136261;
    for (const ch of text) {
      n ^= ch.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return (n >>> 0).toString(16);
  };
  const id = () => globalThis.crypto.randomUUID();
  function cents(value, currency = 'BRL') {
    let text = String(value)
      .replace(/R\$|US\$|USD|BRL|\$/gi, '')
      .trim();
    if (currency === 'BRL') {
      if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) throw new Error('Valor brasileiro inválido: ' + value);
      text = text.replace(/\./g, '').replace(',', '.');
    } else {
      if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
      if (!/^-?\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('Valor em dólar inválido.');
    }
    const sign = text.startsWith('-') ? -1 : 1;
    const [whole, fraction = ''] = text.replace('-', '').split('.');
    const amount = sign * (Number(whole) * 100 + Number(fraction.padEnd(2, '0')));
    if (!Number.isSafeInteger(amount)) throw new Error('Valor fora do limite.');
    return amount;
  }
  function validDate(date) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + 'T12:00:00Z')) && new Date(date + 'T12:00:00Z').toISOString().slice(0, 10) === date;
  }
  function validate(entry) {
    if (!entry || !categories.includes(entry.category) || !['paid', 'pending', 'cancelled', 'refunded'].includes(entry.status)) throw new Error('Categoria ou situação inválida.');
    if (!['BRL', 'USD'].includes(entry.currency) || !Number.isSafeInteger(entry.amount) || entry.amount <= 0) throw new Error('Valor/moeda inválidos.');
    if (entry.date !== '' && !validDate(entry.date)) throw new Error('Data inválida.');
    if (!String(entry.description || '').trim() || String(entry.description).length > 1000 || String(entry.store || '').length > 200) throw new Error('Descrição/loja inválida.');
    if (entry.originalMoney && (!Array.isArray(entry.originalMoney) || entry.originalMoney.some((m) => !['BRL', 'USD'].includes(m.currency) || !Number.isSafeInteger(m.amount) || m.amount <= 0))) throw new Error('Valores originais inválidos.');
    return { ...entry, description: String(entry.description).trim(), store: String(entry.store || '').trim() };
  }
  function totals(entries, budget = 0) {
    let total = 0,
      pending = 0,
      paid = 0,
      pendingCount = 0;
    const byCategory = Object.fromEntries(categories.map((c) => [c, 0]));
    const foreign = { USD: 0 };
    for (const e of entries) {
      if (['cancelled', 'refunded'].includes(e.status)) continue;
      if (e.status === 'pending') pendingCount++;
      if (e.currency !== 'BRL') {
        foreign[e.currency] = (foreign[e.currency] || 0) + e.amount;
        continue;
      }
      total += e.amount;
      byCategory[e.category] += e.amount;
      if (e.status === 'pending') pending += e.amount;
      else paid += e.amount;
    }
    if (![total, pending, paid, budget - total, ...Object.values(byCategory), ...Object.values(foreign)].every(Number.isSafeInteger)) throw new Error('Total fora do limite seguro.');
    return { total, pending, paid, pendingCount, byCategory, foreign, remaining: budget - total };
  }
  function filtered(entries, filters = {}) {
    return entries
      .filter(
        (e) =>
          (!filters.from || e.date >= filters.from) &&
          (!filters.to || e.date <= filters.to) &&
          (!filters.category || e.category === filters.category) &&
          (!filters.status || e.status === filters.status) &&
          (!filters.store || norm(e.store).includes(norm(filters.store))),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }
  function update(state, action) {
    const next = structuredClone(state);
    if (action.type === 'add') {
      const entry = validate({ ...action.entry, id: action.entry.id || id(), createdAt: new Date().toISOString() });
      if (next.entries.some((e) => e.id === entry.id)) throw new Error('Identificador repetido.');
      next.entries.push(entry);
    } else if (action.type === 'edit') {
      const i = next.entries.findIndex((e) => e.id === action.id);
      if (i < 0) throw new Error('Lançamento não encontrado.');
      const old = next.entries[i];
      next.entries[i] = validate({ ...old, ...action.patch, id: old.id, updatedAt: new Date().toISOString() });
      next.audit.push({ id: id(), entryId: old.id, at: new Date().toISOString(), type: 'edit', before: old, after: next.entries[i] });
    } else if (action.type === 'delete') {
      const entry = next.entries.find((e) => e.id === action.id);
      if (!entry) throw new Error('Lançamento não encontrado.');
      next.audit.push({ id: id(), entryId: entry.id, at: new Date().toISOString(), type: 'delete', before: entry });
      next.entries = next.entries.filter((e) => e.id !== action.id);
    } else throw new Error('Operação inválida.');
    totals(next.entries, next.budget);
    next.revision++;
    return next;
  }
  const aliases = [
    ['comida para luana e adriana', 'comida luana e adriana'],
    ['comida para luana e mel', 'comida luana e mel'],
  ];
  function categoryFor(text) {
    const n = norm(text).replace(/[*_]/g, '');
    if (aliases[0].some((v) => n.includes(v))) return categories[3];
    if (aliases[1].some((v) => n.includes(v))) return categories[2];
    if (/buraco/.test(n)) return categories[0];
    if (/nathalia/.test(n)) return categories[1];
    if (/match\s*masters/.test(n)) return categories[5];
    if (/perfil/.test(n)) return categories[4];
    if (/salario/.test(n)) return categories[6];
    if (/lista de compras|^\W*(?:\d+[.)\-:]?\s*)?compras\b/.test(n)) return categories[7];
    return null;
  }
  function moneyTokens(line) {
    const regex = /(R\$|US\$|USD|\$)?\s*(-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:[,.]\d{2})?)(?:\s*(d[oó]lares?|USD))?/gi;
    const found = [];
    for (const m of line.matchAll(regex)) {
      if (!m[1] && !m[3] && !/[,.]\d{2}$/.test(m[2])) continue;
      // A bare decimal on a date is not money.
      const numberStart = m.index + m[0].indexOf(m[2]);
      if (/[\d/]$/.test(line.slice(Math.max(0, numberStart - 1), numberStart))) continue;
      const currency = (m[1] && m[1].toUpperCase() !== 'R$') || m[3] ? 'USD' : 'BRL';
      try {
        const amount = cents(m[2], currency);
        if (amount > 0) found.push({ currency, amount, raw: m[0].trim(), index: m.index, end: m.index + m[0].length });
      } catch {}
    }
    return found;
  }
  const cleanLabel = (text) =>
    text
      .replace(/[✅❌☑✔✗*_]/g, '')
      .replace(/^\s*\d+[.)\-:]\s*/, '')
      .replace(/[\s:;=+–—-]+$/, '')
      .trim();
  const identity = (e) => [norm(e.category), norm(e.description), e.currency, e.amount].join('|');
  function preview(text, existing = [], date) {
    if (date && !validDate(date)) throw new Error('Escolha uma data válida ou deixe em branco quando desconhecida.');
    if (text.length > 200000) throw new Error('Lista muito grande (máximo 200 mil caracteres).');
    const rows = [],
      warnings = [],
      subtotals = [];
    let category = null;
    const occurrences = new Map();
    for (const [i, raw] of text.split(/\r?\n/).entries()) {
      const line = raw.trim();
      if (!line) continue;
      const money = moneyTokens(line);
      if (/^(?:[\W_]*)(?:(?:sub\s*)?total|soma)\b/i.test(norm(line))) {
        const brl = money.find((m) => m.currency === 'BRL');
        if (brl) subtotals.push({ category: /geral/.test(norm(line)) ? null : category, amount: brl.amount, line: i + 1 });
        continue;
      }
      const heading = categoryFor(line);
      if (heading && (!money.length || /^\s*\d+[.)\-:]/.test(line))) category = heading;
      if (!money.length) {
        if (!heading) warnings.push('Linha ' + (i + 1) + ': sem valor reconhecido; confira se era um item.');
        continue;
      }
      if (!category) {
        warnings.push('Linha ' + (i + 1) + ': categoria não reconhecida; item não importado.');
        continue;
      }
      const status = /reembolsad|estornad/i.test(line) ? 'refunded' : /cancelad/i.test(line) ? 'cancelled' : /✅|☑|✔/.test(line) ? 'paid' : 'pending';
      if (!/[✅❌☑✔✗]/.test(line)) warnings.push('Linha ' + (i + 1) + ': sem situação; sugerido pendente.');
      const equivalence = /=/.test(line) && money.some((m) => m.currency === 'BRL') && money.some((m) => m.currency === 'USD');
      const groups = equivalence ? [money] : money.map((m) => [m]);
      const label = cleanLabel(line.slice(0, money[0].index)) || category;
      for (const [j, group] of groups.entries()) {
        const primary = group.find((m) => m.currency === 'BRL') || group[0];
        const description = label + (groups.length > 1 ? ' · jogo ' + (j + 1) : '');
        const store = category === categories[7] ? label.replace(/\s*\(\d+\)\s*$/, '').trim() : '';
        const semantic = [category, norm(label), group.map((m) => m.currency + ':' + m.amount).join('='), j].join('|');
        const count = (occurrences.get(semantic) || 0) + 1;
        occurrences.set(semantic, count);
        const importKey = 'wa:' + hash(semantic + '|' + count);
        const slot = /\(\d+\)/.test(label) ? category + '|' + norm(label) : null;
        const dateMatch = line.match(/\b(\d{2})[/-](\d{2})[/-](\d{4})\b/);
        const parsedDate = dateMatch ? dateMatch[3] + '-' + dateMatch[2] + '-' + dateMatch[1] : line.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
        const entry = {
          id: id(),
          date: parsedDate && validDate(parsedDate) ? parsedDate : date || '',
          category,
          description,
          store,
          currency: primary.currency,
          amount: primary.amount,
          status,
          originalMoney: group.map(({ currency, amount, raw }) => ({ currency, amount, raw })),
          sourceText: line,
          importKey,
          importSlot: slot,
          createdAt: new Date().toISOString(),
        };
        const previous = existing.find((e) => e.importKey === importKey) || existing.find((e) => !e.importKey && identity(e) === identity(entry) && e.date === entry.date);
        const collision = !previous && slot && existing.find((e) => e.importSlot === slot);
        const disposition = previous ? (previous.status !== status || previous.amount !== entry.amount || previous.currency !== entry.currency ? 'conflict' : 'duplicate') : collision ? 'conflict' : 'new';
        rows.push({ entry, line: i + 1, disposition, existingId: previous?.id || collision?.id });
      }
    }
    const computed = totals(rows.map((r) => r.entry));
    for (const subtotal of subtotals) {
      const actual = subtotal.category ? computed.byCategory[subtotal.category] : computed.total;
      if (subtotal.amount !== actual) warnings.push('Linha ' + subtotal.line + ': subtotal informado ' + format(subtotal.amount) + '; recalculado ' + format(actual) + '.');
    }
    if (computed.foreign.USD) warnings.push('Valores somente em USD ficam fora dos totais em reais.');
    return { rows, warnings, totals: computed };
  }
  function commitPreview(state, proposed) {
    let next = state;
    const seen = new Set(state.entries.map((e) => e.importKey).filter(Boolean));
    for (const row of proposed.rows) {
      if (row.disposition !== 'new' || seen.has(row.entry.importKey)) continue;
      // Recheck against the current state, not just an earlier preview.
      if (row.entry.importSlot && next.entries.some((e) => e.importSlot === row.entry.importSlot)) continue;
      next = update(next, { type: 'add', entry: row.entry });
      seen.add(row.entry.importKey);
    }
    return next;
  }
  function duplicates(entries, candidate) {
    return entries.filter((e) => e.currency === candidate.currency && e.amount === candidate.amount && e.date === candidate.date && norm(e.store) === norm(candidate.store));
  }
  function nextStoreLabel(entries, store) {
    const used = entries.filter((e) => norm(e.store) === norm(store)).map((e) => Number(e.description.match(/\((\d+)\)/)?.[1] || 0));
    return store + ' (' + (Math.max(0, ...used) + 1) + ')';
  }
  function format(amount, currency = 'BRL') {
    return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency });
  }
  function summary(entries, budget) {
    const t = totals(entries, budget);
    return [
      'Controle Financeiro (filtro atual)',
      ...categories.map((c) => c + ': ' + format(t.byCategory[c])),
      'Total registrado: ' + format(t.total),
      'Pago: ' + format(t.paid),
      'Pendente: ' + format(t.pending) + ' (' + t.pendingCount + ' itens, incluindo moeda estrangeira)',
      'Orçamento: ' + format(budget),
      'Restante após todos os registros: ' + format(t.remaining),
      'Somente USD (fora do total): ' + format(t.foreign.USD, 'USD'),
      '',
      ...filtered(entries).map((e) => `${e.date || 'Data não informada'} ${{ paid: '✅ Pago', pending: '❌ Pendente', cancelled: 'Cancelado', refunded: 'Reembolsado' }[e.status]} ${e.category} · ${e.description}: ${format(e.amount, e.currency)}`),
    ].join('\n');
  }
  function validateState(data) {
    if (!data || data.version !== 2 || !Number.isSafeInteger(data.budget) || data.budget < 0 || !Number.isSafeInteger(data.revision) || !Array.isArray(data.entries) || !Array.isArray(data.audit)) throw new Error('Backup financeiro inválido.');
    const entries = data.entries.map(validate);
    if (entries.some((e) => typeof e.id !== 'string' || !e.id) || new Set(entries.map((e) => e.id)).size !== entries.length) throw new Error('IDs inválidos ou repetidos.');
    for (const correction of data.audit) {
      if (!correction || typeof correction.type !== 'string' || !Number.isFinite(Date.parse(correction.at))) throw new Error('Registro de correção inválido.');
      if (correction.before) validate(correction.before);
      if (correction.after) validate(correction.after);
    }
    totals(entries, data.budget);
    if (!Array.isArray(data.redemptions) || !data.redemptionRules) throw new Error('Resgates/configuração ausentes no backup.');
    return { ...data, entries };
  }
  const empty = () => ({ version: 2, revision: 0, budget: 0, entries: [], audit: [], redemptions: [], redemptionRules: structuredClone(typeof module === 'object' ? require('./economy-config.js').redemptionRules : EconomyConfig.redemptionRules) });
  return { categories, norm, cents, validDate, validate, totals, filtered, update, preview, commitPreview, duplicates, nextStoreLabel, format, summary, validateState, empty, moneyTokens, categoryFor };
});
