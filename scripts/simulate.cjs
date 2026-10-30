const E = require('../js/economy.js'),
  fs = require('node:fs'),
  path = require('node:path');
const s = E.defaults('balanced');
const f = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
function session(minutes, activityEvery = 0, activityValue = 10, bonus = false) {
  let t = { seconds: 0, earnedUnits: 0, rate: s.timer.base },
    activities = 0,
    eligible = false;
  for (let minute = 1; minute <= minutes; minute++) {
    t = E.step(t, 60, s, eligible);
    if (activityEvery && minute % activityEvery === 0) {
      activities++;
      eligible = true;
      t.rate = Math.min(s.timer.maxRate, E.round(t.rate + E.taskIncrement(activityValue, s) + s.timer.repeatIncrement * activities));
    }
  }
  return { minutes, activities, credits: E.adjusted(E.round(t.earnedUnits / 6000) + activities * activityValue, 'gain', bonus, s), rate: t.rate };
}
const profiles = [
  ['Somente tempo, 30 min', 30, 0, false],
  ['Jogo de 10 créditos a cada 10 min, 30 min', 30, 10, false],
  ['Jogo de 10 créditos a cada 10 min, 30 min, bônus', 30, 10, true],
  ['Somente tempo, 120 min', 120, 0, false],
  ['Jogo de 10 créditos a cada 10 min, 120 min', 120, 10, false],
];
const lines = [
  '# Economia e simulações',
  '',
  'Valores em créditos fictícios. A conversão para dinheiro é uma regra independente, desativada inicialmente. O modo Clássico preserva os preços e ganhos efetivamente calculados na main; correções de precisão, cobrança única e integração do cronômetro valem em todos os modos. Instalações existentes começam no Clássico para evitar alterar silenciosamente a economia. Selecione Equilibrado para a nova progressão.',
  '',
  '## Catálogo de serviços',
  '',
  '| Serviço | Clássico | Equilibrado | Jogos de 10 créditos | Minutos somente cronômetro base |',
  '|---|---:|---:|---:|---:|',
];
E.config.services.forEach((item) => lines.push(`| ${item.label} | ${f(item.classic)} | ${f(item.balanced)} | ${Math.ceil(item.balanced / 10)} | ${item.balanced / 0.5} |`));
lines.push(
  '',
  'O tempo-base é acumulado em sessões de até 120 minutos, sem bônus nem atividades. Serviços de 30–70 levam 3–7 jogos; intermediários de 80–130 levam 8–13; especiais de 220–450 levam 22–45 jogos. Jogos por duração são hipóteses de planejamento, não duração medida dos participantes. Atividades exigentes rendem mais, mas sua frequência e dificuldade dependem do acordo entre participantes.',
  '',
  '## Ganhos por atividade',
  '',
  '| Atividade | Clássico | Equilibrado |',
  '|---|---:|---:|',
);
E.config.gains.forEach((item) => lines.push(`| ${item.id} | ${f(item.classic)} | ${f(item.balanced)} |`));
lines.push(
  '',
  'Extras (Clássico → Equilibrado): ' +
    Object.entries(E.config.extras)
      .map(([key, v]) => key + ' ' + v.classic + ' → ' + v.balanced)
      .join('; ') +
    '. O extra anteriormente anunciado como 500, mas cobrado como 400, passa a usar os 500 anunciados no Clássico.',
  '',
  'Ganhos de jogos eram inteiramente manuais. Sugestões equilibradas: ' +
    Object.entries(s.games)
      .map(([key, v]) => key + ' ' + v)
      .join('; ') +
    '. O limite manual do Equilibrado é ' +
    s.manualGainMax +
    ' por lançamento; a quantidade da atividade multiplicável é limitada a ' +
    s.quantityMax +
    '.',
  '',
  '## Cenários de sessão',
  '',
  '| Cenário | Atividades | Créditos totais | Taxa final/min |',
  '|---|---:|---:|---:|',
);
for (const [label, minutes, every, bonus] of profiles) {
  const result = session(minutes, every, 10, bonus);
  lines.push(`| ${label} | ${result.activities} | ${f(result.credits)} | ${f(result.rate)} |`);
}
lines.push(
  '',
  'Cronômetro Equilibrado: base 0,50/min, teto 3/min, duração máxima 120 min. Jogos elegíveis liberam +0,05/min de sessão; cada tarefa acrescenta uma fração da antiga faixa e repetição limitada pelo teto. A taxa só vale para os segundos futuros. Valores são acumulados em unidades inteiras de centésimos/minuto e arredondados no fechamento. Mesmo no teto por toda a sessão, são no máximo 360 créditos antes do bônus (414 com 15%). Compras durante a sessão também aumentam a taxa, preservando essa mecânica, sem ultrapassar o teto.',
  '',
  'Bônus padrão +15% e desconto −15% em serviços comuns. Redutores e benefícios reais não recebem desconto. Custom permite mudar valores, percentuais, limites, benefícios e pesos da roleta. A troca de modo é bloqueada durante sessão ativa. O Clássico mantém as taxas de crescimento antigas, com tetos técnicos de segurança de 1.000.000/min e sete dias; recomenda-se Equilibrado.',
  '',
  '## Roleta: distribuição',
  '',
  'Mantidos os 19 setores e pesos originais. Não se reduz proporcionalmente a chance dos serviços mais caros: preservar as chances evita mudar duas variáveis ao mesmo tempo. Pesos são normalizados, não exigem soma 100. Serviços e redutores são prêmios gratuitos; bônus dura 24h; o setor de dinheiro é uma oferta com custo do catálogo, que precisa de solicitação de resgate. Sorteio não significa pagamento real. Cooldown de 72h é salvo ao iniciar o giro; um giro interrompido é concluído uma vez ao reabrir.',
  '',
  '| Setor | Probabilidade esperada | Simulação (200 mil giros) |',
  '|---|---:|---:|',
);
let seed = 123456789;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const weights = E.config.roulette.map((r) => r.weight),
  sum = weights.reduce((a, b) => a + b, 0),
  counts = weights.map(() => 0),
  n = 200000;
for (let i = 0; i < n; i++) counts[E.drawRoulette(s, random)]++;
let maxError = 0;
E.config.roulette.forEach((r, i) => {
  const expected = weights[i] / sum,
    observed = counts[i] / n;
  maxError = Math.max(maxError, Math.abs(expected - observed));
  lines.push(`| ${r.label} | ${f(expected * 100)}% | ${f(observed * 100)}% |`);
});
if (maxError > 0.005) throw new Error('Distribuição fora da tolerância de 0,5 ponto percentual.');
lines.push(
  '',
  `Maior desvio absoluto: ${f(maxError * 100)} ponto percentual. Gerador determinístico com semente 123456789. A implementação do sorteio real usa Math.random e a mesma distribuição de pesos.`,
  ``,
  '## Benefícios e limites reais',
  '',
  'O benefício legado de US$ 60 continua expresso em USD, com custo de 450 créditos no Equilibrado. Esse setor não paga nem converte automaticamente para reais. A regra de conversão genérica começa desativada; a sugestão configurável de 10 centavos por crédito não equivale a 1 crédito = R$ 1. Limites e orçamentos de resgate são separados por moeda e incluem reservas e concluídos. Uma alteração de regra nunca modifica uma solicitação antiga. O valor efetivamente pago pode ser diferente do cotado e é confirmado na conclusão.',
);
fs.mkdirSync(path.join(__dirname, '../docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../docs/ECONOMIA.md'), lines.join('\n') + '\n');
console.log('Simulações concluídas: 200.000 giros; maior desvio ' + f(maxError * 100) + ' p.p. Tabelas em docs/ECONOMIA.md.');
