// js/utils/slotDisponivel.js
// Revalidação de horário antes de confirmar agendamento/aprovação.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SlotDisponivel = api;
    root.horarioAindaDisponivel = api.horarioAindaDisponivel;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function horarioAindaDisponivel(horariosDisponiveis, horarioEscolhido) {
    if (!horarioEscolhido) return false;
    const lista = Array.isArray(horariosDisponiveis) ? horariosDisponiveis : [];
    return lista.indexOf(horarioEscolhido) >= 0;
  }

  return { horarioAindaDisponivel };
});
