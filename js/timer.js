/* Active time is integrated at its earned rate. Restored sessions are paused. */
let tempoSegundos = 0,
  timerInterval = null,
  wakeLock = null,
  timerEmSessao = false;
let contadorTarefasTimer = 0,
  somaIncrementosValorSessao = 0,
  baseMultiplicadorSessao = 1,
  sessionHasEligibleTask = false;
let timerEarnedUnits = 0,
  timerLastTick = 0;
function persistTimer() {
  AppStorage.setItem(
    'timerSession',
    JSON.stringify({ seconds: tempoSegundos, earnedUnits: timerEarnedUnits, rate: Number(document.getElementById('valorPorMinuto').value), active: timerEmSessao, tasks: contadorTarefasTimer, eligible: sessionHasEligibleTask }),
  );
}
function syncTimer() {
  if (!timerInterval || !timerLastTick) return;
  const seconds = Math.max(0, Math.floor((Date.now() - timerLastTick) / 1000));
  if (!seconds) return;
  const state = Economy.step({ seconds: tempoSegundos, earnedUnits: timerEarnedUnits, rate: Number(document.getElementById('valorPorMinuto').value) }, seconds, getEconomy(), sessionHasEligibleTask);
  tempoSegundos = state.seconds;
  timerEarnedUnits = state.earnedUnits;
  document.getElementById('valorPorMinuto').value = state.rate.toFixed(2);
  timerLastTick += seconds * 1000;
  if (tempoSegundos >= Math.floor(getEconomy().timer.maxMinutes * 60)) {
    clearInterval(timerInterval);
    timerInterval = null;
    releaseWakeLock();
    document.getElementById('btnPlayPauseTempo').textContent = 'Limite atingido · calcular';
  }
  persistTimer();
}
function aplicarBonusDeTarefaDuranteTimer(value, name) {
  if (!timerEmSessao) return;
  syncTimer();
  if (ELIGIBLE_TASKS.has(String(name).trim())) sessionHasEligibleTask = true;
  contadorTarefasTimer++;
  const settings = getEconomy();
  const classic = Economy.config.services.find((s) => s.id === name)?.classic || Economy.config.gains.find((s) => s.id === name)?.classic || value;
  const increment = Economy.taskIncrement(classic, settings) + settings.timer.repeatIncrement * contadorTarefasTimer;
  const input = document.getElementById('valorPorMinuto');
  input.value = Math.min(settings.timer.maxRate, Economy.round(Number(input.value) + increment)).toFixed(2);
  persistTimer();
  atualizarValorAcumulado();
}
function calcularValorTotal(seconds, rate) {
  return Economy.round((seconds * rate) / 60);
}
function atualizarValorAcumulado() {
  document.getElementById('valorAcumuladoDisplay').textContent = formatBR(Economy.round(timerEarnedUnits / 6000));
}
async function requestWakeLock() {
  if ('wakeLock' in navigator)
    try {
      wakeLock = await navigator.wakeLock.request('screen');
    } catch {}
}
async function releaseWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch {}
    wakeLock = null;
  }
}
function atualizarDisplay() {
  const min = String(Math.floor(tempoSegundos / 60)).padStart(2, '0'),
    sec = String(tempoSegundos % 60).padStart(2, '0');
  document.getElementById('tempoDisplay').textContent = min + ':' + sec;
  atualizarValorAcumulado();
}
document.addEventListener('DOMContentLoaded', () => {
  const raw = AppStorage.getItem('timerSession');
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (!saved.active) return;
    if (![saved.seconds, saved.earnedUnits, saved.rate, saved.tasks].every((n) => Number.isFinite(n) && n >= 0)) throw new Error('Sessão inválida.');
    tempoSegundos = saved.seconds;
    timerEarnedUnits = saved.earnedUnits;
    contadorTarefasTimer = saved.tasks;
    sessionHasEligibleTask = saved.eligible;
    timerEmSessao = true;
    document.getElementById('valorPorMinuto').value = saved.rate;
    document.getElementById('btnPlayPauseTempo').textContent = '▶️ Retomar sessão salva';
    atualizarDisplay();
  } catch (error) {
    storageFailure(error);
  }
});
window.addEventListener('pagehide', () => {
  syncTimer();
  persistTimer();
  AppStorage.flush();
});
