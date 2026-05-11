// js/screens/TelaOrcamentoAdmin.js

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

  function parseArrayStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setArrayStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizarTelefone(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") {
      return window.formatarTelefoneWhatsApp(telefone);
    }
    if (!telefone) return null;
    const nums = String(telefone).replace(/\D/g, "");
    if (nums.length === 10 || nums.length === 11) return `55${nums}`;
    return null;
  }

  async function atualizarOrcamentoSafe(numero, updates) {
    if (typeof window.atualizarOrcamento === "function") {
      await window.atualizarOrcamento(numero, updates);
      return;
    }
    const lista = parseArrayStorage("@orcamentos");
    const idx = lista.findIndex((item) => item.numero === numero);
    if (idx < 0) return;
    lista[idx] = { ...lista[idx], ...updates };
    setArrayStorage("@orcamentos", lista);
  }

  async function excluirOrcamentoSafe(orcamento) {
    if (
      window.db &&
      typeof window.db.collection === "function" &&
      window.db.collection("orcamentos") &&
      typeof window.db.collection("orcamentos").doc === "function"
    ) {
      await window.db.collection("orcamentos").doc(orcamento.numero).update({
        excluidoPorAdmin: true,
        excluidoEm: new Date().toLocaleDateString("pt-BR"),
      });
      return;
    }
    await atualizarOrcamentoSafe(orcamento.numero, {
      excluidoPorAdmin: true,
      excluidoEm: new Date().toLocaleDateString("pt-BR"),
    });
  }

  async function notificarPushCliente(email, titulo, corpo) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(email);
        if (token) {
          await window.enviarNotificacaoPush(token, titulo, corpo, { tela: "meusOrcamentos" });
        }
      }
    } catch (error) {
      console.log("Erro notificação:", error);
    }
  }

  function notificarWhatsappOrcamentoEnviado(orcamento) {
    if (typeof window.notificarClienteOrcamentoEnviado === "function") {
      window.notificarClienteOrcamentoEnviado(orcamento.clienteTelefone, orcamento);
      return;
    }
    const numero = normalizarTelefone(orcamento.clienteTelefone);
    if (!numero) return;
    const mensagem =
      `Olá, ${orcamento.cliente}! 👋\n\n` +
      `💰 *Seu orçamento foi enviado.*\n\n` +
      `🔢 Número: ${orcamento.numero}\n` +
      `🔧 Serviço: ${orcamento.tipoServico}\n` +
      `💵 Valor: R$ ${orcamento.valorOrcamento}\n` +
      (orcamento.descricaoAdmin ? `📝 Descrição: ${orcamento.descricaoAdmin}\n` : "") +
      `\nAcesse o app para aprovação.\n\nKlenio Refrigeração ❄`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  function notificarWhatsappOrcamentoCancelado(orcamento) {
    if (typeof window.notificarClienteOrcamentoCancelado === "function") {
      window.notificarClienteOrcamentoCancelado(orcamento.clienteTelefone, orcamento);
      return;
    }
    const numero = normalizarTelefone(orcamento.clienteTelefone);
    if (!numero) return;
    const mensagem =
      `Olá, ${orcamento.cliente}! 👋\n\n` +
      `🚫 *Seu orçamento ${orcamento.numero} foi cancelado pelo suporte.*\n\n` +
      `Em caso de dúvidas, fale com nossa equipe.\n\nKlenio Refrigeração ❄`;
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  function ouvirTodosOrcamentosSafe(callback) {
    if (typeof window.ouvirTodosOrcamentos === "function") {
      const unsub = window.ouvirTodosOrcamentos(function (lista) {
        callback((lista || []).filter((o) => !o.excluidoPorAdmin));
      });
      return typeof unsub === "function" ? unsub : function () {};
    }

    callback(parseArrayStorage("@orcamentos").filter((o) => !o.excluidoPorAdmin));
    const interval = setInterval(function () {
      callback(parseArrayStorage("@orcamentos").filter((o) => !o.excluidoPorAdmin));
    }, 3000);
    return function () {
      clearInterval(interval);
    };
  }

  function renderTelaOrcamentoAdmin(root, props) {
    const state = {
      orcamentos: [],
      carregando: true,
      orcamentoSelecionado: null,
      valor: "",
      descricao: "",
      salvando: false,
      abaSelecionada: "pendentes",
      unsubscribe: null,
    };

    function orcamentosFiltrados() {
      if (state.abaSelecionada === "pendentes") {
        return state.orcamentos.filter(
          (o) =>
            o.status === "Aguardando análise" ||
            o.status === "Em análise" ||
            o.status === "Orçamento enviado"
        );
      }
      if (state.abaSelecionada === "aprovados") {
        return state.orcamentos.filter((o) => o.status === "Aprovado");
      }
      return state.orcamentos.filter((o) => o.status === "Recusado" || o.status === "Cancelado");
    }

    async function handleIniciarAnalise(numero) {
      const orc = state.orcamentos.find((o) => o.numero === numero);
      if (!orc) return;
      await atualizarOrcamentoSafe(numero, { status: "Em análise" });
      await notificarPushCliente(
        orc.clienteEmail,
        "🔍 Orçamento em análise!",
        `Seu orçamento ${orc.numero} está sendo analisado pela nossa equipe.`
      );
    }

    async function handleEnviarOrcamento() {
      if (!state.orcamentoSelecionado) return;
      if (!state.valor.trim()) {
        window.alert("Atenção ❄\nInforme o valor do orçamento.");
        return;
      }

      state.salvando = true;
      render();

      const atualizado = {
        ...state.orcamentoSelecionado,
        status: "Orçamento enviado",
        valorOrcamento: state.valor.trim(),
        descricaoAdmin: state.descricao.trim(),
      };

      await atualizarOrcamentoSafe(state.orcamentoSelecionado.numero, {
        status: "Orçamento enviado",
        valorOrcamento: state.valor.trim(),
        descricaoAdmin: state.descricao.trim(),
      });

      await notificarPushCliente(
        state.orcamentoSelecionado.clienteEmail,
        "💰 Orçamento disponível!",
        `Seu orçamento ${state.orcamentoSelecionado.numero} foi enviado no valor de R$ ${state.valor.trim()}.`
      );

      state.salvando = false;
      state.orcamentoSelecionado = null;
      state.valor = "";
      state.descricao = "";
      render();

      const enviarWA = window.confirm("Deseja enviar o orçamento por WhatsApp para o cliente?");
      if (enviarWA) notificarWhatsappOrcamentoEnviado(atualizado);
    }

    async function handleCancelar(numero) {
      const orc = state.orcamentos.find((o) => o.numero === numero);
      if (!orc) return;
      const ok = window.confirm(`Tem certeza que deseja cancelar o orçamento ${orc.numero}?`);
      if (!ok) return;

      await atualizarOrcamentoSafe(numero, { status: "Cancelado" });
      await notificarPushCliente(
        orc.clienteEmail,
        "🚫 Orçamento cancelado",
        `Seu orçamento ${orc.numero} foi cancelado pelo suporte.`
      );

      const enviarWA = window.confirm("Deseja notificar o cliente via WhatsApp sobre o cancelamento?");
      if (enviarWA) notificarWhatsappOrcamentoCancelado(orc);
    }

    async function handleExcluir(numero) {
      const orc = state.orcamentos.find((o) => o.numero === numero);
      if (!orc) return;
      const ok = window.confirm(
        `Tem certeza que deseja excluir o orçamento ${orc.numero}?\n\nEle será removido do painel.`
      );
      if (!ok) return;
      try {
        await excluirOrcamentoSafe(orc);
      } catch (error) {
        window.alert("Não foi possível excluir o orçamento.");
      }
    }

    function cardOrcamentoHtml(orcamento) {
      const config = STATUS_CONFIG[orcamento.status] || STATUS_CONFIG["Aguardando análise"];
      const podeCancelar = orcamento.status !== "Cancelado" && orcamento.status !== "Recusado";
      const podeExcluir =
        orcamento.status === "Aprovado" || orcamento.status === "Recusado" || orcamento.status === "Cancelado";

      return `
        <article class="pa-card" style="border-color:${config.cor}44">
          <div class="pa-card-head">
            <span class="pa-numero">${escapeHtml(orcamento.numero)}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="pa-status" style="background:${config.cor}22;color:${config.cor}">
                <span>${config.icone}</span>
                <span>${escapeHtml(orcamento.status)}</span>
              </span>
              ${
                podeExcluir
                  ? `<button class="pa-delete-btn" data-action="excluir" data-numero="${escapeHtml(
                      orcamento.numero
                    )}" type="button">🗑️</button>`
                  : ""
              }
            </div>
          </div>

          <div class="pa-info-list">
            <div class="pa-info-row"><span>👤</span><span>${escapeHtml(orcamento.cliente)}</span></div>
            <div class="pa-info-row"><span>📱</span><span>${escapeHtml(orcamento.clienteTelefone || "Não informado")}</span></div>
            <div class="pa-info-row"><span>🔧</span><span>${escapeHtml(orcamento.tipoServico || "-")}</span></div>
            <div class="pa-info-row"><span>❄</span><span>${escapeHtml(orcamento.tipoAparelho || "-")} • ${escapeHtml(
              orcamento.btu || "-"
            )} BTUs • ${escapeHtml(orcamento.quantidade || "-")} unid.</span></div>
            ${
              orcamento.metragem && orcamento.metragem !== "Não informado"
                ? `<div class="pa-info-row"><span>📐</span><span>${escapeHtml(orcamento.metragem)}</span></div>`
                : ""
            }
            <div class="pa-info-row"><span>📍</span><span>${escapeHtml(orcamento.endereco || "-")}</span></div>
            ${
              orcamento.dataFormatada
                ? `<div class="pa-info-row"><span>📅</span><span>${escapeHtml(orcamento.dataFormatada)}${
                    orcamento.horario ? ` • ${escapeHtml(orcamento.horario)}` : ""
                  }</span></div>`
                : ""
            }
            ${
              orcamento.detalhes
                ? `<div class="pa-info-row"><span>📝</span><span>${escapeHtml(orcamento.detalhes)}</span></div>`
                : ""
            }
          </div>

          ${
            orcamento.valorOrcamento
              ? `
                <div style="margin-top:12px;background:rgba(142,68,173,0.1);border:1px solid rgba(142,68,173,0.3);border-radius:10px;padding:12px;display:grid;gap:4px">
                  <strong style="color:#8e44ad;font-size:13px">💰 Valor enviado</strong>
                  <strong style="color:#fff;font-size:20px">R$ ${escapeHtml(orcamento.valorOrcamento)}</strong>
                  ${
                    orcamento.descricaoAdmin
                      ? `<span style="color:rgba(180,220,255,0.7);font-size:13px">${escapeHtml(orcamento.descricaoAdmin)}</span>`
                      : ""
                  }
                </div>
              `
              : ""
          }

          <div style="margin-top:14px;display:grid;gap:10px">
            ${
              orcamento.status === "Aguardando análise"
                ? `<button class="op-btn" style="border-color:rgba(41,128,185,0.4);background:rgba(41,128,185,0.15);color:#2980b9" data-action="iniciar-analise" data-numero="${escapeHtml(
                    orcamento.numero
                  )}" type="button">🔍 Iniciar análise</button>`
                : ""
            }
            ${
              orcamento.status === "Em análise"
                ? `<button class="op-btn" style="border-color:rgba(142,68,173,0.4);background:rgba(142,68,173,0.15);color:#8e44ad" data-action="abrir-envio" data-numero="${escapeHtml(
                    orcamento.numero
                  )}" type="button">💰 Enviar orçamento</button>`
                : ""
            }
            ${
              podeCancelar
                ? `<button class="op-btn reject" data-action="cancelar" data-numero="${escapeHtml(
                    orcamento.numero
                  )}" type="button">🚫 Cancelar orçamento</button>`
                : ""
            }
          </div>
        </article>
      `;
    }

    function bindEvents(listaFiltrada) {
      root.querySelector("#oa-admin-container").addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "tab") {
          state.abaSelecionada = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "abrir-envio") {
          const item = state.orcamentos.find((o) => o.numero === actionEl.dataset.numero);
          if (!item) return;
          state.orcamentoSelecionado = item;
          state.valor = "";
          state.descricao = "";
          render();
          return;
        }
        if (action === "fechar-envio") {
          state.orcamentoSelecionado = null;
          state.valor = "";
          state.descricao = "";
          render();
          return;
        }
        if (action === "enviar-orcamento") {
          handleEnviarOrcamento();
          return;
        }
        if (action === "iniciar-analise") {
          handleIniciarAnalise(actionEl.dataset.numero);
          return;
        }
        if (action === "cancelar") {
          handleCancelar(actionEl.dataset.numero);
          return;
        }
        if (action === "excluir") {
          handleExcluir(actionEl.dataset.numero);
        }
      });

      const valorInput = root.querySelector("#oa-admin-valor");
      if (valorInput) {
        valorInput.addEventListener("input", function () {
          state.valor = valorInput.value;
        });
      }

      const descInput = root.querySelector("#oa-admin-descricao");
      if (descInput) {
        descInput.addEventListener("input", function () {
          state.descricao = descInput.value;
        });
      }
    }

    function render() {
      const lista = orcamentosFiltrados();
      root.innerHTML = `
        <section class="pa-screen">
          <div class="pa-fundos" id="oa-admin-fundos"></div>
          <div class="pa-scroll" id="oa-admin-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Orçamentos</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            ${
              state.orcamentoSelecionado
                ? `
                  <article class="pa-responder-box" style="background:rgba(142,68,173,0.1);border-color:rgba(142,68,173,0.4)">
                    <h2>💰 Enviar orçamento</h2>
                    <p>Para: ${escapeHtml(state.orcamentoSelecionado.cliente)} • ${escapeHtml(
                    state.orcamentoSelecionado.numero
                  )}</p>

                    <label for="oa-admin-valor">Valor (R$) *</label>
                    <div class="ch-input-wrap">
                      <span class="ch-input-icon">💰</span>
                      <input id="oa-admin-valor" class="ch-input" value="${escapeHtml(state.valor)}" placeholder="Ex: 850,00" />
                    </div>

                    <label for="oa-admin-descricao">Descrição do orçamento</label>
                    <textarea id="oa-admin-descricao" class="ch-textarea" style="min-height:80px">${escapeHtml(
                      state.descricao
                    )}</textarea>

                    <div class="pa-responder-actions">
                      <button class="op-btn cancel" data-action="fechar-envio" type="button">Cancelar</button>
                      <button class="op-btn primary" style="background:#8e44ad" data-action="enviar-orcamento" type="button" ${
                        state.salvando ? "disabled" : ""
                      }>
                        ${state.salvando ? '<span class="op-spinner"></span>' : "💰 Enviar para cliente"}
                      </button>
                    </div>
                  </article>
                `
                : ""
            }

            <div class="op-tabs" style="margin-bottom:16px">
              <button class="op-tab-btn orc${
                state.abaSelecionada === "pendentes" ? " is-active orc" : ""
              }" data-action="tab" data-value="pendentes" type="button">Pendentes</button>
              <button class="op-tab-btn orc${
                state.abaSelecionada === "aprovados" ? " is-active orc" : ""
              }" data-action="tab" data-value="aprovados" type="button">Aprovados</button>
              <button class="op-tab-btn orc${
                state.abaSelecionada === "historico" ? " is-active orc" : ""
              }" data-action="tab" data-value="historico" type="button">Histórico</button>
            </div>

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
                      <p class="pa-empty-icon">❄</p>
                      <p class="pa-empty-title">Nenhum orçamento encontrado</p>
                    </div>
                  `
                  : lista.map(cardOrcamentoHtml).join("")
            }
            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#oa-admin-fundos"), "pa");
      bindEvents(lista);
    }

    render();
    state.unsubscribe = ouvirTodosOrcamentosSafe(function (lista) {
      state.orcamentos = lista;
      state.carregando = false;
      render();
    });

    return function cleanupOrcamentoAdmin() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.orcamentoAdmin = renderTelaOrcamentoAdmin;
})();
