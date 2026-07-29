const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  classificarChamadosPainel,
  listaPorAba,
} = require("../js/utils/painelAdminAbas.js");

describe("Painel admin — aba Aceito separada de Andamento", () => {
  const lista = [
    { numero: "#1", status: "Aguardando técnico" },
    { numero: "#2", status: "Aceito" },
    { numero: "#3", status: "Em atendimento" },
    { numero: "#4", status: "Aceito" },
    { numero: "#5", status: "Em atendimento" },
    { numero: "#6", status: "Concluído" },
    { numero: "#7", status: "Aceito", excluidoPorAdmin: true },
  ];

  it("pendentes só com Aguardando técnico", () => {
    const { pendentes } = classificarChamadosPainel(lista);
    assert.deepEqual(
      pendentes.map((i) => i.numero),
      ["#1"]
    );
  });

  it("aceitos só com status Aceito", () => {
    const { aceitos } = classificarChamadosPainel(lista);
    assert.deepEqual(
      aceitos.map((i) => i.numero),
      ["#2", "#4"]
    );
  });

  it("andamento só com Em atendimento", () => {
    const { andamento } = classificarChamadosPainel(lista);
    assert.deepEqual(
      andamento.map((i) => i.numero),
      ["#3", "#5"]
    );
  });

  it("Aceito não aparece em andamento", () => {
    const { aceitos, andamento } = classificarChamadosPainel(lista);
    const numsAndamento = new Set(andamento.map((i) => i.numero));
    aceitos.forEach((item) => {
      assert.equal(numsAndamento.has(item.numero), false);
    });
  });

  it("listaPorAba resolve aceitos e ativos", () => {
    const classificados = classificarChamadosPainel(lista);
    assert.equal(listaPorAba(classificados, "aceitos").length, 2);
    assert.equal(listaPorAba(classificados, "ativos").length, 2);
    assert.equal(listaPorAba(classificados, "andamento")[0].status, "Em atendimento");
  });
});
