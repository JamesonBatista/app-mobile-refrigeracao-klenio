// js/screens/programadoCliente.js

(function () {

  const STATUS_CONFIG = {
    'Agendado':       { icone: '📅', cor: '#f39c12' },
    'Contestado':     { icone: '⚠️', cor: '#e67e22' },
    'Respondido':     { icone: '💬', cor: '#2980b9' },
    'Aceito':         { icone: '✅', cor: '#27ae60' },
    'Cancelado':      { icone: '❌', cor: '#e74c3c' },
    'Em atendimento': { icone: '🔧', cor: '#2980b9' },
    'Concluído':      { icone: '🏁', cor: '#8e44ad' },
  };

  let unsubscribe = null;
  let programados = [];
  let aba = 'ativos';
  let contestandoNumero = null;

  const calcDias = (chave) => {
    if (!chave) return null;
    const [y, m, d] = chave.split('-').map(Number);
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const alvo = new Date(y, m-1, d);
    return Math.ceil((alvo - hoje) / 86400000);
  };
  const corDias = (d) => d === null ? 'rgba(180,220,255,0.5)' : d <= 1 ? '#e74c3c' : d <= 3 ? '#f39c12' : d <= 7 ? '#27ae60' : '#38b6ff';

  function cardHTML(p) {
    const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG['Agendado'];
    const dias = calcDias(p.dataChave);
    const cd = corDias(dias);
    const cancelado = p.status === 'Cancelado';
    const concluido = p.status === 'Concluído';
    const emAt = p.status === 'Em atendimento';
    const aceito = p.status === 'Aceito';

    const diasHTML = dias !== null && !cancelado && !concluido && !emAt ? `
      <div style="background:${cd}18;border-radius:10px;padding:10px;border:1px solid ${cd}35;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;">⏳</span>
        <div>
          ${dias === 0 ? `<p style="color:#e74c3c;font-size:14px;font-weight:700;">Hoje é o dia! 🚨</p>`
          : dias < 0 ? `<p style="color:#7f8c8d;font-size:13px;">Data passou</p>`
          : `<p style="color:${cd};font-size:18px;font-weight:700;">${dias} dia${dias!==1?'s':''}</p>
             <p style="color:rgba(180,220,255,0.5);font-size:11px;">para o atendimento</p>`}
        </div>
      </div>` : '';

    const historicoHTML = (p.historico||[]).map(msg => `
      <div style="padding:10px;border-radius:8px;border:1px solid ${msg.tipo==='contestacao'?'rgba(230,126,34,0.25)':'rgba(41,128,185,0.25)'};background:${msg.tipo==='contestacao'?'rgba(230,126,34,0.08)':'rgba(41,128,185,0.08)'};margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="color:${msg.tipo==='contestacao'?'#e67e22':'#2980b9'};font-size:11px;font-weight:700;">${msg.tipo==='contestacao'?'⚠️ Você':'💬 Suporte'}</span>
          <span style="color:rgba(180,220,255,0.4);font-size:10px;">${msg.data} ${msg.hora}</span>
        </div>
        <p style="color:#fff;font-size:12px;">${msg.mensagem}</p>
      </div>`).join('');

    const botoesHTML = (p.status==='Agendado'||p.status==='Respondido') ? `
      <button onclick="aceitarProg('${p.numero}')" style="width:100%;padding:12px;border-radius:10px;background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.4);color:#27ae60;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;">✅ Aceitar agendamento</button>
      <button onclick="contestarProg('${p.numero}')" style="width:100%;padding:12px;border-radius:10px;background:rgba(230,126,34,0.1);border:1px solid rgba(230,126,34,0.3);color:#e67e22;font-size:13px;font-weight:700;cursor:pointer;">⚠️ ${p.status==='Respondido'?'Contestar novamente':'Contestar'}</button>
    ` : p.status==='Contestado' ? `<div style="padding:12px;border-radius:10px;background:rgba(230,126,34,0.08);border:1px solid rgba(230,126,34,0.25);text-align:center;color:#e67e22;font-size:13px;">⏳ Aguardando resposta do suporte...</div>` : '';

    return `
      <div style="background:rgba(255,255,255,0.06);border-radius:16px;border:1.5px solid ${cfg.cor}55;padding:16px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;background:rgba(56,182,255,0.1);border-radius:8px;padding:6px 10px;margin-bottom:12px;border:1px solid rgba(56,182,255,0.3);">
          <span>❄</span><span style="color:#38b6ff;font-size:12px;font-weight:700;flex:1;">Agendado pelo Suporte</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <span style="color:#38b6ff;font-size:15px;font-weight:700;">${p.numero}</span>
          <span style="background:${cfg.cor}22;border-radius:20px;padding:4px 10px;color:${cfg.cor};font-size:12px;font-weight:600;">${cfg.icone} ${p.status}</span>
        </div>
        ${p.status==='Agendado'?`<div style="background:rgba(243,156,18,0.12);border-radius:10px;padding:12px;margin-bottom:12px;border:1px solid rgba(243,156,18,0.4);display:flex;gap:10px;"><span style="font-size:20px;">⚠️</span><p style="color:#f39c12;font-size:13px;font-weight:600;flex:1;">Aceite o agendamento para dar continuidade ao atendimento.</p></div>`:''}
        ${diasHTML}
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
          <div style="display:flex;gap:8px;"><span>🔧</span><span style="color:#fff;font-size:13px;font-weight:600;">${p.tipo||p.tipos?.join(', ')||''}</span></div>
          <div style="display:flex;gap:8px;"><span>📅</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">${p.dataFormatada} • ${p.horario}</span></div>
          <div style="display:flex;gap:8px;"><span>📍</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">${p.endereco}</span></div>
          ${p.tecnico?`<div style="display:flex;gap:8px;"><span>👷</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">Técnico: ${p.tecnico}</span></div>`:''}
          ${p.detalhes?`<div style="display:flex;gap:8px;"><span>📝</span><span style="color:rgba(180,220,255,0.7);font-size:13px;">${p.detalhes}</span></div>`:''}
        </div>
        ${aceito?`<div style="background:rgba(39,174,96,0.08);border-radius:10px;padding:12px;border:1px solid rgba(39,174,96,0.25);display:flex;gap:10px;margin-bottom:12px;"><span style="font-size:18px;">✅</span><p style="color:#27ae60;font-size:13px;font-weight:600;flex:1;">Agendamento confirmado! Aguarde o início do atendimento.</p></div>`:''}
        ${concluido&&p.valorCobrado?`<div style="background:rgba(39,174,96,0.08);border-radius:10px;padding:10px;border:1px solid rgba(39,174,96,0.2);margin-bottom:12px;"><div style="display:flex;justify-content:space-between;"><span style="color:rgba(180,220,255,0.5);font-size:12px;">Valor cobrado</span><span style="color:#27ae60;font-size:13px;font-weight:700;">R$ ${p.valorCobrado}</span></div></div>`:''}
        ${(p.historico||[]).length>0?`<div style="margin-bottom:12px;"><p style="color:rgba(180,220,255,0.5);font-size:12px;font-weight:600;margin-bottom:6px;">💬 Histórico</p>${historicoHTML}</div>`:''}
        <div>${botoesHTML}</div>
      </div>`;
  }

  function renderLista() {
    const el = document.getElementById('tela-programadoCliente');
    const lista = el.querySelector('#prog-lista');
    const filtrados = aba === 'ativos'
      ? programados.filter(p => p.status !== 'Cancelado' && p.status !== 'Concluído')
      : programados.filter(p => p.status === 'Cancelado' || p.status === 'Concluído');

    lista.innerHTML = filtrados.length === 0
      ? `<div class="empty-state"><div class="icone">🛠️</div><div class="titulo">Nenhum agendamento</div><div class="sub">Nenhum ${aba==='ativos'?'em andamento':'no histórico'}.</div></div>`
      : filtrados.map(cardHTML).join('');
  }

  window.aceitarProg = async (numero) => {
    if (!confirm('Confirma o agendamento?')) return;
    await aceitarProgramado(numero);
  };

  window.contestarProg = (numero) => {
    contestandoNumero = numero;
    const p = programados.find(x => x.numero === numero);
    const el = document.getElementById('tela-programadoCliente');
    const modal = el.querySelector('#modal-contestar');
    el.querySelector('#contestar-info').textContent = `${p.numero} • ${p.dataFormatada}`;
    el.querySelector('#contestar-motivo').value = '';
    modal.style.display = 'block';
  };

  function render() {
    const usuario = State.get('usuarioLogado');
    const el = document.getElementById('tela-programadoCliente');
    el.innerHTML = `
      <div class="flocos-fundo" id="flocos-prog"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Programado pelo Suporte</span></div>
          <button class="btn-voltar" onclick="setTela('principal')">← Voltar</button>
        </div>

        <div id="modal-contestar" style="display:none;background:rgba(230,126,34,0.08);border-radius:16px;border:1px solid rgba(230,126,34,0.3);padding:16px;margin-bottom:16px;">
          <p class="titulo">⚠️ Contestar agendamento</p>
          <p id="contestar-info" class="subtitulo"></p>
          <label class="label">Motivo da contestação</label>
          <textarea id="contestar-motivo" class="input-area" placeholder="Explique o motivo..."></textarea>
          <div style="display:flex;gap:10px;margin-top:14px;">
            <button onclick="document.getElementById('modal-contestar').style.display='none'" style="flex:1;padding:12px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(180,220,255,0.6);cursor:pointer;">Cancelar</button>
            <button id="btn-enviar-contestar" style="flex:2;padding:12px;border-radius:10px;background:#e67e22;border:none;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">⚠️ Enviar contestação</button>
          </div>
        </div>

        <div style="display:flex;background:rgba(0,0,0,0.25);border-radius:10px;padding:3px;margin-bottom:16px;">
          <button id="aba-ativos" onclick="mudarAba('ativos')" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;background:rgba(56,182,255,0.2);color:#38b6ff;">Em andamento</button>
          <button id="aba-historico" onclick="mudarAba('historico')" style="flex:1;padding:8px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;background:transparent;color:rgba(180,220,255,0.5);">Histórico</button>
        </div>

        <div id="prog-lista"></div>
      </div>`;

    window.mudarAba = (novaAba) => {
      aba = novaAba;
      const el = document.getElementById('tela-programadoCliente');
      el.querySelector('#aba-ativos').style.background = novaAba==='ativos'?'rgba(56,182,255,0.2)':'transparent';
      el.querySelector('#aba-ativos').style.color = novaAba==='ativos'?'#38b6ff':'rgba(180,220,255,0.5)';
      el.querySelector('#aba-historico').style.background = novaAba==='historico'?'rgba(56,182,255,0.2)':'transparent';
      el.querySelector('#aba-historico').style.color = novaAba==='historico'?'#38b6ff':'rgba(180,220,255,0.5)';
      renderLista();
    };

    el.querySelector('#btn-enviar-contestar').addEventListener('click', async () => {
      const motivo = el.querySelector('#contestar-motivo').value.trim();
      if (!motivo) { alert('Informe o motivo da contestação.'); return; }
      await contestarProgramado(contestandoNumero, motivo);
      el.querySelector('#modal-contestar').style.display = 'none';
      alert('Contestação enviada! Nossa equipe irá responder em breve.');
    });

    if (unsubscribe) unsubscribe();
    if (!usuario?.email) { renderLista(); return; }

    el.querySelector('#prog-lista').innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div></div>';

    unsubscribe = ouvirProgramados(usuario.email, (lista) => {
      lista.sort((a,b) => (a.dataChave||'').localeCompare(b.dataChave||''));
      programados = lista;
      renderLista();
    });
  }

  Router.registrarMount('programadoCliente', render);
})();
