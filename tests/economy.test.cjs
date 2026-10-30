const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  E = require('../js/economy.js');
test('classic prices/gains preserved, balanced nonuniform and catalog complete', () => {
  const a = E.defaults('classic'),
    b = E.defaults('balanced');
  assert.equal(Object.keys(a.prices).length, 17);
  assert.equal(Object.keys(a.gains).length, 12);
  E.config.services.forEach((s) => assert.equal(a.prices[s.id], s.classic));
  assert.ok(new Set(E.config.services.map((s) => s.balanced / s.classic)).size > 5);
  assert.deepEqual(
    E.config.services.slice(0, 12).map((s) => s.balanced),
    [30, 50, 60, 70, 80, 90, 110, 130, 130, 220, 280, 450],
  );
  assert.ok(b.prices[E.config.services[0].id] < a.prices[E.config.services[0].id]);
});
test('quantity bounded, additive extras, configurable bonus and discount precise', () => {
  const s = E.defaults('balanced');
  assert.equal(E.gain(s, E.config.gains[1].id, 999), 60);
  assert.equal(E.gain(s, E.config.gains[3].id, 1, ['chkCatarro']), 35);
  assert.equal(E.adjusted(30, 'cost', true, s), 25.5);
  assert.equal(E.adjusted(12, 'gain', true, s), 13.8);
  s.bonusPercent = 25;
  assert.equal(E.adjusted(12, 'gain', true, s), 15);
});
test('custom catalog validates limits and stores no past operations', () => {
  const s = E.defaults('custom');
  s.prices[E.config.services[0].id] = 22.5;
  s.discountPercent = 10;
  assert.equal(E.validate(s).prices[E.config.services[0].id], 22.5);
  s.timer.maxRate = 0.01;
  assert.throws(() => E.validate(s));
  assert.throws(() => E.defaults('bad'));
});
test('timer integrates rate changes without retroactive gains, caps rate/time', () => {
  const s = E.defaults('balanced');
  let t = E.step({ seconds: 0, earnedUnits: 0, rate: 0.5 }, 60, s, true);
  assert.equal(t.earnedUnits / 6000, 0.5);
  assert.equal(t.rate, 0.55);
  t = E.step(t, 60, s, true);
  assert.equal(t.earnedUnits / 6000, 1.05);
  t = E.step(t, 100000, s, true);
  assert.equal(t.seconds, 7200);
  assert.equal(t.rate, 3);
  assert.ok(t.earnedUnits / 6000 <= 360);
  assert.deepEqual(E.step(t, 60, s, true), t);
});
test('roulette catalog 19 sectors, all rewards reference canonical services', () => {
  assert.equal(E.config.roulette.length, 19);
  for (const s of E.config.roulette) if (s.serviceId) assert.ok(E.config.services.some((i) => i.id === s.serviceId));
  assert.equal(E.config.rouletteCooldownMs, 3 * 24 * 3600000);
  assert.equal(E.config.cooldowns[E.config.services[10].id], 336);
});
