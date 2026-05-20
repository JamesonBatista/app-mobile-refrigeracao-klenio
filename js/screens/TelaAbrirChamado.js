// js/screens/TelaAbrirChamado.js

(function () {
  const TIPOS = [
    { icone: "❄", label: "Não está gelando" },
    { icone: "💧", label: "Vazando água" },
    { icone: "🔊", label: "Fazendo barulho" },
    { icone: "⚡", label: "Não liga" },
    { icone: "🌡️", label: "Temp. irregular" },
    { icone: "🔧", label: "Manutenção" },
  ];

  const HORARIOS_SEMANA_PADRAO = [
    "08:00 às 10:00",
    "10:00 às 12:00",
    "13:00 às 15:00",
    "15:00 às 17:00",
  ];

  const HORARIOS_SABADO_PADRAO = [
    "09:00 às 11:00",
    "11:30 às 13:00",
  ];

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

  function gerarNumeroChamado() {
    return `#${Math.floor(Math.random() * 90000 + 10000)}`;
  }

  function isSabado(data) {
    return data.getDay() === 6;
  }

  function formatarDataChave(data) {
    return data.toISOString().split("T")[0];
  }

  function formatarData(data) {
    return data.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  function getProximosDias() {
    const dias = [];
    const hoje = new Date();
    let contador = 0;
    let i = 0;
    while (contador < 7) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      i += 1;
      if (data.getDay() !== 0) {
        dias.push(data);
        contador += 1;
      }
    }
    return dias;
  }

  async function getHorariosDisponiveisSafe(data) {
    if (typeof window.getHorariosDisponiveis === "function") {
      return window.getHorariosDisponiveis(data);
    }
    return isSabado(data) ? HORARIOS_SABADO_PADRAO : HORARIOS_SEMANA_PADRAO;
  }

  async function salvarChamadoSafe(chamado) {
    if (typeof window.salvarChamado === "function") {
      await window.salvarChamado(chamado);
      return;
    }
    throw new Error("Serviço de chamados indisponível");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function lerArquivoComoDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(new Error("Falha ao ler arquivo"));
      };
      reader.readAsDataURL(file);
    });
  }

  function renderTelaAbrirChamado(root, props) {
    const usuarioLogado = props && props.usuarioLogado ? props.usuarioLogado : {};
    const state = {
      tiposSelecionados: [],
      outroTipo: "",
      mostrarOutro: false,
      endereco: usuarioLogado.endereco || "",
      editandoEndereco: false,
      dias: getProximosDias(),
      diaSelecionado: null,
      horariosDisponiveis: [],
      horario: null,
      detalhes: "",
      fotos: [],
      fotoExpandida: null,
      carregando: false,
      carregandoHorarios: false,
      diasLotados: {},
    };

    async function verificarDiasLotados() {
      const lotados = {};
      for (const dia of state.dias) {
        const horarios = await getHorariosDisponiveisSafe(dia);
        if (!horarios || horarios.length === 0) {
          lotados[formatarDataChave(dia)] = true;
        }
      }
      state.diasLotados = lotados;
      render();
    }

    async function selecionarDia(chaveDia) {
      const dia = state.dias.find((d) => formatarDataChave(d) === chaveDia);
      if (!dia) return;
      state.diaSelecionado = dia;
      state.horario = null;
      state.carregandoHorarios = true;
      render();
      const horarios = await getHorariosDisponiveisSafe(dia);
      state.horariosDisponiveis = horarios || [];
      state.carregandoHorarios = false;
      render();
    }

    function toggleTipo(label) {
      if (state.tiposSelecionados.includes(label)) {
        state.tiposSelecionados = state.tiposSelecionados.filter((item) => item !== label);
      } else {
        state.tiposSelecionados.push(label);
      }
      render();
    }

    async function processarArquivos(files) {
      if (!files || files.length === 0) return;
      const restantes = 5 - state.fotos.length;
      const selecionados = Array.from(files).slice(0, restantes);
      try {
        const imagens = await Promise.all(
          selecionados.map(async function (file) {
            const uri = await lerArquivoComoDataUrl(file);
            return { uri, nome: file.name || "foto" };
          })
        );
        state.fotos.push(...imagens);
        render();
      } catch (error) {
        window.showAppAlert("Erro ❄\nNão foi possível processar uma das imagens.");
      }
    }

    async function removerFoto(index) {
      const ok = await window.showAppConfirm("Deseja remover esta foto?");
      if (!ok) return;
      const foto = state.fotos[index];
      state.fotos = state.fotos.filter((_, i) => i !== index);
      if (state.fotoExpandida === foto?.uri) state.fotoExpandida = null;
      render();
    }

    async function handleAbrirChamado() {
      const todosTipos = [...state.tiposSelecionados];
      if (state.mostrarOutro && state.outroTipo.trim()) {
        todosTipos.push(state.outroTipo.trim());
      }

      if (todosTipos.length === 0) {
        window.showAppAlert("Atenção ❄\nSelecione ao menos um tipo de problema.");
        return;
      }
      if (!state.endereco.trim()) {
        window.showAppAlert("Atenção ❄\nInforme o endereço.");
        return;
      }
      if (!state.diaSelecionado || !state.horario) {
        window.showAppAlert("Atenção ❄\nSelecione o dia e horário.");
        return;
      }

      state.carregando = true;
      render();

      const agora = new Date();
      const dataAbertura = agora.toLocaleDateString("pt-BR");
      const horaAbertura = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const chamado = {
        numero: gerarNumeroChamado(),
        tipos: todosTipos,
        endereco: state.endereco.trim(),
        dataFormatada: formatarData(state.diaSelecionado),
        dataChave: formatarDataChave(state.diaSelecionado),
        horario: state.horario,
        detalhes: state.detalhes,
        fotos: state.fotos.map((f) => f.uri),
        status: "Aguardando técnico",
        urgencia: "Normal",
        cliente: usuarioLogado.nome,
        clienteEmail: usuarioLogado.email,
        clienteTelefone: usuarioLogado.telefone || "",
        observacaoTecnica: "",
        tecnico: "",
        dataAbertura,
        horaAbertura,
        dataCriacao: `${dataAbertura} às ${horaAbertura}`,
        criadoPorAdmin: false,
        historicoStatus: [
          {
            status: "Aguardando técnico",
            data: dataAbertura,
            hora: horaAbertura,
          },
        ],
      };

      try {
        await salvarChamadoSafe(chamado);
        state.carregando = false;
        render();
        window.showAppAlert('Chamado aberto! ❄\nSeu chamado foi enviado. Acompanhe em "Acompanhar Chamado".');
        if (props && typeof props.setTela === "function") props.setTela("acompanharChamado");
      } catch (error) {
        state.carregando = false;
        render();
        window.showAppAlert(
          "Erro\nNão foi possível confirmar o chamado no Firestore após 2 minutos. Nada foi salvo apenas local."
        );
      }
    }

    function renderTipos() {
      return TIPOS.map((tipo) => {
        const selected = state.tiposSelecionados.includes(tipo.label);
        return `
          <button class="ab-tipo-btn${selected ? " is-selected" : ""}" data-action="tipo" data-label="${escapeHtml(tipo.label)}" type="button">
            <div class="ab-tipo-icon">${tipo.icone}</div>
            <div class="ab-tipo-label">${escapeHtml(tipo.label)}</div>
            ${selected ? '<div class="ab-tipo-check">✓</div>' : ""}
          </button>
        `;
      }).join("");
    }

    function renderDias() {
      return state.dias.map((dia) => {
        const chave = formatarDataChave(dia);
        const lotado = !!state.diasLotados[chave];
        const selected = state.diaSelecionado && formatarDataChave(state.diaSelecionado) === chave;
        const sabado = isSabado(dia);
        return `
          <button class="ab-dia-btn${selected ? " is-selected" : ""}${lotado ? " is-lotado" : ""}" data-action="dia" data-chave="${chave}" type="button" ${lotado ? "disabled" : ""}>
            <div class="ab-dia-semana${sabado ? " is-sabado" : ""}">
              ${dia.toLocaleDateString("pt-BR", { weekday: "short" })}
            </div>
            <div class="ab-dia-num">${dia.getDate()}</div>
            <div class="ab-dia-mes">${dia.toLocaleDateString("pt-BR", { month: "short" })}</div>
            ${lotado ? '<div class="ab-dia-lotado">Lotado</div>' : ""}
          </button>
        `;
      }).join("");
    }

    function renderHorarios() {
      if (!state.diaSelecionado) return "";
      if (state.carregandoHorarios) {
        return `
          <div class="ab-horarios-wrap">
            <p class="ch-sub">Horários disponíveis</p>
            <div class="ch-spinner"></div>
          </div>
        `;
      }
      if (state.horariosDisponiveis.length === 0) {
        return `
          <div class="ab-horarios-wrap">
            <p class="ch-sub">Horários disponíveis</p>
            <p class="ac-muted">❄ Nenhum horário disponível</p>
          </div>
        `;
      }
      return `
        <div class="ab-horarios-wrap">
          <p class="ch-sub">Horários disponíveis</p>
          ${state.horariosDisponiveis.map((h) => {
            const selected = state.horario === h;
            return `
              <button class="ab-horario-btn${selected ? " is-selected" : ""}" data-action="horario" data-horario="${escapeHtml(h)}" type="button">
                <span>🕐</span>
                <span class="ab-horario-label">${escapeHtml(h)}</span>
                ${selected ? '<span class="ab-horario-check">✓</span>' : ""}
              </button>
            `;
          }).join("")}
        </div>
      `;
    }

    function renderFotos() {
      const count = state.fotos.length;
      const countClass = count >= 5 ? "ab-fotos-count is-limit" : "ab-fotos-count";
      return `
        <div class="ab-fotos-header">
          <h3 class="ch-title">Fotos do equipamento</h3>
          <span class="${countClass}">${count}/5</span>
        </div>
        <p class="ch-sub">Opcional — máximo 5 fotos</p>

        ${count > 0 ? `
          <div class="ab-fotos-grid">
            ${state.fotos.map((foto, index) => `
              <div class="ab-foto-item">
                <img class="ab-foto-thumb" data-action="expandir-foto" data-index="${index}" src="${foto.uri}" alt="Foto ${index + 1}" />
                <span class="ab-foto-zoom">🔍</span>
                <button class="ab-foto-remove" data-action="remover-foto" data-index="${index}" type="button">✕</button>
              </div>
            `).join("")}
          </div>
        ` : ""}

        ${count < 5 ? `
          <div class="ab-foto-picker-row">
            <button class="ab-foto-picker-btn" data-action="abrir-camera" type="button">📷 Tirar foto</button>
            <button class="ab-foto-picker-btn" data-action="abrir-galeria" type="button">🖼️ Galeria</button>
          </div>
          <button class="ab-foto-add${count === 0 ? " is-empty" : ""}" data-action="abrir-galeria" type="button">
            <div class="ab-foto-add-icon">📷</div>
            <div>${count > 0 ? `Adicionar mais (${5 - count} restante${5 - count > 1 ? "s" : ""})` : "Toque para adicionar foto"}</div>
            ${count === 0 ? '<div class="ab-foto-add-sub">Câmera ou galeria</div>' : ""}
          </button>
          <input id="ab-input-galeria" type="file" accept="image/*" style="display:none" />
          <input id="ab-input-camera" type="file" accept="image/*" capture="environment" style="display:none" />
        ` : ""}
      `;
    }

    function renderModalFoto() {
      if (!state.fotoExpandida) return "";
      return `
        <div class="ch-modal" id="ab-modal-foto">
          <img class="ch-modal-img" src="${state.fotoExpandida}" alt="Foto ampliada" />
          ${state.fotos.length > 1 ? `
            <div class="ch-modal-thumbs">
              ${state.fotos.map((foto, i) => `
                <img
                  class="ch-modal-thumb${state.fotoExpandida === foto.uri ? " is-selected" : ""}"
                  src="${foto.uri}"
                  data-action="modal-thumb"
                  data-index="${i}"
                  alt="Miniatura ${i + 1}"
                />
              `).join("")}
            </div>
          ` : ""}
          <p class="ch-modal-close">Toque para fechar</p>
        </div>
      `;
    }

    function bindEvents() {
      root.querySelector("#ab-voltar").addEventListener("click", function () {
        if (props && typeof props.setTela === "function") props.setTela("principal");
      });

      root.querySelector("#ab-abrir-chamado").addEventListener("click", handleAbrirChamado);

      root.querySelector("#ab-container").addEventListener("click", function (event) {
        const btn = event.target.closest("button, img");
        if (!btn) return;
        const action = btn.dataset.action;
        if (!action) return;

        if (action === "tipo") {
          toggleTipo(btn.dataset.label);
          return;
        }
        if (action === "toggle-outro") {
          state.mostrarOutro = !state.mostrarOutro;
          render();
          return;
        }
        if (action === "toggle-endereco") {
          state.editandoEndereco = !state.editandoEndereco;
          render();
          return;
        }
        if (action === "dia") {
          selecionarDia(btn.dataset.chave);
          return;
        }
        if (action === "horario") {
          state.horario = btn.dataset.horario;
          render();
          return;
        }
        if (action === "abrir-galeria") {
          const input = root.querySelector("#ab-input-galeria");
          if (input) input.click();
          return;
        }
        if (action === "abrir-camera") {
          const input = root.querySelector("#ab-input-camera");
          if (input) input.click();
          return;
        }
        if (action === "remover-foto") {
          removerFoto(Number(btn.dataset.index));
          return;
        }
        if (action === "expandir-foto") {
          state.fotoExpandida = state.fotos[Number(btn.dataset.index)]?.uri || null;
          render();
          return;
        }
        if (action === "modal-thumb") {
          const foto = state.fotos[Number(btn.dataset.index)];
          if (foto) {
            state.fotoExpandida = foto.uri;
            render();
          }
          return;
        }
      });

      const outroInput = root.querySelector("#ab-outro");
      if (outroInput) {
        outroInput.addEventListener("input", function () {
          state.outroTipo = outroInput.value;
        });
      }

      const enderecoInput = root.querySelector("#ab-endereco");
      if (enderecoInput) {
        enderecoInput.addEventListener("input", function () {
          state.endereco = enderecoInput.value;
        });
      }

      const detalhesInput = root.querySelector("#ab-detalhes");
      if (detalhesInput) {
        detalhesInput.addEventListener("input", function () {
          state.detalhes = detalhesInput.value;
        });
      }

      const galeriaInput = root.querySelector("#ab-input-galeria");
      if (galeriaInput) {
        galeriaInput.addEventListener("change", function () {
          processarArquivos(galeriaInput.files);
          galeriaInput.value = "";
        });
      }

      const cameraInput = root.querySelector("#ab-input-camera");
      if (cameraInput) {
        cameraInput.addEventListener("change", function () {
          processarArquivos(cameraInput.files);
          cameraInput.value = "";
        });
      }

      const modal = root.querySelector("#ab-modal-foto");
      if (modal) {
        modal.addEventListener("click", function () {
          state.fotoExpandida = null;
          render();
        });
      }
    }

    function render() {
      root.innerHTML = `
        <section class="ab-screen">
          <div class="ab-fundos" id="ab-fundos"></div>
          <div class="ab-scroll" id="ab-container">
            <header class="ch-header">
              <div>
                <span class="ch-header-empresa">Klenio Refrigeração</span>
                <h1 class="ch-header-nome">Abrir Chamado</h1>
              </div>
              <button class="ch-voltar" id="ab-voltar" type="button">← Voltar</button>
            </header>

            <article class="ch-card">
              <h2 class="ch-title">Tipo de problema <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Pode selecionar mais de um</p>
              <div class="ab-tipos-grid">
                ${renderTipos()}
                <button class="ab-tipo-btn${state.mostrarOutro ? " is-selected" : ""}" data-action="toggle-outro" type="button">
                  <div class="ab-tipo-icon">📝</div>
                  <div class="ab-tipo-label">Outro</div>
                  ${state.mostrarOutro ? '<div class="ab-tipo-check">✓</div>' : ""}
                </button>
              </div>
              ${state.mostrarOutro ? `
                <div class="ch-input-wrap" style="margin-top:14px">
                  <span class="ch-input-icon">📝</span>
                  <input id="ab-outro" class="ch-input" value="${escapeHtml(state.outroTipo)}" placeholder="Descreva o problema" />
                </div>
              ` : ""}
            </article>

            <article class="ch-card">
              <div class="ab-endereco-row">
                <h2 class="ch-title">Endereço <span style="color:#e74c3c">*</span></h2>
                <button class="ab-edit-btn" data-action="toggle-endereco" type="button">
                  ${state.editandoEndereco ? "✓ Confirmar" : "✏️ Editar"}
                </button>
              </div>
              ${state.editandoEndereco ? `
                <div class="ch-input-wrap" style="margin-top:12px">
                  <span class="ch-input-icon">📍</span>
                  <input id="ab-endereco" class="ch-input" value="${escapeHtml(state.endereco)}" />
                </div>
              ` : `
                <div class="ab-endereco-view">
                  <span>📍</span>
                  <span class="ac-info-text" style="flex:1">${escapeHtml(state.endereco)}</span>
                </div>
              `}
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Dia do atendimento <span style="color:#e74c3c">*</span></h2>
              <p class="ch-sub">Selecione um dos próximos 7 dias</p>
              <div class="ab-dias-scroll">
                ${renderDias()}
              </div>
              ${renderHorarios()}
            </article>

            <article class="ch-card">
              ${renderFotos()}
            </article>

            <article class="ch-card">
              <h2 class="ch-title">Detalhes adicionais</h2>
              <p class="ch-sub">Opcional</p>
              <textarea id="ab-detalhes" class="ch-textarea" placeholder="Descreva melhor o problema...">${escapeHtml(state.detalhes)}</textarea>
            </article>

            <button class="ch-btn-main" id="ab-abrir-chamado" type="button" ${state.carregando ? "disabled" : ""}>
              ${
                state.carregando
                  ? '<span class="ch-btn-inline-loading"><span class="ch-spinner"></span><span>Abrindo chamado...</span></span>'
                  : "🔧 Abrir Chamado"
              }
            </button>

            <div style="height:20px"></div>
          </div>

          ${renderModalFoto()}
        </section>
      `;

      const fundos = root.querySelector("#ab-fundos");
      criarFlocosFundo(fundos, "ab");
      bindEvents();
    }

    render();
    verificarDiasLotados();

    return function cleanupAbrirChamado() {
      // sem cleanup necessário: imagens são salvas como data URL
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.abrirChamado = renderTelaAbrirChamado;
})();
