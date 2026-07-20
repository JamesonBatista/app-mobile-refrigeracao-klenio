const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { atualizarSenhaLocal } = require("../js/utils/recuperarSenhaLocal.js");

function createMemoryStorage(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    _map: map,
  };
}

describe("P9 — recuperação de senha usa @clientes (e @usuario)", () => {
  it("atualiza senha em @clientes quando e-mail existe", () => {
    const storage = createMemoryStorage({
      "@clientes": JSON.stringify([
        { email: "cliente@teste.com", senha: "antiga12", nome: "Ana" },
      ]),
    });
    const result = atualizarSenhaLocal(storage, "cliente@teste.com", "novaSenha9");
    assert.equal(result.ok, true);
    assert.ok(result.fontesAtualizadas.includes("@clientes"));
    const clientes = JSON.parse(storage.getItem("@clientes"));
    assert.equal(clientes[0].senha, "novaSenha9");
  });

  it("atualiza também @usuario se e-mail bater", () => {
    const storage = createMemoryStorage({
      "@usuario": JSON.stringify({ email: "cliente@teste.com", senha: "antiga12" }),
      "@clientes": JSON.stringify([{ email: "cliente@teste.com", senha: "antiga12" }]),
    });
    const result = atualizarSenhaLocal(storage, "CLIENTE@TESTE.COM", "abcdef");
    assert.equal(result.ok, true);
    assert.ok(result.fontesAtualizadas.includes("@usuario"));
    assert.ok(result.fontesAtualizadas.includes("@clientes"));
  });

  it("falha se e-mail não existir em nenhuma fonte", () => {
    const storage = createMemoryStorage({
      "@clientes": JSON.stringify([{ email: "outro@teste.com", senha: "x" }]),
    });
    const result = atualizarSenhaLocal(storage, "cliente@teste.com", "abcdef");
    assert.equal(result.ok, false);
    assert.equal(result.motivo, "email_nao_encontrado");
  });

  it("rejeita senha curta", () => {
    const storage = createMemoryStorage({
      "@clientes": JSON.stringify([{ email: "a@b.com", senha: "123456" }]),
    });
    const result = atualizarSenhaLocal(storage, "a@b.com", "123");
    assert.equal(result.ok, false);
    assert.equal(result.motivo, "senha_curta");
  });
});
