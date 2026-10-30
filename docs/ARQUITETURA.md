# Auditoria antes da implementação

Base: `main` em `9400206`. A PR #1 não foi consultada ou reutilizada.

## Arquitetura e dependências

Aplicação estática, sem backend, bundler, autenticação ou testes na base. `index.html` carrega scripts globais: storage → utils → bonusEspecial → ganhoFixo → tarefasPendentes → timer → registro PWA → efeitos de bônus → chuva de dinheiro. appMain e roleta eram scripts síncronos que registravam inicializadores DOMContentLoaded. appMain depende de todos os globais anteriores. bonusEspecial envolve calcularValorGanho na inicialização; os efeitos compartilham window.bonusEspecialAtivo. GanhoFixo depende da tabela em storage. Timer depende de ELIGIBLE_TASKS e utils. Tarefas dependem de storage e utils. Roleta é independente do saldo: apenas salva e exibe uma sugestão de evento, não concede automaticamente serviço ou bônus.

`temp.js` e `AA_testeCodigoDiff.js` são cópias antigas não carregadas; efeitoBonusAtivo.js, chicote.js e seus CSS alternativos também não integram o fluxo ativo. luzLateral, splash e chovendoGrana são efeitos visuais. Manifest e ícones fornecem instalação PWA; PDF do contrato e DOCX são arquivos estáticos legados.

## Inventário econômico original

- Ganhos fixos: 12 atividades, de 2 a 3.500 créditos, tabela em storage.js. A tela exibe 380 para uma atividade cujo cálculo usa 350; o cálculo é a referência do modo Clássico.
- Extras: 400 e 300 para uma atividade; 500 anunciado para outra, porém o código lê por engano o checkbox de 400.
- Quantidade: uma atividade multiplica o ganho por inteiro positivo sem teto.
- Jogos Match Masters, Videogames Competitivos, Buraco, Perfil e Jogos de tabuleiro com amigas e opção Outro aceitam valores manuais. Não havia tabela de ganhos de jogos.
- Serviços: 12 opções entre 1.500 e 25.000; jantar menciona adicional de 500 por amiga sem campo ou cobrança implementada. Mantido como descrição histórica, sem inventar cobrança nova.
- Redutores: 2.000/3.500/6.000/11.000 para 6h/12h/24h/72h em 60 segundos; aceleração global 18.000 para 96h em 60 segundos. Orçamento de redução persistido em accelBoosts. Não reduzem seus próprios bloqueios.
- Bloqueios: agenda 336h (comentário dizia 15 dias, cálculo é 14); filme especial 240h; sair 168h; evento especial 96h. Redutores têm cooldown equivalente às horas reduzidas.
- Bônus lingerie: +15% sobre ganhos e cronômetro; −15% apenas serviços comuns, excluindo redutores/aceleração.
- Cronômetro começa em 1 crédito/minuto. Cada tarefa durante a sessão soma 0,4 a 6,3 ao valor/minuto, por faixas de valor; repetição soma 0,13 × número da tarefa. Jogos elegíveis habilitam +0,33 a cada 3 segundos. O último valor/minuto era aplicado retroativamente a toda a sessão, com crescimento ilimitado e perda de sessão ao recarregar.
- Roleta: 19 setores com pesos explícitos, cooldown de 72h; resultado persistido. Permitia giros e modais concorrentes antes de salvar o cooldown.

## Inconsistências e estratégia

1. Desconto alterava temporariamente value da opção em captura; appMain recalculava pelo texto e parseInt cortava centavos. Centralizar cálculo e tornar preview apenas visual.
2. Compra verificava saldo bruto antes do desconto; aceleração tinha preço próprio e não verificava cooldown no handler. Usar preço canônico e verificar o bloqueio em todos os caminhos.
3. Estado de bônus dividido entre let global e propriedade window; botão limpar lia window.historico inexistente. Unificar referências.
4. Saldo/histórico persistidos separadamente, floats e IDs por timestamp; apagar compra não cancelava tarefa nem efeito, permitindo reembolso de serviço consumido. Tornar exclusão de histórico apenas arquivamento, com backup; saldo recebe arredondamento em centésimos. Snapshot conjunto recuperável evita perda parcial.
5. Filtro de datas interpretava YYYY-MM-DD em UTC; relógio truncava milissegundos via operador bitwise. Corrigir datas locais e truncamento.
6. Cache-first sem limpeza e registro em sw.js inexistente. Registrar service-worker.js, cache completo versionado e atualização coordenada.
7. Separar livro financeiro em centavos do saldo fictício; totais sempre derivados. Importação é uma proposta revisável com deduplicação conservadora, sem conversão implícita de USD ou atualização silenciosa de registros.
8. OCR local com Tesseract.js e PDF.js; extrair apenas sugestão e pedir conferência. Dependências e idiomas servidos pelo próprio site, nenhum comprovante enviado ou armazenado. Sincronização em nuvem fora do escopo.

As tabelas e simulações reproduzíveis estão em ECONOMIA.md. Dados financeiros particulares não fazem parte do repositório, das fixtures ou dos documentos.
