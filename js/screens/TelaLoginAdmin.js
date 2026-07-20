// js/screens/TelaLoginAdmin.js

(function () {
  const ADMIN_EMAIL = "krefrigeracao";
  const ADMIN_SENHA = "060318";
  const ADMIN_EMAIL1 = "krefrigeracao1";
  const ADMIN_SENHA1 = "060318";
  const ADMIN_EMAIL2 = "krefrigeracao2";
  const ADMIN_SENHA2 = "060318";
  const ADMIN_EMAIL3 = "krefrigeracao3";
  const ADMIN_SENHA3 = "060318";

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

  function renderTelaLoginAdmin(root, props) {
    root.innerHTML = `
      <section class="login-screen">
        <div class="login-fundos" id="la-fundos"></div>

        <div class="login-scroll">
          <div class="login-logo-wrap">
            <div class="login-logo">❄</div>
            <p class="login-logo-nome">Klenio Refrigeração</p>
            <p class="login-logo-sub">ÁREA ADMINISTRATIVA</p>
          </div>

          <article class="login-card is-admin" id="la-card">
            <h2 class="login-titulo">Administrador</h2>
            <p class="login-subtitulo">Acesse o painel de controle</p>

            <div class="login-erro-box" id="la-erro" style="display:none"></div>

            <label class="login-label" for="la-email">E-mail</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">✉️</span>
              <input class="login-input" id="la-email" type="text" placeholder="Digite o e-mail" autocomplete="off" />
            </div>

            <label class="login-label" for="la-senha">Senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">🔒</span>
              <input class="login-input" id="la-senha" type="password" placeholder="Digite sua senha" />
            </div>

            <button class="login-link-recuperar is-admin" id="la-recuperar" type="button">❄ Esqueci minha senha</button>

            <button class="login-btn-principal is-admin" id="la-entrar" type="button">Entrar como Admin</button>
          </article>

          <button class="login-admin-voltar" id="la-voltar" type="button">← Voltar</button>
        </div>
      </section>
    `;

    const fundos = root.querySelector("#la-fundos");
    const card = root.querySelector("#la-card");
    const erroEl = root.querySelector("#la-erro");
    const emailEl = root.querySelector("#la-email");
    const senhaEl = root.querySelector("#la-senha");
    criarFlocosFundo(fundos);

    function shakeCard() {
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    }

    async function handleLogin() {
      const email = emailEl.value;
      const senha = senhaEl.value;

      const valido =
        window.AuthGuards && typeof window.AuthGuards.validarCredenciaisAdmin === "function"
          ? window.AuthGuards.validarCredenciaisAdmin(email, senha)
          : (email === ADMIN_EMAIL ||
              email === ADMIN_EMAIL1 ||
              email === ADMIN_EMAIL2 ||
              email === ADMIN_EMAIL3) &&
            (senha === ADMIN_SENHA ||
              senha === ADMIN_SENHA1 ||
              senha === ADMIN_SENHA2 ||
              senha === ADMIN_SENHA3);

      if (valido) {
        erroEl.style.display = "none";

        const emailCanon =
          window.AuthGuards && typeof window.AuthGuards.emailAdminCanonico === "function"
            ? window.AuthGuards.emailAdminCanonico(email)
            : email || ADMIN_EMAIL;

        const admin = {
          nome: "Administrador",
          perfil: "admin",
          email: `${emailCanon}@gmail.com`,
        };

        localStorage.setItem("@usuarioLogado", JSON.stringify(admin));
        if (props && typeof props.setUsuarioLogado === "function") {
          props.setUsuarioLogado(admin);
        }
        if (props && typeof props.configurarNotificacoes === "function") {
          await props.configurarNotificacoes();
        }
        if (props && typeof props.setTela === "function") {
          props.setTela("painelAdmin");
        }
      } else {
        shakeCard();
        erroEl.textContent = "❄ Credenciais inválidas. Acesso congelado!";
        erroEl.style.display = "block";
      }
    }

    root.querySelector("#la-recuperar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("recuperarSenha");
    });

    root.querySelector("#la-voltar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("inicial");
    });

    root.querySelector("#la-entrar").addEventListener("click", handleLogin);
  }

  window.Telas = window.Telas || {};
  window.Telas.loginAdmin = renderTelaLoginAdmin;
})();
