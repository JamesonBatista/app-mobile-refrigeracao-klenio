const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  MARCADOR_LIBERADO,
  isFimDeSemana,
  isFimDeSemanaBloqueadoParaCliente,
  isDiaCompletoBloqueado,
  getProximosDiasAgenda,
  horariosAposDesbloquearDia,
  horariosAposBloquearDiaCompleto,
} = require("../js/utils/fimDeSemanaAgenda.js");

describe("Fim de semana bloqueado por padrão (só ADM libera)", () => {
  // Sexta 17/07/2026, Sábado 18, Domingo 19
  const sexta = new Date(2026, 6, 17);
  const sabado = new Date(2026, 6, 18);
  const domingo = new Date(2026, 6, 19);

  it("identifica sábado e domingo", () => {
    assert.equal(isFimDeSemana(sexta), false);
    assert.equal(isFimDeSemana(sabado), true);
    assert.equal(isFimDeSemana(domingo), true);
  });

  it("cliente: sábado/domingo bloqueados sem LIBERADO", () => {
    assert.equal(isFimDeSemanaBloqueadoParaCliente(sabado, []), true);
    assert.equal(isFimDeSemanaBloqueadoParaCliente(domingo, []), true);
    assert.equal(isFimDeSemanaBloqueadoParaCliente(sexta, []), false);
  });

  it("cliente: sábado liberado pelo ADM fica disponível", () => {
    assert.equal(isFimDeSemanaBloqueadoParaCliente(sabado, [MARCADOR_LIBERADO]), false);
  });

  it("admin UI: fim de semana aparece bloqueado até liberar", () => {
    assert.equal(isDiaCompletoBloqueado(sabado, []), true);
    assert.equal(isDiaCompletoBloqueado(sabado, [MARCADOR_LIBERADO]), false);
    assert.equal(isDiaCompletoBloqueado(sexta, []), false);
    assert.equal(isDiaCompletoBloqueado(sexta, ["DIA_COMPLETO"]), true);
  });

  it("cliente não vê sáb/dom nos próximos dias", () => {
    const dias = getProximosDiasAgenda(14, { referencia: sexta, bloqueios: {} });
    assert.equal(dias.length, 14);
    dias.forEach(function (d) {
      assert.equal(isFimDeSemana(d), false, `não deveria incluir ${d.toDateString()}`);
    });
  });

  it("cliente vê sábado se ADM marcou LIBERADO", () => {
    const bloqueios = { "2026-07-18": [MARCADOR_LIBERADO] };
    const dias = getProximosDiasAgenda(14, { referencia: sexta, bloqueios });
    const temSabado = dias.some(function (d) {
      return d.getDay() === 6 && d.getDate() === 18;
    });
    assert.equal(temSabado, true);
  });

  it("admin inclui fim de semana na lista", () => {
    const dias = getProximosDiasAgenda(14, {
      referencia: sexta,
      incluirFimDeSemana: true,
    });
    assert.equal(dias.length, 14);
    assert.ok(dias.some(function (d) { return d.getDay() === 6; }));
    assert.ok(dias.some(function (d) { return d.getDay() === 0; }));
  });

  it("desbloquear fim de semana grava LIBERADO", () => {
    assert.deepEqual(horariosAposDesbloquearDia(sabado, ["DIA_COMPLETO"]), [MARCADOR_LIBERADO]);
    assert.deepEqual(horariosAposBloquearDiaCompleto(), ["DIA_COMPLETO"]);
  });
});
