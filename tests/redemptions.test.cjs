const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  F = require('../js/finance.js'),
  R = require('../js/redemptions.js');
const initial = () => {
  const f = F.empty();
  f.redemptionRules.enabled = true;
  return f;
};
const request = { type: 'request', request: { creditsCents: 10000, amount: 1000, currency: 'BRL', description: 'Benefício teste' } };
test('request reserves once, approval no expense, completion creates one real expense', () => {
  let r = R.apply(initial(), 20000, request);
  assert.equal(r.creditsCents, 10000);
  assert.equal(r.finance.entries.length, 0);
  const id = r.redemption.id;
  r = R.apply(r.finance, r.creditsCents, { type: 'approve', id });
  assert.equal(r.finance.entries.length, 0);
  const actual = { date: '2026-01-15', amount: 1200, currency: 'BRL', description: 'Benefício teste', store: 'Loja Aurora', category: F.categories[7] };
  r = R.apply(r.finance, r.creditsCents, { type: 'complete', id, actual });
  assert.equal(r.creditsCents, 10000);
  assert.equal(F.totals(r.finance.entries).paid, 1200);
  r = R.apply(r.finance, r.creditsCents, { type: 'correct', id, actual: { ...actual, amount: 1350, category: F.categories[0] } });
  assert.equal(r.finance.entries.length, 1);
  assert.equal(r.creditsCents, 10000);
  assert.equal(F.totals(r.finance.entries).paid, 1350);
  assert.throws(() => R.apply(r.finance, r.creditsCents, { type: 'complete', id, actual }));
  r = R.apply(r.finance, r.creditsCents, { type: 'refund', id });
  assert.equal(r.creditsCents, 20000);
  assert.equal(F.totals(r.finance.entries).total, 0);
  assert.throws(() => R.apply(r.finance, r.creditsCents, { type: 'refund', id }));
});
test('cancellation refunds once and no expense, rules budgets/limits enforced', () => {
  let r = R.apply(initial(), 20000, request);
  const id = r.redemption.id;
  r = R.apply(r.finance, r.creditsCents, { type: 'cancel', id });
  assert.equal(r.creditsCents, 20000);
  assert.equal(r.finance.entries.length, 0);
  assert.throws(() => R.apply(r.finance, r.creditsCents, { type: 'cancel', id }));
  assert.throws(() => R.apply(F.empty(), 20000, request));
  assert.throws(() => R.apply(initial(), 9999, request));
  const s = initial();
  s.redemptionRules.budgetCents = 999;
  assert.throws(() => R.apply(s, 20000, request));
});
test('USD benefits never silently convert, invalid transitions rejected', () => {
  const r = R.apply(initial(), 50000, { ...request, request: { ...request.request, currency: 'USD', amount: 6000 } });
  assert.equal(r.redemption.currency, 'USD');
  assert.equal(r.finance.entries.length, 0);
  assert.throws(() => R.apply(r.finance, r.creditsCents, { type: 'refund', id: r.redemption.id }));
});
