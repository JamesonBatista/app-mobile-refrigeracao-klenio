// js/screens/relatorio.js

(function () {
  const FILTROS = [
    { key: 'hoje', label: 'Hoje' }, { key: 'semana', label: 'Semana' },
    { key: 'quinzena', label: 'Quinzena' }, { key: 'mes', label: 'Mês' },
    { key: 'personalizado', label: 'Período' },
  ];
  const CORES_PAG = { 'Dinheiro':'#27ae60','Pix':'#2980b9','Cartão Débito':'#8e44ad','Cartão Crédito':'#e67e22' };

  let unsubscribe = null, relatorios = [], filtroAtivo = 'mes';

  const parseDateBR = (s) => {
    if (!s) return null;
    const [d,m,y] = s.split('/').map(Number);
    return new Date(y, m-1, d);
  };

  function getIntervalo(el) {
    const hoje = new Date(); hoje.setHours(23,59,59,999);
    const ini = new Date(); ini.setHours(0,0,0,0);
    if (filtroAtivo==='hoje') return { inicio: ini, fim: hoje };
    if (filtroAtivo==='semana') { ini.setDate(ini.getDate()-7); return { inicio: ini, fim: hoje }; }
    if (filtroAtivo==='quinzena') { ini.setDate(ini.getDate()-15); return { inicio: ini, fim: hoje }; }
    if (filtroAtivo==='mes') { ini.setDate(ini.getDate()-30); return { inicio: ini, fim: hoje }; }
    if (filtroAtivo==='personalizado') {
      const di = parseDateBR(el.querySelector('#rel-ini')?.value);
      const df = parseDateBR(el.querySelector('#rel-fim')?.value);
      if (di && df) { di.setHours(0,0,0,0); df.setHours(23,59,59,999); return { inicio: di, fim: df }; }
      return null;
    }
    return { inicio: ini, fim: hoje };
  }

  function renderLista(el) {
    const intervalo = getIntervalo(el);
    const lista = !intervalo ? [] : relatorios.filter(r => {
      const d = new Date(r.dataConclusaoISO);
      return d >= intervalo.inicio && d <= intervalo.fim;
    }).sort((a,b) => new Date(b.dataConclusaoISO)-new Date(a.dataConclusaoISO));

    const total = lista.reduce((acc, r) => {
      const v = parseFloat((r.valorCobrado||'0').replace(',','.'));
      return acc + (isNaN(v)?0:v);
    }, 0);
    const totalFmt = total.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

    el.querySelector('#rel-total').textContent = `R$ ${totalFmt}`;
    el.querySelector('#rel-count').textContent = `${lista.length} atendimento${lista.length!==1?'s':''} concluído${lista.length!==1?'s':''}`;

    const container = el.querySelector('#rel-lista');
    if (lista.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="icone">📊</div><div class="titulo">Nenhum registro</div><div class="sub">Não há atendimentos concluídos neste período.</div></div>';
      return;
    }
    container.innerHTML = lista.map(r => {
      const cor = CORES_PAG[r.formaPagamento]||'#7f8c8d';
      return `
        <div style="background:rgba(255,255,255,0.05);border-radius:14px;border:1px solid rgba(255,255,255,0.08);padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div><p style="color:#38b6ff;font-size:13px;font-weight:700;">${r.numeroChamado}</p><p style="color:#fff;font-size:14px;font-weight:600;">${r.cliente}</p></div>
            <span style="background:${cor}22;border-radius:20px;padding:4px 10px;border:1px solid ${cor}44;color:${cor};font-size:12px;font-weight:700;">${r.formaPagamento}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <p style="color:rgba(180,220,255,0.6);font-size:12px;">📅 Serviço: ${r.dataServico} às ${r.horario}</p>
            <p style="color:rgba(180,220,255,0.6);font-size:12px;">✅ Concluído: ${r.dataConclusao} às ${r.horaConclusao}</p>
            ${r.tempoAtendimento?`<p style="color:rgba(180,220,255,0.6);font-size:12px;">⏱️ Tempo: ${r.tempoAtendimento}</p>`:''}
            ${r.tecnico?`<p style="color:rgba(180,220,255,0.6);font-size:12px;">👷 Técnico: ${r.tecnico}</p>`:''}
            ${(r.tipos||[]).length?`<p style="color:rgba(180,220,255,0.6);font-size:12px;">🔧 ${r.tipos.join(', ')}</p>`:''}
          </div>
          <div style="margin-top:12px;background:rgba(39,174,96,0.08);border-radius:8px;padding:10px;border:1px solid rgba(39,174,96,0.2);display:flex;justify-content:space-between;align-items:center;">
            <span style="color:rgba(180,220,255,0.6);font-size:13px;">Valor cobrado</span>
            <span style="color:#27ae60;font-size:16px;font-weight:700;">R$ ${r.valorCobrado}</span>
          </div>
        </div>`;
    }).join('');
  }

  function render() {
    const el = document.getElementById('tela-relatorio');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Relatório Financeiro</span></div>
          <button class="btn-voltar" onclick="setTela('painelAdmin')">← Voltar</button>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          ${FILTROS.map(f=>`<button class="filtro-btn ${f.key===filtroAtivo?'ativo':''}" data-key="${f.key}" onclick="mudarFiltroRel('${f.key}')" style="padding:8px 16px;border-radius:20px;cursor:pointer;border:${f.key===filtroAtivo?'2px':'1px'} solid ${f.key===filtroAtivo?'#38b6ff':'rgba(255,255,255,0.1)'};background:${f.key===filtroAtivo?'rgba(56,182,255,0.15)':'rgba(255,255,255,0.04)'};color:${f.key===filtroAtivo?'#38b6ff':'rgba(180,220,255,0.6)'};font-size:13px;font-weight:${f.key===filtroAtivo?'700':'400'};">${f.label}</button>`).join('')}
        </div>

        <div id="rel-periodo" style="display:none;" class="card" style="margin-bottom:16px;">
          <p class="subtitulo">Informe o período</p>
          <div style="display:flex;gap:10px;margin-top:10px;">
            <div style="flex:1;"><label class="label">Data início</label>
              <div class="input-wrap"><span class="input-icone">📅</span><input id="rel-ini" type="text" placeholder="dd/mm/aaaa" maxlength="10" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" oninput="renderListaRel()" /></div>
            </div>
            <div style="flex:1;"><label class="label">Data fim</label>
              <div class="input-wrap"><span class="input-icone">📅</span><input id="rel-fim" type="text" placeholder="dd/mm/aaaa" maxlength="10" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" oninput="renderListaRel()" /></div>
            </div>
          </div>
        </div>

        <div style="background:rgba(39,174,96,0.1);border-radius:16px;border:1.5px solid rgba(39,174,96,0.4);padding:20px;margin-bottom:16px;text-align:center;">
          <p style="color:rgba(180,220,255,0.6);font-size:13px;margin-bottom:6px;">Total recebido no período</p>
          <p id="rel-total" style="color:#27ae60;font-size:32px;font-weight:700;">R$ 0,00</p>
          <p id="rel-count" style="color:rgba(180,220,255,0.5);font-size:12px;margin-top:6px;">0 atendimentos</p>
        </div>

        <p class="titulo" style="margin-bottom:12px;">Atendimentos</p>
        <div id="rel-lista"><div style="text-align:center;padding:40px;"><div class="spinner"></div></div></div>
        <div style="height:20px;"></div>
      </div>`;

    window.mudarFiltroRel = (key) => {
      filtroAtivo = key;
      el.querySelectorAll('.filtro-btn').forEach(b => {
        const ativo = b.dataset.key===key;
        b.style.borderWidth = ativo?'2px':'1px';
        b.style.borderColor = ativo?'#38b6ff':'rgba(255,255,255,0.1)';
        b.style.background = ativo?'rgba(56,182,255,0.15)':'rgba(255,255,255,0.04)';
        b.style.color = ativo?'#38b6ff':'rgba(180,220,255,0.6)';
        b.style.fontWeight = ativo?'700':'400';
      });
      el.querySelector('#rel-periodo').style.display = key==='personalizado'?'block':'none';
      renderListaRel();
    };
    window.renderListaRel = () => renderLista(el);

    if (unsubscribe) unsubscribe();
    unsubscribe = ouvirRelatorios((lista) => { relatorios = lista; renderLista(el); });
  }

  Router.registrarMount('relatorio', render);
})();
