// js/screens/TelaMeusOrcamentos.js

(function () {
  const STATUS_CONFIG = {
    "Aguardando análise": { icone: "⏳", cor: "#f39c12" },
    "Em análise": { icone: "🔍", cor: "#2980b9" },
    "Orçamento enviado": { icone: "💰", cor: "#8e44ad" },
    Aprovado: { icone: "✅", cor: "#27ae60" },
    Recusado: { icone: "❌", cor: "#e74c3c" },
    Cancelado: { icone: "🚫", cor: "#7f8c8d" },
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

  function sortOrcamentos(lista) {
    const ordem = {
      "Orçamento enviado": 0,
      "Em análise": 1,
      "Aguardando análise": 2,
      Aprovado: 3,
      Recusado: 4,
      Cancelado: 5,
    };
    return [...lista].sort((a, b) => (ordem[a.status] ?? 6) - (ordem[b.status] ?? 6));
  }

  function getOrcamentosLocais(email) {
    try {
      const raw = localStorage.getItem("@orcamentos");
      const lista = raw ? JSON.parse(raw) : [];
      return sortOrcamentos(lista.filter((item) => item.clienteEmail === email));
    } catch (error) {
      return [];
    }
  }

  async function atualizarOrcamentoSafe(numero, updates) {
    if (typeof window.atualizarOrcamento === "function") {
      await window.atualizarOrcamento(numero, updates);
      return;
    }
    try {
      const raw = localStorage.getItem("@orcamentos");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...updates };
        localStorage.setItem("@orcamentos", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  function renderTelaMeusOrcamentos(root, props) {
    const usuario = props && props.usuarioLogado ? props.usuarioLogado : null;
    const state = {
      orcamentos: [],
      carregando: true,
      salvando: null,
      abaSelecionada: "ativos",
      unsubscribe: null,
      pollingId: null,
    };

    function orcamentosFiltrados() {
      if (state.abaSelecionada === "ativos") {
        return state.orcamentos.filter((o) =>
          o.status === "Aguardando análise" ||
          o.status === "Em análise" ||
          o.status === "Orçamento enviado");
      }
      return state.orcamentos.filter((o) =>
        o.status === "Aprovado" || o.status === "Recusado" || o.status === "Cancelado");
    }

    function renderCard(orcamento, index) {
      const conf = STATUS_CONFIG[orcamento.status] || STATUS_CONFIG["Aguardando análise"];
      const estaCarregando = state.salvando === orcamento.numero;
      const podeCancelar = orcamento.status === "Aguardando análise";

      return `
        <article class="om-card">
          <div class="om-head">
            <p class="om-numero">${escapeHtml(orcamento.numero)}</p>
            <span class="op-status" style="background:${conf.cor}22;color:${conf.cor}">
              <span>${conf.icone}</span>
              <span>${escapeHtml(orcamento.status)}</span>
            </span>
          </div>

          <div class="om-info-list">
            <div class="op-row">
              <span>🔧</span>
              <span class="op-row-text">${escapeHtml(orcamento.tipoServico)}</span>
            </div>
            <div class="op-row">
              <span>❄</span>
              <span class="op-row-text">${escapeHtml(orcamento.tipoAparelho)} • ${escapeHtml(orcamento.btu)} BTUs • ${escapeHtml(orcamento.quantidade)} unid.</span>
            </div>
            ${orcamento.metragem && orcamento.metragem !== "Não informado" ? `
              <div class="op-row">
                <span>📐</span>
                <span class="op-row-text">${escapeHtml(orcamento.metragem)}</span>
              </div>
            ` : ""}
            <div class="op-row">
              <span>📍</span>
              <span class="op-row-text flex">${escapeHtml(orcamento.endereco)}</span>
            </div>
            ${orcamento.detalhes ? `
              <div class="op-row">
                <span>📝</span>
                <span class="op-row-text flex">${escapeHtml(orcamento.detalhes)}</span>
              </div>
            ` : ""}
            <div class="op-row">
              <span>🗓️</span>
              <span class="op-muted">
                Criado em ${escapeHtml(orcamento.dataAbertura || orcamento.dataCriacao)}${orcamento.horaAbertura ? ` às ${escapeHtml(orcamento.horaAbertura)}` : ""}
              </span>
            </div>
          </div>

          ${orcamento.valorOrcamento ? `
            <div class="om-valor-box">
              <p class="om-valor-title">💰 Valor do orçamento</p>
              <p class="om-valor-num">R$ ${escapeHtml(orcamento.valorOrcamento)}</p>
              ${orcamento.descricaoAdmin ? `<p class="op-row-text" style="margin-top:4px">${escapeHtml(orcamento.descricaoAdmin)}</p>` : ""}
            </div>
          ` : ""}

          <div class="om-actions">
            ${orcamento.status === "Orçamento enviado" ? `
              <div class="op-action-hint">💡 Ao aprovar, você escolherá a data e horário do atendimento</div>
              <button class="op-btn approve" data-action="aprovar" data-index="${index}" type="button" ${estaCarregando ? "disabled" : ""}>
                ${estaCarregando ? '<span class="op-spinner"></span>' : "✅ Aprovar e agendar"}
              </button>
              <button class="op-btn reject" data-action="recusar" data-index="${index}" type="button" ${estaCarregando ? "disabled" : ""}>
                ❌ Recusar orçamento
              </button>
            ` : ""}

            ${podeCancelar ? `
              <button class="op-btn cancel" data-action="cancelar" data-index="${index}" type="button" ${estaCarregando ? "disabled" : ""}>
                ${estaCarregando ? '<span class="op-spinner"></span>' : "🚫 Cancelar solicitação"}
              </button>
            ` : ""}
          </div>
        </article>
      `;
    }

    async function handleAprovar(orcamento) {
      const ok = window.confirm(
        `Deseja aprovar o orçamento ${orcamento.numero} no valor de R$ ${orcamento.valorOrcamento}?\n\nVocê irá escolher a data e horário do atendimento na próxima tela.`
      );
      if (!ok) return;
      if (props && typeof props.setOrcamentoParaAprovar === "function") {
        props.setOrcamentoParaAprovar(orcamento);
      }
      if (props && typeof props.setTela === "function") props.setTela("aprovarOrcamento");
    }

    async function handleRecusar(orcamento) {
      const ok = window.confirm(`Tem certeza que deseja recusar o orçamento ${orcamento.numero}?`);
      if (!ok) return;
      state.salvando = orcamento.numero;
      render();
      await atualizarOrcamentoSafe(orcamento.numero, { status: "Recusado" });
      state.salvando = null;
      sincronizarFallback();
      render();
    }

    async function handleCancelar(orcamento) {
      const ok = window.confirm(`Tem certeza que deseja cancelar o orçamento ${orcamento.numero}?`);
      if (!ok) return;
      state.salvando = orcamento.numero;
      render();
      await atualizarOrcamentoSafe(orcamento.numero, { status: "Cancelado" });
      state.salvando = null;
      sincronizarFallback();
      render();
    }

    function bindEvents(listaFiltrada) {
      root.querySelector("#om-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("principal");
      });

      root.querySelector("#om-aba-ativos").addEventListener("click", function () {
        state.abaSelecionada = "ativos";
        render();
      });
      root.querySelector("#om-aba-historico").addEventListener("click", function () {
        state.abaSelecionada = "historico";
        render();
      });

      const btnNovo = root.querySelector("#om-novo-orcamento");
      if (btnNovo) {
        btnNovo.addEventListener("click", function () {
          if (props && typeof props.setTela === "function") props.setTela("orcamento");
        });
      }

      root.querySelector("#om-container").addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;
        const item = listaFiltrada[Number(btn.dataset.index)];
        if (!item) return;

        if (action === "aprovar") {
          handleAprovar(item);
        } else if (action === "recusar") {
          handleRecusar(item);
        } else if (action === "cancelar") {
          handleCancelar(item);
        }
      });
    }

    function render() {
      const lista = orcamentosFiltrados();
      root.innerHTML = `
        <section class="om-screen">
          <div class="om-fundos" id="om-fundos"></div>
          <div class="om-scroll" id="om-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Meus Orçamentos</h1>
              </div>
              <button class="ch-voltar" id="om-voltar" type="button">← Voltar</button>
            </header>

            <div class="op-tabs">
              <button class="op-tab-btn orc${state.abaSelecionada === "ativos" ? " is-active orc" : ""}" id="om-aba-ativos" type="button">Em andamento</button>
              <button class="op-tab-btn orc${state.abaSelecionada === "historico" ? " is-active orc" : ""}" id="om-aba-historico" type="button">Histórico</button>
            </div>

            ${state.carregando ? `
              <div class="om-loading">
                <div class="op-spinner"></div>
                <p class="op-empty-sub">Carregando orçamentos...</p>
              </div>
            ` : lista.length === 0 ? `
              <div class="op-empty">
                <p class="op-empty-icon">💰</p>
                <p class="op-empty-title">Nenhum orçamento</p>
                <p class="op-empty-sub">
                  ${state.abaSelecionada === "ativos"
                    ? "Você não possui orçamentos em andamento."
                    : "Você não possui orçamentos no histórico."}
                </p>
                ${state.abaSelecionada === "ativos"
                  ? '<button class="op-btn primary op-empty-btn" id="om-novo-orcamento" type="button">📋 Solicitar Orçamento</button>'
                  : ""}
              </div>
            ` : `
              ${lista.map((orcamento, index) => renderCard(orcamento, index)).join("")}
            `}

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#om-fundos"), "om");
      bindEvents(lista);
    }

    function sincronizarFallback() {
      if (!usuario || !usuario.email) return;
      state.orcamentos = getOrcamentosLocais(usuario.email);
    }

    function iniciar() {
      if (!usuario || !usuario.email) {
        state.carregando = false;
        render();
        return;
      }

      if (typeof window.ouvirOrcamentosCliente === "function") {
        const unsub = window.ouvirOrcamentosCliente(usuario.email, function (lista) {
          state.orcamentos = sortOrcamentos(lista || []);
          state.carregando = false;
          render();
        });
        if (typeof unsub === "function") state.unsubscribe = unsub;
        return;
      }

      sincronizarFallback();
      state.carregando = false;
      render();
      state.pollingId = setInterval(() => {
        sincronizarFallback();
        render();
      }, 2000);
    }

    render();
    iniciar();

    return function cleanupMeusOrcamentos() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
      if (state.pollingId) clearInterval(state.pollingId);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.meusOrcamentos = renderTelaMeusOrcamentos;
})();
