// js/screens/abrirChamado.js

(function () {
  const TIPOS = [
    { icone: '❄', label: 'Não está gelando' },
    { icone: '💧', label: 'Vazando água' },
    { icone: '🔊', label: 'Fazendo barulho' },
    { icone: '⚡', label: 'Não liga' },
    { icone: '🌡️', label: 'Temp. irregular' },
    { icone: '🔧', label: 'Manutenção' },
  ];

  let tiposSelecionados = [];
  let diaSelecionado = null;
  let horario = null;
  let diasLotados = {};
  let horariosDisponiveis = [];

  function render() {
    const usuario = State.get('usuarioLogado');
    tiposSelecionados = []; diaSelecionado = null; horario = null;
    diasLotados = {}; horariosDisponiveis = [];

    const el = document.getElementById('tela-abrirChamado');
    el.innerHTML = `
      <div class="flocos-fundo" id="ac-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Abrir Chamado</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>

        <!-- Tipos de problema -->
        <div class="card">
          <p class="titulo">Tipo de problema <span style="color:var(--red)">*</span></p>
          <p class="subtitulo">Selecione um ou mais problemas</p>
          <div id="ac-tipos"></div>
          <div id="ac-outro-wrap" style="display:none;margin-top:8px">
            <div class="input-wrap">
              <span class="input-icone">✏️</span>
              <input id="ac-outro-input" type="text" placeholder="Descreva o problema..." />
            </div>
          </div>
        </div>

        <!-- Endereço -->
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <p class="titulo" style="margin:0">Endereço <span style="color:var(--red)">*</span></p>
            <button class="btn-link" style="margin:0" id="ac-editar-btn" onclick="acToggleEndereco()">✏️ Editar</button>
          </div>
          <div id="ac-end-display" class="ac-end-display">
            <span>📍</span><span id="ac-end-texto">${usuario?.endereco || ''}</span>
          </div>
          <div id="ac-end-input-wrap" style="display:none">
            <div class="input-wrap">
              <span class="input-icone">📍</span>
              <input id="ac-endereco" type="text" value="${usuario?.endereco || ''}" placeholder="Digite o endereço" />
            </div>
          </div>
        </div>

        <!-- Calendário -->
        <div class="card">
          <p class="titulo">Dia do atendimento <span style="color:var(--red)">*</span></p>
          <p class="subtitulo">Selecione o melhor dia disponível</p>
          <div class="calendario-scroll" id="ac-calendario"></div>
          <div id="ac-horarios-wrap" style="display:none;margin-top:16px">
            <p class="subtitulo">Horários disponíveis</p>
            <div id="ac-horarios"></div>
          </div>
        </div>

        <!-- Detalhes -->
        <div class="card">
          <p class="titulo">Detalhes adicionais</p>
          <p class="subtitulo">Opcional — descreva melhor o problema</p>
          <textarea id="ac-detalhes" class="input-area" placeholder="Ex: O ar não gela bem no período da tarde..."></textarea>
        </div>

        <button class="btn-primary" id="ac-btn" onclick="acEnviar()">🔧 Abrir Chamado</button>
        <div style="height:20px"></div>
      </div>
    `;

    criarFlocos('ac-flocos');
    renderTipos();
    carregarDias();
  }

  function renderTipos() {
    const wrap = document.getElementById('ac-tipos');
    if (!wrap) return;
    wrap.innerHTML = TIPOS.map((t, i) => `
      <button class="opcao-btn" id="ac-tipo-${i}" onclick="acToggleTipo(${i}, '${t.label}')">
        <div class="opcao-check" id="ac-check-${i}"></div>
        <span>${t.icone} ${t.label}</span>
      </button>
    `).join('') + `
      <button class="opcao-btn" id="ac-tipo-outro" onclick="acToggleOutro()">
        <div class="opcao-check" id="ac-check-outro"></div>
        <span>✏️ Outro</span>
      </button>
    `;
  }

  window.acToggleTipo = function (i, label) {
    const idx = tiposSelecionados.indexOf(label);
    if (idx >= 0) tiposSelecionados.splice(idx, 1);
    else tiposSelecionados.push(label);
    const btn = document.getElementById(`ac-tipo-${i}`);
    const chk = document.getElementById(`ac-check-${i}`);
    const sel = tiposSelecionados.includes(label);
    btn?.classList.toggle('selecionado', sel);
    if (chk) chk.textContent = sel ? '✓' : '';
  };

  window.acToggleOutro = function () {
    const wrap = document.getElementById('ac-outro-wrap');
    const btn  = document.getElementById('ac-tipo-outro');
    const chk  = document.getElementById('ac-check-outro');
    const show = wrap?.style.display === 'none';
    if (wrap) wrap.style.display = show ? 'block' : 'none';
    btn?.classList.toggle('selecionado', show);
    if (chk) chk.textContent = show ? '✓' : '';
  };

  window.acToggleEndereco = function () {
    const display = document.getElementById('ac-end-display');
    const inputW  = document.getElementById('ac-end-input-wrap');
    const btn     = document.getElementById('ac-editar-btn');
    const show = inputW?.style.display === 'none';
    if (display) display.style.display = show ? 'none' : 'flex';
    if (inputW)  inputW.style.display  = show ? 'block' : 'none';
    if (btn)     btn.textContent = show ? '✕ Cancelar' : '✏️ Editar';
  };

  async function carregarDias() {
    const dias = getProximosDias();
    const cal  = document.getElementById('ac-calendario');
    if (!cal) return;

    // Verifica dias lotados
    for (const dia of dias) {
      const hs = await getHorariosDisponiveis(dia);
      if (hs.length === 0) diasLotados[formatarDataChave(dia)] = true;
    }

    cal.innerHTML = dias.map((dia, i) => {
      const chave  = formatarDataChave(dia);
      const lotado = diasLotados[chave];
      const sab    = isSabado(dia);
      return `
        <button class="dia-btn${lotado?' lotado':''}" onclick="acSelecionarDia(${i})" data-idx="${i}" data-chave="${chave}">
          <span class="dia-semana${sab?' sabado':''}">${dia.toLocaleDateString('pt-BR',{weekday:'short'})}</span>
          <span class="dia-numero${lotado?' lotado':''}">${dia.getDate()}</span>
          <span class="dia-mes">${dia.toLocaleDateString('pt-BR',{month:'short'})}</span>
          ${lotado ? '<span class="dia-label" style="color:var(--red)">Lotado</span>' : ''}
        </button>
      `;
    }).join('');

    // Armazena dias para uso posterior
    window._acDias = dias;
  }

  window.acSelecionarDia = async function (idx) {
    const dias = window._acDias;
    if (!dias) return;
    const dia = dias[idx];
    const chave = formatarDataChave(dia);
    if (diasLotados[chave]) return;

    diaSelecionado = dia;
    horario = null;

    document.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('selecionado'));
    document.querySelector(`.dia-btn[data-idx="${idx}"]`)?.classList.add('selecionado');

    const wrap = document.getElementById('ac-horarios-wrap');
    const cont = document.getElementById('ac-horarios');
    if (wrap) wrap.style.display = 'block';
    if (cont) cont.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';

    horariosDisponiveis = await getHorariosDisponiveis(dia);

    if (!cont) return;
    if (horariosDisponiveis.length === 0) {
      cont.innerHTML = '<p style="color:var(--text-muted);text-align:center;font-size:13px">❄ Nenhum horário disponível neste dia</p>';
    } else {
      cont.innerHTML = horariosDisponiveis.map((h, i) => `
        <button class="horario-btn" onclick="acSelecionarHorario('${h}', ${i})" data-hidx="${i}">
          <div style="display:flex;align-items:center;gap:12px">
            <span>🕐</span>
            <span style="font-size:14px;font-weight:600">${h}</span>
          </div>
        </button>
      `).join('');
    }
  };

  window.acSelecionarHorario = function (h, idx) {
    horario = h;
    document.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selecionado'));
    document.querySelector(`.horario-btn[data-hidx="${idx}"]`)?.classList.add('selecionado');
  };

  window.acEnviar = async function () {
    const usuario  = State.get('usuarioLogado');
    const outroVal = document.getElementById('ac-outro-input')?.value.trim();
    const outroWrap= document.getElementById('ac-outro-wrap');
    const todos    = [...tiposSelecionados];
    if (outroWrap?.style.display !== 'none' && outroVal) todos.push(outroVal);

    const endTexto = document.getElementById('ac-endereco')?.value.trim()
      || document.getElementById('ac-end-texto')?.textContent.trim()
      || usuario?.endereco || '';
    const detalhes = document.getElementById('ac-detalhes')?.value.trim() || '';

    if (todos.length === 0) { alert('Selecione pelo menos um tipo de problema.'); return; }
    if (!endTexto) { alert('Informe o endereço.'); return; }
    if (!diaSelecionado) { alert('Selecione o dia do atendimento.'); return; }
    if (!horario) { alert('Selecione o horário.'); return; }

    const btn = document.getElementById('ac-btn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';

    const chamado = {
      numero: '#' + Math.floor(Math.random() * 90000 + 10000),
      tipos: todos,
      endereco: endTexto,
      dataFormatada: formatarData(diaSelecionado),
      dataChave: formatarDataChave(diaSelecionado),
      horario,
      detalhes,
      status: 'Aguardando técnico',
      cliente: usuario?.nome || '',
      clienteEmail: usuario?.email || '',
      clienteTelefone: usuario?.telefone || '',
      observacaoTecnica: '',
      tecnico: '',
      dataCriacao: new Date().toLocaleDateString('pt-BR'),
    };

    await salvarChamado(chamado);
    notificarAdminNovoChamado(chamado);

    try {
      const tokenAdmin = await buscarTokenAdmin();
      if (tokenAdmin) await enviarNotificacaoPush(tokenAdmin, '🔧 Novo chamado!', `${chamado.cliente} abriu o chamado ${chamado.numero}.`, { tela: 'painelAdmin' });
    } catch(e) {}

    alert(`Chamado ${chamado.numero} aberto com sucesso!`);
    setTela('acompanharChamado');
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

  Router.registrarMount('abrirChamado', render);
})();
