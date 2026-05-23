// js/screens/TelaRelatorio.js

(function () {
  const FILTROS = [
    { key: "hoje", label: "Hoje" },
    { key: "semana", label: "Semana" },
    { key: "quinzena", label: "Quinzena" },
    { key: "mes", label: "Mês" },
    { key: "personalizado", label: "Período" },
  ];

  const CORES_PAGAMENTO = {
    Dinheiro: "#27ae60",
    Pix: "#2980b9",
    "Cartão Débito": "#8e44ad",
    "Cartão Crédito": "#e67e22",
  };

  function criarFlocosFundo(container, prefixoClasse) {
    container.innerHTML = "";
    for (let i = 0; i < 10; i += 1) {
      const floco = document.createElement("span");
      floco.className = `${prefixoClasse}-floco`;
      floco.textContent = "❄";
      floco.style.setProperty("--x", `${Math.random() * window.innerWidth}px`);
      floco.style.setProperty("--size", `${9 + Math.random() * 10}px`);
      floco.style.setProperty("--dur", `${6000 + Math.random() * 5000}ms`);
      floco.style.setProperty("--delay", `${Math.random() * 3000}ms`);
      floco.style.setProperty("--opacity", `${0.2 + Math.random() * 0.45}`);
      container.appendChild(floco);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function parseArrayStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function parseDataBR(dataStr) {
    if (!dataStr) return null;
    const partes = dataStr.split("/");
    if (partes.length !== 3) return null;
    const d = Number.parseInt(partes[0], 10);
    const m = Number.parseInt(partes[1], 10) - 1;
    const y = Number.parseInt(partes[2], 10);
    const dt = new Date(y, m, d);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  function dateFromRegistro(reg) {
    if (reg.dataConclusaoISO) {
      const dt = new Date(reg.dataConclusaoISO);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
    if (reg.dataConclusao) {
      const dt = parseDataBR(reg.dataConclusao);
      if (dt) return dt;
    }
    if (reg.dataServico) {
      const dt = parseDataBR(reg.dataServico);
      if (dt) return dt;
    }
    if (reg.dataCriacao) {
      const dt = parseDataBR(reg.dataCriacao);
      if (dt) return dt;
    }
    return null;
  }

  function ouvirRelatoriosSafe(callback) {
    if (typeof window.ouvirRelatorios === "function") {
      const unsub = window.ouvirRelatorios(function (lista) {
        callback(Array.isArray(lista) ? lista : []);
      });
      return typeof unsub === "function" ? unsub : function () {};
    }
    callback(parseArrayStorage("@relatorios"));
    const interval = setInterval(function () {
      callback(parseArrayStorage("@relatorios"));
    }, 3000);
    return function () {
      clearInterval(interval);
    };
  }

  function valorNumber(v) {
    const parsed = Number.parseFloat(String(v || "0").replace(",", "."));
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatarValor(valor) {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function renderTelaRelatorio(root, props) {
    const state = {
      relatorios: [],
      carregando: true,
      filtroAtivo: "mes",
      dataInicio: "",
      dataFim: "",
      unsubscribe: null,
    };

    function getIntervalo() {
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      const inicio = new Date();
      inicio.setHours(0, 0, 0, 0);

      if (state.filtroAtivo === "hoje") return { inicio, fim: hoje };
      if (state.filtroAtivo === "semana") {
        inicio.setDate(inicio.getDate() - 7);
        return { inicio, fim: hoje };
      }
      if (state.filtroAtivo === "quinzena") {
        inicio.setDate(inicio.getDate() - 15);
        return { inicio, fim: hoje };
      }
      if (state.filtroAtivo === "mes") {
        inicio.setDate(inicio.getDate() - 30);
        return { inicio, fim: hoje };
      }
      if (state.filtroAtivo === "personalizado") {
        const ini = parseDataBR(state.dataInicio);
        const fim = parseDataBR(state.dataFim);
        if (ini && fim) {
          ini.setHours(0, 0, 0, 0);
          fim.setHours(23, 59, 59, 999);
          return { inicio: ini, fim };
        }
        return null;
      }
      return { inicio, fim: hoje };
    }

    function relatoriosFiltrados() {
      const intervalo = getIntervalo();
      if (!intervalo) return [];
      return state.relatorios
        .filter((r) => {
          const dataReg = dateFromRegistro(r);
          return dataReg && dataReg >= intervalo.inicio && dataReg <= intervalo.fim;
        })
        .sort((a, b) => {
          const da = dateFromRegistro(a);
          const db = dateFromRegistro(b);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return db - da;
        });
    }

    function totalRecebido(lista) {
      return lista.reduce((acc, item) => acc + valorNumber(item.valorCobrado), 0);
    }

    function bindEvents(lista) {
      root.querySelector("#tr-container").addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "filtro") {
          state.filtroAtivo = actionEl.dataset.value;
          render();
        }
      });

      const inicioInput = root.querySelector("#tr-data-inicio");
      if (inicioInput) {
        inicioInput.addEventListener("input", function () {
          state.dataInicio = inicioInput.value;
        });
      }

      const fimInput = root.querySelector("#tr-data-fim");
      if (fimInput) {
        fimInput.addEventListener("input", function () {
          state.dataFim = fimInput.value;
        });
      }
    }

    function render() {
      const lista = relatoriosFiltrados();
      const total = totalRecebido(lista);

      root.innerHTML = `
        <section class="pa-screen">
          <div class="pa-fundos" id="tr-fundos"></div>
          <div class="pa-scroll" id="tr-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Relatório Financeiro</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
              ${FILTROS.map(
                (filtro) => `
                  <button
                    class="ap-chip${state.filtroAtivo === filtro.key ? " is-active" : ""}"
                    data-action="filtro"
                    data-value="${filtro.key}"
                    type="button"
                  >
                    ${filtro.label}
                  </button>
                `
              ).join("")}
            </div>

            ${
              state.filtroAtivo === "personalizado"
                ? `
                  <article class="ch-card" style="margin-bottom:16px">
                    <p class="ch-sub">Informe o período desejado</p>
                    <div style="display:flex;gap:10px;margin-top:10px">
                      <div style="flex:1">
                        <label class="ch-input-label">Data início</label>
                        <div class="ch-input-wrap">
                          <span class="ch-input-icon">📅</span>
                          <input id="tr-data-inicio" class="ch-input" value="${escapeHtml(
                            state.dataInicio
                          )}" placeholder="dd/mm/aaaa" maxlength="10" />
                        </div>
                      </div>
                      <div style="flex:1">
                        <label class="ch-input-label">Data fim</label>
                        <div class="ch-input-wrap">
                          <span class="ch-input-icon">📅</span>
                          <input id="tr-data-fim" class="ch-input" value="${escapeHtml(
                            state.dataFim
                          )}" placeholder="dd/mm/aaaa" maxlength="10" />
                        </div>
                      </div>
                    </div>
                  </article>
                `
                : ""
            }

            <article style="background:rgba(39,174,96,0.1);border:1.5px solid rgba(39,174,96,0.4);border-radius:16px;padding:20px;margin-bottom:16px;text-align:center">
              <p style="color:rgba(180,220,255,0.6);font-size:13px;margin-bottom:6px">Total recebido no período</p>
              <p style="color:#27ae60;font-size:32px;font-weight:700">R$ ${formatarValor(total)}</p>
              <p style="color:rgba(180,220,255,0.5);font-size:12px;margin-top:6px">
                ${lista.length} atendimento${lista.length !== 1 ? "s" : ""} concluído${lista.length !== 1 ? "s" : ""}
              </p>
            </article>

            <h2 class="ch-title" style="margin-bottom:12px">Atendimentos</h2>

            ${
              state.carregando
                ? `
                  <div class="tp-loading">
                    <div class="ch-spinner"></div>
                  </div>
                `
                : lista.length === 0
                  ? `
                    <div class="pa-empty">
                      <p class="pa-empty-icon">📊</p>
                      <p class="pa-empty-title" style="color:#fff;font-weight:700">Nenhum registro</p>
                      <p class="pa-empty-title">Não há atendimentos concluídos neste período.</p>
                    </div>
                  `
                  : lista
                      .map((reg) => {
                        const cor = CORES_PAGAMENTO[reg.formaPagamento] || "#7f8c8d";
                        const numero = reg.numeroChamado || reg.numero || "-";
                        const cliente = reg.cliente || "-";
                        const dataServico = reg.dataServico || reg.dataFormatada || "-";
                        const dataConclusao = reg.dataConclusao || (reg.dataConclusaoISO ? new Date(reg.dataConclusaoISO).toLocaleDateString("pt-BR") : "-");
                        const tipos = Array.isArray(reg.tipos) ? reg.tipos : reg.tipo ? [reg.tipo] : [];

                        return `
                          <article style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:10px">
                            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px">
                              <div style="flex:1">
                                <p style="color:#38b6ff;font-size:13px;font-weight:700">${escapeHtml(numero)}</p>
                                <p style="color:#fff;font-size:14px;font-weight:600;margin-top:2px">${escapeHtml(cliente)}</p>
                              </div>
                              <span style="background:${cor}22;border:1px solid ${cor}44;color:${cor};border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700">
                                ${escapeHtml(reg.formaPagamento || "Pagamento")}
                              </span>
                            </div>

                            <div style="display:grid;gap:5px">
                              <div style="display:flex;align-items:center;gap:6px"><span>📅</span><span style="color:rgba(180,220,255,0.6);font-size:12px">Serviço: ${escapeHtml(dataServico)}${reg.horario ? ` às ${escapeHtml(reg.horario)}` : ""}</span></div>
                              <div style="display:flex;align-items:center;gap:6px"><span>✅</span><span style="color:rgba(180,220,255,0.6);font-size:12px">Concluído: ${escapeHtml(dataConclusao)}${reg.horaConclusao ? ` às ${escapeHtml(reg.horaConclusao)}` : ""}</span></div>
                              ${reg.tempoAtendimento ? `<div style="display:flex;align-items:center;gap:6px"><span>⏱️</span><span style="color:rgba(180,220,255,0.6);font-size:12px">Tempo: ${escapeHtml(reg.tempoAtendimento)}</span></div>` : ""}
                              ${reg.tecnico ? `<div style="display:flex;align-items:center;gap:6px"><span>👷</span><span style="color:rgba(180,220,255,0.6);font-size:12px">Técnico: ${escapeHtml(reg.tecnico)}</span></div>` : ""}
                              ${tipos.length ? `<div style="display:flex;align-items:center;gap:6px"><span>🔧</span><span style="color:rgba(180,220,255,0.6);font-size:12px">${escapeHtml(tipos.join(", "))}</span></div>` : ""}
                              ${reg.urgencia === "Urgente" ? '<div style="display:flex;align-items:center;gap:6px"><span>🚨</span><span style="color:#e74c3c;font-size:12px;font-weight:700">Atendimento urgente</span></div>' : ""}
                              ${reg.geradoDeOrcamento ? `<div style="display:flex;align-items:center;gap:6px"><span>🔗</span><span style="color:#8e44ad;font-size:12px">Orçamento: ${escapeHtml(reg.geradoDeOrcamento)}</span></div>` : ""}
                            </div>

                            <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;background:rgba(39,174,96,0.08);border:1px solid rgba(39,174,96,0.2);border-radius:8px;padding:10px">
                              <span style="color:rgba(180,220,255,0.6);font-size:13px">Valor cobrado</span>
                              <strong style="color:#27ae60;font-size:16px">R$ ${escapeHtml(String(reg.valorCobrado || "0,00"))}</strong>
                            </div>
                          </article>
                        `;
                      })
                      .join("")
            }

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#tr-fundos"), "pa");
      bindEvents(lista);
    }

    render();
    state.unsubscribe = ouvirRelatoriosSafe(function (lista) {
      state.relatorios = lista;
      state.carregando = false;
      render();
    });

    return function cleanupRelatorio() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.relatorio = renderTelaRelatorio;
})();
