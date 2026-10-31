# Lista real por grupos

A visualização principal e a prévia passaram a usar o formato da mensagem do usuário: oito grupos numerados abertos, notas em linhas compactas, subtotais, resumo final e total geral. Datas e botões individuais de edição não ocupam as linhas; estão na área recolhida Gerenciar lançamentos e filtros.

A apresentação usa os registros existentes sem reimportar, excluir ou alterar valores. Preserva a ordem dos itens, recompõe linhas de jogos que continham vários valores, mantém equivalências entre moedas e quantidades de compras. Valores somente em dólar continuam fora do total em reais. O texto exportado para WhatsApp usa a mesma estrutura por grupos.

A lista pessoal não foi colocada em código ou fixtures. Alterações exclusivamente locais, sem operações Git. Backup dos arquivos alterados em `.local-backups/antes-lista-por-grupos-1793404113248/`.

Validação: 27 testes de lógica/build, 6 testes do Live Server e 16 testes funcionais aprovados. Após reutilizar o componente também na prévia, os testes específicos de importação e rascunho foram repetidos.
