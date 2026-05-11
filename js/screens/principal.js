// js/screens/principal.js

(function () {

  const WHATSAPP = '5581986967254';
  const TEMPERATURAS = [18, 21, 22, 23, 17, 20, 19, 24];
  let _unsubs = [];

  function render() {
    const usuario = State.get('usuarioLogado');
    const temp = TEMPERATURAS[Math.floor(Math.random() * TEMPERATURAS.length)];

    const el = document.getElementById('tela-principal');
    el.innerHTML = `
      <div class="flocos-fundo" id="pr-flocos"></div>
      <div class="scroll">

        <!-- Header -->
        <div class="header">
          <div>
            <span class="header-empresa">Klenio Refrigeração</span>
            <span style="font-size:13px;color:var(--text-muted);display:block">Bem-vindo,</span>
            <span class="header-nome">${usuario?.nome || ''}</span>
          </div>
          <button class="pr-sair-btn" onclick="setTela('sair')">
            <span style="font-size:24px;color:var(--primary)">❄</span>
            <span style="font-size:10px;color:var(--primary);font-weight:600">Sair</span>
          </button>
        </div>

        <!-- Banner -->
        <div class="banner" id="pr-banner" onclick="dispararExplosao()">
          <div class="banner-esq">
            <p class="banner-titulo">Sistema de Ar</p>
            <p class="banner-sub">Seu conforto é nossa prioridade</p>
            <div class="banner-badge">
              <span class="temp-valor-banner">${temp}°C</span>
              <span>🌡️</span>
            </div>
          </div>
          <span style="font-size:48px;margin-left:10px">🌬️</span>
        </div>

        <!-- Ações rápidas -->
        <p class="secao-titulo">Ações Rápidas</p>
        <div class="principais-row">
          <button class="card-principal" style="background:#1a6fa8" onclick="setTela('abrirChamado')">
            <span class="card-principal-icone">🔧</span>
            <p class="card-principal-titulo">Abrir Chamado</p>
            <p class="card-principal-sub">Registre um problema</p>
          </button>
          <button class="card-principal" style="background:#0d6e6e" onclick="setTela('orcamento')">
            <span class="card-principal-icone">📋</span>
            <p class="card-principal-titulo">Solicitar Orçamento</p>
            <p class="card-principal-sub">Peça uma avaliação</p>
          </button>
        </div>

        <!-- Minha Conta -->
        <p class="secao-titulo">Minha Conta</p>
        <div class="secundarias-grid">
          <button class="card-secundario" onclick="setTela('acompanharChamado')">
            <div class="card-sec-icone-wrap" style="position:relative">
              <div class="card-sec-icone-circulo"><span>📡</span></div>
              <span class="badge-count" id="badge-chamados" style="display:none"></span>
            </div>
            <p class="card-sec-titulo">Acompanhar Chamado</p>
            <p class="card-sec-sub">Status em tempo real</p>
          </button>

          <button class="card-secundario" onclick="setTela('meusOrcamentos')">
            <div class="card-sec-icone-wrap" style="position:relative">
              <div class="card-sec-icone-circulo"><span>💰</span></div>
              <span class="badge-count" id="badge-orcamentos" style="display:none"></span>
            </div>
            <p class="card-sec-titulo">Meus Orçamentos</p>
            <p class="card-sec-sub">Acompanhe seus orçamentos</p>
          </button>

          <button class="card-secundario" onclick="setTela('historicoCliente')">
            <div class="card-sec-icone-circulo"><span>📋</span></div>
            <p class="card-sec-titulo">Histórico</p>
            <p class="card-sec-sub">Todos os atendimentos</p>
          </button>

          <button class="card-secundario" onclick="setTela('perfil')">
            <div class="card-sec-icone-circulo"><span>👤</span></div>
            <p class="card-sec-titulo">Meu Perfil</p>
            <p class="card-sec-sub">Editar meus dados</p>
          </button>
        </div>

        <!-- Programado pelo Suporte -->
        <button class="programado-btn" id="pr-programado" onclick="setTela('programadoCliente')">
          <div style="position:relative">
            <div class="card-sec-icone-circulo"><span>🛠️</span></div>
            <span class="badge-count" id="badge-programados" style="display:none"></span>
          </div>
          <div style="flex:1">
            <p class="card-sec-titulo" id="pr-prog-titulo">Programado pelo Suporte</p>
            <p class="card-sec-sub" id="pr-prog-sub">Nenhum agendamento no momento</p>
          </div>
          <span id="pr-prog-seta" style="display:none;color:rgba(56,182,255,.9);font-size:20px;font-weight:700">→</span>
        </button>

        <!-- Botões inferiores -->
        <div class="pr-botoes-inf">
          <button class="pr-btn-wpp" onclick="prAbrirWpp()">
            <span style="font-size:20px">💬</span>
            <div><p style="color:#fff;font-size:13px;font-weight:700">Suporte</p><p style="color:rgba(255,255,255,.6);font-size:10px">WhatsApp</p></div>
          </button>
          <button class="pr-btn-ajuda" onclick="setTela('ajuda')">
            <span style="font-size:20px">❓</span>
            <div><p style="color:var(--primary);font-size:13px;font-weight:700">Ajuda</p><p style="color:rgba(180,220,255,.5);font-size:10px">Central de ajuda</p></div>
          </button>
        </div>

        <div style="height:20px"></div>
      </div>
    `;

    criarFlocos('pr-flocos');
    assinarDados(usuario);
  }

  function assinarDados(usuario) {
    // Cancela assinaturas anteriores
    _unsubs.forEach(u => u && u());
    _unsubs = [];
    if (!usuario?.email) return;

    _unsubs.push(ouvirChamadosCliente(usuario.email, (lista) => {
      const ativos = lista.filter(c => ['Aguardando técnico','Aceito','Em atendimento'].includes(c.status));
      setBadge('badge-chamados', ativos.length);
      // Salva histórico local
      lista.forEach(c => salvarHistoricoLocal(usuario.email, { numero: c.numero, tipo: 'chamado', status: c.status, tipos: c.tipos, tipoServico: c.tipos?.join(', '), endereco: c.endereco, dataFormatada: c.dataFormatada, horario: c.horario, tecnico: c.tecnico, valorCobrado: c.valorCobrado, formaPagamento: c.formaPagamento, tempoAtendimento: c.tempoAtendimento, dataCriacao: c.dataCriacao }));
    }));

    _unsubs.push(ouvirOrcamentosCliente(usuario.email, (lista) => {
      const ativos = lista.filter(o => ['Aguardando análise','Em análise','Orçamento enviado'].includes(o.status));
      setBadge('badge-orcamentos', ativos.length);
      lista.forEach(o => salvarHistoricoLocal(usuario.email, { numero: o.numero, tipo: 'orcamento', status: o.status, tipoServico: o.tipoServico, tipoAparelho: o.tipoAparelho, btu: o.btu, quantidade: o.quantidade, endereco: o.endereco, valorOrcamento: o.valorOrcamento, dataCriacao: o.dataCriacao }));
    }));

    _unsubs.push(ouvirProgramados(usuario.email, (lista) => {
      const ativos = lista.filter(p => !['Cancelado','Concluído'].includes(p.status));
      setBadge('badge-programados', ativos.length);
      const temProg = ativos.length > 0;
      const subEl = document.getElementById('pr-prog-sub');
      const setaEl = document.getElementById('pr-prog-seta');
      const btnEl  = document.getElementById('pr-programado');
      if (subEl) subEl.textContent = temProg ? `${ativos.length} agendamento${ativos.length>1?'s':''} em andamento` : 'Nenhum agendamento no momento';
      if (setaEl) setaEl.style.display = temProg ? 'block' : 'none';
      if (btnEl) { btnEl.style.opacity = temProg ? '1' : '0.35'; btnEl.style.borderColor = temProg ? 'rgba(56,182,255,0.6)' : 'rgba(255,255,255,0.1)'; }
      lista.forEach(p => salvarHistoricoLocal(usuario.email, { numero: p.numero, tipo: 'programado', status: p.status, tipoServico: p.tipo, endereco: p.endereco, dataFormatada: p.dataFormatada, horario: p.horario, dataCriacao: p.dataCriacao }));
    }));
  }

  function setBadge(id, count) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) { el.textContent = count > 99 ? '99+' : count; el.style.display = 'flex'; }
    else el.style.display = 'none';
  }

  function salvarHistoricoLocal(email, item) {
    try {
      const chave = `@historico_${email}`;
      const raw = localStorage.getItem(chave);
      const lista = raw ? JSON.parse(raw) : [];
      const idx = lista.findIndex(i => i.numero === item.numero && i.tipo === item.tipo);
      if (idx >= 0) lista[idx] = { ...lista[idx], ...item, atualizadoEm: new Date().toISOString() };
      else lista.unshift({ ...item, salvoEm: new Date().toISOString() });
      localStorage.setItem(chave, JSON.stringify(lista.slice(0, 200)));
    } catch(e) {}
  }

  window.dispararExplosao = function () {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:999;overflow:hidden';
    document.body.appendChild(container);
    for (let i = 0; i < 40; i++) {
      const f = document.createElement('span');
      f.textContent = '❄';
      const size = 8 + Math.random() * 20;
      f.style.cssText = `position:absolute;font-size:${size}px;color:#38b6ff;top:50%;left:${Math.random()*100}%;opacity:0;text-shadow:0 0 8px rgba(56,182,255,0.6)`;
      container.appendChild(f);
      const delay = Math.random() * 600;
      setTimeout(() => {
        f.style.transition = `transform ${1.5 + Math.random()*2}s ease-out, opacity 1s ease`;
        f.style.opacity = '0.8';
        f.style.transform = `translate(${(Math.random()-0.5)*80}px, ${-(100+Math.random()*300)}px) rotate(${Math.random()*720}deg)`;
        setTimeout(() => { f.style.opacity = '0'; }, 1200);
      }, delay);
    }
    setTimeout(() => container.remove(), 4000);
  };

  window.prAbrirWpp = function () {
    const nome = State.get('usuarioLogado')?.nome || 'Cliente';
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Olá, meu nome é ${nome} e preciso de suporte!`)}`, '_blank');
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

  Router.registrarMount('principal', render);
})();
