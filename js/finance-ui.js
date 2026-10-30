'use strict';
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id),
    F = Finance,
    esc = escapeHTML;
  const statusLabels = { paid: 'Comprado / pago ✅', pending: 'Pendente ❌', cancelled: 'Cancelado', refunded: 'Reembolsado' };
  let state;
  try {
    state = F.validateState(WalletStore.finance());
  } catch (error) {
    storageFailure(error);
    return;
  }
  let editing = null,
    proposed = null,
    receiptSuggestion = null,
    previewRevision = null;
  const today = () => new Date().toLocaleDateString('sv-SE');
  const decimal = (amount) => (amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
  for (const key of ['entryCategory', 'financeCategory']) {
    if (key === 'financeCategory') $(key).add(new Option('Todas as categorias', ''));
    F.categories.forEach((c) => $(key).add(new Option(c, c)));
  }
  $('entryDate').value = today();
  $('importDate').value = today();
  document.querySelectorAll('[data-panel]').forEach(
    (button) =>
      (button.onclick = () => {
        document.querySelectorAll('.app-panel').forEach((panel) => (panel.hidden = panel.id !== button.dataset.panel));
        document.querySelectorAll('[data-panel]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      }),
  );
  function message(text, error = false) {
    $('financeMessage').className = error ? 'notice error' : 'notice';
    $('financeMessage').textContent = text;
  }
  function save(next) {
    F.validateState(next);
    WalletStore.commitFinance(next);
    state = next;
    render();
    window.dispatchEvent(new Event('finance:changed'));
  }
  const filters = () => ({ from: $('financeFrom').value, to: $('financeTo').value, category: $('financeCategory').value, store: $('financeStore').value, status: $('financeStatus').value });
  function entryHTML(e) {
    return `<article class="finance-entry" data-entry="${esc(e.id)}"><header><strong>${esc(e.description)}</strong><strong>${F.format(e.amount, e.currency)}</strong></header><p>${esc(e.date || 'Data não informada')} · ${esc(e.category)}${e.store ? ' · ' + esc(e.store) : ''}</p><span class="status ${e.status}">${statusLabels[e.status]}</span>${e.redemptionId ? '<span class="status">Resgate vinculado</span>' : ''}<div><button data-action="edit">Editar / corrigir</button><button data-action="status">Alterar situação</button><button data-action="refund">Estornar</button><button data-action="delete" class="danger">Excluir</button></div></article>`;
  }
  function render() {
    const all = F.totals(state.entries, state.budget),
      entries = F.filtered(state.entries, filters()),
      t = F.totals(entries, state.budget);
    $('homeTotal').textContent = F.format(all.total);
    $('homePending').textContent = F.format(all.pending);
    $('homeRemaining').textContent = F.format(all.remaining);
    $('homeRemaining').classList.toggle('negative', all.remaining < 0);
    $('financeBudget').value = decimal(state.budget);
    $('financeTotals').textContent =
      `Filtro atual: ${F.format(t.total)} registrados · ${F.format(t.paid)} pagos · ${F.format(t.pending)} pendentes (${t.pendingCount} itens, incluindo USD)\nSomente USD, fora dos reais: ${F.format(t.foreign.USD, 'USD')}\nRestante global após pagos e pendentes: ${F.format(all.remaining)}. Cancelados e reembolsados são excluídos dos totais.`;
    $('categoryTotals').innerHTML = F.categories
      .map(
        (c) =>
          `<details><summary class="category-row"><span>${esc(c)}</span><span>${F.format(t.byCategory[c])}</span></summary>${
            entries
              .filter((e) => e.category === c)
              .map((e) => `<p class="hint">${esc(e.description)} · ${F.format(e.amount, e.currency)} · ${statusLabels[e.status]}</p>`)
              .join('') || '<p class="hint">Sem registros neste filtro.</p>'
          }</details>`,
      )
      .join('');
    $('financeHistory').innerHTML = entries.map(entryHTML).join('') || '<p class="hint">Nenhum lançamento neste período.</p>';
    $('shareText').value = F.summary(entries, state.budget);
    $('financeAudit').innerHTML =
      state.audit
        .slice()
        .reverse()
        .map(
          (a) =>
            `<p class="hint">${esc(a.at)} · ${esc(a.type)} · ${esc(a.before?.description || a.entryId || 'Configuração')}${a.before?.amount ? ' · antes: ' + F.format(a.before.amount, a.before.currency) : ''}${a.after?.amount ? ' · depois: ' + F.format(a.after.amount, a.after.currency) : ''}</p>`,
        )
        .join('') || '<p class="hint">Nenhuma correção registrada.</p>';
  }
  function resetForm() {
    editing = null;
    receiptSuggestion = null;
    $('entryForm').reset();
    $('entryDate').value = today();
    $('entryOrigin').textContent = '';
    $('entryTitle').textContent = 'Novo lançamento';
    $('saveEntry').textContent = 'Registrar lançamento';
    $('cancelEdit').hidden = true;
  }
  function fill(entry, edit = false) {
    for (const [field, key] of [
      ['Category', 'category'],
      ['Store', 'store'],
      ['Description', 'description'],
      ['Date', 'date'],
      ['Currency', 'currency'],
      ['Status', 'status'],
    ])
      $('entry' + field).value = entry[key] || '';
    $('entryAmount').value = entry.amount ? decimal(entry.amount) : '';
    editing = edit ? entry.id : null;
    $('entryTitle').textContent = edit ? 'Editar lançamento' : 'Conferir sugestão do comprovante';
    $('saveEntry').textContent = edit ? 'Confirmar correção' : 'Confirmar e registrar compra';
    $('cancelEdit').hidden = false;
    $('entryOrigin').textContent = entry.originalMoney?.length ? 'Valores originais preservados: ' + entry.originalMoney.map((m) => F.format(m.amount, m.currency)).join(' = ') : '';
    $('entryForm').scrollIntoView({ block: 'start' });
  }
  $('entryForm').onsubmit = (event) => {
    event.preventDefault();
    try {
      const candidate = F.validate({
        category: $('entryCategory').value,
        store: $('entryStore').value,
        description: $('entryDescription').value,
        date: $('entryDate').value,
        amount: F.cents($('entryAmount').value, $('entryCurrency').value),
        currency: $('entryCurrency').value,
        status: $('entryStatus').value,
      });
      if (editing) {
        const existing = state.entries.find((e) => e.id === editing);
        if (existing.redemptionId) throw new Error('Este lançamento pertence a um resgate. Use as ações do resgate para manter os créditos e a despesa consistentes.');
        if (!confirm('Confirmar correção de ' + existing.description + ' para ' + F.format(candidate.amount, candidate.currency) + ' · ' + statusLabels[candidate.status] + '?')) return;
        save(F.update(state, { type: 'edit', id: editing, patch: candidate }));
      } else {
        const duplicate = F.duplicates(state.entries, candidate);
        if (duplicate.length && !confirm('Há registro com a mesma loja, data, valor e moeda. Esta é outra compra?')) return;
        if (receiptSuggestion && !confirm('Confirmar dados conferidos do comprovante e registrar ' + F.format(candidate.amount, candidate.currency) + '?')) return;
        save(F.update(state, { type: 'add', entry: { ...candidate, ...(receiptSuggestion ? { source: 'receipt', originalMoney: [{ currency: candidate.currency, amount: candidate.amount }] } : {}) } }));
      }
      resetForm();
      message('Lançamento salvo. Totais atualizados.');
    } catch (error) {
      message(error.message, true);
    }
  };
  $('cancelEdit').onclick = resetForm;
  $('entryStore').addEventListener('change', () => {
    if (!editing && !$('entryDescription').value.trim() && $('entryStore').value.trim()) $('entryDescription').value = F.nextStoreLabel(state.entries, $('entryStore').value.trim());
  });
  $('financeHistory').onclick = (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.closest('[data-entry]').dataset.entry,
      entry = state.entries.find((e) => e.id === id);
    try {
      if (entry.redemptionId) throw new Error('Use o painel de resgates para alterar esta despesa vinculada.');
      if (button.dataset.action === 'edit') {
        receiptSuggestion = null;
        fill(entry, true);
        return;
      }
      if (button.dataset.action === 'delete') {
        if (!confirm('Excluir ' + entry.description + '? A alteração ficará no registro de correções.')) return;
        save(F.update(state, { type: 'delete', id }));
      } else if (button.dataset.action === 'refund') {
        if (entry.status !== 'paid') throw new Error('Somente lançamentos pagos podem ser reembolsados.');
        if (!confirm('Confirmar reembolso de ' + F.format(entry.amount, entry.currency) + '?')) return;
        save(F.update(state, { type: 'edit', id, patch: { status: 'refunded' } }));
      } else {
        fill(entry, true);
        $('entryStatus').focus();
      }
    } catch (error) {
      message(error.message, true);
    }
  };
  $('saveBudget').onclick = () => {
    try {
      const budget = F.cents($('financeBudget').value);
      if (budget < 0) throw new Error('Orçamento deve ser zero ou positivo.');
      save({ ...state, budget, revision: state.revision + 1 });
      message('Orçamento salvo.');
    } catch (error) {
      message(error.message, true);
    }
  };
  ['financeFrom', 'financeTo', 'financeCategory', 'financeStore', 'financeStatus'].forEach((id) => $(id).addEventListener('input', render));
  $('clearFinanceFilters').onclick = () => {
    ['financeFrom', 'financeTo', 'financeCategory', 'financeStore', 'financeStatus'].forEach((id) => ($(id).value = ''));
    render();
  };
  $('copySummary').onclick = async () => {
    try {
      await navigator.clipboard.writeText($('shareText').value);
      message('Resumo copiado. Escolha a conversa no WhatsApp.');
    } catch {
      $('shareText').select();
      message('Selecione e copie o resumo acima.');
    }
  };
  function renderPreview() {
    const p = proposed;
    $('importPreview').hidden = false;
    const counts = { new: 0, duplicate: 0, conflict: 0 };
    p.rows.forEach((r) => counts[r.disposition]++);
    $('importWarnings').textContent =
      `${counts.new} novos · ${counts.duplicate} repetidos · ${counts.conflict} divergentes\nTotal extraído: ${F.format(p.totals.total)} (antes de ignorar duplicados).\nDuplicados e divergentes não serão salvos. Use “Conferir existente” para corrigir explicitamente um registro.\n` +
      p.warnings.join('\n');
    $('importRows').innerHTML = p.rows
      .map(
        (r, i) =>
          `<div class="preview-row" data-row="${i}"><div class="row-title"><input aria-label="Importar linha ${i + 1}" type="checkbox" ${r.disposition === 'new' ? 'checked' : 'disabled'}><span>Linha ${r.line} · ${esc(r.entry.description)} · ${F.format(r.entry.amount, r.entry.currency)} · ${r.disposition === 'new' ? 'Novo' : r.disposition === 'duplicate' ? 'Já registrado' : 'Divergência'}</span></div>${
            r.disposition === 'new'
              ? `<details><summary>Conferir e corrigir campos</summary><div class="form-grid"><label>Descrição<input data-field="description" value="${esc(r.entry.description)}"></label><label>Loja<input data-field="store" value="${esc(r.entry.store)}"></label><label>Valor<input data-field="amount" value="${decimal(r.entry.amount)}"></label><label>Data<input data-field="date" type="date" value="${esc(r.entry.date)}"></label><label>Moeda<select data-field="currency">${['BRL', 'USD'].map((c) => `<option ${c === r.entry.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></label><label>Situação<select data-field="status">${Object.entries(
                  statusLabels,
                )
                  .map(([k, v]) => `<option value="${k}" ${k === r.entry.status ? 'selected' : ''}>${v}</option>`)
                  .join('')}</select></label><label>Categoria<select data-field="category">${F.categories.map((c) => `<option ${c === r.entry.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label></div></details>`
              : r.existingId
                ? `<button type="button" data-existing="${esc(r.existingId)}">Conferir existente</button>`
                : ''
          }</div>`,
      )
      .join('');
    $('confirmImport').disabled = !counts.new;
  }
  $('previewImport').onclick = () => {
    try {
      proposed = F.preview($('whatsappInput').value, state.entries, $('importDate').value);
      previewRevision = state.revision;
      renderPreview();
    } catch (error) {
      message(error.message, true);
    }
  };
  $('importRows').onclick = (event) => {
    const button = event.target.closest('[data-existing]');
    if (button) {
      const entry = state.entries.find((e) => e.id === button.dataset.existing);
      fill(entry, true);
    }
  };
  $('cancelImport').onclick = () => {
    proposed = null;
    $('importPreview').hidden = true;
  };
  $('confirmImport').onclick = () => {
    try {
      if (!proposed || previewRevision !== state.revision) throw new Error('Os registros mudaram. Analise a lista novamente antes de confirmar.');
      const rows = proposed.rows.map((r, i) => {
        if (r.disposition !== 'new') return r;
        const container = $('importRows').querySelector(`[data-row="${i}"]`);
        if (!container.querySelector('input[type=checkbox]').checked) return { ...r, disposition: 'skipped' };
        const entry = { ...r.entry };
        for (const input of container.querySelectorAll('[data-field]')) if (input.dataset.field !== 'amount') entry[input.dataset.field] = input.value;
        entry.amount = F.cents(container.querySelector('[data-field=amount]').value, entry.currency);
        F.validate(entry);
        return { ...r, entry };
      });
      const next = F.commitPreview(state, { rows }),
        count = next.entries.length - state.entries.length;
      if (!count) throw new Error('Nenhum item novo selecionado.');
      if (!confirm('Salvar ' + count + ' novos lançamentos? Itens repetidos/divergentes serão ignorados.')) return;
      save(next);
      proposed = null;
      $('importPreview').hidden = true;
      $('whatsappInput').value = '';
      message(count + ' lançamentos importados.');
    } catch (error) {
      message(error.message, true);
    }
  };
  function suggest(confidence = null) {
    const result = Receipt.suggest($('receiptText').value, state.entries, confidence);
    receiptSuggestion = result;
    $('receiptWarnings').hidden = false;
    $('receiptWarnings').textContent = result.warnings.join('\n');
    fill(result.entry);
    receiptSuggestion = result;
    $('entryOrigin').textContent = result.warnings.join(' ');
  }
  $('processReceipt').onclick = async () => {
    const file = $('receiptFile').files[0];
    $('processReceipt').disabled = true;
    try {
      const result = await recognizeReceipt(file, (text) => ($('ocrProgress').textContent = text));
      $('receiptText').value = result.text;
      suggest(result.confidence);
      $('ocrProgress').textContent = 'Leitura concluída. Confira a sugestão no formulário; nada foi registrado.';
    } catch (error) {
      $('ocrProgress').textContent = error.message + ' O cadastro manual continua disponível.';
    } finally {
      $('processReceipt').disabled = false;
      $('receiptFile').value = '';
    }
  };
  $('suggestReceipt').onclick = () => {
    try {
      if (!$('receiptText').value.trim()) throw new Error('Insira o texto do comprovante.');
      suggest();
    } catch (error) {
      message(error.message, true);
    }
  };
  window.FinanceUI = { getState: () => structuredClone(state), save, message, render };
  window.addEventListener('redemptions:changed', () => {
    state = F.validateState(WalletStore.finance());
    render();
  });
  render();
});
