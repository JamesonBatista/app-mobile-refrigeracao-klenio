// js/screens/TelaChamadoDetalhes.js

(function () {
  const STATUS_CONFIG = {
    "Aguardando técnico": { icone: "⏳", cor: "#f39c12" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
  };

  const FORMAS_PAGAMENTO = [
    { icone: "💰", label: "Dinheiro" },
    { icone: "📱", label: "Pix" },
    { icone: "💳", label: "Cartão Débito" },
    { icone: "💳", label: "Cartão Crédito" },
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

  function parseArrayStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveArrayStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getNowStr() {
    if (typeof window.getNowStr === "function") return window.getNowStr();
    const agora = new Date();
    return {
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      iso: agora.toISOString(),
    };
  }

  function formatarData(data) {
    if (typeof window.formatarData === "function") return window.formatarData(data);
    return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  }

  function formatarDataChave(data) {
    if (typeof window.formatarDataChave === "function") return window.formatarDataChave(data);
    return data.toISOString().split("T")[0];
  }

  function isSabado(data) {
    if (typeof window.isSabado === "function") return window.isSabado(data);
    return data.getDay() === 6;
  }

  function getProximosDiasSafe() {
    if (typeof window.getProximosDias === "function") return window.getProximosDias(undefined, { incluirFimDeSemana: true });
    const dias = [];
    const hoje = new Date();
    let offset = 0;
    while (dias.length < 14) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + offset);
      offset += 1;
      dias.push(d);
    }
    return dias;
  }

  async function getHorariosDisponiveisSafe(data) {
    if (typeof window.getHorariosDisponiveis === "function") {
      return window.getHorariosDisponiveis(data, { ignorarBloqueios: true });
    }
    return isSabado(data)
      ? ["09:00 às 11:00", "11:30 às 13:00"]
      : ["08:00 às 10:00", "10:00 às 12:00", "13:00 às 15:00", "15:00 às 17:00"];
  }

  function formatarTelefoneWhatsApp(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") return window.formatarTelefoneWhatsApp(telefone);
    if (!telefone) return null;
    const nums = String(telefone).replace(/\D/g, "");
    if (nums.length === 10 || nums.length === 11) return `55${nums}`;
    return null;
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

  function calcularTempoAtendimento(chamado) {
    const historico = Array.isArray(chamado.historicoStatus) ? chamado.historicoStatus : [];
    const inicioIso =
      chamado.timestamp_Em_atendimento ||
      (historico.find((item) => item.status === "Em atendimento" && item.iso) || {}).iso;
    if (!inicioIso) return null;
    const inicio = new Date(inicioIso);
    if (Number.isNaN(inicio.getTime())) return null;
    const fim = new Date();
    const diffMin = Math.floor((fim - inicio) / 60000);
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    if (horas > 0) return `${horas}h ${minutos}min`;
    return `${minutos}min`;
  }

  async function atualizarChamadoSafe(numero, updates) {
    if (typeof window.atualizarChamado === "function") {
      await window.atualizarChamado(numero, updates);
      return;
    }
    const lista = parseArrayStorage("@chamados");
    const idx = lista.findIndex((item) => item.numero === numero);
    if (idx < 0) return;
    lista[idx] = { ...lista[idx], ...updates };
    saveArrayStorage("@chamados", lista);
  }

  function getChamadoByNumeroLocal(numero) {
    return parseArrayStorage("@chamados").find((item) => item.numero === numero) || null;
  }

  async function salvarRegistroFinanceiroSafe(registro) {
    if (typeof window.salvarRegistroFinanceiro === "function") {
      await window.salvarRegistroFinanceiro(registro);
      return;
    }
    const relatorios = parseArrayStorage("@relatorios");
    relatorios.unshift({
      id: `rel_${registro.numero}_${Date.now()}`,
      ...registro,
    });
    saveArrayStorage("@relatorios", relatorios);
  }

  async function notificarClientePush(chamado, titulo, corpo) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(chamado.clienteEmail);
        if (token) await window.enviarNotificacaoPush(token, titulo, corpo, { tela: "acompanharChamado" });
      }
    } catch (error) {
      console.log("Erro notificarCliente:", error);
    }
  }

  function abrirWhatsApp(chamado, mensagem) {
    const numero = formatarTelefoneWhatsApp(chamado.clienteTelefone);
    if (!numero) return;
    if (typeof window.abrirLinkWhatsApp === "function") {
      window.abrirLinkWhatsApp(numero, mensagem);
    } else {
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank");
    }
  }

  async function showConfirm(message) {
    return window.showAppConfirm(message);
  }

  function renderTelaChamadoDetalhes(root, props) {
    const selecionado = props && props.chamadoSelecionado ? props.chamadoSelecionado : null;
    const state = {
      chamado: selecionado ? { ...selecionado } : null,
      profissionais: [],
      observacao: selecionado?.observacaoTecnica || "",
      salvando: false,
      fotoExpandida: null,
      mostrarModalConclusao: false,
      formaPagamento: null,
      valorCobrado: "",
      mostrarModalReagendar: false,
      dias: [],
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      carregandoHorarios: false,
      diasLotados: {},
      tecnicoParaInicio: null,
      mostrarSelecaoTecnico: false,
      pollingChamado: null,
      pollingProfissionais: null,
      unsubChamado: null,
      unsubProf: null,
    };

    function fotosNormalizadas() {
      if (!Array.isArray(state.chamado?.fotos)) return [];
      return state.chamado.fotos.map(normalizarFotoUri).filter(Boolean);
    }

    function statusInfo() {
      return STATUS_CONFIG[state.chamado?.status] || STATUS_CONFIG["Aguardando técnico"];
    }

    function podeCancelar() {
      return state.chamado && state.chamado.status !== "Concluído" && state.chamado.status !== "Cancelado";
    }

    function podeReagendar() {
      return state.chamado && state.chamado.status !== "Concluído" && state.chamado.status !== "Cancelado";
    }

    async function iniciarReagendar() {
      state.dias = getProximosDiasSafe();
      state.diasLotados = {};
      state.diaSelecionado = null;
      state.horariosDisponiveis = [];
      state.horario = null;
      state.mostrarModalReagendar = true;
      render();

      const lotados = {};
      for (const dia of state.dias) {
        const horarios = await getHorariosDisponiveisSafe(dia);
        if (!horarios || horarios.length === 0) lotados[formatarDataChave(dia)] = true;
      }
      state.diasLotados = lotados;
      render();
    }

    async function selecionarDia(chaveDia) {
      const dia = state.dias.find((item) => formatarDataChave(item) === chaveDia);
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

    async function handleSalvarReagendamento() {
      if (!state.diaSelecionado || !state.horario) {
        window.showAppAlert("Atenção ❄\nSelecione o novo dia e horário.");
        return;
      }
      state.salvando = true;
      render();
      const novaData = formatarData(state.diaSelecionado);
      const novaChave = formatarDataChave(state.diaSelecionado);
      await atualizarChamadoSafe(state.chamado.numero, {
        dataFormatada: novaData,
        dataChave: novaChave,
        horario: state.horario,
      });
      state.chamado = { ...state.chamado, dataFormatada: novaData, dataChave: novaChave, horario: state.horario };
      state.salvando = false;
      state.mostrarModalReagendar = false;
      render();

      await notificarClientePush(
        state.chamado,
        "📅 Chamado reagendado!",
        `Seu chamado ${state.chamado.numero} foi reagendado para ${novaData} às ${state.horario}.`
      );

      const ok = await showConfirm("📲 Notificar cliente?\nDeseja enviar WhatsApp sobre o reagendamento?");
      if (ok) {
        const mensagem =
          `Olá, ${state.chamado.cliente}! 👋\n\n` +
          `📅 *Seu chamado foi reagendado!*\n\n` +
          `🔢 Chamado: ${state.chamado.numero}\n` +
          `📅 Nova data: ${novaData}\n` +
          `🕐 Novo horário: ${state.horario}\n` +
          `📍 Endereço: ${state.chamado.endereco}\n\n` +
          `Klenio Refrigeração ❄`;
        abrirWhatsApp(state.chamado, mensagem);
      }
    }

    async function handleAceitar() {
      state.salvando = true;
      render();
      const { data, hora } = getNowStr();
      const historicoStatus = [...(state.chamado.historicoStatus || []), { status: "Aceito", data, hora }];
      await atualizarChamadoSafe(state.chamado.numero, { status: "Aceito", historicoStatus });
      state.chamado = { ...state.chamado, status: "Aceito", historicoStatus };
      state.salvando = false;
      render();
      await notificarClientePush(
        state.chamado,
        "✅ Chamado aceito!",
        `Seu chamado ${state.chamado.numero} foi aceito pelo suporte.`
      );
      const ok = await showConfirm("📲 Notificar cliente?\nDeseja enviar WhatsApp?");
      if (ok) {
        const mensagem =
          `Olá, ${state.chamado.cliente}! 👋\n\n` +
          `✅ *Seu chamado foi aceito pelo suporte.*\n\n` +
          `🔢 Chamado: ${state.chamado.numero}\n` +
          `📅 Data: ${state.chamado.dataFormatada}\n` +
          `🕐 Horário: ${state.chamado.horario}\n\n` +
          `Klenio Refrigeração ❄`;
        abrirWhatsApp(state.chamado, mensagem);
      }
    }

    async function handleIniciarAtendimento() {
      const tecnico = state.tecnicoParaInicio || state.profissionais.find((p) => p.nome === state.chamado.tecnico);
      if (!tecnico) {
        state.mostrarSelecaoTecnico = true;
        render();
        window.showAppAlert("Atenção ❄\nSelecione o técnico responsável antes de iniciar.");
        return;
      }

      state.salvando = true;
      render();
      const { data, hora, iso } = getNowStr();
      const historicoStatus = [...(state.chamado.historicoStatus || []), { status: "Em atendimento", data, hora, iso }];
      const tecnicoNome = tecnico.nome || state.chamado.tecnico;
      await atualizarChamadoSafe(state.chamado.numero, {
        status: "Em atendimento",
        tecnico: tecnicoNome,
        tecnicoId: tecnico.id || state.chamado.tecnicoId || "",
        historicoStatus,
        timestamp_Em_atendimento: iso,
      });
      state.chamado = {
        ...state.chamado,
        status: "Em atendimento",
        tecnico: tecnicoNome,
        tecnicoId: tecnico.id || state.chamado.tecnicoId || "",
        historicoStatus,
        timestamp_Em_atendimento: iso,
      };
      state.salvando = false;
      state.mostrarSelecaoTecnico = false;
      render();

      await notificarClientePush(
        state.chamado,
        "🔧 Atendimento iniciado!",
        `O técnico ${tecnicoNome} iniciou o atendimento do chamado ${state.chamado.numero} às ${hora}.`
      );

      const ok = await showConfirm("📲 Notificar cliente?\nDeseja enviar WhatsApp?");
      if (ok) {
        const mensagem =
          `Olá, ${state.chamado.cliente}! 👋\n\n` +
          `🚚 *Técnico em deslocamento para atendimento!*\n\n` +
          `🔢 Chamado: ${state.chamado.numero}\n` +
          `📅 Data agendada: ${state.chamado.dataFormatada}\n` +
          `🕐 Janela: ${state.chamado.horario}\n` +
          `🕐 Início: ${data} às ${hora}\n` +
          `👷 Técnico: ${tecnicoNome}\n` +
          `📍 Endereço: ${state.chamado.endereco}\n` +
          `📡 Status: Técnico a caminho.\n\n` +
          `Klenio Refrigeração ❄`;
        abrirWhatsApp(state.chamado, mensagem);
      }
    }

    async function handleConfirmarConclusao() {
      if (!state.formaPagamento) {
        window.showAppAlert("Atenção ❄\nSelecione a forma de pagamento.");
        return;
      }
      if (!state.valorCobrado.trim()) {
        window.showAppAlert("Atenção ❄\nInforme o valor cobrado.");
        return;
      }

      state.salvando = true;
      state.mostrarModalConclusao = false;
      render();

      const { data, hora } = getNowStr();
      const historicoStatus = [...(state.chamado.historicoStatus || []), { status: "Concluído", data, hora }];
      const tempoAtendimento = calcularTempoAtendimento(state.chamado);

      const chamadoFinal = {
        ...state.chamado,
        status: "Concluído",
        observacaoTecnica: state.observacao,
        formaPagamento: state.formaPagamento,
        valorCobrado: state.valorCobrado.trim(),
        historicoStatus,
        dataConclusao: data,
        horaConclusao: hora,
        tempoAtendimento,
      };

      await atualizarChamadoSafe(state.chamado.numero, {
        status: "Concluído",
        observacaoTecnica: state.observacao,
        formaPagamento: state.formaPagamento,
        valorCobrado: state.valorCobrado.trim(),
        historicoStatus,
        dataConclusao: data,
        horaConclusao: hora,
        tempoAtendimento,
      });
      await salvarRegistroFinanceiroSafe({
        ...chamadoFinal,
        timestamp_Em_atendimento: state.chamado.timestamp_Em_atendimento,
      });
      state.chamado = chamadoFinal;
      state.salvando = false;
      render();

      await notificarClientePush(
        state.chamado,
        "🏁 Chamado concluído!",
        `Seu chamado ${state.chamado.numero} foi concluído. Valor: R$ ${state.valorCobrado.trim()}.`
      );

      const ok = await showConfirm("📲 Notificar cliente?\nDeseja enviar resumo no WhatsApp?");
      if (ok) {
        const isPix = state.formaPagamento === "Pix";
        const inicioAtendimento = state.chamado.timestamp_Em_atendimento
          ? new Date(state.chamado.timestamp_Em_atendimento)
          : null;
        const inicioAtendimentoFmt =
          inicioAtendimento && !Number.isNaN(inicioAtendimento.getTime())
            ? `${inicioAtendimento.toLocaleDateString("pt-BR")} às ${inicioAtendimento.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : null;
        const mensagem =
          `Olá, ${state.chamado.cliente}! 👋\n\n` +
          `🏁 *Seu atendimento foi concluído!*\n\n` +
          `📋 *Resumo*\n━━━━━━━━━━━━━━━━━━\n` +
          `🔢 Chamado: ${state.chamado.numero}\n` +
          `🔧 Problema(s): ${(state.chamado.tipos || []).join(", ")}\n` +
          `📍 Endereço: ${state.chamado.endereco}\n` +
          `📅 Data: ${state.chamado.dataFormatada}\n` +
          `🕐 Horário: ${state.chamado.horario}\n` +
          (inicioAtendimentoFmt ? `🕐 Início do atendimento: ${inicioAtendimentoFmt}\n` : "") +
          `👷 Técnico: ${state.chamado.tecnico || "-"}\n` +
          `⏱️ Tempo total: ${tempoAtendimento || "Não informado"}\n` +
          (state.observacao ? `📝 Observação: ${state.observacao}\n` : "") +
          `━━━━━━━━━━━━━━━━━━\n` +
          `💰 Valor: R$ ${state.valorCobrado.trim()}\n` +
          `💳 Forma: ${state.formaPagamento}\n` +
          (isPix
            ? "📱 Chave Pix: 81986967254\n👤 Titular: Klenio Pereira de Melo\n\nEnvie o comprovante ✅\n"
            : "") +
          `━━━━━━━━━━━━━━━━━━\n\nKlenio Refrigeração`;
        abrirWhatsApp(state.chamado, mensagem);
      }

      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    async function handleSalvarObservacao() {
      state.salvando = true;
      render();
      await atualizarChamadoSafe(state.chamado.numero, { observacaoTecnica: state.observacao });
      state.chamado = { ...state.chamado, observacaoTecnica: state.observacao };
      state.salvando = false;
      render();
      window.showAppAlert("Salvo!\nObservação técnica salva com sucesso.");
    }

    async function handleCancelar() {
      const ok = await showConfirm("Tem certeza que deseja cancelar este chamado?");
      if (!ok) return;
      state.salvando = true;
      render();
      const { data, hora } = getNowStr();
      const historicoStatus = [...(state.chamado.historicoStatus || []), { status: "Cancelado", data, hora }];
      await atualizarChamadoSafe(state.chamado.numero, { status: "Cancelado", historicoStatus });
      state.chamado = { ...state.chamado, status: "Cancelado", historicoStatus };
      state.salvando = false;
      render();

      await notificarClientePush(
        state.chamado,
        "❌ Chamado cancelado",
        `Seu chamado ${state.chamado.numero} foi cancelado pelo suporte.`
      );
      const avisar = await showConfirm("📲 Notificar cliente?\nDeseja enviar WhatsApp sobre cancelamento?");
      if (avisar) {
        const mensagem =
          `Olá, ${state.chamado.cliente}! 👋\n\n` +
          `❌ *Seu chamado foi cancelado pelo suporte.*\n\n` +
          `🔢 Chamado: ${state.chamado.numero}\n` +
          `📅 Data: ${state.chamado.dataFormatada}\n` +
          `🕐 Horário: ${state.chamado.horario}\n\n` +
          `Klenio Refrigeração ❄`;
        abrirWhatsApp(state.chamado, mensagem);
      }
      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    function renderHistoricoStatus() {
      if (!Array.isArray(state.chamado.historicoStatus) || state.chamado.historicoStatus.length === 0) return "";
      return `
        <article class="ch-card ad-card">
          <h2 class="ch-title">📋 Histórico de status</h2>
          <div class="ad-history-list">
            ${state.chamado.historicoStatus
              .map((item) => {
                const conf = STATUS_CONFIG[item.status] || { icone: "📌", cor: "#7f8c8d" };
                return `
                  <div class="ad-history-item">
                    <span class="ad-history-icon" style="background:${conf.cor}22;border-color:${conf.cor}44">${conf.icone}</span>
                    <span>
                      <span class="ad-history-title" style="color:${conf.cor}">${escapeHtml(item.status)}</span><br />
                      <span class="ad-history-time">${escapeHtml(item.data)} às ${escapeHtml(item.hora)}</span>
                    </span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </article>
      `;
    }

    function renderFotos() {
      const fotos = fotosNormalizadas();
      if (fotos.length === 0) return "";
      return `
        <div>
          <div class="ad-fotos-head">
            <span>📷</span>
            <span>Fotos do cliente (${fotos.length})</span>
          </div>
          <div class="ad-fotos-row">
            ${fotos
              .map(
                (uri, index) => `
                  <button class="ad-foto-btn" data-action="expandir-foto" data-index="${index}" type="button">
                    <img src="${uri}" alt="Foto ${index + 1}" />
                    <span class="ad-foto-zoom">🔍 Ver</span>
                    <span class="ad-foto-order">${index + 1}/${fotos.length}</span>
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    function renderModalFoto() {
      if (!state.fotoExpandida) return "";
      const fotos = fotosNormalizadas();
      return `
        <div class="ch-modal" id="ad-modal-foto">
          <img class="ch-modal-img" src="${state.fotoExpandida}" alt="Foto ampliada" />
          ${
            fotos.length > 1
              ? `
                <div class="ch-modal-thumbs">
                  ${fotos
                    .map(
                      (uri, index) => `
                        <img
                          class="ch-modal-thumb${state.fotoExpandida === uri ? " is-selected" : ""}"
                          src="${uri}"
                          data-action="foto-thumb"
                          data-index="${index}"
                          alt="Miniatura ${index + 1}"
                        />
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }
          <p class="ch-modal-close">Toque para fechar</p>
        </div>
      `;
    }

    function renderModalConclusao() {
      if (!state.mostrarModalConclusao) return "";
      return `
        <div class="ad-sheet-overlay">
          <div class="ad-sheet">
            <div class="ad-sheet-head">
              <h3>🏁 Concluir Chamado</h3>
              <button data-action="fechar-conclusao" type="button">✕</button>
            </div>
            <p class="ad-sheet-sub">Informe os dados de pagamento para enviar ao cliente.</p>

            <label class="ch-input-label">Forma de pagamento <span style="color:#e74c3c">*</span></label>
            <div class="ad-pay-options">
              ${FORMAS_PAGAMENTO.map((fp) => {
                const sel = state.formaPagamento === fp.label;
                return `
                  <button class="ad-pay-option${sel ? " is-selected" : ""}" data-action="select-pagamento" data-label="${escapeHtml(fp.label)}" type="button">
                    <span>${fp.icone}</span>
                    <span>${escapeHtml(fp.label)}</span>
                    ${sel ? "<span>✓</span>" : ""}
                  </button>
                `;
              }).join("")}
            </div>

            <label class="ch-input-label">Valor cobrado (R$) <span style="color:#e74c3c">*</span></label>
            <div class="ch-input-wrap">
              <span class="ch-input-icon">💰</span>
              <input id="ad-valor" class="ch-input" value="${escapeHtml(state.valorCobrado)}" placeholder="Ex: 350,00" />
            </div>

            <div class="ad-sheet-actions">
              <button class="op-btn cancel" data-action="fechar-conclusao" type="button">Cancelar</button>
              <button class="op-btn primary" data-action="confirmar-conclusao" type="button" ${state.salvando ? "disabled" : ""}>
                ${state.salvando ? '<span class="op-spinner"></span>' : "🏁 Concluir e notificar cliente"}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function renderModalReagendar() {
      if (!state.mostrarModalReagendar) return "";
      return `
        <div class="ad-sheet-overlay">
          <div class="ad-sheet ad-sheet-large">
            <div class="ad-sheet-head">
              <h3>📅 Reagendar Chamado</h3>
              <button data-action="fechar-reagendar" type="button">✕</button>
            </div>
            <p class="ch-sub">Selecione o novo dia</p>
            <div class="ad-dias-scroll">
              ${state.dias
                .map((dia) => {
                  const chave = formatarDataChave(dia);
                  const lotado = !!state.diasLotados[chave];
                  const sel = state.diaSelecionado && formatarDataChave(state.diaSelecionado) === chave;
                  return `
                    <button
                      class="ad-dia-btn${sel ? " is-selected" : ""}${lotado ? " is-lotado" : ""}"
                      data-action="reagendar-dia"
                      data-chave="${chave}"
                      type="button"
                      ${lotado ? "disabled" : ""}
                    >
                      <span class="ad-dia-week${isSabado(dia) ? " is-sabado" : ""}">${dia.toLocaleDateString("pt-BR", { weekday: "short" })}</span>
                      <span class="ad-dia-num">${dia.getDate()}</span>
                      <span class="ad-dia-month">${dia.toLocaleDateString("pt-BR", { month: "short" })}</span>
                      ${lotado ? '<span class="ad-dia-lotado">Lotado</span>' : ""}
                    </button>
                  `;
                })
                .join("")}
            </div>

            ${
              state.diaSelecionado
                ? `
                  <div class="ad-horarios-wrap">
                    <p class="ch-sub">Horários disponíveis</p>
                    ${
                      state.carregandoHorarios
                        ? '<div class="ch-spinner"></div>'
                        : state.horariosDisponiveis.length === 0
                          ? '<p class="ad-muted">❄ Nenhum horário disponível</p>'
                          : state.horariosDisponiveis
                              .map((h) => {
                                const sel = state.horario === h;
                                return `
                                  <button class="ad-horario-btn${sel ? " is-selected" : ""}" data-action="reagendar-horario" data-horario="${escapeHtml(h)}" type="button">
                                    <span>🕐</span>
                                    <span>${escapeHtml(h)}</span>
                                    ${sel ? "<span>✓</span>" : ""}
                                  </button>
                                `;
                              })
                              .join("")
                    }
                  </div>
                `
                : ""
            }

            <div class="ad-sheet-actions">
              <button class="op-btn cancel" data-action="fechar-reagendar" type="button">Cancelar</button>
              <button
                class="op-btn primary"
                data-action="salvar-reagendar"
                type="button"
                ${state.salvando || !state.diaSelecionado || !state.horario ? "disabled" : ""}
              >
                ${state.salvando ? '<span class="op-spinner"></span>' : "💾 Salvar novo horário"}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function renderCorpo() {
      const status = statusInfo();
      const tipos = Array.isArray(state.chamado.tipos) ? state.chamado.tipos : [];
      return `
        <header class="ch-header">
          <div>
            <span class="ch-header-empresa">Klenio Refrigeração</span>
            <h1 class="ch-header-nome">Detalhes do Chamado</h1>
          </div>
          <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
        </header>

        ${
          state.chamado.geradoDeOrcamento
            ? `
              <div class="ad-banner-orc">
                <span>🔗</span>
                <span>
                  <strong>Gerado de orçamento aprovado</strong><br />
                  <small>${escapeHtml(state.chamado.geradoDeOrcamento)}</small>
                </span>
              </div>
            `
            : ""
        }

        <article class="ch-card ad-status-card" style="border-color:${status.cor}">
          <span class="ad-status-icon">${status.icone}</span>
          <span style="flex:1">
            <span class="ad-status-label">Status atual</span><br />
            <span class="ad-status-value" style="color:${status.cor}">${escapeHtml(state.chamado.status)}</span>
            ${
              state.chamado.dataCriacao
                ? `<br /><span class="ad-status-sub">Aberto em ${escapeHtml(state.chamado.dataCriacao)}</span>`
                : ""
            }
          </span>
          ${
            state.chamado.urgencia === "Urgente"
              ? '<span class="ad-urgent-pill">🚨 URGENTE</span>'
              : ""
          }
        </article>

        ${renderHistoricoStatus()}

        <article class="ch-card ad-card">
          <h2 class="ch-title">Informações do chamado</h2>
          <div class="ad-grid">
            <div class="ad-grid-row"><span>Número</span><strong>${escapeHtml(state.chamado.numero)}</strong></div>
            <div class="ad-grid-row"><span>Cliente</span><span>${escapeHtml(state.chamado.cliente || "-")}</span></div>
            <div class="ad-grid-row"><span>Telefone</span><span>${escapeHtml(state.chamado.clienteTelefone || "Não informado")}</span></div>
            <div class="ad-grid-row"><span>Data</span><span>${escapeHtml(state.chamado.dataFormatada || "-")}</span></div>
            <div class="ad-grid-row"><span>Horário</span><span>${escapeHtml(state.chamado.horario || "-")}</span></div>
            <div class="ad-grid-row"><span>Endereço</span><span>${escapeHtml(state.chamado.endereco || "-")}</span></div>
            ${
              state.chamado.tempoAtendimento
                ? `<div class="ad-grid-row"><span>Tempo atendimento</span><strong style="color:#27ae60">⏱️ ${escapeHtml(state.chamado.tempoAtendimento)}</strong></div>`
                : ""
            }
            ${
              tipos.length
                ? `<div>
                    <p class="ad-small-label">Problemas</p>
                    <div class="ad-tags">${tipos.map((t) => `<span class="ad-tag">${escapeHtml(t)}</span>`).join("")}</div>
                   </div>`
                : ""
            }
            ${
              state.chamado.detalhes
                ? `<div>
                    <p class="ad-small-label">Detalhes</p>
                    <div class="ad-box"><p>${escapeHtml(state.chamado.detalhes)}</p></div>
                   </div>`
                : ""
            }
            ${renderFotos()}
            ${
              state.chamado.tecnico
                ? `<div class="ad-grid-row"><span>Técnico</span><span>👷 ${escapeHtml(state.chamado.tecnico)}</span></div>`
                : ""
            }
            ${
              state.chamado.geradoDeOrcamento && state.chamado.valorOrcamento
                ? `
                  <div class="ad-box ad-box-purple">
                    <p><strong>🔗 Dados do orçamento aprovado</strong></p>
                    ${state.chamado.tipoServico ? `<p>Serviço: ${escapeHtml(state.chamado.tipoServico)}</p>` : ""}
                    ${state.chamado.tipoAparelho ? `<p>Aparelho: ${escapeHtml(state.chamado.tipoAparelho)} • ${escapeHtml(state.chamado.btu)} BTUs</p>` : ""}
                    <p style="color:#27ae60;font-weight:700">Valor orçado: R$ ${escapeHtml(state.chamado.valorOrcamento)}</p>
                  </div>
                `
                : ""
            }
            ${
              state.chamado.status === "Concluído" && state.chamado.valorCobrado
                ? `
                  <div class="ad-box ad-box-green">
                    <p><strong>💰 Pagamento</strong></p>
                    <div class="ad-grid-row"><span>Valor cobrado</span><strong style="color:#27ae60">R$ ${escapeHtml(state.chamado.valorCobrado)}</strong></div>
                    <div class="ad-grid-row"><span>Forma</span><span>${escapeHtml(state.chamado.formaPagamento || "-")}</span></div>
                  </div>
                `
                : ""
            }
          </div>
        </article>

        ${
          state.chamado.status === "Aguardando técnico"
            ? `
              <button class="op-btn success ad-main-action" data-action="aceitar" type="button" ${state.salvando ? "disabled" : ""}>
                ${state.salvando ? '<span class="op-spinner"></span>' : "✅ Aceitar Chamado"}
              </button>
            `
            : ""
        }

        ${
          state.chamado.status === "Aceito" || state.chamado.status === "Em atendimento"
            ? `
              <article class="ch-card ad-card">
                <h2 class="ch-title">Observação técnica</h2>
                <p class="ch-sub">Adicione observações sobre o atendimento</p>
                ${
                  state.chamado.tecnico
                    ? `<p class="ad-tech-pill">👷 ${escapeHtml(state.chamado.tecnico)}</p>`
                    : ""
                }
                <textarea id="ad-observacao" class="ch-textarea" placeholder="Descreva o que foi verificado...">${escapeHtml(state.observacao)}</textarea>
                <button class="op-btn primary" data-action="salvar-observacao" type="button" style="margin-top:12px" ${state.salvando ? "disabled" : ""}>
                  💾 Salvar observação
                </button>
              </article>
            `
            : ""
        }

        ${
          state.chamado.status === "Aceito"
            ? `
              <article class="ch-card ad-card">
                <h2 class="ch-title">Iniciar Atendimento</h2>
                <p class="ch-sub">Selecione o técnico responsável para iniciar.</p>
                ${
                  state.tecnicoParaInicio
                    ? `
                      <div class="ad-tech-selected">
                        <span>👷</span>
                        <span style="flex:1">${escapeHtml(state.tecnicoParaInicio.nome)}</span>
                        <button data-action="limpar-tecnico" type="button">Trocar</button>
                      </div>
                    `
                    : `
                      <button class="ad-tech-required" data-action="toggle-lista-tecnicos" type="button">
                        👷 Selecionar técnico (obrigatório)
                      </button>
                    `
                }

                ${
                  state.mostrarSelecaoTecnico
                    ? `
                      <div class="ad-tech-list">
                        <div class="ad-tech-head">
                          <strong>Selecionar profissional</strong>
                          <button data-action="fechar-lista-tecnicos" type="button">✕</button>
                        </div>
                        ${
                          state.profissionais.length === 0
                            ? '<p class="ad-muted" style="padding:16px">Nenhum profissional cadastrado.</p>'
                            : state.profissionais
                                .map(
                                  (prof, idx) => `
                                    <button class="ad-tech-item" data-action="selecionar-tecnico" data-index="${idx}" type="button">
                                      <span>👷</span>
                                      <span style="flex:1">
                                        <strong>${escapeHtml(prof.nome)}</strong>
                                        ${
                                          prof.especialidade
                                            ? `<br /><small>${escapeHtml(prof.especialidade)}</small>`
                                            : ""
                                        }
                                      </span>
                                    </button>
                                  `
                                )
                                .join("")
                        }
                      </div>
                    `
                    : ""
                }

                <button class="op-btn primary" data-action="iniciar-atendimento" type="button" ${
                  state.salvando || !state.tecnicoParaInicio ? "disabled" : ""
                }>
                  ${
                    state.salvando
                      ? '<span class="op-spinner"></span>'
                      : state.tecnicoParaInicio
                        ? "🔧 Iniciar Atendimento"
                        : "⚠️ Selecione o técnico primeiro"
                  }
                </button>
              </article>
            `
            : ""
        }

        ${
          state.chamado.status === "Em atendimento"
            ? `
              <button class="op-btn primary ad-main-action" data-action="abrir-conclusao" type="button" style="background:#8e44ad" ${state.salvando ? "disabled" : ""}>
                ${state.salvando ? '<span class="op-spinner"></span>' : "🏁 Concluir Chamado"}
              </button>
            `
            : ""
        }

        ${
          podeReagendar()
            ? `
              <button class="ad-btn-outline" data-action="abrir-reagendar" type="button" ${state.salvando ? "disabled" : ""}>
                📅 Reagendar Chamado
              </button>
            `
            : ""
        }

        ${
          podeCancelar()
            ? `
              <button class="ad-btn-danger" data-action="cancelar-chamado" type="button" ${state.salvando ? "disabled" : ""}>
                ❌ Cancelar Chamado
              </button>
            `
            : ""
        }
      `;
    }

    function bindEvents() {
      root.querySelector(".ad-screen").addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "aceitar") {
          handleAceitar();
          return;
        }
        if (action === "salvar-observacao") {
          handleSalvarObservacao();
          return;
        }
        if (action === "toggle-lista-tecnicos") {
          state.mostrarSelecaoTecnico = !state.mostrarSelecaoTecnico;
          render();
          return;
        }
        if (action === "fechar-lista-tecnicos") {
          state.mostrarSelecaoTecnico = false;
          render();
          return;
        }
        if (action === "selecionar-tecnico") {
          const prof = state.profissionais[Number(actionEl.dataset.index)];
          if (!prof) return;
          state.tecnicoParaInicio = prof;
          state.mostrarSelecaoTecnico = false;
          render();
          return;
        }
        if (action === "limpar-tecnico") {
          state.tecnicoParaInicio = null;
          state.mostrarSelecaoTecnico = true;
          render();
          return;
        }
        if (action === "iniciar-atendimento") {
          handleIniciarAtendimento();
          return;
        }
        if (action === "abrir-conclusao") {
          state.mostrarModalConclusao = true;
          render();
          return;
        }
        if (action === "fechar-conclusao") {
          state.mostrarModalConclusao = false;
          render();
          return;
        }
        if (action === "select-pagamento") {
          state.formaPagamento = actionEl.dataset.label;
          render();
          return;
        }
        if (action === "confirmar-conclusao") {
          handleConfirmarConclusao();
          return;
        }
        if (action === "abrir-reagendar") {
          iniciarReagendar();
          return;
        }
        if (action === "fechar-reagendar") {
          state.mostrarModalReagendar = false;
          render();
          return;
        }
        if (action === "reagendar-dia") {
          selecionarDia(actionEl.dataset.chave);
          return;
        }
        if (action === "reagendar-horario") {
          state.horario = actionEl.dataset.horario;
          render();
          return;
        }
        if (action === "salvar-reagendar") {
          handleSalvarReagendamento();
          return;
        }
        if (action === "cancelar-chamado") {
          handleCancelar();
          return;
        }
        if (action === "expandir-foto") {
          const idx = Number(actionEl.dataset.index);
          const fotos = fotosNormalizadas();
          state.fotoExpandida = fotos[idx] || null;
          render();
          return;
        }
        if (action === "foto-thumb") {
          const idx = Number(actionEl.dataset.index);
          const fotos = fotosNormalizadas();
          state.fotoExpandida = fotos[idx] || null;
          render();
        }
      });

      const observacaoInput = root.querySelector("#ad-observacao");
      if (observacaoInput) {
        observacaoInput.addEventListener("input", function () {
          state.observacao = observacaoInput.value;
        });
      }

      const valorInput = root.querySelector("#ad-valor");
      if (valorInput) {
        valorInput.addEventListener("input", function () {
          state.valorCobrado = valorInput.value.replace(/[^0-9.,]/g, "");
        });
      }

      const modalFoto = root.querySelector("#ad-modal-foto");
      if (modalFoto) {
        modalFoto.addEventListener("click", function (event) {
          const thumb = event.target.closest("[data-action='foto-thumb']");
          if (thumb) {
            const idx = Number(thumb.dataset.index);
            const fotos = fotosNormalizadas();
            state.fotoExpandida = fotos[idx] || state.fotoExpandida;
            render();
            return;
          }
          state.fotoExpandida = null;
          render();
        });
      }
    }

    function render() {
      if (!state.chamado) {
        root.innerHTML = `
          <section class="ad-screen">
            <div class="ad-fundos" id="ad-fundos"></div>
            <div class="ad-scroll">
              <div class="dc-empty">
                <p>❄</p>
                <h2>Nenhum chamado selecionado</h2>
                <p>Volte ao painel para selecionar um chamado.</p>
                <button class="ch-btn-main" id="ad-back-empty" type="button">Voltar</button>
              </div>
            </div>
          </section>
        `;
        criarFlocosFundo(root.querySelector("#ad-fundos"), "ad");
        root.querySelector("#ad-back-empty").addEventListener("click", function () {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
        });
        return;
      }

      root.innerHTML = `
        <section class="ad-screen">
          <div class="ad-fundos" id="ad-fundos"></div>
          <div class="ad-scroll" id="ad-content">
            ${renderCorpo()}
            <div style="height:20px"></div>
          </div>
          ${renderModalFoto()}
          ${renderModalConclusao()}
          ${renderModalReagendar()}
        </section>
      `;
      criarFlocosFundo(root.querySelector("#ad-fundos"), "ad");
      bindEvents();
    }

    function iniciarAssinaturas() {
      if (!state.chamado || !state.chamado.numero) return;

      if (typeof window.ouvirChamado === "function") {
        const unsub = window.ouvirChamado(state.chamado.numero, function (atualizado) {
          state.chamado = atualizado || state.chamado;
          state.observacao = state.chamado.observacaoTecnica || state.observacao;
          render();
        });
        if (typeof unsub === "function") state.unsubChamado = unsub;
      } else {
        state.pollingChamado = setInterval(function () {
          const atual = getChamadoByNumeroLocal(state.chamado.numero);
          if (!atual) return;
          state.chamado = atual;
          state.observacao = atual.observacaoTecnica || state.observacao;
          render();
        }, 3000);
      }

      if (typeof window.ouvirProfissionais === "function") {
        const unsub = window.ouvirProfissionais(function (lista) {
          state.profissionais = lista || [];
          render();
        });
        if (typeof unsub === "function") state.unsubProf = unsub;
      } else {
        state.profissionais = parseArrayStorage("@profissionais");
        state.pollingProfissionais = setInterval(function () {
          state.profissionais = parseArrayStorage("@profissionais");
          render();
        }, 4000);
      }
    }

    render();
    iniciarAssinaturas();

    return function cleanupChamadoDetalhes() {
      if (typeof state.unsubChamado === "function") {
        try {
          state.unsubChamado();
        } catch (error) {}
      }
      if (typeof state.unsubProf === "function") {
        try {
          state.unsubProf();
        } catch (error) {}
      }
      if (state.pollingChamado) clearInterval(state.pollingChamado);
      if (state.pollingProfissionais) clearInterval(state.pollingProfissionais);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.chamadoDetalhes = renderTelaChamadoDetalhes;
})();
