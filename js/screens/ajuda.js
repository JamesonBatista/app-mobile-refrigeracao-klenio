// js/screens/ajuda.js
(function () {
  const SECOES = [
    { icone:'🔧', titulo:'Abrir Chamado', cor:'#1a6fa8', conteudo:[{sub:'O que é?',txt:'Um chamado é uma solicitação de atendimento técnico para o seu ar-condicionado.'},{sub:'Como usar?',txt:'1. Toque em "Abrir Chamado".\n2. Selecione o tipo de problema.\n3. Confirme o endereço.\n4. Escolha dia e horário.\n5. Envie.'},{sub:'Posso cancelar?',txt:'Sim, enquanto status for "Aguardando técnico".'}]},
    { icone:'📡', titulo:'Acompanhar Chamado', cor:'#0d6e6e', conteudo:[{sub:'Status',txt:'⏳ Aguardando técnico → ✅ Aceito → 🔧 Em atendimento → 🏁 Concluído → ❌ Cancelado'}]},
    { icone:'📋', titulo:'Solicitar Orçamento', cor:'#6c3483', conteudo:[{sub:'O que é?',txt:'Use para solicitar orçamento de instalação, substituição ou manutenção.'},{sub:'Data',txt:'A data é escolhida somente após aprovar o orçamento.'}]},
    { icone:'💰', titulo:'Meus Orçamentos', cor:'#8e44ad', conteudo:[{sub:'Status',txt:'⏳ Aguardando análise → 🔍 Em análise → 💰 Orçamento enviado → ✅ Aprovado / ❌ Recusado / 🚫 Cancelado'}]},
    { icone:'🛠️', titulo:'Programado pelo Suporte', cor:'#1a6fa8', conteudo:[{sub:'O que é?',txt:'Agendamentos de revisão preventiva feitos pelo suporte. Você pode aceitar ou contestar.'}]},
    { icone:'👤', titulo:'Meu Perfil', cor:'#27ae60', conteudo:[{sub:'O que editar?',txt:'Nome, endereço, telefone/WhatsApp e senha.'}]},
    { icone:'💬', titulo:'Falar com o Suporte', cor:'#25D366', conteudo:[{sub:'Horário',txt:'Seg–Sex: 08h–17h\nSáb: 09h–13h\nDom: Fechado'}]},
  ];
  let aberta = null;

  function render() {
    const el = document.getElementById('tela-ajuda');
    el.innerHTML = `
      <div class="flocos-fundo" id="aj-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Central de Ajuda</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>
        <div class="aviso-box azul" style="margin-bottom:20px"><span style="font-size:32px">❄</span><p style="font-weight:700">Toque em qualquer seção para ver detalhes.</p></div>
        <div id="aj-secoes"></div>
        <div class="aviso-box verde" style="margin-top:8px;flex-direction:column;align-items:center;gap:8px;text-align:center">
          <span style="font-size:28px">💬</span>
          <p style="font-weight:700;color:#fff">Ainda tem dúvidas?</p>
          <p style="font-size:12px">Fale diretamente com nossa equipe pelo WhatsApp na tela principal.</p>
        </div>
        <div style="height:20px"></div>
      </div>`;
    criarFlocos('aj-flocos');
    renderSecoes();
  }

  function renderSecoes() {
    const cont = document.getElementById('aj-secoes'); if (!cont) return;
    cont.innerHTML = SECOES.map((s, i) => `
      <div style="background:${aberta===i?s.cor+'11':'rgba(255,255,255,0.04)'};border-radius:16px;border:${aberta===i?'1.5px':'1px'} solid ${aberta===i?s.cor+'55':'rgba(255,255,255,0.08)'};margin-bottom:12px;overflow:hidden">
        <button onclick="ajToggle(${i})" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:16px;cursor:pointer;background:none">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:20px;background:${s.cor}22;display:flex;align-items:center;justify-content:center;border:1px solid ${s.cor}44;font-size:20px">${s.icone}</div>
            <span style="color:${aberta===i?'#fff':'rgba(180,220,255,0.8)'};font-size:14px;font-weight:700">${s.titulo}</span>
          </div>
          <span style="color:${aberta===i?s.cor:'rgba(180,220,255,0.4)'};font-size:12px">${aberta===i?'▲':'▼'}</span>
        </button>
        ${aberta===i ? `<div style="padding:0 16px 16px">
          <div style="height:1px;background:${s.cor}33;margin-bottom:14px"></div>
          ${s.conteudo.map(item => `
            <div style="margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <div style="width:4px;height:16px;border-radius:2px;background:${s.cor}"></div>
                <span style="color:${s.cor};font-size:13px;font-weight:700">${item.sub}</span>
              </div>
              <p style="color:rgba(180,220,255,0.75);font-size:13px;line-height:20px;padding-left:12px;white-space:pre-line">${item.txt}</p>
            </div>`).join('')}
        </div>` : ''}
      </div>`).join('');
  }

  window.ajToggle = function (i) { aberta = aberta === i ? null : i; renderSecoes(); };

  function criarFlocos(id) { const c = document.getElementById(id); if (!c) return; for (let i = 0; i < 8; i++) { const f = document.createElement('span'); f.className = 'floco'; f.textContent = '❄'; f.style.cssText = `left:${10+i*45}px;font-size:${9+Math.random()*7}px;animation-duration:${6+Math.random()*4}s;animation-delay:${i*0.3}s`; c.appendChild(f); } }

  Router.registrarMount('ajuda', render);
})();
