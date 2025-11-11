/* =================================================================== */
/* TAREFAS PENDENTES                            */
/* =================================================================== */

// Função para renderizar as tarefas pendentes
function renderTarefasPendentes() {
  const tarefasContainer = document.getElementById('tarefasPendentes');
  tarefasContainer.innerHTML = '';

  if (tarefasPendentes.length === 0) {
    tarefasContainer.innerHTML = '<p style="color:#999; text-align:center;">Nenhuma tarefa pendente. 👑</p>';
    return;
  }

  tarefasPendentes.forEach((tarefa) => {
    const div = document.createElement('div');
    div.className = 'tarefa-item';
    div.setAttribute('data-id', tarefa.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        // 1. INICIA A ANIMAÇÃO CSS (A classe 'tarefa-concluida' começa o desaparecimento)
        div.classList.add('tarefa-concluida');

        // 2. CRONÔMETRO: Espera 850ms (tempo da animação) para fazer a remoção de fato
        setTimeout(() => {
          // --- ESTA PARTE É EXECUTADA SÓ DEPOIS DA ANIMAÇÃO ---

          // Remove a tarefa do array de dados (tarefasPendentes)
          tarefasPendentes.splice(
            tarefasPendentes.findIndex((t) => t.id === tarefa.id),
            1
          );

          // Salva a lista atualizada no navegador
          localStorage.setItem('tarefasPendentes', JSON.stringify(tarefasPendentes));

          // Remove o elemento DIV da tela
          div.remove();

          // Atualiza o display (para mostrar 'Nenhuma tarefa' se a lista estiver vazia)
          renderTarefasPendentes();
        }, 850); // O tempo do cronômetro
      }
    });

    const spanDescricao = document.createElement('span');
    spanDescricao.className = 'tarefa-descricao';
    spanDescricao.textContent = `${tarefa.tarefa} (${tarefa.descricao}) - Comprada em ${formatDate(tarefa.timestamp)}`;

    const spanValor = document.createElement('span');
    spanValor.className = 'tarefa-valor';
    spanValor.textContent = formatBR(tarefa.valor);

    div.appendChild(checkbox);
    div.appendChild(spanDescricao);
    div.appendChild(spanValor);
    tarefasContainer.appendChild(div);
  });
}
