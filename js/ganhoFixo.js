function calcularValorGanho() {
  const selected = document.getElementById('selectGanho').value;
  const input = document.getElementById('valorGanho');
  const settings = getEconomy();
  const fixed = settings.gains[selected] !== undefined;
  const quantity = document.getElementById('quantidadeMultiplicador');
  const multiplicative = selected === 'Tapa de pé na cara';
  document.getElementById('pesNaCaraOptions').style.display = selected === 'Pés na cara' ? 'block' : 'none';
  document.getElementById('comCatarro').style.display = selected === 'Cuspir na cara' ? 'block' : 'none';
  quantity.style.display = multiplicative ? 'block' : 'none';
  document.getElementById('labelQuantidadeMultiplicador').style.display = multiplicative ? 'block' : 'none';
  quantity.value = Math.min(settings.quantityMax, Math.max(1, parseInt(quantity.value) || 1));
  const extras = [];
  if (selected === 'Pés na cara') for (const id of ['chkChule', 'chkFrancesinha']) if (document.getElementById(id).checked) extras.push(id);
  if (selected === 'Cuspir na cara' && document.getElementById('chkCatarro').checked) extras.push('chkCatarro');
  input.readOnly = fixed;
  input.max = settings.manualGainMax;
  input.value = selected === 'Outro' ? '' : Economy.gain(settings, selected, quantity.value, extras) || '';
}
