# Economia e simulações

Valores em créditos fictícios. A conversão para dinheiro é uma regra independente, desativada inicialmente. O modo Clássico preserva os preços e ganhos efetivamente calculados na main; correções de precisão, cobrança única e integração do cronômetro valem em todos os modos. Instalações existentes começam no Clássico para evitar alterar silenciosamente a economia. Selecione Equilibrado para a nova progressão.

## Catálogo de serviços

| Serviço | Clássico | Equilibrado | Jogos de 10 créditos | Minutos somente cronômetro base |
|---|---:|---:|---:|---:|
| Tirar cravos | 1.500 | 30 | 3 | 60 |
| Vale escolher filme/série 🚫🇰🇷 | 3.000 | 50 | 5 | 100 |
| Massagem nos pés | 3.500 | 60 | 6 | 120 |
| Café da manhã na cama | 4.000 | 70 | 7 | 140 |
| Lavar os pés e esfoliar | 4.500 | 80 | 8 | 160 |
| Massagem | 5.000 | 90 | 9 | 180 |
| Cozinhar jantar | 6.000 | 110 | 11 | 220 |
| Vale sair sozinha com amiga | 6.500 | 130 | 13 | 260 |
| Obrigação de servir (2 tarefas) | 6.500 | 130 | 13 | 260 |
| Vale escolher FILME ✔️🇰🇷 | 12.250 | 220 | 22 | 440 |
| Ela decide toda a agenda do dia | 15.000 | 280 | 28 | 560 |
| Ganha 60 dólares na vida real | 25.000 | 450 | 45 | 900 |
| Reduzir 6h ⌛ | 2.000 | 40 | 4 | 80 |
| Reduzir 12h ⌛ | 3.500 | 60 | 6 | 120 |
| Reduzir 1 dia ⌛ | 6.000 | 110 | 11 | 220 |
| Reduzir 3 dias ⌛ | 11.000 | 200 | 20 | 400 |
| Reduzir 4 dias ⌛ | 18.000 | 330 | 33 | 660 |

O tempo-base é acumulado em sessões de até 120 minutos, sem bônus nem atividades. Serviços de 30–70 levam 3–7 jogos; intermediários de 80–130 levam 8–13; especiais de 220–450 levam 22–45 jogos. Jogos por duração são hipóteses de planejamento, não duração medida dos participantes. Atividades exigentes rendem mais, mas sua frequência e dificuldade dependem do acordo entre participantes.

## Ganhos por atividade

| Atividade | Clássico | Equilibrado |
|---|---:|---:|
| Pés na cara | 400 | 20 |
| Tapa de pé na cara | 2 | 2 |
| Chupar peito | 500 | 30 |
| Cuspir na cara | 320 | 15 |
| Mijar na boca | 350 | 18 |
| Dedo do meio com desprezo | 30 | 4 |
| Vestir cinta e comer dominado | 3.500 | 180 |
| Dar uma meleca para comer | 200 | 12 |
| Comer cutícula e peles dos pés | 800 | 50 |
| Cuspir porra (Sêmen) na boca | 2.000 | 120 |
| Chupar buceta | 200 | 12 |
| Peidar na cara | 150 | 10 |

Extras (Clássico → Equilibrado): chkChule 400 → 12; chkFrancesinha 300 → 8; chkCatarro 500 → 20. O extra anteriormente anunciado como 500, mas cobrado como 400, passa a usar os 500 anunciados no Clássico.

Ganhos de jogos eram inteiramente manuais. Sugestões equilibradas: Match Masters 8; Videogames Competitivos 10; Buraco 10; Perfil 12; Jogos de tabuleiro com amigas 10. O limite manual do Equilibrado é 100 por lançamento; a quantidade da atividade multiplicável é limitada a 30.

## Cenários de sessão

| Cenário | Atividades | Créditos totais | Taxa final/min |
|---|---:|---:|---:|
| Somente tempo, 30 min | 0 | 15 | 0,5 |
| Jogo de 10 créditos a cada 10 min, 30 min | 3 | 55,2 | 1,59 |
| Jogo de 10 créditos a cada 10 min, 30 min, bônus | 3 | 63,48 | 1,59 |
| Somente tempo, 120 min | 0 | 60 | 0,5 |
| Jogo de 10 créditos a cada 10 min, 120 min | 12 | 395,95 | 3 |

Cronômetro Equilibrado: base 0,50/min, teto 3/min, duração máxima 120 min. Jogos elegíveis liberam +0,05/min de sessão; cada tarefa acrescenta uma fração da antiga faixa e repetição limitada pelo teto. A taxa só vale para os segundos futuros. Valores são acumulados em unidades inteiras de centésimos/minuto e arredondados no fechamento. Mesmo no teto por toda a sessão, são no máximo 360 créditos antes do bônus (414 com 15%). Compras durante a sessão também aumentam a taxa, preservando essa mecânica, sem ultrapassar o teto.

Bônus padrão +15% e desconto −15% em serviços comuns. Redutores e benefícios reais não recebem desconto. Custom permite mudar valores, percentuais, limites, benefícios e pesos da roleta. A troca de modo é bloqueada durante sessão ativa. O Clássico mantém as taxas de crescimento antigas, com tetos técnicos de segurança de 1.000.000/min e sete dias; recomenda-se Equilibrado.

## Roleta: distribuição

Mantidos os 19 setores e pesos originais. Não se reduz proporcionalmente a chance dos serviços mais caros: preservar as chances evita mudar duas variáveis ao mesmo tempo. Pesos são normalizados, não exigem soma 100. Serviços e redutores são prêmios gratuitos; bônus dura 24h; o setor de dinheiro é uma oferta com custo do catálogo, que precisa de solicitação de resgate. Sorteio não significa pagamento real. Cooldown de 72h é salvo ao iniciar o giro; um giro interrompido é concluído uma vez ao reabrir.

| Setor | Probabilidade esperada | Simulação (200 mil giros) |
|---|---:|---:|
| LING | 7,9% | 7,92% |
| CRAV | 15,79% | 15,77% |
| NO-KOR | 7,9% | 7,89% |
| PÉS | 6,77% | 6,76% |
| CAFÉ | 5,92% | 5,93% |
| LAV | 5,27% | 5,3% |
| MASS | 4,74% | 4,79% |
| JANT | 3,95% | 4% |
| SAIR | 3,65% | 3,74% |
| SERV | 3,65% | 3,69% |
| K-OK | 1,93% | 1,9% |
| DIA | 1,58% | 1,62% |
| 60 | 0,94% | 0,96% |
| -6H | 11,85% | 11,75% |
| -12H | 6,77% | 6,74% |
| -1D | 3,95% | 3,94% |
| -3D | 2,15% | 2,16% |
| -4D | 1,31% | 1,33% |
| NADA | 3,95% | 3,81% |

Maior desvio absoluto: 0,14 ponto percentual. Gerador determinístico com semente 123456789. A implementação do sorteio real usa Math.random e a mesma distribuição de pesos.

## Benefícios e limites reais

O benefício legado de US$ 60 continua expresso em USD, com custo de 450 créditos no Equilibrado. Esse setor não paga nem converte automaticamente para reais. A regra de conversão genérica começa desativada; a sugestão configurável de 10 centavos por crédito não equivale a 1 crédito = R$ 1. Limites e orçamentos de resgate são separados por moeda e incluem reservas e concluídos. Uma alteração de regra nunca modifica uma solicitação antiga. O valor efetivamente pago pode ser diferente do cotado e é confirmado na conclusão.
