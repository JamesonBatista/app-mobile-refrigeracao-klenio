// js/screens/TelaSolicitarOrcamento.js

(function () {
  const TIPOS_SERVICO = [
    { icone: "❄", label: "Instalação de AR" },
    { icone: "🔧", label: "Manutenção preventiva" },
    { icone: "🔄", label: "Substituição" },
    { icone: "🏗️", label: "Instalação nova" },
    { icone: "📋", label: "Outro" },
  ];

  const TIPOS_APARELHO = ["Split", "Janela", "Cassete", "Piso Teto", "Portátil"];
  const BTUS = ["Não sei", "9.000", "12.000", "18.000", "24.000", "36.000"];

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

  function gerarNumeroOrcamento() {
    return `#O${Math.floor(Math.random() * 90000 + 10000)}`;
  }

  function getNowStrSafe() {
    if (typeof window.getNowStr === "function") return window.getNowStr();
    const agora = new Date();
    return {
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  }

  async function salvarOrcamentoSafe(orcamento) {
    if (typeof window.salvarOrcamento === "function") {
      await window.salvarOrcamento(orcamento);
      return;
    }
    const lista = parseArrayStorage("@orcamentos");
    lista.unshift(orcamento);
    setArrayStorage("@orcamentos", lista);
  }

  function renderTelaSolicitarOrcamento(root, props) {
    const usuario = props && props.usuarioLogado ? props.usuarioLogado : {};
    const state = {
      tiposServico: [],
      quantidade: "1",
      tiposAparelho: [],
      btu: null,
      metragem: "",
      endereco: usuario.endereco || "",
      editandoEndereco: false,
      detalhes: "",
      fotos: [],
      fotoExpandida: null,
      carregando: false,
    };

    const urlsCriadas = new Set();

    function toggleTipoServico(label) {
      if (state.tiposServico.includes(label)) {
        state.tiposServico = state.tiposServico.filter((item) => item !== label);
      } else {
        state.tiposServico.push(label);
      }
      render();
    }

    function toggleTipoAparelho(tipo) {
      if (state.tiposAparelho.includes(tipo)) {
        state.tiposAparelho = state.tiposAparelho.filter((item) => item !== tipo);
      } else {
        state.tiposAparelho.push(tipo);
      }
      render();
    }

    function processarArquivos(files) {
      if (!files || files.length === 0) return;
      if (state.fotos.length >= 5) {
        window.showAppAlert("Limite atingido ❄\nVocê pode adicionar no máximo 5 fotos.");
        return;
      }
      const restantes = 5 - state.fotos.length;
      Array.from(files)
        .slice(0, restantes)
        .forEach((file) => {
          const uri = URL.createObjectURL(file);
          urlsCriadas.add(uri);
          state.fotos.push(uri);
        });
      render();
    }

    async function removerFoto(index) {
      const ok = await window.showAppConfirm("Deseja remover esta foto?");
      if (!ok) return;
      const foto = state.fotos[index];
      if (foto && urlsCriadas.has(foto)) {
        URL.revokeObjectURL(foto);
        urlsCriadas.delete(foto);
      }
      state.fotos = state.fotos.filter((_, i) => i !== index);
      if (state.fotoExpandida === foto) state.fotoExpandida = null;
      render();
    }

    async function handleEnviar() {
      if (state.tiposServico.length === 0) {
        window.showAppAlert("Atenção ❄\nSelecione ao menos um tipo de serviço.");
        return;
      }
      if (state.tiposAparelho.length === 0) {
        window.showAppAlert("Atenção ❄\nSelecione ao menos um tipo de aparelho.");
        return;
      }
      if (!state.btu) {
        window.showAppAlert("Atenção ❄\nSelecione os BTUs.");
        return;
      }
      if (!state.endereco.trim()) {
        window.showAppAlert("Atenção ❄\nInforme o endereço.");
        return;
      }

      state.carregando = true;
      render();

      const { data, hora } = getNowStrSafe();
      const orcamento = {
        numero: gerarNumeroOrcamento(),
        tipoServico: state.tiposServico.join(", "),
        quantidade: state.quantidade,
        tipoAparelho: state.tiposAparelho.join(", "),
        btu: state.btu,
        metragem: state.metragem.trim() ? `${state.metragem}m` : "Não informado",
        endereco: state.endereco,
        dataFormatada: "",
        dataChave: "",
        horario: "",
        detalhes: state.detalhes,
        fotos: state.fotos.length > 0 ? state.fotos : [],
        status: "Aguardando análise",
        cliente: usuario.nome || "",
        clienteEmail: usuario.email || "",
        clienteTelefone: usuario.telefone || "",
        valorOrcamento: "",
        descricaoAdmin: "",
        dataAbertura: data,
        horaAbertura: hora,
        dataCriacao: `${data} às ${hora}`,
        historicoStatus: [{ status: "Aguardando análise", data, hora }],
      };

      await salvarOrcamentoSafe(orcamento);
      state.carregando = false;
      render();
      window.showAppAlert("Orçamento solicitado! ❄\nEnviado com sucesso. Aguarde nossa análise.");
      if (props && typeof props.setTela === "function") props.setTela("meusOrcamentos");
    }

    function bindEvents() {
      const container = root.querySelector("#so-container");
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
        if (action === "toggle-servico") {
          toggleTipoServico(actionEl.dataset.value);
          return;
        }
        if (action === "set-qtd") {
          state.quantidade = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "toggle-aparelho") {
          toggleTipoAparelho(actionEl.dataset.value);
          return;
        }
        if (action === "set-btu") {
          state.btu = actionEl.dataset.value;
          render();
          return;
        }
        if (action === "toggle-endereco") {
          state.editandoEndereco = !state.editandoEndereco;
          render();
          return;
        }
        if (action === "open-galeria") {
          if (state.fotos.length >= 5) {
            window.showAppAlert("Limite atingido ❄\nVocê pode adicionar no máximo 5 fotos.");
            return;
          }
          const input = root.querySelector("#so-input-galeria");
          if (input) input.click();
          return;
        }
        if (action === "open-camera") {
          if (state.fotos.length >= 5) {
            window.showAppAlert("Limite atingido ❄\nVocê pode adicionar no máximo 5 fotos.");
            return;
          }
          const input = root.querySelector("#so-input-camera");
          if (input) input.click();
          return;
        }
        if (action === "remover-foto") {
          removerFoto(Number(actionEl.dataset.index));
          return;
        }
        if (action === "expandir-foto") {
          state.fotoExpandida = state.fotos[Number(actionEl.dataset.index)] || null;
          render();
          return;
        }
        if (action === "enviar") {
          handleEnviar();
          return;
        }
      });

      const metragemInput = root.querySelector("#so-metragem");
      if (metragemInput) {
        metragemInput.addEventListener("input", function () {
          state.metragem = metragemInput.value;
        });
      }

      const enderecoInput = root.querySelector("#so-endereco");
      if (enderecoInput) {
        enderecoInput.addEventListener("input", function () {
          state.endereco = enderecoInput.value;
        });
      }

      const detalhesInput = root.querySelector("#so-detalhes");
      if (detalhesInput) {
        detalhesInput.addEventListener("input", function () {
          state.detalhes = detalhesInput.value;
        });
      }

      const inputGaleria = root.querySelector("#so-input-galeria");
      if (inputGaleria) {
        inputGaleria.addEventListener("change", function () {
          processarArquivos(inputGaleria.files);
          inputGaleria.value = "";
        });
      }

      const inputCamera = root.querySelector("#so-input-camera");
      if (inputCamera) {
        inputCamera.addEventListener("change", function () {
          processarArquivos(inputCamera.files);
          inputCamera.value = "";
        });
      }

      const modal = root.querySelector("#so-modal-foto");
      if (modal) {
        modal.addEventListener("click", function () {
          state.fotoExpandida = null;
          render();
        });
      }
    }

    function renderFotos() {
      const count = state.fotos.length;
      return `
        <article class="ch-card" style="margin-top:14px">
          <div class="ab-fotos-header">
            <h2 class="ch-title">Fotos do equipamento</h2>
            <span class="ab-fotos-count${count >= 5 ? " is-limit" : ""}">${count}/5</span>
          </div>
          <p class="ch-sub">Opcional — máximo 5 fotos</p>

          ${
            count > 0
              ? `
                <div class="ab-fotos-grid">
                  ${state.fotos
                    .map(
                      (uri, index) => `
                        <div class="ab-foto-item">
                          <img class="ab-foto-thumb" data-action="expandir-foto" data-index="${index}" src="${uri}" alt="Foto ${index + 1}" />
                          <span class="ab-foto-zoom">🔍</span>
                          <button class="ab-foto-remove" data-action="remover-foto" data-index="${index}" type="button">✕</button>
                        </div>
                      `
                    )
                    .join("")}
                </div>
              `
              : ""
          }

          ${
            count < 5
              ? `
                <div class="ab-foto-picker-row">
                  <button class="ab-foto-picker-btn" data-action="open-camera" type="button">📷 Tirar foto</button>
                  <button class="ab-foto-picker-btn" data-action="open-galeria" type="button">🖼️ Galeria</button>
                </div>
                <button class="ab-foto-add${count === 0 ? " is-empty" : ""}" data-action="open-galeria" type="button">
                  <div class="ab-foto-add-icon">📷</div>
                  <div>${count > 0 ? `Adicionar mais (${5 - count} restante${5 - count > 1 ? "s" : ""})` : "Toque para adicionar foto"}</div>
                  ${count === 0 ? '<div class="ab-foto-add-sub">Câmera ou galeria</div>' : ""}
                </button>
                <input id="so-input-galeria" type="file" accept="image/*" style="display:none" />
                <input id="so-input-camera" type="file" accept="image/*" capture="environment" style="display:none" />
              `
              : ""
          }
        </article>
      `;
    }

    function renderModalFoto() {
      if (!state.fotoExpandida) return "";
      return `
        <div class="ch-modal" id="so-modal-foto">
          <img class="ch-modal-img" src="${state.fotoExpandida}" alt="Foto ampliada" />
          <p class="ch-modal-close">Toque para fechar</p>
        </div>
      `;
    }

    function render() {
      root.innerHTML = `
        <section class="ab-screen">
          <div class="ab-fundos" id="so-fundos"></div>
          <div class="ab-scroll" id="so-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Solicitar Orçamento</h1>
              </div>
              <button class="ch-voltar" data-action="voltar" type="button">← Voltar</button>
            </header>

            <article class="ap-hint-card" style="margin-bottom:16px">
              <span style="font-size:20px">💡</span>
              <span>Após aprovação do orçamento, você poderá escolher a data e horário do atendimento.</span>
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Tipo de serviço <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Pode selecionar mais de um</p>
              <div class="ap-problem-grid">
                ${TIPOS_SERVICO.map((tipo) => {
                  const sel = state.tiposServico.includes(tipo.label);
                  return `
                    <button class="ap-problem-btn${sel ? " is-active" : ""}" data-action="toggle-servico" data-value="${escapeHtml(tipo.label)}" type="button">
                      <span>${tipo.icone}</span>
                      <small>${escapeHtml(tipo.label)}</small>
                      ${sel ? "<i>✓</i>" : ""}
                    </button>
                  `;
                }).join("")}
              </div>
            </article>

            <article class="ch-card" style="margin-top:14px">
              <h2 class="ch-title">Dados do equipamento</h2>

              <label class="ch-input-label">Quantidade de aparelhos</label>
              <div class="coa-inline-chips">
                ${["1", "2", "3", "4", "5+"]
                  .map(
                    (q) => `
                      <button class="ap-chip${state.quantidade === q ? " is-active" : ""}" data-action="set-qtd" data-value="${q}" type="button">
                        ${q}
                      </button>
                    `
                  )
                  .join("")}
              </div>

              <label class="ch-input-label">Tipo do aparelho <span style="color:#e74c3c">*</span></label>
              <p class="ad-muted" style="font-size:11px;margin-bottom:8px">Pode selecionar mais de um</p>
              <div class="coa-inline-chips">
                ${TIPOS_APARELHO.map(
                  (tipo) => `
                    <button class="ap-chip${state.tiposAparelho.includes(tipo) ? " is-active" : ""}" data-action="toggle-aparelho" data-value="${escapeHtml(tipo)}" type="button">
                      ${escapeHtml(tipo)} ${state.tiposAparelho.includes(tipo) ? "✓" : ""}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">BTUs <span style="color:#e74c3c">*</span></label>
              <div class="coa-inline-chips">
                ${BTUS.map(
                  (btu) => `
                    <button class="ap-chip${state.btu === btu ? " is-active" : ""}" data-action="set-btu" data-value="${escapeHtml(btu)}" type="button">
                      ${escapeHtml(btu)}
                    </button>
                  `
                ).join("")}
              </div>

              <label class="ch-input-label">Metragem <small style="color:rgba(180,220,255,0.4)">(opcional)</small></label>
              <div class="ch-input-wrap">
                <span class="ch-input-icon">📐</span>
                <input id="so-metragem" class="ch-input" value="${escapeHtml(state.metragem)}" placeholder="Ex: 5.5" />
                <span style="color:rgba(180,220,255,0.4);padding-right:12px">metros</span>
              </div>
            </article>

            <article class="ch-card" style="margin-top:14px">
              <div class="ab-endereco-row">
                <h2 class="ch-title">Endereço <span style="color:#e74c3c">*</span></h2>
                <button class="ab-edit-btn" data-action="toggle-endereco" type="button">
                  ${state.editandoEndereco ? "✓ Confirmar" : "✏️ Editar"}
                </button>
              </div>
              ${
                state.editandoEndereco
                  ? `
                    <div class="ch-input-wrap" style="margin-top:12px">
                      <span class="ch-input-icon">📍</span>
                      <input id="so-endereco" class="ch-input" value="${escapeHtml(state.endereco)}" />
                    </div>
                  `
                  : `
                    <div class="ab-endereco-view" style="margin-top:12px">
                      <span>📍</span>
                      <span class="ac-info-text" style="flex:1">${escapeHtml(state.endereco)}</span>
                    </div>
                  `
              }
            </article>

            ${renderFotos()}

            <article class="ch-card" style="margin-top:14px">
              <h2 class="ch-title">Detalhes adicionais</h2>
              <p class="ch-sub">Opcional</p>
              <textarea id="so-detalhes" class="ch-textarea" placeholder="Ex: Preciso instalar 2 splits na sala...">${escapeHtml(state.detalhes)}</textarea>
            </article>

            <button class="op-btn primary" style="margin-top:20px" data-action="enviar" type="button" ${state.carregando ? "disabled" : ""}>
              ${state.carregando ? '<span class="op-spinner"></span>' : "📋 Solicitar Orçamento"}
            </button>

            <div style="height:20px"></div>
          </div>
          ${renderModalFoto()}
        </section>
      `;

      criarFlocosFundo(root.querySelector("#so-fundos"), "ab");
      bindEvents();
    }

    render();

    return function cleanupSolicitarOrcamento() {
      urlsCriadas.forEach((uri) => {
        try {
          URL.revokeObjectURL(uri);
        } catch (error) {}
      });
      urlsCriadas.clear();
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.orcamento = renderTelaSolicitarOrcamento;
})();
