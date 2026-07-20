const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  getIntervalo,
  formatarIntervaloBR,
  parseDataBR,
  dateFromRegistro,
  valorNumber,
  valorDoRegistro,
  filtrarRelatorios,
} = require("../js/utils/relatorioFinanceiro.js");

describe("P1/P2 — períodos de calendário bem separados", () => {
  // Quarta-feira 15/07/2026
  const refQuinzena1 = new Date(2026, 6, 15, 12, 0, 0);
  // Quinta-feira 16/07/2026
  const refQuinzena2 = new Date(2026, 6, 16, 12, 0, 0);
  // Quarta 08/07/2026
  const refSemana = new Date(2026, 6, 8, 12, 0, 0);

  it("hoje cobre exatamente 1 dia calendário", () => {
    const { inicio, fim } = getIntervalo("hoje", { referencia: refSemana });
    assert.equal(inicio.getDate(), 8);
    assert.equal(fim.getDate(), 8);
    assert.equal(inicio.getHours(), 0);
    assert.equal(fim.getHours(), 23);
    assert.equal(fim.getMinutes(), 59);
  });

  it("semana é segunda a domingo (não janela rolante de 7 dias)", () => {
    const { inicio, fim } = getIntervalo("semana", { referencia: refSemana });
    // 08/07/2026 é quarta → semana 06/07 (seg) a 12/07 (dom)
    assert.equal(inicio.getDay(), 1);
    assert.equal(inicio.getDate(), 6);
    assert.equal(fim.getDay(), 0);
    assert.equal(fim.getDate(), 12);
  });

  it("semana não usa hoje-7 (off-by-one rolante)", () => {
    const { inicio } = getIntervalo("semana", { referencia: refSemana });
    const rolante = new Date(refSemana);
    rolante.setHours(0, 0, 0, 0);
    rolante.setDate(rolante.getDate() - 7);
    assert.notEqual(inicio.getTime(), rolante.getTime());
  });

  it("quinzena 1–15 quando dia <= 15", () => {
    const { inicio, fim } = getIntervalo("quinzena", { referencia: refQuinzena1 });
    assert.equal(inicio.getDate(), 1);
    assert.equal(fim.getDate(), 15);
    assert.equal(inicio.getMonth(), 6);
    assert.equal(fim.getMonth(), 6);
  });

  it("quinzena 16–fim quando dia >= 16", () => {
    const { inicio, fim } = getIntervalo("quinzena", { referencia: refQuinzena2 });
    assert.equal(inicio.getDate(), 16);
    assert.equal(fim.getDate(), 31); // julho
    assert.equal(inicio.getMonth(), 6);
  });

  it("mês é 1º ao último dia do mês (não últimos 30 dias)", () => {
    const { inicio, fim } = getIntervalo("mes", { referencia: refQuinzena2 });
    assert.equal(inicio.getDate(), 1);
    assert.equal(fim.getDate(), 31);
    assert.equal(inicio.getMonth(), 6);
    assert.equal(fim.getMonth(), 6);
  });

  it("semana / quinzena / mês têm limites distintos (bem separados)", () => {
    const semana = getIntervalo("semana", { referencia: refQuinzena2 });
    const quinzena = getIntervalo("quinzena", { referencia: refQuinzena2 });
    const mes = getIntervalo("mes", { referencia: refQuinzena2 });

    assert.notEqual(semana.inicio.getTime(), quinzena.inicio.getTime());
    assert.notEqual(semana.fim.getTime(), quinzena.fim.getTime());
    assert.notEqual(quinzena.inicio.getTime(), mes.inicio.getTime());
    // quinzena 2 começa dia 16; mês começa dia 1
    assert.equal(quinzena.inicio.getDate(), 16);
    assert.equal(mes.inicio.getDate(), 1);
  });

  it("formata intervalo em pt-BR", () => {
    const intervalo = getIntervalo("quinzena", { referencia: refQuinzena1 });
    const texto = formatarIntervaloBR(intervalo);
    assert.match(texto, /01\/07\/2026/);
    assert.match(texto, /15\/07\/2026/);
    assert.match(texto, /–/);
  });
});

describe("P3 — período personalizado", () => {
  it("aceita intervalo válido com início <= fim", () => {
    const intervalo = getIntervalo("personalizado", {
      dataInicio: "01/07/2026",
      dataFim: "10/07/2026",
    });
    assert.ok(intervalo);
    assert.equal(intervalo.inicio.getDate(), 1);
    assert.equal(intervalo.fim.getDate(), 10);
  });

  it("rejeita início > fim", () => {
    const intervalo = getIntervalo("personalizado", {
      dataInicio: "20/07/2026",
      dataFim: "10/07/2026",
    });
    assert.equal(intervalo, null);
  });

  it("rejeita datas incompletas", () => {
    assert.equal(getIntervalo("personalizado", { dataInicio: "01/07/2026", dataFim: "" }), null);
    assert.equal(getIntervalo("personalizado", { dataInicio: "", dataFim: "10/07/2026" }), null);
  });

  it("parseDataBR rejeita data inválida", () => {
    assert.equal(parseDataBR("32/01/2026"), null);
    assert.equal(parseDataBR("abc"), null);
  });
});

describe("P4 — soma de valores BR", () => {
  it("parseia 1.350,00 corretamente", () => {
    assert.equal(valorNumber("1.350,00"), 1350);
  });

  it("parseia 350,50", () => {
    assert.equal(valorNumber("350,50"), 350.5);
  });

  it("usa valorNumerico quando existir", () => {
    assert.equal(valorDoRegistro({ valorNumerico: 200, valorCobrado: "1.350,00" }), 200);
  });

  it("cai para valorCobrado se valorNumerico ausente", () => {
    assert.equal(valorDoRegistro({ valorCobrado: "1.350,00" }), 1350);
  });
});

describe("P5 — data do filtro só conclusão", () => {
  it("usa dataConclusaoISO", () => {
    const dt = dateFromRegistro({ dataConclusaoISO: "2026-07-10T15:00:00.000Z" });
    assert.ok(dt instanceof Date);
    assert.ok(!Number.isNaN(dt.getTime()));
  });

  it("usa dataConclusao BR", () => {
    const dt = dateFromRegistro({ dataConclusao: "10/07/2026" });
    assert.equal(dt.getDate(), 10);
    assert.equal(dt.getMonth(), 6);
  });

  it("não usa dataServico nem dataCriacao", () => {
    assert.equal(
      dateFromRegistro({ dataServico: "01/07/2026", dataCriacao: "02/07/2026" }),
      null
    );
  });

  it("filtra só registros concluídos no período", () => {
    const lista = [
      { id: "a", dataConclusao: "08/07/2026", valorCobrado: "100" },
      { id: "b", dataServico: "08/07/2026", valorCobrado: "999" }, // sem conclusão
      { id: "c", dataConclusao: "20/07/2026", valorCobrado: "50" },
    ];
    const filtrados = filtrarRelatorios(lista, "semana", {
      referencia: new Date(2026, 6, 8, 12, 0, 0),
    });
    assert.equal(filtrados.length, 1);
    assert.equal(filtrados[0].id, "a");
  });
});
