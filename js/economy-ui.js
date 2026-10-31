'use strict';
let economySettings;
try {
  const stored = AppStorage.getItem('economy');
  const previous = stored ? JSON.parse(stored) : null;
  const catalog = AppStorage.getItem('economyCatalog');
  if (catalog) EconomyCatalog.apply(EconomyCatalog.prepare(JSON.parse(catalog), previous || Economy.defaults()).catalog);
  economySettings = Economy.syncCatalog(previous, JSON.parse(AppStorage.getItem('economyCatalogBaseline') || 'null'));
  AppStorage.setItem('economyCatalogBaseline', JSON.stringify(Economy.defaults('custom')));
  if (previous?.mode === 'classic') AppStorage.setItem('economyBeforeBalanced', stored);
  AppStorage.setItem('economy', JSON.stringify(economySettings));
} catch {
  economySettings = Economy.defaults('balanced');
  storageFailure(new Error('Configuração econômica inválida. Valores equilibrados carregados para conferência.'));
}
window.getEconomy = () => economySettings;
document.addEventListener('DOMContentLoaded', () => {
  const marker = (id) => (Economy.config.eligible.includes(id) ? ' 💲' : '');
  function render() {
    document.querySelectorAll('.bonusActiveBanner .bonus-text')[0].textContent = 'BÔNUS ' + economySettings.bonusPercent + '% CRÉDITO';
    document.querySelectorAll('.bonusActiveBanner .bonus-text')[1].textContent = 'DESCONTO ' + economySettings.discountPercent + '% COMPRAS';
    const selected = document.getElementById('selectTarefa').selectedOptions[0]?.value.split('|')[1];
    const services = document.getElementById('selectTarefa');
    services.replaceChildren(new Option('-- Escolher tarefa --', '0'));
    services.options[0].dataset.placeholder = '1';
    for (const item of Economy.config.services) {
      const value = economySettings.prices[item.id];
      const option = new Option(item.label + marker(item.id) + ' — ' + formatBR(value), value + '|' + item.id + '|' + item.description);
      if (item.reduceHours) option.dataset.reduzHoras = item.reduceHours;
      services.appendChild(option);
      if (item.id === selected) option.selected = true;
    }
    const gains = document.getElementById('selectGanho');
    const gainSelected = gains.value;
    gains.replaceChildren(new Option('-- Escolher forma --', ''));
    for (const item of Economy.config.gains) gains.add(new Option(item.id + marker(item.id) + ' — ' + formatBR(economySettings.gains[item.id]), item.id));
    for (const name of Object.keys(Economy.config.gameRewards)) gains.add(new Option(name + marker(name) + ' — sugestão ' + formatBR(economySettings.games[name]), name));
    gains.add(new Option('Outro (valor editável)', 'Outro'));
    gains.value = gainSelected;
    for (const key of Object.keys(Economy.config.extras)) {
      const checkbox = document.getElementById(key);
      checkbox.dataset.value = economySettings.extras[key];
      checkbox.parentElement.lastChild.textContent = ' ' + { chkChule: 'Pés com chulé', chkFrancesinha: 'Francesinha', chkCatarro: 'Cuspe com catarro' }[key] + ' (+' + formatBR(economySettings.extras[key]) + ')';
    }
    document.getElementById('quantidadeMultiplicador').max = economySettings.quantityMax;
    const timerSummary =
      'Base: ' + formatBR(economySettings.timer.base) + '/min · 💲 +' + formatBR(economySettings.timer.autoIncrement) + ' a cada ' + economySettings.timer.autoEvery + ' segundos após uma atividade elegível. Sem teto de tempo ou taxa.';

    document.querySelectorAll('[data-timer-summary]').forEach((el) => {
      el.textContent = timerSummary;
    });

    document.getElementById('customEconomyJson').value = EconomyCatalog.format(EconomyCatalog.document(economySettings));
    if (typeof calcularValorGanho === 'function') calcularValorGanho();
    window.dispatchEvent(new Event('economy:changed'));
    if (window.updateBonusEspecialUI) window.updateBonusEspecialUI();
    if (window.atualizarBloqueiosNoSelectTarefa) window.atualizarBloqueiosNoSelectTarefa();
  }
  document.getElementById('saveCustomEconomy').onclick = () => {
    const feedback = document.getElementById('economyCodeMessage');
    try {
      if (timerEmSessao) throw new Error('Conclua a sessão do cronômetro antes de alterar o catálogo.');
      const text = document.getElementById('customEconomyJson').value;
      if (text.length > 300000) throw new Error('Catálogo muito grande.');
      const input = JSON.parse(text);
      const next = EconomyCatalog.prepare(input, economySettings);
      const snapshot = WalletStore.snapshot();
      WalletStore.commitBoth(snapshot.finance, { ...snapshot.simulator, economy: JSON.stringify(next.settings), economyCatalog: JSON.stringify(input), economyCatalogBaseline: JSON.stringify(next.baseline) });
      EconomyCatalog.apply(next.catalog);
      ELIGIBLE_TASKS.clear();
      next.catalog.eligible.forEach((id) => ELIGIBLE_TASKS.add(id));
      economySettings = next.settings;
      render();
      feedback.className = 'notice';
      feedback.textContent = 'Catálogo salvo. Valores e novas opções já estão disponíveis.';
    } catch (error) {
      feedback.className = 'notice error';
      feedback.textContent = error instanceof SyntaxError ? 'JSON inválido: confira vírgulas, aspas e colchetes. ' + error.message : error.message;
    }
  };
  document.querySelectorAll('[data-jump]').forEach(
    (button) =>
      (button.onclick = () => {
        if (button.dataset.jump === 'roleta') {
          document.getElementById('rouletteSection').scrollIntoView();
          return;
        }
        const select = document.getElementById('tipoTransacao');
        select.value = button.dataset.jump;
        select.dispatchEvent(new Event('change'));
        document.getElementById('transactionTitle').scrollIntoView();
      }),
  );
  render();
});
