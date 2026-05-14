// js/screens/TelaLoginCliente.js

(function () {
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
        if (!window.db) {
          throw new Error("db indisponivel");
        }

        const emailNormalizado = email.toLowerCase().trim();
        const doc = await window.db.collection("clientes").doc(emailNormalizado).get();

        if (!doc.exists) {
          window.showAppAlert("Erro ❄\nE-mail não encontrado.");
          btnEntrar.disabled = false;
          btnEntrar.textContent = "❄ Entrar";
          return;
        }

        const dados = doc.data();
        if (dados.senha !== senha) {
          window.showAppAlert("Erro ❄\nSenha incorreta.");
          btnEntrar.disabled = false;
          btnEntrar.textContent = "❄ Entrar";
          return;
        }

        const usuario = {
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone || "",
          endereco: dados.endereco || "",
          perfil: "cliente",
        };

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
