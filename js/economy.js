(function (root, factory) {
  const api = factory(typeof module === 'object' ? require('./economy-config.js') : root.EconomyConfig);
  if (typeof module === 'object') module.exports = api;
  else root.Economy = api;
})(typeof window === 'object' ? window : globalThis, function (config) {
  const round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const tiers = config.timerTaskTiers;
  function defaults(mode = 'balanced') {
    if (!['classic', 'balanced', 'custom'].includes(mode)) throw new Error('Modo inválido.');
    const base = mode === 'classic' ? 'classic' : 'balanced';
    return {
      mode,
      bonusPercent: config.bonusPercent,
      discountPercent: config.discountPercent,
      rouletteWeights: Object.fromEntries(config.roulette.map((s) => [s.label, s.weight])),
      benefits: Object.fromEntries(config.services.filter((s) => s.realBenefit).map((s) => [s.id, { ...s.realBenefit }])),
      prices: Object.fromEntries(config.services.map((s) => [s.id, s[base]])),
      gains: Object.fromEntries(config.gains.map((s) => [s.id, s[base]])),
      extras: Object.fromEntries(Object.entries(config.extras).map(([id, v]) => [id, v[base]])),
      games: { ...config.gameRewards },
      timer: { ...config.timer[base] },
      quantityMax: mode === 'classic' ? config.classicQuantityMax : config.quantityMax,
      manualGainMax: mode === 'classic' ? config.classicManualGainMax : config.manualGainMax,
    };
  }
  function validate(input) {
    if (!input || !['classic', 'balanced', 'custom'].includes(input.mode)) throw new Error('Configuração econômica inválida.');
    if (input.mode !== 'custom') return defaults(input.mode);
    const result = defaults('custom');
    for (const group of ['prices', 'gains', 'extras', 'games', 'timer', 'rouletteWeights']) {
      for (const key of Object.keys(result[group])) {
        const n = input[group]?.[key];
        const validPrecision = group === 'timer' ? Math.abs(Math.round(n * 10000) / 10000 - n) < 1e-9 : round(n) === n;
        if (!Number.isFinite(n) || n <= 0 || n > 1000000 || !validPrecision) throw new Error('Valor inválido em ' + group + ': ' + key);
        result[group][key] = n;
      }
    }
    for (const key of ['quantityMax', 'manualGainMax']) {
      const n = input[key];
      if (!Number.isFinite(n) || n <= 0 || n > 1000000) throw new Error('Limite inválido: ' + key);
      result[key] = n;
    }
    for (const key of ['bonusPercent', 'discountPercent']) {
      if (!Number.isFinite(input[key]) || input[key] < 0 || input[key] > (key === 'discountPercent' ? 99 : 1000)) throw new Error('Percentual inválido: ' + key);
      result[key] = input[key];
    }
    for (const id of Object.keys(result.benefits)) {
      const b = input.benefits?.[id];
      if (!b || !['BRL', 'USD'].includes(b.currency) || !Number.isSafeInteger(b.amount) || b.amount <= 0) throw new Error('Benefício real inválido.');
      result.benefits[id] = { currency: b.currency, amount: b.amount };
    }
    if (result.timer.maxRate < result.timer.base || !Number.isInteger(result.timer.autoEvery) || !Number.isInteger(result.quantityMax)) throw new Error('Limites do cronômetro/quantidade inválidos.');
    return result;
  }
  function gain(settings, id, quantity = 1, extras = []) {
    let amount = settings.gains[id] ?? settings.games[id] ?? 0;
    for (const extra of extras) amount += settings.extras[extra] || 0;
    if (id === config.gains[1].id) amount *= Math.min(settings.quantityMax, Math.max(1, Math.floor(Number(quantity) || 1)));
    return round(amount);
  }
  function adjusted(value, kind, active, settings = config) {
    return round(value * (active ? (kind === 'gain' ? 1 + settings.bonusPercent / 100 : 1 - settings.discountPercent / 100) : 1));
  }
  function taskIncrement(value, settings) {
    if (!(value > 0)) return 0;
    // Balanced thresholds use the corresponding classic activity/service value.
    return (tiers.find(([min]) => value >= min)?.[1] || 0.4) * settings.timer.taskScale;
  }
  function step(state, seconds, settings, eligible = false) {
    const result = { ...state };
    const limit = Math.floor(settings.timer.maxMinutes * 60);
    const end = Math.min(limit, result.seconds + Math.max(0, Math.floor(seconds)));
    // Integrate each earned interval at its actual rate; increases never reprice past time.
    while (result.seconds < end) {
      result.earnedUnits = (result.earnedUnits || 0) + Math.round(result.rate * 100);
      result.seconds++;
      if (eligible && result.seconds % settings.timer.autoEvery === 0) result.rate = Math.min(settings.timer.maxRate, round(result.rate + settings.timer.autoIncrement));
    }
    return result;
  }
  function drawRoulette(settings, random = Math.random) {
    const weights = config.roulette.map((s) => settings.rouletteWeights[s.label]);
    let sample = random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < weights.length; i++) {
      sample -= weights[i];
      if (sample < 0) return i;
    }
    return weights.length - 1;
  }
  return { config, round, defaults, validate, gain, adjusted, taskIncrement, step, drawRoulette };
});
