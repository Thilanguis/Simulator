const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  F = require('../js/finance.js'),
  L = require('../js/finance-list.js');
test('numbered groups preserve imported item order, combined game lines, currency equivalents and totals', () => {
  const p = F.preview('1. Perfil\n• Primeiro: R$ 11,00\n• Segundo em partes: R$ 12,00 + R$ 3,00\n2. Comida para Luana e Mel\n• $5 dólares = R$ 20,00\n3. Lista de Compras\n• Loja Aurora ✅: R$ 40,00\n• Item Lunar ❌: $8,00 x3', [], '');
  const entries = F.commitPreview(F.empty(), p).entries,
    groups = L.sections(entries),
    text = L.text(entries);
  assert.equal(groups.length, 8);
  assert.equal(groups[4].rows.length, 2);
  assert.match(L.rowText(groups[4].rows[1], false), /12,00.*3,00/);
  assert.match(L.rowText(groups[2].rows[0], false), /\$.*5,00 = R\$/);
  assert.match(text, /Loja Aurora ✅/);
  assert.match(text, /Item Lunar ✅.*×3/);
  assert.match(text, /9\. Resumo Final/);
  assert.match(text, /Total Geral Atualizado.*86,00/);
  assert.ok(text.indexOf('Primeiro:') < text.indexOf('Segundo em partes:'));
});

test('adding items recalculates all group totals and the grand total from current entries', () => {
  let state = F.empty();
  const add = (category, description, amount) => {
    state = F.update(state, { type: 'add', entry: { category, description, amount, currency: 'BRL', status: 'paid', date: '' } });
  };
  add(F.categories[7], 'Compra A', 1000);
  add(F.categories[0], 'Partida A', 500);
  let calculation = L.calculate(state.entries);
  assert.equal(calculation.groups[7].total, 1000);
  assert.equal(calculation.total, 1500);
  add(F.categories[7], 'Compra B', 2500);
  calculation = L.calculate(state.entries);
  assert.equal(calculation.groups[7].total, 3500);
  assert.equal(calculation.total, 4000);
  assert.equal(
    calculation.total,
    calculation.groups.reduce((sum, group) => sum + group.total, 0),
  );
  assert.match(L.text(state.entries), /Total Geral Atualizado.*40,00/);
});
