// js/utils/fimDeSemanaAgenda.js
// Sábado e domingo bloqueados por padrão; só o ADM libera (marcador LIBERADO).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.FimDeSemanaAgenda = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  const MARCADOR_LIBERADO = "LIBERADO";

  function isDomingo(data) {
    return data instanceof Date && data.getDay() === 0;
  }

  function isSabado(data) {
    return data instanceof Date && data.getDay() === 6;
  }

  function isFimDeSemana(data) {
    return isSabado(data) || isDomingo(data);
  }

  function listaBloqueiosDoDia(bloqueios, dataOuChave) {
    if (!bloqueios || typeof bloqueios !== "object") return [];
    let chave = dataOuChave;
    if (dataOuChave instanceof Date) {
      const pad = function (n) {
        return String(n).padStart(2, "0");
      };
      chave = `${dataOuChave.getFullYear()}-${pad(dataOuChave.getMonth() + 1)}-${pad(dataOuChave.getDate())}`;
    }
    const lista = bloqueios[chave];
    return Array.isArray(lista) ? lista : [];
  }

  function isFimDeSemanaLiberado(bloqueiosDia) {
    return Array.isArray(bloqueiosDia) && bloqueiosDia.indexOf(MARCADOR_LIBERADO) >= 0;
  }

  /** Cliente: fim de semana só aparece/abre se ADM salvou LIBERADO. */
  function isFimDeSemanaBloqueadoParaCliente(data, bloqueiosDia) {
    if (!isFimDeSemana(data)) return false;
    return !isFimDeSemanaLiberado(bloqueiosDia);
  }

  /**
   * Admin UI: dia completo bloqueado?
   * - fim de semana sem LIBERADO → bloqueado por padrão
   * - qualquer dia com DIA_COMPLETO → bloqueado
   */
  function isDiaCompletoBloqueado(data, bloqueiosDia) {
    const lista = Array.isArray(bloqueiosDia) ? bloqueiosDia : [];
    if (lista.indexOf("DIA_COMPLETO") >= 0) return true;
    if (isFimDeSemana(data) && lista.indexOf(MARCADOR_LIBERADO) < 0) return true;
    return false;
  }

  /**
   * Gera próximos dias da agenda.
   * - Cliente (padrão): seg–sex + sáb/dom só se LIBERADO nos bloqueios
   * - Admin (incluirFimDeSemana): inclui sáb/dom sempre
   */
  function getProximosDiasAgenda(quantidade, opcoes) {
    const opts = opcoes && typeof opcoes === "object" ? opcoes : {};
    const limite = Number.isFinite(quantidade) && quantidade > 0 ? quantidade : 14;
    const incluirFimDeSemana = !!opts.incluirFimDeSemana;
    const bloqueios = opts.bloqueios && typeof opts.bloqueios === "object" ? opts.bloqueios : {};
    const referencia = opts.referencia instanceof Date ? opts.referencia : new Date();

    const dias = [];
    let contador = 0;
    let i = 0;
    // limite de segurança para não loopar infinito
    while (contador < limite && i < 60) {
      const data = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate() + i);
      i += 1;

      if (isFimDeSemana(data)) {
        if (!incluirFimDeSemana) {
          const lista = listaBloqueiosDoDia(bloqueios, data);
          if (isFimDeSemanaBloqueadoParaCliente(data, lista)) continue;
        }
      }

      dias.push(data);
      contador += 1;
    }
    return dias;
  }

  /** Payload ao desbloquear fim de semana (ou dia com DIA_COMPLETO). */
  function horariosAposDesbloquearDia(data, bloqueiosDiaAtuais) {
    const lista = Array.isArray(bloqueiosDiaAtuais) ? bloqueiosDiaAtuais : [];
    if (isFimDeSemana(data)) {
      return [MARCADOR_LIBERADO];
    }
    return lista.filter(function (item) {
      return item !== "DIA_COMPLETO" && item !== MARCADOR_LIBERADO;
    });
  }

  /** Payload ao bloquear dia completo. */
  function horariosAposBloquearDiaCompleto() {
    return ["DIA_COMPLETO"];
  }

  return {
    MARCADOR_LIBERADO,
    isDomingo,
    isSabado,
    isFimDeSemana,
    listaBloqueiosDoDia,
    isFimDeSemanaLiberado,
    isFimDeSemanaBloqueadoParaCliente,
    isDiaCompletoBloqueado,
    getProximosDiasAgenda,
    horariosAposDesbloquearDia,
    horariosAposBloquearDiaCompleto,
  };
});
