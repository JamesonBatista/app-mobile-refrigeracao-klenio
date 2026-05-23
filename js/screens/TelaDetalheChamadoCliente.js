// js/screens/TelaDetalheChamadoCliente.js

(function () {
  const STATUS_CONFIG = {
    "Aguardando técnico": { icone: "⏳", cor: "#f39c12" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
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

  function atualizarChamadoLocal(numero, updates) {
    try {
      const raw = localStorage.getItem("@chamados");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...updates };
        localStorage.setItem("@chamados", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  function renderTelaDetalheChamadoCliente(root, props) {
    const state = {
      chamado:
        props && props.chamadoClienteSelecionado
          ? props.chamadoClienteSelecionado
          : null,
      cancelando: false,
      unsubscribe: null,
    };

    function renderEmpty() {
      root.innerHTML = `
        <section class="dc-screen">
          <div class="dc-fundos" id="dc-fundos"></div>
          <div class="dc-scroll">
            <div class="dc-empty">
              <p>❄</p>
              <h2>Nenhum chamado selecionado</h2>
              <p>Volte para a lista e selecione um chamado.</p>
              <button class="ch-btn-main" id="dc-voltar-lista" type="button">Voltar</button>
            </div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#dc-fundos"), "dc");
      root.querySelector("#dc-voltar-lista").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
      });
    }

    function statusInfo() {
      return STATUS_CONFIG[state.chamado.status] || STATUS_CONFIG["Aguardando técnico"];
    }

    function bindEvents() {
      root.querySelector("#dc-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
      });

      const cancelBtn = root.querySelector("#dc-cancelar");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", async function () {
          const ok = await window.showAppConfirm("Tem certeza que deseja cancelar este chamado?");
          if (!ok) return;

          state.cancelando = true;
          render();

          try {
            if (typeof window.atualizarChamado === "function") {
              await window.atualizarChamado(state.chamado.numero, { status: "Cancelado" });
            } else {
              atualizarChamadoLocal(state.chamado.numero, { status: "Cancelado" });
            }

            state.cancelando = false;
            state.chamado = { ...state.chamado, status: "Cancelado" };
            render();
            window.showAppAlert("Chamado cancelado!");
            if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
          } catch (error) {
            state.cancelando = false;
            render();
            window.showAppAlert("Erro ao cancelar chamado.");
          }
        });
      }
    }

    function render() {
      if (!state.chamado) {
        renderEmpty();
        return;
      }

      const status = statusInfo();
      const podeCancelar = state.chamado.status === "Aguardando técnico";
      root.innerHTML = `
        <section class="dc-screen">
          <div class="dc-fundos" id="dc-fundos"></div>
          <div class="dc-scroll">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Detalhes do Chamado</h1>
              </div>
              <button class="ch-voltar" id="dc-voltar" type="button">← Voltar</button>
            </header>

            ${state.chamado.criadoPorAdmin ? `
              <div class="dc-banner">
                <span style="font-size:20px">❄</span>
                <span class="dc-banner-title">Suporte ❄ — Aberto pela equipe Klenio Refrigeração</span>
              </div>
            ` : ""}

            ${state.chamado.geradoDeOrcamento ? `
              <div class="dc-banner is-orc">
                <span style="font-size:20px">🔗</span>
                <span>
                  <span class="dc-banner-title">Gerado do orçamento aprovado</span><br />
                  <span class="dc-banner-sub">${escapeHtml(state.chamado.geradoDeOrcamento)}</span>
                </span>
              </div>
            ` : ""}

            <article class="ch-card dc-status-card" style="border-color:${status.cor}">
              <span class="dc-status-emoji">${status.icone}</span>
              <span>
                <span class="dc-status-label">Status atual</span><br />
                <span class="dc-status-value" style="color:${status.cor}">${escapeHtml(state.chamado.status)}</span>
              </span>
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Informações do chamado</h2>
              <div class="dc-info-list">
                <div class="dc-row">
                  <span class="dc-row-label">Número</span>
                  <span class="dc-row-value is-primary">${escapeHtml(state.chamado.numero)}</span>
                </div>
                <div class="dc-row">
                  <span class="dc-row-label">Data</span>
                  <span class="dc-row-value">${escapeHtml(state.chamado.dataFormatada)}</span>
                </div>
                <div class="dc-row">
                  <span class="dc-row-label">Horário</span>
                  <span class="dc-row-value">${escapeHtml(state.chamado.horario)}</span>
                </div>
                <div class="dc-row">
                  <span class="dc-row-label">Endereço</span>
                  <span class="dc-row-value">${escapeHtml(state.chamado.endereco)}</span>
                </div>

                <div>
                  <p class="dc-tags-title">Problemas</p>
                  <div class="dc-tags">
                    ${(state.chamado.tipos || []).map((tipo) => `<span class="dc-tag">${escapeHtml(tipo)}</span>`).join("")}
                  </div>
                </div>

                ${state.chamado.detalhes ? `
                  <div>
                    <p class="dc-box-title">Detalhes</p>
                    <div class="dc-box"><p>${escapeHtml(state.chamado.detalhes)}</p></div>
                  </div>
                ` : ""}

                ${state.chamado.tecnico ? `
                  <div class="dc-row">
                    <span class="dc-row-label">Técnico</span>
                    <span class="dc-row-value">👷 ${escapeHtml(state.chamado.tecnico)}</span>
                  </div>
                ` : ""}

                ${state.chamado.observacaoTecnica ? `
                  <div>
                    <p class="dc-box-title">Observação técnica</p>
                    <div class="dc-box"><p>${escapeHtml(state.chamado.observacaoTecnica)}</p></div>
                  </div>
                ` : ""}
              </div>
            </article>

            ${state.chamado.status === "Concluído" && state.chamado.valorCobrado ? `
              <article class="ch-card">
                <h2 class="ch-title">💰 Pagamento</h2>
                <div class="dc-info-list">
                  <div class="dc-row">
                    <span class="dc-row-label">Valor cobrado</span>
                    <span class="dc-pay-valor">R$ ${escapeHtml(state.chamado.valorCobrado)}</span>
                  </div>
                  <div class="dc-row">
                    <span class="dc-row-label">Forma de pagamento</span>
                    <span class="dc-row-value">${escapeHtml(state.chamado.formaPagamento)}</span>
                  </div>
                </div>
              </article>
            ` : ""}

            ${state.chamado.geradoDeOrcamento && state.chamado.valorOrcamento ? `
              <article class="ch-card">
                <h2 class="ch-title">🔗 Dados do orçamento aprovado</h2>
                <div class="dc-info-list">
                  ${state.chamado.tipoServico ? `
                    <div class="dc-row">
                      <span class="dc-row-label">Serviço</span>
                      <span class="dc-row-value">${escapeHtml(state.chamado.tipoServico)}</span>
                    </div>
                  ` : ""}
                  ${state.chamado.tipoAparelho ? `
                    <div class="dc-row">
                      <span class="dc-row-label">Aparelho</span>
                      <span class="dc-row-value">${escapeHtml(state.chamado.tipoAparelho)} • ${escapeHtml(state.chamado.btu)} BTUs</span>
                    </div>
                  ` : ""}
                  <div class="dc-row">
                    <span class="dc-row-label">Valor orçado</span>
                    <span class="ac-pay-value is-price">R$ ${escapeHtml(state.chamado.valorOrcamento)}</span>
                  </div>
                </div>
              </article>
            ` : ""}

            ${podeCancelar ? `
              <button class="dc-cancel-btn" id="dc-cancelar" type="button" ${state.cancelando ? "disabled" : ""}>
                ${state.cancelando ? '<span class="ch-spinner"></span>' : "❌ Cancelar Chamado"}
              </button>
            ` : ""}

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#dc-fundos"), "dc");
      bindEvents();
    }

    function iniciarAssinatura() {
      if (!state.chamado || !state.chamado.numero) return;
      if (typeof window.ouvirChamado !== "function") return;
      const unsub = window.ouvirChamado(state.chamado.numero, function (atualizado) {
        state.chamado = atualizado;
        render();
      });
      if (typeof unsub === "function") state.unsubscribe = unsub;
    }

    render();
    iniciarAssinatura();

    return function cleanupDetalheChamado() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.detalheChamadoCliente = renderTelaDetalheChamadoCliente;
})();
