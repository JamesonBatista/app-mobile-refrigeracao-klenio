// js/screens/loginCliente.js

(function () {

  function render() {
    const el = document.getElementById('tela-loginCliente');
    el.innerHTML = `
      <div class="flocos-fundo" id="lc-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div>
            <span class="header-empresa">Klenio Refrigeração</span>
            <span class="header-nome">Login Cliente</span>
          </div>
          <button class="btn-voltar" onclick="setTela('inicial')">← Voltar</button>
        </div>

        <div class="logo-wrap">
          <div class="logo-circulo" style="width:90px;height:90px;font-size:44px;box-shadow:0 0 12px rgba(56,182,255,0.5)">❄</div>
        </div>

        <div class="card">
          <p class="titulo">Bem-vindo de volta!</p>
          <p class="subtitulo">Entre com suas credenciais</p>

          <div id="lc-erro" class="erro-box" style="display:none"></div>

          <label class="label">E-mail</label>
          <div class="input-wrap">
            <span class="input-icone">✉️</span>
            <input id="lc-email" type="email" placeholder="seu@email.com" autocomplete="email" />
          </div>

          <label class="label">Senha</label>
          <div class="input-wrap">
            <span class="input-icone">🔒</span>
            <input id="lc-senha" type="password" placeholder="Sua senha" />
          </div>

          <button class="btn-link" style="text-align:right;margin-top:8px" onclick="setTela('recuperarSenha')">
            Esqueci minha senha
          </button>
        </div>

        <button class="btn-primary" id="lc-btn" onclick="lcLogin()">❄ Entrar</button>

        <div class="btn-text-center" onclick="setTela('cadastro')" style="cursor:pointer">
          Não tem conta? <span>Criar conta</span>
        </div>

        <div style="height:20px"></div>
      </div>
    `;

    criarFlocos('lc-flocos');
  }

  window.lcLogin = async function () {
    const email = document.getElementById('lc-email')?.value.trim().toLowerCase();
    const senha = document.getElementById('lc-senha')?.value.trim();
    const erroEl = document.getElementById('lc-erro');
    const btn    = document.getElementById('lc-btn');

    if (!email || !senha) {
      mostrarErro(erroEl, '❄ Preencha e-mail e senha.'); return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div>';

    try {
      const doc = await db.collection('clientes').doc(email).get();
      if (!doc.exists) {
        mostrarErro(erroEl, '❄ E-mail não encontrado.'); btn.disabled = false; btn.innerHTML = '❄ Entrar'; return;
      }
      const dados = doc.data();
      if (dados.senha !== senha) {
        mostrarErro(erroEl, '❄ Senha incorreta.'); btn.disabled = false; btn.innerHTML = '❄ Entrar'; return;
      }
      const usuario = { nome: dados.nome, email: dados.email, telefone: dados.telefone || '', endereco: dados.endereco || '', perfil: 'cliente' };
      State.salvarUsuario(usuario);
      State.set('usuarioLogado', usuario);
      await configurarNotificacoesCliente(usuario.email);
      setTela('principal');
    } catch (e) {
      console.log('Erro login:', e);
      mostrarErro(erroEl, '❄ Ocorreu um erro. Tente novamente.');
      btn.disabled = false; btn.innerHTML = '❄ Entrar';
    }
  };

  function mostrarErro(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
  }

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

  Router.registrarMount('loginCliente', render);
})();
