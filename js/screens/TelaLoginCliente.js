// js/screens/TelaLoginCliente.js

(function () {
  const CLIENTES_STORAGE_KEY = "@clientes";

  function getClientesLocais() {
    try {
      const raw = localStorage.getItem(CLIENTES_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function getClienteLocalPorEmail(email) {
    const emailNormalizado = String(email || "").trim().toLowerCase();
    if (!emailNormalizado) return null;
    const lista = getClientesLocais();
    return (
      lista.find(function (item) {
        return String(item && item.email ? item.email : "").trim().toLowerCase() === emailNormalizado;
      }) || null
    );
  }

  function getUsuarioStoragePorEmail(chave, email) {
    const emailNormalizado = String(email || "").trim().toLowerCase();
    if (!emailNormalizado) return null;
    try {
      const raw = localStorage.getItem(chave);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== "object") return null;
      const emailUsuario = String(parsed.email || "").trim().toLowerCase();
      return emailUsuario === emailNormalizado ? parsed : null;
    } catch (error) {
      return null;
    }
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

  function renderTelaLoginCliente(root, props) {
    root.innerHTML = `
      <section class="login-screen">
        <div class="login-fundos" id="lc-fundos"></div>

        <div class="login-scroll">
          <header class="login-header">
            <div>
              <span class="login-header-empresa">Klenio Refrigeração</span>
              <h1 class="login-header-nome">Login Cliente</h1>
            </div>
            <button class="login-voltar" id="lc-voltar" type="button">← Voltar</button>
          </header>

          <div class="login-logo-wrap">
            <div class="login-logo">❄</div>
          </div>

          <article class="login-card">
            <h2 class="login-titulo">Bem-vindo de volta!</h2>
            <p class="login-subtitulo">Entre com suas credenciais</p>

            <label class="login-label" for="lc-email">E-mail</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">✉️</span>
              <input class="login-input" id="lc-email" type="email" placeholder="seu@email.com" autocomplete="email" />
            </div>

            <label class="login-label" for="lc-senha">Senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">🔒</span>
              <input class="login-input" id="lc-senha" type="password" placeholder="Sua senha" />
            </div>

            <button class="login-link-recuperar" id="lc-recuperar" type="button">Esqueci minha senha</button>
          </article>

          <button class="login-btn-principal" id="lc-entrar" type="button">❄ Entrar</button>

          <button class="login-criar" id="lc-cadastro" type="button">
            Não tem conta? <b>Criar conta</b>
          </button>

          <div style="height:20px"></div>
        </div>
      </section>
    `;

    const fundos = root.querySelector("#lc-fundos");
    const btnEntrar = root.querySelector("#lc-entrar");
    const inputEmail = root.querySelector("#lc-email");
    const inputSenha = root.querySelector("#lc-senha");
    criarFlocosFundo(fundos);

    async function handleLogin() {
      const email = inputEmail.value.trim();
      const senha = inputSenha.value;
      if (!email || !senha.trim()) {
        window.showAppAlert("Atenção ❄\nPreencha e-mail e senha.");
        return;
      }

      btnEntrar.disabled = true;
      btnEntrar.innerHTML = '<div class="login-spinner"></div>';

      try {
        const emailNormalizado = email.toLowerCase().trim();
        let dados = null;
        let origemLocal = false;

        if (window.db && typeof window.db.collection === "function") {
          try {
            const doc = await window.db.collection("clientes").doc(emailNormalizado).get();
            if (doc && doc.exists) {
              dados = doc.data();
            }
          } catch (error) {
            console.log("Login remoto indisponível, tentando fallback local:", error);
          }
        }

        if (!dados) {
          dados = getClienteLocalPorEmail(emailNormalizado);
          origemLocal = !!dados;
        }

        if (!dados) {
          dados = getUsuarioStoragePorEmail("@usuario", emailNormalizado);
          origemLocal = !!dados;
        }

        if (!dados) {
          dados = getUsuarioStoragePorEmail("@usuarioLogado", emailNormalizado);
          origemLocal = !!dados;
        }

        if (!dados) {
          window.showAppAlert("Erro ❄\nE-mail não encontrado.");
          btnEntrar.disabled = false;
          btnEntrar.textContent = "❄ Entrar";
          return;
        }
        if (dados.senha !== senha) {
          window.showAppAlert("Erro ❄\nSenha incorreta.");
          btnEntrar.disabled = false;
          btnEntrar.textContent = "❄ Entrar";
          return;
        }

        const usuario = {
          nome: dados.nome,
          email: dados.email || emailNormalizado,
          telefone: dados.telefone || "",
          endereco: dados.endereco || "",
          perfil: "cliente",
        };

        if (origemLocal) {
          const clienteLocal = {
            nome: dados.nome || usuario.nome,
            endereco: dados.endereco || usuario.endereco,
            telefone: dados.telefone || usuario.telefone,
            email: emailNormalizado,
            senha: dados.senha,
            perfil: "cliente",
            dataCadastro: dados.dataCadastro || new Date().toLocaleDateString("pt-BR"),
            token: dados.token || "",
          };
          const lista = getClientesLocais();
          const idx = lista.findIndex(function (item) {
            return String(item && item.email ? item.email : "").toLowerCase() === emailNormalizado;
          });
          if (idx >= 0) {
            lista[idx] = { ...lista[idx], ...clienteLocal };
          } else {
            lista.unshift(clienteLocal);
          }
          localStorage.setItem(CLIENTES_STORAGE_KEY, JSON.stringify(lista));

          if (window.db && typeof window.db.collection === "function") {
            try {
              await window.db.collection("clientes").doc(emailNormalizado).set(clienteLocal, { merge: true });
            } catch (syncError) {
              console.log("Falha ao sincronizar cliente local com Firestore no login:", syncError);
            }
          }
        }

        localStorage.setItem("@usuarioLogado", JSON.stringify(usuario));
        if (props && typeof props.configurarNotificacoes === "function") {
          await props.configurarNotificacoes(usuario.email);
        }

        if (props && typeof props.setUsuarioLogado === "function") {
          props.setUsuarioLogado(usuario);
        }

        btnEntrar.disabled = false;
        btnEntrar.textContent = "❄ Entrar";
        if (props && typeof props.setTela === "function") {
          props.setTela("principal");
        }
      } catch (error) {
        console.log("Erro login:", error);
        window.showAppAlert("Erro ❄\nOcorreu um erro ao fazer login.");
        btnEntrar.disabled = false;
        btnEntrar.textContent = "❄ Entrar";
      }
    }

    root.querySelector("#lc-voltar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("inicial");
    });

    root.querySelector("#lc-recuperar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("recuperarSenha");
    });

    root.querySelector("#lc-cadastro").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("cadastro");
    });

    btnEntrar.addEventListener("click", handleLogin);
  }

  window.Telas = window.Telas || {};
  window.Telas.loginCliente = renderTelaLoginCliente;
})();
