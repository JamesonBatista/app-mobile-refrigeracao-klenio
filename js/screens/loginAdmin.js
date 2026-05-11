// js/screens/loginAdmin.js

(function () {

  const ADMINS = [
    { user: 'krefrigeracao',  senha: '060318' },
    { user: 'krefrigeracao1', senha: '060318' },
    { user: 'krefrigeracao2', senha: '060318' },
    { user: 'krefrigeracao3', senha: '060318' },
  ];

  function render() {
    const el = document.getElementById('tela-loginAdmin');
    el.innerHTML = `
      <div class="flocos-fundo" id="la-flocos"></div>
      <div class="scroll">
        <div class="logo-wrap">
          <div class="logo-circulo">❄</div>
          <p class="logo-nome">Klenio Refrigeração</p>
          <p class="logo-sub">ÁREA ADMINISTRATIVA</p>
        </div>

        <div class="card" id="la-card">
          <p class="titulo">Administrador</p>
          <p class="subtitulo">Acesse o painel de controle</p>

          <div id="la-erro" class="erro-box" style="display:none"></div>

          <label class="label">E-mail</label>
          <div class="input-wrap">
            <span class="input-icone">✉️</span>
            <input id="la-email" type="text" placeholder="Digite o e-mail" autocomplete="off" />
          </div>

          <label class="label">Senha</label>
          <div class="input-wrap">
            <span class="input-icone">🔒</span>
            <input id="la-senha" type="password" placeholder="Digite sua senha" />
          </div>

          <button class="btn-link" style="text-align:right;margin-top:8px" onclick="setTela('recuperarSenha')">
            ❄ Esqueci minha senha
          </button>

          <button class="btn-primary btn-admin" id="la-btn" onclick="laLogin()">Entrar como Admin</button>
        </div>

        <button class="btn-link" style="margin-top:20px;color:var(--text-muted)" onclick="setTela('inicial')">← Voltar</button>
        <div style="height:20px"></div>
      </div>
    `;

    criarFlocos('la-flocos');
  }

  window.laLogin = async function () {
    const email = document.getElementById('la-email')?.value.trim();
    const senha = document.getElementById('la-senha')?.value.trim();
    const erroEl = document.getElementById('la-erro');
    const btn    = document.getElementById('la-btn');
    const card   = document.getElementById('la-card');

    const valido = ADMINS.some(a => a.user === email && a.senha === senha);

    if (!valido) {
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
      erroEl.textContent = '❄ Credenciais inválidas. Acesso congelado!';
      erroEl.style.display = 'block';
      return;
    }

    erroEl.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    const admin = { nome: 'Administrador', perfil: 'admin', email: `${email}@klenio.com` };
    State.salvarUsuario(admin);
    State.set('usuarioLogado', admin);
    await configurarNotificacoesAdmin();
    setTela('painelAdmin');
  };

  function criarFlocos(id) {
    const c = document.getElementById(id);
    if (!c) return;
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('span');
      f.className = 'floco';
      f.textContent = '❄';
      f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`;
      c.appendChild(f);
    }
  }

  Router.registrarMount('loginAdmin', render);
})();
