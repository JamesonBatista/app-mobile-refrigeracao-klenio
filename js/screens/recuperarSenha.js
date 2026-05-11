// js/screens/recuperarSenha.js

(function () {

  function render() {
    const el = document.getElementById('tela-recuperarSenha');
    el.innerHTML = `
      <div class="flocos-fundo" id="rs-flocos"></div>
      <div class="scroll" id="rs-form-view">
        <div class="logo-wrap">
          <div class="logo-circulo">❄</div>
          <p class="logo-nome">Klenio Refrigeração</p>
          <p class="logo-sub">RECUPERAR SENHA</p>
        </div>

        <div class="card">
          <p class="titulo">Nova senha</p>
          <p class="subtitulo">Digite seu e-mail e defina uma nova senha</p>

          <div id="rs-erro" class="erro-box" style="display:none"></div>

          <label class="label">E-mail</label>
          <div class="input-wrap">
            <span class="input-icone">✉️</span>
            <input id="rs-email" type="email" placeholder="seuemail@email.com" />
          </div>

          <label class="label">Nova senha</label>
          <div class="input-wrap">
            <span class="input-icone">🔒</span>
            <input id="rs-nova" type="password" placeholder="Mínimo 6 caracteres" />
          </div>

          <label class="label">Confirmar senha</label>
          <div class="input-wrap">
            <span class="input-icone">🔒</span>
            <input id="rs-confirmar" type="password" placeholder="Repita a nova senha" />
          </div>

          <button class="btn-primary" onclick="rsSalvar()">Salvar nova senha</button>
        </div>

        <button class="btn-link" style="margin-top:20px;color:var(--text-muted)" onclick="setTela('loginCliente')">← Voltar</button>
        <div style="height:20px"></div>
      </div>

      <!-- Tela de sucesso -->
      <div id="rs-sucesso-view" style="display:none;flex:1;align-items:center;justify-content:center;flex-direction:column;padding:24px;text-align:center">
        <span style="font-size:60px">❄</span>
        <p style="font-size:20px;font-weight:700;color:var(--primary);margin-top:20px">Senha atualizada!</p>
        <p style="color:var(--text-muted);font-size:13px;margin-top:8px">Sua nova senha foi definida com sucesso.</p>
        <button class="btn-primary" style="margin-top:30px;max-width:200px" onclick="setTela('loginCliente')">Fazer login</button>
      </div>
    `;
    criarFlocos('rs-flocos');
  }

  window.rsSalvar = async function () {
    const email    = document.getElementById('rs-email')?.value.trim();
    const nova     = document.getElementById('rs-nova')?.value;
    const confirmar= document.getElementById('rs-confirmar')?.value;
    const erroEl   = document.getElementById('rs-erro');

    // Busca no Firestore
    try {
      const doc = await db.collection('clientes').doc(email.toLowerCase()).get();
      if (!doc.exists) { mostrarErro(erroEl, '❄ E-mail não encontrado.'); return; }
      if (nova.length < 6) { mostrarErro(erroEl, '❄ A senha deve ter no mínimo 6 caracteres.'); return; }
      if (nova !== confirmar) { mostrarErro(erroEl, '❄ As senhas não coincidem.'); return; }

      await db.collection('clientes').doc(email.toLowerCase()).update({ senha: nova });

      // Atualiza localStorage se for o usuário logado
      const salvo = State.carregarDadosUsuario('@usuario');
      if (salvo && salvo.email === email.toLowerCase()) {
        salvo.senha = nova;
        State.salvarDadosUsuario('@usuario', salvo);
      }

      document.getElementById('rs-form-view').style.display = 'none';
      const sucesso = document.getElementById('rs-sucesso-view');
      sucesso.style.display = 'flex';
    } catch (e) {
      console.log('Erro recuperarSenha:', e);
      mostrarErro(erroEl, '❄ Ocorreu um erro. Tente novamente.');
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

  Router.registrarMount('recuperarSenha', render);
})();
