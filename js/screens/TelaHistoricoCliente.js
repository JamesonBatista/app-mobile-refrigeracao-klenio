// js/screens/TelaHistoricoCliente.js

(function () {
  const STATUS_CHAMADO = {
    "Aguardando técnico": { icone: "⏳", cor: "#f39c12" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
  };

  const STATUS_ORCAMENTO = {
    "Aguardando análise": { icone: "⏳", cor: "#f39c12" },
    "Em análise": { icone: "🔍", cor: "#2980b9" },
    "Orçamento enviado": { icone: "💰", cor: "#8e44ad" },
    Aprovado: { icone: "✅", cor: "#27ae60" },
    Recusado: { icone: "❌", cor: "#e74c3c" },
    Cancelado: { icone: "🚫", cor: "#7f8c8d" },
  };

  const STATUS_PROGRAMADO = {
    Agendado: { icone: "📅", cor: "#f39c12" },
    Contestado: { icone: "⚠️", cor: "#e67e22" },
    Respondido: { icone: "💬", cor: "#2980b9" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
  };

  const TIPO_CONFIG = {
    chamado: { label: "Chamado", icone: "🔧", cor: "#2980b9", bg: "rgba(41,128,185,0.12)" },
    orcamento: { label: "Orçamento", icone: "💰", cor: "#8e44ad", bg: "rgba(142,68,173,0.12)" },
    programado: { label: "Programado", icone: "🛠️", cor: "#38b6ff", bg: "rgba(56,182,255,0.1)" },
  };

  const FILTROS = [
    { key: "todos", label: "Todos" },
    { key: "chamado", label: "Chamados" },
    { key: "orcamento", label: "Orçamentos" },
    { key: "programado", label: "Programados" },
  ];

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

  function getStatusConfig(tipo, status) {
    if (tipo === "chamado") return STATUS_CHAMADO[status] || { icone: "📌", cor: "#7f8c8d" };
    if (tipo === "orcamento") return STATUS_ORCAMENTO[status] || { icone: "📌", cor: "#7f8c8d" };
    if (tipo === "programado") return STATUS_PROGRAMADO[status] || { icone: "📌", cor: "#7f8c8d" };
    return { icone: "📌", cor: "#7f8c8d" };
  }

  function storageKey(email) {
    return `@historico_${email || "anonimo"}`;
  }

  async function salvarItemHistoricoLocal(email, item) {
    try {
      if (!email) return;
      const chave = storageKey(email);
      const raw = localStorage.getItem(chave);
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex(function (entry) {
        return entry.numero === item.numero && entry.tipo === item.tipo;
      });
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...item, atualizadoEm: new Date().toISOString() };
      } else {
        lista.unshift({ ...item, salvoEm: new Date().toISOString() });
      }
      localStorage.setItem(chave, JSON.stringify(lista.slice(0, 200)));
    } catch (error) {
      console.log("Erro salvarItemHistoricoLocal:", error);
    }
  }

  function renderCardItem(item) {
    const tipoConf = TIPO_CONFIG[item.tipo] || TIPO_CONFIG.chamado;
    const statusConf = getStatusConfig(item.tipo, item.status);
    const tipoServicoTexto =
      item.tipoServico ||
      (Array.isArray(item.tipos) ? item.tipos.join(", ") : item.tipos || "");

    return `
      <article class="hc-card" style="border-color:${statusConf.cor}33">
        <div class="hc-card-head">
          <div class="hc-card-head-left">
            <span class="hc-chip-tipo" style="background:${tipoConf.bg};border-color:${tipoConf.cor}33;color:${tipoConf.cor}">
              ${tipoConf.icone} ${tipoConf.label}
            </span>
            <span class="hc-numero" style="color:${tipoConf.cor}">${escapeHtml(item.numero || "-")}</span>
          </div>
          <span class="hc-chip-status" style="background:${statusConf.cor}18;color:${statusConf.cor}">
            <span>${statusConf.icone}</span>
            <span>${escapeHtml(item.status || "-")}</span>
          </span>
        </div>

        <div class="hc-info-list">
          ${
            item.tipo === "orcamento"
              ? `
                ${
                  item.tipoServico
                    ? `<div class="hc-row"><span>🔧</span><span>${escapeHtml(item.tipoServico)}</span></div>`
                    : ""
                }
                ${
                  item.tipoAparelho
                    ? `<div class="hc-row hc-muted"><span>❄</span><span>${escapeHtml(item.tipoAparelho)} • ${escapeHtml(item.btu || "")}</span></div>`
                    : ""
                }
                ${
                  item.valorOrcamento
                    ? `<div class="hc-row hc-price"><span>💰</span><span>R$ ${escapeHtml(item.valorOrcamento)}</span></div>`
                    : ""
                }
              `
              : `
                ${
                  tipoServicoTexto
                    ? `<div class="hc-row"><span>🔧</span><span>${escapeHtml(tipoServicoTexto)}</span></div>`
                    : ""
                }
                ${
                  item.dataFormatada
                    ? `<div class="hc-row hc-muted"><span>📅</span><span>${escapeHtml(item.dataFormatada)}${item.horario ? ` • ${escapeHtml(item.horario)}` : ""}</span></div>`
                    : ""
                }
              `
          }

          ${
            item.endereco
              ? `<div class="hc-row hc-muted"><span>📍</span><span>${escapeHtml(item.endereco)}</span></div>`
              : ""
          }
          ${
            item.tecnico
              ? `<div class="hc-row hc-muted"><span>👷</span><span>Técnico: ${escapeHtml(item.tecnico)}</span></div>`
              : ""
          }
          ${
            item.valorCobrado
              ? `<div class="hc-row hc-success"><span>💵</span><span>R$ ${escapeHtml(item.valorCobrado)} • ${escapeHtml(item.formaPagamento || "")}</span></div>`
              : ""
          }
          ${
            item.tempoAtendimento
              ? `<div class="hc-row hc-success"><span>⏱️</span><span>${escapeHtml(item.tempoAtendimento)}</span></div>`
              : ""
          }
          ${
            item.dataCriacao
              ? `<div class="hc-row hc-footer"><span>🗓️</span><span>Aberto em ${escapeHtml(item.dataCriacao)}</span></div>`
              : ""
          }
        </div>
      </article>
    `;
  }

  function renderTelaHistoricoCliente(root, props) {
    const usuarioLogado = props && props.usuarioLogado ? props.usuarioLogado : null;
    const state = {
      itens: [],
      carregando: true,
      filtro: "todos",
      unsubscribe: null,
    };

    async function carregarHistorico() {
      try {
        const email = usuarioLogado && usuarioLogado.email;
        if (typeof window.carregarHistoricoChamados === "function" && email) {
          const listaRemota = await window.carregarHistoricoChamados(email, { forceServer: true });
          state.itens = Array.isArray(listaRemota) ? listaRemota : [];
        } else {
          const chave = storageKey(email);
          const raw = localStorage.getItem(chave);
          const lista = raw ? JSON.parse(raw) : [];
          lista.sort(function (a, b) {
            return new Date(b.salvoEm || 0) - new Date(a.salvoEm || 0);
          });
          state.itens = lista;
        }
      } catch (error) {
        console.log("Erro carregarHistorico:", error);
      }
      state.carregando = false;
      render();
    }

    function itensFiltrados() {
      if (state.filtro === "todos") return state.itens;
      return state.itens.filter(function (item) {
        return item.tipo === state.filtro;
      });
    }

    function getCountByFiltro(chave) {
      if (chave === "todos") return state.itens.length;
      return state.itens.filter(function (item) {
        return item.tipo === chave;
      }).length;
    }

    function bindEvents() {
      const btnVoltar = root.querySelector("#hc-voltar");
      if (btnVoltar) {
        btnVoltar.addEventListener("click", function () {
          if (props && typeof props.setTela === "function") props.setTela("principal");
        });
      }

      root.querySelector("#hc-container").addEventListener("click", function (event) {
        const btnFiltro = event.target.closest("button[data-filtro]");
        if (!btnFiltro) return;
        const novoFiltro = btnFiltro.dataset.filtro;
        if (!novoFiltro) return;
        state.filtro = novoFiltro;
        render();
      });
    }

    function render() {
      const lista = itensFiltrados();
      root.innerHTML = `
        <section class="hc-screen">
          <div class="hc-fundos" id="hc-fundos"></div>
          <div class="hc-scroll" id="hc-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Meu Histórico</h1>
              </div>
              <button class="ch-voltar" id="hc-voltar" type="button">← Voltar</button>
            </header>

            <article class="hc-info-box">
              <span class="hc-info-emoji">📱</span>
              <p>Histórico sincronizado automaticamente com o servidor.</p>
            </article>

            <div class="hc-filtros">
              ${FILTROS.map(function (filtro) {
                const ativo = state.filtro === filtro.key;
                const count = getCountByFiltro(filtro.key);
                return `
                  <button class="hc-filtro-btn${ativo ? " is-active" : ""}" data-filtro="${filtro.key}" type="button">
                    <span>${filtro.label}</span>
                    ${
                      count > 0
                        ? `<span class="hc-filtro-count">${count}</span>`
                        : ""
                    }
                  </button>
                `;
              }).join("")}
            </div>

            ${
              state.carregando
                ? `
                  <div class="hc-loading">
                    <div class="ch-spinner"></div>
                  </div>
                `
                : lista.length === 0
                  ? `
                    <div class="hc-empty">
                      <p class="hc-empty-icon">📋</p>
                      <p class="hc-empty-title">Nenhum histórico</p>
                      <p class="hc-empty-sub">
                        Seu histórico será salvo automaticamente conforme você utiliza o app.
                      </p>
                    </div>
                  `
                  : lista.map(renderCardItem).join("")
            }

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#hc-fundos"), "hc");
      bindEvents();
    }

    render();
    carregarHistorico();

    if (typeof window.ouvirHistoricoChamados === "function" && usuarioLogado && usuarioLogado.email) {
      state.unsubscribe = window.ouvirHistoricoChamados(
        function (lista) {
          state.itens = Array.isArray(lista) ? lista : [];
          state.carregando = false;
          render();
        },
        { emailCliente: usuarioLogado.email }
      );
    }

    return function cleanupHistoricoCliente() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.salvarItemHistoricoLocal = salvarItemHistoricoLocal;
  window.Telas = window.Telas || {};
  window.Telas.historicoCliente = renderTelaHistoricoCliente;
})();
