// js/screens/TelaInicial.js

(function () {
  const MAX_NIVEL = 10;
  const FLOCOS_POR_NIVEL = 8;
  const STORAGE_KEY = "@flocos_nivel";
  const TEMP_MIN = 17;
  const TEMP_MAX = 29;
  const TEMP_NEUTRA = 22;
  const TOTAL_FLOCOS_MAX = 42;
  const TEMP_GOTA = 24;
  const AI_FEED_MAX = 4;

  function getFlocosVisiveis(temp) {
    if (temp <= 17) return 42;
    if (temp === 18) return 36;
    if (temp === 19) return 28;
    if (temp === 20) return 22;
    if (temp === 21) return 16;
    if (temp === 22) return 10;
    if (temp === 23) return 6;
    if (temp === 24) return 3;
    if (temp === 25) return 1;
    if (temp === 26) return 12;
    if (temp === 27) return 22;
    if (temp === 28) return 34;
    return 42;
  }

  function getCorTemp(temp) {
    if (temp <= 18) return "#38b6ff";
    if (temp <= 22) return "#27ae60";
    if (temp <= 25) return "#f39c12";
    return "#e74c3c";
  }

  function getDescTemp(temp) {
    if (temp <= 17) return "Congelante ❄❄❄";
    if (temp <= 19) return "Muito frio ❄❄";
    if (temp <= 22) return "Frio ❄";
    if (temp <= 24) return "Ameno 🌤️";
    if (temp <= 25) return "Quente 🌡️";
    if (temp <= 27) return "Muito quente 🔥";
    return "Derretendo! 💧🔥";
  }

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function getIndicadoresIA(temp, nivel) {
    const desvio = Math.abs(temp - TEMP_NEUTRA);
    const eficiencia = clamp(Math.round(100 - desvio * 9 - nivel * 1.2), 12, 99);
    const risco = clamp(Math.round(desvio * 17 + nivel * 3), 1, 99);
    const conforto = clamp(Math.round(100 - desvio * 12), 5, 98);
    const predicao =
      temp <= 20
        ? "Resfriamento intenso"
        : temp <= 23
          ? "Faixa ideal"
          : temp <= 26
            ? "Calor moderado"
            : "Sobrecarga térmica";

    return { eficiencia, risco, conforto, predicao };
  }

  function gerarMensagemIA(temp, nivel, indicadores) {
    if (temp <= 20) return `Criogênese ativa em ${indicadores.eficiencia}% • Camada fria L${nivel || 1}`;
    if (temp <= 23) return `Zona ideal detectada • Conforto ${indicadores.conforto}% • Risco mínimo`;
    if (temp <= 26) return `Compensação térmica iniciada • Ajuste de fluxo em tempo real`;
    return `Alerta térmico: risco ${indicadores.risco}% • Recomendado reduzir temperatura`;
  }

  function gerarTodosFlocos() {
    const largura = window.innerWidth || 390;
    return Array.from({ length: TOTAL_FLOCOS_MAX }, (_, i) => {
      const profundidade = Math.random();
      return {
        id: `f${i}`,
        x: Math.random() * largura,
        size:
          profundidade < 0.33
            ? Math.random() * 6 + 7
            : profundidade < 0.66
              ? Math.random() * 8 + 13
              : Math.random() * 8 + 20,
        opacidadeAlvo:
          profundidade < 0.33
            ? 0.15 + Math.random() * 0.2
            : profundidade < 0.66
              ? 0.35 + Math.random() * 0.3
              : 0.65 + Math.random() * 0.3,
        delay: Math.random() * 3000,
      };
    });
  }

  function gerarFlocosFixos(nivel) {
    if (nivel <= 0) return [];
    const largura = window.innerWidth || 390;
    const altura = window.innerHeight || 844;
    const total = nivel * FLOCOS_POR_NIVEL;
    const cols = Math.ceil(Math.sqrt(total * (largura / altura)));
    const rows = Math.ceil(total / cols);
    const cw = largura / cols;
    const ch = altura / rows;

    return Array.from({ length: total }, (_, i) => {
      const p = Math.random();
      return {
        id: `fix${i}`,
        x: (i % cols) * cw + Math.random() * cw * 0.8,
        y: Math.floor(i / cols) * ch + Math.random() * ch * 0.8,
        size:
          p < 0.4
            ? Math.random() * 6 + 5
            : p < 0.75
              ? Math.random() * 5 + 10
              : Math.random() * 6 + 16,
        opacidade:
          p < 0.4
            ? 0.12 + Math.random() * 0.15
            : p < 0.75
              ? 0.25 + Math.random() * 0.25
              : 0.5 + Math.random() * 0.3,
        cor:
          i % 6 === 0
            ? "rgba(180,220,255,0.9)"
            : `rgba(56,182,255,${0.4 + Math.random() * 0.6})`,
        delay: Math.random() * 800,
      };
    });
  }

  function renderTelaInicial(root, props) {
    const state = {
      nivel: 0,
      temperatura: TEMP_NEUTRA,
      flocosFixos: [],
      todosFlocos: gerarTodosFlocos(),
      fallingNodes: [],
      waveBars: [],
      aiFeed: [],
      aiInterval: null,
      waveInterval: null,
    };

    root.innerHTML = `
      <section class="ti-root" id="ti-root">
        <div class="ti-layer" id="ti-falling-layer"></div>
        <div class="ti-layer" id="ti-fixed-layer"></div>
        <div class="ti-grid-overlay"></div>
        <div class="ti-orb ti-orb-a"></div>
        <div class="ti-orb ti-orb-b"></div>
        <div class="ti-scanline"></div>

        <div class="ti-content">
          <div class="ti-temp-card" id="ti-temp-card">
            <div class="ti-temp-value" id="ti-temp-value"></div>
            <div class="ti-temp-desc" id="ti-temp-desc"></div>
          </div>

          <div class="ti-bar-wrap">
            <div class="ti-bar">
              <div class="ti-bar-fill" id="ti-bar-fill"></div>
            </div>
            <div class="ti-bar-labels">
              <span style="color:#38b6ff">17°</span>
              <span style="color:#f39c12">23°</span>
              <span style="color:#e74c3c">29°</span>
            </div>
          </div>

          <div class="ti-controls">
            <button class="ti-temp-btn" id="ti-btn-minus" type="button"><span>−</span></button>

            <div class="ti-logo-wrap" id="ti-logo-wrap">
              <div class="ti-hud-ring ring-1"></div>
              <div class="ti-hud-ring ring-2"></div>
              <div class="ti-hud-ring ring-3"></div>
              <div class="ti-logo-glow"></div>
              <div class="ti-logo-border" id="ti-logo-border"></div>
              <button class="ti-logo-btn" id="ti-logo-btn" type="button">
                <span id="ti-logo-symbol">❄</span>
              </button>
            </div>

            <button class="ti-temp-btn is-hot" id="ti-btn-plus" type="button"><span>+</span></button>
          </div>

          <p class="ti-title" id="ti-title">Klenio Refrigeração</p>
          <div class="ti-line" id="ti-line"></div>
          <p class="ti-sub" id="ti-sub">GESTÃO DE REFRIGERAÇÃO</p>

          <div class="ti-ai-panel">
            <div class="ti-ai-head">
              <span>NÚCLEO IA</span>
              <span class="ti-ai-live">● online</span>
            </div>
            <div class="ti-ai-wave" id="ti-ai-wave"></div>
            <div class="ti-ai-grid">
              <div class="ti-ai-cell">
                <span>Predição</span>
                <strong id="ti-ai-predicao"></strong>
              </div>
              <div class="ti-ai-cell">
                <span>Eficiência</span>
                <strong id="ti-ai-eficiencia"></strong>
              </div>
              <div class="ti-ai-cell">
                <span>Risco térmico</span>
                <strong id="ti-ai-risco"></strong>
              </div>
              <div class="ti-ai-cell">
                <span>Conforto</span>
                <strong id="ti-ai-conforto"></strong>
              </div>
            </div>
            <div class="ti-ai-stream" id="ti-ai-stream"></div>
          </div>

          <div class="ti-actions">
            <button class="ti-action-btn" id="ti-btn-entrar" type="button">❄ Entrar</button>
            <button class="ti-action-btn secondary" id="ti-btn-cadastro" type="button">✨ Criar minha conta</button>
            <button class="ti-admin-link" id="ti-btn-admin" type="button">Acesso administrativo →</button>
          </div>
        </div>
      </section>
    `;

    const rootEl = root.querySelector("#ti-root");
    const fallingLayer = root.querySelector("#ti-falling-layer");
    const fixedLayer = root.querySelector("#ti-fixed-layer");
    const tempCard = root.querySelector("#ti-temp-card");
    const tempValue = root.querySelector("#ti-temp-value");
    const tempDesc = root.querySelector("#ti-temp-desc");
    const barFill = root.querySelector("#ti-bar-fill");
    const btnMinus = root.querySelector("#ti-btn-minus");
    const btnPlus = root.querySelector("#ti-btn-plus");
    const logoWrap = root.querySelector("#ti-logo-wrap");
    const logoBorder = root.querySelector("#ti-logo-border");
    const logoSymbol = root.querySelector("#ti-logo-symbol");
    const btnEntrar = root.querySelector("#ti-btn-entrar");
    const btnCadastro = root.querySelector("#ti-btn-cadastro");
    const btnAdmin = root.querySelector("#ti-btn-admin");
    const titleEl = root.querySelector("#ti-title");
    const lineEl = root.querySelector("#ti-line");
    const subEl = root.querySelector("#ti-sub");
    const aiPredicaoEl = root.querySelector("#ti-ai-predicao");
    const aiEficienciaEl = root.querySelector("#ti-ai-eficiencia");
    const aiRiscoEl = root.querySelector("#ti-ai-risco");
    const aiConfortoEl = root.querySelector("#ti-ai-conforto");
    const aiWaveEl = root.querySelector("#ti-ai-wave");
    const aiStreamEl = root.querySelector("#ti-ai-stream");

    function renderAiFeed() {
      aiStreamEl.innerHTML = state.aiFeed.map((msg) => `<p>› ${msg}</p>`).join("");
    }

    function pushAiMensagem(msg) {
      state.aiFeed.unshift(msg);
      state.aiFeed = state.aiFeed.slice(0, AI_FEED_MAX);
      renderAiFeed();
    }

    function inicializarAiWave() {
      aiWaveEl.innerHTML = Array.from({ length: 20 }, () => '<span class="ti-wave-bar"></span>').join("");
      state.waveBars = Array.from(aiWaveEl.querySelectorAll(".ti-wave-bar"));
    }

    function atualizarAiWave() {
      const energiaTemp = ((state.temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 40;
      const energiaNivel = (state.nivel / MAX_NIVEL) * 34;
      state.waveBars.forEach((bar, index) => {
        const oscilacao = ((Math.sin(Date.now() / 420 + index * 0.55) + 1) / 2) * 35;
        const ruído = Math.random() * 8;
        const altura = clamp(14 + oscilacao + energiaTemp + energiaNivel + ruído, 14, 100);
        bar.style.setProperty("--h", `${altura}%`);
        bar.style.animationDuration = `${0.72 + Math.random() * 1.2}s`;
      });
    }

    function atualizarParallax(clientX, clientY) {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      const x = ((clientX / w) - 0.5) * 2;
      const y = ((clientY / h) - 0.5) * 2;
      rootEl.style.setProperty("--mx", `${x.toFixed(3)}`);
      rootEl.style.setProperty("--my", `${y.toFixed(3)}`);
    }

    function salvarNivel(nivel) {
      try {
        localStorage.setItem(STORAGE_KEY, String(nivel));
      } catch (error) {}
    }

    function carregarNivelSalvo() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return 0;
        const nivel = Number.parseInt(saved, 10);
        if (nivel > 0 && nivel <= MAX_NIVEL) return nivel;
      } catch (error) {}
      return 0;
    }

    function animarTemperatura() {
      tempCard.classList.remove("pulse");
      void tempCard.offsetWidth;
      tempCard.classList.add("pulse");
    }

    function criarFallingNodes() {
      fallingLayer.innerHTML = "";
      state.fallingNodes = [];
      state.todosFlocos.forEach((flake) => {
        const el = document.createElement("span");
        el.className = "ti-fall";
        el.textContent = "❄";
        el.style.setProperty("--x", `${flake.x}px`);
        el.style.setProperty("--size", `${flake.size}px`);
        el.style.setProperty("--delay", `${flake.delay}ms`);
        fallingLayer.appendChild(el);
        state.fallingNodes.push({ el, flake });
      });
    }

    function renderFixed() {
      fixedLayer.innerHTML = "";
      const eGota = state.temperatura > TEMP_GOTA;

      state.flocosFixos.forEach((flake) => {
        const el = document.createElement("span");
        el.className = `ti-fixed${eGota ? " is-drop" : ""}`;
        el.textContent = eGota ? "💧" : "❄";
        el.style.setProperty("--x", `${flake.x}px`);
        el.style.setProperty("--y", `${flake.y}px`);
        el.style.setProperty("--size", `${eGota ? flake.size * 0.85 : flake.size}px`);
        el.style.setProperty("--opacity", String(flake.opacidade));
        el.style.setProperty("--delay", `${flake.delay}ms`);
        el.style.setProperty("--float-dur", `${2000 + Math.random() * 1500}ms`);
        el.style.setProperty("--color", eGota ? `rgba(100,180,255,${flake.opacidade})` : flake.cor);
        fixedLayer.appendChild(el);
      });
    }

    function atualizarFlocosCaindo() {
      const eGota = state.temperatura > TEMP_GOTA;
      const visiveis = getFlocosVisiveis(state.temperatura);

      state.fallingNodes.forEach(({ el, flake }, index) => {
        const duration = eGota
          ? 1500 + Math.random() * 1500
          : 5000 + Math.random() * 5000;
        const drift = eGota
          ? (Math.random() * 4 + 2) * (Math.random() > 0.5 ? 1 : -1)
          : (Math.random() * 20 + 10) * (Math.random() > 0.5 ? 1 : -1);

        el.classList.toggle("is-drop", eGota);
        el.textContent = eGota ? "💧" : "❄";
        el.style.setProperty("--dur", `${duration}ms`);
        el.style.setProperty("--drift", `${drift}px`);
        el.style.color = eGota
          ? `rgba(100,180,255,${flake.opacidadeAlvo})`
          : `rgba(56,182,255,${0.4 + flake.opacidadeAlvo * 0.6})`;
        el.style.fontSize = `${eGota ? flake.size * 0.8 : flake.size}px`;
        el.style.opacity = index < visiveis ? String(flake.opacidadeAlvo) : "0";
      });
    }

    function updateUI() {
      const eGota = state.temperatura > TEMP_GOTA;
      const corTemp = getCorTemp(state.temperatura);
      const borderRatio = state.nivel / MAX_NIVEL;
      const indicadores = getIndicadoresIA(state.temperatura, state.nivel);

      rootEl.classList.toggle("is-drop-mode", eGota);
      rootEl.style.setProperty("--ti-accent", eGota ? "#64b4ff" : "#38b6ff");
      rootEl.style.setProperty("--ti-accent-soft", eGota ? "rgba(100,180,255,0.28)" : "rgba(56,182,255,0.25)");
      tempValue.textContent = `${state.temperatura}°C`;
      tempDesc.textContent = getDescTemp(state.temperatura);
      tempValue.style.color = corTemp;
      tempDesc.style.color = `${corTemp}cc`;
      tempCard.style.borderColor = `${corTemp}55`;
      tempCard.style.backgroundColor = `${corTemp}18`;
      barFill.style.width = `${((state.temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100}%`;
      barFill.style.backgroundColor = corTemp;

      const logoColor = eGota ? "#64b4ff" : "#38b6ff";
      logoSymbol.textContent = eGota ? "💧" : "❄";
      logoSymbol.style.color = logoColor;
      btnEntrar.textContent = `${eGota ? "💧" : "❄"} Entrar`;
      titleEl.style.textShadow = `0 0 12px ${eGota ? "rgba(100,180,255,0.5)" : "rgba(56,182,255,0.5)"}`;
      lineEl.style.background = eGota ? "rgba(100,180,255,0.35)" : "rgba(56,182,255,0.35)";
      subEl.style.color = eGota ? "rgba(100,180,255,0.65)" : "rgba(56,182,255,0.65)";
      aiPredicaoEl.textContent = indicadores.predicao;
      aiEficienciaEl.textContent = `${indicadores.eficiencia}%`;
      aiRiscoEl.textContent = `${indicadores.risco}%`;
      aiConfortoEl.textContent = `${indicadores.conforto}%`;
      pushAiMensagem(gerarMensagemIA(state.temperatura, state.nivel, indicadores));

      logoBorder.style.borderColor = eGota
        ? `rgba(100,180,255,${0.1 + borderRatio * 0.5})`
        : `rgba(56,182,255,${0.1 + borderRatio * 0.5})`;

      btnMinus.disabled = state.temperatura <= TEMP_MIN;
      btnPlus.disabled = state.temperatura >= TEMP_MAX;
      btnMinus.querySelector("span").style.color = btnMinus.disabled
        ? "rgba(255,255,255,0.15)"
        : "#38b6ff";
      btnPlus.querySelector("span").style.color = btnPlus.disabled
        ? "rgba(255,255,255,0.15)"
        : "#e74c3c";

      atualizarFlocosCaindo();
      renderFixed();
      atualizarAiWave();
    }

    function handleLogoPress() {
      logoWrap.classList.remove("anim");
      void logoWrap.offsetWidth;
      logoWrap.classList.add("anim");
      setTimeout(() => logoWrap.classList.remove("anim"), 620);

      state.nivel = state.nivel >= MAX_NIVEL ? 1 : state.nivel + 1;
      salvarNivel(state.nivel);
      state.flocosFixos = gerarFlocosFixos(state.nivel);
      updateUI();
    }

    btnMinus.addEventListener("click", () => {
      if (state.temperatura <= TEMP_MIN) return;
      state.temperatura -= 1;
      animarTemperatura();
      updateUI();
    });

    btnPlus.addEventListener("click", () => {
      if (state.temperatura >= TEMP_MAX) return;
      state.temperatura += 1;
      animarTemperatura();
      updateUI();
    });

    root.querySelector("#ti-logo-btn").addEventListener("click", handleLogoPress);

    btnEntrar.addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    });

    btnCadastro.addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("cadastro");
    });

    btnAdmin.addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("loginAdmin");
    });

    rootEl.addEventListener("mousemove", (event) => {
      atualizarParallax(event.clientX, event.clientY);
    });

    rootEl.addEventListener(
      "touchmove",
      (event) => {
        if (!event.touches || !event.touches[0]) return;
        atualizarParallax(event.touches[0].clientX, event.touches[0].clientY);
      },
      { passive: true }
    );

    rootEl.addEventListener("mouseleave", () => {
      rootEl.style.setProperty("--mx", "0");
      rootEl.style.setProperty("--my", "0");
    });

    state.nivel = carregarNivelSalvo();
    state.flocosFixos = gerarFlocosFixos(state.nivel);
    criarFallingNodes();
    inicializarAiWave();
    state.waveInterval = window.setInterval(atualizarAiWave, 860);
    state.aiInterval = window.setInterval(() => {
      const indicadores = getIndicadoresIA(state.temperatura, state.nivel);
      pushAiMensagem(gerarMensagemIA(state.temperatura, state.nivel, indicadores));
    }, 2600);
    updateUI();

    return function cleanupTelaInicial() {
      if (state.waveInterval) window.clearInterval(state.waveInterval);
      if (state.aiInterval) window.clearInterval(state.aiInterval);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.inicial = renderTelaInicial;
})();
