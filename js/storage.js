/* =================================================================== */
/* CONFIG & STATE                             */
/* =================================================================== */

const ELIGIBLE_TASKS = new Set(Economy.config.eligible);

// Carrega o estado do AppStorage
let saldoDominadora = parseFloat(AppStorage.getItem('saldoDominadora') || '0');

let historico = JSON.parse(AppStorage.getItem('historico') || '[]');
// Array para tarefas pendentes, persistente
let tarefasPendentes = JSON.parse(AppStorage.getItem('tarefasPendentes') || '[]');
// carrega do AppStorage se já estava ativo
window.bonusEspecialAtivo = JSON.parse(AppStorage.getItem('bonusEspecialAtivo') || 'false');

// garantir que todos os registros antigos ganhem timestamp (se não tiverem)
historico = historico.map((h) => (h.timestamp ? h : Object.assign({}, h, { timestamp: new Date().toISOString() })));
AppStorage.setItem('historico', JSON.stringify(historico));
