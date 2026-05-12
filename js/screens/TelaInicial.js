// js/screens/TelaInicial.js

(function () {
  const HEROES = [
    {
      id: "iron-man",
      nome: "IRON MAN",
      ator: "Tony Stark",
      papel: "Tactical Engineer",
      frase: "Sometimes you gotta run before you can walk.",
      poster: "https://upload.wikimedia.org/wikipedia/en/7/70/Ironmanposter.JPG",
      cor: "#ff5f4d",
      missao: "Precision strike and airborne control.",
    },
    {
      id: "captain-america",
      nome: "CAPTAIN AMERICA",
      ator: "Steve Rogers",
      papel: "Field Commander",
      frase: "I can do this all day.",
      poster: "https://upload.wikimedia.org/wikipedia/en/3/37/Captain_America_The_First_Avenger_poster.jpg",
      cor: "#4f9dff",
      missao: "Frontline coordination and defense line control.",
    },
    {
      id: "thor",
      nome: "THOR",
      ator: "Odinson",
      papel: "Heavy Assault",
      frase: "Bring me Thanos!",
      poster: "https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg",
      cor: "#67e7c7",
      missao: "High-impact engagement and shield disruption.",
    },
    {
      id: "black-widow",
      nome: "BLACK WIDOW",
      ator: "Natasha Romanoff",
      papel: "Covert Ops",
      frase: "At some point we all have to choose.",
      poster: "https://upload.wikimedia.org/wikipedia/en/e/e8/Black_Widow_%282021_film%29_poster.jpg",
      cor: "#ff7daf",
      missao: "Silent infiltration and intelligence recovery.",
    },
  ];

  function renderTelaInicial(root, props) {
    const state = {
      heroIndex: 0,
      particles: [],
      rafId: null,
      destroyed: false,
      cleanupFns: [],
    };

    root.innerHTML = `
      <section class="av-root" id="av-root">
        <canvas class="av-stars" id="av-stars"></canvas>
        <div class="av-overlay"></div>

        <div class="av-content" id="av-content">
          <header class="av-header">
            <div>
              <p class="av-eyebrow">AVENGERS INITIATIVE</p>
              <h1 class="av-title">MISSION HUB</h1>
            </div>
            <button class="av-switch-btn" id="av-switch-btn" type="button">Switch Hero</button>
          </header>

          <nav class="av-hero-tabs" id="av-hero-tabs">
            ${HEROES.map((hero, index) => `
              <button class="av-hero-tab${index === 0 ? " is-active" : ""}" data-hero-index="${index}" type="button">${hero.nome}</button>
            `).join("")}
          </nav>

          <main class="av-main-card">
            <div class="av-poster" id="av-poster"></div>
            <div class="av-info">
              <h2 class="av-hero-name" id="av-hero-name"></h2>
              <p class="av-hero-meta" id="av-hero-meta"></p>
              <p class="av-hero-mission" id="av-hero-mission"></p>
              <p class="av-hero-quote" id="av-hero-quote"></p>
            </div>
          </main>

          <div class="av-actions">
            <button class="av-btn main" id="av-enter" type="button">Entrar</button>
            <button class="av-btn ghost" id="av-signup" type="button">Criar conta</button>
            <button class="av-admin" id="av-admin" type="button">Acesso administrativo -></button>
          </div>
        </div>
      </section>
    `;

    const rootEl = root.querySelector("#av-root");
    const contentEl = root.querySelector("#av-content");
    const starsCanvas = root.querySelector("#av-stars");
    const posterEl = root.querySelector("#av-poster");
    const heroNameEl = root.querySelector("#av-hero-name");
    const heroMetaEl = root.querySelector("#av-hero-meta");
    const heroMissionEl = root.querySelector("#av-hero-mission");
    const heroQuoteEl = root.querySelector("#av-hero-quote");
    const tabsEl = root.querySelector("#av-hero-tabs");

    function heroAtual() {
      return HEROES[state.heroIndex];
    }

    function atualizarHero() {
      const hero = heroAtual();
      rootEl.style.setProperty("--av-accent", hero.cor);
      rootEl.style.setProperty("--av-accent-soft", `${hero.cor}44`);
      posterEl.style.backgroundImage = `url('${hero.poster}')`;
      heroNameEl.textContent = hero.nome;
      heroMetaEl.textContent = `${hero.ator} • ${hero.papel}`;
      heroMissionEl.textContent = hero.missao;
      heroQuoteEl.textContent = `"${hero.frase}"`;

      tabsEl.querySelectorAll(".av-hero-tab").forEach((btn, idx) => {
        btn.classList.toggle("is-active", idx === state.heroIndex);
      });
    }

    function proximoHero() {
      state.heroIndex = (state.heroIndex + 1) % HEROES.length;
      atualizarHero();
    }

    function setupStars() {
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

        state.particles = Array.from({ length: 120 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.7 + 0.4,
          velocity: Math.random() * 0.65 + 0.15,
          drift: (Math.random() - 0.5) * 0.4,
          t: Math.random() * Math.PI * 2,
        }));
      }

      function frame() {
        if (state.destroyed) return;
        const width = starsCanvas.clientWidth;
        const height = starsCanvas.clientHeight;
        const hero = heroAtual();

        ctx.clearRect(0, 0, width, height);
        for (let i = 0; i < state.particles.length; i += 1) {
          const p = state.particles[i];
          p.y += p.velocity;
          p.x += p.drift;
          p.t += 0.03;

          if (p.y > height + 2) {
            p.y = -2;
            p.x = Math.random() * width;
          }
          if (p.x > width + 2) p.x = -2;
          if (p.x < -2) p.x = width + 2;

          const alpha = 0.2 + ((Math.sin(p.t) + 1) / 2) * 0.65;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${hero.cor}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
          ctx.fill();
        }
        state.rafId = window.requestAnimationFrame(frame);
      }

      resize();
      frame();
      window.addEventListener("resize", resize);
      state.cleanupFns.push(() => window.removeEventListener("resize", resize));
    }

    function pointerParallax(clientX, clientY) {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      const x = ((clientX / w) - 0.5) * 2;
      const y = ((clientY / h) - 0.5) * 2;
      contentEl.style.transform = `translate3d(${(x * 6).toFixed(2)}px, ${(y * 7).toFixed(2)}px, 0)`;
    }

    root.querySelector("#av-switch-btn").addEventListener("click", proximoHero);
    tabsEl.querySelectorAll(".av-hero-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.heroIndex = Number(btn.dataset.heroIndex);
        atualizarHero();
      });
    });

    root.querySelector("#av-enter").addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("loginCliente");
    });
    root.querySelector("#av-signup").addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("cadastro");
    });
    root.querySelector("#av-admin").addEventListener("click", () => {
      if (props && typeof props.setTela === "function") props.setTela("loginAdmin");
    });

    rootEl.addEventListener("mousemove", (event) => {
      pointerParallax(event.clientX, event.clientY);
    });
    rootEl.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches && event.touches[0];
        if (!touch) return;
        pointerParallax(touch.clientX, touch.clientY);
      },
      { passive: true }
    );
    rootEl.addEventListener("mouseleave", () => {
      contentEl.style.transform = "translate3d(0,0,0)";
    });

    function onKey(event) {
      if (event.key === "ArrowRight") proximoHero();
      if (event.key === "ArrowLeft") {
        state.heroIndex = (state.heroIndex - 1 + HEROES.length) % HEROES.length;
        atualizarHero();
      }
      if (event.key === "Enter") {
        if (props && typeof props.setTela === "function") props.setTela("loginCliente");
      }
    }

    window.addEventListener("keydown", onKey);
    state.cleanupFns.push(() => window.removeEventListener("keydown", onKey));

    setupStars();
    atualizarHero();

    return function cleanupTelaInicial() {
      state.destroyed = true;
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      state.cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch (error) {}
      });
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.inicial = renderTelaInicial;
})();
