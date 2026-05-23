// js/screens/TelaSplash.js

(function () {
  const ORBITA_1 = [
    { raio: 68, tamanho: 24, duracao: 7000, angulo: 0, opacidade: 1, delay: 800, alpha: 0.9 },
    { raio: 68, tamanho: 20, duracao: 7000, angulo: 120, opacidade: 0.9, delay: 900, alpha: 0.8 },
    { raio: 68, tamanho: 22, duracao: 7000, angulo: 240, opacidade: 0.95, delay: 850, alpha: 0.85 },
  ];

  const ORBITA_2 = [
    { raio: 106, tamanho: 16, duracao: 11000, angulo: 45, opacidade: 0.75, delay: 1000, alpha: 0.6 },
    { raio: 106, tamanho: 14, duracao: 11000, angulo: 135, opacidade: 0.7, delay: 1100, alpha: 0.55 },
    { raio: 106, tamanho: 18, duracao: 11000, angulo: 225, opacidade: 0.8, delay: 1050, alpha: 0.65 },
    { raio: 106, tamanho: 13, duracao: 11000, angulo: 315, opacidade: 0.65, delay: 1150, alpha: 0.5 },
  ];

  const ORBITA_3 = [
    { raio: 148, tamanho: 9, duracao: 16000, angulo: 20, opacidade: 0.5, delay: 1200, alpha: 0.35 },
    { raio: 148, tamanho: 11, duracao: 16000, angulo: 80, opacidade: 0.55, delay: 1300, alpha: 0.4 },
    { raio: 148, tamanho: 8, duracao: 16000, angulo: 155, opacidade: 0.45, delay: 1250, alpha: 0.3 },
    { raio: 148, tamanho: 10, duracao: 16000, angulo: 220, opacidade: 0.5, delay: 1350, alpha: 0.38 },
    { raio: 148, tamanho: 7, duracao: 16000, angulo: 290, opacidade: 0.4, delay: 1280, alpha: 0.28 },
  ];

  function gerarParticulas() {
    const largura = window.innerWidth || 360;
    return Array.from({ length: 18 }, (_, index) => ({
      id: index,
      x: (largura / 18) * index + Math.random() * 8,
      size: Math.random() * 8 + 6,
      dur: Math.random() * 4000 + 5000,
      delay: Math.random() * 2500,
      opacity: Math.random() * 0.25 + 0.08,
    }));
  }

  function renderOrbits(lista) {
    return lista.map((floco) => `
      <span
        class="splash-orbit"
        style="
          --ang:${floco.angulo}deg;
          --dur:${floco.duracao}ms;
          --delay:${floco.delay}ms;
        "
      >
        <span
          class="splash-orbit-flake"
          style="
            --radius:${floco.raio}px;
            --size:${floco.tamanho}px;
            --alpha:${floco.alpha};
            --visible:${floco.opacidade};
            --dur:${floco.duracao}ms;
            --delay:${floco.delay}ms;
          "
        >❄</span>
      </span>
    `).join("");
  }

  function renderTelaSplash(root, props) {
    root.innerHTML = `
      <section class="splash-screen">
        <div class="splash-particles" id="splash-particles"></div>
        <div class="splash-content" id="splash-content">
          <div class="splash-system">
            <div class="splash-ring ring-3"></div>
            <div class="splash-ring ring-2"></div>
            <div class="splash-ring ring-1"></div>
            ${renderOrbits(ORBITA_3)}
            ${renderOrbits(ORBITA_2)}
            ${renderOrbits(ORBITA_1)}
            <div class="splash-glow"></div>
            <div class="splash-logo">
              <span class="splash-logo-icon">❄</span>
            </div>
          </div>

          <p class="splash-name">Klenio Refrigeração</p>
          <div class="splash-line"></div>
          <p class="splash-sub">GESTÃO DE REFRIGERAÇÃO</p>
          <p class="splash-footer">Seu conforto é nossa prioridade ❄</p>
        </div>
      </section>
    `;

    const particleContainer = root.querySelector("#splash-particles");
    const particles = gerarParticulas();
    particles.forEach((particle) => {
      const el = document.createElement("span");
      el.className = "splash-particle";
      el.textContent = "❄";
      el.style.setProperty("--x", `${particle.x}px`);
      el.style.setProperty("--size", `${particle.size}px`);
      el.style.setProperty("--dur", `${particle.dur}ms`);
      el.style.setProperty("--delay", `${particle.delay}ms`);
      el.style.setProperty("--opacity", String(particle.opacity));
      particleContainer.appendChild(el);
    });

    const content = root.querySelector("#splash-content");
    const exitTimer = setTimeout(() => {
      content.classList.add("is-exiting");
    }, 4800);

    const finishTimer = setTimeout(() => {
      if (props && typeof props.onFinish === "function") {
        props.onFinish();
      }
    }, 5400);

    root.__cleanupSplash = function () {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }

  window.Telas = window.Telas || {};
  window.Telas.splash = renderTelaSplash;
})();
