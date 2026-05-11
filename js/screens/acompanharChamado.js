// js/screens/acompanharChamado.js

(function () {
  let _unsub = null;

  function render() {
    const usuario = State.get('usuarioLogado');
    const el = document.getElementById('tela-acompanharChamado');
    el.innerHTML = `
      <div class="flocos-fundo" id="ach-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Meus Chamados</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>
        <div id="ach-lista"><div class="spinner" style="margin:40px auto"></div></div>
        <div style="height:20px"></div>
      </div>
    `;
    criarFlocos('ach-flocos');
    if (_unsub) _unsub();
    _unsub = ouvirChamadosCliente(usuario.email, renderLista);
  }

  const STATUS = {
    'Aguardando técnico': { icone:'⏳', cor:'#f39c12' },
    'Aceito':             { icone:'✅', cor:'#27ae60' },
    'Em atendimento':     { icone:'🔧', cor:'#2980b9' },
    'Concluído':          { icone:'🏁', cor:'#8e44ad' },
    'Cancelado':          { icone:'❌', cor:'#e74c3c' },
  };

  function renderLista(lista) {
    const cont = document.getElementById('ach-lista');
    if (!cont) return;
    if (lista.length === 0) {
      cont.innerHTML = `<div class="empty-state"><span class="icone">📡</span><p class="titulo">Nenhum chamado</p><p class="sub">Abra um chamado para acompanhar aqui.</p></div>`;
      return;
    }
    cont.innerHTML = lista.map((c, i) => {
      const s = STATUS[c.status] || STATUS['Aguardando técnico'];
      return `
        <div class="card" style="margin-bottom:12px;border-color:${s.cor}44;cursor:pointer" onclick="achVerDetalhe(${i})">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <span style="color:var(--primary);font-size:13px;font-weight:700">${c.numero}</span>
            <span class="badge" style="background:${s.cor}22;color:${s.cor}">${s.icone} ${c.status}</span>
          </div>
          <p style="color:#fff;font-size:13px;font-weight:600;margin-bottom:4px">${c.tipos?.join(', ')}</p>
          <p style="color:var(--text-muted);font-size:12px">📅 ${c.dataFormatada} • 🕐 ${c.horario}</p>
          <p style="color:var(--text-muted);font-size:12px;margin-top:2px">📍 ${c.endereco}</p>
        </div>
      `;
    }).join('');
    window._achLista = lista;
  }

  window.achVerDetalhe = function (i) {
    const lista = window._achLista || [];
    State.set('chamadoClienteSelecionado', lista[i]);
    setTela('detalheChamadoCliente');
  };

  function criarFlocos(id) {
    const c = document.getElementById(id);
    if (!c) return;
    for (let i = 0; i < 8; i++) {
      const f = document.createElement('span'); f.className = 'floco'; f.textContent = '❄';
      f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`;
      c.appendChild(f);
    }
  }

  Router.registrarMount('acompanharChamado', render);
})();
