// js/screens/TelaAbrirProgramado.js

(function () {
  const TIPOS_PROBLEMA = [
    { icone: "❄", label: "Não está gelando" },
    { icone: "💧", label: "Vazando água" },
    { icone: "🔊", label: "Fazendo barulho" },
    { icone: "⚡", label: "Não liga" },
    { icone: "🌡️", label: "Temp. irregular" },
    { icone: "🔧", label: "Manutenção" },
  ];

  const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const HORAS_DISPONIVEIS = Array.from({ length: 13 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);
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

  function getNowStrSafe() {
    if (typeof window.getNowStr === "function") return window.getNowStr();
    const agora = new Date();
    return {
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      iso: agora.toISOString(),
    };
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

  async function salvarProgramadoSafe(programado) {
    if (typeof window.salvarProgramado === "function") {
      await window.salvarProgramado(programado);
      return;
    }
    const lista = parseArrayStorage("@programados");
    lista.unshift(programado);
    setArrayStorage("@programados", lista);
  }

  function normalizarTelefone(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") {
      return window.formatarTelefoneWhatsApp(telefone);
    }
    if (!telefone) return null;
    const numeros = String(telefone).replace(/\D/g, "");
    if (numeros.length === 10 || numeros.length === 11) return `55${numeros}`;
    return null;
  }

  function showAlert(message) {
    if (typeof window.showCustomAlert === "function") {
      window.showCustomAlert(message);
      return;
    }
    window.alert(message);
  }

  function calcularDiasRestantes(dataChave) {
    if (!dataChave) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [y, m, d] = dataChave.split("-").map(Number);
    const alvo = new Date(y, m - 1, d);
    alvo.setHours(0, 0, 0, 0);
    return Math.ceil((alvo - hoje) / 86400000);
  }

  function formatarDataCompleta(dia, mes, ano) {
    return new Date(ano, mes, dia).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatarDataChavePeriodo(dia, mes, ano) {
    return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  }

  function getDiasNoMes(mes, ano) {
    return new Date(ano, mes + 1, 0).getDate();
  }

  function horaFimValida(inicio, fim) {
    if (!inicio || !fim) return false;
    const [hi] = inicio.split(":").map(Number);
    const [hf] = fim.split(":").map(Number);
    return hf > hi;
  }

  function montarFaixaHorario(inicio, fim) {
    return `${inicio} às ${fim}`;
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
    parseArrayStorage("@programados").forEach((item) => {
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

  async function notificarPushCliente(email, dataTexto) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(email);
        if (token) {
          await window.enviarNotificacaoPush(
            token,
            "🔧 Atendimento agendado pelo Suporte!",
            `A equipe Klenio agendou um atendimento para ${dataTexto}. Acesse o app para confirmar.`,
            { tela: "programadoCliente" }
          );
        }
      }
    } catch (error) {
      console.log("Erro notificação:", error);
    }
  }

  function renderTelaAbrirProgramado(root, props) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const anos = Array.from({ length: 5 }, (_, i) => anoAtual + i);

    const state = {
      clientes: [],
      clienteSelecionado: null,
      busca: "",
      mostrarLista: false,
      tiposSelecionados: [],
      outroTipo: "",
      mostrarOutro: false,
      urgencia: "Normal",
      dias: [],
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      carregandoHorarios: false,
      diasLotados: {},
      modoPeriodo: false,
      mostrarSeletorPeriodo: false,
      diaPeriodo: hoje.getDate(),
      mesPeriodo: hoje.getMonth(),
      anoPeriodo: anoAtual,
      horaInicio: null,
      horaFim: null,
      horariosDisponiveisPeriodo: [],
      carregandoHorariosP: false,
      detalhes: "",
      carregando: false,
    };

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

    async function carregarHorariosPeriodo() {
      const dataObj = new Date(state.anoPeriodo, state.mesPeriodo, state.diaPeriodo);
      state.carregandoHorariosP = true;
      render();
      const horarios = await getHorariosDisponiveisSafe(dataObj);
      state.horariosDisponiveisPeriodo = horarios || [];
      state.carregandoHorariosP = false;
      render();
    }

    function clientesFiltrados() {
      const termo = state.busca.toLowerCase();
      return state.clientes.filter(
        (c) =>
          String(c.nome || "").toLowerCase().includes(termo) ||
          String(c.email || "").toLowerCase().includes(termo)
      );
    }

    function validarCamposComuns() {
      if (!state.clienteSelecionado) {
        showAlert("Atenção ❄\nSelecione um cliente.");
        return null;
      }
      const todos = [...state.tiposSelecionados];
      if (state.mostrarOutro && state.outroTipo.trim()) todos.push(state.outroTipo.trim());
      if (todos.length === 0) {
        showAlert("Atenção ❄\nSelecione ao menos um tipo de problema.");
        return null;
      }
      return todos;
    }

    async function handleSalvarPeriodo() {
      const todos = validarCamposComuns();
      if (!todos) return;
      if (!state.horaInicio || !state.horaFim) {
        showAlert("Atenção ❄\nSelecione a hora de início e a hora de fim.");
        return;
      }
      if (!horaFimValida(state.horaInicio, state.horaFim)) {
        showAlert("Atenção ❄\nA hora de fim deve ser posterior à hora de início.");
        return;
      }

      const chave = formatarDataChavePeriodo(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo);
      const diasRestantes = calcularDiasRestantes(chave);
      if (diasRestantes < 0) {
        showAlert("Atenção ❄\nSelecione uma data futura.");
        return;
      }

      const faixaHorario = montarFaixaHorario(state.horaInicio, state.horaFim);
      const dataFormatada = formatarDataCompleta(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo);
      state.carregando = true;
      render();

      const { data, hora } = getNowStrSafe();
      const programado = {
        numero: `#P${Math.floor(Math.random() * 90000 + 10000)}`,
        tipos: todos,
        tipo: todos.join(", "),
        endereco: state.clienteSelecionado.endereco,
        dataFormatada,
        dataChave: chave,
        horario: faixaHorario,
        detalhes: state.detalhes,
        status: "Agendado",
        urgencia: state.urgencia,
        cliente: state.clienteSelecionado.nome,
        clienteEmail: state.clienteSelecionado.email,
        clienteTelefone: state.clienteSelecionado.telefone || "",
        observacaoTecnica: "",
        tecnico: "",
        formaPagamento: "",
        valorCobrado: "",
        dataCriacao: `${data} às ${hora}`,
        dataAbertura: data,
        horaAbertura: hora,
        criadoPorAdmin: true,
        criadoComPeriodo: true,
        diasRestantes,
        historicoStatus: [{ status: "Agendado", data, hora }],
        historico: [],
      };

      await salvarProgramadoSafe(programado);
      await notificarPushCliente(state.clienteSelecionado.email, dataFormatada);

      const mensagemWA =
        `Olá, ${state.clienteSelecionado.nome}! 👋\n\n` +
        `🔧 *Atendimento agendado pelo Suporte ❄*\n\n` +
        `📋 *Detalhes*\n━━━━━━━━━━━━━━━━━━\n` +
        `🔧 Problema(s): ${todos.join(", ")}\n` +
        `📍 Endereço: ${state.clienteSelecionado.endereco}\n` +
        `📅 Data: ${dataFormatada}\n` +
        `🕐 Horário: ${faixaHorario}\n` +
        `⏳ Em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}\n` +
        (state.detalhes ? `📝 Obs: ${state.detalhes}\n` : "") +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Acesse o aplicativo em Programado pelo Suporte e aceite o agendamento para dar continuidade ao atendimento.*\n\n` +
        `Klenio Refrigeração ❄`;

      state.carregando = false;
      state.mostrarSeletorPeriodo = false;
      render();

      const enviar = window.confirm(`Programado criado! ❄\n\nDeseja notificar ${state.clienteSelecionado.nome} via WhatsApp?`);
      if (enviar) {
        const num = normalizarTelefone(state.clienteSelecionado.telefone);
        if (num && typeof window.abrirLinkWhatsApp === "function") {
          window.abrirLinkWhatsApp(num, mensagemWA);
        } else if (num) {
          window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensagemWA)}`, "_blank");
        }
      }
      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    async function handleSalvar() {
      const todos = validarCamposComuns();
      if (!todos) return;
      if (!state.diaSelecionado || !state.horario) {
        showAlert("Atenção ❄\nSelecione o dia e horário.");
        return;
      }

      state.carregando = true;
      render();

      const { data, hora } = getNowStrSafe();
      const programado = {
        numero: `#P${Math.floor(Math.random() * 90000 + 10000)}`,
        tipos: todos,
        tipo: todos.join(", "),
        endereco: state.clienteSelecionado.endereco,
        dataFormatada: formatarDataSafe(state.diaSelecionado),
        dataChave: formatarDataChaveSafe(state.diaSelecionado),
        horario: state.horario,
        detalhes: state.detalhes,
        status: "Agendado",
        urgencia: state.urgencia,
        cliente: state.clienteSelecionado.nome,
        clienteEmail: state.clienteSelecionado.email,
        clienteTelefone: state.clienteSelecionado.telefone || "",
        observacaoTecnica: "",
        tecnico: "",
        formaPagamento: "",
        valorCobrado: "",
        dataCriacao: `${data} às ${hora}`,
        dataAbertura: data,
        horaAbertura: hora,
        criadoPorAdmin: true,
        criadoComPeriodo: false,
        historicoStatus: [{ status: "Agendado", data, hora }],
        historico: [],
      };

      await salvarProgramadoSafe(programado);
      await notificarPushCliente(state.clienteSelecionado.email, formatarDataSafe(state.diaSelecionado));

      const mensagemWA =
        `Olá, ${state.clienteSelecionado.nome}! 👋\n\n` +
        `🔧 *Atendimento agendado pelo Suporte ❄*\n\n` +
        `📋 *Detalhes*\n━━━━━━━━━━━━━━━━━━\n` +
        `🔧 Problema(s): ${todos.join(", ")}\n` +
        `📍 Endereço: ${state.clienteSelecionado.endereco}\n` +
        `📅 Data: ${formatarDataSafe(state.diaSelecionado)}\n` +
        `🕐 Horário: ${state.horario}\n` +
        (state.detalhes ? `📝 Obs: ${state.detalhes}\n` : "") +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `⚠️ *Acesse o aplicativo em Programado pelo Suporte e aceite o agendamento para dar continuidade ao atendimento.*\n\n` +
        `Klenio Refrigeração ❄`;

      state.carregando = false;
      render();

      const enviar = window.confirm(`Programado criado! ❄\n\nDeseja notificar ${state.clienteSelecionado.nome} via WhatsApp?`);
      if (enviar) {
        const num = normalizarTelefone(state.clienteSelecionado.telefone);
        if (num && typeof window.abrirLinkWhatsApp === "function") {
          window.abrirLinkWhatsApp(num, mensagemWA);
        } else if (num) {
          window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensagemWA)}`, "_blank");
        }
      }
      if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
    }

    function bindEvents() {
      const container = root.querySelector(".ap-screen");
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
          render();
          return;
        }
        if (action === "clear-cliente") {
          state.clienteSelecionado = null;
          state.busca = "";
          render();
          return;
        }
        if (action === "toggle-tipo") {
          const label = actionEl.dataset.label;
          if (state.tiposSelecionados.includes(label)) {
            state.tiposSelecionados = state.tiposSelecionados.filter((item) => item !== label);
          } else {
            state.tiposSelecionados.push(label);
          }
          render();
          return;
        }
        if (action === "toggle-outro") {
          state.mostrarOutro = !state.mostrarOutro;
          render();
          return;
        }
        if (action === "set-urgencia") {
          state.urgencia = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "select-dia") {
          if (actionEl.dataset.lotado === "1") return;
          state.modoPeriodo = false;
          selecionarDia(actionEl.dataset.chave);
          return;
        }
        if (action === "open-periodo") {
          state.modoPeriodo = true;
          state.diaSelecionado = null;
          state.horario = null;
          state.mostrarSeletorPeriodo = true;
          render();
          carregarHorariosPeriodo();
          return;
        }
        if (action === "select-horario") {
          state.horario = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "submit-normal") {
          handleSalvar();
          return;
        }
        if (action === "close-modal-periodo") {
          state.mostrarSeletorPeriodo = false;
          render();
          return;
        }
        if (action === "periodo-ano") {
          state.anoPeriodo = Number(actionEl.dataset.value);
          render();
          carregarHorariosPeriodo();
          return;
        }
        if (action === "periodo-mes") {
          state.mesPeriodo = Number(actionEl.dataset.value);
          state.diaPeriodo = 1;
          render();
          carregarHorariosPeriodo();
          return;
        }
        if (action === "periodo-dia") {
          state.diaPeriodo = Number(actionEl.dataset.value);
          render();
          carregarHorariosPeriodo();
          return;
        }
        if (action === "periodo-horario-sugerido") {
          const partes = actionEl.dataset.value.split(" às ");
          state.horaInicio = partes[0].trim();
          state.horaFim = partes[1].trim();
          render();
          return;
        }
        if (action === "periodo-hora-inicio") {
          const inicio = actionEl.dataset.value;
          state.horaInicio = inicio;
          if (state.horaFim && !horaFimValida(inicio, state.horaFim)) {
            state.horaFim = null;
          }
          render();
          return;
        }
        if (action === "periodo-hora-fim") {
          state.horaFim = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "periodo-confirmar") {
          const diasRestantes = calcularDiasRestantes(
            formatarDataChavePeriodo(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo)
          );
          if (diasRestantes < 0) {
            showAlert("Atenção ❄\nSelecione uma data futura.");
            return;
          }
          if (!state.horaInicio || !state.horaFim) {
            showAlert("Atenção ❄\nSelecione hora de início e fim.");
            return;
          }
          if (!horaFimValida(state.horaInicio, state.horaFim)) {
            showAlert("Atenção ❄\nA hora de fim deve ser posterior à hora de início.");
            return;
          }
          state.mostrarSeletorPeriodo = false;
          render();
          return;
        }
        if (action === "submit-periodo") {
          handleSalvarPeriodo();
        }
      });

      const buscaInput = root.querySelector("#ap-busca");
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

      const outroInput = root.querySelector("#ap-outro");
      if (outroInput) {
        outroInput.addEventListener("input", function () {
          state.outroTipo = outroInput.value;
        });
      }

      const detalhesInput = root.querySelector("#ap-detalhes");
      if (detalhesInput) {
        detalhesInput.addEventListener("input", function () {
          state.detalhes = detalhesInput.value;
        });
      }
    }

    function renderModalPeriodo() {
      if (!state.mostrarSeletorPeriodo) return "";
      const chaveAtual = formatarDataChavePeriodo(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo);
      const diasRestantes = calcularDiasRestantes(chaveAtual);
      const diasNoMes = getDiasNoMes(state.mesPeriodo, state.anoPeriodo);
      const faixaPreview =
        state.horaInicio && state.horaFim && horaFimValida(state.horaInicio, state.horaFim)
          ? montarFaixaHorario(state.horaInicio, state.horaFim)
          : null;
      const horasFimDisponiveis = state.horaInicio
        ? HORAS_DISPONIVEIS.filter((h) => Number(h.split(":")[0]) > Number(state.horaInicio.split(":")[0]))
        : [];

      return `
        <div class="ap-modal">
          <div class="ap-modal-sheet">
            <div class="ap-modal-head">
              <h3>📆 Selecionar Período e Horário</h3>
              <button data-action="close-modal-periodo" type="button">✕</button>
            </div>

            <div class="ap-modal-body">
              <label class="ch-input-label">Ano</label>
              <div class="ap-chip-grid">
                ${anos
                  .map(
                    (ano) => `
                      <button class="ap-chip${state.anoPeriodo === ano ? " is-active" : ""}" data-action="periodo-ano" data-value="${ano}" type="button">
                        ${ano}
                      </button>
                    `
                  )
                  .join("")}
              </div>

              <label class="ch-input-label">Mês</label>
              <div class="ap-chip-grid">
                ${MESES.map(
                  (mes, idx) => `
                    <button class="ap-chip${state.mesPeriodo === idx ? " is-active" : ""}" data-action="periodo-mes" data-value="${idx}" type="button">
                      ${mes}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">Dia</label>
              <div class="ap-dia-grid">
                ${Array.from({ length: diasNoMes }, (_, i) => i + 1)
                  .map(
                    (dia) => `
                      <button class="ap-day-chip${state.diaPeriodo === dia ? " is-active" : ""}" data-action="periodo-dia" data-value="${dia}" type="button">
                        ${dia}
                      </button>
                    `
                  )
                  .join("")}
              </div>

              <div class="ap-preview-card">
                <div>
                  <p>Data selecionada</p>
                  <strong>${escapeHtml(formatarDataCompleta(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo))}</strong>
                </div>
                <div style="text-align:center;min-width:60px">
                  ${
                    diasRestantes >= 0
                      ? `<strong style="font-size:22px;color:#f39c12">${diasRestantes}</strong><br /><small style="color:rgba(180,220,255,0.5)">dias</small>`
                      : '<small style="color:#e74c3c">Data passada</small>'
                  }
                </div>
              </div>

              ${
                state.carregandoHorariosP
                  ? '<div class="tp-loading"><div class="ch-spinner"></div></div>'
                  : state.horariosDisponiveisPeriodo.length > 0
                    ? `
                      <label class="ch-input-label">Horários disponíveis nesta data</label>
                      <div class="ap-periodo-sugestoes">
                        ${state.horariosDisponiveisPeriodo
                          .map(
                            (h) => `
                              <button class="ap-sugestao" data-action="periodo-horario-sugerido" data-value="${escapeHtml(h)}" type="button">
                                <span>🕐 ${escapeHtml(h)}</span>
                                <span>usar este</span>
                              </button>
                            `
                          )
                          .join("")}
                      </div>
                    `
                    : ""
              }

              <label class="ch-input-label">🕐 Hora de início *</label>
              <div class="ap-chip-grid">
                ${HORAS_DISPONIVEIS.map(
                  (h) => `
                    <button class="ap-chip${state.horaInicio === h ? " is-active" : ""}" data-action="periodo-hora-inicio" data-value="${h}" type="button">
                      ${h}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">🕑 Hora de fim *</label>
              ${
                !state.horaInicio
                  ? '<p class="ad-muted">Selecione a hora de início primeiro.</p>'
                  : `
                    <div class="ap-chip-grid">
                      ${horasFimDisponiveis
                        .map(
                          (h) => `
                            <button class="ap-chip${state.horaFim === h ? " is-active warning" : ""}" data-action="periodo-hora-fim" data-value="${h}" type="button">
                              ${h}
                            </button>
                          `
                        )
                        .join("")}
                    </div>
                  `
              }

              ${
                faixaPreview
                  ? `
                    <div class="ap-range-preview">
                      <span>🕐</span>
                      <span>
                        <small>Faixa selecionada</small><br />
                        <strong>${escapeHtml(faixaPreview)}</strong>
                      </span>
                    </div>
                  `
                  : ""
              }

              <button class="op-btn primary" style="background:#f39c12" data-action="periodo-confirmar" type="button">
                ${faixaPreview ? `✅ Confirmar — ${escapeHtml(faixaPreview)}` : "⚠️ Selecione início e fim"}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    function render() {
      const clientes = clientesFiltrados();
      const chavePeriodo = formatarDataChavePeriodo(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo);
      const diasRestantesAtual = calcularDiasRestantes(chavePeriodo);
      const faixaPreview =
        state.horaInicio && state.horaFim && horaFimValida(state.horaInicio, state.horaFim)
          ? montarFaixaHorario(state.horaInicio, state.horaFim)
          : null;

      root.innerHTML = `
        <section class="ap-screen">
          <div class="ap-fundos" id="ap-fundos"></div>
          <div class="ap-scroll" id="ap-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Abrir Chamado para Cliente</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <div class="ap-hint-card">
              <span style="font-size:20px">💡</span>
              <span>
                Ambos os modos vão para <strong>Programado pelo Suporte</strong>. O cliente precisa aceitar ou contestar.
              </span>
            </div>

            <article class="ch-card">
              <h2 class="ch-title">Selecionar cliente <span style="color:#e74c3c">*</span></h2>
              <div class="ch-input-wrap">
                <span class="ch-input-icon">🔍</span>
                <input id="ap-busca" class="ch-input" value="${escapeHtml(state.busca)}" placeholder="Buscar cliente..." />
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
                          (c, idx) => `
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
              <h2 class="ch-title">Prioridade</h2>
              <div class="ap-urgency-grid">
                ${[
                  { label: "Normal", icone: "✅", cor: "#27ae60" },
                  { label: "Urgente", icone: "🚨", cor: "#e74c3c" },
                ]
                  .map(
                    (op) => `
                      <button class="ap-urgency-btn${state.urgencia === op.label ? " is-active" : ""}" data-action="set-urgencia" data-value="${op.label}" type="button" style="--accent:${op.cor}">
                        <span>${op.icone}</span>
                        <span>${op.label}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </article>

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Tipo de problema <span style="color:#e74c3c">*</span></h2>
              <div class="ap-problem-grid">
                ${TIPOS_PROBLEMA.map((tipo) => {
                  const sel = state.tiposSelecionados.includes(tipo.label);
                  return `
                    <button class="ap-problem-btn${sel ? " is-active" : ""}" data-action="toggle-tipo" data-label="${escapeHtml(tipo.label)}" type="button">
                      <span>${tipo.icone}</span>
                      <small>${escapeHtml(tipo.label)}</small>
                      ${sel ? "<i>✓</i>" : ""}
                    </button>
                  `;
                }).join("")}

                <button class="ap-problem-btn${state.mostrarOutro ? " is-active" : ""}" data-action="toggle-outro" type="button">
                  <span>📝</span>
                  <small>Outro</small>
                </button>
              </div>
              ${
                state.mostrarOutro
                  ? `
                    <div class="ch-input-wrap" style="margin-top:14px">
                      <span class="ch-input-icon">📝</span>
                      <input id="ap-outro" class="ch-input" value="${escapeHtml(state.outroTipo)}" placeholder="Descreva o problema" />
                    </div>
                  `
                  : ""
              }
            </article>

            <article class="ch-card ap-card-gap">
              <h2 class="ch-title">Dia do atendimento <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Próximos 7 dias ou selecione um período futuro</p>

              <div class="ap-days-row">
                ${state.dias
                  .map((dia) => {
                    const chave = formatarDataChaveSafe(dia);
                    const lotado = !!state.diasLotados[chave];
                    const sel = state.diaSelecionado && !state.modoPeriodo && formatarDataChaveSafe(state.diaSelecionado) === chave;
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

                <button class="ap-day-btn periodo${state.modoPeriodo ? " is-selected" : ""}" data-action="open-periodo" type="button">
                  <span style="font-size:20px">📆</span>
                  <span class="ap-day-week">Período</span>
                </button>
              </div>

              ${
                state.modoPeriodo
                  ? `
                    <div class="ap-periodo-resumo">
                      <div>
                        <strong>📆 Período selecionado</strong>
                        <small>${escapeHtml(formatarDataCompleta(state.diaPeriodo, state.mesPeriodo, state.anoPeriodo))}</small>
                        ${
                          faixaPreview
                            ? `<small style="color:#38b6ff">🕐 ${escapeHtml(faixaPreview)}</small>`
                            : '<small style="color:#e74c3c">⚠️ Horário não definido</small>'
                        }
                        <small>⏳ ${diasRestantesAtual >= 0 ? `${diasRestantesAtual} dia${diasRestantesAtual !== 1 ? "s" : ""} restantes` : "Data no passado"}</small>
                      </div>
                      <button data-action="open-periodo" type="button">✏️ Alterar</button>
                    </div>
                  `
                  : ""
              }

              ${
                !state.modoPeriodo && state.diaSelecionado
                  ? `
                    <div style="margin-top:16px">
                      <p class="ch-sub">Horários disponíveis</p>
                      ${
                        state.carregandoHorarios
                          ? '<div class="tp-loading"><div class="ch-spinner"></div></div>'
                          : state.horariosDisponiveis.length === 0
                            ? '<p class="ad-muted" style="text-align:center">❄ Nenhum horário disponível</p>'
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
              <h2 class="ch-title">Observações</h2>
              <textarea id="ap-detalhes" class="ch-textarea" placeholder="Ex: Verificar o split da sala principal...">${escapeHtml(state.detalhes)}</textarea>
            </article>

            <button
              class="op-btn primary"
              style="margin-top:20px;background:${state.modoPeriodo ? "#f39c12" : "#38b6ff"}"
              data-action="${state.modoPeriodo ? "submit-periodo" : "submit-normal"}"
              type="button"
              ${state.carregando || (state.modoPeriodo && !faixaPreview) ? "disabled" : ""}
            >
              ${
                state.carregando
                  ? '<span class="op-spinner"></span>'
                  : state.modoPeriodo
                    ? faixaPreview
                      ? "📆 Criar Programado por Período"
                      : "⚠️ Defina o horário no período"
                    : "🔧 Criar Programado para Cliente"
              }
            </button>

            <div style="height:20px"></div>
          </div>
          ${renderModalPeriodo()}
        </section>
      `;

      criarFlocosFundo(root.querySelector("#ap-fundos"), "ap");
      bindEvents();
    }

    async function iniciar() {
      state.dias = getProximosDiasSafe();
      state.clientes = await carregarClientesSafe();
      render();
      verificarDiasLotados(state.dias);
    }

    render();
    iniciar();
  }

  window.Telas = window.Telas || {};
  window.Telas.abrirProgramado = renderTelaAbrirProgramado;
})();
