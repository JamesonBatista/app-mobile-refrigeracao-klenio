// js/screens/TelaAgendaAdmin.js

(function () {
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

  function parseObjectStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function setObjectStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function isSabadoSafe(data) {
    if (typeof window.isSabado === "function") return window.isSabado(data);
    return data.getDay() === 6;
  }

  function isDomingoSafe(data) {
    if (typeof window.isDomingo === "function") return window.isDomingo(data);
    return data.getDay() === 0;
  }

  function isFimDeSemanaSafe(data) {
    if (window.FimDeSemanaAgenda && typeof window.FimDeSemanaAgenda.isFimDeSemana === "function") {
      return window.FimDeSemanaAgenda.isFimDeSemana(data);
    }
    return isSabadoSafe(data) || isDomingoSafe(data);
  }

  function getProximosDiasSafe() {
    if (typeof window.getProximosDias === "function") {
      return window.getProximosDias(undefined, { incluirFimDeSemana: true });
    }
    const dias = [];
    const hoje = new Date();
    let i = 0;
    while (dias.length < 14) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + i);
      i += 1;
      dias.push(dia);
    }
    return dias;
  }

  function formatarDataChaveSafe(data) {
    if (typeof window.formatarDataChave === "function") return window.formatarDataChave(data);
    if (window.DataLocal && typeof window.DataLocal.formatarDataChaveLocal === "function") {
      return window.DataLocal.formatarDataChaveLocal(data);
    }
    const pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
  }

  function getHorariosDoDiaSafe(data) {
    if (typeof window.getHorariosDoDia === "function") return window.getHorariosDoDia(data);
    return isFimDeSemanaSafe(data) ? HORARIOS_SABADO : HORARIOS_SEMANA;
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

  function carregarOcupacaoLocal() {
    const chamados = parseArrayStorage("@chamados");
    const programados = parseArrayStorage("@programados");
    if (window.AgendaOcupacao && typeof window.AgendaOcupacao.montarOcupacaoPorDia === "function") {
      return window.AgendaOcupacao.montarOcupacaoPorDia(chamados.concat(programados));
    }
    return {};
  }

  function ocupantesHorario(mapa, chave, horario) {
    if (window.AgendaOcupacao && typeof window.AgendaOcupacao.ocupantesDoHorario === "function") {
      return window.AgendaOcupacao.ocupantesDoHorario(mapa, chave, horario);
    }
    return [];
  }

  async function salvarBloqueioSafe(chave, lista) {
    if (typeof window.salvarBloqueio === "function") {
      await window.salvarBloqueio(chave, lista);
      return;
    }
    const bloqueios = parseObjectStorage("@bloqueiosAgenda");
    bloqueios[chave] = Array.from(new Set(lista));
    setObjectStorage("@bloqueiosAgenda", bloqueios);
  }

  async function removerBloqueioSafe(chave, horario) {
    if (typeof window.removerBloqueio === "function") {
      await window.removerBloqueio(chave, horario);
      return;
    }
    const bloqueios = parseObjectStorage("@bloqueiosAgenda");
    const dia = Array.isArray(bloqueios[chave]) ? bloqueios[chave] : [];
    const atualizado = dia.filter((item) => item !== horario);
    if (atualizado.length > 0) bloqueios[chave] = atualizado;
    else delete bloqueios[chave];
    setObjectStorage("@bloqueiosAgenda", bloqueios);
  }

  function ouvirBloqueiosSafe(callback) {
    if (typeof window.ouvirBloqueios === "function") {
      const unsub = window.ouvirBloqueios(function (dados) {
        callback(dados && typeof dados === "object" ? dados : {});
      });
      return typeof unsub === "function" ? unsub : function () {};
    }

    callback(parseObjectStorage("@bloqueiosAgenda"));
    const interval = setInterval(function () {
      callback(parseObjectStorage("@bloqueiosAgenda"));
    }, 3000);
    return function () {
      clearInterval(interval);
    };
  }

  function updateBloqueioState(state, chave, lista) {
    const novo = { ...state.bloqueios };
    if (lista.length > 0) novo[chave] = lista;
    else delete novo[chave];
    state.bloqueios = novo;
  }

  async function showConfirm(message) {
    return window.showAppConfirm(message);
  }

  function escapeAttr(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function hojeChaveSafe() {
    return formatarDataChaveSafe(new Date());
  }

  function horariosPossiveisPeriodo() {
    return Array.from(new Set(HORARIOS_SEMANA.concat(HORARIOS_SABADO)));
  }

  async function gravarBloqueiosEmLote(atualizacoes) {
    const chaves = Object.keys(atualizacoes);
    const TAMANHO_LOTE = 10;
    for (let i = 0; i < chaves.length; i += TAMANHO_LOTE) {
      const lote = chaves.slice(i, i + TAMANHO_LOTE);
      await Promise.all(
        lote.map(function (chave) {
          return salvarBloqueioSafe(chave, atualizacoes[chave]);
        })
      );
    }
  }

  function renderTelaAgendaAdmin(root, props) {
    const state = {
      dias: [],
      diaSelecionado: null,
      bloqueios: {},
      ocupacao: {},
      carregando: true,
      salvando: false,
      unsubscribe: null,
      periodo: { inicio: "", fim: "", modo: "dia", horarios: [] },
    };

    function chaveAtual() {
      return state.diaSelecionado ? formatarDataChaveSafe(state.diaSelecionado) : null;
    }

    function horariosDia() {
      return state.diaSelecionado ? getHorariosDoDiaSafe(state.diaSelecionado) : [];
    }

    function bloqueiosDia() {
      const chave = chaveAtual();
      if (!chave) return [];
      return Array.isArray(state.bloqueios[chave]) ? state.bloqueios[chave] : [];
    }

    function diaCompleto() {
      if (!state.diaSelecionado) return false;
      if (window.FimDeSemanaAgenda && typeof window.FimDeSemanaAgenda.isDiaCompletoBloqueado === "function") {
        return window.FimDeSemanaAgenda.isDiaCompletoBloqueado(state.diaSelecionado, bloqueiosDia());
      }
      if (bloqueiosDia().includes("DIA_COMPLETO")) return true;
      if (isFimDeSemanaSafe(state.diaSelecionado) && !bloqueiosDia().includes("LIBERADO")) return true;
      return false;
    }

    async function toggleHorario(horario) {
      const chave = chaveAtual();
      if (!chave || diaCompleto()) return;
      state.salvando = true;
      render();

      const bloqueados = bloqueiosDia().filter(function (item) {
        return item !== "LIBERADO" && item !== "DIA_COMPLETO";
      });
      const jaBloqueado = bloqueados.includes(horario);
      try {
        let atualizados;
        if (jaBloqueado) {
          atualizados = bloqueados.filter((item) => item !== horario);
        } else {
          atualizados = [...bloqueados, horario];
        }
        // Mantém LIBERADO em fim de semana desbloqueado para o cliente continuar vendo o dia
        if (isFimDeSemanaSafe(state.diaSelecionado)) {
          atualizados = ["LIBERADO"].concat(atualizados);
        }
        await salvarBloqueioSafe(chave, atualizados);
        updateBloqueioState(state, chave, atualizados);
      } catch (error) {
        window.showAppAlert("Não foi possível concluir o bloqueio agora. Tente novamente.");
      }

      state.salvando = false;
      render();
    }

    async function toggleDiaCompleto() {
      const chave = chaveAtual();
      if (!chave || !state.diaSelecionado) return;

      if (diaCompleto()) {
        const okLibera = isFimDeSemanaSafe(state.diaSelecionado)
          ? await showConfirm(
              "Desbloquear este fim de semana?\nO dia ficará visível para os clientes agendarem."
            )
          : true;
        if (!okLibera) return;

        state.salvando = true;
        render();
        try {
          const atualizados =
            window.FimDeSemanaAgenda && typeof window.FimDeSemanaAgenda.horariosAposDesbloquearDia === "function"
              ? window.FimDeSemanaAgenda.horariosAposDesbloquearDia(state.diaSelecionado, bloqueiosDia())
              : isFimDeSemanaSafe(state.diaSelecionado)
                ? ["LIBERADO"]
                : bloqueiosDia().filter((item) => item !== "DIA_COMPLETO");
          await salvarBloqueioSafe(chave, atualizados);
          updateBloqueioState(state, chave, atualizados);
        } catch (error) {
          window.showAppAlert("Não foi possível concluir o desbloqueio agora. Tente novamente.");
        }
        state.salvando = false;
        render();
        return;
      }

      const ok = await showConfirm(
        isFimDeSemanaSafe(state.diaSelecionado)
          ? "Bloquear este fim de semana novamente?\nClientes não verão mais este dia."
          : "Tem certeza que deseja bloquear todos os horários deste dia?"
      );
      if (!ok) return;

      state.salvando = true;
      render();
      try {
        const atualizados =
          window.FimDeSemanaAgenda && typeof window.FimDeSemanaAgenda.horariosAposBloquearDiaCompleto === "function"
            ? window.FimDeSemanaAgenda.horariosAposBloquearDiaCompleto()
            : ["DIA_COMPLETO"];
        await salvarBloqueioSafe(chave, atualizados);
        updateBloqueioState(state, chave, atualizados);
      } catch (error) {
        window.showAppAlert("Não foi possível concluir o bloqueio agora. Tente novamente.");
      }
      state.salvando = false;
      render();
    }

    function descricaoHorariosPeriodo(horarios, diaCompleto) {
      if (diaCompleto) return "Dia inteiro";
      return horarios.join(", ");
    }

    async function aplicarAtualizacoesPeriodo(atualizacoes, mensagemErro) {
      state.salvando = true;
      render();
      try {
        await gravarBloqueiosEmLote(atualizacoes);
        Object.keys(atualizacoes).forEach(function (chave) {
          updateBloqueioState(state, chave, atualizacoes[chave]);
        });
        return true;
      } catch (error) {
        window.showAppAlert(mensagemErro);
        return false;
      } finally {
        state.salvando = false;
        render();
      }
    }

    async function bloquearPeriodo() {
      const periodo = state.periodo;
      const validacao = window.BloqueioPeriodo.validarPeriodo(periodo.inicio, periodo.fim, hojeChaveSafe());
      if (!validacao.ok) {
        window.showAppAlert(validacao.erro);
        return;
      }
      const horarios = periodo.modo === "horarios" ? periodo.horarios : [];
      if (periodo.modo === "horarios" && horarios.length === 0) {
        window.showAppAlert("Selecione ao menos um horário para bloquear.");
        return;
      }

      let inicio = periodo.inicio;
      if (inicio < hojeChaveSafe()) inicio = hojeChaveSafe();
      const chaves = window.BloqueioPeriodo.listarChavesPeriodo(inicio, periodo.fim);
      const atualizacoes = window.BloqueioPeriodo.calcularBloqueioPeriodo(state.bloqueios, chaves, horarios);
      if (Object.keys(atualizacoes).length === 0) {
        window.showAppAlert("Nenhuma alteração: esse período já está bloqueado.");
        return;
      }

      const ok = await showConfirm(
        `Bloquear ${window.BloqueioPeriodo.formatarChaveBR(inicio)} a ${window.BloqueioPeriodo.formatarChaveBR(periodo.fim)} (${descricaoHorariosPeriodo(horarios, horarios.length === 0)})?\nClientes não poderão abrir chamados nesse período. Chamados já agendados não são cancelados.`
      );
      if (!ok) return;

      const salvou = await aplicarAtualizacoesPeriodo(
        atualizacoes,
        "Não foi possível bloquear o período agora. Tente novamente."
      );
      if (salvou) {
        state.periodo = { inicio: "", fim: "", modo: "dia", horarios: [] };
        render();
        window.showAppAlert("Período bloqueado ❄\nOs clientes não poderão mais abrir chamados nesse período.");
      }
    }

    async function desbloquearGrupo(inicio, fim, assinatura) {
      const grupo = window.BloqueioPeriodo.agruparPeriodosBloqueados(state.bloqueios, hojeChaveSafe()).find(
        function (item) {
          return item.inicio === inicio && item.fim === fim && item.assinatura === assinatura;
        }
      );
      if (!grupo) return;
      const ok = await showConfirm(
        `Desbloquear ${window.BloqueioPeriodo.formatarChaveBR(grupo.inicio)} a ${window.BloqueioPeriodo.formatarChaveBR(grupo.fim)}?\nClientes poderão voltar a abrir chamados nesse período.`
      );
      if (!ok) return;
      const chaves = window.BloqueioPeriodo.listarChavesPeriodo(grupo.inicio, grupo.fim);
      const itens = (grupo.diaCompleto ? [window.BloqueioPeriodo.DIA_COMPLETO] : []).concat(grupo.horarios);
      const atualizacoes = window.BloqueioPeriodo.calcularDesbloqueioPeriodo(state.bloqueios, chaves, itens);
      await aplicarAtualizacoesPeriodo(
        atualizacoes,
        "Não foi possível desbloquear o período agora. Tente novamente."
      );
    }

    function bindEvents() {
      const container = root.querySelector("#ta-container");
      if (!container) return;

      container.addEventListener("change", function (event) {
        const campo = event.target.closest("[data-field]");
        if (!campo) return;
        if (campo.dataset.field === "periodo-inicio") {
          state.periodo.inicio = campo.value;
          if (state.periodo.fim && state.periodo.fim < campo.value) state.periodo.fim = campo.value;
          if (!state.periodo.fim) state.periodo.fim = campo.value;
          render();
        } else if (campo.dataset.field === "periodo-fim") {
          state.periodo.fim = campo.value;
        }
      });

      container.addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "select-dia") {
          const chave = actionEl.dataset.chave;
          const dia = state.dias.find((item) => formatarDataChaveSafe(item) === chave);
          if (!dia) return;
          state.diaSelecionado = dia;
          render();
          return;
        }
        if (action === "toggle-dia-completo") {
          toggleDiaCompleto();
          return;
        }
        if (action === "toggle-horario") {
          toggleHorario(actionEl.dataset.horario);
          return;
        }
        if (action === "periodo-modo") {
          state.periodo.modo = actionEl.dataset.modo === "horarios" ? "horarios" : "dia";
          render();
          return;
        }
        if (action === "periodo-horario") {
          const horario = actionEl.dataset.horario;
          const atual = state.periodo.horarios;
          state.periodo.horarios = atual.includes(horario)
            ? atual.filter((item) => item !== horario)
            : atual.concat([horario]);
          render();
          return;
        }
        if (action === "bloquear-periodo") {
          if (!state.salvando) bloquearPeriodo();
          return;
        }
        if (action === "desbloquear-grupo") {
          if (!state.salvando) {
            desbloquearGrupo(actionEl.dataset.inicio, actionEl.dataset.fim, actionEl.dataset.assinatura);
          }
        }
      });
    }

    function renderDias() {
      return state.dias
        .map(function (dia) {
          const chave = formatarDataChaveSafe(dia);
          const selecionado = state.diaSelecionado && formatarDataChaveSafe(state.diaSelecionado) === chave;
          const bloqueios = Array.isArray(state.bloqueios[chave]) ? state.bloqueios[chave] : [];
          const bloqueioTotal =
            window.FimDeSemanaAgenda && typeof window.FimDeSemanaAgenda.isDiaCompletoBloqueado === "function"
              ? window.FimDeSemanaAgenda.isDiaCompletoBloqueado(dia, bloqueios)
              : bloqueios.includes("DIA_COMPLETO") ||
                (isFimDeSemanaSafe(dia) && !bloqueios.includes("LIBERADO"));
          const horariosParciais = bloqueios.filter(function (item) {
            return item !== "DIA_COMPLETO" && item !== "LIBERADO";
          });
          const temBloqueioParcial = !bloqueioTotal && horariosParciais.length > 0;
          const fimDeSemana = isFimDeSemanaSafe(dia);

          return `
            <button
              class="ta-dia-btn${selecionado ? " is-selected" : ""}${bloqueioTotal ? " is-total" : ""}${temBloqueioParcial ? " is-partial" : ""}"
              data-action="select-dia"
              data-chave="${chave}"
              type="button"
            >
              <span class="ta-dia-week${fimDeSemana ? " is-sabado" : ""}">
                ${dia.toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
              <span class="ta-dia-num">${dia.getDate()}</span>
              <span class="ta-dia-month">${dia.toLocaleDateString("pt-BR", { month: "short" })}</span>
              ${bloqueioTotal ? '<span class="ta-dia-tag total">Bloqueado</span>' : ""}
              ${temBloqueioParcial ? '<span class="ta-dia-tag partial">Parcial</span>' : ""}
            </button>
          `;
        })
        .join("");
    }

    function renderPeriodoBloqueio() {
      const periodo = state.periodo;
      const hoje = hojeChaveSafe();
      const porHorario = periodo.modo === "horarios";
      return `
        <article class="ch-card ta-card ta-periodo-card">
          <div class="ta-horario-head">
            <span>
              <h2 class="ch-title">Bloquear período</h2>
              <p class="ch-sub">Escolha qualquer intervalo de datas, mesmo além dos próximos dias.</p>
            </span>
            ${state.salvando ? '<div class="ch-spinner" style="margin:0"></div>' : ""}
          </div>

          <div class="ta-periodo-datas">
            <label class="ta-periodo-campo">
              <span>De</span>
              <input type="date" data-field="periodo-inicio" min="${hoje}" value="${escapeAttr(periodo.inicio)}" />
            </label>
            <label class="ta-periodo-campo">
              <span>Até</span>
              <input type="date" data-field="periodo-fim" min="${escapeAttr(periodo.inicio || hoje)}" value="${escapeAttr(periodo.fim)}" />
            </label>
          </div>

          <div class="ta-periodo-modos">
            <button class="ta-periodo-modo${porHorario ? "" : " is-active"}" data-action="periodo-modo" data-modo="dia" type="button">Dia inteiro</button>
            <button class="ta-periodo-modo${porHorario ? " is-active" : ""}" data-action="periodo-modo" data-modo="horarios" type="button">Horários específicos</button>
          </div>

          ${
            porHorario
              ? `<div class="ta-periodo-horarios">${horariosPossiveisPeriodo()
                  .map(function (horario) {
                    const ativo = periodo.horarios.includes(horario);
                    return `<button class="ta-periodo-chip${ativo ? " is-active" : ""}" data-action="periodo-horario" data-horario="${escapeAttr(horario)}" type="button">${horario}</button>`;
                  })
                  .join("")}</div>`
              : ""
          }

          <button class="ta-dia-completo-btn is-active" data-action="bloquear-periodo" type="button" ${state.salvando ? "disabled" : ""}>
            <span>🔒</span>
            <span>Bloquear período</span>
          </button>

          ${renderPeriodosBloqueados()}
        </article>
      `;
    }

    function renderPeriodosBloqueados() {
      if (!window.BloqueioPeriodo) return "";
      const grupos = window.BloqueioPeriodo.agruparPeriodosBloqueados(state.bloqueios, hojeChaveSafe());
      if (grupos.length === 0) {
        return '<p class="ch-sub ta-periodo-vazio">Nenhum período bloqueado no momento.</p>';
      }
      return `
        <h3 class="ta-periodo-lista-titulo">Períodos bloqueados</h3>
        <div class="ta-periodo-lista">
          ${grupos
            .map(function (grupo) {
              const rotulo =
                grupo.inicio === grupo.fim
                  ? window.BloqueioPeriodo.formatarChaveBR(grupo.inicio)
                  : `${window.BloqueioPeriodo.formatarChaveBR(grupo.inicio)} a ${window.BloqueioPeriodo.formatarChaveBR(grupo.fim)}`;
              const detalhe = descricaoHorariosPeriodo(grupo.horarios, grupo.diaCompleto);
              return `
                <div class="ta-periodo-item">
                  <span class="ta-periodo-item-info">
                    <strong>${rotulo}</strong>
                    <small>${grupo.diaCompleto && grupo.horarios.length > 0 ? `Dia inteiro + ${grupo.horarios.join(", ")}` : detalhe}</small>
                  </span>
                  <button class="ta-periodo-remover" data-action="desbloquear-grupo" data-inicio="${grupo.inicio}" data-fim="${grupo.fim}" data-assinatura="${escapeAttr(grupo.assinatura)}" type="button" ${state.salvando ? "disabled" : ""}>Desbloquear</button>
                </div>
              `;
            })
            .join("")}
        </div>
      `;
    }

    function renderHorarios() {
      if (!state.diaSelecionado) return "";
      const horarios = horariosDia();
      const bloqueados = bloqueiosDia();
      const total = diaCompleto();
      const tituloData = state.diaSelecionado.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      });

      if (state.carregando) {
        return `
          <article class="ch-card ta-card">
            <div class="tp-loading"><div class="ch-spinner"></div></div>
          </article>
        `;
      }

      return `
        <article class="ch-card ta-card">
          <div class="ta-horario-head">
            <span>
              <h2 class="ch-title">Horários</h2>
              <p class="ch-sub">${tituloData}</p>
            </span>
            ${state.salvando ? '<div class="ch-spinner" style="margin:0"></div>' : ""}
          </div>

          <button class="ta-dia-completo-btn${total ? " is-active" : ""}" data-action="toggle-dia-completo" type="button">
            <span>${total ? "🔓" : "🔒"}</span>
            <span>${total ? "Desbloquear dia completo" : "Bloquear dia completo"}</span>
          </button>

          <div class="ta-horarios-list">
            ${horarios
              .map(function (horario) {
                const bloqueado = bloqueados.includes(horario) || total;
                const chave = chaveAtual();
                const ocupantes = ocupantesHorario(state.ocupacao, chave, horario);
                const ocupado = ocupantes.length > 0;
                const nomes = ocupantes
                  .map(function (o) {
                    return o.cliente || o.numero || "Atendimento";
                  })
                  .join(", ");
                return `
                  <button
                    class="ta-horario-btn${bloqueado ? " is-blocked" : ""}${ocupado && !bloqueado ? " is-ocupado" : ""}"
                    data-action="toggle-horario"
                    data-horario="${horario}"
                    type="button"
                    ${total ? "disabled" : ""}
                  >
                    <span class="ta-horario-left">
                      <span>🕐</span>
                      <span>${horario}</span>
                    </span>
                    <span class="ta-status-pill${bloqueado ? " blocked" : ocupado ? " occupied" : ""}">
                      <span>${bloqueado ? "🔒" : ocupado ? "📌" : "🔓"}</span>
                      <span>${
                        bloqueado
                          ? "Bloqueado"
                          : ocupado
                            ? `Ocupado${nomes ? `: ${nomes}` : ""}`
                            : "Disponível"
                      }</span>
                    </span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </article>
      `;
    }

    function render() {
      const scrollAnterior = root.querySelector("#ta-container");
      const scrollTop = scrollAnterior ? scrollAnterior.scrollTop : 0;
      root.innerHTML = `
        <section class="ta-screen">
          <div class="ta-fundos" id="ta-fundos"></div>
          <div class="ta-scroll" id="ta-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Gerenciar Agenda</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <div class="ta-alert">
              <span style="font-size:20px">⚠️</span>
              <span>Sábados e domingos ficam bloqueados por padrão. Só o admin pode desbloquear para o cliente ver. Horários e períodos bloqueados não ficam disponíveis para novos chamados.</span>
            </div>

            <article class="ch-card">
              <h2 class="ch-title">Selecione o dia</h2>
              <div class="ta-dias-scroll">
                ${renderDias()}
              </div>
            </article>

            ${renderHorarios()}
            ${renderPeriodoBloqueio()}
            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#ta-fundos"), "ta");
      bindEvents();
      const novoContainer = root.querySelector("#ta-container");
      if (novoContainer && scrollTop > 0) novoContainer.scrollTop = scrollTop;
    }

    render();
    state.dias = getProximosDiasSafe();
    state.diaSelecionado = state.dias[0] || null;
    state.ocupacao = carregarOcupacaoLocal();
    state.unsubscribe = ouvirBloqueiosSafe(function (dados) {
      const novos = dados || {};
      const mudou = JSON.stringify(novos) !== JSON.stringify(state.bloqueios);
      const eraCarregando = state.carregando;
      state.bloqueios = novos;
      state.ocupacao = carregarOcupacaoLocal();
      state.carregando = false;
      if (mudou || eraCarregando) render();
    });
    render();

    return function cleanupAgendaAdmin() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.agendaAdmin = renderTelaAgendaAdmin;
})();
