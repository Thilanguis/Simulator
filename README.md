# Findom Wallet

Aplicativo web estático com simulador de créditos fictícios, serviços, cronômetro, roleta, controle financeiro pessoal e acompanhamento de resgates. Mantém a identidade escura, vermelha e dourada do projeto original.

## Executar

Requer Node.js 24 ou superior e npm.

```sh
npm ci
npm run build
npm start
```

Abra `http://127.0.0.1:4173`. Para hospedar, publique **o conteúdo de `dist/`**, incluindo `vendor/`, por HTTPS. O build copia OCR, modelos de idioma e PDF.js para o próprio site. Não abra o HTML por `file://`. É preciso construir o projeto, não apenas publicar a raiz do repositório.

O comando build gera uma versão a partir do hash dos arquivos e um service worker com todos os recursos locais. A primeira instalação baixa também o motor OCR e idiomas (dezenas de MB). Depois do cache inicial o aplicativo e o OCR funcionam offline. Não há servidor de pagamentos ou de armazenamento de comprovantes.

## Usar

- **Simulador:** saldo, tarefas, bloqueios e atalhos para ganhar créditos, comprar serviços e abrir a roleta. Novas instalações começam no Equilibrado. Dados legados começam no Clássico; trocar modo afeta somente operações futuras. Uma sessão do cronômetro deve ser concluída antes de trocar de economia.
- **Economia personalizada:** abra o editor JSON. Preços/ganhos estão em créditos; `benefits.amount` usa centavos da moeda indicada; percentuais são números como `15`. Preços e ganhos aceitam duas casas; parâmetros do cronômetro, até quatro. Os pesos da roleta são relativos. A validação bloqueia valores inválidos.
- **Controle Financeiro:** adicione descrição, categoria, valor e situação. A data pode ficar em branco quando desconhecida. Total registrado e orçamento restante incluem pagos e pendentes; “pago” identifica dinheiro efetivamente gasto. Cancelados e reembolsados permanecem no histórico e ficam fora dos totais. USD sem equivalência explícita em BRL é apresentado separadamente. Salário é uma categoria de despesa/compromisso da lista, não crédito do jogo nem receita automática.
- **WhatsApp:** cole o texto, escolha a data para os itens sem data e analise. Revise categorias, situação e valores de cada item. Subtotais digitados são apenas comparados e nunca somados. Duplicados/divergentes ficam fora da importação; “Conferir existente” abre uma correção explícita com confirmação. Itens sem marcação são sugeridos como pendentes.
- **Comprovantes:** selecione PNG/JPEG/WebP/BMP/PDF; confira o formulário preenchido. Não há lançamento até a confirmação. Datas explícitas no texto da lista são preservadas; a data comum pode ficar em branco quando desconhecida. O arquivo é descartado após processar; o texto extraído fica apenas no formulário durante a sessão e não entra no backup. Também é possível corrigir/colar texto reconhecido e usar o cadastro manual.
- **Resgates:** nas Configurações, habilite regras e escolha conversão, limites e orçamentos separados por moeda. Solicitar reserva os créditos uma vez; aprovar continua sem despesa. “Registrar pagamento ocorrido” solicita o valor realmente pago, moeda, loja e data. Só então nasce uma despesa vinculada. Cancelamento devolve a reserva; reembolso confirmado estorna a despesa e devolve créditos uma vez. O aplicativo não envia dinheiro. Despesas vinculadas só podem ser alteradas pelo resgate para manter os dois livros consistentes. Use “Corrigir pagamento” para corrigir valor, moeda, data, estabelecimento ou categoria sem gerar outra despesa nem devolver créditos.
- **Roleta:** mantém 19 setores e 72h de intervalo. Os prêmios gratuitos ficam disponíveis para resgate uma vez; respeitam bloqueios e entram no histórico ao gerar uma tarefa/efeito. O setor de dinheiro é uma oferta de benefício real, com custo do catálogo e aprovação; não é transferência automática. Bônus gratuito dura 24h. Um giro interrompido é concluído ao reabrir.

## Dados, backup e atualização

Os dados pertencem ao navegador e ao endereço do site. Não há sincronização entre aparelhos. Exporte um JSON completo em **Configurações → Baixar backup** e guarde em local privado. No outro dispositivo, abra o mesmo site, selecione o JSON, confira a prévia e confirme a substituição. A restauração substitui o conjunto completo; não faz mesclagem automática. É possível exportar um backup mesmo se a gravação local falhar.

O armazenamento usa um envelope versionado (`findom.wallet.v2`) com saldo fictício, histórico, tarefas, bloqueios, sessão, roleta, finanças e resgates. As mudanças entre créditos e despesas de resgates são atômicas. Há uma cópia anterior para recuperação de JSON corrompido. As chaves legadas são copiadas sem apagar o original; transações antigas não são reprecificadas. Exclusão do histórico do jogo arquiva o registro no backup e preserva o saldo e benefícios adquiridos. Exclusões/correções financeiras mantêm trilha de auditoria. O financeiro usa centavos inteiros; o cronômetro acumula unidades inteiras de centésimos por minuto, arredondadas ao concluir.

Ao detectar nova versão, o aplicativo mostra **Atualizar agora / Mais tarde**. A nova versão só assume após a escolha de atualizar. Saldo, compras, configurações e sessão são preservados. O cronômetro restaurado fica pausado; o tempo offline não gera créditos. O cache anterior só é removido na ativação e o novo cache é isolado pelo caminho do aplicativo. “Verificar atualização” permite conferir manualmente.

Evite editar em várias abas ao mesmo tempo. A revisão persistida detecta gravações concorrentes e bloqueia sobrescritas silenciosas; recarregue a aba desatualizada. Se aparecer falha de armazenamento, mantenha a página aberta, exporte um backup e confira o espaço/permissões do navegador. A cópia anterior ajuda, mas não substitui backup externo. Limpar os dados do site remove os registros.

## Limitações conhecidas

- OCR é uma sugestão, sujeito a erros em fotos inclinadas, letras pequenas, recibos longos ou vários totais. Limite de 12 MB e 10 páginas; PDF protegido exige uma cópia acessível. Não soma frete/subtotal ao total pago. Data/loja/total incertos são sinalizados, e o cadastro manual continua funcionando. Modelos locais são do [Tesseract.js](https://github.com/naptha/tesseract.js); PDFs usam [PDF.js](https://github.com/mozilla/pdf.js).
- Deduplicação de listas usa conteúdo, posição do valor na linha e numeração da loja. Um texto radicalmente reescrito pode precisar de conferência manual; uma linha com várias parcelas sem total explícito também deve ser revisada. Comprovantes apenas sugerem duplicidade quando loja, data, moeda e valor coincidem; duas compras iguais podem ser legítimas. Não se deduplica só pelo estabelecimento/valor.
- A data comum escolhida para importação não é uma data comprovada de compra; corrija na prévia ou deixe em branco nas correções. Listas livres com categorias não reconhecidas geram avisos e não são silenciosamente atribuídas.
- Os orçamentos de resgate reservam o valor cotado; o desembolso efetivo pode variar na conclusão, e aparece no orçamento financeiro. Cotações e conversões de moeda nunca são consultadas automaticamente.
- Os dados locais e os backups não são criptografados. Não publique backups, listas ou comprovantes no GitHub. Nenhuma fixture de teste contém a lista financeira particular.
- Sincronização futura exige um serviço autenticado, controle de conflitos, autorização por usuário e backups. Alternativas simples são backup manual entre aparelhos ou backend próprio; nenhuma nuvem paga foi adicionada.

## Verificar

```sh
npm test
npm run simulate
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes usam somente registros e comprovantes fictícios. A suíte de navegador testa OCR real de imagem gerada, PDF com texto, importação, CRUD, migração, backup, cronômetro, bônus, cooldowns, prêmios, resgates, mobile, atualização consentida e abertura offline. A simulação gera [tabelas comparativas e cenários](docs/ECONOMIA.md). A [auditoria da base](docs/ARQUITETURA.md) registra as dependências e inconsistências encontradas. Consulte [VALIDACAO.md](docs/VALIDACAO.md) para os resultados executados.
