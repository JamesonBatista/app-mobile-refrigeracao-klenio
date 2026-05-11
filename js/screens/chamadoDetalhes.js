// js/screens/chamadoDetalhes.js
(function () {
  let _unsub = null;
  let _profissionais = [];
  const STATUS_LIST = ['Aguardando técnico','Aceito','Em atendimento','Concluído','Cancelado'];
  const STATUS_COR  = {'Aguardando técnico':'#f39c12','Aceito':'#27ae60','Em atendimento':'#2980b9','Concluído':'#8e44ad','Cancelado':'#e74c3c'};
  const PAGAMENTOS  = ['Dinheiro','Pix','Cartão Débito','Cartão Crédito'];

  function render() {
    const chamado = State.get('chamadoSelecionado');
    if (!chamado) { setTela('painelAdmin'); return; }
    const el = document.getElementById('tela-chamadoDetalhes');
    el.innerHTML = '<div class="scroll"><div class="header"><div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Detalhe do Chamado</span></div><button class="btn-voltar" onclick="setTela(\'painelAdmin\')">← Voltar</button></div><div id="cd-conteudo"><div class="spinner" style="margin:40px auto"></div></div><div style="height:20px"></div></div>';
    ouvirProfissionais(lista => { _profissionais = lista; });
    if (_unsub) _unsub();
    _unsub = ouvirChamado(chamado.numero, renderConteudo);
  }

  function renderConteudo(c) {
    const cont = document.getElementById('cd-conteudo'); if (!cont) return;
    const cor = STATUS_COR[c.status] || '#7f8c8d';
    window._cdUrgencia = c.urgencia || 'Normal';
    window._cdPagamento = c.formaPagamento || '';
    window._cdChamadoAtual = c;
    cont.innerHTML = `
      <div class="card" style="border-color:${cor};border-width:1.5px;margin-bottom:14px">
        <p class="subtitulo">Status atual</p>
        <select id="cd-status" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;width:100%;margin-bottom:10px">
          ${STATUS_LIST.map(s=>`<option value="${s}" ${c.status===s?'selected':''}>${s}</option>`).join('')}
        </select>
        <label class="label">Técnico</label>
        <select id="cd-tecnico" style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px;color:#fff;font-size:14px;width:100%;margin-bottom:10px">
          <option value="">Selecionar técnico</option>
          ${_profissionais.map(p=>`<option value="${p.nome}" ${c.tecnico===p.nome?'selected':''}>${p.nome}</option>`).join('')}
        </select>
        <label class="label">Observação técnica</label>
        <textarea id="cd-obs" class="input-area" style="margin-bottom:10px" placeholder="Observação...">${c.observacaoTecnica||''}</textarea>
        <button class="btn-primary" onclick="cdSalvar('${c.numero}','${c.clienteTelefone||''}')">💾 Salvar</button>
      </div>
      <div class="card" style="margin-bottom:14px">
        <p class="titulo">💰 Conclusão</p>
        <label class="label">Valor cobrado (R$)</label>
        <div class="input-wrap" style="margin-bottom:10px"><span class="input-icone">💰</span><input id="cd-valor" type="text" value="${c.valorCobrado||''}" placeholder="0,00" /></div>
        <label class="label">Forma de pagamento</label>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          ${PAGAMENTOS.map(p=>`<button onclick="cdSetPag('${p}')" class="cd-pag-btn" data-pag="${p}" style="padding:8px 14px;border-radius:20px;border:1px solid ${c.formaPagamento===p?'var(--primary)':'rgba(255,255,255,0.1)'};background:${c.formaPagamento===p?'rgba(56,182,255,0.15)':'rgba(255,255,255,0.04)'};color:${c.formaPagamento===p?'var(--primary)':'rgba(180,220,255,0.6)'};font-size:12px;cursor:pointer">${p}</button>`).join('')}
        </div>
        <button class="btn-primary btn-green" onclick="cdConcluir('${c.numero}','${c.clienteTelefone||''}')">🏁 Concluir chamado</button>
      </div>
      <div class="card" style="margin-bottom:14px">
        <p class="titulo">Informações</p>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
          <div style="display:flex;justify-content:space-between"><p style="color:var(--text-muted);font-size:13px">Número</p><p style="color:var(--primary);font-size:13px;font-weight:700">${c.numero}</p></div>
          <div style="display:flex;justify-content:space-between"><p style="color:var(--text-muted);font-size:13px">Cliente</p><p style="color:#fff;font-size:13px">${c.cliente}</p></div>
          <div style="display:flex;justify-content:space-between"><p style="color:var(--text-muted);font-size:13px">Telefone</p><p style="color:#fff;font-size:13px">${c.clienteTelefone||'Não informado'}</p></div>
          <div style="display:flex;justify-content:space-between"><p style="color:var(--text-muted);font-size:13px">Data</p><p style="color:#fff;font-size:13px">${c.dataFormatada}</p></div>
          <div style="display:flex;justify-content:space-between"><p style="color:var(--text-muted);font-size:13px">Horário</p><p style="color:#fff;font-size:13px">${c.horario}</p></div>
          <div><p style="color:var(--text-muted);font-size:13px;margin-bottom:6px">Problemas</p><div>${(c.tipos||[]).map(t=>'<span class="tag">'+t+'</span>').join('')}</div></div>
        </div>
      </div>
      <button class="btn-primary btn-red" onclick="cdCancelar('${c.numero}','${c.clienteTelefone||''}')">❌ Cancelar chamado</button>`;
  }

  window.cdSetPag = function(p) {
    window._cdPagamento = p;
    document.querySelectorAll('.cd-pag-btn').forEach(b => { b.style.borderColor='rgba(255,255,255,0.1)'; b.style.background='rgba(255,255,255,0.04)'; b.style.color='rgba(180,220,255,0.6)'; });
    const sel = document.querySelector(`.cd-pag-btn[data-pag="${p}"]`);
    if (sel) { sel.style.borderColor='var(--primary)'; sel.style.background='rgba(56,182,255,0.15)'; sel.style.color='var(--primary)'; }
  };

  window.cdSalvar = async function(numero, tel) {
    const status = document.getElementById('cd-status')?.value;
    const tecnico = document.getElementById('cd-tecnico')?.value || '';
    const obs = document.getElementById('cd-obs')?.value.trim() || '';
    await registrarMudancaStatus(numero, status);
    await atualizarChamado(numero, { tecnico, observacaoTecnica: obs });
    if (tel) notificarClienteMudancaStatus(tel, { ...window._cdChamadoAtual, status, tecnico, observacaoTecnica: obs });
    alert('Atualizado!');
  };

  window.cdConcluir = async function(numero, tel) {
    const valor = document.getElementById('cd-valor')?.value.trim();
    const pag = window._cdPagamento;
    if (!valor) { alert('Informe o valor.'); return; }
    if (!pag)   { alert('Selecione o pagamento.'); return; }
    const c = window._cdChamadoAtual;
    await registrarMudancaStatus(numero, 'Concluído');
    await atualizarChamado(numero, { valorCobrado: valor, formaPagamento: pag, status: 'Concluído' });
    await salvarRegistroFinanceiro({ ...c, status: 'Concluído', valorCobrado: valor, formaPagamento: pag });
    if (tel) notificarClienteMudancaStatus(tel, { ...c, status: 'Concluído', valorCobrado: valor, formaPagamento: pag });
    alert('Chamado concluído!');
    setTela('painelAdmin');
  };

  window.cdCancelar = async function(numero, tel) {
    if (!confirm('Cancelar este chamado?')) return;
    await registrarMudancaStatus(numero, 'Cancelado');
    if (tel) notificarClienteChamadoCancelado(tel, window._cdChamadoAtual);
    alert('Cancelado!');
    setTela('painelAdmin');
  };

  Router.registrarMount('chamadoDetalhes', render);
})();
