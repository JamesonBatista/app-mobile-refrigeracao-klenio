// js/utils/painelAdminAbas.js
// Classificação de chamados nas abas do painel admin (sem I/O).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.PainelAdminAbas = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  /**
   * Separa chamados visíveis nas listas do painel.
   * - pendentes: Aguardando técnico
   * - aceitos: Aceito
   * - andamento: Em atendimento
   * (histórico/concluídos ficam em outra fonte)
   */
  function classificarChamadosPainel(lista) {
    const visiveis = (Array.isArray(lista) ? lista : []).filter(function (item) {
      return item && !item.excluidoPorAdmin;
    });

    return {
      pendentes: visiveis.filter(function (item) {
        return item.status === "Aguardando técnico";
      }),
      aceitos: visiveis.filter(function (item) {
        return item.status === "Aceito";
      }),
      andamento: visiveis.filter(function (item) {
        return item.status === "Em atendimento";
      }),
    };
  }

  function listaPorAba(abas, abaSelecionada) {
    const state = abas && typeof abas === "object" ? abas : {};
    if (abaSelecionada === "pendentes") return state.pendentes || [];
    if (abaSelecionada === "aceitos") return state.aceitos || [];
    if (abaSelecionada === "ativos" || abaSelecionada === "andamento") {
      return state.andamento || [];
    }
    if (abaSelecionada === "programados") return state.programados || [];
    if (abaSelecionada === "concluidos") return state.concluidos || [];
    return [];
  }

  return {
    classificarChamadosPainel,
    listaPorAba,
  };
});
