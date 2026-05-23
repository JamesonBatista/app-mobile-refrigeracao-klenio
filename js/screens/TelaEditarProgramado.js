// js/screens/TelaEditarProgramado.js

(function () {
  const STATUS_CONFIG = {
    Agendado: { icone: "📅", cor: "#f39c12" },
    Contestado: { icone: "⚠️", cor: "#e67e22" },
    Respondido: { icone: "💬", cor: "#2980b9" },
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

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

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

  function isSabado(data) {
    if (typeof window.isSabado === "function") return window.isSabado(data);
    return data.getDay() === 6;
  }

  function formatarData(data) {
    if (typeof window.formatarData === "function") return window.formatarData(data);
    return data.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  }

  function formatarDataChave(data) {
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
    return isSabado(data)
      ? ["09:00 às 11:00", "11:30 às 13:00"]
      : ["08:00 às 10:00", "10:00 às 12:00", "13:00 às 15:00", "15:00 às 17:00"];
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

  function formatarTelefoneWhatsApp(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") {
      return window.formatarTelefoneWhatsApp(telefone);
    }
    if (!telefone) return null;
    const nums = telefone.replace(/\D/g, "");
    if (nums.length === 11 || nums.length === 10) return `55${nums}`;
    return null;
  }

  function calcularTempoAtendimento(timestampInicio) {
    if (!timestampInicio) return null;
    const inicio = new Date(timestampInicio);
    const fim = new Date();
    const diffMs = fim - inicio;
    const diffMin = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;
    if (horas > 0) return `${horas}h ${minutos}min`;
    return `${minutos}min`;
  }

  function updateProgramadoLocal(numero, updates) {
    try {
      const raw = localStorage.getItem("@programados");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...updates };
        localStorage.setItem("@programados", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  async function atualizarProgramadoSafe(numero, updates) {
    if (typeof window.atualizarProgramado === "function") {
      await window.atualizarProgramado(numero, updates);
      return;
    }
    updateProgramadoLocal(numero, updates);
  }

  async function editarProgramadoSafe(numero, updates) {
    if (typeof window.editarProgramado === "function") {
      await window.editarProgramado(numero, updates);
      return;
    }
    updateProgramadoLocal(numero, updates);
  }

  async function cancelarProgramadoSafe(numero) {
    if (typeof window.cancelarProgramado === "function") {
      await window.cancelarProgramado(numero);
      return;
    }
    updateProgramadoLocal(numero, { status: "Cancelado" });
  }

  async function excluirProgramadoSafe(numero) {
    if (typeof window.excluirProgramado === "function") {
      await window.excluirProgramado(numero);
      return;
    }
    try {
      const raw = localStorage.getItem("@programados");
      const lista = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        "@programados",
        JSON.stringify(lista.filter((item) => item.numero !== numero))
      );
    } catch (error) {}
  }

  function loadProfissionaisLocal() {
    try {
      const raw = localStorage.getItem("@profissionais");
      const lista = raw ? JSON.parse(raw) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (error) {
      return [];
    }
  }

  async function salvarRegistroFinanceiroSafe(chamado) {
    if (typeof window.salvarRegistroFinanceiro === "function") {
      await window.salvarRegistroFinanceiro(chamado);
      return;
    }
    try {
      const raw = localStorage.getItem("@relatorios");
      const lista = raw ? JSON.parse(raw) : [];
      lista.unshift({
        id: `rel_${chamado.numero}_${Date.now()}`,
        ...chamado,
      });
      localStorage.setItem("@relatorios", JSON.stringify(lista));
    } catch (error) {}
  }

  async function notificarPush(programado, titulo, corpo) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(programado.clienteEmail);
        if (token) {
          await window.enviarNotificacaoPush(token, titulo, corpo, { tela: "programadoCliente" });
        }
      }
    } catch (error) {
      console.log("Erro push:", error);
    }
  }

  function notificarWA(programado, mensagem) {
    const numero = formatarTelefoneWhatsApp(programado.clienteTelefone);
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

  async function perguntarWA(programado, mensagem, onDepois) {
    const ok = await showConfirm("📲 Notificar via WhatsApp?\nDeseja enviar mensagem para o cliente?");
    if (ok) notificarWA(programado, mensagem);
    if (typeof onDepois === "function") onDepois();
  }

  function renderTelaEditarProgramado(root, props) {
    const selecionado = props && props.programadoSelecionado ? props.programadoSelecionado : null;
    if (!selecionado) {
      root.innerHTML = `
        <section class="ep-screen">
          <div class="ep-empty-wrap">
            <div>
              <p class="ep-empty-title">Nenhum agendamento selecionado.</p>
              <button class="ep-empty-link" id="ep-voltar-vazio" type="button">← Voltar</button>
            </div>
          </div>
        </section>
      `;
      root.querySelector("#ep-voltar-vazio").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
      });
      return;
    }

    const state = {
      programado: { ...selecionado },
      salvando: false,
      editandoData: false,
      dias: [],
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      carregandoHorarios: false,
      diasLotados: {},
      profissionais: [],
      observacao: selecionado.observacaoTecnica || "",
      mostrarConclusao: false,
      formaPagamento: null,
      valorCobrado: "",
      mostrarSelecaoTecnicoInicio: false,
      tecnicoParaInicio: null,
      unsubProfissionais: null,
      pollingProfissionais: null,
    };

    function statusInfo() {
      return STATUS_CONFIG[state.programado.status] || STATUS_CONFIG.Agendado;
    }

    function podeReagendar() {
      return !["Cancelado", "Concluído", "Em atendimento"].includes(state.programado.status);
    }

    function podeCancelar() {
      return !["Cancelado", "Concluído"].includes(state.programado.status);
    }

    function podeExcluir() {
      return ["Cancelado", "Concluído"].includes(state.programado.status);
    }

    async function iniciarEdicao() {
      state.editandoData = true;
      state.dias = getProximosDiasSafe();
      state.diasLotados = {};
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
      const dia = state.dias.find((d) => formatarDataChave(d) === chaveDia);
      if (!dia) return;
      state.diaSelecionado = dia;
      state.horario = null;
      state.carregandoHorarios = true;
      render();
      const h = await getHorariosDisponiveisSafe(dia);
      state.horariosDisponiveis = h || [];
      state.carregandoHorarios = false;
      render();
    }

    async function handleSalvarEdicao() {
      if (!state.diaSelecionado || !state.horario) {
        window.showAppAlert("Atenção ❄\nSelecione o novo dia e horário.");
        return;
      }
      state.salvando = true;
      render();

      const novaData = formatarData(state.diaSelecionado);
      const novaChave = formatarDataChave(state.diaSelecionado);

      await editarProgramadoSafe(state.programado.numero, {
        dataFormatada: novaData,
        dataChave: novaChave,
        horario: state.horario,
      });

      state.programado = {
        ...state.programado,
        dataFormatada: novaData,
        dataChave: novaChave,
        horario: state.horario,
      };
      state.salvando = false;
      state.editandoData = false;
      render();

      await notificarPush(
        state.programado,
        "📅 Agendamento reagendado!",
        `Seu agendamento ${state.programado.numero} foi reagendado para ${novaData} às ${state.horario}.`
      );

      const msg =
        `Olá, ${state.programado.cliente}! 👋\n\n` +
        `📅 *Seu agendamento foi reagendado!*\n\n` +
        `📋 *Detalhes*\n━━━━━━━━━━━━━━━━━━\n` +
        `🔢 Número: ${state.programado.numero}\n` +
        `🛠️ Tipo: ${state.programado.tipo}\n` +
        `📍 Endereço: ${state.programado.endereco}\n` +
        `📅 Nova data: ${novaData}\n` +
        `🕐 Novo horário: ${state.horario}\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `Acesse o app para confirmar ou contestar.\n\nKlenio Refrigeração ❄`;

      await perguntarWA(state.programado, msg);
    }

    async function handleSalvarObservacao() {
      state.salvando = true;
      render();
      await atualizarProgramadoSafe(state.programado.numero, {
        observacaoTecnica: state.observacao,
      });
      state.programado = { ...state.programado, observacaoTecnica: state.observacao };
      state.salvando = false;
      render();
      window.showAppAlert("Salvo! ❄\nObservação técnica salva com sucesso.");
    }

    async function handleIniciarAtendimento() {
      const tecnico = state.tecnicoParaInicio || state.profissionais.find((p) => p.nome === state.programado.tecnico);
      if (!tecnico) {
        state.mostrarSelecaoTecnicoInicio = true;
        render();
        window.showAppAlert("Atenção ❄\nSelecione o técnico responsável para iniciar o atendimento.");
        return;
      }

      state.salvando = true;
      render();

      const { data, hora, iso } = getNowStr();
      const hist = [...(state.programado.historicoStatus || []), { status: "Em atendimento", data, hora }];
      const tecnicoNome = tecnico.nome || state.programado.tecnico;

      await atualizarProgramadoSafe(state.programado.numero, {
        status: "Em atendimento",
        tecnico: tecnicoNome,
        tecnicoId: tecnico.id || state.programado.tecnicoId || "",
        historicoStatus: hist,
        timestamp_Em_atendimento: iso,
      });

      state.programado = {
        ...state.programado,
        status: "Em atendimento",
        tecnico: tecnicoNome,
        tecnicoId: tecnico.id || state.programado.tecnicoId || "",
        historicoStatus: hist,
        timestamp_Em_atendimento: iso,
      };
      state.mostrarSelecaoTecnicoInicio = false;
      state.salvando = false;
      render();

      await notificarPush(
        state.programado,
        "🔧 Atendimento iniciado!",
        `O técnico ${tecnicoNome} está a caminho para o agendamento ${state.programado.numero}.`
      );

      const msg =
        `Olá, ${state.programado.cliente}! 👋\n\n` +
        `🔔 *Atualização do seu agendamento!*\n\n` +
        `📋 *Detalhes*\n━━━━━━━━━━━━━━━━━━\n` +
        `🔢 Número: ${state.programado.numero}\n` +
        `🔧 Problema(s): ${state.programado.tipo}\n` +
        `📍 Endereço: ${state.programado.endereco}\n` +
        `📅 Data: ${state.programado.dataFormatada}\n` +
        `🕐 Horário: ${state.programado.horario}\n` +
        `👷 Técnico: ${tecnicoNome}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔄 Novo status: Em atendimento (Técnico está a caminho)\n\n` +
        `Klenio Refrigeração ❄`;

      await perguntarWA(state.programado, msg);
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
      render();

      const { data, hora } = getNowStr();
      const hist = [...(state.programado.historicoStatus || []), { status: "Concluído", data, hora }];
      const tempoAtendimento = calcularTempoAtendimento(state.programado.timestamp_Em_atendimento);

      const programadoFinal = {
        ...state.programado,
        status: "Concluído",
        observacaoTecnica: state.observacao,
        formaPagamento: state.formaPagamento,
        valorCobrado: state.valorCobrado.trim(),
        historicoStatus: hist,
        dataConclusao: data,
        horaConclusao: hora,
        tempoAtendimento,
      };

      await atualizarProgramadoSafe(state.programado.numero, {
        status: "Concluído",
        observacaoTecnica: state.observacao,
        formaPagamento: state.formaPagamento,
        valorCobrado: state.valorCobrado.trim(),
        historicoStatus: hist,
        dataConclusao: data,
        horaConclusao: hora,
        tempoAtendimento,
      });

      await salvarRegistroFinanceiroSafe({
        ...programadoFinal,
        numero: programadoFinal.numero,
        tipos: programadoFinal.tipos || [programadoFinal.tipo],
        timestamp_Em_atendimento: programadoFinal.timestamp_Em_atendimento,
      });

      state.programado = programadoFinal;
      state.salvando = false;
      state.mostrarConclusao = false;
      render();

      await notificarPush(
        state.programado,
        "🏁 Atendimento concluído!",
        `Seu agendamento ${state.programado.numero} foi concluído. Valor: R$ ${state.valorCobrado.trim()}.`
      );

      const isPix = state.formaPagamento === "Pix";
      const msg =
        `Olá, ${state.programado.cliente}! 👋\n\n` +
        `🏁 *Seu atendimento foi concluído!*\n\n` +
        `📋 *Resumo do Atendimento*\n━━━━━━━━━━━━━━━━━━\n` +
        `🔢 Agendamento: ${state.programado.numero}\n` +
        `🔧 Problema(s): ${state.programado.tipo}\n` +
        `📍 Endereço: ${state.programado.endereco}\n` +
        `📅 Data: ${state.programado.dataFormatada}\n` +
        `🕐 Horário: ${state.programado.horario}\n` +
        (state.programado.tecnico ? `👷 Técnico: ${state.programado.tecnico}\n` : "") +
        (tempoAtendimento ? `⏱️ Tempo de atendimento: ${tempoAtendimento}\n` : "") +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 *Informações de Pagamento*\n` +
        `💵 Valor: R$ ${state.valorCobrado.trim()}\n` +
        `💳 Forma: ${state.formaPagamento}\n` +
        (isPix
          ? `━━━━━━━━━━━━━━━━━━\n📱 *Dados Pix*\n🔑 Chave: *81986967254*\n👤 Titular: *Klenio Pereira de Melo*\n\nEnvie o comprovante. ✅\n`
          : "") +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🙏 *Obrigado pela preferência!*\n` +
        `Klenio Refrigeração`;

      await perguntarWA(state.programado, msg, function () {
        if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
      });
    }

    async function handleCancelar() {
      const ok = await showConfirm("Tem certeza que deseja cancelar?");
      if (!ok) return;
      state.salvando = true;
      render();
      const { data, hora } = getNowStr();
      const hist = [...(state.programado.historicoStatus || []), { status: "Cancelado", data, hora }];
      await cancelarProgramadoSafe(state.programado.numero);
      await atualizarProgramadoSafe(state.programado.numero, { historicoStatus: hist });
      state.programado = { ...state.programado, status: "Cancelado", historicoStatus: hist };
      state.salvando = false;
      render();

      await notificarPush(
        state.programado,
        "❌ Agendamento cancelado",
        `Seu agendamento ${state.programado.numero} foi cancelado pelo suporte.`
      );

      const msg =
        `Olá, ${state.programado.cliente}! 👋\n\n` +
        `❌ *Seu agendamento foi cancelado.*\n\n` +
        `🔢 Número: ${state.programado.numero}\n` +
        `🛠️ Tipo: ${state.programado.tipo}\n` +
        `📅 Data: ${state.programado.dataFormatada}\n` +
        `🕐 Horário: ${state.programado.horario}\n\n` +
        `Em caso de dúvidas entre em contato.\n\nKlenio Refrigeração ❄`;

      await perguntarWA(state.programado, msg, function () {
        if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
      });
    }

    async function handleExcluir() {
      const ok = await showConfirm("Deseja excluir permanentemente?");
      if (!ok) return;
      state.salvando = true;
      render();
      await excluirProgramadoSafe(state.programado.numero);
      state.salvando = false;
      render();
      window.showAppAlert("Excluído!");
      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    function bindEvents() {
      root.querySelector("#ep-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
      });

      root.querySelector("#ep-container").addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;

        if (action === "iniciar-edicao") {
          iniciarEdicao();
          return;
        }
        if (action === "cancelar-edicao") {
          state.editandoData = false;
          render();
          return;
        }
        if (action === "dia") {
          selecionarDia(btn.dataset.chave);
          return;
        }
        if (action === "horario") {
          state.horario = btn.dataset.horario;
          render();
          return;
        }
        if (action === "salvar-edicao") {
          handleSalvarEdicao();
          return;
        }
        if (action === "salvar-observacao") {
          handleSalvarObservacao();
          return;
        }
        if (action === "toggle-tech-list") {
          state.mostrarSelecaoTecnicoInicio = !state.mostrarSelecaoTecnicoInicio;
          render();
          return;
        }
        if (action === "fechar-tech-list") {
          state.mostrarSelecaoTecnicoInicio = false;
          render();
          return;
        }
        if (action === "select-tech") {
          const idx = Number(btn.dataset.index);
          const prof = state.profissionais[idx];
          if (!prof) return;
          state.tecnicoParaInicio = prof;
          state.mostrarSelecaoTecnicoInicio = false;
          render();
          return;
        }
        if (action === "clear-tech") {
          state.tecnicoParaInicio = null;
          render();
          return;
        }
        if (action === "iniciar-atendimento") {
          handleIniciarAtendimento();
          return;
        }
        if (action === "abrir-conclusao") {
          state.mostrarConclusao = true;
          render();
          return;
        }
        if (action === "fechar-conclusao") {
          state.mostrarConclusao = false;
          render();
          return;
        }
        if (action === "select-pagamento") {
          state.formaPagamento = btn.dataset.label;
          render();
          return;
        }
        if (action === "confirmar-conclusao") {
          handleConfirmarConclusao();
          return;
        }
        if (action === "cancelar-programado") {
          handleCancelar();
          return;
        }
        if (action === "excluir-programado") {
          handleExcluir();
        }
      });

      const observacaoInput = root.querySelector("#ep-observacao");
      if (observacaoInput) {
        observacaoInput.addEventListener("input", function () {
          state.observacao = observacaoInput.value;
        });
      }

      const valorInput = root.querySelector("#ep-valor");
      if (valorInput) {
        valorInput.addEventListener("input", function () {
          state.valorCobrado = valorInput.value.replace(/[^0-9.,]/g, "");
        });
      }
    }

    function renderStatusHistory() {
      if (!Array.isArray(state.programado.historicoStatus) || state.programado.historicoStatus.length === 0) return "";
      return `
        <article class="ep-card ep-status-history">
          <h2 class="ch-title">📋 Histórico de status</h2>
          <div class="ep-status-history-list">
            ${state.programado.historicoStatus.map((item) => {
              const conf = STATUS_CONFIG[item.status] || { icone: "📌", cor: "#7f8c8d" };
              return `
                <div class="ep-status-history-item">
                  <span class="ep-status-bubble" style="background:${conf.cor}22;border-color:${conf.cor}44">
                    ${conf.icone}
                  </span>
                  <span>
                    <span class="ep-status-history-title" style="color:${conf.cor}">${escapeHtml(item.status)}</span><br />
                    <span class="ep-status-history-time">${escapeHtml(item.data)} às ${escapeHtml(item.hora)}</span>
                  </span>
                </div>
              `;
            }).join("")}
          </div>
        </article>
      `;
    }

    function renderReagendar() {
      if (!podeReagendar()) return "";

      return `
        <article class="ep-card ep-reagendar-card">
          <div class="ab-endereco-row" style="margin-bottom:12px">
            <h2 class="ch-title">Reagendar</h2>
            ${
              !state.editandoData
                ? '<button class="ab-edit-btn" data-action="iniciar-edicao" type="button">✏️ Editar data</button>'
                : '<button class="ab-edit-btn" data-action="cancelar-edicao" type="button" style="color:#e74c3c">✕ Cancelar</button>'
            }
          </div>

          ${
            !state.editandoData
              ? `
                <div class="ep-box">
                  <p class="ep-box-title">Data atual</p>
                  <p class="ep-box-text">${escapeHtml(state.programado.dataFormatada)} • ${escapeHtml(state.programado.horario)}</p>
                </div>
              `
              : `
                <p class="ch-sub" style="margin-bottom:10px">Selecione o novo dia</p>
                <div class="ep-dias-scroll">
                  ${state.dias.map((dia) => {
                    const chave = formatarDataChave(dia);
                    const lotado = !!state.diasLotados[chave];
                    const sel = state.diaSelecionado && formatarDataChave(state.diaSelecionado) === chave;
                    const sab = isSabado(dia);
                    return `
                      <button class="ep-dia-btn${sel ? " is-selected" : ""}${lotado ? " is-lotado" : ""}" data-action="dia" data-chave="${chave}" type="button" ${lotado ? "disabled" : ""}>
                        <div class="ep-dia-semana${sab ? " is-sabado" : ""}">${dia.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                        <div class="ep-dia-num">${dia.getDate()}</div>
                        <div class="ep-dia-mes">${dia.toLocaleDateString("pt-BR", { month: "short" })}</div>
                        ${lotado ? '<div class="ep-dia-lotado">Lotado</div>' : ""}
                      </button>
                    `;
                  }).join("")}
                </div>

                ${state.diaSelecionado ? `
                  <div class="ep-horarios-wrap">
                    <p class="ch-sub">Horários disponíveis</p>
                    ${
                      state.carregandoHorarios
                        ? '<div class="op-spinner"></div>'
                        : state.horariosDisponiveis.length === 0
                          ? '<p class="op-empty-sub">❄ Nenhum horário disponível</p>'
                          : state.horariosDisponiveis.map((h) => {
                              const sel = state.horario === h;
                              return `
                                <button class="ep-horario-btn${sel ? " is-selected" : ""}" data-action="horario" data-horario="${escapeHtml(h)}" type="button">
                                  <span>🕐</span>
                                  <span class="ep-horario-label">${escapeHtml(h)}</span>
                                  ${sel ? '<span class="ep-horario-check">✓</span>' : ""}
                                </button>
                              `;
                            }).join("")
                    }
                  </div>
                ` : ""}

                ${state.diaSelecionado && state.horario ? `
                  <button class="op-btn primary" data-action="salvar-edicao" type="button" ${state.salvando ? "disabled" : ""}>
                    ${state.salvando ? '<span class="op-spinner"></span>' : "💾 Salvar novo horário"}
                  </button>
                ` : ""}
              `
          }
        </article>
      `;
    }

    function render() {
      const confStatus = statusInfo();

      root.innerHTML = `
        <section class="ep-screen">
          <div class="ep-fundos" id="ep-fundos"></div>
          <div class="ep-scroll" id="ep-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Gerenciar Programado</h1>
              </div>
              <button class="ch-voltar" id="ep-voltar" type="button">← Voltar</button>
            </header>

            <div class="ep-support-banner">
              <span style="font-size:20px">❄</span>
              <span style="flex:1">
                <span class="ep-support-title">Agendado pelo Suporte</span>
                ${state.programado.criadoComPeriodo ? '<br /><span class="ep-periodo-tag">📆 Agendamento por Período</span>' : ""}
              </span>
              ${state.programado.urgencia === "Urgente" ? '<span class="ep-urgente">🚨 URGENTE</span>' : ""}
            </div>

            <article class="ep-card ep-status-card" style="border-color:${confStatus.cor}">
              <span class="ep-status-emoji">${confStatus.icone}</span>
              <span style="flex:1">
                <span class="ep-status-label">Status atual</span><br />
                <span class="ep-status-value" style="color:${confStatus.cor}">${escapeHtml(state.programado.status)}</span>
                ${state.programado.dataCriacao ? `<br /><span class="ep-status-sub">Criado em ${escapeHtml(state.programado.dataCriacao)}</span>` : ""}
              </span>
            </article>

            ${renderStatusHistory()}

            <article class="ep-card ep-info-card">
              <h2 class="ch-title">Informações do agendamento</h2>
              <div class="ep-grid">
                <div class="ep-grid-row"><span class="ep-grid-label">Número</span><span class="ep-grid-value primary">${escapeHtml(state.programado.numero)}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Cliente</span><span class="ep-grid-value">${escapeHtml(state.programado.cliente)}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Telefone</span><span class="ep-grid-value">${escapeHtml(state.programado.clienteTelefone || "Não informado")}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Tipo</span><span class="ep-grid-value">${escapeHtml(state.programado.tipo)}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Data</span><span class="ep-grid-value">${escapeHtml(state.programado.dataFormatada)}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Horário</span><span class="ep-grid-value">${escapeHtml(state.programado.horario)}</span></div>
                <div class="ep-grid-row"><span class="ep-grid-label">Endereço</span><span class="ep-grid-value">${escapeHtml(state.programado.endereco)}</span></div>
                ${state.programado.tecnico ? `<div class="ep-grid-row"><span class="ep-grid-label">Técnico</span><span class="ep-grid-value">👷 ${escapeHtml(state.programado.tecnico)}</span></div>` : ""}
                ${state.programado.tempoAtendimento ? `<div class="ep-grid-row"><span class="ep-grid-label">Tempo atendimento</span><span class="ep-grid-value" style="color:#27ae60;font-weight:700">⏱️ ${escapeHtml(state.programado.tempoAtendimento)}</span></div>` : ""}
                ${
                  state.programado.detalhes
                    ? `<div class="ep-box"><p class="ep-box-title">Observações</p><p class="ep-box-text">${escapeHtml(state.programado.detalhes)}</p></div>`
                    : ""
                }
                ${
                  state.programado.status === "Concluído" && state.programado.valorCobrado
                    ? `
                      <div class="ep-pay-panel">
                        <p class="ep-pay-title">💰 Pagamento</p>
                        <div class="ep-grid-row"><span class="ep-grid-label">Valor</span><span class="ep-pay-value">R$ ${escapeHtml(state.programado.valorCobrado)}</span></div>
                        <div class="ep-grid-row"><span class="ep-grid-label">Forma</span><span class="ep-grid-value">${escapeHtml(state.programado.formaPagamento)}</span></div>
                      </div>
                    `
                    : ""
                }
              </div>
            </article>

            ${
              state.programado.status === "Aceito" || state.programado.status === "Em atendimento"
                ? `
                  <article class="ep-card ep-observ-card">
                    <h2 class="ch-title">Observação técnica</h2>
                    <textarea id="ep-observacao" class="ch-textarea" placeholder="Descreva o que foi verificado...">${escapeHtml(state.observacao)}</textarea>
                    <button class="op-btn primary" data-action="salvar-observacao" type="button" ${state.salvando ? "disabled" : ""}>
                      ${state.salvando ? '<span class="op-spinner"></span>' : "💾 Salvar observação"}
                    </button>
                  </article>
                `
                : ""
            }

            ${
              state.programado.status === "Aceito"
                ? `
                  <article class="ep-card ep-start-card">
                    <h2 class="ch-title">Iniciar Atendimento</h2>
                    <p class="ch-sub" style="margin-top:4px;margin-bottom:12px">Selecione o técnico responsável para iniciar.</p>
                    ${
                      state.tecnicoParaInicio
                        ? `
                          <div class="ep-tech-selected">
                            <span style="font-size:22px">👷</span>
                            <span class="ep-tech-name">${escapeHtml(state.tecnicoParaInicio.nome)}</span>
                            <button class="ep-tech-change" data-action="clear-tech" type="button">Trocar</button>
                          </div>
                        `
                        : `
                          <button class="ep-tech-required" data-action="toggle-tech-list" type="button">
                            <span style="font-size:20px">👷</span>
                            <span>Selecionar técnico (obrigatório)</span>
                          </button>
                        `
                    }

                    ${
                      state.mostrarSelecaoTecnicoInicio
                        ? `
                          <div class="ep-tech-list">
                            <div class="ep-tech-list-head">
                              <span class="ep-tech-list-title">Selecionar profissional</span>
                              <button class="ep-tech-list-close" data-action="fechar-tech-list" type="button">✕</button>
                            </div>
                            ${
                              state.profissionais.length === 0
                                ? '<p class="ep-tech-empty">Nenhum profissional cadastrado.</p>'
                                : state.profissionais.map((prof, idx) => `
                                    <button class="ep-tech-item${state.tecnicoParaInicio?.id === prof.id ? " is-selected" : ""}" data-action="select-tech" data-index="${idx}" type="button">
                                      <span class="ep-tech-avatar">👷</span>
                                      <span style="flex:1">
                                        <span class="ep-tech-item-name">${escapeHtml(prof.nome)}</span>
                                        ${prof.especialidade ? `<br /><span class="ep-tech-item-sub">${escapeHtml(prof.especialidade)}</span>` : ""}
                                      </span>
                                      ${state.tecnicoParaInicio?.id === prof.id ? '<span class="ep-tech-item-check">✓</span>' : ""}
                                    </button>
                                  `).join("")
                            }
                          </div>
                        `
                        : ""
                    }

                    <button class="op-btn primary" data-action="iniciar-atendimento" type="button" ${state.salvando || !state.tecnicoParaInicio ? "disabled" : ""}>
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
              state.programado.status === "Em atendimento"
                ? `
                  <button class="op-btn primary" data-action="abrir-conclusao" type="button" style="background:#8e44ad;margin-top:14px" ${state.salvando ? "disabled" : ""}>
                    ${state.salvando ? '<span class="op-spinner"></span>' : "🏁 Concluir Atendimento"}
                  </button>
                `
                : ""
            }

            ${
              state.mostrarConclusao
                ? `
                  <section class="ep-conclusao-modal">
                    <div class="ep-modal-head">
                      <h2 class="ch-title">🏁 Concluir Atendimento</h2>
                      <button class="ep-modal-close" data-action="fechar-conclusao" type="button">✕</button>
                    </div>
                    ${
                      state.programado.timestamp_Em_atendimento
                        ? `
                          <div class="ep-time-box">
                            <span style="font-size:18px">⏱️</span>
                            <span>
                              <span class="ep-time-label">Tempo de atendimento</span><br />
                              <span class="ep-time-value">${escapeHtml(calcularTempoAtendimento(state.programado.timestamp_Em_atendimento))}</span>
                            </span>
                          </div>
                        `
                        : ""
                    }

                    <label class="ch-input-label">Forma de pagamento <span style="color:#e74c3c">*</span></label>
                    <div class="ep-pay-options">
                      ${FORMAS_PAGAMENTO.map((fp) => `
                        <button class="ep-pay-option${state.formaPagamento === fp.label ? " is-selected" : ""}" data-action="select-pagamento" data-label="${escapeHtml(fp.label)}" type="button">
                          <span>${fp.icone}</span>
                          <span>${escapeHtml(fp.label)}</span>
                          ${state.formaPagamento === fp.label ? "<span>✓</span>" : ""}
                        </button>
                      `).join("")}
                    </div>

                    <label class="ch-input-label">Valor cobrado (R$) <span style="color:#e74c3c">*</span></label>
                    <div class="ch-input-wrap" style="margin-bottom:16px">
                      <span class="ch-input-icon">💰</span>
                      <input id="ep-valor" class="ch-input" value="${escapeHtml(state.valorCobrado)}" placeholder="Ex: 350,00" />
                    </div>

                    <div class="ep-inline-actions">
                      <button class="op-btn cancel" data-action="fechar-conclusao" type="button">Cancelar</button>
                      <button class="op-btn primary" data-action="confirmar-conclusao" type="button" style="background:#8e44ad" ${state.salvando ? "disabled" : ""}>
                        ${state.salvando ? '<span class="op-spinner"></span>' : "🏁 Confirmar conclusão"}
                      </button>
                    </div>
                  </section>
                `
                : ""
            }

            ${renderReagendar()}

            <div class="ep-actions">
              ${
                podeCancelar()
                  ? `
                    <button class="op-btn reject" data-action="cancelar-programado" type="button" ${state.salvando ? "disabled" : ""}>
                      ${state.salvando ? '<span class="op-spinner"></span>' : "❌ Cancelar agendamento"}
                    </button>
                  `
                  : ""
              }
              ${
                podeExcluir()
                  ? `
                    <button class="op-btn cancel" data-action="excluir-programado" type="button" ${state.salvando ? "disabled" : ""}>
                      🗑️ Excluir agendamento
                    </button>
                  `
                  : ""
              }
            </div>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#ep-fundos"), "ep");
      bindEvents();
    }

    function iniciarProfissionais() {
      if (typeof window.ouvirProfissionais === "function") {
        const unsub = window.ouvirProfissionais(function (lista) {
          state.profissionais = lista || [];
          render();
        });
        if (typeof unsub === "function") state.unsubProfissionais = unsub;
      } else {
        state.profissionais = loadProfissionaisLocal();
        state.pollingProfissionais = setInterval(function () {
          state.profissionais = loadProfissionaisLocal();
          render();
        }, 3000);
      }
    }

    render();
    iniciarProfissionais();

    return function cleanupEditarProgramado() {
      if (typeof state.unsubProfissionais === "function") {
        try {
          state.unsubProfissionais();
        } catch (error) {}
      }
      if (state.pollingProfissionais) clearInterval(state.pollingProfissionais);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.editarProgramado = renderTelaEditarProgramado;
})();
