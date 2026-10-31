'use strict';

// Native dialog supplies focus trapping and makes the background inert.
(() => {
  let active = false;
  function show(message, confirmation = false) {
    if (active) return Promise.resolve(false);
    active = true;
    const previousFocus = document.activeElement;
    const destructive = confirmation && /excluir|zerar|arquivar|substituir/i.test(message);
    const action = !confirmation
      ? 'Entendi'
      : /excluir/i.test(message)
        ? 'Excluir'
        : /zerar/i.test(message)
          ? 'Zerar saldo'
          : /arquivar/i.test(message)
            ? 'Arquivar'
            : /substituir/i.test(message)
              ? 'Restaurar backup'
              : /compra/i.test(message)
                ? 'Confirmar compra'
                : /salvar/i.test(message)
                  ? 'Salvar'
                  : 'Confirmar';
    const dialog = document.createElement('dialog');
    dialog.className = 'app-dialog' + (destructive ? ' app-dialog-danger' : '');
    dialog.setAttribute('aria-labelledby', 'appDialogTitle');
    dialog.setAttribute('aria-describedby', 'appDialogMessage');
    dialog.innerHTML =
      '<button type="button" class="app-dialog-close" aria-label="Fechar">×</button><div class="app-dialog-icon" aria-hidden="true"></div><h2 id="appDialogTitle"></h2><p id="appDialogMessage"></p><div class="app-dialog-actions"><button type="button" data-dialog-cancel>Cancelar</button><button type="button" data-dialog-confirm></button></div>';
    dialog.querySelector('.app-dialog-icon').textContent = destructive ? '!' : confirmation ? '✓' : 'i';
    dialog.querySelector('h2').textContent = !confirmation ? 'Atenção' : destructive ? 'Confirmar alteração' : 'Tudo certo para continuar?';
    dialog.querySelector('p').textContent = String(message);
    const cancel = dialog.querySelector('[data-dialog-cancel]');
    const confirm = dialog.querySelector('[data-dialog-confirm]');
    cancel.hidden = !confirmation;
    confirm.textContent = action;
    (destructive ? cancel : confirm).autofocus = true;
    document.body.append(dialog);
    document.documentElement.classList.add('dialog-open');
    return new Promise((resolve) => {
      dialog.addEventListener(
        'close',
        () => {
          const result = dialog.returnValue === 'confirm';
          dialog.remove();
          document.documentElement.classList.remove('dialog-open');
          active = false;
          if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
          resolve(result);
        },
        { once: true },
      );
      dialog.querySelector('.app-dialog-close').onclick = () => dialog.close('cancel');
      cancel.onclick = () => dialog.close('cancel');
      confirm.onclick = () => dialog.close('confirm');
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        dialog.close('cancel');
      });
      dialog.showModal();
    });
  }
  window.AppDialog = {
    confirm: (message) => show(message, true),
    alert: (message) => {
      void show(message);
    },
  };
})();
