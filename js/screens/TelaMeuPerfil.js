// js/screens/TelaMeuPerfil.js

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

  function parseArrayStorage(key) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setArrayStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async function atualizarUsuarioFirestore(email, dados) {
    if (!email || !window.db || typeof window.db.collection !== "function") return;
    try {
      await window.db.collection("clientes").doc(email.toLowerCase()).update(dados);
    } catch (error) {}
  }

  function atualizarClienteLocal(email, updates) {
    const lista = parseArrayStorage("@clientes");
    const idx = lista.findIndex((item) => String(item.email || "").toLowerCase() === String(email || "").toLowerCase());
    if (idx < 0) return;
    lista[idx] = { ...lista[idx], ...updates };
    setArrayStorage("@clientes", lista);
  }

  function renderTelaMeuPerfil(root, props) {
    const usuarioInicial = (props && props.usuarioLogado) || {};

    const state = {
      usuarioBase: { ...usuarioInicial },
      nome: usuarioInicial.nome || "",
      endereco: usuarioInicial.endereco || "",
      telefone: usuarioInicial.telefone || "",
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
      editandoDados: false,
      editandoSenha: false,
      salvando: false,
    };

    async function handleSalvarDados() {
      if (!state.nome.trim() || !state.endereco.trim() || !state.telefone.trim()) {
        window.alert("Atenção ❄\nPreencha todos os campos obrigatórios.");
        return;
      }

      state.salvando = true;
      render();

      const usuarioAtualizado = {
        ...state.usuarioBase,
        nome: state.nome.trim(),
        endereco: state.endereco.trim(),
        telefone: state.telefone.trim(),
      };

      localStorage.setItem("@usuario", JSON.stringify(usuarioAtualizado));
      localStorage.setItem("@usuarioLogado", JSON.stringify(usuarioAtualizado));
      atualizarClienteLocal(usuarioAtualizado.email, {
        nome: usuarioAtualizado.nome,
        endereco: usuarioAtualizado.endereco,
        telefone: usuarioAtualizado.telefone,
      });
      await atualizarUsuarioFirestore(usuarioAtualizado.email, {
        nome: usuarioAtualizado.nome,
        endereco: usuarioAtualizado.endereco,
        telefone: usuarioAtualizado.telefone,
      });

      state.usuarioBase = usuarioAtualizado;
      state.salvando = false;
      state.editandoDados = false;
      render();

      if (props && typeof props.setUsuarioLogado === "function") {
        props.setUsuarioLogado(usuarioAtualizado);
      }

      window.alert("Sucesso! ❄\nSeus dados foram atualizados.");
    }

    async function buscarSenhaAtualSistema() {
      if (state.usuarioBase && state.usuarioBase.senha) return state.usuarioBase.senha;

      try {
        const rawUsuario = localStorage.getItem("@usuario");
        const usuarioLocal = rawUsuario ? JSON.parse(rawUsuario) : null;
        if (
          usuarioLocal &&
          usuarioLocal.email &&
          state.usuarioBase.email &&
          String(usuarioLocal.email).toLowerCase() === String(state.usuarioBase.email).toLowerCase() &&
          usuarioLocal.senha
        ) {
          return usuarioLocal.senha;
        }
      } catch (error) {}

      if (window.db && typeof window.db.collection === "function" && state.usuarioBase.email) {
        try {
          const doc = await window.db.collection("clientes").doc(state.usuarioBase.email.toLowerCase()).get();
          if (doc && doc.exists) {
            const dados = doc.data();
            if (dados && dados.senha) return dados.senha;
          }
        } catch (error) {}
      }

      return null;
    }

    async function handleSalvarSenha() {
      if (!state.senhaAtual.trim() || !state.novaSenha.trim() || !state.confirmarSenha.trim()) {
        window.alert("Atenção ❄\nPreencha todos os campos de senha.");
        return;
      }

      const senhaSistema = await buscarSenhaAtualSistema();
      if (!senhaSistema || state.senhaAtual !== senhaSistema) {
        window.alert("Erro ❄\nA senha atual está incorreta.");
        return;
      }
      if (state.novaSenha.length < 6) {
        window.alert("Atenção ❄\nA nova senha precisa ter pelo menos 6 caracteres.");
        return;
      }
      if (state.novaSenha !== state.confirmarSenha) {
        window.alert("Erro ❄\nAs senhas não conferem.");
        return;
      }

      state.salvando = true;
      render();

      const usuarioAtualizado = { ...state.usuarioBase, senha: state.novaSenha };
      localStorage.setItem("@usuario", JSON.stringify(usuarioAtualizado));
      localStorage.setItem("@usuarioLogado", JSON.stringify(usuarioAtualizado));
      await atualizarUsuarioFirestore(usuarioAtualizado.email, { senha: state.novaSenha });

      state.usuarioBase = usuarioAtualizado;
      state.salvando = false;
      state.editandoSenha = false;
      state.senhaAtual = "";
      state.novaSenha = "";
      state.confirmarSenha = "";
      render();

      if (props && typeof props.setUsuarioLogado === "function") {
        props.setUsuarioLogado(usuarioAtualizado);
      }

      window.alert("Sucesso! ❄\nSenha alterada com sucesso.");
    }

    function bindEvents() {
      const container = root.querySelector("#mp-container");
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
        if (action === "toggle-dados") {
          state.editandoDados = !state.editandoDados;
          render();
          return;
        }
        if (action === "toggle-senha") {
          state.editandoSenha = !state.editandoSenha;
          if (!state.editandoSenha) {
            state.senhaAtual = "";
            state.novaSenha = "";
            state.confirmarSenha = "";
          }
          render();
          return;
        }
        if (action === "salvar-dados") {
          handleSalvarDados();
          return;
        }
        if (action === "salvar-senha") {
          handleSalvarSenha();
        }
      });

      const nomeInput = root.querySelector("#mp-nome");
      if (nomeInput) {
        nomeInput.addEventListener("input", function () {
          state.nome = nomeInput.value;
        });
      }

      const enderecoInput = root.querySelector("#mp-endereco");
      if (enderecoInput) {
        enderecoInput.addEventListener("input", function () {
          state.endereco = enderecoInput.value;
        });
      }

      const telefoneInput = root.querySelector("#mp-telefone");
      if (telefoneInput) {
        telefoneInput.addEventListener("input", function () {
          state.telefone = telefoneInput.value;
        });
      }

      const senhaAtualInput = root.querySelector("#mp-senha-atual");
      if (senhaAtualInput) {
        senhaAtualInput.addEventListener("input", function () {
          state.senhaAtual = senhaAtualInput.value;
        });
      }

      const novaSenhaInput = root.querySelector("#mp-nova-senha");
      if (novaSenhaInput) {
        novaSenhaInput.addEventListener("input", function () {
          state.novaSenha = novaSenhaInput.value;
        });
      }

      const confirmarSenhaInput = root.querySelector("#mp-confirmar-senha");
      if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener("input", function () {
          state.confirmarSenha = confirmarSenhaInput.value;
        });
      }
    }

    function render() {
      root.innerHTML = `
        <section class="pa-screen">
          <div class="pa-fundos" id="mp-fundos"></div>
          <div class="pa-scroll" id="mp-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Meu Perfil</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <article class="ch-card">
              <div class="ab-endereco-row" style="margin-bottom:16px">
                <h2 class="ch-title">Dados pessoais</h2>
                <button class="ab-edit-btn" data-action="toggle-dados" type="button">
                  ${state.editandoDados ? "✕ Cancelar" : "✏️ Editar"}
                </button>
              </div>

              <label class="ch-input-label">E-mail</label>
              <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:12px">
                <span>✉️</span>
                <span style="color:rgba(180,220,255,0.5);font-size:14px;flex:1">${escapeHtml(state.usuarioBase.email || "")}</span>
                <small style="color:rgba(180,220,255,0.3)">Não editável</small>
              </div>

              <label class="ch-input-label">Nome completo</label>
              ${
                state.editandoDados
                  ? `
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">👤</span>
                      <input id="mp-nome" class="ch-input" value="${escapeHtml(state.nome)}" />
                    </div>
                  `
                  : `
                    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px">
                      <span>👤</span>
                      <span style="color:#fff;font-size:14px">${escapeHtml(state.nome)}</span>
                    </div>
                  `
              }

              <label class="ch-input-label">Endereço</label>
              ${
                state.editandoDados
                  ? `
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">📍</span>
                      <input id="mp-endereco" class="ch-input" value="${escapeHtml(state.endereco)}" />
                    </div>
                  `
                  : `
                    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px">
                      <span>📍</span>
                      <span style="color:#fff;font-size:14px">${escapeHtml(state.endereco)}</span>
                    </div>
                  `
              }

              <label class="ch-input-label">Telefone / WhatsApp</label>
              ${
                state.editandoDados
                  ? `
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">📱</span>
                      <input id="mp-telefone" class="ch-input" value="${escapeHtml(state.telefone)}" />
                    </div>
                  `
                  : `
                    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px">
                      <span>📱</span>
                      <span style="color:#fff;font-size:14px">${escapeHtml(state.telefone)}</span>
                    </div>
                  `
              }

              ${
                state.editandoDados
                  ? `
                    <button class="op-btn primary" data-action="salvar-dados" type="button" ${state.salvando ? "disabled" : ""}>
                      ${state.salvando ? '<span class="op-spinner"></span>' : "💾 Salvar dados"}
                    </button>
                  `
                  : ""
              }
            </article>

            <article class="ch-card" style="margin-top:14px">
              <div class="ab-endereco-row" style="margin-bottom:16px">
                <h2 class="ch-title">Alterar senha</h2>
                <button class="ab-edit-btn" data-action="toggle-senha" type="button">
                  ${state.editandoSenha ? "✕ Cancelar" : "🔒 Alterar"}
                </button>
              </div>

              ${
                state.editandoSenha
                  ? `
                    <label class="ch-input-label">Senha atual</label>
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">🔒</span>
                      <input id="mp-senha-atual" class="ch-input" type="password" value="${escapeHtml(state.senhaAtual)}" placeholder="Digite sua senha atual" />
                    </div>

                    <label class="ch-input-label">Nova senha</label>
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">🔑</span>
                      <input id="mp-nova-senha" class="ch-input" type="password" value="${escapeHtml(state.novaSenha)}" placeholder="Mínimo 6 caracteres" />
                    </div>

                    <label class="ch-input-label">Confirmar nova senha</label>
                    <div class="ch-input-wrap" style="margin-bottom:12px">
                      <span class="ch-input-icon">🔑</span>
                      <input id="mp-confirmar-senha" class="ch-input" type="password" value="${escapeHtml(state.confirmarSenha)}" placeholder="Repita a nova senha" />
                    </div>

                    <button class="op-btn primary" data-action="salvar-senha" type="button" ${state.salvando ? "disabled" : ""}>
                      ${state.salvando ? '<span class="op-spinner"></span>' : "🔒 Salvar nova senha"}
                    </button>
                  `
                  : `
                    <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px">
                      <span>🔒</span>
                      <span style="color:rgba(180,220,255,0.5);font-size:14px">••••••••</span>
                    </div>
                  `
              }
            </article>

            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#mp-fundos"), "pa");
      bindEvents();
    }

    render();
  }

  window.Telas = window.Telas || {};
  window.Telas.perfil = renderTelaMeuPerfil;
})();
