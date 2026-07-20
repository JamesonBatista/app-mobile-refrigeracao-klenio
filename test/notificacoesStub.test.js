const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

describe("P13 — stubs de notificação não quebram chamadas", () => {
  it("define funções ausentes sem sobrescrever existentes", () => {
    const sandbox = { Promise };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    sandbox.buscarTokenCliente = async () => "token-real";

    const code = fs.readFileSync(
      path.join(__dirname, "../js/utils/notificacoesStub.js"),
      "utf8"
    );
    vm.runInNewContext(code, sandbox);

    assert.equal(typeof sandbox.enviarNotificacaoPush, "function");
    assert.equal(typeof sandbox.registrarToken, "function");
    assert.equal(typeof sandbox.notificarClienteOrcamentoEnviado, "function");
    // não sobrescreve implementação existente
    return sandbox.buscarTokenCliente().then((v) => {
      assert.equal(v, "token-real");
    });
  });
});
