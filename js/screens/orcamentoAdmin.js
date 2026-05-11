// js/screens/orcamentoAdmin.js

(function () {
  const STATUS_CONFIG = {
    'Aguardando análise': { icone: '⏳', cor: '#f39c12' },
    'Em análise':         { icone: '🔍', cor: '#2980b9' },
    'Orçamento enviado':  { icone: '💰', cor: '#8e44ad' },
    'Aprovado':           { icone: '✅', cor: '#27ae60' },
    'Recusado':           { icone: '❌', cor: '#e74c3c' },
    'Cancelado':          { icone: '🚫', cor: '#7f8c8d' },
  };
  let unsubscribe = null;

  function render() {
    const el = document.getElementById('tela-orcamentoAdmin');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Orçamentos</span></div>
          <button class="btn-voltar" onclick="setTela('painelAdmin')">← Voltar</button>
        </div>
        <button class="btn-primary" style="margin-bottom:16px;" onclick="setTela('criarOrcamentoAdmin')">+ Criar Orçamento</button>
        <div id="orc-admin-lista"><div style="text-align:center;padding:40px;"><div class="spinner"></div></div></div>
        <div style="height:20px;"></div>
      </div>`;

    if (unsubscribe) unsubscribe();

    unsubscribe = ouvirTodosOrcamentos((lista) => {
      lista.sort((a,b) => (b.dataCriacao||'').localeCompare(a.dataCriacao||''));
      const container = el.querySelector('#orc-admin-lista');
      if (lista.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icone">💰</div><div class="titulo">Nenhum orçamento</div></div>';
        return;
      }
      container.innerHTML = lista.map(o => {
        const cfg = STATUS_CONFIG[o.status] || { icone: '📌', cor: '#7f8c8d' };
        return `
          <div style="background:rgba(255,255,255,0.06);border-radius:16px;border:1px solid ${cfg.cor}33;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div><p style="color:#38b6ff;font-size:14px;font-weight:700;">${o.numero}</p><p style="color:#fff;font-size:13px;font-weight:600;">${o.cliente}</p></div>
              <span style="background:${cfg.cor}22;border-radius:20px;padding:3px 10px;color:${cfg.cor};font-size:12px;font-weight:600;">${cfg.icone} ${o.status}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:10px;">
              <p style="color:rgba(180,220,255,0.7);font-size:13px;">🔧 ${o.tipoServico} • ❄ ${o.tipoAparelho} ${o.btu} BTUs</p>
              <p style="color:rgba(180,220,255,0.7);font-size:13px;">📱 ${o.clienteTelefone||'Sem telefone'}</p>
              <p style="color:rgba(180,220,255,0.7);font-size:13px;">📍 ${o.endereco}</p>
              ${o.valorOrcamento?`<p style="color:#8e44ad;font-size:14px;font-weight:700;">💰 R$ ${o.valorOrcamento}</p>`:''}
            </div>
            <div id="form-orc-${o.numero}" style="display:none;background:rgba(142,68,173,0.08);border-radius:10px;padding:14px;border:1px solid rgba(142,68,173,0.25);margin-bottom:10px;">
              <label class="label">Valor do orçamento (R$)</label>
              <div class="input-wrap"><span class="input-icone">💰</span>
                <input id="valor-${o.numero}" type="text" placeholder="Ex: 350,00" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
              </div>
              <label class="label">Descrição do serviço</label>
              <textarea id="desc-${o.numero}" class="input-area" placeholder="Descreva o que será feito..." style="min-height:80px;"></textarea>
              <div style="display:flex;gap:8px;margin-top:10px;">
                <button onclick="cancelarFormOrc('${o.numero}')" style="flex:1;padding:10px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(180,220,255,0.6);cursor:pointer;font-size:12px;">Cancelar</button>
                <button onclick="enviarOrcAdmin('${o.numero}','${o.clienteTelefone||''}','${o.clienteEmail||''}')" style="flex:2;padding:10px;border-radius:8px;background:#8e44ad;border:none;color:#fff;font-size:12px;font-weight:700;cursor:pointer;">💰 Enviar orçamento</button>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              ${o.status==='Aguardando análise'?`<button onclick="mudarStatusOrc('${o.numero}','Em análise')" style="flex:1;min-width:120px;padding:10px;border-radius:8px;background:rgba(41,128,185,0.15);border:1px solid rgba(41,128,185,0.4);color:#2980b9;font-size:12px;font-weight:700;cursor:pointer;">🔍 Iniciar análise</button>`:''}
              ${o.status==='Em análise'?`<button onclick="abrirFormOrc('${o.numero}')" style="flex:1;min-width:120px;padding:10px;border-radius:8px;background:rgba(142,68,173,0.15);border:1px solid rgba(142,68,173,0.4);color:#8e44ad;font-size:12px;font-weight:700;cursor:pointer;">💰 Enviar orçamento</button>`:''}
              ${(o.status!=='Aprovado'&&o.status!=='Recusado'&&o.status!=='Cancelado')?`<button onclick="cancelarOrcAdmin('${o.numero}','${o.clienteTelefone||''}')" style="padding:10px 14px;border-radius:8px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;font-size:12px;cursor:pointer;">🚫 Cancelar</button>`:''}
            </div>
          </div>`;
      }).join('');
    });

    window.abrirFormOrc = (numero) => { document.getElementById(`form-orc-${numero}`).style.display='block'; };
    window.cancelarFormOrc = (numero) => { document.getElementById(`form-orc-${numero}`).style.display='none'; };
    window.mudarStatusOrc = async (numero, status) => { await atualizarOrcamento(numero, { status }); };
    window.cancelarOrcAdmin = async (numero, tel) => {
      if (!confirm('Cancelar este orçamento?')) return;
      await atualizarOrcamento(numero, { status: 'Cancelado' });
    };
    window.enviarOrcAdmin = async (numero, tel, email) => {
      const valor = document.getElementById(`valor-${numero}`).value.trim();
      const desc  = document.getElementById(`desc-${numero}`).value.trim();
      if (!valor) { alert('Informe o valor.'); return; }
      const doc = await db.collection('orcamentos').doc(numero).get();
      const orc = { id: doc.id, ...doc.data(), valorOrcamento: valor, descricaoAdmin: desc };
      await atualizarOrcamento(numero, { status: 'Orçamento enviado', valorOrcamento: valor, descricaoAdmin: desc });
      if (tel) notificarClienteOrcamentoEnviado(tel, orc);
      alert('✅ Orçamento enviado ao cliente!');
    };
  }

  Router.registrarMount('orcamentoAdmin', render);
})();
