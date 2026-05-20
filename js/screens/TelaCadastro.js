// js/screens/TelaCadastro.js

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
    criarFlocosFundo(fundos);

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

      btnCadastrar.disabled = true;
      btnCadastrar.textContent = "Cadastrando...";

      try {
        const emailNormalizado = email.trim().toLowerCase();
        const clientesLocais = getClientesLocais();
        const existeLocal = clientesLocais.some(function (item) {
          return String(item && item.email ? item.email : "").toLowerCase() === emailNormalizado;
        });
        let existeRemoto = false;
        const dbDisponivel = !!(window.db && typeof window.db.collection === "function");

        if (dbDisponivel) {
          try {
            const doc = await window.db.collection("clientes").doc(emailNormalizado).get();
            existeRemoto = !!(doc && doc.exists);
          } catch (error) {
            console.log("Não foi possível validar cliente no Firestore antes do cadastro:", error);
          }
        }

        if (existeLocal || existeRemoto) {
          window.showAppAlert("Atenção\nEste e-mail já está cadastrado.");
          btnCadastrar.disabled = false;
          btnCadastrar.textContent = "Cadastrar";
          return;
        }

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

        let salvoNoFirestore = false;
        if (dbDisponivel) {
          try {
            await window.db.collection("clientes").doc(emailNormalizado).set(novoUsuario);
            salvoNoFirestore = true;
          } catch (error) {
            console.log("Falha ao salvar no Firestore, mantendo cadastro local:", error);
          }
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

        if (dbDisponivel && !salvoNoFirestore) {
          window.showAppAlert(
            "Conta criada localmente, mas não foi possível sincronizar com o banco agora.\nTente novamente com internet estável para sincronizar."
          );
        }
      } catch (error) {
        console.log("Erro cadastro:", error);
        window.showAppAlert("Erro\nNão foi possível realizar o cadastro. Tente novamente.");
      }

      btnCadastrar.disabled = false;
      btnCadastrar.textContent = "Cadastrar";
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
