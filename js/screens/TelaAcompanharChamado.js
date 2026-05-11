// js/screens/TelaAcompanharChamado.js

(function () {
  const STATUS_CONFIG = {
    "Aguardando técnico": { icone: "⏳", cor: "#f39c12", label: "Aguardando técnico" },
    Aceito: { icone: "✅", cor: "#27ae60", label: "Aceito pelo técnico" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9", label: "Em atendimento" },
    Concluído: { icone: "🏁", cor: "#8e44ad", label: "Concluído" },
    Cancelado: { icone: "❌", cor: "#e74c3c", label: "Cancelado" },
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

  function normalizarFotoUri(foto) {
    if (!foto) return "";
    let valor = foto;
    if (typeof foto === "object") {
      valor = foto.uri || foto.url || foto.src || "";
    }
    if (typeof valor !== "string") return "";
    const uri = valor.trim();
    if (!uri) return "";
    if (
      uri.startsWith("data:image/") ||
      uri.startsWith("blob:") ||
      uri.startsWith("http://") ||
      uri.startsWith("https://")
    ) {
      return uri;
    }
    if (/^[A-Za-z0-9+/=]+$/.test(uri) && uri.length > 120) {
      return `data:image/jpeg;base64,${uri}`;
    }
    return "";
  }

  function getChamadosLocais(email) {
    try {
      const raw = localStorage.getItem("@chamados");
      const lista = raw ? JSON.parse(raw) : [];
      return lista.filter((item) => item.clienteEmail === email);
    } catch (error) {
      return [];
    }
  }

  function renderTelaAcompanharChamado(root, props) {
    const state = {
      chamados: [],
      carregando: true,
      abaSelecionada: "ativos",
      fotoExpandida: null,
      fotosModal: null,
      unsubscribe: null,
    };

    const usuarioLogado = props && props.usuarioLogado ? props.usuarioLogado : null;

    function chamadosFiltrados() {
      if (state.abaSelecionada === "ativos") {
        return state.chamados.filter(
          (c) => c.status === "Aguardando técnico" || c.status === "Aceito" || c.status === "Em atendimento"
        );
      }
      return state.chamados.filter((c) => c.status === "Concluído" || c.status === "Cancelado");
    }

    function statusHtml(status) {
      const info = STATUS_CONFIG[status] || STATUS_CONFIG["Aguardando técnico"];
      return `
        <span class="ac-status" style="background:${info.cor}22;color:${info.cor}">
          <span>${info.icone}</span>
          <span>${escapeHtml(info.label)}</span>
        </span>
      `;
    }

    function renderCard(chamado, index) {
      const deOrcamento = !!chamado.geradoDeOrcamento;
      const abertoPeloSuporte = chamado.criadoPorAdmin === true;
      const fotos = Array.isArray(chamado.fotos) ? chamado.fotos.map(normalizarFotoUri).filter(Boolean) : [];
      const temFotos = fotos.length > 0;

      return `
        <article class="ac-call-card${deOrcamento ? " is-from-orc" : ""}${abertoPeloSuporte ? " is-from-admin" : ""}">
          ${abertoPeloSuporte ? `
            <div class="ac-banner">
              <span>❄</span>
              <span class="ac-banner-text">Suporte ❄ — Aberto pela equipe Klenio Refrigeração</span>
            </div>
          ` : ""}

          ${deOrcamento ? `
            <div class="ac-banner is-orc">
              <span>🔗</span>
              <span class="ac-banner-text">Gerado do orçamento aprovado ${escapeHtml(chamado.geradoDeOrcamento || "")}</span>
            </div>
          ` : ""}

          <div class="ac-head">
            <p class="ac-numero">${escapeHtml(chamado.numero)}</p>
            ${statusHtml(chamado.status)}
          </div>

          <div class="ac-info-list">
            <div class="ac-info-row">
              <span>📅</span>
              <span class="ac-info-text">${escapeHtml(chamado.dataFormatada)} • ${escapeHtml(chamado.horario)}</span>
            </div>
            <div class="ac-info-row">
              <span>📍</span>
              <span class="ac-info-text">${escapeHtml(chamado.endereco)}</span>
            </div>

            <div class="ac-tags">
              ${(chamado.tipos || []).map((tipo) => `<span class="ac-tag">${escapeHtml(tipo)}</span>`).join("")}
            </div>

            ${chamado.dataCriacao ? `
              <div class="ac-info-row ac-data-criacao">
                <span>🗓️</span>
                <span class="ac-info-text">Aberto em ${escapeHtml(chamado.dataCriacao)}</span>
              </div>
            ` : ""}

            ${chamado.tecnico ? `
              <div class="ac-info-row">
                <span>👷</span>
                <span class="ac-info-text">Técnico: ${escapeHtml(chamado.tecnico)}</span>
              </div>
            ` : ""}

            ${temFotos ? `
              <div class="ac-fotos-wrap">
                <p class="ac-fotos-label">📷 ${fotos.length} foto${fotos.length > 1 ? "s" : ""} enviada${fotos.length > 1 ? "s" : ""}</p>
                <div class="ac-fotos-row">
                  ${fotos.map((uri, fotoIndex) => `
                    <button
                      class="ac-foto-item"
                      type="button"
                      data-action="expandir-foto"
                      data-call="${index}"
                      data-foto="${fotoIndex}"
                    >
                      <img class="ac-foto-thumb" src="${uri}" alt="Foto ${fotoIndex + 1}" />
                      <span class="ac-foto-zoom">🔍</span>
                    </button>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            ${chamado.status === "Concluído" && chamado.valorCobrado ? `
              <div class="ac-pay">
                <div class="ac-pay-row">
                  <span class="ac-pay-label">Valor cobrado</span>
                  <span class="ac-pay-value is-price">R$ ${escapeHtml(chamado.valorCobrado)}</span>
                </div>
                <div class="ac-pay-row">
                  <span class="ac-pay-label">Forma de pagamento</span>
                  <span class="ac-pay-value">${escapeHtml(chamado.formaPagamento)}</span>
                </div>
              </div>
            ` : ""}
          </div>

          <button class="ac-ver-detalhes" data-action="detalhes" data-call="${index}" type="button">Ver detalhes →</button>
        </article>
      `;
    }

    function renderModal() {
      if (!state.fotoExpandida) return "";
      return `
        <div class="ch-modal" id="ac-modal-foto">
          <img class="ch-modal-img" src="${state.fotoExpandida}" alt="Foto ampliada" />
          ${state.fotosModal && state.fotosModal.length > 1 ? `
            <div class="ch-modal-thumbs">
              ${state.fotosModal.map((uri, i) => `
                <img
                  src="${uri}"
                  class="ch-modal-thumb${state.fotoExpandida === uri ? " is-selected" : ""}"
                  data-action="modal-thumb"
                  data-index="${i}"
                  alt="Miniatura ${i + 1}"
                />
              `).join("")}
            </div>
          ` : ""}
          <p class="ch-modal-close">Toque para fechar</p>
        </div>
      `;
    }

    function bindEvents(listaFiltrada) {
      root.querySelector("#ac-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("principal");
      });

      root.querySelector("#ac-aba-ativos").addEventListener("click", function () {
        state.abaSelecionada = "ativos";
        render();
      });
      root.querySelector("#ac-aba-historico").addEventListener("click", function () {
        state.abaSelecionada = "historico";
        render();
      });

      const abrir = root.querySelector("#ac-abrir-chamado");
      if (abrir) {
        abrir.addEventListener("click", function () {
          if (props && typeof props.setTela === "function") props.setTela("abrirChamado");
        });
      }

      root.querySelector("#ac-container").addEventListener("click", function (event) {
        const target = event.target.closest("[data-action]");
        if (!target) return;
        const action = target.dataset.action;
        if (!action) return;

        if (action === "detalhes") {
          const chamado = listaFiltrada[Number(target.dataset.call)];
          if (!chamado) return;
          if (props && typeof props.setChamadoClienteSelecionado === "function") {
            props.setChamadoClienteSelecionado(chamado);
          }
          if (props && typeof props.setTela === "function") props.setTela("detalheChamadoCliente");
          return;
        }

        if (action === "expandir-foto") {
          const chamado = listaFiltrada[Number(target.dataset.call)];
          if (!chamado || !Array.isArray(chamado.fotos)) return;
          const fotos = chamado.fotos.map(normalizarFotoUri).filter(Boolean);
          const uri = fotos[Number(target.dataset.foto)];
          state.fotosModal = fotos;
          state.fotoExpandida = uri;
          render();
          return;
        }

        if (action === "modal-thumb") {
          const index = Number(target.dataset.index);
          if (!state.fotosModal || !state.fotosModal[index]) return;
          state.fotoExpandida = state.fotosModal[index];
          render();
          return;
        }
      });

      const modal = root.querySelector("#ac-modal-foto");
      if (modal) {
        modal.addEventListener("click", function () {
          state.fotoExpandida = null;
          state.fotosModal = null;
          render();
        });
      }
    }

    function render() {
      const lista = chamadosFiltrados();
      root.innerHTML = `
        <section class="ac-screen">
          <div class="ac-fundos" id="ac-fundos"></div>
          <div class="ac-scroll" id="ac-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Meus Chamados</h1>
              </div>
              <button class="ch-voltar" id="ac-voltar" type="button">← Voltar</button>
            </header>

            <div class="ac-abas">
              <button class="ac-aba-btn${state.abaSelecionada === "ativos" ? " is-active" : ""}" id="ac-aba-ativos" type="button">Em andamento</button>
              <button class="ac-aba-btn${state.abaSelecionada === "historico" ? " is-active" : ""}" id="ac-aba-historico" type="button">Histórico</button>
            </div>

            ${state.carregando ? `
              <div class="ac-loading">
                <div class="ch-spinner"></div>
                <p class="ac-muted">Carregando chamados...</p>
              </div>
            ` : lista.length === 0 ? `
              <div class="ac-empty">
                <p class="ac-empty-icon">❄</p>
                <p class="ac-empty-title">Nenhum chamado</p>
                <p class="ac-empty-sub">
                  ${state.abaSelecionada === "ativos"
                    ? "Você não possui chamados em andamento."
                    : "Você não possui chamados no histórico."}
                </p>
                ${state.abaSelecionada === "ativos"
                  ? '<button class="ch-btn-main ac-empty-btn" id="ac-abrir-chamado" type="button">🔧 Abrir Chamado</button>'
                  : ""}
              </div>
            ` : `
              ${lista.map((item, index) => renderCard(item, index)).join("")}
            `}

            <div style="height:20px"></div>
          </div>

          ${renderModal()}
        </section>
      `;

      const fundos = root.querySelector("#ac-fundos");
      criarFlocosFundo(fundos, "ac");
      bindEvents(lista);
    }

    function iniciar() {
      if (!usuarioLogado || !usuarioLogado.email) {
        state.carregando = false;
        render();
        return;
      }

      if (typeof window.ouvirChamadosCliente === "function") {
        const unsub = window.ouvirChamadosCliente(usuarioLogado.email, function (lista) {
          state.chamados = lista || [];
          state.carregando = false;
          render();
        });
        if (typeof unsub === "function") state.unsubscribe = unsub;
        return;
      }

      state.chamados = getChamadosLocais(usuarioLogado.email);
      state.carregando = false;
      render();
    }

    render();
    iniciar();

    return function cleanupAcompanhar() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.acompanharChamado = renderTelaAcompanharChamado;
})();
