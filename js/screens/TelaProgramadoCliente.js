// js/screens/TelaProgramadoCliente.js

(function () {
  const STATUS_CONFIG = {
    Agendado: { icone: "📅", cor: "#f39c12" },
    Contestado: { icone: "⚠️", cor: "#e67e22" },
    Respondido: { icone: "💬", cor: "#2980b9" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
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

  function calcularDiasRestantes(dataChave) {
    if (!dataChave) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const partes = dataChave.split("-");
    if (partes.length !== 3) return null;
    const alvo = new Date(Number.parseInt(partes[0], 10), Number.parseInt(partes[1], 10) - 1, Number.parseInt(partes[2], 10));
    alvo.setHours(0, 0, 0, 0);
    return Math.ceil((alvo - hoje) / (1000 * 60 * 60 * 24));
  }

  function corDias(dias) {
    if (dias === null) return "rgba(180,220,255,0.5)";
    if (dias <= 1) return "#e74c3c";
    if (dias <= 3) return "#f39c12";
    if (dias <= 7) return "#27ae60";
    return "#38b6ff";
  }

  function getProgramadosLocais(email) {
    try {
      const raw = localStorage.getItem("@programados");
      const lista = raw ? JSON.parse(raw) : [];
      return [...lista]
        .filter((item) => item.clienteEmail === email)
        .sort((a, b) => {
          if (!a.dataChave) return 1;
          if (!b.dataChave) return -1;
          return String(a.dataChave).localeCompare(String(b.dataChave));
        });
    } catch (error) {
      return [];
    }
  }

  async function aceitarProgramadoSafe(numero) {
    if (typeof window.aceitarProgramado === "function") {
      await window.aceitarProgramado(numero);
      return;
    }
    try {
      const raw = localStorage.getItem("@programados");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], status: "Aceito" };
        localStorage.setItem("@programados", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  async function contestarProgramadoSafe(numero, motivo) {
    if (typeof window.contestarProgramado === "function") {
      await window.contestarProgramado(numero, motivo);
      return;
    }
    try {
      const raw = localStorage.getItem("@programados");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        const historico = Array.isArray(lista[idx].historico) ? [...lista[idx].historico] : [];
        historico.push({
          tipo: "contestacao",
          mensagem: motivo,
          data: new Date().toLocaleDateString("pt-BR"),
          hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        });
        lista[idx] = { ...lista[idx], status: "Contestado", historico };
        localStorage.setItem("@programados", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  function renderTelaProgramadoCliente(root, props) {
    const usuario = props && props.usuarioLogado ? props.usuarioLogado : null;
    const state = {
      programados: [],
      carregando: true,
      contestando: null,
      motivo: "",
      salvando: null,
      abaSelecionada: "ativos",
      unsubscribe: null,
      pollingId: null,
    };

    function programadosFiltrados() {
      if (state.abaSelecionada === "ativos") {
        return state.programados.filter((p) => p.status !== "Cancelado" && p.status !== "Concluído");
      }
      return state.programados.filter((p) => p.status === "Cancelado" || p.status === "Concluído");
    }

    async function handleAceitar(programado) {
      const ok = await window.showAppConfirm(
        `Confirma o agendamento para ${programado.dataFormatada} às ${programado.horario}?`
      );
      if (!ok) return;
      state.salvando = programado.numero;
      render();
      await aceitarProgramadoSafe(programado.numero);
      state.salvando = null;
      sincronizarFallback();
      render();
    }

    async function handleContestar() {
      if (!state.contestando) return;
      if (!state.motivo.trim()) {
        window.showAppAlert("Atenção ❄\nInforme o motivo da contestação.");
        return;
      }
      state.salvando = state.contestando.numero;
      render();
      await contestarProgramadoSafe(state.contestando.numero, state.motivo.trim());
      state.salvando = null;
      state.contestando = null;
      state.motivo = "";
      sincronizarFallback();
      render();
      window.showAppAlert("Contestação enviada! ❄\nNossa equipe irá analisar e responder em breve.");
    }

    function renderHistorico(programado) {
      if (!Array.isArray(programado.historico) || programado.historico.length === 0) return "";
      return `
        <div class="pc-historico">
          <p class="pc-historico-title">💬 Histórico</p>
          ${programado.historico.map((msg) => `
            <div class="pc-historico-item${msg.tipo === "resposta" ? " is-resposta" : ""}">
              <div class="pc-historico-head">
                <span class="pc-historico-author">${msg.tipo === "contestacao" ? "⚠️ Você" : "💬 Suporte"}</span>
                <span class="pc-historico-time">${escapeHtml(msg.data)} ${escapeHtml(msg.hora)}</span>
              </div>
              <p class="pc-historico-msg">${escapeHtml(msg.mensagem)}</p>
            </div>
          `).join("")}
        </div>
      `;
    }

    function renderCard(programado, index) {
      const conf = STATUS_CONFIG[programado.status] || STATUS_CONFIG.Agendado;
      const dias = calcularDiasRestantes(programado.dataChave);
      const corDiasVal = corDias(dias);
      const isPeriodo = programado.criadoComPeriodo === true;
      const estaCarregando = state.salvando === programado.numero;

      const cancelado = programado.status === "Cancelado";
      const concluido = programado.status === "Concluído";
      const emAtendimento = programado.status === "Em atendimento";
      const aceito = programado.status === "Aceito";

      return `
        <article class="pc-card">
          <div class="ac-banner">
            <span>❄</span>
            <span class="ac-banner-text">Agendado pelo Suporte</span>
            ${isPeriodo ? '<span style="margin-left:auto;color:#f39c12;font-size:10px;font-weight:700">📆 Período</span>' : ""}
          </div>

          <div class="pc-head">
            <p class="pc-numero">${escapeHtml(programado.numero)}</p>
            <span class="op-status" style="background:${conf.cor}22;color:${conf.cor}">
              <span>${conf.icone}</span>
              <span>${escapeHtml(programado.status)}</span>
            </span>
          </div>

          ${programado.status === "Agendado" ? `
            <div class="pc-alert">
              <span style="font-size:20px">⚠️</span>
              <span class="pc-alert-text">Aceite o agendamento para dar continuidade ao atendimento.</span>
            </div>
          ` : ""}

          ${dias !== null && !cancelado && !concluido && !emAtendimento ? `
            <div class="pc-countdown" style="border-color:${corDiasVal}35;background:${corDiasVal}15">
              <span style="font-size:20px">⏳</span>
              <span>
                ${
                  dias === 0
                    ? '<span class="pc-countdown-title" style="color:#e74c3c">Hoje é o dia! 🚨</span>'
                    : dias < 0
                      ? '<span class="op-row-text">Data passou</span>'
                      : `<span class="pc-countdown-title" style="color:${corDiasVal}">${dias} dia${dias !== 1 ? "s" : ""}</span><br /><span class="pc-countdown-sub">para o atendimento</span>`
                }
              </span>
            </div>
          ` : ""}

          ${emAtendimento ? `
            <div class="pc-attending">
              <span style="font-size:18px">🔧</span>
              <span class="pc-attending-text">Técnico em atendimento agora</span>
            </div>
          ` : ""}

          <div class="pc-info-list">
            <div class="op-row"><span>🔧</span><span class="op-row-text flex">${escapeHtml(programado.tipo || (programado.tipos || []).join(", "))}</span></div>
            <div class="op-row"><span>📅</span><span class="op-row-text">${escapeHtml(programado.dataFormatada)} • ${escapeHtml(programado.horario)}</span></div>
            <div class="op-row"><span>📍</span><span class="op-row-text flex">${escapeHtml(programado.endereco)}</span></div>
            ${programado.tecnico ? `<div class="op-row"><span>👷</span><span class="op-row-text">Técnico: ${escapeHtml(programado.tecnico)}</span></div>` : ""}
            ${programado.detalhes ? `<div class="op-row"><span>📝</span><span class="op-row-text flex">${escapeHtml(programado.detalhes)}</span></div>` : ""}
            ${programado.observacaoTecnica ? `<div class="op-row"><span>🛠️</span><span class="op-row-text flex">Obs. técnica: ${escapeHtml(programado.observacaoTecnica)}</span></div>` : ""}
          </div>

          ${aceito ? `
            <div class="pc-aceito-box">
              <span style="font-size:18px">✅</span>
              <p class="pc-aceito-text">
                Agendamento confirmado! Aguarde o início do atendimento no dia e horário marcado.
                Fique atento ao status no <b>WhatsApp</b> e no <b>App</b>.
              </p>
            </div>
          ` : ""}

          ${concluido && programado.valorCobrado ? `
            <div class="pc-pay-box">
              <div class="pc-pay-row"><span class="pc-pay-label">Valor cobrado</span><span class="pc-pay-value price">R$ ${escapeHtml(programado.valorCobrado)}</span></div>
              <div class="pc-pay-row"><span class="pc-pay-label">Forma de pagamento</span><span class="pc-pay-value">${escapeHtml(programado.formaPagamento)}</span></div>
              ${programado.tempoAtendimento ? `<div class="pc-pay-row"><span class="pc-pay-label">Tempo de atendimento</span><span class="pc-pay-value">⏱️ ${escapeHtml(programado.tempoAtendimento)}</span></div>` : ""}
            </div>
          ` : ""}

          ${renderHistorico(programado)}

          <div class="pc-actions">
            ${programado.status === "Agendado" ? `
              <button class="op-btn approve" data-action="aceitar" data-index="${index}" type="button" ${estaCarregando ? "disabled" : ""}>
                ${estaCarregando ? '<span class="op-spinner"></span>' : "✅ Aceitar agendamento"}
              </button>
              <button class="op-btn reject" data-action="contestar-open" data-index="${index}" type="button">⚠️ Contestar</button>
            ` : ""}

            ${programado.status === "Respondido" ? `
              <button class="op-btn approve" data-action="aceitar" data-index="${index}" type="button" ${estaCarregando ? "disabled" : ""}>
                ${estaCarregando ? '<span class="op-spinner"></span>' : "✅ Aceitar agendamento"}
              </button>
              <button class="op-btn reject" data-action="contestar-open" data-index="${index}" type="button">⚠️ Contestar novamente</button>
            ` : ""}

            ${programado.status === "Contestado" ? `
              <div class="op-action-hint" style="border-color:rgba(230,126,34,0.25);background:rgba(230,126,34,0.08);color:#e67e22">
                ⏳ Aguardando resposta do suporte...
              </div>
            ` : ""}
          </div>
        </article>
      `;
    }

    function bindEvents(listaFiltrada) {
      root.querySelector("#pc-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("principal");
      });

      root.querySelector("#pc-aba-ativos").addEventListener("click", function () {
        state.abaSelecionada = "ativos";
        render();
      });
      root.querySelector("#pc-aba-historico").addEventListener("click", function () {
        state.abaSelecionada = "historico";
        render();
      });

      const inputMotivo = root.querySelector("#pc-motivo");
      if (inputMotivo) {
        inputMotivo.addEventListener("input", function () {
          state.motivo = inputMotivo.value;
        });
      }

      const btnEnviar = root.querySelector("#pc-enviar-contestacao");
      if (btnEnviar) btnEnviar.addEventListener("click", handleContestar);

      root.querySelector("#pc-container").addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;
        const item = listaFiltrada[Number(btn.dataset.index)];

        if (action === "aceitar" && item) {
          handleAceitar(item);
        } else if (action === "contestar-open" && item) {
          state.contestando = item;
          state.motivo = "";
          render();
        } else if (action === "contestar-cancelar") {
          state.contestando = null;
          state.motivo = "";
          render();
        }
      });
    }

    function render() {
      const lista = programadosFiltrados();
      root.innerHTML = `
        <section class="pc-screen">
          <div class="pc-fundos" id="pc-fundos"></div>
          <div class="pc-scroll" id="pc-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Programado pelo Suporte</h1>
              </div>
              <button class="ch-voltar" id="pc-voltar" type="button">← Voltar</button>
            </header>

            <div class="op-tabs">
              <button class="op-tab-btn prog${state.abaSelecionada === "ativos" ? " is-active prog" : ""}" id="pc-aba-ativos" type="button">Em andamento</button>
              <button class="op-tab-btn prog${state.abaSelecionada === "historico" ? " is-active prog" : ""}" id="pc-aba-historico" type="button">Histórico</button>
            </div>

            ${state.contestando ? `
              <article class="pc-modal">
                <div class="pc-modal-head">
                  <h2 class="ch-title">⚠️ Contestar agendamento</h2>
                  <button class="pc-modal-close" data-action="contestar-cancelar" type="button">✕</button>
                </div>
                <p class="ch-sub">${escapeHtml(state.contestando.numero)} • ${escapeHtml(state.contestando.dataFormatada)}</p>
                <label class="ch-input-label">Motivo da contestação</label>
                <textarea class="ch-textarea" id="pc-motivo" placeholder="Explique o motivo...">${escapeHtml(state.motivo)}</textarea>
                <div class="pc-modal-row">
                  <button class="op-btn cancel" data-action="contestar-cancelar" type="button">Cancelar</button>
                  <button class="op-btn primary" id="pc-enviar-contestacao" type="button" ${state.salvando ? "disabled" : ""}>
                    ${state.salvando ? '<span class="op-spinner"></span>' : "⚠️ Enviar contestação"}
                  </button>
                </div>
              </article>
            ` : ""}

            ${state.carregando ? `
              <div class="pc-loading">
                <div class="op-spinner"></div>
              </div>
            ` : lista.length === 0 ? `
              <div class="op-empty">
                <p class="op-empty-icon">🛠️</p>
                <p class="op-empty-title">Nenhum agendamento</p>
                <p class="op-empty-sub">
                  ${state.abaSelecionada === "ativos"
                    ? "Nenhum agendamento em andamento."
                    : "Nenhum agendamento no histórico."}
                </p>
              </div>
            ` : `
              ${lista.map((item, index) => renderCard(item, index)).join("")}
            `}

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#pc-fundos"), "pc");
      bindEvents(lista);
    }

    function sincronizarFallback() {
      if (!usuario || !usuario.email) return;
      state.programados = getProgramadosLocais(usuario.email);
    }

    function iniciar() {
      if (!usuario || !usuario.email) {
        state.carregando = false;
        render();
        return;
      }

      if (typeof window.ouvirProgramados === "function") {
        const unsub = window.ouvirProgramados(usuario.email, function (lista) {
          const sorted = [...(lista || [])].sort((a, b) => {
            if (!a.dataChave) return 1;
            if (!b.dataChave) return -1;
            return String(a.dataChave).localeCompare(String(b.dataChave));
          });
          state.programados = sorted;
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

    return function cleanupProgramadoCliente() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
      if (state.pollingId) clearInterval(state.pollingId);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.programadoCliente = renderTelaProgramadoCliente;
})();
