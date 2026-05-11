// js/screens/perfil.js
(function () {
  let editandoDados = false, editandoSenha = false;
  function render() {
    const u = State.get('usuarioLogado');
    editandoDados = false; editandoSenha = false;
    const el = document.getElementById('tela-perfil');
    el.innerHTML = `
      <div class="flocos-fundo" id="pf-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Meu Perfil</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <p class="titulo" style="margin:0">Dados pessoais</p>
            <button class="btn-link" style="margin:0" onclick="pfToggleDados()">✏️ Editar</button>
          </div>
          <label class="label">E-mail</label>
          <div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.03);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,0.06);margin-bottom:12px">
            <span>✉️</span><span style="color:rgba(180,220,255,0.5);font-size:14px;flex:1">${u?.email}</span>
            <span style="font-size:10px;color:rgba(180,220,255,0.3)">Não editável</span>
          </div>
          <label class="label">Nome</label>
          <div id="pf-nome-display" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px"><span>👤</span><span style="color:#fff;font-size:14px">${u?.nome}</span></div>
          <div id="pf-nome-input" class="input-wrap" style="display:none;margin-bottom:12px"><span class="input-icone">👤</span><input id="pf-nome" type="text" value="${u?.nome||''}" /></div>
          <label class="label">Endereço</label>
          <div id="pf-end-display" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px"><span>📍</span><span style="color:#fff;font-size:14px">${u?.endereco}</span></div>
          <div id="pf-end-input" class="input-wrap" style="display:none;margin-bottom:12px"><span class="input-icone">📍</span><input id="pf-endereco" type="text" value="${u?.endereco||''}" /></div>
          <label class="label">Telefone / WhatsApp</label>
          <div id="pf-tel-display" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-bottom:12px"><span>📱</span><span style="color:#fff;font-size:14px">${u?.telefone||''}</span></div>
          <div id="pf-tel-input" class="input-wrap" style="display:none;margin-bottom:12px"><span class="input-icone">📱</span><input id="pf-telefone" type="tel" value="${u?.telefone||''}" /></div>
          <button class="btn-primary" id="pf-salvar-btn" style="display:none" onclick="pfSalvarDados()">💾 Salvar dados</button>
        </div>
        <div class="card" style="margin-top:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <p class="titulo" style="margin:0">Alterar senha</p>
            <button class="btn-link" style="margin:0" onclick="pfToggleSenha()">🔒 Alterar</button>
          </div>
          <div id="pf-senha-form" style="display:none">
            <label class="label">Senha atual</label>
            <div class="input-wrap" style="margin-bottom:12px"><span class="input-icone">🔒</span><input id="pf-senha-atual" type="password" placeholder="Senha atual" /></div>
            <label class="label">Nova senha</label>
            <div class="input-wrap" style="margin-bottom:12px"><span class="input-icone">🔑</span><input id="pf-nova-senha" type="password" placeholder="Mínimo 6 caracteres" /></div>
            <label class="label">Confirmar nova senha</label>
            <div class="input-wrap" style="margin-bottom:12px"><span class="input-icone">🔑</span><input id="pf-confirmar-senha" type="password" placeholder="Repita a nova senha" /></div>
            <button class="btn-primary" onclick="pfSalvarSenha()">🔒 Salvar nova senha</button>
          </div>
          <div id="pf-senha-display" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px"><span>🔒</span><span style="color:rgba(180,220,255,0.5);font-size:14px">••••••••</span></div>
        </div>
        <div style="height:20px"></div>
      </div>`;
    criarFlocos('pf-flocos');
  }

  window.pfToggleDados = function () {
    editandoDados = !editandoDados;
    ['nome','end','tel'].forEach(k => {
      document.getElementById(`pf-${k}-display`).style.display = editandoDados ? 'none' : 'flex';
      document.getElementById(`pf-${k}-input`).style.display = editandoDados ? 'flex' : 'none';
    });
    document.getElementById('pf-salvar-btn').style.display = editandoDados ? 'block' : 'none';
  };

  window.pfToggleSenha = function () {
    editandoSenha = !editandoSenha;
    document.getElementById('pf-senha-form').style.display = editandoSenha ? 'block' : 'none';
    document.getElementById('pf-senha-display').style.display = editandoSenha ? 'none' : 'flex';
  };

  window.pfSalvarDados = async function () {
    const u = State.get('usuarioLogado');
    const nome = document.getElementById('pf-nome')?.value.trim();
    const end  = document.getElementById('pf-endereco')?.value.trim();
    const tel  = document.getElementById('pf-telefone')?.value.trim();
    if (!nome || !end || !tel) { alert('Preencha todos os campos.'); return; }
    const atualizado = { ...u, nome, endereco: end, telefone: tel };
    await db.collection('clientes').doc(u.email).update({ nome, endereco: end, telefone: tel });
    State.set('usuarioLogado', atualizado);
    State.salvarUsuario(atualizado);
    State.salvarDadosUsuario('@usuario', atualizado);
    alert('Dados atualizados!');
    Router.navegar('perfil');
  };

  window.pfSalvarSenha = async function () {
    const u = State.get('usuarioLogado');
    const atual = document.getElementById('pf-senha-atual')?.value;
    const nova  = document.getElementById('pf-nova-senha')?.value;
    const conf  = document.getElementById('pf-confirmar-senha')?.value;
    if (!atual || !nova || !conf) { alert('Preencha todos os campos.'); return; }
    if (atual !== u?.senha) { alert('Senha atual incorreta.'); return; }
    if (nova.length < 6) { alert('A nova senha deve ter pelo menos 6 caracteres.'); return; }
    if (nova !== conf) { alert('As senhas não coincidem.'); return; }
    await db.collection('clientes').doc(u.email).update({ senha: nova });
    const atualizado = { ...u, senha: nova };
    State.set('usuarioLogado', atualizado);
    State.salvarUsuario(atualizado);
    State.salvarDadosUsuario('@usuario', atualizado);
    alert('Senha alterada com sucesso!');
    pfToggleSenha();
  };

  function criarFlocos(id) {
    const c = document.getElementById(id); if (!c) return;
    for (let i = 0; i < 8; i++) { const f = document.createElement('span'); f.className = 'floco'; f.textContent = '❄'; f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`; c.appendChild(f); }
  }

  Router.registrarMount('perfil', render);
})();
