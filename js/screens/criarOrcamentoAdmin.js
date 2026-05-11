// js/screens/criarOrcamentoAdmin.js

(function () {
  const TIPOS_SERVICO = ['Instalação de AR','Manutenção preventiva','Substituição','Instalação nova','Outro'];
  const TIPOS_APARELHO = ['Split','Janela','Cassete','Piso Teto','Portátil'];
  const BTUS = ['Não sei','9.000','12.000','18.000','24.000','36.000'];

  function render() {
    const el = document.getElementById('tela-criarOrcamentoAdmin');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Criar Orçamento</span></div>
          <button class="btn-voltar" onclick="setTela('orcamentoAdmin')">← Voltar</button>
        </div>

        <div class="card">
          <p class="titulo">Cliente <span style="color:#e74c3c">*</span></p>
          <div class="input-wrap"><span class="input-icone">🔍</span>
            <input id="coa-busca" type="text" placeholder="Buscar cliente..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;"/>
          </div>
          <div id="coa-lista"></div>
          <div id="coa-selecionado" style="display:none;margin-top:12px;background:rgba(39,174,96,0.1);border-radius:10px;border:1px solid rgba(39,174,96,0.3);padding:12px;">
            <p id="coa-cli-nome" style="color:#fff;font-size:14px;font-weight:700;"></p>
            <p id="coa-cli-email" style="color:rgba(180,220,255,0.6);font-size:12px;"></p>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Tipo de serviço <span style="color:#e74c3c">*</span></p>
          <div id="coa-servicos" style="display:flex;flex-wrap:wrap;gap:8px;">
            ${TIPOS_SERVICO.map(t=>`<button class="opcao-btn" data-ts="${t}" style="width:auto;padding:8px 14px;" onclick="this.classList.toggle('selecionado')"><span style="color:#fff;font-size:13px;">${t}</span></button>`).join('')}
          </div>
          <p class="titulo" style="margin-top:14px;">Aparelho <span style="color:#e74c3c">*</span></p>
          <div id="coa-aparelhos" style="display:flex;flex-wrap:wrap;gap:8px;">
            ${TIPOS_APARELHO.map(a=>`<button class="opcao-btn" data-ta="${a}" style="width:auto;padding:8px 14px;" onclick="toggleUnico(this,'[data-ta]')">${a}</button>`).join('')}
          </div>
          <p class="titulo" style="margin-top:14px;">BTUs</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${BTUS.map(b=>`<button class="opcao-btn" data-btu="${b}" style="width:auto;padding:8px 14px;" onclick="toggleUnico(this,'[data-btu]')">${b}</button>`).join('')}
          </div>
          <label class="label">Quantidade</label>
          <div class="input-wrap"><span class="input-icone">🔢</span>
            <input id="coa-qtd" type="number" value="1" min="1" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;"/>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Valor do orçamento (R$) <span style="color:#e74c3c">*</span></p>
          <div class="input-wrap"><span class="input-icone">💰</span>
            <input id="coa-valor" type="text" placeholder="Ex: 350,00" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;"/>
          </div>
          <label class="label">Descrição</label>
          <textarea id="coa-desc" class="input-area" placeholder="Detalhes do serviço..."></textarea>
          <label class="label">Endereço</label>
          <div class="input-wrap"><span class="input-icone">📍</span>
            <input id="coa-end" type="text" placeholder="Endereço do cliente..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;"/>
          </div>
        </div>

        <button id="btn-criar-orc" class="btn-primary" style="margin-top:20px;">💰 Criar e enviar orçamento</button>
        <div style="height:20px;"></div>
      </div>`;

    let clienteSelecionado = null;
    let todosClientes = [];
    carregarClientes().then(l => { todosClientes = l; });

    window.toggleUnico = (btn, sel) => {
      el.querySelectorAll(sel).forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
    };

    el.querySelector('#coa-busca').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const lista = el.querySelector('#coa-lista');
      if (!q || clienteSelecionado) { lista.innerHTML=''; return; }
      lista.innerHTML = todosClientes.filter(c=>c.nome?.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q)).slice(0,5).map(c=>`
        <div onclick="selecionarCliOrc('${c.email}')" style="padding:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="color:#fff;font-size:13px;font-weight:600;">${c.nome}</p>
          <p style="color:rgba(180,220,255,0.5);font-size:11px;">${c.email}</p>
        </div>`).join('');
    });

    window.selecionarCliOrc = (email) => {
      clienteSelecionado = todosClientes.find(c=>c.email===email);
      el.querySelector('#coa-busca').value = clienteSelecionado.nome;
      el.querySelector('#coa-lista').innerHTML = '';
      el.querySelector('#coa-selecionado').style.display='block';
      el.querySelector('#coa-cli-nome').textContent = clienteSelecionado.nome;
      el.querySelector('#coa-cli-email').textContent = clienteSelecionado.email;
      el.querySelector('#coa-end').value = clienteSelecionado.endereco||'';
    };

    el.querySelector('#btn-criar-orc').addEventListener('click', async () => {
      if (!clienteSelecionado) { alert('Selecione um cliente.'); return; }
      const servicos = [...el.querySelectorAll('[data-ts].selecionado')].map(b=>b.dataset.ts);
      const aparelhoEl = el.querySelector('[data-ta].selecionado');
      const btuEl = el.querySelector('[data-btu].selecionado');
      const valor = el.querySelector('#coa-valor').value.trim();
      if (!servicos.length||!aparelhoEl||!valor) { alert('Preencha os campos obrigatórios.'); return; }

      const btn = el.querySelector('#btn-criar-orc');
      btn.disabled=true; btn.innerHTML='<div class="spinner" style="width:20px;height:20px;margin:0 auto;"></div>';

      const orcamento = {
        numero: '#O'+Math.floor(Math.random()*90000+10000),
        tipoServico: servicos.join(', '), tipoAparelho: aparelhoEl.dataset.ta,
        btu: btuEl?.dataset.btu||'Não informado',
        quantidade: el.querySelector('#coa-qtd').value||'1',
        metragem: 'Não informado',
        endereco: el.querySelector('#coa-end').value||clienteSelecionado.endereco||'',
        detalhes: el.querySelector('#coa-desc').value,
        status: 'Orçamento enviado',
        valorOrcamento: valor,
        descricaoAdmin: el.querySelector('#coa-desc').value,
        cliente: clienteSelecionado.nome, clienteEmail: clienteSelecionado.email,
        clienteTelefone: clienteSelecionado.telefone||'',
        dataCriacao: new Date().toLocaleDateString('pt-BR'),
        dataFormatada: new Date().toLocaleDateString('pt-BR'),
        horario: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
        criadoPeloAdmin: true,
      };
      await salvarOrcamento(orcamento);
      if (clienteSelecionado.telefone) notificarClienteOrcamentoEnviado(clienteSelecionado.telefone, orcamento);
      alert('✅ Orçamento criado e enviado ao cliente!');
      setTela('orcamentoAdmin');
    });
  }

  Router.registrarMount('criarOrcamentoAdmin', render);
})();
