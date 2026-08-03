const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { getProximosDiasAgenda, isFimDeSemana } = require("../js/utils/fimDeSemanaAgenda.js");

describe("P14 — cliente vê 2 semanas de dias disponíveis (úteis)", () => {
  it("retorna 14 dias sem sábado nem domingo", () => {
    const dias = getProximosDiasAgenda(14, { referencia: new Date(2026, 6, 20) });
    assert.equal(dias.length, 14);
    dias.forEach(function (d) {
      assert.equal(isFimDeSemana(d), false);
    });
  });

  it("aceita quantidade customizada", () => {
    assert.equal(getProximosDiasAgenda(7, { referencia: new Date(2026, 6, 20) }).length, 7);
  });
});
