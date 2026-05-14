// js/screens/TelaProfissionais.js

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

  function getProfissionaisLocal() {
    try {
      const raw = localStorage.getItem("@profissionais");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function setProfissionaisLocal(lista) {
    localStorage.setItem("@profissionais", JSON.stringify(lista));
  }

  function ouvirProfissionaisSafe(callback) {
    if (typeof window.ouvirProfissionais === "function") {
      const unsub = window.ouvirProfissionais(function (lista) {
        callback(Array.isArray(lista) ? lista : []);
      });
      return typeof unsub === "function" ? unsub : function () {};
    }

    callback(getProfissionaisLocal());
    const interval = setInterval(function () {
      callback(getProfissionaisLocal());
    }, 3000);
    return function () {
      clearInterval(interval);
    };
  }

  async function salvarProfissionalSafe(profissional) {
    if (typeof window.salvarProfissional === "function") {
      await window.salvarProfissional(profissional);
      return;
    }
    const lista = getProfissionaisLocal();
    lista.unshift(profissional);
    setProfissionaisLocal(lista);
  }

  async function atualizarProfissionalSafe(id, updates) {
    if (typeof window.atualizarProfissional === "function") {
      await window.atualizarProfissional(id, updates);
      return;
    }
    const lista = getProfissionaisLocal();
    const idx = lista.findIndex((item) => item.id === id);
    if (idx < 0) return;
    lista[idx] = { ...lista[idx], ...updates };
    setProfissionaisLocal(lista);
  }

  async function excluirProfissionalSafe(id) {
    if (typeof window.excluirProfissional === "function") {
      await window.excluirProfissional(id);
      return;
    }
    const lista = getProfissionaisLocal().filter((item) => item.id !== id);
    setProfissionaisLocal(lista);
  }

  async function showConfirm(message) {
    if (typeof window.showCustomConfirm === "function") {
      return window.showCustomConfirm(message);
    }
    return window.confirm(message);
  }

  function renderTelaProfissionais(root, props) {
    const state = {
      profissionais: [],
      carregando: true,
      salvando: false,
      editando: null,
      mostrando: false,
      nome: "",
      especialidade: "",
      telefone: "",
      unsubscribe: null,
    };

    function limparForm() {
      state.nome = "";
      state.especialidade = "";
      state.telefone = "";
      state.editando = null;
      state.mostrando = false;
    }

    async function handleSalvar() {
      if (!state.nome.trim()) {
        window.alert("Atenção ❄\nInforme o nome do profissional.");
        return;
      }

      state.salvando = true;
      render();

      if (state.editando) {
        await atualizarProfissionalSafe(state.editando.id, {
          nome: state.nome.trim(),
          especialidade: state.especialidade.trim(),
          telefone: state.telefone.trim(),
        });
        window.alert("Sucesso! ❄\nProfissional atualizado com sucesso.");
      } else {
        const novoProfissional = {
          id: `prof_${Date.now()}`,
          nome: state.nome.trim(),
          especialidade: state.especialidade.trim(),
          telefone: state.telefone.trim(),
          dataCadastro: new Date().toLocaleDateString("pt-BR"),
        };
        await salvarProfissionalSafe(novoProfissional);
        window.alert("Sucesso! ❄\nProfissional cadastrado com sucesso.");
      }

      state.salvando = false;
      limparForm();
      render();
    }

    function handleEditar(id) {
      const profissional = state.profissionais.find((item) => item.id === id);
      if (!profissional) return;
      state.editando = profissional;
      state.nome = profissional.nome || "";
      state.especialidade = profissional.especialidade || "";
      state.telefone = profissional.telefone || "";
      state.mostrando = true;
      render();
    }

    async function handleExcluir(id) {
      const profissional = state.profissionais.find((item) => item.id === id);
      if (!profissional) return;
      const ok = await showConfirm(`Tem certeza que deseja excluir ${profissional.nome}?`);
      if (!ok) return;
      await excluirProfissionalSafe(id);
      window.alert("Excluído!\nProfissional removido com sucesso.");
    }

    function bindEvents() {
      const container = root.querySelector("#tp-container");
      if (!container) return;

      container.addEventListener("click", function (event) {
        const actionEl = event.target.closest("[data-action]");
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (!action) return;

        if (action === "voltar") {
          if (props && typeof props.setTela === "function") props.setTela("painelAdmin");
          return;
        }
        if (action === "novo") {
          state.editando = null;
          state.nome = "";
          state.especialidade = "";
          state.telefone = "";
          state.mostrando = true;
          render();
          return;
        }
        if (action === "cancelar-form") {
          limparForm();
          render();
          return;
        }
        if (action === "salvar") {
          handleSalvar();
          return;
        }
        if (action === "editar") {
          handleEditar(actionEl.dataset.id);
          return;
        }
        if (action === "excluir") {
          handleExcluir(actionEl.dataset.id);
        }
      });

      const nomeInput = root.querySelector("#tp-nome");
      if (nomeInput) {
        nomeInput.addEventListener("input", function () {
          state.nome = nomeInput.value;
        });
      }

      const espInput = root.querySelector("#tp-especialidade");
      if (espInput) {
        espInput.addEventListener("input", function () {
          state.especialidade = espInput.value;
        });
      }

      const telInput = root.querySelector("#tp-telefone");
      if (telInput) {
        telInput.addEventListener("input", function () {
          state.telefone = telInput.value;
        });
      }
    }

    function renderLista() {
      if (state.carregando) {
        return `
          <div class="tp-loading">
            <div class="ch-spinner"></div>
          </div>
        `;
      }

      if (state.profissionais.length === 0) {
        return `
          <div class="tp-empty">
            <p style="font-size:48px">👷</p>
            <p class="tp-empty-title">Nenhum profissional</p>
            <p class="tp-empty-sub">Cadastre profissionais para atribuir aos chamados.</p>
          </div>
        `;
      }

      return state.profissionais
        .map(function (prof) {
          return `
            <article class="tp-card">
              <div class="tp-card-head">
                <div class="tp-user-wrap">
                  <span class="tp-avatar">👷</span>
                  <span>
                    <strong>${escapeHtml(prof.nome)}</strong>
                    ${
                      prof.especialidade
                        ? `<br /><small>${escapeHtml(prof.especialidade)}</small>`
                        : ""
                    }
                  </span>
                </div>
                <div class="tp-actions">
                  <button class="tp-btn-edit" data-action="editar" data-id="${escapeHtml(prof.id)}" type="button">✏️ Editar</button>
                  <button class="tp-btn-delete" data-action="excluir" data-id="${escapeHtml(prof.id)}" type="button">🗑️</button>
                </div>
              </div>
              ${
                prof.telefone
                  ? `
                    <div class="tp-phone">
                      <span>📱</span>
                      <span>${escapeHtml(prof.telefone)}</span>
                    </div>
                  `
                  : ""
              }
            </article>
          `;
        })
        .join("");
    }

    function render() {
      root.innerHTML = `
        <section class="tp-screen">
          <div class="tp-fundos" id="tp-fundos"></div>
          <div class="tp-scroll" id="tp-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Profissionais</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            ${
              !state.mostrando
                ? `
                  <button class="tp-new-btn" data-action="novo" type="button">
                    <span>👷</span>
                    <span>+ Novo Profissional</span>
                  </button>
                `
                : ""
            }

            ${
              state.mostrando
                ? `
                  <article class="ch-card" style="margin-bottom:20px">
                    <h2 class="ch-title">${state.editando ? "✏️ Editar profissional" : "👷 Novo profissional"}</h2>
                    <p class="ch-sub">${
                      state.editando
                        ? "Atualize os dados do profissional"
                        : "Preencha os dados do profissional"
                    }</p>

                    <label class="ch-input-label">Nome <span style="color:#e74c3c">*</span></label>
                    <div class="ch-input-wrap">
                      <span class="ch-input-icon">👷</span>
                      <input id="tp-nome" class="ch-input" value="${escapeHtml(state.nome)}" placeholder="Nome do profissional" />
                    </div>

                    <label class="ch-input-label">Especialidade</label>
                    <div class="ch-input-wrap">
                      <span class="ch-input-icon">🔧</span>
                      <input id="tp-especialidade" class="ch-input" value="${escapeHtml(state.especialidade)}" placeholder="Ex: Técnico em refrigeração" />
                    </div>

                    <label class="ch-input-label">Telefone</label>
                    <div class="ch-input-wrap">
                      <span class="ch-input-icon">📱</span>
                      <input id="tp-telefone" class="ch-input" value="${escapeHtml(state.telefone)}" placeholder="(00) 00000-0000" />
                    </div>

                    <div class="tp-form-actions">
                      <button class="op-btn cancel" data-action="cancelar-form" type="button">Cancelar</button>
                      <button class="op-btn primary" data-action="salvar" type="button" ${state.salvando ? "disabled" : ""}>
                        ${state.salvando ? '<span class="op-spinner"></span>' : state.editando ? "💾 Atualizar" : "💾 Cadastrar"}
                      </button>
                    </div>
                  </article>
                `
                : ""
            }

            ${renderLista()}
            <div style="height:20px"></div>
          </div>
        </section>
      `;

      criarFlocosFundo(root.querySelector("#tp-fundos"), "tp");
      bindEvents();
    }

    render();
    state.unsubscribe = ouvirProfissionaisSafe(function (lista) {
      state.profissionais = lista;
      state.carregando = false;
      render();
    });

    return function cleanupProfissionais() {
      if (typeof state.unsubscribe === "function") {
        try {
          state.unsubscribe();
        } catch (error) {}
      }
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.profissionais = renderTelaProfissionais;
})();
