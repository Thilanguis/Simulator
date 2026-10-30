'use strict';
let economySettings;
try {
  economySettings = Economy.validate(JSON.parse(AppStorage.getItem('economy') || 'null') || Economy.defaults(AppStorage.getItem('saldoDominadora') !== null || AppStorage.getItem('historico') !== null ? 'classic' : 'balanced'));
} catch {
  economySettings = Economy.defaults('classic');
  storageFailure(new Error('Configuração econômica inválida. Modo Clássico carregado para conferência.'));
}
window.getEconomy = () => economySettings;
if (!AppStorage.getItem('economy')) AppStorage.setItem('economy', JSON.stringify(economySettings));
document.addEventListener('DOMContentLoaded', () => {
  const mode = document.getElementById('economyMode');
  const editor = document.getElementById('customEconomy');
  const json = document.getElementById('customEconomyJson');
  function render() {
    mode.value = economySettings.mode;
    document.querySelectorAll('.bonusActiveBanner .bonus-text')[0].textContent = 'BÔNUS ' + economySettings.bonusPercent + '% CRÉDITO';
    document.querySelectorAll('.bonusActiveBanner .bonus-text')[1].textContent = 'DESCONTO ' + economySettings.discountPercent + '% COMPRAS';
    const selected = document.getElementById('selectTarefa').selectedOptions[0]?.value.split('|')[1];
    const services = document.getElementById('selectTarefa');
    services.replaceChildren(new Option('-- Escolher tarefa --', '0'));
    services.options[0].dataset.placeholder = '1';
    for (const item of Economy.config.services) {
      const value = economySettings.prices[item.id];
      const option = new Option(item.label + ' — ' + value.toLocaleString('pt-BR') + ' créditos', value + '|' + item.id + '|' + item.description);
      if (item.reduceHours) option.dataset.reduzHoras = item.reduceHours;
      services.appendChild(option);
      if (item.id === selected) option.selected = true;
    }
    const gains = document.getElementById('selectGanho');
    const gainSelected = gains.value;
    gains.replaceChildren(new Option('-- Escolher forma --', ''));
    for (const item of Economy.config.gains) gains.add(new Option(item.id + ' — ' + economySettings.gains[item.id] + ' créditos', item.id));
    for (const name of Object.keys(Economy.config.gameRewards)) gains.add(new Option(name + ' — sugestão ' + economySettings.games[name] + ' créditos', name));
    gains.add(new Option('Outro (valor editável)', 'Outro'));
    gains.value = gainSelected;
    for (const key of Object.keys(Economy.config.extras)) {
      const checkbox = document.getElementById(key);
      checkbox.dataset.value = economySettings.extras[key];
      checkbox.parentElement.lastChild.textContent = ' ' + { chkChule: 'Pés com chulé', chkFrancesinha: 'Francesinha', chkCatarro: 'Cuspe com catarro' }[key] + ' (+' + economySettings.extras[key] + ' créditos)';
    }
    document.getElementById('quantidadeMultiplicador').max = economySettings.quantityMax;
    document.getElementById('timerLimits').textContent =
      'Limite: ' + economySettings.timer.maxRate + ' créditos/min · ' + economySettings.timer.maxMinutes + ' min/sessão. Bônus +' + economySettings.bonusPercent + '% calculado ao concluir. O modo altera apenas novas operações.';
    editor.hidden = economySettings.mode !== 'custom';
    json.value = JSON.stringify(economySettings, null, 2);
    if (typeof calcularValorGanho === 'function') calcularValorGanho();
    window.dispatchEvent(new Event('economy:changed'));
    if (window.updateBonusEspecialUI) window.updateBonusEspecialUI();
    if (window.atualizarBloqueiosNoSelectTarefa) window.atualizarBloqueiosNoSelectTarefa();
  }
  function save(next) {
    if (typeof timerEmSessao !== 'undefined' && timerEmSessao) {
      alert('Conclua a sessão do cronômetro antes de alterar a economia.');
      render();
      return;
    }
    economySettings = Economy.validate(next);
    AppStorage.setItem('economy', JSON.stringify(economySettings));
    render();
  }
  mode.addEventListener('change', () => save(Economy.defaults(mode.value)));
  document.getElementById('saveCustomEconomy').onclick = () => {
    try {
      save({ ...JSON.parse(json.value), mode: 'custom' });
    } catch (error) {
      alert(error.message);
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
