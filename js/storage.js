/* =================================================================== */
/* CONFIG & STATE                             */
/* =================================================================== */

const FIXED_VALUES_GANHO = {
  'Pés na cara': 400,
  'Tapa de pé na cara': 1,
  'Chupar peito': 400,
  'Cuspir na cara': 320,
  'Mijar na boca': 350,
  'Dedo do meio com desprezo': 20,
  'Vestir cinta e comer dominado': 3000,
  'Dar uma meleca para comer': 200,
  'Comer cutícula e peles dos pés': 800,
  'Cuspir porra (Sêmen) na boca': 1200,
  'Chupar buceta': 200,
  'Peidar na cara': 150,
};

// const BONUS_ESPECIAL_MULTIPLIER = 0.85; // 1.3x

/* BÔNUS em GANHOS (+30%) */
const BONUS_GANHO_MULTIPLIER = 1.15;

/* DESCONTO em COMPRAS (-15%) — use só se quiser mesmo aplicar desconto nos gastos */
const DESCONTO_COMPRA_MULTIPLIER = 0.85;

const ELIGIBLE_TASKS = new Set(['Videogames Competitivos', 'Perfil', 'Jogos de tabuleiro com amigas', 'Buraco']);

// Carrega o estado do localStorage
let saldoDominadora = parseFloat(localStorage.getItem('saldoDominadora') || '0');

let historico = JSON.parse(localStorage.getItem('historico') || '[]');
// Array para tarefas pendentes, persistente
let tarefasPendentes = JSON.parse(localStorage.getItem('tarefasPendentes') || '[]');
// carrega do localStorage se já estava ativo
let bonusEspecialAtivo = JSON.parse(localStorage.getItem('bonusEspecialAtivo') || 'false');

// garantir que todos os registros antigos ganhem timestamp (se não tiverem)
historico = historico.map((h) => (h.timestamp ? h : Object.assign({}, h, { timestamp: new Date().toISOString() })));
localStorage.setItem('historico', JSON.stringify(historico));
