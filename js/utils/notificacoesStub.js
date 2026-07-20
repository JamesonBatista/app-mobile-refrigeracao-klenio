// js/utils/notificacoesStub.js
// Stubs seguros para push/WhatsApp quando a integração ainda não existe.
// Não altera conexão com banco nem CRUD.

(function (root) {
  if (!root) return;

  function noopAsync() {
    return Promise.resolve(null);
  }

  function definirSeAusente(nome, impl) {
    if (typeof root[nome] !== "function") {
      root[nome] = impl;
    }
  }

  definirSeAusente("registrarToken", noopAsync);
  definirSeAusente("salvarTokenAdmin", noopAsync);
  definirSeAusente("buscarTokenAdmin", noopAsync);
  definirSeAusente("buscarTokenCliente", noopAsync);
  definirSeAusente("enviarNotificacaoPush", noopAsync);
  definirSeAusente("enviarNotificacao", noopAsync);
  definirSeAusente("notificarClienteOrcamentoEnviado", function () {});
  definirSeAusente("notificarClienteOrcamentoCancelado", function () {});
  definirSeAusente("notificarClienteRespostaContestacao", function () {});

  root.NotificacoesStub = {
    ativo: true,
  };
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null);
