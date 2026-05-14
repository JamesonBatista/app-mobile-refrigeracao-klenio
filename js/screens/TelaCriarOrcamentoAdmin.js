// js/screens/TelaCriarOrcamentoAdmin.js

(function () {
  const TIPOS_SERVICO = [
    { icone: "❄", label: "Instalação de AR" },
    { icone: "🔧", label: "Manutenção preventiva" },
    { icone: "🔄", label: "Substituição" },
    { icone: "🏗️", label: "Instalação nova" },
    { icone: "📋", label: "Outro" },
  ];
  const TIPOS_APARELHO = ["Split", "Janela", "Cassete", "Piso Teto", "Portátil"];
  const BTUS = ["Não sei", "9.000", "12.000", "18.000", "24.000", "36.000"];
  const HORARIOS_SEMANA = ["08:00 às 10:00", "10:00 às 12:00", "13:00 às 15:00", "15:00 às 17:00"];
  const HORARIOS_SABADO = ["09:00 às 11:00", "11:30 às 13:00"];

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

  function gerarNumeroOrcamento() {
    return `#O${Math.floor(Math.random() * 90000 + 10000)}`;
  }

  function isSabadoSafe(data) {
    if (typeof window.isSabado === "function") return window.isSabado(data);
    return data.getDay() === 6;
  }

  function formatarDataSafe(data) {
    if (typeof window.formatarData === "function") return window.formatarData(data);
    return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  }

  function formatarDataChaveSafe(data) {
    if (typeof window.formatarDataChave === "function") return window.formatarDataChave(data);
    return data.toISOString().split("T")[0];
  }

  function getProximosDiasSafe() {
    if (typeof window.getProximosDias === "function") return window.getProximosDias();
    const dias = [];
    const hoje = new Date();
    let i = 0;
    while (dias.length < 7) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      i += 1;
      if (d.getDay() !== 0) dias.push(d);
    }
    return dias;
  }

  async function getHorariosDisponiveisSafe(data) {
    if (typeof window.getHorariosDisponiveis === "function") {
      return window.getHorariosDisponiveis(data);
    }
    return isSabadoSafe(data) ? HORARIOS_SABADO : HORARIOS_SEMANA;
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
          endereco: item.endereco || "",
          telefone: item.clienteTelefone || "",
        });
      }
    });
    parseArrayStorage("@orcamentos").forEach((item) => {
      if (item && item.clienteEmail) {
        map.set(item.clienteEmail, {
          nome: item.cliente || item.clienteEmail,
          email: item.clienteEmail,
          endereco: item.endereco || "",
          telefone: item.clienteTelefone || "",
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

  async function salvarOrcamentoSafe(orcamento) {
    if (typeof window.salvarOrcamento === "function") {
      await window.salvarOrcamento(orcamento);
      return;
    }
    const lista = parseArrayStorage("@orcamentos");
    lista.unshift(orcamento);
    setArrayStorage("@orcamentos", lista);
  }

  async function notificarPushCliente(email, valor) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(email);
        if (token) {
          await window.enviarNotificacaoPush(
            token,
            "💰 Orçamento disponível!",
            `O suporte enviou um orçamento para você no valor de R$ ${valor}. Acesse o app para visualizar.`,
            { tela: "meusOrcamentos" }
          );
        }
      }
    } catch (error) {
      console.log("Erro notificação:", error);
    }
  }

  function notificarWhatsappOrcamento(telefone, orcamento) {
    if (typeof window.notificarClienteOrcamentoEnviado === "function") {
      window.notificarClienteOrcamentoEnviado(telefone, orcamento);
      return;
    }
    const numero = normalizarTelefone(telefone);
    if (!numero) return;
    const mensagem =
      `Olá, ${orcamento.cliente}! 👋\n\n` +
      `💰 *Seu orçamento foi enviado pelo suporte.*\n\n` +
      `🔢 Número: ${orcamento.numero}\n` +
      `🔧 Serviço: ${orcamento.tipoServico}\n` +
      `❄ Aparelho: ${orcamento.tipoAparelho}\n` +
      `📍 Endereço: ${orcamento.endereco}\n` +
      `💵 Valor: R$ ${orcamento.valorOrcamento}\n` +
      (orcamento.descricaoAdmin ? `📝 Descrição: ${orcamento.descricaoAdmin}\n` : "") +
      `\nAcesse o app para aprovar ou recusar.\n\nKlenio Refrigeração ❄`;
    if (typeof window.abrirLinkWhatsApp === "function") {
      window.abrirLinkWhatsApp(numero, mensagem);
    } else {
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
    }
  }

  async function showConfirm(message) {
    if (typeof window.showCustomConfirm === "function") {
      return window.showCustomConfirm(message);
    }
    return window.confirm(message);
  }

  function renderTelaCriarOrcamentoAdmin(root, props) {
    const state = {
      clientes: [],
      clienteSelecionado: null,
      busca: "",
      mostrarLista: false,
      tiposServico: [],
      quantidade: "1",
      tiposAparelho: [],
      btu: null,
      metragem: "",
      endereco: "",
      editandoEndereco: false,
      dias: [],
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      carregandoHorarios: false,
      diasLotados: {},
      valor: "",
      descricao: "",
      detalhes: "",
      carregando: false,
    };

    function clientesFiltrados() {
      const termo = state.busca.toLowerCase();
      return state.clientes.filter(
        (c) =>
          String(c.nome || "").toLowerCase().includes(termo) ||
          String(c.email || "").toLowerCase().includes(termo)
      );
    }

    async function verificarDiasLotados(listaDias) {
      const lotados = {};
      for (const dia of listaDias) {
        const horarios = await getHorariosDisponiveisSafe(dia);
        if (!horarios || horarios.length === 0) {
          lotados[formatarDataChaveSafe(dia)] = true;
        }
      }
      state.diasLotados = lotados;
      render();
    }

    async function selecionarDia(chaveDia) {
      const dia = state.dias.find((item) => formatarDataChaveSafe(item) === chaveDia);
      if (!dia) return;
      state.diaSelecionado = dia;
      state.horario = null;
      state.carregandoHorarios = true;
      render();
      const horarios = await getHorariosDisponiveisSafe(dia);
      state.horariosDisponiveis = horarios || [];
      state.carregandoHorarios = false;
      render();
    }

    function toggleTipoServico(label) {
      if (state.tiposServico.includes(label)) {
        state.tiposServico = state.tiposServico.filter((item) => item !== label);
      } else {
        state.tiposServico.push(label);
      }
      render();
    }

    function toggleTipoAparelho(tipo) {
      if (state.tiposAparelho.includes(tipo)) {
        state.tiposAparelho = state.tiposAparelho.filter((item) => item !== tipo);
      } else {
        state.tiposAparelho.push(tipo);
      }
      render();
    }

    async function handleCriar() {
      if (!state.clienteSelecionado) {
        window.alert("Atenção ❄\nSelecione um cliente.");
        return;
      }
      if (state.tiposServico.length === 0) {
        window.alert("Atenção ❄\nSelecione ao menos um tipo de serviço.");
        return;
      }
      if (state.tiposAparelho.length === 0) {
        window.alert("Atenção ❄\nSelecione ao menos um tipo de aparelho.");
        return;
      }
      if (!state.btu) {
        window.alert("Atenção ❄\nSelecione os BTUs.");
        return;
      }
      if (!state.endereco.trim()) {
        window.alert("Atenção ❄\nInforme o endereço.");
        return;
      }
      if (!state.valor.trim()) {
        window.alert("Atenção ❄\nInforme o valor do orçamento.");
        return;
      }

      state.carregando = true;
      render();

      const orcamento = {
        numero: gerarNumeroOrcamento(),
        tipoServico: state.tiposServico.join(", "),
        quantidade: state.quantidade,
        tipoAparelho: state.tiposAparelho.join(", "),
        btu: state.btu,
        metragem: state.metragem.trim() ? `${state.metragem}m` : "Não informado",
        endereco: state.endereco,
        dataFormatada: state.diaSelecionado ? formatarDataSafe(state.diaSelecionado) : "",
        dataChave: state.diaSelecionado ? formatarDataChaveSafe(state.diaSelecionado) : "",
        horario: state.horario || "",
        detalhes: state.detalhes,
        status: "Orçamento enviado",
        cliente: state.clienteSelecionado.nome,
        clienteEmail: state.clienteSelecionado.email,
        clienteTelefone: state.clienteSelecionado.telefone || "",
        valorOrcamento: state.valor.trim(),
        descricaoAdmin: state.descricao.trim(),
        dataCriacao: new Date().toLocaleDateString("pt-BR"),
        criadoPorAdmin: true,
      };

      await salvarOrcamentoSafe(orcamento);
      await notificarPushCliente(state.clienteSelecionado.email, state.valor.trim());
      state.carregando = false;
      render();

      const enviar = await showConfirm(
        `Orçamento criado! ❄\n\nDeseja notificar ${state.clienteSelecionado.nome} via WhatsApp?`
      );
      if (enviar) notificarWhatsappOrcamento(state.clienteSelecionado.telefone, orcamento);
      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    function bindEvents() {
      const container = root.querySelector("#coa-container");
      container.addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "select-cliente") {
          const email = actionEl.dataset.email;
          const cliente = state.clientes.find((c) => c.email === email);
          if (!cliente) return;
          state.clienteSelecionado = cliente;
          state.busca = cliente.nome;
          state.mostrarLista = false;
          state.endereco = cliente.endereco || "";
          render();
          return;
        }
        if (action === "clear-cliente") {
          state.clienteSelecionado = null;
          state.busca = "";
          state.endereco = "";
          render();
          return;
        }
        if (action === "toggle-servico") {
          toggleTipoServico(actionEl.dataset.value);
          return;
        }
        if (action === "set-quantidade") {
          state.quantidade = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "toggle-aparelho") {
          toggleTipoAparelho(actionEl.dataset.value);
          return;
        }
        if (action === "set-btu") {
          state.btu = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "toggle-endereco") {
          state.editandoEndereco = !state.editandoEndereco;
          render();
          return;
        }
        if (action === "select-dia") {
          if (actionEl.dataset.lotado === "1") return;
          selecionarDia(actionEl.dataset.chave);
          return;
        }
        if (action === "select-horario") {
          state.horario = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "criar") {
          handleCriar();
        }
      });

      const buscaInput = root.querySelector("#coa-busca");
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

      const metragemInput = root.querySelector("#coa-metragem");
      if (metragemInput) {
        metragemInput.addEventListener("input", function () {
          state.metragem = metragemInput.value;
        });
      }

      const enderecoInput = root.querySelector("#coa-endereco");
      if (enderecoInput) {
        enderecoInput.addEventListener("input", function () {
          state.endereco = enderecoInput.value;
        });
      }

      const valorInput = root.querySelector("#coa-valor");
      if (valorInput) {
        valorInput.addEventListener("input", function () {
          state.valor = valorInput.value;
        });
      }

      const descricaoInput = root.querySelector("#coa-descricao");
      if (descricaoInput) {
        descricaoInput.addEventListener("input", function () {
          state.descricao = descricaoInput.value;
        });
      }

      const detalhesInput = root.querySelector("#coa-detalhes");
      if (detalhesInput) {
        detalhesInput.addEventListener("input", function () {
          state.detalhes = detalhesInput.value;
        });
      }
    }

    function render() {
      const clientes = clientesFiltrados();
      root.innerHTML = `
        <section class="coa-screen">
          <div class="coa-fundos" id="coa-fundos"></div>
          <div class="coa-scroll" id="coa-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Criar Orçamento</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <article class="ch-card">
              <h2 class="ch-title">Selecionar cliente <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Busque pelo nome ou e-mail</p>

              <div class="ch-input-wrap">
                <span class="ch-input-icon">🔍</span>
                <input id="coa-busca" class="ch-input" value="${escapeHtml(state.busca)}" placeholder="Buscar cliente..." />
                ${
                  state.clienteSelecionado
                    ? '<button class="pa-clear-inline" data-action="clear-cliente" type="button">✕</button>'
                    : ""
                }
              </div>

              ${
                state.clienteSelecionado
                  ? `
                    <div class="ap-selected-client">
                      <strong>${escapeHtml(state.clienteSelecionado.nome || "")}</strong>
                      <small>${escapeHtml(state.clienteSelecionado.email || "")}</small>
                      <small>📍 ${escapeHtml(state.clienteSelecionado.endereco || "")}</small>
                      <small>📱 ${escapeHtml(state.clienteSelecionado.telefone || "")}</small>
                    </div>
                  `
                  : ""
              }

              ${
                state.mostrarLista && !state.clienteSelecionado && clientes.length > 0
                  ? `
                    <div class="ap-client-list">
                      ${clientes
                        .map(
                          (c) => `
                            <button class="ap-client-item" data-action="select-cliente" data-email="${escapeHtml(c.email)}" type="button">
                              <strong>${escapeHtml(c.nome)}</strong>
                              <small>${escapeHtml(c.email)}</small>
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

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Tipo de serviço <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Pode selecionar mais de um</p>
              <div class="ap-problem-grid">
                ${TIPOS_SERVICO.map((tipo) => {
                  const selecionado = state.tiposServico.includes(tipo.label);
                  return `
                    <button class="ap-problem-btn${selecionado ? " is-active" : ""}" data-action="toggle-servico" data-value="${escapeHtml(tipo.label)}" type="button">
                      <span>${tipo.icone}</span>
                      <small>${escapeHtml(tipo.label)}</small>
                      ${selecionado ? "<i>✓</i>" : ""}
                    </button>
                  `;
                }).join("")}
              </div>
            </article>

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Dados do equipamento</h2>

              <label class="ch-input-label">Quantidade de aparelhos</label>
              <div class="coa-inline-chips">
                ${["1", "2", "3", "4", "5+"]
                  .map(
                    (q) => `
                      <button class="ap-chip${state.quantidade === q ? " is-active" : ""}" data-action="set-quantidade" data-value="${q}" type="button">
                        ${q}
                      </button>
                    `
                  )
                  .join("")}
              </div>

              <label class="ch-input-label">Tipo do aparelho <span style="color:#e74c3c">*</span></label>
              <p class="ad-muted" style="font-size:11px;margin-bottom:8px">Pode selecionar mais de um</p>
              <div class="coa-inline-chips">
                ${TIPOS_APARELHO.map(
                  (tipo) => `
                    <button class="ap-chip${state.tiposAparelho.includes(tipo) ? " is-active" : ""}" data-action="toggle-aparelho" data-value="${escapeHtml(tipo)}" type="button">
                      ${escapeHtml(tipo)} ${state.tiposAparelho.includes(tipo) ? "✓" : ""}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">BTUs <span style="color:#e74c3c">*</span></label>
              <div class="coa-inline-chips">
                ${BTUS.map(
                  (btu) => `
                    <button class="ap-chip${state.btu === btu ? " is-active" : ""}" data-action="set-btu" data-value="${escapeHtml(btu)}" type="button">
                      ${escapeHtml(btu)}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">Metragem ponto A ao B <small style="color:rgba(180,220,255,0.4)">(opcional)</small></label>
              <div class="ch-input-wrap">
                <span class="ch-input-icon">📐</span>
                <input id="coa-metragem" class="ch-input" value="${escapeHtml(state.metragem)}" placeholder="Ex: 5.5" />
                <span style="color:rgba(180,220,255,0.4);padding-right:12px">metros</span>
              </div>
            </article>

            <article class="ch-card ap-card-gap">
              <div class="ab-endereco-row">
                <h2 class="ch-title">Endereço <span style="color:#e74c3c">*</span></h2>
                <button class="ab-edit-btn" data-action="toggle-endereco" type="button">
                  ${state.editandoEndereco ? "✓ Confirmar" : "✏️ Editar"}
                </button>
              </div>
              ${
                state.editandoEndereco
                  ? `
                    <div class="ch-input-wrap" style="margin-top:12px">
                      <span class="ch-input-icon">📍</span>
                      <input id="coa-endereco" class="ch-input" value="${escapeHtml(state.endereco)}" />
                    </div>
                  `
                  : `
                    <div class="ab-endereco-view" style="margin-top:12px">
                      <span>📍</span>
                      <span class="ac-info-text" style="flex:1">${escapeHtml(state.endereco || "Selecione um cliente primeiro")}</span>
                    </div>
                  `
              }
            </article>

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Visita técnica</h2>
              <p class="ch-sub">Opcional — selecione dia e horário</p>
              <div class="ap-days-row">
                ${state.dias
                  .map((dia) => {
                    const chave = formatarDataChaveSafe(dia);
                    const lotado = !!state.diasLotados[chave];
                    const sel = state.diaSelecionado && formatarDataChaveSafe(state.diaSelecionado) === chave;
                    return `
                      <button class="ap-day-btn${sel ? " is-selected" : ""}${lotado ? " is-lotado" : ""}" data-action="select-dia" data-chave="${chave}" data-lotado="${lotado ? 1 : 0}" type="button">
                        <span class="ap-day-week${isSabadoSafe(dia) ? " is-sabado" : ""}">${dia.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                        <span class="ap-day-num">${dia.getDate()}</span>
                        <span class="ap-day-month">${dia.toLocaleDateString("pt-BR", { month: "short" })}</span>
                        ${lotado ? '<span class="ap-day-tag">Lotado</span>' : ""}
                      </button>
                    `;
                  })
                  .join("")}
              </div>

              ${
                state.diaSelecionado
                  ? `
                    <div style="margin-top:16px">
                      <p class="ch-sub">Horários disponíveis</p>
                      ${
                        state.carregandoHorarios
                          ? '<div class="tp-loading"><div class="ch-spinner"></div></div>'
                          : state.horariosDisponiveis.length === 0
                            ? '<p class="ad-muted" style="text-align:center">❄ Nenhum horário disponível neste dia</p>'
                            : `<div class="ap-time-list">
                                ${state.horariosDisponiveis
                                  .map(
                                    (h) => `
                                      <button class="ap-time-btn${state.horario === h ? " is-selected" : ""}" data-action="select-horario" data-value="${escapeHtml(h)}" type="button">
                                        <span>🕐</span>
                                        <span>${escapeHtml(h)}</span>
                                        ${state.horario === h ? "<span>✓</span>" : ""}
                                      </button>
                                    `
                                  )
                                  .join("")}
                              </div>`
                      }
                    </div>
                  `
                  : ""
              }
            </article>

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Valor do orçamento <span style="color:#e74c3c">*</span></h2>

              <label class="ch-input-label">Valor (R$)</label>
              <div class="ch-input-wrap">
                <span class="ch-input-icon">💰</span>
                <input id="coa-valor" class="ch-input" value="${escapeHtml(state.valor)}" placeholder="Ex: 850,00" />
              </div>

              <label class="ch-input-label">Descrição do orçamento</label>
              <textarea id="coa-descricao" class="ch-textarea" placeholder="Descreva o que está incluso no orçamento...">${escapeHtml(state.descricao)}</textarea>

              <label class="ch-input-label" style="margin-top:12px">Observações adicionais</label>
              <textarea id="coa-detalhes" class="ch-textarea" placeholder="Informações adicionais para o cliente...">${escapeHtml(state.detalhes)}</textarea>
            </article>

            <button class="op-btn primary" style="margin-top:20px;background:#8e44ad" data-action="criar" type="button" ${state.carregando ? "disabled" : ""}>
              ${
                state.carregando
                  ? '<span class="ch-btn-inline-loading"><span class="op-spinner"></span><span>Enviando orçamento...</span></span>'
                  : "💰 Enviar Orçamento ao Cliente"
              }
            </button>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#coa-fundos"), "coa");
      bindEvents();
    }

    async function iniciar() {
      state.clientes = await carregarClientesSafe();
      state.dias = getProximosDiasSafe();
      render();
      verificarDiasLotados(state.dias);
    }

    render();
    iniciar();
  }

  window.Telas = window.Telas || {};
  window.Telas.criarOrcamentoAdmin = renderTelaCriarOrcamentoAdmin;
})();
