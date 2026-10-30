/* Preview only; the charge is calculated once in appMain. */
document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('selectTarefa');
  const preview = document.createElement('p');
  preview.id = 'previewDescontoCompra';
  preview.className = 'hint';
  select.after(preview);
  function update() {
    const [, id] = select.value.split('|');
    const item = Economy.config.services.find((s) => s.id === id);
    if (!item) {
      preview.textContent = '';
      return;
    }
    const discounted = window.bonusEspecialAtivo && !item.reduceHours && !id.startsWith('ACELERAR_');
    const price = Economy.adjusted(getEconomy().prices[id], 'cost', discounted, getEconomy());
    preview.textContent = 'Preço final: ' + price.toLocaleString('pt-BR') + ' créditos' + (discounted ? ' · desconto de ' + getEconomy().discountPercent + '%' : '');
  }
  select.addEventListener('change', update);
  document.getElementById('bonusEspecialCheckbox').addEventListener('change', update);
  window.addEventListener('economy:changed', update);
  update();
});
