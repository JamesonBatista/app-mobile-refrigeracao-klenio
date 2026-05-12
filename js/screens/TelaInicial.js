// js/screens/TelaInicial.js

(function () {
  const TEAM_BG = "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg";
  const HEROES = [
    {
      name: "IRON MAN",
      identity: "Tony Stark",
      role: "Tactical Engineer",
      quote: "Sometimes you gotta run before you can walk.",
      poster: "https://upload.wikimedia.org/wikipedia/en/7/70/Ironmanposter.JPG",
      accent: "#ff5b47",
      mission: "Deploy airborne strike pattern and precision systems.",
    },
    {
      name: "CAPTAIN AMERICA",
      identity: "Steve Rogers",
      role: "Field Commander",
      quote: "I can do this all day.",
      poster: "https://upload.wikimedia.org/wikipedia/en/3/37/Captain_America_The_First_Avenger_poster.jpg",
      accent: "#4aa3ff",
      mission: "Stabilize frontline and coordinate unit formation.",
    },
    {
      name: "THOR",
      identity: "Odinson",
      role: "Heavy Assault",
      quote: "Bring me Thanos!",
      poster: "https://upload.wikimedia.org/wikipedia/en/7/7d/Thor_Ragnarok_poster.jpg",
      accent: "#55e7cf",
      mission: "Charge core output and break enemy shield layers.",
    },
    {
      name: "HULK",
      identity: "Bruce Banner",
      role: "Ground Impact",
      quote: "Thats my secret. I am always angry.",
      poster: "https://upload.wikimedia.org/wikipedia/en/3/39/The_Incredible_Hulk_poster.jpg",
      accent: "#86e65c",
      mission: "Neutralize high-density threats at close range.",
    },
    {
      name: "BLACK WIDOW",
      identity: "Natasha Romanoff",
      role: "Covert Operations",
      quote: "At some point we all have to choose.",
      poster: "https://upload.wikimedia.org/wikipedia/en/e/e8/Black_Widow_%282021_film%29_poster.jpg",
      accent: "#ff8abd",
      mission: "Execute silent entry and recover encrypted intel.",
    },
  ];

  const THREAT_LEVELS = ["ALPHA", "BETA", "OMEGA", "SIGMA", "ECLIPSE"];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function renderTelaInicial(root, props) {
    const state = {
      active: 0,
      feed: [],
      particles: [],
      rafId: null,
      cleaners: [],
      destroyed: false,
    };

    root.innerHTML = `
      <section class="avx-root" id="avx-root">
        <canvas class="avx-stars" id="avx-stars"></canvas>
        <div class="avx-overlay"></div>

        <div class="avx-shell" id="avx-shell">
          <header class="avx-header">
            <div>
              <p class="avx-eyebrow">AVENGERS INITIATIVE</p>
              <h1 class="avx-title">MISSION CONSOLE</h1>
            </div>
            <button class="avx-random" id="avx-random" type="button">Shuffle Hero</button>
          </header>

          <section class="avx-hero-strip" id="avx-hero-strip">
            ${HEROES.map((hero, index) => `
              <button class="avx-hero-btn${index === 0 ? " is-active" : ""}" data-hero="${index}" type="button">
                <span class="avx-hero-thumb" style="background-image:url('${hero.poster}')"></span>
                <span class="avx-hero-name">${hero.name}</span>
              </button>
            `).join("")}
          </section>

          <section class="avx-main">
            <article class="avx-poster-card">
              <div class="avx-poster" id="avx-poster"></div>
              <div class="avx-poster-info">
                <p class="avx-hero-role" id="avx-role"></p>
                <p class="avx-hero-identity" id="avx-identity"></p>
              </div>
            </article>

            <article class="avx-intel-card">
              <div class="avx-intel-line">
                <span>Threat Level</span>
                <strong id="avx-threat"></strong>
              </div>
              <div class="avx-intel-line">
                <span>Mission Focus</span>
                <strong id="avx-mission"></strong>
              </div>
              <p class="avx-quote" id="avx-quote"></p>
            </article>
          </section>

          <section class="avx-feed-card">
            <p class="avx-feed-title">Live Tactical Feed</p>
            <div class="avx-feed" id="avx-feed"></div>
          </section>

          <div class="avx-actions">
            <button class="avx-btn main" id="avx-enter" type="button">Enter as Recruit</button>
            <button class="avx-btn ghost" id="avx-signup" type="button">Create New Profile</button>
            <button class="avx-admin" id="avx-admin" type="button">Admin Access -></button>
          </div>
        </div>
      </section>
    `;

    const rootEl = root.querySelector("#avx-root");
    const shellEl = root.querySelector("#avx-shell");
    const starsCanvas = root.querySelector("#avx-stars");
    const posterEl = root.querySelector("#avx-poster");
    const roleEl = root.querySelector("#avx-role");
    const identityEl = root.querySelector("#avx-identity");
    const threatEl = root.querySelector("#avx-threat");
    const missionEl = root.querySelector("#avx-mission");
    const quoteEl = root.querySelector("#avx-quote");
    const feedEl = root.querySelector("#avx-feed");
    const heroStripEl = root.querySelector("#avx-hero-strip");

    function pushFeed(message) {
      const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      state.feed.unshift(`[${time}] ${message}`);
      state.feed = state.feed.slice(0, 6);
      feedEl.innerHTML = state.feed.map((item) => `<p>${item}</p>`).join("");
    }

    function currentHero() {
      return HEROES[state.active];
    }

    function randomThreat() {
      const offset = Math.floor(Math.random() * THREAT_LEVELS.length);
      return THREAT_LEVELS[(state.active + offset) % THREAT_LEVELS.length];
    }

    function updateHero(trigger) {
      const hero = currentHero();
      rootEl.style.setProperty("--avx-accent", hero.accent);
      rootEl.style.setProperty("--avx-accent-soft", `${hero.accent}44`);
      posterEl.style.backgroundImage = `url('${hero.poster}')`;
      roleEl.textContent = hero.name;
      identityEl.textContent = `${hero.identity} • ${hero.role}`;
      missionEl.textContent = hero.mission;
      threatEl.textContent = randomThreat();
      quoteEl.textContent = `"${hero.quote}"`;

      heroStripEl.querySelectorAll(".avx-hero-btn").forEach((btn, idx) => {
        btn.classList.toggle("is-active", idx === state.active);
      });

      if (trigger) {
        pushFeed(`${hero.name} linked :: ${trigger}`);
      }
    }

    function pulseShell() {
      shellEl.classList.remove("is-pulse");
      void shellEl.offsetWidth;
      shellEl.classList.add("is-pulse");
      window.setTimeout(() => shellEl.classList.remove("is-pulse"), 540);
    }

    function randomHero() {
      const next = Math.floor(Math.random() * HEROES.length);
      state.active = next;
      updateHero("randomized assignment");
      pulseShell();
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

        state.particles = Array.from({ length: 150 }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.8 + 0.3,
          v: Math.random() * 0.75 + 0.15,
          d: (Math.random() - 0.5) * 0.48,
          t: Math.random() * Math.PI * 2,
        }));
      }

      function frame() {
        if (state.destroyed) return;
        const width = starsCanvas.clientWidth;
        const height = starsCanvas.clientHeight;
        const hero = currentHero();
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < state.particles.length; i += 1) {
          const p = state.particles[i];
          p.y += p.v;
          p.x += p.d;
          p.t += 0.03;
          if (p.y > height + 3) {
            p.y = -3;
            p.x = Math.random() * width;
          }
          if (p.x > width + 2) p.x = -2;
          if (p.x < -2) p.x = width + 2;

          const alpha = 0.2 + ((Math.sin(p.t) + 1) / 2) * 0.64;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `${hero.accent}${Math.floor(alpha * 255).toString(16).padStart(2, "0")}`;
          ctx.fill();
        }

        state.rafId = window.requestAnimationFrame(frame);
      }

      resize();
      frame();
      window.addEventListener("resize", resize);
      state.cleaners.push(() => window.removeEventListener("resize", resize));
    }

    function onPointer(clientX, clientY) {
      const width = window.innerWidth || 390;
      const height = window.innerHeight || 844;
      const x = ((clientX / width) - 0.5) * 2;
      const y = ((clientY / height) - 0.5) * 2;
      rootEl.style.setProperty("--mx", clamp(x, -1, 1).toFixed(3));
      rootEl.style.setProperty("--my", clamp(y, -1, 1).toFixed(3));
    }

    function bind() {
      heroStripEl.querySelectorAll(".avx-hero-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.active = Number(btn.dataset.hero);
          updateHero("manual selection");
          pulseShell();
        });
      });

      root.querySelector("#avx-random").addEventListener("click", randomHero);
      root.querySelector("#avx-enter").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("loginCliente");
      });
      root.querySelector("#avx-signup").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("cadastro");
      });
      root.querySelector("#avx-admin").addEventListener("click", () => {
        if (props && typeof props.setTela === "function") props.setTela("loginAdmin");
      });

      rootEl.addEventListener("mousemove", (event) => onPointer(event.clientX, event.clientY));
      rootEl.addEventListener(
        "touchmove",
        (event) => {
          const touch = event.touches && event.touches[0];
          if (!touch) return;
          onPointer(touch.clientX, touch.clientY);
        },
        { passive: true }
      );
      rootEl.addEventListener("mouseleave", () => {
        rootEl.style.setProperty("--mx", "0");
        rootEl.style.setProperty("--my", "0");
      });

      function onKey(event) {
        if (event.key === "ArrowRight") {
          state.active = (state.active + 1) % HEROES.length;
          updateHero("keyboard next");
        }
        if (event.key === "ArrowLeft") {
          state.active = (state.active - 1 + HEROES.length) % HEROES.length;
          updateHero("keyboard prev");
        }
        if (event.key === "Enter") {
          if (props && typeof props.setTela === "function") props.setTela("loginCliente");
        }
      }

      window.addEventListener("keydown", onKey);
      state.cleaners.push(() => window.removeEventListener("keydown", onKey));
    }

    setupStars();
    bind();
    updateHero("boot sequence complete");

    const feedTimer = window.setInterval(() => {
      pushFeed(`${currentHero().name} mission packet refreshed`);
    }, 3500);
    state.cleaners.push(() => window.clearInterval(feedTimer));

    return function cleanupTelaInicial() {
      state.destroyed = true;
      if (state.rafId) window.cancelAnimationFrame(state.rafId);
      state.cleaners.forEach((clean) => {
        try {
          clean();
        } catch (error) {}
      });
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.inicial = renderTelaInicial;
})();
