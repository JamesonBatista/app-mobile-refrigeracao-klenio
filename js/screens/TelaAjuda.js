// js/screens/TelaAjuda.js

(function () {
  const SECOES = [
    {
      icone: "🔧",
      titulo: "Abrir Chamado",
      cor: "#1a6fa8",
      conteudo: [
        {
          subtitulo: "O que é?",
          texto:
            "Um chamado é uma solicitação de atendimento técnico para o seu ar-condicionado. Use quando seu equipamento apresentar algum problema como não gelar, fazer barulho, vazar água, não ligar ou qualquer outro defeito.",
        },
        {
          subtitulo: "Como usar?",
          texto:
            '1. Toque em "Abrir Chamado" na tela principal.\n2. Selecione o(s) tipo(s) de problema.\n3. Confirme ou edite o endereço.\n4. Escolha o melhor dia e horário disponível.\n5. Adicione detalhes extras se quiser.\n6. Toque em "Abrir Chamado" para enviar.',
        },
        {
          subtitulo: "O que acontece depois?",
          texto:
            "Nossa equipe será notificada imediatamente e irá analisar seu chamado. Você receberá atualizações a cada mudança de status.",
        },
        {
          subtitulo: "Chamado aberto pelo Suporte",
          texto:
            'Quando nossa equipe abrir um chamado para você, ele aparecerá em "Acompanhar Chamado" com um banner azul identificando que foi aberto pela equipe Klenio Refrigeração. Ele já vem com status Aceito e segue o fluxo normal de atendimento.',
        },
        {
          subtitulo: "Posso cancelar meu chamado?",
          texto:
            'Sim. Você pode cancelar seu chamado enquanto o status for "Aguardando técnico". Após o técnico ser designado (status Aceito), o cancelamento só pode ser feito pelo suporte.',
        },
        {
          subtitulo: "O suporte pode reagendar ou cancelar?",
          texto:
            "Sim. O suporte pode reagendar ou cancelar um chamado a qualquer momento durante o processo. Você será notificado automaticamente em caso de qualquer alteração.",
        },
      ],
    },
    {
      icone: "📡",
      titulo: "Acompanhar Chamado",
      cor: "#0d6e6e",
      conteudo: [
        {
          subtitulo: "O que é?",
          texto:
            "Aqui você acompanha em tempo real todos os seus chamados abertos e o histórico dos já concluídos ou cancelados. Tanto os chamados que você abriu quanto os abertos pelo suporte aparecem aqui.",
        },
        {
          subtitulo: "Status do chamado",
          texto:
            "⏳ Aguardando técnico — Seu chamado foi recebido. Você ainda pode cancelar.\n\n✅ Aceito — Um técnico foi designado. Chamados abertos pelo suporte já iniciam neste status.\n\n🔧 Em atendimento — O técnico está realizando o serviço.\n\n🏁 Concluído — Serviço finalizado. Você verá o valor cobrado e a forma de pagamento.\n\n❌ Cancelado — O chamado foi cancelado.",
        },
        {
          subtitulo: "Quando posso cancelar?",
          texto:
            'Você pode cancelar seu chamado somente enquanto o status for "Aguardando técnico". Após isso, entre em contato com o suporte pelo WhatsApp para solicitar o cancelamento.',
        },
      ],
    },
    {
      icone: "📋",
      titulo: "Solicitar Orçamento",
      cor: "#6c3483",
      conteudo: [
        {
          subtitulo: "O que é?",
          texto:
            "Use para solicitar um orçamento de instalação, substituição ou manutenção do seu ar-condicionado. Nossa equipe irá analisar e enviar um valor.",
        },
        {
          subtitulo: "Como usar?",
          texto:
            '1. Toque em "Solicitar Orçamento".\n2. Selecione o(s) tipo(s) de serviço desejado.\n3. Informe os dados do equipamento (tipo, BTUs, quantidade).\n4. A metragem é opcional.\n5. Confirme o endereço.\n6. Adicione detalhes se necessário.\n7. Toque em "Solicitar Orçamento".',
        },
        {
          subtitulo: "Não preciso escolher data agora?",
          texto:
            "Não. A data e horário do atendimento são escolhidos somente após você aprovar o orçamento. Assim você analisa o valor com calma antes de agendar.",
        },
        {
          subtitulo: "Posso cancelar minha solicitação?",
          texto:
            'Sim. Você pode cancelar seu orçamento enquanto o status for "Aguardando análise". Após nossa equipe iniciar a análise, o cancelamento só poderá ser feito pelo suporte.',
        },
        {
          subtitulo: "O que acontece depois?",
          texto:
            "Nossa equipe irá analisar sua solicitação e enviar um orçamento com o valor. Você poderá aprovar ou recusar pelo app.",
        },
      ],
    },
    {
      icone: "💰",
      titulo: "Meus Orçamentos",
      cor: "#8e44ad",
      conteudo: [
        {
          subtitulo: "O que é?",
          texto:
            "Aqui você acompanha todos os orçamentos solicitados por você e os enviados diretamente pelo nosso suporte.",
        },
        {
          subtitulo: "Status do orçamento",
          texto:
            "⏳ Aguardando análise — Solicitação recebida. Você ainda pode cancelar.\n\n🔍 Em análise — Nossa equipe está avaliando.\n\n💰 Orçamento enviado — O valor foi definido. Você pode aprovar ou recusar.\n\n✅ Aprovado — Você aprovou e o chamado foi criado automaticamente.\n\n❌ Recusado — Você recusou o orçamento.\n\n🚫 Cancelado — O orçamento foi cancelado.",
        },
        {
          subtitulo: "Como aprovar?",
          texto:
            'Quando o status for "Orçamento enviado", toque em "Aprovar e agendar". Você será direcionado para escolher a data e horário do atendimento. Após confirmar, um chamado de serviço é criado automaticamente.',
        },
        {
          subtitulo: "Histórico de orçamentos",
          texto:
            'Todos os seus orçamentos ficam salvos no histórico, mesmo que tenham sido cancelados. Acesse a aba "Histórico" para visualizá-los.',
        },
      ],
    },
    {
      icone: "🛠️",
      titulo: "Programado pelo Suporte",
      cor: "#1a6fa8",
      conteudo: [
        {
          subtitulo: "O que é?",
          texto:
            'Quando nossa equipe precisar agendar uma revisão preventiva ou visita técnica de rotina para você, o agendamento aparecerá aqui para que você possa confirmar ou contestar.\n\nObs: Chamados abertos diretamente pelo suporte aparecem em "Acompanhar Chamado", não aqui.',
        },
        {
          subtitulo: "Aceitar ou Contestar",
          texto:
            "✅ Aceitar — Confirma o agendamento. O técnico irá comparecer na data e horário informados.\n\n⚠️ Contestar — Caso não possa ou não concorde com o agendamento, informe o motivo. O suporte irá responder e vocês entram em acordo.",
        },
        {
          subtitulo: "Posso contestar mais de uma vez?",
          texto:
            "Sim. O ciclo de contestação pode acontecer quantas vezes for necessário até que você aceite o agendamento. Todo o histórico de mensagens fica salvo.",
        },
      ],
    },
    {
      icone: "👤",
      titulo: "Meu Perfil",
      cor: "#27ae60",
      conteudo: [
        {
          subtitulo: "O que posso editar?",
          texto:
            "No seu perfil você pode atualizar seu nome, endereço principal, telefone/WhatsApp e senha.",
        },
        {
          subtitulo: "Por que manter o telefone atualizado?",
          texto:
            "Todas as notificações e informações sobre seus chamados e orçamentos são enviadas automaticamente para o WhatsApp cadastrado. Sem um número válido você pode perder informações importantes.",
        },
      ],
    },
    {
      icone: "📲",
      titulo: "Notificações e WhatsApp",
      cor: "#2980b9",
      conteudo: [
        {
          subtitulo: "Como funciona?",
          texto:
            "Todas as informações sobre chamados ou orçamentos abertos — como mudança de status, valor do serviço, forma de pagamento, novos agendamentos e muito mais — são enviadas automaticamente para o seu WhatsApp cadastrado no perfil.",
        },
        {
          subtitulo: "Não estou recebendo as mensagens?",
          texto:
            "1. Verifique se o número de telefone no seu perfil está correto.\n2. Certifique-se de que o WhatsApp está instalado e funcionando no seu celular.\n3. Verifique sua conexão com a internet.",
        },
      ],
    },
    {
      icone: "💬",
      titulo: "Falar com o Suporte",
      cor: "#25D366",
      conteudo: [
        {
          subtitulo: "Como entrar em contato?",
          texto:
            "Na tela principal toque no botão verde do WhatsApp para falar diretamente com nossa equipe de suporte.",
        },
        {
          subtitulo: "Horário de atendimento",
          texto:
            "Segunda a Sexta: 08h às 17h\nSábado: 09h às 13h\nDomingo: Fechado\n\nFora do horário comercial, deixe sua mensagem que retornaremos assim que possível.",
        },
      ],
    },
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

  function textoComQuebra(texto) {
    return escapeHtml(texto).replaceAll("\n", "<br />");
  }

  function renderTelaAjuda(root, props) {
    const state = {
      secaoAberta: null,
    };

    function bindEvents() {
      const container = root.querySelector("#aj-container");
      if (!container) return;

      container.addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("principal");
          return;
        }

        if (action === "toggle-secao") {
          const idx = Number(actionEl.dataset.index);
          state.secaoAberta = state.secaoAberta === idx ? null : idx;
          render();
        }
      });
    }

    function renderSecoes() {
      return SECOES.map(function (secao, index) {
        const aberta = state.secaoAberta === index;
        return `
          <article
            class="aj-section${aberta ? " is-open" : ""}"
            style="${aberta ? `--aj-accent:${secao.cor};` : ""}"
          >
            <button class="aj-header-btn" data-action="toggle-secao" data-index="${index}" type="button">
              <span class="aj-header-left">
                <span class="aj-icon" style="background:${secao.cor}22;border-color:${secao.cor}44">${secao.icone}</span>
                <span class="aj-title">${escapeHtml(secao.titulo)}</span>
              </span>
              <span class="aj-chevron">${aberta ? "▲" : "▼"}</span>
            </button>

            ${
              aberta
                ? `
                  <div class="aj-body">
                    ${secao.conteudo
                      .map(
                        (item) => `
                          <div class="aj-item">
                            <div class="aj-item-title-row">
                              <span class="aj-item-bar" style="background:${secao.cor}"></span>
                              <h3 style="color:${secao.cor}">${escapeHtml(item.subtitulo)}</h3>
                            </div>
                            <p>${textoComQuebra(item.texto)}</p>
                          </div>
                        `
                      )
                      .join("")}
                  </div>
                `
                : ""
            }
          </article>
        `;
      }).join("");
    }

    function render() {
      root.innerHTML = `
        <section class="aj-screen">
          <div class="aj-fundos" id="aj-fundos"></div>
          <div class="aj-scroll" id="aj-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Central de Ajuda</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <article class="aj-banner">
              <span class="aj-banner-emoji">❄</span>
              <span>
                <strong>Como podemos ajudar?</strong>
                <small>Toque em qualquer seção para ver as explicações detalhadas.</small>
              </span>
            </article>

            ${renderSecoes()}

            <article class="aj-footer-help">
              <span class="aj-footer-emoji">💬</span>
              <strong>Ainda tem dúvidas?</strong>
              <small>Fale diretamente com nossa equipe pelo WhatsApp na tela principal.</small>
            </article>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#aj-fundos"), "aj");
      bindEvents();
    }

    render();
  }

  window.Telas = window.Telas || {};
  window.Telas.ajuda = renderTelaAjuda;
})();
