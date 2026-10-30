function calcularValorGanho() {
  const selected = document.getElementById('selectGanho').value;
  const input = document.getElementById('valorGanho');
  const settings = getEconomy();
  const fixed = settings.gains[selected] !== undefined;
  const quantity = document.getElementById('quantidadeMultiplicador');
  const multiplicative = selected === Economy.config.gains[1].id;
  document.getElementById('pesNaCaraOptions').style.display = selected === Economy.config.gains[0].id ? 'block' : 'none';
  document.getElementById('comCatarro').style.display = selected === Economy.config.gains[3].id ? 'block' : 'none';
  quantity.style.display = multiplicative ? 'block' : 'none';
  document.getElementById('labelQuantidadeMultiplicador').style.display = multiplicative ? 'block' : 'none';
  quantity.value = Math.min(settings.quantityMax, Math.max(1, parseInt(quantity.value) || 1));
  const extras = [];
  if (selected === Economy.config.gains[0].id) for (const id of ['chkChule', 'chkFrancesinha']) if (document.getElementById(id).checked) extras.push(id);
  if (selected === Economy.config.gains[3].id && document.getElementById('chkCatarro').checked) extras.push('chkCatarro');
  input.readOnly = fixed;
  input.max = settings.manualGainMax;
  input.value = selected === 'Outro' ? '' : Economy.gain(settings, selected, quantity.value, extras) || '';
}
