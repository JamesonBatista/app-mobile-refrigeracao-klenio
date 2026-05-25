// js/screens/TelaAprovarOrcamento.js

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

  function gerarNumeroChamado() {
    return `#${Math.floor(Math.random() * 90000 + 10000)}`;
  }

  function isSabado(data) {
    return data.getDay() === 6;
  }

  function formatarDataChave(data) {
    return data.toISOString().split("T")[0];
  }

  function formatarData(data) {
    return data.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  function getProximosDiasSafe() {
    if (typeof window.getProximosDias === "function") {
      return window.getProximosDias();
    }
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

  async function atualizarOrcamentoSafe(numero, updates) {
    if (typeof window.atualizarOrcamento === "function") {
      await window.atualizarOrcamento(numero, updates);
      return;
    }
    try {
      const raw = localStorage.getItem("@orcamentos");
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex((item) => item.numero === numero);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...updates };
        localStorage.setItem("@orcamentos", JSON.stringify(lista));
      }
    } catch (error) {}
  }

  async function salvarChamadoSafe(chamado) {
    if (typeof window.salvarChamado === "function") {
      await window.salvarChamado(chamado);
      return;
    }
    throw new Error("Serviço de chamados indisponível");
  }

  async function notificarAdminSafe(orcamento, dia, horario) {
    try {
      if (
        typeof window.buscarTokenAdmin === "function" &&
        typeof window.enviarNotificacaoPush === "function"
      ) {
        const token = await window.buscarTokenAdmin();
        if (token) {
          await window.enviarNotificacaoPush(
            token,
            "✅ Orçamento aprovado!",
            `${orcamento.cliente} aprovou o orçamento ${orcamento.numero} para ${formatarData(dia)} às ${horario}.`,
            { tela: "painelAdmin" }
          );
        }
      }
    } catch (error) {
      console.log("Erro notificação:", error);
    }
  }

  function renderTelaAprovarOrcamento(root, props) {
    const state = {
      dias: getProximosDiasSafe(),
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      carregandoHorarios: false,
      diasLotados: {},
      salvando: false,
    };

    const orcamento = props && props.orcamentoParaAprovar ? props.orcamentoParaAprovar : null;

    async function verificarDiasLotados() {
      const lotados = {};
      for (const dia of state.dias) {
        const horarios = await getHorariosDisponiveisSafe(dia);
        if (!horarios || horarios.length === 0) {
          lotados[formatarDataChave(dia)] = true;
        }
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

    async function handleConfirmar() {
      if (!state.diaSelecionado || !state.horario) {
        window.showAppAlert("Atenção ❄\nSelecione o dia e horário do atendimento.");
        return;
      }
      if (!orcamento) return;

      state.salvando = true;
      render();
      try {
        await atualizarOrcamentoSafe(orcamento.numero, { status: "Aprovado" });

        const chamado = {
          numero: gerarNumeroChamado(),
          tipos: orcamento.tipoServico ? orcamento.tipoServico.split(", ") : ["Serviço de AR"],
          endereco: orcamento.endereco,
          dataFormatada: formatarData(state.diaSelecionado),
          dataChave: formatarDataChave(state.diaSelecionado),
          horario: state.horario,
          detalhes:
            `Chamado gerado a partir do orçamento aprovado ${orcamento.numero}.\n` +
            `Serviço: ${orcamento.tipoServico}\n` +
            `Aparelho: ${orcamento.tipoAparelho}\n` +
            `BTUs: ${orcamento.btu}\n` +
            `Quantidade: ${orcamento.quantidade} unid.\n` +
            (orcamento.metragem && orcamento.metragem !== "Não informado"
              ? `Metragem: ${orcamento.metragem}\n`
              : "") +
            `Valor aprovado: R$ ${orcamento.valorOrcamento}\n` +
            (orcamento.descricaoAdmin ? `Descrição: ${orcamento.descricaoAdmin}` : ""),
          status: "Aguardando técnico",
          cliente: orcamento.cliente,
          clienteEmail: orcamento.clienteEmail,
          clienteTelefone: orcamento.clienteTelefone || "",
          observacaoTecnica: "",
          tecnico: "",
          dataCriacao: new Date().toLocaleDateString("pt-BR"),
          geradoDeOrcamento: orcamento.numero,
          tipoServico: orcamento.tipoServico,
          tipoAparelho: orcamento.tipoAparelho,
          btu: orcamento.btu,
          quantidade: orcamento.quantidade,
          metragem: orcamento.metragem,
          valorOrcamento: orcamento.valorOrcamento,
        };

        await salvarChamadoSafe(chamado);
        await notificarAdminSafe(orcamento, state.diaSelecionado, state.horario);

        state.salvando = false;
        render();

        window.showAppAlert(
          `Orçamento aprovado! ✅\n\nSeu chamado foi criado para ${formatarData(state.diaSelecionado)} às ${state.horario}. Acompanhe em "Meus Chamados".`
        );
        if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
      } catch (error) {
        console.log("Erro ao aprovar orçamento:", error);
        state.salvando = false;
        render();
        window.showAppAlert("Erro\nNão foi possível concluir a aprovação agora. Tente novamente em instantes.");
      }
    }

    function renderDias() {
      return state.dias.map((dia) => {
        const chave = formatarDataChave(dia);
        const lotado = !!state.diasLotados[chave];
        const selecionado = state.diaSelecionado && formatarDataChave(state.diaSelecionado) === chave;
        const sabado = isSabado(dia);
        return `
          <button class="oa-dia-btn${selecionado ? " is-selected" : ""}${lotado ? " is-lotado" : ""}" data-action="dia" data-chave="${chave}" type="button" ${lotado ? "disabled" : ""}>
            <div class="oa-dia-semana${sabado ? " is-sabado" : ""}">${dia.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
            <div class="oa-dia-num">${dia.getDate()}</div>
            <div class="oa-dia-mes">${dia.toLocaleDateString("pt-BR", { month: "short" })}</div>
            ${lotado ? '<div class="oa-dia-lotado">Lotado</div>' : ""}
          </button>
        `;
      }).join("");
    }

    function renderHorarios() {
      if (!state.diaSelecionado) return "";
      if (state.carregandoHorarios) {
        return `
          <div class="oa-horarios-wrap">
            <p class="ch-sub">Horários disponíveis</p>
            <div class="op-spinner"></div>
          </div>
        `;
      }
      if (state.horariosDisponiveis.length === 0) {
        return `
          <div class="oa-horarios-wrap">
            <p class="ch-sub">Horários disponíveis</p>
            <p class="op-empty-sub">❄ Nenhum horário disponível neste dia</p>
          </div>
        `;
      }
      return `
        <div class="oa-horarios-wrap">
          <p class="ch-sub">Horários disponíveis</p>
          ${state.horariosDisponiveis.map((h) => {
            const selected = state.horario === h;
            return `
              <button class="oa-horario-btn${selected ? " is-selected" : ""}" data-action="horario" data-horario="${escapeHtml(h)}" type="button">
                <span>🕐</span>
                <span class="oa-horario-label">${escapeHtml(h)}</span>
                ${selected ? '<span class="oa-horario-check">✓</span>' : ""}
              </button>
            `;
          }).join("")}
        </div>
      `;
    }

    function bindEvents() {
      root.querySelector("#oa-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("meusOrcamentos");
      });

      root.querySelector("#oa-container").addEventListener("click", function (event) {
        const btn = event.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;
        if (action === "dia") {
          selecionarDia(btn.dataset.chave);
        } else if (action === "horario") {
          state.horario = btn.dataset.horario;
          render();
        }
      });

      const confirmar = root.querySelector("#oa-confirmar");
      if (confirmar) confirmar.addEventListener("click", handleConfirmar);
    }

    function render() {
      if (!orcamento) {
        root.innerHTML = `
          <section class="oa-screen">
            <div class="oa-fundos" id="oa-fundos"></div>
            <div class="oa-scroll">
              <div class="op-empty">
                <p class="op-empty-icon">💰</p>
                <p class="op-empty-title">Nenhum orçamento selecionado</p>
                <p class="op-empty-sub">Volte para Meus Orçamentos e selecione um item.</p>
                <button class="op-btn primary op-empty-btn" id="oa-voltar-vazio" type="button">← Voltar</button>
              </div>
            </div>
          </section>
        `;
        criarFlocosFundo(root.querySelector("#oa-fundos"), "oa");
        root.querySelector("#oa-voltar-vazio").addEventListener("click", function () {
          if (props && typeof props.setTela === "function") props.setTela("meusOrcamentos");
        });
        return;
      }

      root.innerHTML = `
        <section class="oa-screen">
          <div class="oa-fundos" id="oa-fundos"></div>
          <div class="oa-scroll" id="oa-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Aprovar Orçamento</h1>
              </div>
              <button class="ch-voltar" id="oa-voltar" type="button">← Voltar</button>
            </header>

            <article class="ch-card" style="margin-bottom:20px">
              <div class="oa-resumo-ok">
                <span style="font-size:20px">✅</span>
                <span>
                  <span class="oa-resumo-ok-title">Aprovando orçamento</span><br />
                  <span class="oa-resumo-ok-sub">${escapeHtml(orcamento.numero)}</span>
                </span>
              </div>

              <div class="ep-grid">
                <div class="ep-grid-row">
                  <span class="ep-grid-label">Serviço</span>
                  <span class="ep-grid-value">${escapeHtml(orcamento.tipoServico)}</span>
                </div>
                <div class="ep-grid-row">
                  <span class="ep-grid-label">Aparelho</span>
                  <span class="ep-grid-value">${escapeHtml(orcamento.tipoAparelho)}</span>
                </div>
                <div class="ep-grid-row">
                  <span class="ep-grid-label">Endereço</span>
                  <span class="ep-grid-value">${escapeHtml(orcamento.endereco)}</span>
                </div>
                <div class="oa-valor-box">
                  <span class="oa-valor-box-title">💰 Valor aprovado</span>
                  <span class="oa-valor-box-value">R$ ${escapeHtml(orcamento.valorOrcamento)}</span>
                </div>
              </div>
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Escolha o dia do atendimento <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Selecione o melhor dia disponível</p>

              <div class="oa-dias-scroll">
                ${renderDias()}
              </div>

              ${renderHorarios()}
            </article>

            <button class="op-btn primary success" id="oa-confirmar" type="button" ${state.salvando ? "disabled" : ""}>
              ${state.salvando ? '<span class="op-spinner"></span>' : "✅ Confirmar e Abrir Chamado"}
            </button>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#oa-fundos"), "oa");
      bindEvents();
    }

    render();
    verificarDiasLotados();
  }

  window.Telas = window.Telas || {};
  window.Telas.aprovarOrcamento = renderTelaAprovarOrcamento;
})();
