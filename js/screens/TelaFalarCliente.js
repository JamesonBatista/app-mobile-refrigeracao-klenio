// js/screens/TelaFalarCliente.js

(function () {
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

  function carregarClientesFallback() {
    const map = new Map();
    parseArrayStorage("@clientes").forEach((item) => {
      if (item && item.email) map.set(item.email, item);
    });
    parseArrayStorage("@chamados").forEach((item) => {
      if (item && item.clienteEmail) {
        map.set(item.clienteEmail, {
          nome: item.cliente || item.clienteEmail,
          email: item.clienteEmail,
          telefone: item.clienteTelefone || "",
          endereco: item.endereco || "",
        });
      }
    });
    parseArrayStorage("@orcamentos").forEach((item) => {
      if (item && item.clienteEmail) {
        map.set(item.clienteEmail, {
          nome: item.cliente || item.clienteEmail,
          email: item.clienteEmail,
          telefone: item.clienteTelefone || "",
          endereco: item.endereco || "",
        });
      }
    });
    parseArrayStorage("@programados").forEach((item) => {
      if (item && item.clienteEmail) {
        map.set(item.clienteEmail, {
          nome: item.cliente || item.clienteEmail,
          email: item.clienteEmail,
          telefone: item.clienteTelefone || "",
          endereco: item.endereco || "",
        });
      }
    });
    return [...map.values()].sort((a, b) => String(a.nome || "").localeCompare(String(b.nome || "")));
  }

  async function carregarClientesSafe() {
    if (typeof window.carregarClientes === "function") {
      const lista = await window.carregarClientes();
      return Array.isArray(lista) ? lista : [];
    }
    return carregarClientesFallback();
  }

  function formatarTelefoneWhatsAppSafe(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") {
      return window.formatarTelefoneWhatsApp(telefone);
    }
    if (!telefone) return null;
    const nums = String(telefone).replace(/\D/g, "");
    if (nums.length === 10 || nums.length === 11) return `55${nums}`;
    return null;
  }

  function renderTelaFalarCliente(root, props) {
    const state = {
      clientes: [],
      clienteSelecionado: null,
      busca: "",
      mostrarLista: false,
      mensagem: "",
    };

    function clientesFiltrados() {
      const termo = state.busca.toLowerCase();
      return state.clientes.filter(
        (c) =>
          String(c.nome || "").toLowerCase().includes(termo) ||
          String(c.email || "").toLowerCase().includes(termo)
      );
    }

    function atualizarPreview() {
      const preview = root.querySelector("#fc-preview-texto");
      if (!preview) return;
      const nome = state.clienteSelecionado ? state.clienteSelecionado.nome : "[Cliente]";
      const msg = state.mensagem || "[sua mensagem aqui]";
      preview.innerHTML =
        `Olá, ${escapeHtml(nome)}! 👋<br /><br />` +
        `O Suporte <strong>Klenio Refrigeração</strong> tem uma mensagem para você:<br /><br />` +
        `<span class="${state.mensagem ? "fc-preview-msg" : "fc-preview-placeholder"}">${escapeHtml(msg)}</span>` +
        `<br /><br />Klenio Refrigeração ❄`;
    }

    function handleEnviar() {
      if (!state.clienteSelecionado) {
        window.alert("Atenção ❄\nSelecione um cliente.");
        return;
      }
      if (!state.mensagem.trim()) {
        window.alert("Atenção ❄\nDigite uma mensagem.");
        return;
      }

      const numero = formatarTelefoneWhatsAppSafe(state.clienteSelecionado.telefone);
      if (!numero) {
        window.alert("Atenção ❄\nEste cliente não possui telefone cadastrado.");
        return;
      }

      const textoFinal =
        `Olá, ${state.clienteSelecionado.nome}! 👋\n\n` +
        `O Suporte *Klenio Refrigeração* tem uma mensagem para você:\n\n` +
        `${state.mensagem.trim()}\n\n` +
        `Klenio Refrigeração ❄`;

      if (typeof window.abrirLinkWhatsApp === "function") {
        window.abrirLinkWhatsApp(numero, textoFinal);
      } else {
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(textoFinal)}`, "_blank");
      }
    }

    function bindEvents() {
      const container = root.querySelector("#fc-container");
      if (!container) return;

      container.addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "clear-cliente") {
          state.clienteSelecionado = null;
          state.busca = "";
          render();
          return;
        }
        if (action === "select-cliente") {
          const email = actionEl.dataset.email;
          const cliente = state.clientes.find((c) => c.email === email);
          if (!cliente) return;
          state.clienteSelecionado = cliente;
          state.busca = cliente.nome;
          state.mostrarLista = false;
          render();
          return;
        }
        if (action === "enviar") {
          handleEnviar();
        }
      });

      const buscaInput = root.querySelector("#fc-busca");
      if (buscaInput) {
        buscaInput.addEventListener("input", function () {
          state.busca = buscaInput.value;
          state.mostrarLista = true;
          render();
        });
        buscaInput.addEventListener("focus", function () {
          state.mostrarLista = true;
          render();
        });
      }

      const msgInput = root.querySelector("#fc-mensagem");
      if (msgInput) {
        msgInput.addEventListener("input", function () {
          state.mensagem = msgInput.value;
          atualizarPreview();
        });
      }
    }

    function render() {
      const lista = clientesFiltrados();
      root.innerHTML = `
        <section class="fc-screen">
          <div class="fc-fundos" id="fc-fundos"></div>
          <div class="fc-scroll" id="fc-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Falar com Cliente</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <article class="fc-alert">
              <span style="font-size:20px">💬</span>
              <span>A mensagem será enviada via WhatsApp com a identificação do Suporte Klenio Refrigeração.</span>
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Selecionar cliente <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Busque pelo nome ou e-mail</p>

              <div class="ch-input-wrap">
                <span class="ch-input-icon">🔍</span>
                <input id="fc-busca" class="ch-input" value="${escapeHtml(state.busca)}" placeholder="Buscar cliente..." />
                ${
                  state.clienteSelecionado
                    ? '<button class="pa-clear-inline" data-action="clear-cliente" type="button">✕</button>'
                    : ""
                }
              </div>

              ${
                state.clienteSelecionado
                  ? `
                    <div class="fc-selected-client">
                      <strong>${escapeHtml(state.clienteSelecionado.nome || "")}</strong>
                      <small>${escapeHtml(state.clienteSelecionado.email || "")}</small>
                      ${
                        state.clienteSelecionado.telefone
                          ? `<small style="color:#25D366;font-weight:600">📱 ${escapeHtml(state.clienteSelecionado.telefone)}</small>`
                          : '<small style="color:#e74c3c">⚠️ Sem telefone cadastrado</small>'
                      }
                    </div>
                  `
                  : ""
              }

              ${
                state.mostrarLista && !state.clienteSelecionado && lista.length > 0
                  ? `
                    <div class="ap-client-list">
                      ${lista
                        .map(
                          (c) => `
                            <button class="ap-client-item" data-action="select-cliente" data-email="${escapeHtml(c.email)}" type="button">
                              <strong>${escapeHtml(c.nome)}</strong>
                              <small>${escapeHtml(c.email)}${c.telefone ? ` • ${escapeHtml(c.telefone)}` : " • Sem telefone"}</small>
                            </button>
                          `
                        )
                        .join("")}
                    </div>
                  `
                  : state.mostrarLista && !state.clienteSelecionado && state.busca.length > 0
                    ? '<p class="ad-muted" style="margin-top:8px;text-align:center">❄ Nenhum cliente encontrado</p>'
                    : ""
              }
            </article>

            <article class="ch-card fc-card-gap">
              <h2 class="ch-title">Mensagem <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">O texto será enviado com a identificação do suporte</p>

              <div class="fc-preview-box">
                <small>Preview da mensagem:</small>
                <p id="fc-preview-texto"></p>
              </div>

              <textarea
                id="fc-mensagem"
                class="ch-textarea"
                style="min-height:120px"
                placeholder="Digite sua mensagem aqui..."
              >${escapeHtml(state.mensagem)}</textarea>
            </article>

            <button class="op-btn primary" style="margin-top:20px;background:#075E54" data-action="enviar" type="button">
              💬 Enviar via WhatsApp
            </button>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#fc-fundos"), "fc");
      bindEvents();
      atualizarPreview();
    }

    async function iniciar() {
      state.clientes = await carregarClientesSafe();
      render();
    }

    render();
    iniciar();
  }

  window.Telas = window.Telas || {};
  window.Telas.falarCliente = renderTelaFalarCliente;
})();
