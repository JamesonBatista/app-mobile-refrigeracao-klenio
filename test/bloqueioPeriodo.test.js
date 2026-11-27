const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  validarPeriodo,
  listarChavesPeriodo,
  calcularBloqueioPeriodo,
  calcularDesbloqueioPeriodo,
  agruparPeriodosBloqueados,
  formatarChaveBR,
} = require("../js/utils/bloqueioPeriodo.js");

describe("Bloqueio de período — validação e intervalo", () => {
  it("lista todas as datas do intervalo, inclusive virada de mês e ano", () => {
    assert.deepEqual(listarChavesPeriodo("2026-12-30", "2027-01-02"), [
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("aceita período de um único dia", () => {
    assert.deepEqual(listarChavesPeriodo("2026-12-01", "2026-12-01"), ["2026-12-01"]);
  });

  it("rejeita datas inválidas, fim antes do início e períodos muito longos", () => {
    assert.equal(validarPeriodo("", "2026-12-01").ok, false);
    assert.equal(validarPeriodo("2026-02-30", "2026-03-01").ok, false);
    assert.equal(validarPeriodo("2026-12-05", "2026-12-01").ok, false);
    assert.equal(validarPeriodo("2026-01-01", "2027-12-31").ok, false);
    assert.equal(validarPeriodo("2026-12-01", "2026-12-10", "2026-12-11").ok, false);
    assert.equal(validarPeriodo("2026-12-01", "2026-12-10", "2026-12-10").ok, true);
    assert.deepEqual(listarChavesPeriodo("2026-12-05", "2026-12-01"), []);
  });
});

describe("Bloqueio de período — aplicar e remover", () => {
  it("bloqueia dia inteiro em todos os dias do período, preservando bloqueios existentes", () => {
    const bloqueios = { "2026-12-02": ["08:00 às 10:00"], "2026-12-03": ["DIA_COMPLETO"] };
    const chaves = listarChavesPeriodo("2026-12-01", "2026-12-03");
    const resultado = calcularBloqueioPeriodo(bloqueios, chaves, []);
    assert.deepEqual(resultado["2026-12-01"], ["DIA_COMPLETO"]);
    assert.deepEqual(resultado["2026-12-02"], ["08:00 às 10:00", "DIA_COMPLETO"]);
    assert.equal("2026-12-03" in resultado, false);
  });

  it("bloqueia dia inteiro também em sábado e domingo", () => {
    const resultado = calcularBloqueioPeriodo({}, ["2026-12-05", "2026-12-06"], []);
    assert.deepEqual(resultado["2026-12-05"], ["DIA_COMPLETO"]);
    assert.deepEqual(resultado["2026-12-06"], ["DIA_COMPLETO"]);
  });

  it("bloqueia só horários escolhidos e ignora fim de semana não liberado", () => {
    const bloqueios = { "2026-12-06": ["LIBERADO"] };
    const chaves = listarChavesPeriodo("2026-12-04", "2026-12-07");
    const resultado = calcularBloqueioPeriodo(bloqueios, chaves, ["10:00 às 12:00"]);
    assert.deepEqual(resultado["2026-12-04"], ["10:00 às 12:00"]);
    assert.equal("2026-12-05" in resultado, false);
    assert.deepEqual(resultado["2026-12-06"], ["LIBERADO", "10:00 às 12:00"]);
    assert.deepEqual(resultado["2026-12-07"], ["10:00 às 12:00"]);
  });

  it("desbloqueia dia inteiro mantendo horários parciais e marcador LIBERADO", () => {
    const bloqueios = {
      "2026-12-01": ["DIA_COMPLETO"],
      "2026-12-02": ["DIA_COMPLETO", "13:00 às 15:00"],
      "2026-12-06": ["LIBERADO", "DIA_COMPLETO"],
    };
    const resultado = calcularDesbloqueioPeriodo(bloqueios, Object.keys(bloqueios), []);
    assert.deepEqual(resultado["2026-12-01"], []);
    assert.deepEqual(resultado["2026-12-02"], ["13:00 às 15:00"]);
    assert.deepEqual(resultado["2026-12-06"], ["LIBERADO"]);
  });

  it("desbloqueia horários específicos", () => {
    const bloqueios = { "2026-12-01": ["08:00 às 10:00", "10:00 às 12:00"] };
    const resultado = calcularDesbloqueioPeriodo(bloqueios, ["2026-12-01"], ["08:00 às 10:00"]);
    assert.deepEqual(resultado["2026-12-01"], ["10:00 às 12:00"]);
  });
});

describe("Bloqueio de período — agrupamento para exibição", () => {
  it("agrupa dias consecutivos iguais, separa lacunas e ignora datas passadas", () => {
    const bloqueios = {
      "2026-11-20": ["DIA_COMPLETO"],
      "2026-12-01": ["DIA_COMPLETO"],
      "2026-12-02": ["DIA_COMPLETO"],
      "2026-12-03": ["DIA_COMPLETO"],
      "2026-12-05": ["DIA_COMPLETO"],
      "2026-12-06": ["10:00 às 12:00"],
      "2026-12-07": ["LIBERADO"],
      "2026-12-08": [],
    };
    const grupos = agruparPeriodosBloqueados(bloqueios, "2026-11-27");
    assert.equal(grupos.length, 3);
    assert.deepEqual(
      grupos.map((g) => [g.inicio, g.fim, g.dias, g.diaCompleto]),
      [
        ["2026-12-01", "2026-12-03", 3, true],
        ["2026-12-05", "2026-12-05", 1, true],
        ["2026-12-06", "2026-12-06", 1, false],
      ]
    );
    assert.deepEqual(grupos[2].horarios, ["10:00 às 12:00"]);
  });

  it("agrupa através da virada de mês", () => {
    const bloqueios = { "2026-12-31": ["DIA_COMPLETO"], "2027-01-01": ["DIA_COMPLETO"] };
    const grupos = agruparPeriodosBloqueados(bloqueios, "2026-12-01");
    assert.equal(grupos.length, 1);
    assert.equal(grupos[0].fim, "2027-01-01");
  });

  it("formata chave em dd/mm/aaaa", () => {
    assert.equal(formatarChaveBR("2026-12-05"), "05/12/2026");
  });
});
