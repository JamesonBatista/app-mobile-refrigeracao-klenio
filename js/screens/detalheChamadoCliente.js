// js/screens/detalheChamadoCliente.js

(function () {
  let _unsub = null;

  const STATUS = {
    'Aguardando técnico': { icone:'⏳', cor:'#f39c12' },
    'Aceito':             { icone:'✅', cor:'#27ae60' },
    'Em atendimento':     { icone:'🔧', cor:'#2980b9' },
    'Concluído':          { icone:'🏁', cor:'#8e44ad' },
    'Cancelado':          { icone:'❌', cor:'#e74c3c' },
  };

  function render() {
    const chamado = State.get('chamadoClienteSelecionado');
    if (!chamado) { setTela('acompanharChamado'); return; }

    const el = document.getElementById('tela-detalheChamadoCliente');
    el.innerHTML = `
      <div class="flocos-fundo" id="dcc-flocos"></div>
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Detalhe do Chamado</span></div>
          <button class="btn-voltar" onclick="setTela('acompanharChamado')">← Voltar</button>
        </div>
        <div id="dcc-conteudo"></div>
        <div style="height:20px"></div>
      </div>
    `;
    criarFlocos('dcc-flocos');
    if (_unsub) _unsub();
    _unsub = ouvirChamado(chamado.numero, renderConteudo);
  }

  function renderConteudo(c) {
    const cont = document.getElementById('dcc-conteudo');
    if (!cont) return;
    const s = STATUS[c.status] || STATUS['Aguardando técnico'];
    const podeCancelar = c.status === 'Aguardando técnico';

    cont.innerHTML = `
      ${c.criadoPorAdmin ? `<div class="aviso-box azul" style="margin-bottom:14px"><span style="font-size:20px">❄</span><p>Suporte ❄ — Aberto pela equipe Klenio Refrigeração</p></div>` : ''}
      ${c.geradoDeOrcamento ? `<div class="aviso-box" style="margin-bottom:14px;background:rgba(142,68,173,0.1);border-color:rgba(142,68,173,0.4);color:#8e44ad"><span style="font-size:20px">🔗</span><p>Gerado do orçamento aprovado ${c.geradoDeOrcamento}</p></div>` : ''}

      <div class="card" style="border-color:${s.cor};border-width:1.5px;display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <span style="font-size:36px">${s.icone}</span>
        <div>
          <p style="font-size:11px;color:var(--text-muted);text-transform:uppercase">Status atual</p>
          <p style="font-size:16px;font-weight:700;color:${s.cor}">${c.status}</p>
        </div>
      </div>

      <div class="card">
        <p class="titulo">Informações do chamado</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
          ${row('Número', `<span style="color:var(--primary);font-weight:700">${c.numero}</span>`)}
          ${row('Data', c.dataFormatada)}
          ${row('Horário', c.horario)}
          ${row('Endereço', c.endereco)}
          <div>
            <p style="color:var(--text-muted);font-size:13px;margin-bottom:6px">Problemas</p>
            <div>${(c.tipos||[]).map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </div>
          ${c.detalhes ? `<div><p style="color:var(--text-muted);font-size:13px;margin-bottom:4px">Detalhes</p><div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,0.08)"><p style="color:#fff;font-size:13px">${c.detalhes}</p></div></div>` : ''}
          ${c.tecnico ? row('Técnico', `👷 ${c.tecnico}`) : ''}
          ${c.observacaoTecnica ? `<div><p style="color:var(--text-muted);font-size:13px;margin-bottom:4px">Observação técnica</p><div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;border:1px solid rgba(255,255,255,0.08)"><p style="color:#fff;font-size:13px">${c.observacaoTecnica}</p></div></div>` : ''}
        </div>
      </div>

      ${c.status === 'Concluído' && c.valorCobrado ? `
        <div class="card" style="margin-top:14px">
          <p class="titulo">💰 Pagamento</p>
          <div style="display:flex;justify-content:space-between;margin-top:12px">
            <p style="color:var(--text-muted);font-size:13px">Valor cobrado</p>
            <p style="color:var(--green);font-size:18px;font-weight:700">R$ ${c.valorCobrado}</p>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:8px">
            <p style="color:var(--text-muted);font-size:13px">Forma de pagamento</p>
            <p style="color:#fff;font-size:13px">${c.formaPagamento}</p>
          </div>
        </div>
      ` : ''}

      ${podeCancelar ? `<button class="btn-primary btn-red" style="margin-top:20px" onclick="dccCancelar('${c.numero}')">❌ Cancelar Chamado</button>` : ''}
    `;
  }

  function row(label, valor) {
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start">
      <p style="color:var(--text-muted);font-size:13px">${label}</p>
      <p style="color:#fff;font-size:13px;text-align:right;flex:1;margin-left:12px">${valor}</p>
    </div>`;
  }

  window.dccCancelar = async function (numero) {
    if (!confirm('Tem certeza que deseja cancelar este chamado?')) return;
    await atualizarChamado(numero, { status: 'Cancelado' });
    alert('Chamado cancelado!');
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

  Router.registrarMount('detalheChamadoCliente', render);
})();
