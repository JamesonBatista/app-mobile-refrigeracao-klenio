// js/screens/aprovarOrcamento.js

(function () {
  let diaSelecionado = null, horarioSelecionado = null, diasLotados = {};

  function render() {
    const orc = State.get('orcamentoParaAprovar');
    const usuario = State.get('usuarioLogado');
    const el = document.getElementById('tela-aprovarOrcamento');

    el.innerHTML = `
      <div class="flocos-fundo"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Aprovar Orçamento</span></div>
          <button class="btn-voltar" onclick="setTela('meusOrcamentos')">← Voltar</button>
        </div>

        <div class="card" style="margin-bottom:20px;">
          <div style="display:flex;align-items:center;gap:10px;background:rgba(39,174,96,0.1);border-radius:10px;padding:10px;border:1px solid rgba(39,174,96,0.3);margin-bottom:14px;">
            <span style="font-size:20px;">✅</span>
            <div><p style="color:#27ae60;font-size:13px;font-weight:700;">Aprovando orçamento</p><p style="color:rgba(180,220,255,0.6);font-size:12px;">${orc?.numero}</p></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;"><span style="color:rgba(180,220,255,0.5);font-size:13px;">Serviço</span><span style="color:#fff;font-size:13px;">${orc?.tipoServico}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:rgba(180,220,255,0.5);font-size:13px;">Aparelho</span><span style="color:#fff;font-size:13px;">${orc?.tipoAparelho}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:rgba(180,220,255,0.5);font-size:13px;">Endereço</span><span style="color:#fff;font-size:13px;">${orc?.endereco}</span></div>
            <div style="background:rgba(142,68,173,0.1);border-radius:8px;padding:10px;border:1px solid rgba(142,68,173,0.3);display:flex;justify-content:space-between;align-items:center;">
              <span style="color:#8e44ad;font-size:13px;font-weight:700;">💰 Valor aprovado</span>
              <span style="color:#fff;font-size:18px;font-weight:700;">R$ ${orc?.valorOrcamento}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Escolha o dia <span style="color:#e74c3c">*</span></p>
          <p class="subtitulo">Selecione o melhor dia disponível</p>
          <div class="calendario-scroll" id="cal-dias"></div>
          <div id="horarios-wrap" style="margin-top:16px;display:none;">
            <p class="subtitulo">Horários disponíveis</p>
            <div id="horarios-lista"></div>
          </div>
        </div>

        <button id="btn-confirmar-aprov" class="btn-primary btn-green" style="margin-top:20px;">✅ Confirmar e Abrir Chamado</button>
        <div style="height:20px;"></div>
      </div>`;

    diaSelecionado = null; horarioSelecionado = null; diasLotados = {};
    const dias = getProximosDias();

    // Verifica dias lotados
    Promise.all(dias.map(async d => {
      const h = await getHorariosDisponiveis(d);
      if (h.length === 0) diasLotados[formatarDataChave(d)] = true;
    })).then(() => renderCalendario(dias));

    function renderCalendario(dias) {
      const cont = el.querySelector('#cal-dias');
      cont.innerHTML = dias.map(d => {
        const chave = formatarDataChave(d);
        const lotado = diasLotados[chave];
        const sab = isSabado(d);
        return `
          <div class="dia-btn ${lotado?'lotado':''}" data-chave="${chave}" onclick="selecionarDiaAprov(this,'${chave}')">
            <span class="dia-semana ${sab?'sabado':''}">${d.toLocaleDateString('pt-BR',{weekday:'short'})}</span>
            <span class="dia-numero ${lotado?'lotado':''}">${d.getDate()}</span>
            <span class="dia-mes">${d.toLocaleDateString('pt-BR',{month:'short'})}</span>
            ${lotado?`<span class="dia-label" style="color:#e74c3c;">Lotado</span>`:''}
          </div>`;
      }).join('');
    }

    window.selecionarDiaAprov = async (btn, chave) => {
      if (diasLotados[chave]) return;
      el.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      diaSelecionado = dias.find(d => formatarDataChave(d) === chave);
      horarioSelecionado = null;

      const wrap = el.querySelector('#horarios-wrap');
      const lista = el.querySelector('#horarios-lista');
      wrap.style.display = 'block';
      lista.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div>';

      const disponiveis = await getHorariosDisponiveis(diaSelecionado);
      lista.innerHTML = disponiveis.length === 0
        ? '<p style="color:rgba(180,220,255,0.5);font-size:13px;text-align:center;">❄ Nenhum horário disponível</p>'
        : disponiveis.map(h => `
            <button class="horario-btn" onclick="selecionarHorarioAprov(this,'${h}')">
              <div style="display:flex;align-items:center;gap:12px;"><span>🕐</span><span style="font-size:14px;font-weight:600;color:#fff;">${h}</span></div>
            </button>`).join('');
    };

    window.selecionarHorarioAprov = (btn, h) => {
      el.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      horarioSelecionado = h;
    };

    el.querySelector('#btn-confirmar-aprov').addEventListener('click', async () => {
      if (!diaSelecionado || !horarioSelecionado) { alert('Selecione o dia e horário.'); return; }
      const btn = el.querySelector('#btn-confirmar-aprov');
      btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div>';

      await atualizarOrcamento(orc.numero, { status: 'Aprovado' });
      const chamado = {
        numero: '#' + Math.floor(Math.random() * 90000 + 10000),
        tipos: [orc.tipoServico],
        endereco: orc.endereco,
        dataFormatada: formatarData(diaSelecionado),
        dataChave: formatarDataChave(diaSelecionado),
        horario: horarioSelecionado,
        detalhes: `Gerado do orçamento aprovado ${orc.numero}.\nServiço: ${orc.tipoServico}\nAparelho: ${orc.tipoAparelho}\nValor aprovado: R$ ${orc.valorOrcamento}`,
        status: 'Aguardando técnico',
        cliente: orc.cliente, clienteEmail: orc.clienteEmail, clienteTelefone: orc.clienteTelefone||'',
        observacaoTecnica: '', tecnico: '',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        geradoDeOrcamento: orc.numero, tipoServico: orc.tipoServico,
        tipoAparelho: orc.tipoAparelho, btu: orc.btu, quantidade: orc.quantidade,
        metragem: orc.metragem, valorOrcamento: orc.valorOrcamento,
      };
      await salvarChamado(chamado);
      alert(`✅ Orçamento aprovado!\nSeu chamado foi criado para ${formatarData(diaSelecionado)} às ${horarioSelecionado}.`);
      setTela('acompanharChamado');
    });
  }

  Router.registrarMount('aprovarOrcamento', render);
})();
