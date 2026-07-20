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

  function rf() {
    return window.RelatorioFinanceiro || {};
  }

  function getIntervalo(state) {
    if (typeof rf().getIntervalo === "function") {
      return rf().getIntervalo(state.filtroAtivo, {
        dataInicio: state.dataInicio,
        dataFim: state.dataFim,
      });
    }
    return null;
  }

  function formatarIntervaloLabel(intervalo) {
    if (typeof rf().formatarIntervaloBR === "function") {
      return rf().formatarIntervaloBR(intervalo);
    }
    return "";
  }

  function dateFromRegistro(reg) {
    if (typeof rf().dateFromRegistro === "function") {
      return rf().dateFromRegistro(reg);
    }
    return null;
  }

  function valorDoRegistro(reg) {
    if (typeof rf().valorDoRegistro === "function") {
      return rf().valorDoRegistro(reg);
    }
    return 0;
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

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
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
      erroPeriodo: "",
      campoFoco: null,
    };

    function relatoriosFiltrados() {
      if (typeof rf().filtrarRelatorios === "function") {
        return rf().filtrarRelatorios(state.relatorios, state.filtroAtivo, {
          dataInicio: state.dataInicio,
          dataFim: state.dataFim,
        });
      }
      return [];
    }

    function totalRecebido(lista) {
      return lista.reduce(function (acc, item) {
        return acc + valorDoRegistro(item);
      }, 0);
    }

    function bindEvents() {
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
          state.erroPeriodo = "";
          render();
        }
      });

      const inicioInput = root.querySelector("#tr-data-inicio");
      if (inicioInput) {
        inicioInput.addEventListener("input", function () {
          state.campoFoco = "inicio";
          state.dataInicio = inicioInput.value;
          atualizarPeriodoPersonalizado();
        });
      }

      const fimInput = root.querySelector("#tr-data-fim");
      if (fimInput) {
        fimInput.addEventListener("input", function () {
          state.campoFoco = "fim";
          state.dataFim = fimInput.value;
          atualizarPeriodoPersonalizado();
        });
      }
    }

    function atualizarPeriodoPersonalizado() {
      if (state.filtroAtivo !== "personalizado") return;
      const intervalo = getIntervalo(state);
      if (state.dataInicio && state.dataFim && !intervalo) {
        state.erroPeriodo = "Informe um período válido (início ≤ fim, formato dd/mm/aaaa).";
      } else {
        state.erroPeriodo = "";
      }
      render();
    }

    function render() {
      const intervalo = getIntervalo(state);
      const lista = relatoriosFiltrados();
      const total = totalRecebido(lista);
      const labelIntervalo = intervalo ? formatarIntervaloLabel(intervalo) : "";

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
                    ${
                      state.erroPeriodo
                        ? `<p style="color:#e74c3c;font-size:12px;margin-top:10px">${escapeHtml(
                            state.erroPeriodo
                          )}</p>`
                        : ""
                    }
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
              ${
                labelIntervalo
                  ? `<p style="color:rgba(180,220,255,0.7);font-size:12px;margin-top:8px">${escapeHtml(
                      labelIntervalo
                    )}</p>`
                  : ""
              }
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
                        const valorExibido = formatarValor(valorDoRegistro(reg));

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
                              <strong style="color:#27ae60;font-size:16px">R$ ${escapeHtml(valorExibido)}</strong>
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
      bindEvents();

      if (state.filtroAtivo === "personalizado" && state.campoFoco) {
        const alvo =
          state.campoFoco === "inicio"
            ? root.querySelector("#tr-data-inicio")
            : root.querySelector("#tr-data-fim");
        if (alvo) {
          const pos = alvo.value.length;
          alvo.focus();
          try {
            alvo.setSelectionRange(pos, pos);
          } catch (error) {}
        }
      }
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
