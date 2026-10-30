# Validação executada

Data: 30/10/2026. Base da implementação: main `9400206`. Ambiente: Windows, Node.js 24.11.1, Chromium do Playwright 1.64.1. Dados e comprovantes exclusivamente fictícios.

| Verificação        | Resultado                                                                        |
| ------------------ | -------------------------------------------------------------------------------- |
| `npm test`         | 23 testes aprovados, nenhuma falha                                               |
| `npm run test:e2e` | 16 testes aprovados, nenhuma falha; execução final em 29,5 s                     |
| `npm run simulate` | 200.000 giros; maior desvio de 0,14 ponto percentual                             |
| Build estático     | Gerado com OCR, idiomas e PDF.js locais; teste confirma scripts/estilos no cache |
| `git diff --check` | Sem erros de whitespace                                                          |
| Inspeção visual    | Tela de 390 px conferida, tema escuro/vermelho/dourado e formulários legíveis    |

## Lógica e armazenamento

- Centavos inteiros, formato brasileiro/dólares, entradas inválidas e limites numéricos.
- Soma das oito categorias, total, pagos/pendentes, cancelados/reembolsados, orçamento negativo e moeda estrangeira separada.
- Inclusão, edição, exclusão, estorno, auditoria e filtros.
- Seções do WhatsApp, vários jogos por linha, lojas numeradas, equivalência USD/BRL, subtotais incorretos e datas explícitas/desconhecidas.
- Importação repetida idempotente; alterações de situação/valor geram conflitos, sem atualização silenciosa.
- Comprovante prioriza total pago, descarta subtotal/frete/parcelas e sinaliza incerteza/duplicatas.
- Clássico preservado, Equilibrado não uniforme, extras, quantidade limitada, bônus/desconto e personalizado.
- Cronômetro integra cada intervalo sem reprecificar segundos passados; taxa e duração limitadas.
- Catálogo de 19 setores da roleta, referências aos serviços e simulação das probabilidades.
- Reserva única, aprovação sem despesa, pagamento único, correção preservando ID/créditos, cancelamento e reembolso idempotentes. Transições inválidas recusadas.
- Migração mantém chaves antigas; recarga preserva dados; commit entre livros atômico; JSON inválido recupera cópia anterior; quota e concorrência não sobrescrevem silenciosamente o financeiro.

## Funcionais no Chromium

1. Economia padrão persiste após recarga sem mudar indevidamente para Clássico.
2. Inicialização sem erros, navegação e ausência de rolagem horizontal em 390 px.
3. Cadastro, orçamento negativo, edição, situação, filtros, reembolso, exclusão e recarga.
4. Prévia do WhatsApp editável e segunda importação sem duplicação.
5. Migração, desconto único com centavos, ganho com bônus, arquivamento sem reembolso indevido e recarga.
6. Cronômetro salva sessão pausada, retoma após recarga e liquida uma vez.
7. Bloqueio, redutor cronometrado e cooldown persistem após recarga.
8. Resgate, aprovação, pagamento, correção, recarga e reembolso.
9. Ganho após reserva e cancelamento conservam saldo/histórico na mesma sessão.
10. Benefício real usa custo do catálogo, mantém USD, não cria despesa antecipada e conserva cooldown; cancelar libera reserva/bloqueio correspondente.
11. Roleta impede giros concorrentes; giro interrompido gera um resultado; prêmio é resgatado uma vez.
12. Texto de comprovante cria sugestão editável, sem registro automático; falha mantém cadastro manual.
13. OCR real de PNG sintético, PDF textual e ausência de requisições externas no processamento; arquivo descartado do input.
14. Exportação JSON, prévia e restauração completa.
15. PDF digitalizado rasterizado e reconhecido; PDF inválido recebe erro recuperável.
16. Nova versão simulada espera confirmação, permite “Mais tarde”, atualiza sob comando, conserva dados e abre offline.

## Limites da validação

A lista pessoal itemizada não foi fornecida nem está em fixtures públicas. Seus totais devem ser conferidos na interface após importá-la. Os testes verificam os cálculos com dados fictícios, sem usar os totais particulares como constantes.

OCR não foi validado com documentos reais do usuário ou todos os bancos/lojas. Fotografias ruins podem exigir correção manual. Não há sincronização em nuvem nem transferências bancárias.

Os testes de navegador usam Chromium. Safari/iOS e outros navegadores precisam de conferência em aparelhos reais. A primeira instalação PWA baixa os recursos locais antes de funcionar offline. É necessário publicar `dist/`, incluindo `vendor/`, por HTTPS; publicar somente a raiz não instala as dependências de OCR.
