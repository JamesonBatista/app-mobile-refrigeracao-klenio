// js/screens/abrirProgramado.js

(function () {
  const TIPOS = [
    { icone: '❄', label: 'Não está gelando' }, { icone: '💧', label: 'Vazando água' },
    { icone: '🔊', label: 'Fazendo barulho' }, { icone: '⚡', label: 'Não liga' },
    { icone: '🌡️', label: 'Temp. irregular' }, { icone: '🔧', label: 'Manutenção' },
  ];
  let diaSelecionado = null, horarioSelecionado = null, diasLotados = {};

  function render() {
    const el = document.getElementById('tela-abrirProgramado');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Abrir Programado</span></div>
          <button class="btn-voltar" onclick="setTela('painelAdmin')">← Voltar</button>
        </div>

        <div class="card">
          <p class="titulo">Buscar cliente <span style="color:#e74c3c">*</span></p>
          <div class="input-wrap"><span class="input-icone">🔍</span>
            <input id="prog-busca" type="text" placeholder="Nome ou e-mail..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>
          <div id="prog-clientes-lista" style="margin-top:8px;"></div>
          <div id="prog-cliente-selecionado" style="display:none;margin-top:12px;background:rgba(39,174,96,0.1);border-radius:10px;border:1px solid rgba(39,174,96,0.3);padding:12px;">
            <p id="prog-cliente-nome" style="color:#fff;font-size:14px;font-weight:700;"></p>
            <p id="prog-cliente-email" style="color:rgba(180,220,255,0.6);font-size:12px;"></p>
            <p id="prog-cliente-tel" style="color:#25D366;font-size:12px;font-weight:600;"></p>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Tipo de serviço <span style="color:#e74c3c">*</span></p>
          <div id="prog-tipos">
            ${TIPOS.map(t => `
              <button class="opcao-btn" data-tipo="${t.label}" onclick="this.classList.toggle('selecionado')">
                <div class="opcao-check"></div>
                <span style="font-size:18px;">${t.icone}</span>
                <span style="color:#fff;font-size:14px;">${t.label}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="card">
          <p class="titulo">Data e horário <span style="color:#e74c3c">*</span></p>
          <div class="calendario-scroll" id="prog-cal"></div>
          <div id="prog-horarios-wrap" style="margin-top:16px;display:none;">
            <p class="subtitulo">Horários disponíveis</p>
            <div id="prog-horarios-lista"></div>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Endereço <span style="color:#e74c3c">*</span></p>
          <div class="input-wrap"><span class="input-icone">📍</span>
            <input id="prog-endereco" type="text" placeholder="Endereço do cliente..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>
          <p class="titulo" style="margin-top:16px;">Observações</p>
          <textarea id="prog-detalhes" class="input-area" placeholder="Detalhes do serviço..."></textarea>
        </div>

        <button id="btn-salvar-prog" class="btn-primary" style="margin-top:20px;">📅 Criar Programado</button>
        <div style="height:20px;"></div>
      </div>`;

    let clienteSelecionado = null;
    const dias = getProximosDias();

    // Calendário
    const calCont = el.querySelector('#prog-cal');
    calCont.innerHTML = dias.map(d => {
      const chave = formatarDataChave(d);
      const sab = isSabado(d);
      return `<div class="dia-btn" data-chave="${chave}" onclick="selecionarDiaProg(this,'${chave}')">
        <span class="dia-semana ${sab?'sabado':''}">${d.toLocaleDateString('pt-BR',{weekday:'short'})}</span>
        <span class="dia-numero">${d.getDate()}</span>
        <span class="dia-mes">${d.toLocaleDateString('pt-BR',{month:'short'})}</span>
      </div>`;
    }).join('');

    window.selecionarDiaProg = async (btn, chave) => {
      el.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      diaSelecionado = dias.find(d => formatarDataChave(d) === chave);
      horarioSelecionado = null;
      const wrap = el.querySelector('#prog-horarios-wrap');
      const lista = el.querySelector('#prog-horarios-lista');
      wrap.style.display = 'block';
      lista.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div>';
      const disponiveis = await getHorariosDisponiveis(diaSelecionado);
      lista.innerHTML = disponiveis.length === 0
        ? '<p style="color:rgba(180,220,255,0.5);text-align:center;">❄ Nenhum horário disponível</p>'
        : disponiveis.map(h => `<button class="horario-btn" onclick="selecionarHorarioProg(this,'${h}')"><div style="display:flex;gap:12px;align-items:center;"><span>🕐</span><span style="color:#fff;font-weight:600;">${h}</span></div></button>`).join('');
    };

    window.selecionarHorarioProg = (btn, h) => {
      el.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado'); horarioSelecionado = h;
    };

    // Busca cliente
    let todosClientes = [];
    carregarClientes().then(lista => { todosClientes = lista; });

    el.querySelector('#prog-busca').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtrados = todosClientes.filter(c => c.nome?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
      const lista = el.querySelector('#prog-clientes-lista');
      if (!q || clienteSelecionado) { lista.innerHTML = ''; return; }
      lista.innerHTML = filtrados.slice(0,5).map(c => `
        <div onclick="selecionarClienteProg('${c.email}')" style="padding:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="color:#fff;font-size:13px;font-weight:600;">${c.nome}</p>
          <p style="color:rgba(180,220,255,0.5);font-size:11px;">${c.email}</p>
        </div>`).join('');
    });

    window.selecionarClienteProg = (email) => {
      clienteSelecionado = todosClientes.find(c => c.email === email);
      el.querySelector('#prog-busca').value = clienteSelecionado.nome;
      el.querySelector('#prog-clientes-lista').innerHTML = '';
      el.querySelector('#prog-cliente-selecionado').style.display = 'block';
      el.querySelector('#prog-cliente-nome').textContent = clienteSelecionado.nome;
      el.querySelector('#prog-cliente-email').textContent = clienteSelecionado.email;
      el.querySelector('#prog-cliente-tel').textContent = clienteSelecionado.telefone ? `📱 ${clienteSelecionado.telefone}` : '⚠️ Sem telefone';
      el.querySelector('#prog-endereco').value = clienteSelecionado.endereco || '';
    };

    el.querySelector('#btn-salvar-prog').addEventListener('click', async () => {
      if (!clienteSelecionado) { alert('Selecione um cliente.'); return; }
      const tipos = [...el.querySelectorAll('[data-tipo].selecionado')].map(b => b.dataset.tipo);
      if (tipos.length === 0) { alert('Selecione o tipo de serviço.'); return; }
      if (!diaSelecionado || !horarioSelecionado) { alert('Selecione data e horário.'); return; }
      const endereco = el.querySelector('#prog-endereco').value.trim();
      if (!endereco) { alert('Informe o endereço.'); return; }

      const btn = el.querySelector('#btn-salvar-prog');
      btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div>';

      const programado = {
        numero: '#P' + Math.floor(Math.random() * 90000 + 10000),
        tipo: tipos.join(', '), tipos,
        endereco, detalhes: el.querySelector('#prog-detalhes').value,
        dataFormatada: formatarData(diaSelecionado),
        dataChave: formatarDataChave(diaSelecionado),
        horario: horarioSelecionado,
        status: 'Agendado',
        cliente: clienteSelecionado.nome, clienteEmail: clienteSelecionado.email,
        clienteTelefone: clienteSelecionado.telefone || '',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
      };

      await salvarProgramado(programado);
      notificarClienteProgramadoCriado(clienteSelecionado.telefone, programado);
      alert(`✅ Programado ${programado.numero} criado com sucesso!`);
      setTela('painelAdmin');
    });
  }

  Router.registrarMount('abrirProgramado', render);
})();
