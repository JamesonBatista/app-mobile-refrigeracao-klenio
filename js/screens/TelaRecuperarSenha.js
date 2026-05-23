// js/screens/TelaRecuperarSenha.js

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

  function renderTelaRecuperarSenha(root, props) {
    root.innerHTML = `
      <section class="login-screen">
        <div class="login-fundos" id="rs-fundos"></div>

        <div class="login-scroll">
          <div class="login-logo-wrap">
            <div class="login-logo">❄</div>
            <p class="login-logo-nome">Klenio Refrigeração</p>
            <p class="login-logo-sub">RECUPERAR SENHA</p>
          </div>

          <article class="login-card" id="rs-form-card">
            <h2 class="login-titulo">Nova senha</h2>
            <p class="login-subtitulo">Digite seu e-mail e defina uma nova senha</p>

            <div class="login-erro-box" id="rs-erro" style="display:none"></div>

            <label class="login-label" for="rs-email">E-mail</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">✉️</span>
              <input class="login-input" id="rs-email" type="email" placeholder="seuemail@email.com" autocomplete="email" />
            </div>

            <label class="login-label" for="rs-senha">Nova senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">🔒</span>
              <input class="login-input" id="rs-senha" type="password" placeholder="Mínimo 6 caracteres" />
            </div>

            <label class="login-label" for="rs-confirmar">Confirmar senha</label>
            <div class="login-input-wrap">
              <span class="login-input-icone">🔒</span>
              <input class="login-input" id="rs-confirmar" type="password" placeholder="Repita a nova senha" />
            </div>

            <button class="login-btn-principal" id="rs-salvar" type="button">Salvar nova senha</button>
          </article>

          <article class="login-card rs-success-card" id="rs-success" style="display:none">
            <p class="rs-success-icon">❄</p>
            <h2 class="login-logo-nome rs-success-title">Senha atualizada!</h2>
            <p class="login-subtitulo rs-success-sub">Sua nova senha foi definida com sucesso.</p>
            <button class="login-btn-principal rs-success-btn" id="rs-fazer-login" type="button">Fazer login</button>
          </article>

          <button class="login-admin-voltar" id="rs-voltar" type="button">← Voltar</button>
        </div>
      </section>
    `;

    const fundos = root.querySelector("#rs-fundos");
    const erroEl = root.querySelector("#rs-erro");
    const emailEl = root.querySelector("#rs-email");
    const novaSenhaEl = root.querySelector("#rs-senha");
    const confirmarEl = root.querySelector("#rs-confirmar");
    const formCard = root.querySelector("#rs-form-card");
    const successCard = root.querySelector("#rs-success");
    criarFlocosFundo(fundos);

    async function handleRecuperar() {
      const email = emailEl.value;
      const novaSenha = novaSenhaEl.value;
      const confirmar = confirmarEl.value;

      const dadosSalvos = localStorage.getItem("@usuario");
      if (!dadosSalvos) {
        erroEl.textContent = "❄ E-mail não encontrado. Verifique e tente novamente.";
        erroEl.style.display = "block";
        return;
      }

      const usuario = JSON.parse(dadosSalvos);
      if (usuario.email !== email) {
        erroEl.textContent = "❄ E-mail não encontrado. Verifique e tente novamente.";
        erroEl.style.display = "block";
        return;
      }

      if (novaSenha.length < 6) {
        erroEl.textContent = "❄ A senha deve ter no mínimo 6 caracteres.";
        erroEl.style.display = "block";
        return;
      }

      if (novaSenha !== confirmar) {
        erroEl.textContent = "❄ As senhas não coincidem.";
        erroEl.style.display = "block";
        return;
      }

      usuario.senha = novaSenha;
      localStorage.setItem("@usuario", JSON.stringify(usuario));
      erroEl.textContent = "";
      erroEl.style.display = "none";
      formCard.style.display = "none";
      successCard.style.display = "block";
    }

    root.querySelector("#rs-salvar").addEventListener("click", handleRecuperar);

    root.querySelector("#rs-fazer-login").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    });

    root.querySelector("#rs-voltar").addEventListener("click", function () {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    });
  }

  window.Telas = window.Telas || {};
  window.Telas.recuperarSenha = renderTelaRecuperarSenha;
})();
