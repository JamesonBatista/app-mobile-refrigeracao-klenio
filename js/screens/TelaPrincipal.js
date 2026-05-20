// js/screens/TelaPrincipal.js

(function () {
  const WHATSAPP = "5581986967254";
  const TEMPERATURAS = [18, 21, 22, 23, 17, 20, 19, 24];

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

  function badgeHtml(count) {
    if (!count || count === 0) return "";
    return `<span class="pr-badge">${count > 99 ? "99+" : count}</span>`;
  }

  function dispararExplosao(layer) {
    const screenWidth = window.innerWidth || 390;
    const screenHeight = window.innerHeight || 844;
    const colunas = 10;
    const larguraColuna = screenWidth / colunas;
    const itens = Array.from({ length: 55 }, (_, i) => {
      const profundidade = Math.random();
      const tamanho = profundidade < 0.3
        ? Math.random() * 6 + 6
        : profundidade < 0.65
          ? Math.random() * 8 + 12
          : Math.random() * 10 + 20;
      const velocidade = profundidade < 0.3
        ? Math.random() * 8000 + 12000
        : profundidade < 0.65
          ? Math.random() * 1000 + 4000
          : Math.random() * 800 + 1400;
      const opacidade = profundidade < 0.3
        ? Math.random() * 0.2 + 0.15
        : profundidade < 0.65
          ? Math.random() * 0.3 + 0.4
          : Math.random() * 0.2 + 0.8;
      const coluna = i % colunas;
      const startX = coluna * larguraColuna + Math.random() * larguraColuna - 10;
      return {
        x: `${startX}px`,
        y: `${-(Math.random() * 60 + 10)}px`,
        dest: `${(Math.random() - 0.5) * 60}px`,
        speed: `${velocidade}ms`,
        delay: `${Math.random() * 1200}ms`,
        size: `${tamanho}px`,
        opacity: String(opacidade),
      };
    });

    layer.innerHTML = itens.map((item) => `
      <span
        class="pr-explosion-flake"
        style="
          --x:${item.x};
          --y:${item.y};
          --dest:${item.dest};
          --speed:${item.speed};
          --delay:${item.delay};
          --size:${item.size};
          --opacity:${item.opacity};
        "
      >❄</span>
    `).join("");

    const clearTimer = setTimeout(() => {
      layer.innerHTML = "";
    }, 9000);

    return clearTimer;
  }

  function getArrayFromStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function renderTelaPrincipal(root, props) {
    const state = {
      usuarioLogado: props && props.usuarioLogado ? props.usuarioLogado : null,
      temperatura: TEMPERATURAS[Math.floor(Math.random() * TEMPERATURAS.length)],
      temProgramado: false,
      totalProgramados: 0,
      totalChamadosAtivos: 0,
      totalOrcamentosAtivos: 0,
      bloqueioExplosao: false,
      unsubscribers: [],
      clearExplosionTimer: null,
    };

    root.innerHTML = `
      <section class="pr-screen">
        <div class="pr-fundos" id="pr-fundos"></div>
        <div class="pr-explosion-layer" id="pr-explosion-layer"></div>

        <div class="pr-scroll">
          <header class="pr-header">
            <div>
              <span class="pr-header-empresa">Klenio Refrigeração</span>
              <span class="pr-header-bv">Bem-vindo,</span>
              <h1 class="pr-header-nome" id="pr-nome"></h1>
            </div>
            <button class="pr-sair-btn" id="pr-sair" type="button">
              <span class="pr-sair-icon">❄</span>
              <span class="pr-sair-label">Sair</span>
            </button>
          </header>

          <button class="pr-banner" id="pr-banner" type="button">
            <div class="pr-banner-main">
              <div class="pr-banner-top">
                <span class="pr-banner-led" aria-hidden="true"></span>
                <p class="pr-banner-title">Sistema de Ar</p>
              </div>
              <p class="pr-banner-sub">Seu conforto é nossa prioridade</p>
              <span class="pr-banner-badge">
                <span class="pr-banner-temp" id="pr-temp"></span>
                <span>🌡️</span>
              </span>
            </div>
            <span class="pr-banner-icon-wrap"><span class="pr-banner-icon">🌬️</span></span>
          </button>

          <p class="pr-secao-titulo">Ações Rápidas</p>
          <div class="pr-principais-row">
            <button class="pr-card-principal" style="background:#1a6fa8" id="pr-abrir-chamado" type="button">
              <span class="pr-card-principal-icone">🔧</span>
              <p class="pr-card-principal-title">Abrir Chamado</p>
              <p class="pr-card-principal-sub">Registre um problema</p>
            </button>
            <button class="pr-card-principal" style="background:#0d6e6e" id="pr-orcamento" type="button">
              <span class="pr-card-principal-icone">📋</span>
              <p class="pr-card-principal-title">Solicitar Orçamento</p>
              <p class="pr-card-principal-sub">Peça uma avaliação</p>
            </button>
          </div>

          <p class="pr-secao-titulo">Minha Conta</p>
          <div class="pr-sec-grid">
            <button class="pr-card-sec" id="pr-acompanhar" type="button">
              <span class="pr-icone-wrap">
                <span class="pr-icone-circulo">📡</span>
                <span id="badge-chamados"></span>
              </span>
              <p class="pr-card-sec-title">Acompanhar Chamado</p>
              <p class="pr-card-sec-sub">Status em tempo real</p>
            </button>

            <button class="pr-card-sec" id="pr-meus-orcamentos" type="button">
              <span class="pr-icone-wrap">
                <span class="pr-icone-circulo">💰</span>
                <span id="badge-orcamentos"></span>
              </span>
              <p class="pr-card-sec-title">Meus Orçamentos</p>
              <p class="pr-card-sec-sub">Acompanhe seus orçamentos</p>
            </button>

            <button class="pr-card-sec" id="pr-historico" type="button">
              <span class="pr-icone-circulo">📋</span>
              <p class="pr-card-sec-title">Histórico</p>
              <p class="pr-card-sec-sub">Todos os atendimentos</p>
            </button>

            <button class="pr-card-sec" id="pr-perfil" type="button">
              <span class="pr-icone-circulo">👤</span>
              <p class="pr-card-sec-title">Meu Perfil</p>
              <p class="pr-card-sec-sub">Editar meus dados</p>
            </button>
          </div>

          <button class="pr-programado" id="pr-programado" type="button">
            <span class="pr-icone-wrap">
              <span class="pr-programado-icone">🛠️</span>
              <span id="badge-programados"></span>
            </span>
            <span>
              <p class="pr-programado-title">Programado pelo Suporte</p>
              <p class="pr-programado-sub" id="pr-programado-sub">Nenhum agendamento no momento</p>
            </span>
            <span class="pr-programado-arrow" id="pr-programado-arrow" style="display:none">→</span>
          </button>

          <div class="pr-bottom-row">
            <button class="pr-bottom-btn is-wpp" id="pr-wpp" type="button">
              <span class="pr-bottom-icon">💬</span>
              <span>
                <p class="pr-bottom-title">Suporte</p>
                <p class="pr-bottom-sub">WhatsApp</p>
              </span>
            </button>

            <button class="pr-bottom-btn" id="pr-ajuda" type="button">
              <span class="pr-bottom-icon">❓</span>
              <span>
                <p class="pr-bottom-title">Ajuda</p>
                <p class="pr-bottom-sub">Central de ajuda</p>
              </span>
            </button>
          </div>

          <div style="height:20px"></div>
        </div>
      </section>
    `;

    const fundos = root.querySelector("#pr-fundos");
    const explosionLayer = root.querySelector("#pr-explosion-layer");
    const nomeEl = root.querySelector("#pr-nome");
    const tempEl = root.querySelector("#pr-temp");
    const badgeChamados = root.querySelector("#badge-chamados");
    const badgeOrcamentos = root.querySelector("#badge-orcamentos");
    const badgeProgramados = root.querySelector("#badge-programados");
    const programadoEl = root.querySelector("#pr-programado");
    const programadoSubEl = root.querySelector("#pr-programado-sub");
    const programadoArrowEl = root.querySelector("#pr-programado-arrow");

    criarFlocosFundo(fundos, "pr");
    nomeEl.textContent = state.usuarioLogado && state.usuarioLogado.nome ? state.usuarioLogado.nome : "";
    tempEl.textContent = `${state.temperatura}°C`;

    function atualizarBadges() {
      badgeChamados.innerHTML = badgeHtml(state.totalChamadosAtivos);
      badgeOrcamentos.innerHTML = badgeHtml(state.totalOrcamentosAtivos);
      badgeProgramados.innerHTML = badgeHtml(state.totalProgramados);

      const temProgramado = state.temProgramado;
      programadoEl.classList.toggle("is-active", temProgramado);
      programadoArrowEl.style.display = temProgramado ? "inline" : "none";
      programadoSubEl.textContent = temProgramado
        ? `${state.totalProgramados} agendamento${state.totalProgramados > 1 ? "s" : ""} em andamento`
        : "Nenhum agendamento no momento";
    }

    function salvarHistorico(email, item) {
      if (!email) return;
      if (typeof window.salvarItemHistoricoLocal === "function") {
        window.salvarItemHistoricoLocal(email, item);
      }
    }

    function aplicarFallbackSemServicos() {
      const email = state.usuarioLogado && state.usuarioLogado.email;
      const chamados = getArrayFromStorage("@chamados").filter((item) => item.clienteEmail === email);
      const orcamentos = getArrayFromStorage("@orcamentos").filter((item) => item.clienteEmail === email);
      const programados = getArrayFromStorage("@programados").filter((item) => item.clienteEmail === email);

      state.totalChamadosAtivos = chamados.filter((c) =>
        c.status === "Aguardando técnico" || c.status === "Aceito" || c.status === "Em atendimento"
      ).length;
      state.totalOrcamentosAtivos = orcamentos.filter((o) =>
        o.status === "Aguardando análise" || o.status === "Em análise" || o.status === "Orçamento enviado"
      ).length;
      const ativosProgramados = programados.filter((p) => p.status !== "Cancelado" && p.status !== "Concluído");
      state.totalProgramados = ativosProgramados.length;
      state.temProgramado = ativosProgramados.length > 0;
      atualizarBadges();
    }

    function iniciarAssinaturas() {
      if (!state.usuarioLogado || !state.usuarioLogado.email) return;
      const email = state.usuarioLogado.email;

      if (typeof window.ouvirChamadosCliente === "function") {
        const unsub = window.ouvirChamadosCliente(email, function (lista) {
          const ativos = lista.filter((c) =>
            c.status === "Aguardando técnico" || c.status === "Aceito" || c.status === "Em atendimento"
          );
          state.totalChamadosAtivos = ativos.length;
          lista.forEach((c) => {
            salvarHistorico(email, {
              numero: c.numero,
              tipo: "chamado",
              status: c.status,
              tipos: c.tipos,
              tipoServico: c.tipos ? c.tipos.join(", ") : "",
              endereco: c.endereco,
              dataFormatada: c.dataFormatada,
              horario: c.horario,
              tecnico: c.tecnico,
              valorCobrado: c.valorCobrado,
              formaPagamento: c.formaPagamento,
              tempoAtendimento: c.tempoAtendimento,
              dataCriacao: c.dataCriacao,
            });
          });
          atualizarBadges();
        });
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
      }

      if (typeof window.ouvirOrcamentosCliente === "function") {
        const unsub = window.ouvirOrcamentosCliente(email, function (lista) {
          const ativos = lista.filter((o) =>
            o.status === "Aguardando análise" || o.status === "Em análise" || o.status === "Orçamento enviado"
          );
          state.totalOrcamentosAtivos = ativos.length;
          lista.forEach((o) => {
            salvarHistorico(email, {
              numero: o.numero,
              tipo: "orcamento",
              status: o.status,
              tipoServico: o.tipoServico,
              tipoAparelho: o.tipoAparelho,
              btu: o.btu,
              quantidade: o.quantidade,
              endereco: o.endereco,
              valorOrcamento: o.valorOrcamento,
              dataCriacao: o.dataCriacao,
            });
          });
          atualizarBadges();
        });
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
      }

      if (typeof window.ouvirProgramados === "function") {
        const unsub = window.ouvirProgramados(email, function (lista) {
          const ativos = lista.filter((p) => p.status !== "Cancelado" && p.status !== "Concluído");
          state.temProgramado = ativos.length > 0;
          state.totalProgramados = ativos.length;
          lista.forEach((p) => {
            salvarHistorico(email, {
              numero: p.numero,
              tipo: "programado",
              status: p.status,
              tipoServico: p.tipo,
              tipos: p.tipos,
              endereco: p.endereco,
              dataFormatada: p.dataFormatada,
              horario: p.horario,
              tecnico: p.tecnico,
              valorCobrado: p.valorCobrado,
              formaPagamento: p.formaPagamento,
              tempoAtendimento: p.tempoAtendimento,
              dataCriacao: p.dataCriacao,
            });
          });
          atualizarBadges();
        });
        if (typeof unsub === "function") state.unsubscribers.push(unsub);
      }

      if (
        typeof window.ouvirChamadosCliente !== "function" &&
        typeof window.ouvirOrcamentosCliente !== "function" &&
        typeof window.ouvirProgramados !== "function"
      ) {
        aplicarFallbackSemServicos();
      }
    }

    atualizarBadges();
    iniciarAssinaturas();

    root.querySelector("#pr-sair").addEventListener("click", function () {
      if (props && typeof props.handleSair === "function") props.handleSair();
      else if (props && typeof props.setTela === "function") props.setTela("inicial");
    });

    root.querySelector("#pr-banner").addEventListener("click", function () {
      if (state.bloqueioExplosao) return;
      state.bloqueioExplosao = true;
      if (state.clearExplosionTimer) clearTimeout(state.clearExplosionTimer);
      state.clearExplosionTimer = dispararExplosao(explosionLayer);
      setTimeout(() => {
        state.bloqueioExplosao = false;
      }, 3000);
    });

    root.querySelector("#pr-abrir-chamado").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("abrirChamado");
    });

    root.querySelector("#pr-orcamento").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("orcamento");
    });

    root.querySelector("#pr-acompanhar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
    });

    root.querySelector("#pr-meus-orcamentos").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("meusOrcamentos");
    });

    root.querySelector("#pr-historico").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("historicoCliente");
    });

    root.querySelector("#pr-perfil").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("perfil");
    });

    root.querySelector("#pr-programado").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("programadoCliente");
    });

    root.querySelector("#pr-wpp").addEventListener("click", function () {
      const nome = state.usuarioLogado && state.usuarioLogado.nome ? state.usuarioLogado.nome : "Cliente";
      const mensagem = `Olá, meu nome é ${nome} e preciso de suporte!`;
      if (typeof window.abrirLinkWhatsApp === "function") {
        window.abrirLinkWhatsApp(WHATSAPP, mensagem);
      } else {
        const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, "_blank");
      }
    });

    root.querySelector("#pr-ajuda").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("ajuda");
    });

    return function cleanupPrincipal() {
      state.unsubscribers.forEach((unsub) => {
        try {
          unsub();
        } catch (error) {}
      });
      if (state.clearExplosionTimer) clearTimeout(state.clearExplosionTimer);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.principal = renderTelaPrincipal;
})();
