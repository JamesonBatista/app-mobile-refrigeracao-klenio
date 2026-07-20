const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { formatarDataChaveLocal } = require("../js/utils/dataLocal.js");

describe("P6 — formatarDataChave em fuso local (não UTC)", () => {
  it("mantém o dia local à noite no Brasil (UTC-3)", () => {
    // 20/07/2026 22:30 local — em UTC já seria 21/07
    const localNoite = new Date(2026, 6, 20, 22, 30, 0);
    const chave = formatarDataChaveLocal(localNoite);
    assert.equal(chave, "2026-07-20");
    // Contraste com o bug antigo:
    const utcBug = localNoite.toISOString().split("T")[0];
    // Em ambientes UTC o bug não aparece; ainda assim a chave local deve ser estável.
    assert.equal(chave, "2026-07-20");
    assert.match(chave, /^\d{4}-\d{2}-\d{2}$/);
    void utcBug;
  });

  it("retorna vazio para data inválida", () => {
    assert.equal(formatarDataChaveLocal(new Date("invalid")), "");
  });
});
