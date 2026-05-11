// js/screens/historicoCliente.js
(function () {
  let _filtro = 'todos';
  const FILTROS = [{key:'todos',label:'Todos'},{key:'chamado',label:'Chamados'},{key:'orcamento',label:'Orçamentos'},{key:'programado',label:'Programados'}];
  const TIPO_CONFIG = {chamado:{label:'Chamado',icone:'🔧',cor:'#2980b9'},orcamento:{label:'Orçamento',icone:'💰',cor:'#8e44ad'},programado:{label:'Programado',icone:'🛠️',cor:'#38b6ff'}};
  const ST_CHAMADO = {'Aguardando técnico':{icone:'⏳',cor:'#f39c12'},'Aceito':{icone:'✅',cor:'#27ae60'},'Em atendimento':{icone:'🔧',cor:'#2980b9'},'Concluído':{icone:'🏁',cor:'#8e44ad'},'Cancelado':{icone:'❌',cor:'#e74c3c'}};
  const ST_ORC = {'Aguardando análise':{icone:'⏳',cor:'#f39c12'},'Em análise':{icone:'🔍',cor:'#2980b9'},'Orçamento enviado':{icone:'💰',cor:'#8e44ad'},'Aprovado':{icone:'✅',cor:'#27ae60'},'Recusado':{icone:'❌',cor:'#e74c3c'},'Cancelado':{icone:'🚫',cor:'#7f8c8d'}};
  const ST_PROG = {'Agendado':{icone:'📅',cor:'#f39c12'},'Contestado':{icone:'⚠️',cor:'#e67e22'},'Respondido':{icone:'💬',cor:'#2980b9'},'Aceito':{icone:'✅',cor:'#27ae60'},'Concluído':{icone:'🏁',cor:'#8e44ad'},'Cancelado':{icone:'❌',cor:'#e74c3c'}};

  function getStatus(tipo, status) {
    if (tipo==='chamado') return ST_CHAMADO[status]||{icone:'📌',cor:'#7f8c8d'};
    if (tipo==='orcamento') return ST_ORC[status]||{icone:'📌',cor:'#7f8c8d'};
    return ST_PROG[status]||{icone:'📌',cor:'#7f8c8d'};
  }

  function render() {
    _filtro = 'todos';
    const u = State.get('usuarioLogado');
    const el = document.getElementById('tela-historicoCliente');
    el.innerHTML = `
      <div class="flocos-fundo" id="hc-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Meu Histórico</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>
        <div class="aviso-box azul" style="margin-bottom:14px"><span style="font-size:18px">📱</span><p style="font-size:12px">Histórico salvo localmente neste dispositivo.</p></div>
        <div id="hc-filtros" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px"></div>
        <div id="hc-lista"></div>
        <div style="height:20px"></div>
      </div>`;
    criarFlocos('hc-flocos');
    const raw = localStorage.getItem(`@historico_${u?.email}`);
    const todos = raw ? JSON.parse(raw) : [];
    todos.sort((a,b) => new Date(b.salvoEm||0) - new Date(a.salvoEm||0));
    window._hcItens = todos;
    renderFiltros(todos);
    renderLista(todos);
  }

  function renderFiltros(todos) {
    const cont = document.getElementById('hc-filtros'); if (!cont) return;
    cont.innerHTML = FILTROS.map(f => {
      const count = f.key==='todos' ? todos.length : todos.filter(i=>i.tipo===f.key).length;
      const ativo = _filtro === f.key;
      return `<button onclick="hcSetFiltro('${f.key}')" style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:14px;border:${ativo?'1.5px':'1px'} solid ${ativo?'var(--primary)':'rgba(255,255,255,0.12)'};background:${ativo?'rgba(56,182,255,0.15)':'rgba(255,255,255,0.04)'};color:${ativo?'var(--primary)':'rgba(180,220,255,0.5)'};font-size:12px;font-weight:${ativo?'700':'400'};cursor:pointer">
        ${f.label}${count>0?`<span style="background:${ativo?'rgba(56,182,255,0.33)':'rgba(255,255,255,0.08)'};border-radius:8px;padding:1px 5px;font-size:10px;font-weight:700;color:${ativo?'var(--primary)':'rgba(180,220,255,0.4)'}">${count}</span>`:''}
      </button>`;
    }).join('');
  }

  function renderLista(todos) {
    const cont = document.getElementById('hc-lista'); if (!cont) return;
    const itens = _filtro==='todos' ? todos : todos.filter(i=>i.tipo===_filtro);
    if (!itens.length) { cont.innerHTML = `<div class="empty-state"><span class="icone">📋</span><p class="titulo">Nenhum histórico</p><p class="sub">Seu histórico será salvo automaticamente.</p></div>`; return; }
    cont.innerHTML = itens.map(item => {
      const tc = TIPO_CONFIG[item.tipo]||TIPO_CONFIG.chamado;
      const sc = getStatus(item.tipo, item.status);
      return `<div style="background:rgba(255,255,255,0.05);border-radius:14px;border:1px solid ${sc.cor}33;padding:14px;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="background:${tc.cor}22;border:1px solid ${tc.cor}33;border-radius:8px;padding:3px 8px;font-size:11px;font-weight:700;color:${tc.cor}">${tc.icone} ${tc.label}</span>
            <span style="color:${tc.cor};font-size:13px;font-weight:700">${item.numero}</span>
          </div>
          <span class="badge" style="background:${sc.cor}18;color:${sc.cor}">${sc.icone} ${item.status}</span>
        </div>
        ${item.tipos||item.tipoServico?`<p style="color:#fff;font-size:13px;font-weight:600;margin-bottom:4px">🔧 ${item.tipoServico||(Array.isArray(item.tipos)?item.tipos.join(', '):item.tipos)}</p>`:''}
        ${item.dataFormatada?`<p style="color:rgba(180,220,255,0.7);font-size:13px">📅 ${item.dataFormatada}${item.horario?' • '+item.horario:''}</p>`:''}
        ${item.endereco?`<p style="color:rgba(180,220,255,0.6);font-size:13px;margin-top:2px">📍 ${item.endereco}</p>`:''}
        ${item.valorCobrado?`<p style="color:var(--green);font-size:13px;font-weight:700;margin-top:4px">💵 R$ ${item.valorCobrado}${item.formaPagamento?' • '+item.formaPagamento:''}</p>`:''}
        ${item.dataCriacao?`<p style="color:rgba(180,220,255,0.4);font-size:12px;margin-top:4px">🗓️ Aberto em ${item.dataCriacao}</p>`:''}
      </div>`;
    }).join('');
  }

  window.hcSetFiltro = function (f) { _filtro = f; const todos = window._hcItens||[]; renderFiltros(todos); renderLista(todos); };

  function criarFlocos(id) { const c = document.getElementById(id); if (!c) return; for (let i = 0; i < 8; i++) { const f = document.createElement('span'); f.className = 'floco'; f.textContent = '❄'; f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`; c.appendChild(f); } }

  Router.registrarMount('historicoCliente', render);
})();
