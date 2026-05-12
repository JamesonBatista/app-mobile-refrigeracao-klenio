// js/screens/TelaInicial.js

(function () {
  const STORAGE_KEY = "@flocos_nivel";
  const TEMP_MIN = 17;
  const TEMP_MAX = 29;
  const TEMP_NEUTRA = 22;
  const MAX_NIVEL = 10;
  const AI_FEED_MAX = 5;

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function temperaturaParaCor(temp) {
    if (temp <= 18) return "#58d2ff";
    if (temp <= 22) return "#36e39f";
    if (temp <= 25) return "#ffd65b";
    return "#ff5f6d";
  }

  function temperaturaParaTexto(temp) {
    if (temp <= 17) return "Criogenia extrema";
    if (temp <= 19) return "Fase polar";
    if (temp <= 22) return "Zona ideal";
    if (temp <= 24) return "Transicao termica";
    if (temp <= 26) return "Aquecimento moderado";
    return "Risco de sobrecarga";
  }

  function gerarIndicadores(temp, nivel) {
    const desvio = Math.abs(temp - TEMP_NEUTRA);
    const eficiencia = clamp(Math.round(100 - desvio * 8 - nivel * 1.3), 11, 99);
    const risco = clamp(Math.round(desvio * 19 + nivel * 3), 1, 99);
    const conforto = clamp(Math.round(100 - desvio * 12), 3, 98);
    const predicao =
      temp <= 20
        ? "Resfriamento agressivo"
        : temp <= 23
          ? "Estabilidade total"
          : temp <= 26
            ? "Compensacao em curso"
            : "Pressao termica elevada";

    return { eficiencia, risco, conforto, predicao };
  }

  function carregarNivelSalvo() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return 0;
      const parsed = Number.parseInt(raw, 10);
      if (Number.isNaN(parsed)) return 0;
      return clamp(parsed, 0, MAX_NIVEL);
    } catch (error) {
      return 0;
    }
  }

  function salvarNivel(nivel) {
    try {
      localStorage.setItem(STORAGE_KEY, String(clamp(nivel, 0, MAX_NIVEL)));
    } catch (error) {}
  }

  function renderTelaInicial(root, props) {
    const state = {
      temperatura: TEMP_NEUTRA,
      nivel: carregarNivelSalvo(),
      feed: [],
      waveBars: [],
      intervals: [],
      rafId: null,
      stars: [],
      destroyed: false,
    };

    root.innerHTML = `
      <section class="nx-root" id="nx-root">
        <canvas class="nx-canvas" id="nx-stars"></canvas>
        <div class="nx-grid"></div>
        <div class="nx-glow nx-glow-a"></div>
        <div class="nx-glow nx-glow-b"></div>

        <div class="nx-shell" id="nx-shell">
          <header class="nx-topline">
            <span class="nx-chip">NEURAL CLIMATE OS</span>
            <span class="nx-clock" id="nx-clock"></span>
          </header>

          <div class="nx-temp-card" id="nx-temp-card">
            <div class="nx-temp-value" id="nx-temp-value"></div>
            <div class="nx-temp-desc" id="nx-temp-desc"></div>
          </div>

          <div class="nx-spectrum">
            <div class="nx-spectrum-track">
              <div class="nx-spectrum-fill" id="nx-spectrum-fill"></div>
            </div>
            <div class="nx-spectrum-labels">
              <span>17°</span>
              <span>23°</span>
              <span>29°</span>
            </div>
          </div>

          <div class="nx-reactor-row">
            <button class="nx-step" id="nx-minus" type="button">-</button>

            <button class="nx-reactor" id="nx-reactor" type="button">
              <span class="nx-ring nx-ring-1"></span>
              <span class="nx-ring nx-ring-2"></span>
              <span class="nx-ring nx-ring-3"></span>
              <span class="nx-reactor-symbol" id="nx-reactor-symbol">❄</span>
            </button>

            <button class="nx-step is-hot" id="nx-plus" type="button">+</button>
          </div>

          <h1 class="nx-title">Klenio Refrigeração</h1>
          <p class="nx-subtitle">CYBER THERMAL COMMAND INTERFACE</p>

          <section class="nx-ai-panel">
            <header class="nx-ai-head">
              <span>Nucleo IA em tempo real</span>
              <span class="nx-live">ONLINE</span>
            </header>

            <div class="nx-wave" id="nx-wave"></div>

            <div class="nx-metrics">
              <article><span>Predicao</span><strong id="nx-predicao"></strong></article>
              <article><span>Eficiencia</span><strong id="nx-eficiencia"></strong></article>
              <article><span>Risco</span><strong id="nx-risco"></strong></article>
              <article><span>Conforto</span><strong id="nx-conforto"></strong></article>
            </div>

            <div class="nx-feed" id="nx-feed"></div>
          </section>

          <div class="nx-actions">
            <button class="nx-btn main" id="nx-entrar" type="button">Entrar no sistema</button>
            <button class="nx-btn ghost" id="nx-cadastro" type="button">Criar minha conta</button>
            <button class="nx-admin" id="nx-admin" type="button">Acesso administrativo -></button>
          </div>
        </div>
      </section>
    `;

    const rootEl = root.querySelector("#nx-root");
    const shellEl = root.querySelector("#nx-shell");
    const starsCanvas = root.querySelector("#nx-stars");
    const clockEl = root.querySelector("#nx-clock");
    const tempValueEl = root.querySelector("#nx-temp-value");
    const tempDescEl = root.querySelector("#nx-temp-desc");
    const tempCardEl = root.querySelector("#nx-temp-card");
    const spectrumFillEl = root.querySelector("#nx-spectrum-fill");
    const reactorSymbolEl = root.querySelector("#nx-reactor-symbol");
    const predicaoEl = root.querySelector("#nx-predicao");
    const eficienciaEl = root.querySelector("#nx-eficiencia");
    const riscoEl = root.querySelector("#nx-risco");
    const confortoEl = root.querySelector("#nx-conforto");
    const feedEl = root.querySelector("#nx-feed");
    const waveEl = root.querySelector("#nx-wave");

    function pushFeed(message) {
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      state.feed.unshift(`[${hora}] ${message}`);
      state.feed = state.feed.slice(0, AI_FEED_MAX);
      feedEl.innerHTML = state.feed.map((item) => `<p>${item}</p>`).join("");
    }

    function initWave() {
      waveEl.innerHTML = Array.from({ length: 24 }, () => '<span class="nx-wave-bar"></span>').join("");
      state.waveBars = Array.from(waveEl.querySelectorAll(".nx-wave-bar"));
    }

    function updateWave() {
      const energiaTermica = ((state.temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 38;
      const energiaNivel = (state.nivel / MAX_NIVEL) * 35;
      state.waveBars.forEach((bar, index) => {
        const base = ((Math.sin(Date.now() / 360 + index * 0.52) + 1) / 2) * 34;
        const noise = Math.random() * 10;
        const height = clamp(10 + base + energiaTermica + energiaNivel + noise, 12, 98);
        bar.style.setProperty("--h", `${height}%`);
        bar.style.animationDuration = `${0.65 + Math.random() * 1.3}s`;
      });
    }

    function updateParallax(clientX, clientY) {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      const x = ((clientX / w) - 0.5) * 2;
      const y = ((clientY / h) - 0.5) * 2;
      rootEl.style.setProperty("--mx", x.toFixed(3));
      rootEl.style.setProperty("--my", y.toFixed(3));
    }

    function updateClock() {
      clockEl.textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }

    function updateUI(trigger) {
      const color = temperaturaParaCor(state.temperatura);
      const ratio = (state.temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
      const indicadores = gerarIndicadores(state.temperatura, state.nivel);

      rootEl.style.setProperty("--nx-accent", color);
      rootEl.style.setProperty("--nx-accent-soft", `${color}55`);
      rootEl.style.setProperty("--nx-heat", state.temperatura > 25 ? "#ff6470" : "#5ad7ff");
      rootEl.classList.toggle("is-heat-mode", state.temperatura > 24);

      tempValueEl.textContent = `${state.temperatura}°C`;
      tempDescEl.textContent = temperaturaParaTexto(state.temperatura);
      tempCardEl.style.borderColor = `${color}88`;
      spectrumFillEl.style.width = `${ratio * 100}%`;
      spectrumFillEl.style.background = color;

      reactorSymbolEl.textContent = state.temperatura > 24 ? "💧" : "❄";
      predicaoEl.textContent = indicadores.predicao;
      eficienciaEl.textContent = `${indicadores.eficiencia}%`;
      riscoEl.textContent = `${indicadores.risco}%`;
      confortoEl.textContent = `${indicadores.conforto}%`;

      if (trigger) {
        pushFeed(`${trigger} :: ${indicadores.predicao} / risco ${indicadores.risco}%`);
      }

      updateWave();
    }

    function pulseCore() {
      shellEl.classList.remove("is-pulsing");
      void shellEl.offsetWidth;
      shellEl.classList.add("is-pulsing");
      window.setTimeout(() => shellEl.classList.remove("is-pulsing"), 650);
    }

    function setupStarfield() {
      const ctx = starsCanvas.getContext("2d");
      if (!ctx) return;

      function resize() {
        const ratio = window.devicePixelRatio || 1;
        const width = rootEl.clientWidth || window.innerWidth || 390;
        const height = rootEl.clientHeight || window.innerHeight || 844;
        starsCanvas.width = Math.floor(width * ratio);
        starsCanvas.height = Math.floor(height * ratio);
        starsCanvas.style.width = `${width}px`;
        starsCanvas.style.height = `${height}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        state.stars = Array.from({ length: 130 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.9 + 0.4,
          v: Math.random() * 0.7 + 0.2,
          tw: Math.random() * Math.PI * 2,
        }));
      }

      function frame() {
        if (state.destroyed) return;

        const width = starsCanvas.clientWidth;
        const height = starsCanvas.clientHeight;
        ctx.clearRect(0, 0, width, height);

        const boost = 0.35 + ((state.temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 0.9;
        for (let i = 0; i < state.stars.length; i += 1) {
          const star = state.stars[i];
          star.y += star.v * boost;
          star.tw += 0.03;
          if (star.y > height + 4) {
            star.y = -4;
            star.x = Math.random() * width;
          }

          const alpha = 0.2 + ((Math.sin(star.tw) + 1) / 2) * 0.7;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(140, 214, 255, ${alpha})`;
          ctx.fill();
        }

        state.rafId = window.requestAnimationFrame(frame);
      }

      resize();
      frame();
      window.addEventListener("resize", resize);
      state.intervals.push(() => window.removeEventListener("resize", resize));
    }

    function addInterval(fn, ms) {
      const id = window.setInterval(fn, ms);
      state.intervals.push(() => window.clearInterval(id));
    }

    function onMinus() {
      if (state.temperatura <= TEMP_MIN) return;
      state.temperatura -= 1;
      updateUI("temp -1");
    }

    function onPlus() {
      if (state.temperatura >= TEMP_MAX) return;
      state.temperatura += 1;
      updateUI("temp +1");
    }

    function onCore() {
      state.nivel = state.nivel >= MAX_NIVEL ? 0 : state.nivel + 1;
      salvarNivel(state.nivel);
      pulseCore();
      updateUI(`nivel IA ${state.nivel}`);
    }

    function onEntrar() {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    }

    function onCadastro() {
      if (props && typeof props.setTela === "function") props.setTela("cadastro");
    }

    function onAdmin() {
      if (props && typeof props.setTela === "function") props.setTela("loginAdmin");
    }

    function onKey(event) {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        onPlus();
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        onMinus();
      }
      if (event.key.toLowerCase() === "l") onCore();
      if (event.key === "Enter") onEntrar();
    }

    root.querySelector("#nx-minus").addEventListener("click", onMinus);
    root.querySelector("#nx-plus").addEventListener("click", onPlus);
    root.querySelector("#nx-reactor").addEventListener("click", onCore);
    root.querySelector("#nx-entrar").addEventListener("click", onEntrar);
    root.querySelector("#nx-cadastro").addEventListener("click", onCadastro);
    root.querySelector("#nx-admin").addEventListener("click", onAdmin);
    rootEl.addEventListener("mousemove", (event) => updateParallax(event.clientX, event.clientY));
    rootEl.addEventListener("mouseleave", () => {
      rootEl.style.setProperty("--mx", "0");
      rootEl.style.setProperty("--my", "0");
    });
    rootEl.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        updateParallax(touch.clientX, touch.clientY);
      },
      { passive: true }
    );
    window.addEventListener("keydown", onKey);
    state.intervals.push(() => window.removeEventListener("keydown", onKey));

    initWave();
    setupStarfield();
    updateClock();
    addInterval(updateClock, 1000);
    addInterval(updateWave, 820);
    addInterval(() => {
      const indicadores = gerarIndicadores(state.temperatura, state.nivel);
      pushFeed(`Monitor IA :: eficiencia ${indicadores.eficiencia}% / conforto ${indicadores.conforto}%`);
    }, 3200);
    updateUI("boot sequence");

    return function cleanupTelaInicial() {
      state.destroyed = true;
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      state.intervals.forEach((dispose) => {
        try {
          dispose();
        } catch (error) {}
      });
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.inicial = renderTelaInicial;
})();
