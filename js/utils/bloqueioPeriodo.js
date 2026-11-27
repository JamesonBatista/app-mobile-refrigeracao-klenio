// js/utils/bloqueioPeriodo.js
// Bloqueio de períodos (intervalo de datas) na agenda, usado pelo ADM para impedir novos chamados.
// Reaproveita o formato existente: bloqueios[YYYY-MM-DD] = ["DIA_COMPLETO" | "08:00 às 10:00" | "LIBERADO", ...]

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.BloqueioPeriodo = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  const DIA_COMPLETO = "DIA_COMPLETO";
  const LIBERADO = "LIBERADO";
  const MAX_DIAS_PERIODO = 366;
  const REGEX_CHAVE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function chaveParaData(chave) {
    const match = REGEX_CHAVE.exec(String(chave || ""));
    if (!match) return null;
    const ano = Number(match[1]);
    const mes = Number(match[2]);
    const dia = Number(match[3]);
    const data = new Date(ano, mes - 1, dia);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return null;
    return data;
  }

  function dataParaChave(data) {
    return `${data.getFullYear()}-${pad2(data.getMonth() + 1)}-${pad2(data.getDate())}`;
  }

  function isFimDeSemanaChave(chave) {
    const data = chaveParaData(chave);
    if (!data) return false;
    const dia = data.getDay();
    return dia === 0 || dia === 6;
  }

  function validarPeriodo(inicioChave, fimChave, hojeChave) {
    const inicio = chaveParaData(inicioChave);
    const fim = chaveParaData(fimChave);
    if (!inicio || !fim) return { ok: false, erro: "Informe a data inicial e a data final." };
    if (fim < inicio) return { ok: false, erro: "A data final não pode ser anterior à data inicial." };
    if (hojeChave && fimChave < hojeChave) return { ok: false, erro: "O período precisa terminar hoje ou depois." };
    const total = Math.round((fim - inicio) / 86400000) + 1;
    if (total > MAX_DIAS_PERIODO) {
      return { ok: false, erro: `O período pode ter no máximo ${MAX_DIAS_PERIODO} dias.` };
    }
    return { ok: true };
  }

  /** Lista as chaves YYYY-MM-DD do intervalo (inclusive). Retorna [] se o intervalo for inválido. */
  function listarChavesPeriodo(inicioChave, fimChave) {
    const validacao = validarPeriodo(inicioChave, fimChave);
    if (!validacao.ok) return [];
    const inicio = chaveParaData(inicioChave);
    const fim = chaveParaData(fimChave);
    const chaves = [];
    for (let i = 0; ; i += 1) {
      const data = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      if (data > fim) break;
      chaves.push(dataParaChave(data));
    }
    return chaves;
  }

  function listaDoDia(bloqueios, chave) {
    const lista = bloqueios && bloqueios[chave];
    return Array.isArray(lista) ? lista : [];
  }

  function unico(lista) {
    return Array.from(new Set(lista));
  }

  /**
   * Calcula o que gravar para bloquear o período.
   * - horarios vazio/ausente: bloqueia o dia inteiro.
   * - horarios informados: bloqueia só esses horários (fins de semana não liberados já são bloqueados por padrão).
   * Retorna { chave: novaLista } apenas para dias que mudam.
   */
  function calcularBloqueioPeriodo(bloqueios, chaves, horarios) {
    const selecionados = Array.isArray(horarios) ? horarios.filter(Boolean) : [];
    const atualizacoes = {};
    (chaves || []).forEach(function (chave) {
      const atual = listaDoDia(bloqueios, chave);
      let nova;
      if (selecionados.length === 0) {
        nova = unico(atual.concat([DIA_COMPLETO]));
      } else {
        if (isFimDeSemanaChave(chave) && atual.indexOf(LIBERADO) < 0) return;
        nova = unico(atual.concat(selecionados));
      }
      if (nova.length !== atual.length) atualizacoes[chave] = nova;
    });
    return atualizacoes;
  }

  /** Calcula o que gravar para remover bloqueios (dia completo ou horários específicos) do período. */
  function calcularDesbloqueioPeriodo(bloqueios, chaves, horarios) {
    const selecionados = Array.isArray(horarios) ? horarios.filter(Boolean) : [];
    const remover = selecionados.length === 0 ? [DIA_COMPLETO] : selecionados;
    const atualizacoes = {};
    (chaves || []).forEach(function (chave) {
      const atual = listaDoDia(bloqueios, chave);
      const nova = atual.filter(function (item) {
        return remover.indexOf(item) < 0;
      });
      if (nova.length !== atual.length) atualizacoes[chave] = nova;
    });
    return atualizacoes;
  }

  function assinaturaDia(lista) {
    return lista
      .filter(function (item) {
        return item !== LIBERADO;
      })
      .sort()
      .join("|");
  }

  /**
   * Agrupa dias consecutivos com o mesmo bloqueio (ignorando datas passadas) para exibir
   * "Períodos bloqueados" ao ADM.
   */
  function agruparPeriodosBloqueados(bloqueios, hojeChave) {
    const chaves = Object.keys(bloqueios || {})
      .filter(function (chave) {
        if (!chaveParaData(chave)) return false;
        if (hojeChave && chave < hojeChave) return false;
        return assinaturaDia(listaDoDia(bloqueios, chave)) !== "";
      })
      .sort();

    const grupos = [];
    chaves.forEach(function (chave) {
      const lista = listaDoDia(bloqueios, chave);
      const assinatura = assinaturaDia(lista);
      const itens = lista.filter(function (item) {
        return item !== LIBERADO;
      });
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.assinatura === assinatura) {
        const proximoEsperado = dataParaChave(
          new Date(
            chaveParaData(ultimo.fim).getFullYear(),
            chaveParaData(ultimo.fim).getMonth(),
            chaveParaData(ultimo.fim).getDate() + 1
          )
        );
        if (proximoEsperado === chave) {
          ultimo.fim = chave;
          ultimo.dias += 1;
          return;
        }
      }
      grupos.push({
        inicio: chave,
        fim: chave,
        dias: 1,
        assinatura,
        diaCompleto: itens.indexOf(DIA_COMPLETO) >= 0,
        horarios: itens.filter(function (item) {
          return item !== DIA_COMPLETO;
        }),
      });
    });
    return grupos;
  }

  function formatarChaveBR(chave) {
    const data = chaveParaData(chave);
    if (!data) return String(chave || "");
    return `${pad2(data.getDate())}/${pad2(data.getMonth() + 1)}/${data.getFullYear()}`;
  }

  return {
    DIA_COMPLETO,
    LIBERADO,
    MAX_DIAS_PERIODO,
    chaveParaData,
    dataParaChave,
    validarPeriodo,
    listarChavesPeriodo,
    calcularBloqueioPeriodo,
    calcularDesbloqueioPeriodo,
    agruparPeriodosBloqueados,
    formatarChaveBR,
  };
});
