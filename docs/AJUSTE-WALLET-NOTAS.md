# Ajuste local: dinheiro interno e notas reais

- Saldo Dominadora, preços, ganhos e cronômetro aparecem em R$. Não houve conversão ou reprecificação de valores já registrados.
- “Ganho de Crédito” continua sendo o nome da operação que aumenta o dinheiro interno do Wallet.
- Os cartões financeiros saíram da página inicial. O botão **Notas e gastos reais** abre o painel independente de jogos, compras, alimentação, salário e demais notas.
- A interface de resgates/conversão foi retirada. Comprar serviços ou benefícios gera apenas movimentação no Wallet e a tarefa correspondente; não cria despesa real. Registros antigos permanecem no armazenamento e nos backups.
- O título é roxo com o bônus desligado e amarelo/dourado com lingerie ativa; o estado correto volta após recarregar.
- Cadastro por tipo/categoria, descrição e valor, com observações opcionais. Botões diretos para adicionar nota, enviar comprovante e importar lista.
- A importação não soma novamente o resumo final; entende subtotais da mesma moeda, equivalências USD/BRL e quantidades. Categoria sem itens detalhados gera uma nota sugerida a partir do único total informado, sempre com aviso para conferência.
- A numeração de loja considera também descrições importadas com “Lista” no nome. Comprovantes continuam preenchendo sugestões antes da confirmação.
- O rascunho da importação fica na sessão do navegador e pode recuperar a prévia após atualizar a página. O livro financeiro não muda até a confirmação.

Validação: **26 testes de lógica/build, 16 testes funcionais do build e 5 testes no Live Server**, todos aprovados. Os testes usam dados fictícios. A lista pessoal não foi inserida em código, documentação ou fixtures.

Os arquivos anteriores foram preservados em `.local-backups/antes-separacao-wallet-notas-2026-10-30T23-32-27-939Z/`. Nenhuma operação Git foi executada nesta etapa.
