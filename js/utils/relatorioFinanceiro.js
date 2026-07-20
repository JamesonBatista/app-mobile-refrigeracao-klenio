// js/utils/relatorioFinanceiro.js
// Funções puras do relatório financeiro (períodos de calendário, valores, datas).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.RelatorioFinanceiro = api;
    Object.assign(root, {
      getIntervaloRelatorio: api.getIntervalo,
      formatarIntervaloBR: api.formatarIntervaloBR,
      parseDataBR: api.parseDataBR,
      dateFromRegistroFinanceiro: api.dateFromRegistro,
      valorNumberBR: api.valorNumber,
      valorDoRegistroFinanceiro: api.valorDoRegistro,
      filtrarRelatoriosPorPeriodo: api.filtrarRelatorios,
    });
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function parseDataBR(dataStr) {
    if (!dataStr) return null;
    const partes = String(dataStr).trim().split("/");
    if (partes.length !== 3) return null;
    const d = Number.parseInt(partes[0], 10);
    const m = Number.parseInt(partes[1], 10) - 1;
    const y = Number.parseInt(partes[2], 10);
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
    const dt = new Date(y, m, d);
    if (Number.isNaN(dt.getTime())) return null;
    if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) return null;
    return dt;
  }

  function inicioDoDia(data) {
    const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fimDoDia(data) {
    const d = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function inicioSemanaSegunda(ref) {
    const d = inicioDoDia(ref);
    const diaSemana = d.getDay(); // 0=dom ... 6=sab
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    d.setDate(d.getDate() + diff);
    return d;
  }

  function fimSemanaDomingo(ref) {
    const inicio = inicioSemanaSegunda(ref);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return fimDoDia(fim);
  }

  /**
   * Períodos de calendário (não janelas rolantes):
   * - hoje: dia atual
   * - semana: segunda a domingo da semana atual
   * - quinzena: 1–15 ou 16–último dia do mês
   * - mes: 1º ao último dia do mês atual
   * - personalizado: datas dd/mm/aaaa (exige início <= fim)
   */
  function getIntervalo(filtroAtivo, opcoes) {
    const opts = opcoes && typeof opcoes === "object" ? opcoes : {};
    const ref = opts.referencia instanceof Date ? opts.referencia : new Date();
    const hoje = inicioDoDia(ref);

    if (filtroAtivo === "hoje") {
      return { inicio: inicioDoDia(hoje), fim: fimDoDia(hoje) };
    }

    if (filtroAtivo === "semana") {
      return { inicio: inicioSemanaSegunda(hoje), fim: fimSemanaDomingo(hoje) };
    }

    if (filtroAtivo === "quinzena") {
      const y = hoje.getFullYear();
      const m = hoje.getMonth();
      const dia = hoje.getDate();
      if (dia <= 15) {
        return {
          inicio: new Date(y, m, 1, 0, 0, 0, 0),
          fim: new Date(y, m, 15, 23, 59, 59, 999),
        };
      }
      return {
        inicio: new Date(y, m, 16, 0, 0, 0, 0),
        fim: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }

    if (filtroAtivo === "mes") {
      const y = hoje.getFullYear();
      const m = hoje.getMonth();
      return {
        inicio: new Date(y, m, 1, 0, 0, 0, 0),
        fim: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }

    if (filtroAtivo === "personalizado") {
      const ini = parseDataBR(opts.dataInicio);
      const fim = parseDataBR(opts.dataFim);
      if (!ini || !fim) return null;
      const inicio = inicioDoDia(ini);
      const fimDia = fimDoDia(fim);
      if (inicio.getTime() > fimDia.getTime()) return null;
      return { inicio, fim: fimDia };
    }

    return { inicio: inicioDoDia(hoje), fim: fimDoDia(hoje) };
  }

  function formatarIntervaloBR(intervalo) {
    if (!intervalo || !intervalo.inicio || !intervalo.fim) return "";
    const fmt = function (d) {
      return d.toLocaleDateString("pt-BR");
    };
    return `${fmt(intervalo.inicio)} – ${fmt(intervalo.fim)}`;
  }

  /** Usa apenas data de conclusão (não dataServico/dataCriacao). */
  function dateFromRegistro(reg) {
    if (!reg || typeof reg !== "object") return null;
    if (reg.dataConclusaoISO) {
      const dt = new Date(reg.dataConclusaoISO);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    if (reg.dataConclusao) {
      const dt = parseDataBR(reg.dataConclusao);
      if (dt) return dt;
    }
    return null;
  }

  /** Parse de valores BR: "1.350,00" → 1350; também aceita "1350.00". */
  function valorNumber(v) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    let s = String(v == null ? "0" : v).trim();
    if (!s) return 0;
    s = s.replace(/[^\d,.\-]/g, "");
    if (s.includes(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    const n = Number.parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  }

  function valorDoRegistro(reg) {
    if (reg && typeof reg.valorNumerico === "number" && Number.isFinite(reg.valorNumerico)) {
      return reg.valorNumerico;
    }
    return valorNumber(reg && reg.valorCobrado);
  }

  function filtrarRelatorios(lista, filtroAtivo, opcoes) {
    const intervalo = getIntervalo(filtroAtivo, opcoes);
    if (!intervalo) return [];
    const base = Array.isArray(lista) ? lista : [];
    return base
      .filter(function (r) {
        const dataReg = dateFromRegistro(r);
        return dataReg && dataReg >= intervalo.inicio && dataReg <= intervalo.fim;
      })
      .sort(function (a, b) {
        const da = dateFromRegistro(a);
        const db = dateFromRegistro(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        return db - da;
      });
  }

  return {
    parseDataBR,
    getIntervalo,
    formatarIntervaloBR,
    dateFromRegistro,
    valorNumber,
    valorDoRegistro,
    filtrarRelatorios,
    inicioSemanaSegunda,
    fimSemanaDomingo,
  };
});
