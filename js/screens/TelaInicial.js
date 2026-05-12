// js/screens/TelaInicial.js

(function () {
  const STORAGE_MODE = "@vx_mode";
  const STORAGE_POWER = "@vx_power";
  const FEED_MAX = 6;

  const MODES = {
    NOVA: {
      accent: "#67d7ff",
      accentSoft: "rgba(103, 215, 255, 0.35)",
      label: "NOVA FIELD",
      symbol: "◉",
      message: "NOVA stream synchronized",
    },
    VOID: {
      accent: "#b07bff",
      accentSoft: "rgba(176, 123, 255, 0.33)",
      label: "VOID TUNNEL",
      symbol: "◈",
      message: "VOID corridor armed",
    },
    GLITCH: {
      accent: "#ff6ea1",
      accentSoft: "rgba(255, 110, 161, 0.33)",
      label: "GLITCH PROTOCOL",
      symbol: "◎",
      message: "GLITCH anomalies released",
    },
  };

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {}
  }

  function renderTelaInicial(root, props) {
    const persistedMode = readStorage(STORAGE_MODE, "NOVA");
    const mode = MODES[persistedMode] ? persistedMode : "NOVA";
    const persistedPower = Number.parseInt(readStorage(STORAGE_POWER, "56"), 10);

    const state = {
      mode,
      power: Number.isNaN(persistedPower) ? 56 : clamp(persistedPower, 0, 100),
      feed: [],
      rafId: null,
      intervals: [],
      particles: [],
      destroyed: false,
    };

    root.innerHTML = `
      <section class="vx-root" id="vx-root">
        <canvas class="vx-canvas" id="vx-canvas"></canvas>
        <div class="vx-noise"></div>
        <div class="vx-vignette"></div>

        <div class="vx-shell" id="vx-shell">
          <header class="vx-top">
            <span class="vx-tag">OMEGA INTERFACE / NODE 13</span>
            <button class="vx-random" id="vx-random" type="button">RANDOMIZE</button>
          </header>

          <div class="vx-core-wrap">
            <button class="vx-core" id="vx-core" type="button" aria-label="core trigger">
              <span class="vx-ring r1"></span>
              <span class="vx-ring r2"></span>
              <span class="vx-ring r3"></span>
              <span class="vx-core-symbol" id="vx-core-symbol"></span>
            </button>
          </div>

          <div class="vx-mode-row" id="vx-mode-row">
            <button class="vx-mode" data-mode="NOVA" type="button">NOVA</button>
            <button class="vx-mode" data-mode="VOID" type="button">VOID</button>
            <button class="vx-mode" data-mode="GLITCH" type="button">GLITCH</button>
          </div>

          <section class="vx-panel">
            <div class="vx-panel-line">
              <span>CHANNEL</span>
              <strong id="vx-mode-label"></strong>
            </div>
            <div class="vx-panel-line">
              <span>POWER</span>
              <strong id="vx-power-label"></strong>
            </div>
            <input class="vx-slider" id="vx-slider" type="range" min="0" max="100" step="1" />
            <div class="vx-wave" id="vx-wave"></div>
          </section>

          <section class="vx-console">
            <p class="vx-console-main" id="vx-console-main"></p>
            <div class="vx-feed" id="vx-feed"></div>
          </section>

          <div class="vx-actions">
            <button class="vx-btn main" id="vx-enter" type="button">Start Session</button>
            <button class="vx-btn ghost" id="vx-signup" type="button">Create Identity</button>
            <button class="vx-admin" id="vx-admin" type="button">Admin Access -></button>
          </div>
        </div>
      </section>
    `;

    const rootEl = root.querySelector("#vx-root");
    const shellEl = root.querySelector("#vx-shell");
    const canvas = root.querySelector("#vx-canvas");
    const coreSymbolEl = root.querySelector("#vx-core-symbol");
    const modeLabelEl = root.querySelector("#vx-mode-label");
    const powerLabelEl = root.querySelector("#vx-power-label");
    const sliderEl = root.querySelector("#vx-slider");
    const waveEl = root.querySelector("#vx-wave");
    const consoleMainEl = root.querySelector("#vx-console-main");
    const feedEl = root.querySelector("#vx-feed");

    function pushFeed(line) {
      const h = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      state.feed.unshift(`[${h}] ${line}`);
      state.feed = state.feed.slice(0, FEED_MAX);
      feedEl.innerHTML = state.feed.map((item) => `<p>${item}</p>`).join("");
    }

    function modeData() {
      return MODES[state.mode];
    }

    function initWave() {
      waveEl.innerHTML = Array.from({ length: 26 }, () => '<span class="vx-wave-bar"></span>').join("");
    }

    function updateWave() {
      const bars = waveEl.querySelectorAll(".vx-wave-bar");
      const modeBoost = state.mode === "GLITCH" ? 16 : state.mode === "VOID" ? 11 : 7;
      const powerBoost = (state.power / 100) * 42;
      bars.forEach((bar, i) => {
        const v = ((Math.sin(Date.now() / 280 + i * 0.65) + 1) / 2) * 30;
        const noise = Math.random() * 9;
        const h = clamp(10 + v + powerBoost + modeBoost + noise, 10, 98);
        bar.style.setProperty("--h", `${h}%`);
      });
    }

    function updateUI(reason) {
      const m = modeData();
      rootEl.style.setProperty("--vx-accent", m.accent);
      rootEl.style.setProperty("--vx-accent-soft", m.accentSoft);
      rootEl.classList.toggle("is-glitch", state.mode === "GLITCH");
      rootEl.classList.toggle("is-void", state.mode === "VOID");

      coreSymbolEl.textContent = m.symbol;
      modeLabelEl.textContent = m.label;
      powerLabelEl.textContent = `${state.power}%`;
      sliderEl.value = String(state.power);
      consoleMainEl.textContent = `${m.message} / intensity ${state.power}%`;

      root.querySelectorAll(".vx-mode").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.mode === state.mode);
      });

      writeStorage(STORAGE_MODE, state.mode);
      writeStorage(STORAGE_POWER, state.power);
      updateWave();

      if (reason) pushFeed(reason);
    }

    function setMode(nextMode) {
      if (!MODES[nextMode]) return;
      state.mode = nextMode;
      updateUI(`mode -> ${nextMode}`);
      pulseShell();
    }

    function setPower(nextPower, reason) {
      state.power = clamp(nextPower, 0, 100);
      updateUI(reason || null);
    }

    function randomize() {
      const keys = Object.keys(MODES);
      const nextMode = keys[Math.floor(Math.random() * keys.length)];
      const nextPower = Math.floor(Math.random() * 101);
      state.mode = nextMode;
      state.power = nextPower;
      updateUI("randomized reality");
      pulseShell();
    }

    function pulseShell() {
      shellEl.classList.remove("is-pulse");
      void shellEl.offsetWidth;
      shellEl.classList.add("is-pulse");
      window.setTimeout(() => shellEl.classList.remove("is-pulse"), 520);
    }

    function setupCanvas() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      function resize() {
        const ratio = window.devicePixelRatio || 1;
        const w = rootEl.clientWidth || window.innerWidth || 390;
        const h = rootEl.clientHeight || window.innerHeight || 844;
        canvas.width = Math.floor(w * ratio);
        canvas.height = Math.floor(h * ratio);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        state.particles = Array.from({ length: 120 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.8 + 0.4,
          v: Math.random() * 0.8 + 0.2,
          drift: (Math.random() - 0.5) * 0.55,
          t: Math.random() * Math.PI * 2,
        }));
      }

      function frame() {
        if (state.destroyed) return;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const accel = 0.45 + state.power / 120;
        ctx.clearRect(0, 0, w, h);

        const modeHue = state.mode === "GLITCH" ? [255, 114, 170] : state.mode === "VOID" ? [176, 129, 255] : [103, 215, 255];

        for (let i = 0; i < state.particles.length; i += 1) {
          const p = state.particles[i];
          p.y += p.v * accel;
          p.x += p.drift * accel;
          p.t += 0.03;

          if (p.y > h + 3) {
            p.y = -3;
            p.x = Math.random() * w;
          }
          if (p.x > w + 2) p.x = -2;
          if (p.x < -2) p.x = w + 2;

          const alpha = 0.2 + ((Math.sin(p.t) + 1) / 2) * 0.65;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${modeHue[0]}, ${modeHue[1]}, ${modeHue[2]}, ${alpha})`;
          ctx.fill();
        }

        state.rafId = window.requestAnimationFrame(frame);
      }

      resize();
      frame();
      window.addEventListener("resize", resize);
      state.intervals.push(() => window.removeEventListener("resize", resize));
    }

    function onMove(clientX, clientY) {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      const x = ((clientX / w) - 0.5) * 2;
      const y = ((clientY / h) - 0.5) * 2;
      rootEl.style.setProperty("--mx", x.toFixed(3));
      rootEl.style.setProperty("--my", y.toFixed(3));
    }

    function bind() {
      root.querySelector("#vx-random").addEventListener("click", randomize);
      root.querySelector("#vx-core").addEventListener("click", () => {
        setPower(state.power + 7, "core impulse");
        pulseShell();
      });
      root.querySelectorAll(".vx-mode").forEach((btn) => {
        btn.addEventListener("click", () => setMode(btn.dataset.mode));
      });
      sliderEl.addEventListener("input", () => {
        setPower(Number.parseInt(sliderEl.value, 10) || 0, "manual power adjustment");
      });

      root.querySelector("#vx-enter").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("loginCliente");
      });
      root.querySelector("#vx-signup").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("cadastro");
      });
      root.querySelector("#vx-admin").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("loginAdmin");
      });

      rootEl.addEventListener("mousemove", (event) => onMove(event.clientX, event.clientY));
      rootEl.addEventListener(
        "touchmove",
        (event) => {
          const t = event.touches && event.touches[0];
          if (!t) return;
          onMove(t.clientX, t.clientY);
        },
        { passive: true }
      );
      rootEl.addEventListener("mouseleave", () => {
        rootEl.style.setProperty("--mx", "0");
        rootEl.style.setProperty("--my", "0");
      });

      function onKey(event) {
        const k = event.key.toLowerCase();
        if (k === "1") setMode("NOVA");
        if (k === "2") setMode("VOID");
        if (k === "3") setMode("GLITCH");
        if (event.key === "ArrowUp") setPower(state.power + 2, "power +2");
        if (event.key === "ArrowDown") setPower(state.power - 2, "power -2");
        if (event.key === "Enter" && props && typeof props.setTela === "function") props.setTela("loginCliente");
      }

      window.addEventListener("keydown", onKey);
      state.intervals.push(() => window.removeEventListener("keydown", onKey));
    }

    initWave();
    setupCanvas();
    bind();
    updateUI("system boot complete");
    const waveTimer = window.setInterval(updateWave, 900);
    const feedTimer = window.setInterval(() => pushFeed(`diagnostics -> ${modeData().label} @ ${state.power}%`), 3100);
    state.intervals.push(() => window.clearInterval(waveTimer));
    state.intervals.push(() => window.clearInterval(feedTimer));

    return function cleanupTelaInicial() {
      state.destroyed = true;
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      state.intervals.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {}
      });
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.inicial = renderTelaInicial;
})();
