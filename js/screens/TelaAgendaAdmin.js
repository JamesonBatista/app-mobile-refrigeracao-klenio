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

  function getProximosDiasSafe() {
    if (typeof window.getProximosDias === "function") return window.getProximosDias();
    const dias = [];
    const hoje = new Date();
    let i = 0;
    while (dias.length < 7) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + i);
      i += 1;
      if (dia.getDay() !== 0) dias.push(dia);
    }
    return dias;
  }

  function formatarDataChaveSafe(data) {
    if (typeof window.formatarDataChave === "function") return window.formatarDataChave(data);
    return data.toISOString().split("T")[0];
  }

  function getHorariosDoDiaSafe(data) {
    if (typeof window.getHorariosDoDia === "function") return window.getHorariosDoDia(data);
    return isSabadoSafe(data) ? HORARIOS_SABADO : HORARIOS_SEMANA;
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

  function renderTelaAgendaAdmin(root, props) {
    const state = {
      dias: [],
      diaSelecionado: null,
      bloqueios: {},
      carregando: true,
      salvando: false,
      unsubscribe: null,
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
      return bloqueiosDia().includes("DIA_COMPLETO");
    }

    async function toggleHorario(horario) {
      const chave = chaveAtual();
      if (!chave || diaCompleto()) return;
      state.salvando = true;
      render();

      const bloqueados = bloqueiosDia();
      const jaBloqueado = bloqueados.includes(horario);
      if (jaBloqueado) {
        await removerBloqueioSafe(chave, horario);
        updateBloqueioState(
          state,
          chave,
          bloqueados.filter((item) => item !== horario)
        );
      } else {
        const atualizados = [...bloqueados, horario];
        await salvarBloqueioSafe(chave, atualizados);
        updateBloqueioState(state, chave, atualizados);
      }

      state.salvando = false;
      render();
    }

    async function toggleDiaCompleto() {
      const chave = chaveAtual();
      if (!chave) return;

      if (diaCompleto()) {
        state.salvando = true;
        render();
        await removerBloqueioSafe(chave, "DIA_COMPLETO");
        const atualizados = bloqueiosDia().filter((item) => item !== "DIA_COMPLETO");
        updateBloqueioState(state, chave, atualizados);
        state.salvando = false;
        render();
        return;
      }

      const ok = await showConfirm("Tem certeza que deseja bloquear todos os horários deste dia?");
      if (!ok) return;

      state.salvando = true;
      render();
      await salvarBloqueioSafe(chave, ["DIA_COMPLETO"]);
      updateBloqueioState(state, chave, ["DIA_COMPLETO"]);
      state.salvando = false;
      render();
    }

    function bindEvents() {
      const container = root.querySelector("#ta-container");
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
        }
      });
    }

    function renderDias() {
      return state.dias
        .map(function (dia) {
          const chave = formatarDataChaveSafe(dia);
          const selecionado = state.diaSelecionado && formatarDataChaveSafe(state.diaSelecionado) === chave;
          const bloqueios = Array.isArray(state.bloqueios[chave]) ? state.bloqueios[chave] : [];
          const temBloqueio = bloqueios.length > 0;
          const bloqueioTotal = bloqueios.includes("DIA_COMPLETO");
          const sabado = isSabadoSafe(dia);

          return `
            <button
              class="ta-dia-btn${selecionado ? " is-selected" : ""}${bloqueioTotal ? " is-total" : ""}${temBloqueio && !bloqueioTotal ? " is-partial" : ""}"
              data-action="select-dia"
              data-chave="${chave}"
              type="button"
            >
              <span class="ta-dia-week${sabado ? " is-sabado" : ""}">
                ${dia.toLocaleDateString("pt-BR", { weekday: "short" })}
              </span>
              <span class="ta-dia-num">${dia.getDate()}</span>
              <span class="ta-dia-month">${dia.toLocaleDateString("pt-BR", { month: "short" })}</span>
              ${bloqueioTotal ? '<span class="ta-dia-tag total">Bloqueado</span>' : ""}
              ${temBloqueio && !bloqueioTotal ? '<span class="ta-dia-tag partial">Parcial</span>' : ""}
            </button>
          `;
        })
        .join("");
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
                return `
                  <button
                    class="ta-horario-btn${bloqueado ? " is-blocked" : ""}"
                    data-action="toggle-horario"
                    data-horario="${horario}"
                    type="button"
                    ${total ? "disabled" : ""}
                  >
                    <span class="ta-horario-left">
                      <span>🕐</span>
                      <span>${horario}</span>
                    </span>
                    <span class="ta-status-pill${bloqueado ? " blocked" : ""}">
                      <span>${bloqueado ? "🔒" : "🔓"}</span>
                      <span>${bloqueado ? "Bloqueado" : "Disponível"}</span>
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
              <span>Horários bloqueados não ficam disponíveis para novos chamados.</span>
            </div>

            <article class="ch-card">
              <h2 class="ch-title">Selecione o dia</h2>
              <div class="ta-dias-scroll">
                ${renderDias()}
              </div>
            </article>

            ${renderHorarios()}
            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#ta-fundos"), "ta");
      bindEvents();
    }

    render();
    state.dias = getProximosDiasSafe();
    state.diaSelecionado = state.dias[0] || null;
    state.unsubscribe = ouvirBloqueiosSafe(function (dados) {
      state.bloqueios = dados || {};
      state.carregando = false;
      render();
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
