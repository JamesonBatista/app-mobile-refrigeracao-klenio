// js/screens/meusOrcamentos.js

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
    const usuario = State.get('usuarioLogado');
    const el = document.getElementById('tela-meusOrcamentos');
    el.innerHTML = `
      <div class="flocos-fundo"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Meus Orçamentos</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>
        <div id="orc-lista"><div style="text-align:center;padding:40px;"><div class="spinner"></div></div></div>
        <div style="height:20px;"></div>
      </div>`;

    if (unsubscribe) unsubscribe();

    unsubscribe = ouvirOrcamentosCliente(usuario.email, (lista) => {
      lista.sort((a,b) => (b.dataCriacao||'').localeCompare(a.dataCriacao||''));
      const container = el.querySelector('#orc-lista');
      if (lista.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icone">💰</div><div class="titulo">Nenhum orçamento</div><div class="sub">Solicite um orçamento na tela principal.</div></div>';
        return;
      }
      container.innerHTML = lista.map(o => {
        const cfg = STATUS_CONFIG[o.status] || { icone: '📌', cor: '#7f8c8d' };
        const podeCancelar = o.status === 'Aguardando análise';
        const podeAprovar = o.status === 'Orçamento enviado';
        return `
          <div style="background:rgba(255,255,255,0.06);border-radius:16px;border:1px solid ${cfg.cor}33;padding:16px;margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span style="color:#38b6ff;font-size:14px;font-weight:700;">${o.numero}</span>
              <span style="background:${cfg.cor}22;border-radius:20px;padding:3px 10px;color:${cfg.cor};font-size:12px;font-weight:600;">${cfg.icone} ${o.status}</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
              <div style="display:flex;gap:8px;"><span>🔧</span><span style="color:#fff;font-size:13px;font-weight:600;">${o.tipoServico}</span></div>
              <div style="display:flex;gap:8px;"><span>❄</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">${o.tipoAparelho} • ${o.btu} BTUs</span></div>
              <div style="display:flex;gap:8px;"><span>📍</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">${o.endereco}</span></div>
              ${o.valorOrcamento?`<div style="background:rgba(142,68,173,0.1);border-radius:8px;padding:10px;border:1px solid rgba(142,68,173,0.3);display:flex;justify-content:space-between;"><span style="color:#8e44ad;font-size:13px;font-weight:700;">💰 Valor</span><span style="color:#fff;font-size:16px;font-weight:700;">R$ ${o.valorOrcamento}</span></div>`:''}
              ${o.descricaoAdmin?`<div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;"><p style="color:rgba(180,220,255,0.5);font-size:11px;margin-bottom:4px;">Descrição do suporte</p><p style="color:#fff;font-size:13px;">${o.descricaoAdmin}</p></div>`:''}
            </div>
            <div style="display:flex;gap:8px;">
              ${podeAprovar?`<button onclick="aprovarOrc('${o.numero}')" style="flex:2;padding:12px;border-radius:10px;background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.4);color:#27ae60;font-size:13px;font-weight:700;cursor:pointer;">✅ Aprovar e agendar</button>`:''}
              ${podeAprovar?`<button onclick="recusarOrc('${o.numero}')" style="flex:1;padding:12px;border-radius:10px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;font-size:13px;font-weight:700;cursor:pointer;">❌ Recusar</button>`:''}
              ${podeCancelar?`<button onclick="cancelarOrcCliente('${o.numero}')" style="width:100%;padding:12px;border-radius:10px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;font-size:13px;font-weight:700;cursor:pointer;">❌ Cancelar solicitação</button>`:''}
            </div>
          </div>`;
      }).join('');
    });

    window.aprovarOrc = (numero) => {
      const orcamentos = [];
      ouvirOrcamentosCliente(usuario.email, list => { orcamentos.push(...list); })();
      // Busca o orçamento do Firestore para navegar
      db.collection('orcamentos').doc(numero).get().then(doc => {
        if (doc.exists) {
          State.set('orcamentoParaAprovar', { id: doc.id, ...doc.data() });
          setTela('aprovarOrcamento');
        }
      });
    };
    window.recusarOrc = async (numero) => {
      if (!confirm('Tem certeza que deseja recusar este orçamento?')) return;
      await atualizarOrcamento(numero, { status: 'Recusado' });
    };
    window.cancelarOrcCliente = async (numero) => {
      if (!confirm('Tem certeza que deseja cancelar esta solicitação?')) return;
      await atualizarOrcamento(numero, { status: 'Cancelado' });
    };
  }

  Router.registrarMount('meusOrcamentos', render);
})();
