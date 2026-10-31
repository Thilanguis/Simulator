# Catálogo do Wallet

Edite js/economy-config.js e atualize o Live Server. Não é preciso build.

- services: array de serviços. Cada objeto tem id único, label, description, balanced (preço em R$), classic (referência antiga) e reduceHours (0 quando não reduz tempo).
- gains: array de ganhos. Cada objeto tem id único, balanced (ganho em R$) e classic (referência antiga).
- games: array de jogos. Cada objeto tem id único, amount (sugestão em R$) e timerEligible (true para o marcador 💲).

Novos objetos aparecem automaticamente. Não renomeie IDs existentes para ajustar só o texto de um serviço: use label. Valores monetários no código usam ponto decimal, como 12.50.

quantityMax limita a quantidade do ganho com multiplicador por lançamento. manualGainMax limita os valores digitados para jogos e Outro. Nenhum deles limita o saldo total. bonusPercent e discountPercent controlam o bônus lingerie.

O cronômetro continua aumentando a taxa ao registrar atividades na sessão. Um item 💲 também ativa os aumentos automáticos. Os parâmetros ficam em timer; o acumulado anterior mantém a taxa efetivamente ganha, sem reprecificar o passado.

Personalizações já salvas são preservadas. Depois da primeira abertura desta versão, mudar um valor padrão no arquivo atualiza esse valor no navegador; ajustes que não mudaram no arquivo continuam preservados. IDs de itens novos recebem o valor do código.

Calibração atual: início em R$ 0,50/min; após item 💲, aumento automático de R$ 0,01 a cada 60 segundos. Incrementos por atividade também foram reduzidos. Não há teto de duração nem de valor por minuto. Sessões existentes continuam com a taxa salva.
