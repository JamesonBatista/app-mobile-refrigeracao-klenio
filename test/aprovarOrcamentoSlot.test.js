const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { horarioAindaDisponivel } = require("../js/utils/slotDisponivel.js");

describe("P11 — aprovar orçamento revalida horário antes de salvar", () => {
  it("permite quando horário ainda está na lista", () => {
    assert.equal(
      horarioAindaDisponivel(["08:00 às 10:00", "10:00 às 12:00"], "08:00 às 10:00"),
      true
    );
  });

  it("bloqueia quando horário saiu da lista (double-booking)", () => {
    assert.equal(
      horarioAindaDisponivel(["10:00 às 12:00"], "08:00 às 10:00"),
      false
    );
  });

  it("bloqueia lista vazia", () => {
    assert.equal(horarioAindaDisponivel([], "08:00 às 10:00"), false);
  });
});
