# Adaptação local ao VS Code e Live Server

Data: 30/10/2026.

## Pasta confirmada antes das alterações

- Pasta ativa registrada pelo VS Code: `D:\Sistemas DEV\dominação`.
- `.vscode/settings.json`: porta original 5501, mantida.
- Live Server respondeu HTTP 200 em `http://127.0.0.1:5501/` e inicialmente servia a interface antiga.
- O trabalho anterior estava em `Simulator/`. A implementação foi trazida para a raiz, sem dependência dessa subpasta para execução.
- A raiz não tinha `.git`. Nenhum repositório foi inicializado, nem foram feitos branch, staging, commit, push, PR ou merge nesta adaptação. A cópia anterior e o remoto não foram alterados.

## Preservação

Backup prévio de todos os 29 arquivos existentes do projeto, excluindo a cópia `Simulator/` e pastas geradas:

`.local-backups/antes-modernizacao-2026-10-30T22-23-01-734Z/`

O arquivo `backup-manifest.json` contém os hashes SHA-256 dos originais. A comparação final não encontrou arquivos originais ausentes. O arquivo `firebaseConfiguration.js` e o `.prettierrc` mantiveram exatamente seus hashes originais. A inclusão do módulo Firebase no HTML foi preservada. A configuração de porta do Live Server foi mantida, adicionando apenas exclusões de pastas de dependências, testes e backups para a observação de alterações.

O armazenamento do navegador não foi limpo. Os testes usaram perfis isolados e dados fictícios; a integração Firebase foi simulada nos testes para não gravar nada no projeto externo do usuário.

## Ambiente local

- `node_modules/` e `vendor/` estão na raiz, independentes de `Simulator/`.
- `npm run setup:local` prepara OCR/PDF para servir diretamente pelo Live Server.
- Alterar HTML, CSS ou JavaScript exige apenas salvar e atualizar a página.
- O service worker não intercepta recursos no modo local da porta 5501; o cache de produção/offline continua ativo nos builds fora dessa porta.
- `npm run build` gera `dist/` sem publicar.
- Tarefas do VS Code foram adicionadas para preparar bibliotecas, testar lógica e gerar o build, sem comandos Git.
- Instruções: `LEIA-ME-LOCAL.md`. Regras futuras de trabalho: `AGENTS.md`.

## Resultados

| Comando | Resultado |
|---|---|
| `npm run setup:local` | Bibliotecas e idiomas locais preparados |
| `npm test` | 23 testes aprovados |
| `npm run test:live` | 4 testes aprovados no Live Server real da porta 5501 |
| `npm run test:e2e` | 16 testes aprovados na cópia local, servidor temporário da porta 4174 |
| Verificação de sintaxe | Service workers e scripts de configuração/build válidos |

Total: **43 testes aprovados**. Os quatro testes do Live Server verificam interface e inclusão preservada do Firebase; migração/recarga de dados fictícios com chaves originais intactas; ausência de cache desatualizado para arquivos modificados; OCR real por bibliotecas locais, com sugestão antes da confirmação e persistência posterior.

Esses testes não leem nem alteram o perfil habitual do navegador do usuário. O backup de arquivos não substitui o backup dos registros do navegador; este está disponível na interface, em Configurações.
