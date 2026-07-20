const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  montarOcupacaoPorDia,
  horarioEstaOcupado,
  ocupantesDoHorario,
} = require("../js/utils/agendaOcupacao.js");

describe("P10 — agenda admin mostra ocupação (além de bloqueios)", () => {
  const items = [
    {
      numero: "#1001",
      cliente: "João",
      dataChave: "2026-07-20",
      horario: "08:00 às 10:00",
      status: "Aguardando técnico",
    },
    {
      numero: "PRG-9",
      cliente: "Maria",
      dataChave: "2026-07-20",
      horario: "10:00 às 12:00",
      status: "Agendado",
    },
    {
      numero: "#1002",
      cliente: "Cancelado",
      dataChave: "2026-07-20",
      horario: "13:00 às 15:00",
      status: "Cancelado",
    },
    {
      numero: "#1003",
      cliente: "Feito",
      dataChave: "2026-07-20",
      horario: "15:00 às 17:00",
      status: "Concluído",
    },
  ];

  it("monta mapa só com status que ocupam horário", () => {
    const mapa = montarOcupacaoPorDia(items);
    assert.equal(horarioEstaOcupado(mapa, "2026-07-20", "08:00 às 10:00"), true);
    assert.equal(horarioEstaOcupado(mapa, "2026-07-20", "10:00 às 12:00"), true);
    assert.equal(horarioEstaOcupado(mapa, "2026-07-20", "13:00 às 15:00"), false);
    assert.equal(horarioEstaOcupado(mapa, "2026-07-20", "15:00 às 17:00"), false);
  });

  it("expõe cliente/numero do ocupante", () => {
    const mapa = montarOcupacaoPorDia(items);
    const ocupantes = ocupantesDoHorario(mapa, "2026-07-20", "08:00 às 10:00");
    assert.equal(ocupantes.length, 1);
    assert.equal(ocupantes[0].cliente, "João");
    assert.equal(ocupantes[0].numero, "#1001");
  });
});
