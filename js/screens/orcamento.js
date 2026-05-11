// js/screens/orcamento.js

(function () {
  const TIPOS_SERVICO = [
    { icone: '❄', label: 'Instalação de AR' }, { icone: '🔧', label: 'Manutenção preventiva' },
    { icone: '🔄', label: 'Substituição' }, { icone: '🏗️', label: 'Instalação nova' }, { icone: '📋', label: 'Outro' },
  ];
  const TIPOS_APARELHO = ['Split', 'Janela', 'Cassete', 'Piso Teto', 'Portátil'];
  const BTUS = ['Não sei', '9.000', '12.000', '18.000', '24.000', '36.000'];

  function gerarNumero() { return '#O' + Math.floor(Math.random() * 90000 + 10000); }

  function render() {
    const usuario = State.get('usuarioLogado');
    const el = document.getElementById('tela-orcamento');
    el.innerHTML = `
      <div class="flocos-fundo" id="flocos-orc"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Solicitar Orçamento</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>

        <div class="card">
          <p class="titulo">Tipo de serviço <span style="color:#e74c3c">*</span></p>
          <p class="subtitulo">Selecione o(s) serviço(s) desejado(s)</p>
          <div id="tipos-servico">
            ${TIPOS_SERVICO.map(t => `
              <button class="opcao-btn" data-servico="${t.label}" onclick="toggleServico(this)">
                <div class="opcao-check"></div>
                <span style="font-size:18px;">${t.icone}</span>
                <span style="color:#fff;font-size:14px;">${t.label}</span>
              </button>`).join('')}
          </div>
        </div>

        <div class="card">
          <p class="titulo">Aparelho <span style="color:#e74c3c">*</span></p>
          <div id="tipos-aparelho" style="display:flex;flex-wrap:wrap;gap:8px;">
            ${TIPOS_APARELHO.map(a => `
              <button class="opcao-btn" data-aparelho="${a}" style="width:auto;padding:8px 14px;" onclick="toggleAparelho(this)">
                <span style="color:#fff;font-size:13px;">${a}</span>
              </button>`).join('')}
          </div>

          <label class="label">BTUs</label>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
            ${BTUS.map(b => `
              <button class="opcao-btn" data-btu="${b}" style="width:auto;padding:8px 14px;" onclick="toggleBtu(this)">
                <span style="color:#fff;font-size:13px;">${b}</span>
              </button>`).join('')}
          </div>

          <label class="label">Quantidade de aparelhos</label>
          <div class="input-wrap">
            <span class="input-icone">🔢</span>
            <input id="orc-quantidade" type="number" value="1" min="1" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>

          <label class="label">Metragem do ambiente (opcional)</label>
          <div class="input-wrap">
            <span class="input-icone">📐</span>
            <input id="orc-metragem" type="text" placeholder="Ex: 20m²" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <p class="titulo">Endereço <span style="color:#e74c3c">*</span></p>
            <button id="btn-editar-end" onclick="toggleEnderecoOrc()" style="background:none;border:none;color:#38b6ff;font-size:13px;cursor:pointer;">✏️ Editar</button>
          </div>
          <div id="end-display" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
            <span>📍</span><span id="end-texto" style="color:#fff;font-size:14px;">${usuario?.endereco||''}</span>
          </div>
          <div id="end-input" style="display:none;">
            <div class="input-wrap"><span class="input-icone">📍</span>
              <input id="orc-endereco" type="text" value="${usuario?.endereco||''}" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" /></div>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Detalhes adicionais</p>
          <textarea id="orc-detalhes" class="input-area" placeholder="Descreva melhor o que você precisa..."></textarea>
        </div>

        <button id="btn-solicitar-orc" class="btn-primary btn-green" style="margin-top:20px;">📋 Solicitar Orçamento</button>
        <div style="height:20px;"></div>
      </div>`;

    const tiposServico = new Set(), tiposAparelho = new Set();
    let btuSelecionado = null;

    window.toggleServico = (btn) => {
      btn.classList.toggle('selecionado');
      const v = btn.dataset.servico;
      tiposServico.has(v) ? tiposServico.delete(v) : tiposServico.add(v);
    };
    window.toggleAparelho = (btn) => {
      el.querySelectorAll('[data-aparelho]').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado'); tiposAparelho.clear(); tiposAparelho.add(btn.dataset.aparelho);
    };
    window.toggleBtu = (btn) => {
      el.querySelectorAll('[data-btu]').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado'); btuSelecionado = btn.dataset.btu;
    };
    window.toggleEnderecoOrc = () => {
      const show = el.querySelector('#end-input').style.display === 'none';
      el.querySelector('#end-input').style.display = show ? 'block' : 'none';
      el.querySelector('#end-display').style.display = show ? 'none' : 'flex';
      el.querySelector('#btn-editar-end').textContent = show ? '✕ Cancelar' : '✏️ Editar';
    };

    el.querySelector('#btn-solicitar-orc').addEventListener('click', async () => {
      if (tiposServico.size === 0) { alert('Selecione pelo menos um tipo de serviço.'); return; }
      if (tiposAparelho.size === 0) { alert('Selecione o tipo de aparelho.'); return; }
      const endereco = (el.querySelector('#orc-endereco').value || usuario?.endereco || '').trim();
      if (!endereco) { alert('Informe o endereço.'); return; }

      const btn = el.querySelector('#btn-solicitar-orc');
      btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div>';

      const agora = new Date();
      const orcamento = {
        numero: gerarNumero(),
        tipoServico: [...tiposServico].join(', '),
        tipoAparelho: [...tiposAparelho][0],
        btu: btuSelecionado || 'Não informado',
        quantidade: el.querySelector('#orc-quantidade').value || '1',
        metragem: el.querySelector('#orc-metragem').value || 'Não informado',
        endereco,
        detalhes: el.querySelector('#orc-detalhes').value,
        status: 'Aguardando análise',
        cliente: usuario.nome,
        clienteEmail: usuario.email,
        clienteTelefone: usuario.telefone || '',
        dataCriacao: agora.toLocaleDateString('pt-BR'),
        dataFormatada: agora.toLocaleDateString('pt-BR'),
        horario: agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }),
      };

      await salvarOrcamento(orcamento);
      notificarAdminNovoOrcamento(orcamento);
      alert(`✅ Orçamento ${orcamento.numero} enviado com sucesso!`);
      setTela('meusOrcamentos');
    });
  }

  Router.registrarMount('orcamento', render);
})();
