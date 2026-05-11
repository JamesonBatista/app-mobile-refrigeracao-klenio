// js/screens/falarCliente.js

(function () {
  function render() {
    const el = document.getElementById('tela-falarCliente');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Falar com Cliente</span></div>
          <button class="btn-voltar" onclick="setTela('painelAdmin')">← Voltar</button>
        </div>

        <div class="aviso-box verde" style="margin-bottom:16px;">
          <span style="font-size:20px;">💬</span>
          <p>A mensagem será enviada via WhatsApp com a identificação do Suporte Klenio Refrigeração.</p>
        </div>

        <div class="card">
          <p class="titulo">Selecionar cliente <span style="color:#e74c3c">*</span></p>
          <p class="subtitulo">Busque pelo nome ou e-mail</p>
          <div class="input-wrap"><span class="input-icone">🔍</span>
            <input id="fc-busca" type="text" placeholder="Buscar cliente..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;"/>
          </div>
          <div id="fc-lista" style="margin-top:8px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;display:none;"></div>
          <div id="fc-selecionado" style="display:none;margin-top:12px;background:rgba(39,174,96,0.1);border-radius:10px;border:1px solid rgba(39,174,96,0.3);padding:12px;">
            <p id="fc-cli-nome" style="color:#fff;font-size:14px;font-weight:700;"></p>
            <p id="fc-cli-email" style="color:rgba(180,220,255,0.6);font-size:12px;"></p>
            <p id="fc-cli-tel" style="color:#25D366;font-size:12px;font-weight:600;"></p>
          </div>
        </div>

        <div class="card" style="margin-top:14px;">
          <p class="titulo">Mensagem <span style="color:#e74c3c">*</span></p>
          <p class="subtitulo">O texto será enviado com a identificação do suporte</p>
          <div style="background:rgba(37,211,102,0.05);border-radius:10px;padding:12px;border:1px solid rgba(37,211,102,0.15);margin-bottom:12px;">
            <p style="color:rgba(180,220,255,0.4);font-size:11px;margin-bottom:6px;">Preview:</p>
            <p id="fc-preview" style="color:rgba(180,220,255,0.5);font-size:12px;line-height:18px;white-space:pre-line;">Olá, [Cliente]! 👋\n\nO Suporte Klenio Refrigeração tem uma mensagem para você:\n\n[sua mensagem aqui]\n\nKlenio Refrigeração ❄</p>
          </div>
          <textarea id="fc-mensagem" class="input-area" placeholder="Digite sua mensagem aqui..."></textarea>
        </div>

        <button id="btn-fc-enviar" class="btn-primary btn-whatsapp" style="margin-top:20px;">💬 Enviar via WhatsApp</button>
        <div style="height:20px;"></div>
      </div>`;

    let clienteSelecionado = null;
    let todosClientes = [];
    carregarClientes().then(l => { todosClientes = l; });

    el.querySelector('#fc-busca').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const listaEl = el.querySelector('#fc-lista');
      if (!q || clienteSelecionado) { listaEl.style.display='none'; listaEl.innerHTML=''; return; }
      const filtrados = todosClientes.filter(c=>c.nome?.toLowerCase().includes(q)||c.email?.toLowerCase().includes(q)).slice(0,6);
      listaEl.style.display = filtrados.length?'block':'none';
      listaEl.innerHTML = filtrados.map(c=>`
        <div onclick="fcSelecionarCliente('${c.email}')" style="padding:12px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05);">
          <p style="color:#fff;font-size:13px;font-weight:600;">${c.nome}</p>
          <p style="color:rgba(180,220,255,0.5);font-size:11px;">${c.email} ${c.telefone?'• '+c.telefone:'• Sem telefone'}</p>
        </div>`).join('');
    });

    window.fcSelecionarCliente = (email) => {
      clienteSelecionado = todosClientes.find(c=>c.email===email);
      el.querySelector('#fc-busca').value = clienteSelecionado.nome;
      el.querySelector('#fc-lista').style.display='none';
      el.querySelector('#fc-selecionado').style.display='block';
      el.querySelector('#fc-cli-nome').textContent = clienteSelecionado.nome;
      el.querySelector('#fc-cli-email').textContent = clienteSelecionado.email;
      el.querySelector('#fc-cli-tel').textContent = clienteSelecionado.telefone?`📱 ${clienteSelecionado.telefone}`:'⚠️ Sem telefone';
      atualizarPreview();
    };

    function atualizarPreview() {
      const nome = clienteSelecionado?.nome||'[Cliente]';
      const msg = el.querySelector('#fc-mensagem').value||'[sua mensagem aqui]';
      el.querySelector('#fc-preview').textContent = `Olá, ${nome}! 👋\n\nO Suporte Klenio Refrigeração tem uma mensagem para você:\n\n${msg}\n\nKlenio Refrigeração ❄`;
    }

    el.querySelector('#fc-mensagem').addEventListener('input', atualizarPreview);

    el.querySelector('#btn-fc-enviar').addEventListener('click', () => {
      if (!clienteSelecionado) { alert('Selecione um cliente.'); return; }
      const msg = el.querySelector('#fc-mensagem').value.trim();
      if (!msg) { alert('Digite uma mensagem.'); return; }
      const numero = formatarTelefoneWhatsApp(clienteSelecionado.telefone);
      if (!numero) { alert('Este cliente não possui telefone cadastrado.'); return; }
      const texto = `Olá, ${clienteSelecionado.nome}! 👋\n\nO Suporte *Klenio Refrigeração* tem uma mensagem para você:\n\n${msg}\n\nKlenio Refrigeração ❄`;
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`, '_blank');
    });
  }

  Router.registrarMount('falarCliente', render);
})();
