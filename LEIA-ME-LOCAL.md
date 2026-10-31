# Desenvolvimento local do Findom Wallet

A fonte ativa e o repositório Git estão em `D:\Sistemas DEV\dominação\Simulator`. As mudanças estão sem commit. Nenhum push foi feito.

Abra Simulator no VS Code ou mantenha a pasta pai aberta. O Git detecta o repositório na subpasta. O Live Server usa a porta 5501; a configuração da pasta pai aponta para Simulator, e o index antigo encaminha para lá enquanto o servidor atual não for reiniciado. O endereço e os dados do navegador permanecem na mesma origem.

Edite somente arquivos dentro de Simulator. Para preparar dependências: `npm ci` e `npm run setup:local`. Para publicar uma versão: `npm run build`, que cria dist/; publique esse conteúdo no seu servidor. Fazer push sem publicar o build não garante uma versão nova para usuários.

Alterar o catálogo em Configurações salva a configuração apenas neste navegador e no backup. Ao adicionar um objeto ao array services e salvar, a loja e o contrato reconhecem o item. Isso não altera os arquivos do projeto nem cria uma publicação. Para levar apenas o catálogo a outra pessoa, copie o JSON do editor; para tornar valores padrão de uma versão, altere o catálogo no código e publique o build.

O PWA detecta uma nova versão publicada, pede confirmação e mostra o progresso de aplicação preservando os dados. O Live Server usa arquivos diretos e não espera o fluxo de atualização publicado.
