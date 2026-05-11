// js/screens/splash.js
// ============================================================
// splash.js — TelaSplash
// Animações React Native → CSS animations + Web Animations API
// ============================================================

(function () {

  function renderSplash() {
    const el = document.getElementById('tela-splash');
    el.innerHTML = `
      <div class="splash-container">

        <!-- Partículas de fundo -->
        <div class="splash-particulas" id="splash-particulas"></div>

        <!-- Conteúdo principal -->
        <div class="splash-content" id="splash-content">

          <!-- Sistema solar de flocos -->
          <div class="splash-sistema">
            <!-- Anéis de órbita -->
            <div class="orbita-ring" style="width:296px;height:296px;border-radius:148px;"></div>
            <div class="orbita-ring" style="width:212px;height:212px;border-radius:106px;animation-delay:.2s"></div>
            <div class="orbita-ring" style="width:136px;height:136px;border-radius:68px;animation-delay:.4s"></div>

            <!-- Flocos orbitando -->
            <span class="floco-orbita" style="--raio:68px;--dur:7s;--ang:0deg;--size:24px;--op:.9;--delay:.8s">❄</span>
            <span class="floco-orbita" style="--raio:68px;--dur:7s;--ang:120deg;--size:20px;--op:.8;--delay:.9s">❄</span>
            <span class="floco-orbita" style="--raio:68px;--dur:7s;--ang:240deg;--size:22px;--op:.85;--delay:.85s">❄</span>

            <span class="floco-orbita" style="--raio:106px;--dur:11s;--ang:45deg;--size:16px;--op:.6;--delay:1s">❄</span>
            <span class="floco-orbita" style="--raio:106px;--dur:11s;--ang:135deg;--size:14px;--op:.55;--delay:1.1s">❄</span>
            <span class="floco-orbita" style="--raio:106px;--dur:11s;--ang:225deg;--size:18px;--op:.65;--delay:1.05s">❄</span>
            <span class="floco-orbita" style="--raio:106px;--dur:11s;--ang:315deg;--size:13px;--op:.5;--delay:1.15s">❄</span>

            <span class="floco-orbita" style="--raio:148px;--dur:16s;--ang:20deg;--size:9px;--op:.35;--delay:1.2s">❄</span>
            <span class="floco-orbita" style="--raio:148px;--dur:16s;--ang:80deg;--size:11px;--op:.4;--delay:1.3s">❄</span>
            <span class="floco-orbita" style="--raio:148px;--dur:16s;--ang:155deg;--size:8px;--op:.3;--delay:1.25s">❄</span>
            <span class="floco-orbita" style="--raio:148px;--dur:16s;--ang:220deg;--size:10px;--op:.38;--delay:1.35s">❄</span>
            <span class="floco-orbita" style="--raio:148px;--dur:16s;--ang:290deg;--size:7px;--op:.28;--delay:1.28s">❄</span>

            <!-- Glow central -->
            <div class="splash-glow"></div>

            <!-- Logo central -->
            <div class="splash-logo-circulo">
              <span class="splash-logo-icone">❄</span>
            </div>
          </div>

          <p class="splash-nome">Klenio Refrigeração</p>
          <div class="splash-linha"></div>
          <p class="splash-sub">GESTÃO DE REFRIGERAÇÃO</p>
          <p class="splash-rodape">Seu conforto é nossa prioridade ❄</p>
        </div>
      </div>
    `;

    // Cria partículas JS
    const particulas = document.getElementById('splash-particulas');
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('span');
      p.textContent = '❄';
      p.className = 'splash-particula';
      p.style.cssText = `
        left: ${Math.random() * 100}%;
        font-size: ${Math.random() * 8 + 6}px;
        animation-duration: ${Math.random() * 4 + 5}s;
        animation-delay: ${Math.random() * 2.5}s;
        opacity: ${Math.random() * 0.25 + 0.08};
      `;
      particulas.appendChild(p);
    }

    // Após a duração total das animações (~5s), chama iniciarApp
    setTimeout(() => {
      const content = document.getElementById('splash-content');
      if (content) {
        content.style.transition = 'opacity .55s, transform .55s';
        content.style.opacity = '0';
        content.style.transform = 'scale(1.1)';
      }
      setTimeout(() => {
        if (window.iniciarApp) window.iniciarApp();
      }, 600);
    }, 4800);
  }

  Router.registrarMount('splash', renderSplash);
})();
