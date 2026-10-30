const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  V = require('../js/vault.js'),
  F = require('../js/finance.js');
function memory() {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), map };
}
test('legacy migration preserves old history/balance and reloads structured envelope', async () => {
  const disk = memory();
  disk.setItem('saldoDominadora', '123.45');
  disk.setItem('historico', '[{"valor":12.25}]');
  const w = V.wallet(disk, F.empty(), () => {});
  assert.equal(w.sim.getItem('saldoDominadora'), '123.45');
  assert.equal(disk.getItem('historico'), '[{"valor":12.25}]');
  w.sim.setItem('saldoDominadora', '124.45');
  await Promise.resolve();
  const reload = V.wallet(disk, F.empty(), () => {});
  assert.equal(reload.sim.getItem('saldoDominadora'), '124.45');
});
test('cross-ledger commit atomic, corrupt envelope recovers from previous', () => {
  const disk = memory(),
    w = V.wallet(disk, F.empty(), () => {}),
    next = F.empty();
  next.budget = 10000;
  w.commitBoth(next, { saldoDominadora: '45' });
  const restored = V.wallet(disk, F.empty(), () => {});
  assert.equal(restored.finance().budget, 10000);
  assert.equal(restored.sim.getItem('saldoDominadora'), '45');
  disk.setItem('findom.wallet.v2', 'bad');
  assert.equal(V.wallet(disk, F.empty(), () => {}).snapshot().version, 2);
});
test('failed writes do not replace financial state, concurrent writers rejected', () => {
  const disk = memory(),
    a = V.wallet(disk, F.empty(), () => {}),
    b = V.wallet(disk, F.empty(), () => {});
  a.commitFinance({ ...F.empty(), budget: 100 });
  assert.throws(() => b.commitFinance({ ...F.empty(), budget: 200 }));
  const original = disk.setItem;
  disk.setItem = () => {
    throw new Error('QuotaExceeded');
  };
  assert.throws(() => a.commitFinance({ ...F.empty(), budget: 300 }));
  assert.equal(a.finance().budget, 100);
  disk.setItem = original;
});
