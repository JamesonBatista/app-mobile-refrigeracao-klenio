// js/screens/TelaCadastro.js

(function () {
  const CLIENTES_STORAGE_KEY = "@clientes";
  const RETRY_EVERY_MS = 10000;
  const RETRY_FOR_MS = 120000;
  const REATIVACAO_TOTAL_MS = 120000;
  const REATIVACAO_INTERVALO_MS = 10000;

  function criarErroFirestoreIndisponivel() {
    const error = new Error("Firestore indisponível");
    error.code = "unavailable";
    return error;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function isErroRetryavel(error) {
    if (typeof window.isFirestoreRetryableError === "function") {
      return !!window.isFirestoreRetryableError(error);
    }
    const code = String((error && error.code) || "").toLowerCase();
    if (!code) return true;
    if (code.includes("permission-denied")) return false;
    if (code.includes("failed-precondition")) return false;
    if (code.includes("invalid-argument")) return false;
    return (
      code.includes("unavailable") ||
      code.includes("deadline-exceeded") ||
      code.includes("resource-exhausted") ||
      code.includes("internal") ||
      code.includes("aborted") ||
      code.includes("cancelled") ||
      code.includes("network")
    );
  }

  async function executarComRetryFirestore(operacao, options) {
    const opts = options && typeof options === "object" ? options : {};
    if (typeof window.runFirestoreWithRetry === "function") {
      return window.runFirestoreWithRetry(operacao, {
        retryEveryMs: RETRY_EVERY_MS,
        retryForMs: RETRY_FOR_MS,
        ...opts,
      });
    }
    const retryEveryMs = Number.isFinite(opts.retryEveryMs) ? Math.max(1000, opts.retryEveryMs) : RETRY_EVERY_MS;
    const retryForMs = Number.isFinite(opts.retryForMs) ? Math.max(retryEveryMs, opts.retryForMs) : RETRY_FOR_MS;
    const iniciouEm = Date.now();
    let ultimoErro = null;
    while (Date.now() - iniciouEm <= retryForMs) {
      try {
        return await operacao();
      } catch (error) {
        ultimoErro = error;
        if (!isErroRetryavel(error)) {
          throw error;
        }
        if (Date.now() - iniciouEm + retryEveryMs > retryForMs) {
          break;
        }
        await delay(retryEveryMs);
      }
    }
    throw ultimoErro || criarErroFirestoreIndisponivel();
  }

  async function preaquecerAntesDoCadastro() {
    if (typeof window.preaquecerFirestore !== "function") return;
    try {
      await window.preaquecerFirestore({ force: true, reason: "cadastro" });
    } catch (error) {
      // segue fluxo normal de cadastro com retry
    }
  }

  async function reativarSistemaComContagem(onTick) {
    if (typeof window.reativarFirestoreComContagem !== "function") {
      return { ok: false, attempts: 0 };
    }
    try {
      const resultado = await window.reativarFirestoreComContagem({
        totalMs: REATIVACAO_TOTAL_MS,
        retryEveryMs: REATIVACAO_INTERVALO_MS,
        reason: "cadastro",
        onTick,
      });
      return resultado && typeof resultado === "object" ? resultado : { ok: false, attempts: 0 };
    } catch (error) {
      return { ok: false, attempts: 0, error };
    }
  }

  function getClientesLocais() {
    try {
      const raw = localStorage.getItem(CLIENTES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function upsertClienteLocal(cliente) {
    const lista = getClientesLocais();
    const email = String(cliente && cliente.email ? cliente.email : "").toLowerCase();
    if (!email) return;
    const index = lista.findIndex(function (item) {
      return String(item && item.email ? item.email : "").toLowerCase() === email;
    });
    if (index >= 0) {
      lista[index] = { ...lista[index], ...cliente };
    } else {
      lista.unshift(cliente);
    }
    localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(lista));
  }

  function criarFlocosFundo(container) {
    container.innerHTML = "";
    for (let i = 0; i < 10; i += 1) {
      const floco = document.createElement("span");
      floco.className = "login-floco";
      floco.textContent = "❄";
      floco.style.setProperty("--x", `${Math.random() * window.innerWidth}px`);
      floco.style.setProperty("--size", `${9 + Math.random() * 10}px`);
      floco.style.setProperty("--dur", `${6000 + Math.random() * 5000}ms`);
      floco.style.setProperty("--delay", `${Math.random() * 3000}ms`);
      floco.style.setProperty("--opacity", `${0.2 + Math.random() * 0.45}`);
      container.appendChild(floco);
    }
  }

  function renderTelaCadastro(root, props) {
    root.innerHTML = `
      <section class="login-screen">
        <div class="login-fundos" id="cad-fundos"></div>

        <div class="login-scroll">
          <div class="login-logo-wrap">
            <div class="login-logo">❄</div>
            <p class="login-logo-nome">Klenio Refrigeração</p>
            <p class="login-logo-sub">GESTÃO DE REFRIGERAÇÃO</p>
          </div>

          <article class="login-card">
            <h2 class="login-titulo">Criar conta</h2>
            <p class="login-subtitulo">Preencha seus dados</p>

            <label class="login-label" for="cad-nome">Nome completo</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">👤</span>
              <input class="login-input" id="cad-nome" type="text" placeholder="Digite seu nome" />
            </div>

            <label class="login-label" for="cad-endereco">Endereço</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">📍</span>
              <input class="login-input" id="cad-endereco" type="text" placeholder="Digite seu endereço" />
            </div>

            <label class="login-label" for="cad-telefone">Telefone / WhatsApp</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">📱</span>
              <input class="login-input" id="cad-telefone" type="tel" placeholder="(00) 00000-0000" />
            </div>

            <label class="login-label" for="cad-email">E-mail</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">✉️</span>
              <input class="login-input" id="cad-email" type="email" placeholder="seuemail@email.com" autocomplete="email" />
            </div>

            <label class="login-label" for="cad-senha">Senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">🔒</span>
              <input class="login-input" id="cad-senha" type="password" placeholder="Mínimo 6 caracteres" />
            </div>

            <button class="login-btn-principal" id="cad-btn-cadastrar" type="button">Cadastrar</button>

            <button class="login-criar" id="cad-link-login" type="button">
              Já tem conta? <b>Entrar</b>
            </button>
          </article>

          <button class="login-admin-voltar" id="cad-voltar" type="button">← Voltar</button>
        </div>
      </section>
    `;

    const fundos = root.querySelector("#cad-fundos");
    const nomeEl = root.querySelector("#cad-nome");
    const enderecoEl = root.querySelector("#cad-endereco");
    const telefoneEl = root.querySelector("#cad-telefone");
    const emailEl = root.querySelector("#cad-email");
    const senhaEl = root.querySelector("#cad-senha");
    const btnCadastrar = root.querySelector("#cad-btn-cadastrar");
    const loadingHint = document.createElement("p");
    loadingHint.className = "login-loading-hint";
    loadingHint.id = "cad-loading-hint";
    loadingHint.style.display = "none";
    loadingHint.textContent = "Conectando ao banco... isso pode levar alguns segundos.";
    btnCadastrar.insertAdjacentElement("afterend", loadingHint);
    criarFlocosFundo(fundos);

    const estadoLoading = {
      ativo: false,
      reativando: false,
      segundos: Math.ceil(REATIVACAO_TOTAL_MS / 1000),
      tentativas: 0,
    };

    function formatarTempoRestante(totalSegundos) {
      const segundos = Math.max(0, Number(totalSegundos) || 0);
      const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
      const ss = String(segundos % 60).padStart(2, "0");
      return `${mm}:${ss}`;
    }

    function renderCadastroLoading() {
      btnCadastrar.disabled = estadoLoading.ativo;
      if (!estadoLoading.ativo) {
        btnCadastrar.textContent = "Cadastrar";
        loadingHint.style.display = "none";
        return;
      }

      const textoBotao = estadoLoading.reativando ? "Reativando sistema..." : "Cadastrando...";
      btnCadastrar.innerHTML = `<span class="login-btn-inline-loading"><span class="login-spinner"></span><span>${textoBotao}</span></span>`;
      loadingHint.style.display = "block";
      if (estadoLoading.reativando) {
        loadingHint.textContent =
          `Problemas de instabilidade de sistema, estamos reativando (${formatarTempoRestante(estadoLoading.segundos)}). ` +
          `Tentativas: ${estadoLoading.tentativas}`;
      } else {
        loadingHint.textContent = "Conectando ao banco... isso pode levar alguns segundos.";
      }
    }

    function setCadastroLoading(isLoading, options) {
      const opts = options && typeof options === "object" ? options : {};
      estadoLoading.ativo = !!isLoading;
      if (!isLoading) {
        estadoLoading.reativando = false;
        estadoLoading.segundos = Math.ceil(REATIVACAO_TOTAL_MS / 1000);
        estadoLoading.tentativas = 0;
      } else {
        estadoLoading.reativando = !!opts.reativando;
        if (Number.isFinite(opts.segundos)) estadoLoading.segundos = Math.max(0, Math.floor(opts.segundos));
        if (Number.isFinite(opts.tentativas)) estadoLoading.tentativas = Math.max(0, Math.floor(opts.tentativas));
      }
      renderCadastroLoading();
    }

    async function handleCadastrar() {
      const nome = nomeEl.value;
      const endereco = enderecoEl.value;
      const telefone = telefoneEl.value;
      const email = emailEl.value;
      const senha = senhaEl.value;

      if (!nome || !endereco || !telefone || !email || !senha) {
        window.showAppAlert("Atenção\nPor favor, preencha todos os campos.");
        return;
      }
      if (senha.length < 6) {
        window.showAppAlert("Atenção\nA senha deve ter no mínimo 6 caracteres.");
        return;
      }

      setCadastroLoading(true);

      try {
        await preaquecerAntesDoCadastro();
        const emailNormalizado = email.trim().toLowerCase();
        const novoUsuario = {
          nome: nome.trim(),
          endereco: endereco.trim(),
          telefone: telefone.trim(),
          email: emailNormalizado,
          senha,
          perfil: "cliente",
          dataCadastro: new Date().toLocaleDateString("pt-BR"),
          token: "",
        };

        try {
          await executarComRetryFirestore(
            async function () {
              if (!window.db || typeof window.db.collection !== "function") {
                throw criarErroFirestoreIndisponivel();
              }
              await window.db.collection("clientes").doc(emailNormalizado).set(novoUsuario);
            },
            {
              retryEveryMs: 1000,
              retryForMs: 1000,
            }
          );
        } catch (errorInicial) {
          const codeInicial = String((errorInicial && errorInicial.code) || "").toLowerCase();
          const deveTentarReativar = isErroRetryavel(errorInicial) || codeInicial.includes("failed-precondition");
          if (!deveTentarReativar) throw errorInicial;

          setCadastroLoading(true, {
            reativando: true,
            segundos: Math.ceil(REATIVACAO_TOTAL_MS / 1000),
            tentativas: 0,
          });

          const resultadoReativacao = await reativarSistemaComContagem(function (info) {
            setCadastroLoading(true, {
              reativando: true,
              segundos: Number(info && info.remainingSeconds) || 0,
              tentativas: Number(info && info.attempts) || 0,
            });
          });

          if (!resultadoReativacao || !resultadoReativacao.ok) {
            throw errorInicial;
          }

          await executarComRetryFirestore(
            async function () {
              if (!window.db || typeof window.db.collection !== "function") {
                throw criarErroFirestoreIndisponivel();
              }
              await window.db.collection("clientes").doc(emailNormalizado).set(novoUsuario);
            },
            {
              retryEveryMs: 2000,
              retryForMs: 8000,
            }
          );
        }

        upsertClienteLocal(novoUsuario);
        localStorage.setItem("@usuario", JSON.stringify(novoUsuario));
        localStorage.setItem("@usuarioLogado", JSON.stringify(novoUsuario));

        if (props && typeof props.setUsuarioLogado === "function") {
          props.setUsuarioLogado(novoUsuario);
        }

        if (props && typeof props.configurarNotificacoes === "function") {
          await props.configurarNotificacoes(novoUsuario.email);
        }

        if (props && typeof props.setTela === "function") {
          props.setTela("principal");
        }
      } catch (error) {
        console.log("Erro cadastro:", error);
        const code = String((error && error.code) || "").toLowerCase();
        if (code.includes("permission-denied")) {
          window.showAppAlert(
            "Erro\nNão foi possível concluir o cadastro agora. Tente novamente em instantes."
          );
        } else {
          window.showAppAlert(
            "Erro\nNão conseguimos concluir seu cadastro agora. Verifique sua conexão e tente novamente."
          );
        }
      }

      setCadastroLoading(false);
    }

    btnCadastrar.addEventListener("click", handleCadastrar);

    root.querySelector("#cad-link-login").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    });

    root.querySelector("#cad-voltar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("inicial");
    });
  }

  window.Telas = window.Telas || {};
  window.Telas.cadastro = renderTelaCadastro;
})();
