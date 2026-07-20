const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  podeAcessarTela,
  resolverTelaAutorizada,
  validarCredenciaisAdmin,
} = require("../js/utils/authGuards.js");

describe("P7 — login admin exige e-mail + senha do mesmo par", () => {
  it("aceita par válido", () => {
    assert.equal(validarCredenciaisAdmin("krefrigeracao", "060318"), true);
    assert.equal(validarCredenciaisAdmin("krefrigeracao3", "060318"), true);
  });

  it("rejeita senha correta com e-mail errado", () => {
    assert.equal(validarCredenciaisAdmin("qualquer", "060318"), false);
  });

  it("rejeita e-mail correto com senha errada", () => {
    assert.equal(validarCredenciaisAdmin("krefrigeracao", "000000"), false);
  });
});

describe("P8 — deep-link / navegação respeitam perfil", () => {
  it("admin acessa painel e relatório", () => {
    const admin = { perfil: "admin" };
    assert.equal(podeAcessarTela("painelAdmin", admin), true);
    assert.equal(podeAcessarTela("relatorio", admin), true);
  });

  it("visitante não acessa painelAdmin via deep-link", () => {
    assert.equal(podeAcessarTela("painelAdmin", null), false);
    assert.equal(resolverTelaAutorizada("painelAdmin", null), "inicial");
  });

  it("cliente não acessa telas admin", () => {
    const cliente = { perfil: "cliente", email: "a@b.com" };
    assert.equal(podeAcessarTela("relatorio", cliente), false);
    assert.equal(resolverTelaAutorizada("relatorio", cliente), "principal");
  });

  it("telas públicas liberadas sem login", () => {
    assert.equal(podeAcessarTela("loginCliente", null), true);
    assert.equal(podeAcessarTela("inicial", null), true);
  });
});
