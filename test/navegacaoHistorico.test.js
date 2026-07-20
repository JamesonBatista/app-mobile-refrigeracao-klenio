const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

/**
 * P12 — histórico de navegação (pushState / popstate).
 * Simula a política usada em app.js sem DOM.
 */
function criarNavegacaoHistorico() {
  const historico = [{ tela: "inicial" }];
  let indice = 0;
  let telaAtual = "inicial";

  function setTela(tela, opts) {
    const options = opts || {};
    telaAtual = tela;
    if (options.replace) {
      historico[indice] = { tela };
      return;
    }
    if (options.fromPop) return;
    historico.splice(indice + 1);
    historico.push({ tela });
    indice = historico.length - 1;
  }

  function voltar() {
    if (indice <= 0) return false;
    indice -= 1;
    telaAtual = historico[indice].tela;
    return true;
  }

  return {
    setTela,
    voltar,
    getTela: () => telaAtual,
    getIndice: () => indice,
  };
}

describe("P12 — botão voltar do celular usa histórico interno", () => {
  it("empilha telas e volta para a anterior", () => {
    const nav = criarNavegacaoHistorico();
    nav.setTela("loginCliente");
    nav.setTela("principal");
    assert.equal(nav.getTela(), "principal");
    assert.equal(nav.voltar(), true);
    assert.equal(nav.getTela(), "loginCliente");
    assert.equal(nav.voltar(), true);
    assert.equal(nav.getTela(), "inicial");
    assert.equal(nav.voltar(), false);
  });
});
