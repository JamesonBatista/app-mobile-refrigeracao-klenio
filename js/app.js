// js/app.js
// Reconstrucao do App.js original de React Native em JavaScript web.

(function () {
  const appState = {
    tela: "splash",
    usuarioLogado: null,
    chamadoSelecionado: null,
    chamadoClienteSelecionado: null,
    programadoSelecionado: null,
    orcamentoParaAprovar: null,
  };

  const notificationListener = { current: null };
  const responseListener = { current: null };

  function setTela(value) {
    appState.tela = value;
    renderTelaAtual();
  }

  function setUsuarioLogado(value) {
    appState.usuarioLogado = value;
  }

  function setChamadoSelecionado(value) {
    appState.chamadoSelecionado = value;
  }

  function setChamadoClienteSelecionado(value) {
    appState.chamadoClienteSelecionado = value;
  }

  function setProgramadoSelecionado(value) {
    appState.programadoSelecionado = value;
  }

  function setOrcamentoParaAprovar(value) {
    appState.orcamentoParaAprovar = value;
  }

  async function iniciarApp() {
    try {
      const dadosLogado = localStorage.getItem("@usuarioLogado");
      if (dadosLogado) {
        const usuario = JSON.parse(dadosLogado);
        setUsuarioLogado(usuario);
        if (usuario.perfil === "admin") {
          await configurarNotificacoesAdmin();
          setTela("painelAdmin");
        } else {
          await configurarNotificacoesCliente(usuario.email);
          setTela("principal");
        }
      } else {
        setTela("inicial");
      }
    } catch (error) {
      console.log("Erro iniciarApp:", error);
      setTela("inicial");
    }
  }

  async function configurarNotificacoesCliente(email) {
    try {
      if (typeof window.registrarToken === "function") {
        await window.registrarToken(email);
      }
    } catch (error) {
      console.log("Erro configurarNotificacoesCliente:", error);
    }
  }

  async function configurarNotificacoesAdmin() {
    try {
      if (typeof window.registrarToken === "function") {
        const token = await window.registrarToken(null);
        if (token && typeof window.salvarTokenAdmin === "function") {
          await window.salvarTokenAdmin(token);
        }
      }
    } catch (error) {
      console.log("Erro configurarNotificacoesAdmin:", error);
    }
  }

  async function handleSair() {
    localStorage.removeItem("@usuarioLogado");
    setUsuarioLogado(null);
    setTela("inicial");
  }

  function navegarPara(nomeTela) {
    if (nomeTela === "sair") {
      handleSair();
      return;
    }
    setTela(nomeTela);
  }

  function obterRendererTela(nomeTela) {
    if (!window.Telas) return null;
    return window.Telas[nomeTela] || null;
  }

  function renderPlaceholderTela(root, nomeTela, props) {
    root.innerHTML = `
      <article class="boot-card">
        <h1 class="boot-title">Tela: ${nomeTela}</h1>
        <p class="boot-subtitle">
          Renderer da tela ainda nao enviado. Assim que voce enviar os arquivos
          dessa tela, eu substituo este placeholder pelo layout real.
        </p>
        <ul class="boot-list">
          <li>Estado atual: <strong>${appState.tela}</strong></li>
          <li>Props recebidas: <strong>${Object.keys(props).length}</strong></li>
        </ul>
      </article>
    `;

    if (nomeTela === "splash" && typeof props.onFinish === "function") {
      setTimeout(() => props.onFinish(), 450);
    }
  }

  function montarPropsTela(nomeTela) {
    switch (nomeTela) {
      case "splash":
        return { onFinish: iniciarApp };
      case "inicial":
        return { setTela };
      case "loginCliente":
        return {
          setTela,
          setUsuarioLogado,
          configurarNotificacoes: configurarNotificacoesCliente,
        };
      case "loginAdmin":
        return {
          setTela,
          setUsuarioLogado,
          configurarNotificacoes: configurarNotificacoesAdmin,
        };
      case "cadastro":
        return {
          setTela,
          setUsuarioLogado,
          configurarNotificacoes: configurarNotificacoesCliente,
        };
      case "recuperarSenha":
        return { setTela };
      case "principal":
        return {
          setTela: navegarPara,
          handleSair,
          usuarioLogado: appState.usuarioLogado,
        };
      case "abrirChamado":
        return { setTela, usuarioLogado: appState.usuarioLogado };
      case "acompanharChamado":
        return {
          setTela,
          usuarioLogado: appState.usuarioLogado,
          setChamadoClienteSelecionado,
        };
      case "detalheChamadoCliente":
        return {
          setTela,
          chamadoClienteSelecionado: appState.chamadoClienteSelecionado,
        };
      case "painelAdmin":
        return {
          setTela,
          handleSair,
          setChamadoSelecionado,
          setProgramadoSelecionado,
        };
      case "chamadoDetalhes":
        return {
          setTela,
          chamadoSelecionado: appState.chamadoSelecionado,
          setChamadoSelecionado,
        };
      case "agendaAdmin":
        return { setTela };
      case "perfil":
        return {
          setTela,
          usuarioLogado: appState.usuarioLogado,
          setUsuarioLogado,
        };
      case "abrirProgramado":
        return { setTela };
      case "programadoCliente":
        return { setTela, usuarioLogado: appState.usuarioLogado };
      case "editarProgramado":
        return {
          setTela,
          programadoSelecionado: appState.programadoSelecionado,
        };
      case "orcamento":
        return { setTela, usuarioLogado: appState.usuarioLogado };
      case "meusOrcamentos":
        return {
          setTela,
          usuarioLogado: appState.usuarioLogado,
          setOrcamentoParaAprovar,
        };
      case "aprovarOrcamento":
        return {
          setTela,
          orcamentoParaAprovar: appState.orcamentoParaAprovar,
          usuarioLogado: appState.usuarioLogado,
        };
      case "orcamentoAdmin":
      case "criarOrcamentoAdmin":
      case "profissionais":
      case "ajuda":
      case "relatorio":
      case "falarCliente":
        return { setTela };
      case "historicoCliente":
        return { setTela, usuarioLogado: appState.usuarioLogado };
      default:
        return { setTela };
    }
  }

  function renderTelaAtual() {
    const nomeTela = appState.tela;
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = '<section class="screen" id="screen-root"></section>';
    const root = document.getElementById("screen-root");

    const props = montarPropsTela(nomeTela);
    const renderer = obterRendererTela(nomeTela);
    if (typeof renderer === "function") {
      renderer(root, props);
    } else {
      renderPlaceholderTela(root, nomeTela, props);
    }
  }

  function registrarListenersNotificacao() {
    const onNotificationReceived = function (event) {
      console.log("Notificacao recebida:", event && event.detail ? event.detail : event);
    };

    const onNotificationResponse = function (event) {
      const dados = event && event.detail ? event.detail : null;
      if (dados && dados.tela) {
        setTela(dados.tela);
      }
    };

    window.addEventListener("app:notification-received", onNotificationReceived);
    window.addEventListener("app:notification-response", onNotificationResponse);

    notificationListener.current = function () {
      window.removeEventListener("app:notification-received", onNotificationReceived);
    };
    responseListener.current = function () {
      window.removeEventListener("app:notification-response", onNotificationResponse);
    };
  }

  function limparListenersNotificacao() {
    if (typeof notificationListener.current === "function") {
      notificationListener.current();
    }
    if (typeof responseListener.current === "function") {
      responseListener.current();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (screen.orientation && typeof screen.orientation.lock === "function") {
      screen.orientation.lock("portrait").catch(function () {});
    }

    registrarListenersNotificacao();
    renderTelaAtual();
  });

  window.addEventListener("beforeunload", limparListenersNotificacao);

  window.AppController = {
    iniciarApp,
    setTela,
    handleSair,
    navegarPara,
    getState: function () {
      return { ...appState };
    },
  };
})();
