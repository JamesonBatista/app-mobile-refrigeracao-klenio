// js/utils/agendaOcupacao.js
// Monta mapa de horários ocupados (leitura local; não altera CRUD).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AgendaOcupacao = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function statusOcupa(item) {
    const status = String((item && item.status) || "");
    return status !== "Cancelado" && status !== "Concluído";
  }

  /**
   * items: chamados e/ou programados com dataChave + horario
   * Retorna { [dataChave]: { [horario]: [{ tipo, numero, cliente }] } }
   */
  function montarOcupacaoPorDia(items) {
    const mapa = {};
    const lista = Array.isArray(items) ? items : [];
    lista.forEach(function (item) {
      if (!item || !statusOcupa(item)) return;
      const chave = item.dataChave;
      const horario = item.horario;
      if (!chave || !horario) return;
      if (!mapa[chave]) mapa[chave] = {};
      if (!mapa[chave][horario]) mapa[chave][horario] = [];
      mapa[chave][horario].push({
        tipo: item.numero && String(item.numero).indexOf("PRG") >= 0 ? "programado" : "chamado",
        numero: item.numero || "",
        cliente: item.cliente || "",
      });
    });
    return mapa;
  }

  function ocupantesDoHorario(mapa, dataChave, horario) {
    if (!mapa || !dataChave || !horario) return [];
    const dia = mapa[dataChave];
    if (!dia) return [];
    return Array.isArray(dia[horario]) ? dia[horario] : [];
  }

  function horarioEstaOcupado(mapa, dataChave, horario) {
    return ocupantesDoHorario(mapa, dataChave, horario).length > 0;
  }

  return {
    statusOcupa,
    montarOcupacaoPorDia,
    ocupantesDoHorario,
    horarioEstaOcupado,
  };
});
