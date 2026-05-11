// js/screens/painelAdmin.js

(function () {
  const STATUS = {
    'Aguardando técnico': { icone:'⏳', cor:'#f39c12' },
    'Aceito':             { icone:'✅', cor:'#27ae60' },
    'Em atendimento':     { icone:'🔧', cor:'#2980b9' },
    'Concluído':          { icone:'🏁', cor:'#8e44ad' },
    'Cancelado':          { icone:'❌', cor:'#e74c3c' },
    'Agendado':           { icone:'📅', cor:'#f39c12' },
    'Contestado':         { icone:'⚠️', cor:'#e67e22' },
    'Respondido':         { icone:'💬', cor:'#2980b9' },
  };

  let _unsubs = [];
  let _chamadosPendentes = [], _chamadosAtivos = [], _chamadosConcluidos = [], _programados = [];
  let _aba = 'pendentes';
  let _busca = '';
  let _totalOrcPendentes = 0;

  function render() {
    _aba = 'pendentes'; _busca = '';
    const el = document.getElementById('tela-painelAdmin');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div>
            <span class="header-empresa">Klenio Refrigeração</span>
            <span class="header-nome">Painel Admin</span>
          </div>
          <button class="btn-voltar" onclick="setTela('sair')">🚪 Sair</button>
        </div>

        <!-- Cards de acesso rápido -->
        <div class="principais-row" style="flex-wrap:wrap;gap:10px;margin-bottom:16px">
          ${adminCard('📋','Orçamentos','orcamentoAdmin','badge-orc-admin')}
          ${adminCard('📅','Agenda','agendaAdmin','')}
          ${adminCard('👷','Profissionais','profissionais','')}
          ${adminCard('📊','Relatório','relatorio','')}
          ${adminCard('💬','Falar Cliente','falarCliente','')}
          ${adminCard('🗓️','Programado','abrirProgramado','')}
        </div>

        <!-- Busca -->
        <div class="input-wrap" style="margin-bottom:12px">
          <span class="input-icone">🔍</span>
          <input id="pa-busca" type="text" placeholder="Buscar por cliente ou número..." oninput="paBuscar(this.value)" />
        </div>

        <!-- Abas -->
        <div class="pa-abas" id="pa-abas">
          ${abaBtn('pendentes','⏳ Pendentes')}
          ${abaBtn('ativos','✅ Ativos')}
          ${abaBtn('programados','🛠️ Programados')}
          ${abaBtn('concluidos','🏁 Concluídos')}
        </div>

        <!-- Lista -->
        <div id="pa-lista"><div class="spinner" style="margin:40px auto"></div></div>
        <div style="height:20px"></div>
      </div>
    `;

    _unsubs.forEach(u => u && u());
    _unsubs = [];

    _unsubs.push(ouvirChamados(lista => {
      const visiveis = lista.filter(c => !c.excluidoPorAdmin);
      _chamadosPendentes = visiveis.filter(c => c.status === 'Aguardando técnico').sort((a,b) => a.urgencia === 'Urgente' ? -1 : 1);
      _chamadosAtivos    = visiveis.filter(c => ['Aceito','Em atendimento'].includes(c.status)).sort((a,b) => a.urgencia === 'Urgente' ? -1 : 1);
      _chamadosConcluidos= visiveis.filter(c => ['Concluído','Cancelado'].includes(c.status));
      atualizarAbaBadge('pendentes', _chamadosPendentes.length);
      atualizarAbaBadge('ativos', _chamadosAtivos.length);
      renderLista();
    }));

    _unsubs.push(ouvirTodosProgramados(lista => {
      _programados = lista.filter(p => !['Cancelado','Concluído'].includes(p.status));
      atualizarAbaBadge('programados', _programados.filter(p => p.status === 'Contestado').length);
      renderLista();
    }));

    _unsubs.push(ouvirTodosOrcamentos(lista => {
      _totalOrcPendentes = lista.filter(o => ['Aguardando análise','Em análise'].includes(o.status)).length;
      const b = document.getElementById('badge-orc-admin');
      if (b) { b.textContent = _totalOrcPendentes; b.style.display = _totalOrcPendentes > 0 ? 'flex' : 'none'; }
    }));

    selecionarAba('pendentes');
  }

  function adminCard(icone, titulo, tela, badgeId) {
    return `
      <button onclick="setTela('${tela}')" style="position:relative;flex:1;min-width:calc(33% - 8px);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer">
        <span style="font-size:22px">${icone}</span>
        <span style="font-size:11px;color:rgba(180,220,255,0.7);font-weight:600">${titulo}</span>
        ${badgeId ? `<span class="badge-count" id="${badgeId}" style="display:none;position:absolute;top:6px;right:6px"></span>` : ''}
      </button>`;
  }

  function abaBtn(key, label) {
    return `<button class="pa-aba-btn" id="pa-aba-${key}" onclick="paSetAba('${key}')">${label}</button>`;
  }

  function atualizarAbaBadge(key, n) {
    const el = document.getElementById(`pa-aba-${key}`);
    if (!el) return;
    const base = el.textContent.split('(')[0].trim();
    el.textContent = n > 0 ? `${base} (${n})` : base;
  }

  window.paSetAba = function (aba) { _aba = aba; selecionarAba(aba); renderLista(); };

  function selecionarAba(aba) {
    document.querySelectorAll('.pa-aba-btn').forEach(b => b.classList.remove('ativa'));
    document.getElementById(`pa-aba-${aba}`)?.classList.add('ativa');
  }

  window.paBuscar = function (v) { _busca = v.toLowerCase(); renderLista(); };

  function filtrar(lista) {
    if (!_busca) return lista;
    return lista.filter(c => c.cliente?.toLowerCase().includes(_busca) || c.numero?.toLowerCase().includes(_busca) || c.clienteEmail?.toLowerCase().includes(_busca));
  }

  function renderLista() {
    const cont = document.getElementById('pa-lista');
    if (!cont) return;
    let lista = [];
    if (_aba === 'pendentes')   lista = filtrar(_chamadosPendentes);
    if (_aba === 'ativos')      lista = filtrar(_chamadosAtivos);
    if (_aba === 'concluidos')  lista = filtrar(_chamadosConcluidos);
    if (_aba === 'programados') lista = filtrar(_programados);

    if (lista.length === 0) {
      cont.innerHTML = `<div class="empty-state"><span class="icone">📋</span><p class="titulo">Nenhum registro</p></div>`; return;
    }

    if (_aba === 'programados') {
      cont.innerHTML = lista.map((p, i) => cardProgramado(p, i)).join('');
    } else {
      cont.innerHTML = lista.map((c, i) => cardChamado(c, i)).join('');
    }
  }

  function cardChamado(c, i) {
    const s = STATUS[c.status] || STATUS['Aguardando técnico'];
    return `
      <div class="card" style="margin-bottom:12px;border-color:${s.cor}44;cursor:pointer" onclick="paVerChamado(${i})">
        ${c.urgencia === 'Urgente' ? '<div style="color:var(--red);font-size:11px;font-weight:700;margin-bottom:6px">🚨 URGENTE</div>' : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="color:var(--primary);font-weight:700;font-size:13px">${c.numero}</span>
          <span class="badge" style="background:${s.cor}22;color:${s.cor}">${s.icone} ${c.status}</span>
        </div>
        <p style="color:#fff;font-size:14px;font-weight:600;margin-bottom:4px">${c.cliente}</p>
        <p style="color:var(--text-muted);font-size:12px">${c.tipos?.join(', ')}</p>
        <p style="color:var(--text-muted);font-size:12px;margin-top:2px">📅 ${c.dataFormatada} • 🕐 ${c.horario}</p>
      </div>`;
  }

  function cardProgramado(p, i) {
    const s = STATUS[p.status] || STATUS['Agendado'];
    return `
      <div class="card" style="margin-bottom:12px;border-color:${s.cor}44">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="color:var(--primary);font-weight:700;font-size:13px">${p.numero}</span>
          <span class="badge" style="background:${s.cor}22;color:${s.cor}">${s.icone} ${p.status}</span>
        </div>
        <p style="color:#fff;font-size:14px;font-weight:600;margin-bottom:4px">${p.cliente}</p>
        <p style="color:var(--text-muted);font-size:12px">📅 ${p.dataFormatada} • 🕐 ${p.horario}</p>
        ${p.status === 'Contestado' ? `
          <div style="margin-top:10px;background:rgba(231,76,60,0.1);border-radius:8px;padding:10px;border:1px solid rgba(231,76,60,0.3)">
            <p style="color:var(--red);font-size:12px;font-weight:700;margin-bottom:4px">⚠️ Motivo da contestação:</p>
            <p style="color:rgba(180,220,255,0.7);font-size:12px">${p.historico?.slice(-1)[0]?.mensagem || ''}</p>
            <div style="margin-top:8px">
              <div class="input-wrap"><span class="input-icone">💬</span><input type="text" id="resp-${p.numero}" placeholder="Digite sua resposta..." /></div>
              <button class="btn-primary" style="margin-top:8px" onclick="paResponderContestacao('${p.numero}', '${p.clienteTelefone||''}')">💬 Responder</button>
            </div>
          </div>` : ''}
        <button class="btn-primary" style="margin-top:10px" onclick="paEditarProgramado(${i})">✏️ Editar programado</button>
      </div>`;
  }

  window.paVerChamado = function (i) {
    const lista = _aba === 'pendentes' ? _chamadosPendentes : _aba === 'ativos' ? _chamadosAtivos : _chamadosConcluidos;
    State.set('chamadoSelecionado', lista[i]);
    setTela('chamadoDetalhes');
  };

  window.paEditarProgramado = function (i) {
    State.set('programadoSelecionado', _programados[i]);
    setTela('editarProgramado');
  };

  window.paResponderContestacao = async function (numero, tel) {
    const resposta = document.getElementById(`resp-${numero}`)?.value.trim();
    if (!resposta) { alert('Digite a resposta.'); return; }
    await responderContestacao(numero, resposta);
    if (tel) notificarClienteRespostaContestacao(tel, { numero }, resposta);
    alert('Resposta enviada!');
  };

  Router.registrarMount('painelAdmin', render);
})();
