// js/screens/TelaPainelAdmin.js

(function () {
  const STATUS_CONFIG = {
    "Aguardando técnico": { icone: "⏳", cor: "#f39c12" },
    Aceito: { icone: "✅", cor: "#27ae60" },
    "Em atendimento": { icone: "🔧", cor: "#2980b9" },
    Concluído: { icone: "🏁", cor: "#8e44ad" },
    Cancelado: { icone: "❌", cor: "#e74c3c" },
    Agendado: { icone: "📅", cor: "#f39c12" },
    Contestado: { icone: "⚠️", cor: "#e67e22" },
    Respondido: { icone: "💬", cor: "#2980b9" },
  };

  const ORDEM_PROGRAMADO = {
    Contestado: 0,
    Agendado: 1,
    Respondido: 2,
    Aceito: 3,
    "Em atendimento": 4,
    Cancelado: 5,
    Concluído: 6,
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

  function saveArrayStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function updateItemByNumero(key, numero, updates) {
    const lista = parseArrayStorage(key);
    const idx = lista.findIndex((item) => item.numero === numero);
    if (idx < 0) return false;
    lista[idx] = { ...lista[idx], ...updates };
    saveArrayStorage(key, lista);
    return true;
  }

  async function atualizarChamadoSafe(numero, updates) {
    if (typeof window.atualizarChamado === "function") {
      await window.atualizarChamado(numero, updates);
      return;
    }
    updateItemByNumero("@chamados", numero, updates);
  }

  async function responderContestacaoSafe(numero, resposta) {
    if (typeof window.responderContestacao === "function") {
      await window.responderContestacao(numero, resposta);
      return;
    }
    const lista = parseArrayStorage("@programados");
    const idx = lista.findIndex((item) => item.numero === numero);
    if (idx < 0) return;

    const dataAgora = new Date();
    const data = dataAgora.toLocaleDateString("pt-BR");
    const hora = dataAgora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const historico = Array.isArray(lista[idx].historico) ? [...lista[idx].historico] : [];
    historico.push({
      tipo: "resposta",
      mensagem: resposta,
      data,
      hora,
    });
    lista[idx] = {
      ...lista[idx],
      historico,
      status: "Respondido",
      ultimaResposta: resposta,
    };
    saveArrayStorage("@programados", lista);
  }

  async function marcarChamadoExcluidoSafe(chamado) {
    if (
      window.db &&
      typeof window.db.collection === "function" &&
      window.db.collection("chamados") &&
      typeof window.db.collection("chamados").doc === "function"
    ) {
      await window.db
        .collection("chamados")
        .doc(chamado.numero)
        .update({
          excluidoPorAdmin: true,
          excluidoEm: new Date().toLocaleDateString("pt-BR"),
        });
      return;
    }
    updateItemByNumero("@chamados", chamado.numero, {
      excluidoPorAdmin: true,
      excluidoEm: new Date().toLocaleDateString("pt-BR"),
    });
  }

  async function notificarPushContestacao(item) {
    try {
      if (
        typeof window.buscarTokenCliente === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenCliente(item.clienteEmail);
        if (token) {
          await window.enviarNotificacaoPush(
            token,
            "💬 Contestação respondida!",
            `O suporte respondeu sua contestação do programado ${item.numero}.`,
            { tela: "programadoCliente" }
          );
        }
      }
    } catch (error) {
      console.log("Erro notificação:", error);
    }
  }

  function formatarTelefoneWhatsApp(telefone) {
    if (typeof window.formatarTelefoneWhatsApp === "function") {
      return window.formatarTelefoneWhatsApp(telefone);
    }
    if (!telefone) return null;
    const numeros = String(telefone).replace(/\D/g, "");
    if (numeros.length === 10 || numeros.length === 11) return `55${numeros}`;
    return null;
  }

  function notificarWhatsAppResposta(item, respostaTexto) {
    if (typeof window.notificarClienteRespostaContestacao === "function") {
      window.notificarClienteRespostaContestacao(item.clienteTelefone, item, respostaTexto);
      return;
    }
    const numero = formatarTelefoneWhatsApp(item.clienteTelefone);
    if (!numero) return;
    const msg =
      `Olá, ${item.cliente || "cliente"}! 👋\n\n` +
      `💬 *Sua contestação foi respondida pelo suporte.*\n\n` +
      `🔢 Programado: ${item.numero}\n` +
      `🛠️ Tipo: ${item.tipo || "-"}\n` +
      `📅 Data: ${item.dataFormatada || "-"}\n` +
      `🕐 Horário: ${item.horario || "-"}\n\n` +
      `📨 Resposta:\n${respostaTexto}\n\n` +
      `Klenio Refrigeração ❄`;
    if (typeof window.abrirLinkWhatsApp === "function") {
      window.abrirLinkWhatsApp(numero, msg);
    } else {
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  }

  function badgeHtml(count) {
    if (!count || count === 0) return "";
    return `<span class="pa-badge">${count > 99 ? "99+" : count}</span>`;
  }

  function formatarDiasRestantes(dataChave) {
    if (!dataChave) return null;
    const partes = dataChave.split("-");
    if (partes.length !== 3) return null;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const alvo = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    alvo.setHours(0, 0, 0, 0);
    const dias = Math.ceil((alvo - hoje) / 86400000);
    let cor = "#38b6ff";
    if (dias <= 1) cor = "#e74c3c";
    else if (dias <= 3) cor = "#f39c12";
    else if (dias <= 7) cor = "#27ae60";

    if (dias === 0) return { texto: "Hoje! 🚨", cor };
    if (dias < 0) return { texto: "Data passou", cor: "#e74c3c" };
    return { texto: `${dias} dia${dias !== 1 ? "s" : ""} restantes`, cor };
  }

  function renderTelaPainelAdmin(root, props) {
    const state = {
      chamadosPendentes: [],
      chamadosAtivos: [],
      chamadosConcluidos: [],
      programados: [],
      totalOrcamentosPendentes: 0,
      carregando: true,
      refreshing: false,
      abaSelecionada: "pendentes",
      respondendo: null,
      textoResposta: "",
      salvando: false,
      buscaCliente: "",
      mostrarFiltro: false,
      historicoExpandido: {},
      unsubscribers: [],
      fallbackIntervals: [],
    };

    function ordenarPorUrgencia(lista) {
      return [...lista].sort((a, b) => {
        if (a.urgencia === "Urgente" && b.urgencia !== "Urgente") return -1;
        if (b.urgencia === "Urgente" && a.urgencia !== "Urgente") return 1;
        return 0;
      });
    }

    function parseDataHoraTexto(dataTexto, horaTexto) {
      if (!dataTexto) return 0;
      const partes = String(dataTexto).split("/");
      if (partes.length !== 3) return 0;
      const dia = Number(partes[0]);
      const mes = Number(partes[1]) - 1;
      const ano = Number(partes[2]);
      let hora = 0;
      let minuto = 0;
      if (horaTexto) {
        const hm = String(horaTexto).split(":");
        if (hm.length >= 2) {
          hora = Number(hm[0]) || 0;
          minuto = Number(hm[1]) || 0;
        }
      }
      const dt = new Date(ano, mes, dia, hora, minuto, 0, 0);
      return dt.getTime() || 0;
    }

    function getChamadoTimestamp(item) {
      if (!item) return 0;
      if (item.timestamp_Concluído) {
        const ts = new Date(item.timestamp_Concluído).getTime();
        if (!Number.isNaN(ts)) return ts;
      }
      if (item.timestamp_Cancelado) {
        const ts = new Date(item.timestamp_Cancelado).getTime();
        if (!Number.isNaN(ts)) return ts;
      }
      if (item.dataConclusao) {
        const ts = parseDataHoraTexto(item.dataConclusao, item.horaConclusao);
        if (ts) return ts;
      }
      const historico = Array.isArray(item.historicoStatus) ? item.historicoStatus : [];
      if (historico.length > 0) {
        const ultimo = historico[historico.length - 1];
        if (ultimo && ultimo.iso) {
          const ts = new Date(ultimo.iso).getTime();
          if (!Number.isNaN(ts)) return ts;
        }
        const tsHistorico = parseDataHoraTexto(ultimo && ultimo.data, ultimo && ultimo.hora);
        if (tsHistorico) return tsHistorico;
      }
      if (item.dataCriacao && String(item.dataCriacao).includes(" às ")) {
        const [dataBr, horaTxt] = String(item.dataCriacao).split(" às ");
        const ts = parseDataHoraTexto(dataBr, horaTxt);
        if (ts) return ts;
      }
      return parseDataHoraTexto(item.dataAbertura, item.horaAbertura);
    }

    function processarChamados(lista) {
      const visiveis = (lista || []).filter((item) => !item.excluidoPorAdmin);
      state.chamadosPendentes = ordenarPorUrgencia(
        visiveis.filter((item) => item.status === "Aguardando técnico")
      );
      state.chamadosAtivos = ordenarPorUrgencia(
        visiveis.filter((item) => item.status === "Aceito" || item.status === "Em atendimento")
      );
      state.chamadosConcluidos = visiveis.filter(
        (item) => item.status === "Concluído" || item.status === "Cancelado"
      ).sort((a, b) => getChamadoTimestamp(b) - getChamadoTimestamp(a));
      state.carregando = false;
      render();
    }

    function processarProgramados(lista) {
      const ordenada = [...(lista || [])].sort((a, b) => {
        if (a.dataChave && b.dataChave) {
          const diff = a.dataChave.localeCompare(b.dataChave);
          if (diff !== 0) return diff;
        }
        return (ORDEM_PROGRAMADO[a.status] ?? 7) - (ORDEM_PROGRAMADO[b.status] ?? 7);
      });
      state.programados = ordenada.filter((item) => item.status !== "Cancelado" && item.status !== "Concluído");
      render();
    }

    function processarOrcamentos(lista) {
      state.totalOrcamentosPendentes = (lista || []).filter(
        (item) => item.status === "Aguardando análise" || item.status === "Em análise"
      ).length;
      render();
    }

    async function atualizarDadosPainel(mostrarLoading) {
      if (mostrarLoading) {
        state.refreshing = true;
        render();
      }

      try {
        const [chamados, programados, orcamentos] = await Promise.all([
          typeof window.carregarChamados === "function"
            ? window.carregarChamados()
            : Promise.resolve(parseArrayStorage("@chamados")),
          typeof window.carregarTodosProgramados === "function"
            ? window.carregarTodosProgramados()
            : Promise.resolve(parseArrayStorage("@programados")),
          typeof window.carregarTodosOrcamentos === "function"
            ? window.carregarTodosOrcamentos()
            : Promise.resolve(parseArrayStorage("@orcamentos")),
        ]);

        processarChamados(chamados);
        processarProgramados(programados);
        processarOrcamentos(orcamentos);
      } catch (error) {
        console.log("Erro atualizar painel:", error);
      } finally {
        if (mostrarLoading) {
          state.refreshing = false;
          render();
        }
      }
    }

    function subscribeChamados() {
      if (typeof window.ouvirChamados === "function") {
        const unsub = window.ouvirChamados(processarChamados);
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
        return;
      }
      const loadLocal = function () {
        processarChamados(parseArrayStorage("@chamados"));
      };
      loadLocal();
      const interval = setInterval(loadLocal, 3000);
      state.fallbackIntervals.push(interval);
    }

    function subscribeProgramados() {
      if (typeof window.ouvirTodosProgramados === "function") {
        const unsub = window.ouvirTodosProgramados(processarProgramados);
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
        return;
      }
      const loadLocal = function () {
        processarProgramados(parseArrayStorage("@programados"));
      };
      loadLocal();
      const interval = setInterval(loadLocal, 3000);
      state.fallbackIntervals.push(interval);
    }

    function subscribeOrcamentos() {
      if (typeof window.ouvirTodosOrcamentos === "function") {
        const unsub = window.ouvirTodosOrcamentos(processarOrcamentos);
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
        return;
      }
      const loadLocal = function () {
        processarOrcamentos(parseArrayStorage("@orcamentos"));
      };
      loadLocal();
      const interval = setInterval(loadLocal, 3000);
      state.fallbackIntervals.push(interval);
    }

    function filtrarPorCliente(lista) {
      if (!state.buscaCliente.trim()) return lista;
      const termo = state.buscaCliente.toLowerCase().trim();
      return lista.filter((item) => {
        const nome = (item.cliente || "").toLowerCase();
        const email = (item.clienteEmail || "").toLowerCase();
        return nome.includes(termo) || email.includes(termo);
      });
    }

    function listaAbaAtual() {
      let lista = [];
      if (state.abaSelecionada === "pendentes") lista = state.chamadosPendentes;
      else if (state.abaSelecionada === "ativos") lista = state.chamadosAtivos;
      else if (state.abaSelecionada === "programados") lista = state.programados;
      else lista = state.chamadosConcluidos;
      return filtrarPorCliente(lista);
    }

    async function handleAlterarUrgencia(numero) {
      const chamado = [...state.chamadosPendentes, ...state.chamadosAtivos, ...state.chamadosConcluidos].find(
        (item) => item.numero === numero
      );
      if (!chamado) return;
      const novaUrgencia = chamado.urgencia === "Urgente" ? "Normal" : "Urgente";
      const ok = window.confirm(`Deseja marcar o chamado ${numero} como ${novaUrgencia}?`);
      if (!ok) return;
      await atualizarChamadoSafe(numero, { urgencia: novaUrgencia });
      await atualizarDadosPainel(false);
    }

    async function handleExcluirChamado(numero) {
      const chamado = state.chamadosConcluidos.find((item) => item.numero === numero);
      if (!chamado) return;
      const ok = window.confirm(
        `Tem certeza que deseja excluir o chamado ${numero}?\n\nOs dados financeiros serão mantidos no relatório.`
      );
      if (!ok) return;
      try {
        await marcarChamadoExcluidoSafe(chamado);
        await atualizarDadosPainel(false);
      } catch (error) {
        window.alert("Não foi possível excluir o chamado.");
      }
    }

    async function handleResponderContestacao() {
      if (!state.respondendo) return;
      if (!state.textoResposta.trim()) {
        window.alert("Atenção ❄\nInforme a resposta.");
        return;
      }

      state.salvando = true;
      render();

      const item = state.respondendo;
      const respostaTexto = state.textoResposta.trim();
      await responderContestacaoSafe(item.numero, respostaTexto);
      await notificarPushContestacao(item);

      state.salvando = false;
      state.respondendo = null;
      state.textoResposta = "";
      await atualizarDadosPainel(false);
      render();

      const avisarWhats = window.confirm("📲 Notificar cliente?\nDeseja enviar a resposta via WhatsApp?");
      if (avisarWhats) notificarWhatsAppResposta(item, respostaTexto);
    }

    function abrirTelaChamado(numero) {
      const chamado = [...state.chamadosPendentes, ...state.chamadosAtivos, ...state.chamadosConcluidos].find(
        (item) => item.numero === numero
      );
      if (!chamado) return;
      if (props && typeof props.setChamadoSelecionado === "function") {
        props.setChamadoSelecionado(chamado);
      }
      if (props && typeof props.setTela === "function") props.setTela("chamadoDetalhes");
    }

    function abrirTelaProgramado(numero) {
      const item = state.programados.find((p) => p.numero === numero);
      if (!item) return;
      if (item.status === "Cancelado" || item.status === "Concluído") return;
      if (props && typeof props.setProgramadoSelecionado === "function") {
        props.setProgramadoSelecionado(item);
      }
      if (props && typeof props.setTela === "function") props.setTela("editarProgramado");
    }

    function cardChamadoHtml(chamado) {
      const config = STATUS_CONFIG[chamado.status] || STATUS_CONFIG["Aguardando técnico"];
      const urgente = chamado.urgencia === "Urgente";
      const deOrcamento = !!chamado.geradoDeOrcamento;
      const tipos = Array.isArray(chamado.tipos) ? chamado.tipos : [];

      return `
        <article
          class="pa-card pa-card-chamado${urgente ? " is-urgente" : ""}${deOrcamento ? " is-orcamento" : ""}"
          data-action="abrir-chamado"
          data-numero="${escapeHtml(chamado.numero)}"
        >
          ${
            urgente
              ? `
                <div class="pa-banner-urgente">
                  <span class="pa-urgente-led"></span>
                  <span>URGENTE</span>
                  <button class="pa-mini-btn" data-action="toggle-urgencia" data-numero="${escapeHtml(chamado.numero)}" type="button">
                    Alterar →
                  </button>
                </div>
              `
              : deOrcamento
                ? `
                  <div class="pa-banner-orc">
                    <span>🔗</span>
                    <span>Gerado do orçamento aprovado ${escapeHtml(chamado.geradoDeOrcamento)}</span>
                  </div>
                `
                : ""
          }

          <div class="pa-card-head">
            <div class="pa-numero-wrap">
              <span class="pa-numero">${escapeHtml(chamado.numero)}</span>
              ${
                !urgente && chamado.status !== "Concluído" && chamado.status !== "Cancelado"
                  ? `<button class="pa-urgencia-btn" data-action="toggle-urgencia" data-numero="${escapeHtml(chamado.numero)}" type="button">🚨</button>`
                  : ""
              }
            </div>
            <div class="pa-status" style="background:${config.cor}22;color:${config.cor}">
              <span>${config.icone}</span>
              <span>${escapeHtml(chamado.status)}</span>
            </div>
          </div>

          <div class="pa-info-list">
            <div class="pa-info-row"><span>👤</span><span>${escapeHtml(chamado.cliente || "-")}</span></div>
            ${
              chamado.dataCriacao
                ? `<div class="pa-info-row muted"><span>🗓️</span><span>Aberto em ${escapeHtml(chamado.dataCriacao)}</span></div>`
                : ""
            }
            <div class="pa-info-row"><span>📱</span><span>${escapeHtml(chamado.clienteTelefone || "Não informado")}</span></div>
            <div class="pa-info-row"><span>📅</span><span>${escapeHtml(chamado.dataFormatada || "-")} • ${escapeHtml(chamado.horario || "-")}</span></div>
            <div class="pa-info-row"><span>📍</span><span>${escapeHtml(chamado.endereco || "-")}</span></div>
            ${
              tipos.length
                ? `<div class="pa-tags">${tipos.map((tipo) => `<span class="pa-tag">${escapeHtml(tipo)}</span>`).join("")}</div>`
                : ""
            }
            ${chamado.tecnico ? `<div class="pa-info-row"><span>👷</span><span>Técnico: ${escapeHtml(chamado.tecnico)}</span></div>` : ""}
            ${
              chamado.valorCobrado
                ? `<div class="pa-info-row pay"><span>💰</span><span>R$ ${escapeHtml(chamado.valorCobrado)} • ${escapeHtml(chamado.formaPagamento || "")}</span></div>`
                : ""
            }
          </div>

          <div class="pa-card-foot">
            <span class="pa-link">Ver detalhes →</span>
            ${
              state.abaSelecionada === "concluidos"
                ? `<button class="pa-delete-btn" data-action="excluir-chamado" data-numero="${escapeHtml(chamado.numero)}" type="button">🗑️</button>`
                : ""
            }
          </div>
        </article>
      `;
    }

    function cardProgramadoHtml(item) {
      const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.Agendado;
      const podeGerenciar = item.status !== "Cancelado" && item.status !== "Concluído";
      const expandido = !!state.historicoExpandido[item.numero];
      const historico = Array.isArray(item.historico) ? item.historico : [];
      const countdown = formatarDiasRestantes(item.dataChave);

      return `
        <article
          class="pa-card pa-card-programado${item.status === "Contestado" ? " is-contestado" : ""}${podeGerenciar ? " is-clickable" : ""}"
          data-action="${podeGerenciar ? "abrir-programado" : ""}"
          data-numero="${escapeHtml(item.numero)}"
        >
          <div class="pa-card-head">
            <span class="pa-numero">${escapeHtml(item.numero)}</span>
            <div class="pa-status" style="background:${config.cor}22;color:${config.cor}">
              <span>${config.icone}</span>
              <span>${escapeHtml(item.status)}</span>
            </div>
          </div>

          <div class="pa-info-list">
            ${
              countdown
                ? `<div class="pa-info-row countdown" style="color:${countdown.cor}"><span>⏳</span><span>${escapeHtml(countdown.texto)}</span></div>`
                : ""
            }
            <div class="pa-info-row"><span>🛠️</span><span>${escapeHtml(item.tipo || "-")}</span></div>
            <div class="pa-info-row"><span>👤</span><span>${escapeHtml(item.cliente || "-")}</span></div>
            <div class="pa-info-row"><span>📱</span><span>${escapeHtml(item.clienteTelefone || "Não informado")}</span></div>
            <div class="pa-info-row"><span>📅</span><span>${escapeHtml(item.dataFormatada || "-")} • ${escapeHtml(item.horario || "-")}</span></div>
            <div class="pa-info-row"><span>📍</span><span>${escapeHtml(item.endereco || "-")}</span></div>
            ${item.tecnico ? `<div class="pa-info-row"><span>👷</span><span>Técnico: ${escapeHtml(item.tecnico)}</span></div>` : ""}
          </div>

          ${
            historico.length
              ? `
                <button class="pa-historico-toggle" data-action="toggle-historico" data-numero="${escapeHtml(item.numero)}" type="button">
                  <span>💬 Histórico (${historico.length} mensagens)</span>
                  <span>${expandido ? "▲" : "▼"}</span>
                </button>
                ${
                  expandido
                    ? `<div class="pa-historico-list">
                        ${historico
                          .map((msg) => {
                            const contestacao = msg.tipo === "contestacao";
                            return `
                              <div class="pa-historico-item${contestacao ? " contestacao" : " resposta"}">
                                <div class="pa-historico-head">
                                  <span>${contestacao ? "⚠️ Cliente" : "💬 Suporte"}</span>
                                  <span>${escapeHtml(msg.data || "")} ${escapeHtml(msg.hora || "")}</span>
                                </div>
                                <p>${escapeHtml(msg.mensagem || "")}</p>
                              </div>
                            `;
                          })
                          .join("")}
                      </div>`
                    : ""
                }
              `
              : ""
          }

          ${
            podeGerenciar
              ? `
                <div class="pa-card-foot">
                  <span class="pa-link">Ver detalhes →</span>
                </div>
              `
              : ""
          }

          ${
            item.status === "Contestado"
              ? `<button class="pa-responder-btn" data-action="responder-programado" data-numero="${escapeHtml(item.numero)}" type="button">💬 Responder contestação</button>`
              : ""
          }
        </article>
      `;
    }

    function renderLista(lista) {
      if (state.carregando) {
        return `
          <div class="pa-loading">
            <div class="ch-spinner"></div>
            <p>Carregando painel...</p>
          </div>
        `;
      }
      if (!lista.length) {
        return `
          <div class="pa-empty">
            <p class="pa-empty-icon">❄</p>
            <p class="pa-empty-title">
              ${
                state.buscaCliente
                  ? `Nenhum resultado para "${escapeHtml(state.buscaCliente)}"`
                  : "Nenhum item encontrado nesta categoria"
              }
            </p>
            ${
              state.buscaCliente
                ? '<button class="pa-clear-filter" data-action="limpar-busca" type="button">Limpar filtro</button>'
                : ""
            }
          </div>
        `;
      }
      if (state.abaSelecionada === "programados") {
        return lista.map(cardProgramadoHtml).join("");
      }
      return lista.map(cardChamadoHtml).join("");
    }

    function bindEvents(listaAtual) {
      root.querySelector("#pa-sair").addEventListener("click", function () {
        if (props && typeof props.handleSair === "function") props.handleSair();
      });

      root.querySelector("#pa-content").addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "go-tela") {
          if (props && typeof props.setTela === "function") props.setTela(actionEl.dataset.tela);
          return;
        }

        if (action === "refresh") {
          atualizarDadosPainel(true);
          return;
        }

        if (action === "aba") {
          state.abaSelecionada = actionEl.dataset.value;
          state.buscaCliente = "";
          state.mostrarFiltro = false;
          render();
          return;
        }

        if (action === "toggle-filtro") {
          state.mostrarFiltro = !state.mostrarFiltro;
          if (!state.mostrarFiltro) state.buscaCliente = "";
          render();
          return;
        }

        if (action === "limpar-busca") {
          state.buscaCliente = "";
          render();
          return;
        }

        if (action === "toggle-urgencia") {
          handleAlterarUrgencia(actionEl.dataset.numero);
          return;
        }

        if (action === "excluir-chamado") {
          handleExcluirChamado(actionEl.dataset.numero);
          return;
        }

        if (action === "abrir-chamado") {
          abrirTelaChamado(actionEl.dataset.numero);
          return;
        }

        if (action === "abrir-programado") {
          abrirTelaProgramado(actionEl.dataset.numero);
          return;
        }

        if (action === "toggle-historico") {
          const numero = actionEl.dataset.numero;
          state.historicoExpandido[numero] = !state.historicoExpandido[numero];
          render();
          return;
        }

        if (action === "responder-programado") {
          const item = state.programados.find((p) => p.numero === actionEl.dataset.numero);
          if (!item) return;
          state.respondendo = item;
          state.textoResposta = "";
          render();
          return;
        }

        if (action === "cancelar-resposta") {
          state.respondendo = null;
          state.textoResposta = "";
          render();
          return;
        }

        if (action === "enviar-resposta") {
          handleResponderContestacao();
        }
      });

      const buscaInput = root.querySelector("#pa-busca");
      if (buscaInput) {
        buscaInput.addEventListener("input", function () {
          state.buscaCliente = buscaInput.value;
          render();
        });
      }

      const respostaInput = root.querySelector("#pa-resposta");
      if (respostaInput) {
        respostaInput.addEventListener("input", function () {
          state.textoResposta = respostaInput.value;
        });
      }
    }

    function render() {
      const lista = listaAbaAtual();
      root.innerHTML = `
        <section class="pa-screen">
          <div class="pa-fundos" id="pa-fundos"></div>
          <div class="pa-scroll" id="pa-content">
            <header class="pa-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Painel Admin</h1>
              </div>
              <button class="pa-sair" id="pa-sair" type="button">
                <span>❄</span>
                <span>Sair</span>
              </button>
            </header>

            <div class="pa-nav-grid">
              <button class="pa-nav-btn" data-action="go-tela" data-tela="profissionais" type="button">
                <span>👷</span><span>Equipe</span>
              </button>
              <button class="pa-nav-btn" data-action="go-tela" data-tela="agendaAdmin" type="button">
                <span>📅</span><span>Agenda</span>
              </button>
              <button class="pa-nav-btn is-highlight" data-action="go-tela" data-tela="abrirProgramado" type="button">
                <span>📋</span><span>Programar</span>
              </button>
              <button class="pa-nav-btn is-purple" data-action="go-tela" data-tela="criarOrcamentoAdmin" type="button">
                <span>💰</span><span>Orçamento</span>
              </button>
            </div>

            <button class="pa-wide-btn is-green" data-action="go-tela" data-tela="relatorio" type="button">
              <span>📊</span>
              <span>Relatório Financeiro</span>
            </button>

            <button class="pa-wide-btn is-whats" data-action="go-tela" data-tela="falarCliente" type="button">
              <span>💬</span>
              <span>Falar com Cliente</span>
            </button>

            ${
              state.respondendo
                ? `
                  <section class="pa-responder-box">
                    <h2>💬 Responder contestação</h2>
                    <p>Cliente: ${escapeHtml(state.respondendo.cliente || "-")} • ${escapeHtml(state.respondendo.numero)}</p>
                    ${
                      Array.isArray(state.respondendo.historico) && state.respondendo.historico.length
                        ? `
                          <div class="pa-last-contest">
                            <strong>⚠️ Última contestação:</strong>
                            <span>${escapeHtml(state.respondendo.historico[state.respondendo.historico.length - 1].mensagem || "")}</span>
                          </div>
                        `
                        : ""
                    }
                    <label for="pa-resposta">Sua resposta</label>
                    <textarea id="pa-resposta" placeholder="Digite sua resposta ao cliente...">${escapeHtml(state.textoResposta)}</textarea>
                    <div class="pa-responder-actions">
                      <button class="op-btn cancel" data-action="cancelar-resposta" type="button">Cancelar</button>
                      <button class="op-btn primary" data-action="enviar-resposta" type="button" ${state.salvando ? "disabled" : ""}>
                        ${state.salvando ? '<span class="op-spinner"></span>' : "💬 Enviar resposta"}
                      </button>
                    </div>
                  </section>
                `
                : ""
            }

            <div class="pa-resumo-grid">
              <article class="pa-resumo-card is-pendente">
                <strong>${state.chamadosPendentes.length}</strong>
                <span>Pendentes</span>
              </article>
              <article class="pa-resumo-card is-ativo">
                <strong>${state.chamadosAtivos.length}</strong>
                <span>Andamento</span>
              </article>
              <article class="pa-resumo-card is-concluido">
                <strong>${state.chamadosConcluidos.length}</strong>
                <span>Concluídos</span>
              </article>
              <article class="pa-resumo-card is-programado">
                <strong>${state.programados.length}</strong>
                <span>Programados</span>
              </article>
            </div>

            <button class="pa-orc-btn" data-action="go-tela" data-tela="orcamentoAdmin" type="button">
              <span class="pa-orc-icon-wrap">
                <span>💰</span>
                ${badgeHtml(state.totalOrcamentosPendentes)}
              </span>
              <span>Ver todos os orçamentos</span>
              ${
                state.totalOrcamentosPendentes > 0
                  ? `<span class="pa-orc-count">${state.totalOrcamentosPendentes} pendente${state.totalOrcamentosPendentes > 1 ? "s" : ""}</span>`
                  : ""
              }
            </button>

            <div class="pa-tabs">
              <button class="pa-tab${state.abaSelecionada === "pendentes" ? " is-active" : ""}" data-action="aba" data-value="pendentes" type="button">Pendentes</button>
              <button class="pa-tab${state.abaSelecionada === "ativos" ? " is-active" : ""}" data-action="aba" data-value="ativos" type="button">Andamento</button>
              <button class="pa-tab${state.abaSelecionada === "programados" ? " is-active" : ""}" data-action="aba" data-value="programados" type="button">Programados</button>
              <button class="pa-tab${state.abaSelecionada === "concluidos" ? " is-active" : ""}" data-action="aba" data-value="concluidos" type="button">Histórico</button>
            </div>

            <div class="pa-filter-wrap">
              <button class="pa-filter-toggle${state.buscaCliente ? " is-active" : ""}" data-action="toggle-filtro" type="button">
                <span>🔍 ${state.buscaCliente ? `Filtrando: ${escapeHtml(state.buscaCliente)}` : "Filtrar por cliente"}</span>
                <span>${state.mostrarFiltro ? "▲" : "▼"}</span>
              </button>
              ${
                state.mostrarFiltro
                  ? `
                    <div class="pa-filter-input-wrap">
                      <div class="ch-input-wrap">
                        <span class="ch-input-icon">👤</span>
                        <input id="pa-busca" class="ch-input" value="${escapeHtml(state.buscaCliente)}" placeholder="Nome ou e-mail do cliente..." />
                        ${
                          state.buscaCliente
                            ? `<button class="pa-clear-inline" data-action="limpar-busca" type="button">✕</button>`
                            : ""
                        }
                      </div>
                      ${
                        state.buscaCliente
                          ? `<p class="pa-filter-results">📊 ${lista.length} resultado${lista.length !== 1 ? "s" : ""} para "${escapeHtml(state.buscaCliente)}"</p>`
                          : ""
                      }
                    </div>
                  `
                  : ""
              }
            </div>

            <div class="pa-toolbar">
              <button class="pa-refresh-btn" data-action="refresh" type="button">
                ${state.refreshing ? "⏳ Atualizando..." : "🔄 Atualizar"}
              </button>
            </div>

            ${renderLista(lista)}
            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#pa-fundos"), "pa");
      bindEvents(lista);
    }

    render();
    subscribeChamados();
    subscribeProgramados();
    subscribeOrcamentos();

    return function cleanupPainelAdmin() {
      state.unsubscribers.forEach((fn) => {
        try {
          fn();
        } catch (error) {}
      });
      state.fallbackIntervals.forEach((interval) => clearInterval(interval));
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.painelAdmin = renderTelaPainelAdmin;
})();
