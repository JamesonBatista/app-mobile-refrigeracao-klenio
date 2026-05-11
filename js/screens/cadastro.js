// js/screens/cadastro.js

(function () {

  function render() {
    const el = document.getElementById('tela-cadastro');
    el.innerHTML = `
      <div class="flocos-fundo" id="cad-flocos"></div>
      <div class="scroll">
        <div class="logo-wrap">
          <div class="logo-circulo">❄</div>
          <p class="logo-nome">Klenio Refrigeração</p>
          <p class="logo-sub">GESTÃO DE REFRIGERAÇÃO</p>
        </div>

        <div class="card">
          <p class="titulo">Criar conta</p>
          <p class="subtitulo">Preencha seus dados</p>

          <div id="cad-erro" class="erro-box" style="display:none"></div>

          <label class="label">Nome completo</label>
          <div class="input-wrap">
            <span class="input-icone">👤</span>
            <input id="cad-nome" type="text" placeholder="Digite seu nome" />
          </div>

          <label class="label">Endereço</label>
          <div class="input-wrap">
            <span class="input-icone">📍</span>
            <input id="cad-endereco" type="text" placeholder="Digite seu endereço" />
          </div>

          <label class="label">Telefone / WhatsApp</label>
          <div class="input-wrap">
            <span class="input-icone">📱</span>
            <input id="cad-telefone" type="tel" placeholder="(00) 00000-0000" />
          </div>

          <label class="label">E-mail</label>
          <div class="input-wrap">
            <span class="input-icone">✉️</span>
            <input id="cad-email" type="email" placeholder="seuemail@email.com" autocomplete="email" />
          </div>

          <label class="label">Senha</label>
          <div class="input-wrap">
            <span class="input-icone">🔒</span>
            <input id="cad-senha" type="password" placeholder="Mínimo 6 caracteres" />
          </div>

          <button class="btn-primary" id="cad-btn" onclick="cadCadastrar()">Cadastrar</button>

          <div class="btn-text-center" onclick="setTela('loginCliente')" style="cursor:pointer">
            Já tem conta? <span>Entrar</span>
          </div>
        </div>

        <button class="btn-link" style="margin-top:20px;color:var(--text-muted)" onclick="setTela('inicial')">← Voltar</button>
        <div style="height:20px"></div>
      </div>
    `;
    criarFlocos('cad-flocos');
  }

  window.cadCadastrar = async function () {
    const nome     = document.getElementById('cad-nome')?.value.trim();
    const endereco = document.getElementById('cad-endereco')?.value.trim();
    const telefone = document.getElementById('cad-telefone')?.value.trim();
    const email    = document.getElementById('cad-email')?.value.trim().toLowerCase();
    const senha    = document.getElementById('cad-senha')?.value;
    const erroEl   = document.getElementById('cad-erro');
    const btn      = document.getElementById('cad-btn');

    if (!nome || !endereco || !telefone || !email || !senha) {
      mostrarErro(erroEl, 'Por favor, preencha todos os campos.'); return;
    }
    if (senha.length < 6) {
      mostrarErro(erroEl, 'A senha deve ter no mínimo 6 caracteres.'); return;
    }

    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';

    try {
      const emailExiste = await db.collection('clientes').where('email', '==', email).get();
      if (!emailExiste.empty) {
        mostrarErro(erroEl, 'Este e-mail já está cadastrado.');
        btn.disabled = false; btn.textContent = 'Cadastrar'; return;
      }

      const novoUsuario = {
        nome, endereco, telefone, email, senha,
        perfil: 'cliente',
        dataCadastro: new Date().toLocaleDateString('pt-BR'),
        token: '',
      };

      await db.collection('clientes').doc(email).set(novoUsuario);
      State.salvarUsuario(novoUsuario);
      State.salvarDadosUsuario('@usuario', novoUsuario);
      State.set('usuarioLogado', novoUsuario);
      await configurarNotificacoesCliente(email);
      setTela('principal');
    } catch (e) {
      console.log('Erro cadastro:', e);
      mostrarErro(erroEl, 'Não foi possível realizar o cadastro. Tente novamente.');
      btn.disabled = false; btn.textContent = 'Cadastrar';
    }
  };

  function mostrarErro(el, msg) { if (!el) return; el.textContent = msg; el.style.display = 'block'; }

  function criarFlocos(id) {
    const c = document.getElementById(id);
    if (!c) return;
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('span'); f.className = 'floco'; f.textContent = '❄';
      f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`;
      c.appendChild(f);
    }
  }

  Router.registrarMount('cadastro', render);
})();
