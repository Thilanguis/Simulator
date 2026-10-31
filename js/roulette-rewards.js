document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('roulettePrizeList');
  function render() {
    const awards = JSON.parse(AppStorage.getItem('rouletteAwards') || '[]');
    container.innerHTML =
      awards
        .slice()
        .reverse()
        .map(
          (a) =>
            `<article class="finance-entry"><strong>${escapeHTML(a.label)}</strong><p class="hint">${escapeHTML(a.createdAt)} · ${a.claimed ? 'Resultado registrado' : 'Prêmio gratuito disponível'}</p>${!a.claimed ? `<button data-claim="${escapeHTML(a.id)}">Resgatar prêmio gratuito</button>` : ''}</article>`,
        )
        .join('') || '<p class="hint">Seus resultados aparecerão aqui.</p>';
  }
  container.onclick = async (event) => {
    const button = event.target.closest('[data-claim]');
    if (!button) return;
    const awards = JSON.parse(AppStorage.getItem('rouletteAwards') || '[]'),
      award = awards.find((a) => a.id === button.dataset.claim);
    if (!award || award.claimed) return;
    const blocks = JSON.parse(AppStorage.getItem('tarefasBloqueadas') || '[]');
    if (award.serviceId && blocks.some((b) => b.nome === award.serviceId && b.expiraEm > Date.now())) return AppDialog.alert('O serviço ainda está bloqueado. O prêmio ficará disponível para resgatar após o cooldown.');
    if (!(await AppDialog.confirm('Resgatar este prêmio gratuito? Nenhum valor será descontado do Saldo Dominadora.'))) return;
    if (award.kind === 'bonus') {
      AppStorage.setItem('rouletteBonusUntil', Date.now() + Economy.config.bonusDurationHours * 3600000);
      const checkbox = document.getElementById('bonusEspecialCheckbox');
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event('change'));
    } else if (award.kind === 'reducer') {
      const item = Economy.config.services.find((s) => s.id === award.serviceId),
        hours = item.reduceHours || 96;
      const total = hours * 3600000,
        duration = Economy.config.reducerDurationMs;
      window.startGlobalAcceleration(total / (duration / 1000), duration, total, item.id);
      blocks.push({ nome: item.id, expiraEm: Date.now() + Economy.config.cooldowns[item.id] * 3600000 });
      window.__AppCtl.setBlocks(blocks);
    } else if (award.kind === 'freeService') {
      const item = Economy.config.services.find((s) => s.id === award.serviceId);
      tarefasPendentes.unshift({ id: award.id, tarefa: item.id, descricao: item.description + ' · prêmio gratuito da roleta', valor: 0, timestamp: new Date().toISOString() });
      AppStorage.setItem('tarefasPendentes', JSON.stringify(tarefasPendentes));
      renderTarefasPendentes();
      const cooldown = Economy.config.cooldowns[item.id];
      if (cooldown) {
        blocks.push({ nome: item.id, expiraEm: Date.now() + cooldown * 3600000 });
        window.__AppCtl.setBlocks(blocks);
      }
    }
    award.claimed = true;
    AppStorage.setItem('rouletteAwards', JSON.stringify(awards));
    historico.unshift({ id: 'prize:' + award.id, tipo: 'premio', descricao: 'Prêmio gratuito da roleta: ' + award.label, valor: 0, saldoAtual: saldoDominadora, timestamp: new Date().toISOString() });
    AppStorage.setItem('historico', JSON.stringify(historico));
    window.dispatchEvent(new Event('wallet:credits'));
    render();
  };
  function expireBonus() {
    const until = Number(AppStorage.getItem('rouletteBonusUntil') || 0);
    if (until && until <= Date.now()) {
      AppStorage.setItem('rouletteBonusUntil', '0');
      const checkbox = document.getElementById('bonusEspecialCheckbox');
      checkbox.checked = false;
      checkbox.dispatchEvent(new Event('change'));
    }
  }
  window.addEventListener('roulette:awards', render);
  setInterval(expireBonus, 1000);
  expireBonus();
  render();
});
