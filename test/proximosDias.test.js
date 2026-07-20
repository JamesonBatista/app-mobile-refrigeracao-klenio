const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

/**
 * Extrai e executa só a lógica de getProximosDias do agenda.js
 * sem carregar Firebase/CRUD.
 */
function carregarGetProximosDias() {
  const code = fs.readFileSync(path.join(__dirname, "../js/utils/agenda.js"), "utf8");
  const match = code.match(
    /const DIAS_AGENDA_DISPONIVEIS = (\d+);\s*function getProximosDias\(quantidade\) \{[\s\S]*?\n  \}/
  );
  assert.ok(match, "getProximosDias não encontrado em agenda.js");

  const sandbox = {
    Date,
    Number,
    isDomingo: function (data) {
      return data.getDay() === 0;
    },
  };
  vm.runInNewContext(match[0] + "\nthis.getProximosDias = getProximosDias;\nthis.DIAS_AGENDA_DISPONIVEIS = DIAS_AGENDA_DISPONIVEIS;", sandbox);
  return sandbox;
}

describe("P14 — cliente vê 2 semanas de dias disponíveis", () => {
  it("DIAS_AGENDA_DISPONIVEIS é 14", () => {
    const api = carregarGetProximosDias();
    assert.equal(api.DIAS_AGENDA_DISPONIVEIS, 14);
  });

  it("getProximosDias retorna 14 dias sem domingo", () => {
    const api = carregarGetProximosDias();
    const dias = api.getProximosDias();
    assert.equal(dias.length, 14);
    dias.forEach(function (d) {
      assert.notEqual(d.getDay(), 0);
    });
  });

  it("aceita quantidade customizada", () => {
    const api = carregarGetProximosDias();
    assert.equal(api.getProximosDias(7).length, 7);
  });
});
