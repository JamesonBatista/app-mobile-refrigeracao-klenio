// js/screens/inicial.js

(function () {

  const TEMP_MIN = 17, TEMP_MAX = 29, TEMP_NEUTRA = 22, TEMP_GOTA = 24;
  let temperatura = TEMP_NEUTRA;
  let nivel = 0;
  const MAX_NIVEL = 10;
  const STORAGE_KEY = '@flocos_nivel';

  function getCorTemp(t) {
    if (t <= 18) return '#38b6ff';
    if (t <= 22) return '#27ae60';
    if (t <= 25) return '#f39c12';
    return '#e74c3c';
  }
  function getDescTemp(t) {
    if (t <= 17) return 'Congelante ❄❄❄';
    if (t <= 19) return 'Muito frio ❄❄';
    if (t <= 22) return 'Frio ❄';
    if (t <= 24) return 'Ameno 🌤️';
    if (t <= 25) return 'Quente 🌡️';
    if (t <= 27) return 'Muito quente 🔥';
    return 'Derretendo! 💧🔥';
  }

  function render() {
    temperatura = TEMP_NEUTRA;
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) nivel = parseInt(s); } catch(e){}

    const el = document.getElementById('tela-inicial');
    el.innerHTML = `
      <div class="flocos-fundo" id="inicial-flocos"></div>
      <div class="inicial-content">

        <!-- Termômetro -->
        <div class="temp-display" id="temp-display">
          <span class="temp-valor" id="temp-valor">${temperatura}°C</span>
          <span class="temp-desc" id="temp-desc">${getDescTemp(temperatura)}</span>
        </div>

        <div class="temp-barra-wrap">
          <div class="temp-barra-bg">
            <div class="temp-barra-fill" id="temp-barra"></div>
          </div>
          <div class="temp-barra-labels">
            <span style="color:#38b6ff">17°</span>
            <span style="color:#f39c12">23°</span>
            <span style="color:#e74c3c">29°</span>
          </div>
        </div>

        <!-- Logo + controles -->
        <div class="inicial-logo-row">
          <button class="temp-btn temp-btn-minus" id="btn-menos">−</button>

          <button class="inicial-logo" id="btn-logo">
            <span class="inicial-logo-icone" id="logo-icone">❄</span>
          </button>

          <button class="temp-btn temp-btn-plus" id="btn-mais">+</button>
        </div>

        <!-- Título -->
        <p class="inicial-titulo">Klenio Refrigeração</p>
        <div class="inicial-linha" id="inicial-linha"></div>
        <p class="inicial-sub">GESTÃO DE REFRIGERAÇÃO</p>

        <!-- Botões -->
        <div class="inicial-botoes">
          <button class="btn-primary" onclick="setTela('loginCliente')">
            <span id="btn-entrar-icone">❄</span> Entrar
          </button>
          <button class="btn-primary btn-outline-blue" onclick="setTela('cadastro')">
            ✨ Criar minha conta
          </button>
          <button class="btn-link" onclick="setTela('loginAdmin')">
            Acesso administrativo →
          </button>
        </div>
      </div>
    `;

    criarFlocos();
    atualizarUI();
    bindEventos();
  }

  function criarFlocos() {
    const container = document.getElementById('inicial-flocos');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('span');
      f.className = 'floco';
      f.textContent = '❄';
      f.style.cssText = `left:${10 + i * 45}px;font-size:${9 + Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`;
      container.appendChild(f);
    }
  }

  function atualizarUI() {
    const eGota = temperatura > TEMP_GOTA;
    const cor = getCorTemp(temperatura);
    const pct = ((temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * 100;

    const el = document.getElementById('tela-inicial');
    if (!el) return;
    el.style.background = eGota ? '#0a1820' : '#0a1628';

    const vEl = document.getElementById('temp-valor');
    const dEl = document.getElementById('temp-desc');
    const bEl = document.getElementById('temp-barra');
    const lEl = document.getElementById('logo-icone');
    const liEl = document.getElementById('inicial-linha');
    const biEl = document.getElementById('btn-entrar-icone');
    const tEl = document.getElementById('temp-display');

    if (vEl) { vEl.textContent = `${temperatura}°C`; vEl.style.color = cor; }
    if (dEl) { dEl.textContent = getDescTemp(temperatura); dEl.style.color = cor; }
    if (bEl) { bEl.style.width = pct + '%'; bEl.style.background = cor; }
    if (tEl) { tEl.style.borderColor = cor + '55'; tEl.style.background = cor + '18'; }
    if (lEl) { lEl.textContent = eGota ? '💧' : '❄'; lEl.style.color = eGota ? '#64b4ff' : '#38b6ff'; }
    if (liEl){ liEl.style.background = eGota ? 'rgba(100,180,255,0.35)' : 'rgba(56,182,255,0.35)'; }
    if (biEl){ biEl.textContent = eGota ? '💧' : '❄'; }

    const btnMenos = document.getElementById('btn-menos');
    const btnMais  = document.getElementById('btn-mais');
    if (btnMenos) btnMenos.disabled = temperatura <= TEMP_MIN;
    if (btnMais)  btnMais.disabled  = temperatura >= TEMP_MAX;
  }

  function bindEventos() {
    document.getElementById('btn-menos')?.addEventListener('click', () => {
      if (temperatura > TEMP_MIN) { temperatura--; atualizarUI(); animarTemp(); }
    });
    document.getElementById('btn-mais')?.addEventListener('click', () => {
      if (temperatura < TEMP_MAX) { temperatura++; atualizarUI(); animarTemp(); }
    });
    document.getElementById('btn-logo')?.addEventListener('click', () => {
      nivel = nivel >= MAX_NIVEL ? 1 : nivel + 1;
      try { localStorage.setItem(STORAGE_KEY, String(nivel)); } catch(e){}
      const logo = document.getElementById('btn-logo');
      logo.classList.add('logo-pulse');
      setTimeout(() => logo.classList.remove('logo-pulse'), 400);
    });
  }

  function animarTemp() {
    const el = document.getElementById('temp-display');
    if (!el) return;
    el.classList.add('temp-pulse');
    setTimeout(() => el.classList.remove('temp-pulse'), 200);
  }

  Router.registrarMount('inicial', render);
})();
