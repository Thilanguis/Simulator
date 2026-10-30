# Nova economia e registro de gastos (branch de teste)

## Escala econômica
- Escalas de 5%, 10% (padrão), 20% e 100% para novos preços de serviços e ganhos fixos.
- Histórico já registrado não é migrado.
- O timer e seus bônus cumulativos continuam na mecânica original: revisar antes de uso definitivo.

## Registro financeiro
- Controle de compras separado do saldo fictício.
- Registro local no navegador, sem subir a lista particular ao GitHub.
- Categorias, status pago/pendente, valores em BRL/USD, edição e exclusão.
- Importação do texto de WhatsApp com pré-visualização e confirmação.
- Leitura assistida de imagens e PDF usando OCR no próprio navegador. Necessário conferir sugestão antes de confirmar; arquivo original não é guardado.
- Compartilhamento de relatório por WhatsApp.
- Sem sincronização entre dispositivos. Dados podem ser perdidos se limpar os dados do navegador.

## Conferência inicial da lista
- Buraco R$ 3.148,55
- Match Masters R$ 1.748,63
- Lista de Compras R$ 21.738,91
- Total geral R$ 34.019,59
- Itens apenas em dólares não entram na soma em reais.

## Roteiro de testes
1. Usar aba privada ou perfil secundário para não afetar saldo antigo.
2. Com escala 10%, serviço de R$ 1.500 deve custar R$ 150.
3. Conferir preços, ganhos fixos, bônus e bloqueios.
4. Colar a lista completa no importador; conferir total, categorias e pendências.
5. Importar duas vezes; não deve duplicar linhas já identificadas.
6. Testar comprovante de imagem e PDF; confirmar manualmente antes de registrar.
7. Testar exclusão, edição, moeda, compartilhamento e visualização em celular.
8. Revisar especialmente timer, aceleradores e persistência antes de mesclar a branch.

## Privacidade
Nenhum nome ou valor da lista privada foi commitado no código público. Não publique comprovantes nas issues nem nos comentários do pull request.
