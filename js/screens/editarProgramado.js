// js/screens/editarProgramado.js

(function () {
  let diaSelecionado = null, horarioSelecionado = null;

  function render() {
    const prog = State.get('programadoSelecionado');
    const el = document.getElementById('tela-editarProgramado');
    el.innerHTML = `
      <div class="scroll">
        <div class="header">
          <div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">Editar Programado</span></div>
          <button class="btn-voltar" onclick="setTela('painelAdmin')">← Voltar</button>
        </div>

        <div class="card" style="margin-bottom:14px;">
          <div style="background:rgba(56,182,255,0.1);border-radius:10px;padding:10px;border:1px solid rgba(56,182,255,0.3);">
            <p style="color:#38b6ff;font-size:13px;font-weight:700;">${prog?.numero}</p>
            <p style="color:rgba(180,220,255,0.6);font-size:12px;">${prog?.cliente} • ${prog?.status}</p>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Nova data <span style="color:#e74c3c">*</span></p>
          <div class="calendario-scroll" id="ep-cal"></div>
          <div id="ep-horarios-wrap" style="margin-top:16px;display:none;">
            <p class="subtitulo">Horários disponíveis</p>
            <div id="ep-horarios-lista"></div>
          </div>
        </div>

        <div class="card">
          <p class="titulo">Endereço</p>
          <div class="input-wrap"><span class="input-icone">📍</span>
            <input id="ep-endereco" type="text" value="${prog?.endereco||''}" style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>
          <p class="titulo" style="margin-top:14px;">Observações</p>
          <textarea id="ep-detalhes" class="input-area">${prog?.detalhes||''}</textarea>
          <p class="titulo" style="margin-top:14px;">Técnico responsável</p>
          <div class="input-wrap"><span class="input-icone">👷</span>
            <input id="ep-tecnico" type="text" value="${prog?.tecnico||''}" placeholder="Nome do técnico..." style="flex:1;padding:12px 0;font-size:14px;color:#fff;background:transparent;border:none;" />
          </div>
        </div>

        <div class="card" style="margin-top:14px;">
          <p class="titulo" style="color:#8e44ad;">Responder contestação</p>
          <textarea id="ep-resposta" class="input-area" placeholder="Resposta para o cliente..."></textarea>
          <button id="btn-responder" style="width:100%;padding:12px;border-radius:10px;background:rgba(41,128,185,0.15);border:1px solid rgba(41,128,185,0.4);color:#2980b9;font-size:13px;font-weight:700;cursor:pointer;margin-top:10px;">💬 Enviar resposta</button>
        </div>

        <button id="btn-salvar-ep" class="btn-primary" style="margin-top:20px;">💾 Salvar alterações</button>

        <div style="display:flex;gap:10px;margin-top:10px;">
          <button id="btn-cancelar-prog" style="flex:1;padding:12px;border-radius:10px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;font-size:13px;font-weight:700;cursor:pointer;">❌ Cancelar</button>
          <button id="btn-excluir-prog" style="flex:1;padding:12px;border-radius:10px;background:rgba(127,140,141,0.1);border:1px solid rgba(127,140,141,0.3);color:#7f8c8d;font-size:13px;font-weight:700;cursor:pointer;">🗑️ Excluir</button>
        </div>
        <div style="height:20px;"></div>
      </div>`;

    const dias = getProximosDias();
    const calCont = el.querySelector('#ep-cal');
    calCont.innerHTML = dias.map(d => {
      const chave = formatarDataChave(d);
      const atual = prog?.dataChave === chave;
      return `<div class="dia-btn ${atual?'selecionado':''}" onclick="selecionarDiaEP(this,'${chave}')">
        <span class="dia-semana">${d.toLocaleDateString('pt-BR',{weekday:'short'})}</span>
        <span class="dia-numero ${atual?'selecionado':''}">${d.getDate()}</span>
        <span class="dia-mes">${d.toLocaleDateString('pt-BR',{month:'short'})}</span>
      </div>`;
    }).join('');
    if (prog?.dataChave) diaSelecionado = dias.find(d => formatarDataChave(d) === prog.dataChave);

    window.selecionarDiaEP = async (btn, chave) => {
      el.querySelectorAll('.dia-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado');
      diaSelecionado = dias.find(d => formatarDataChave(d) === chave);
      horarioSelecionado = null;
      const wrap = el.querySelector('#ep-horarios-wrap');
      const lista = el.querySelector('#ep-horarios-lista');
      wrap.style.display = 'block';
      lista.innerHTML = '<div class="spinner" style="width:20px;height:20px;"></div>';
      const disponiveis = await getHorariosDisponiveis(diaSelecionado);
      lista.innerHTML = disponiveis.map(h => `<button class="horario-btn ${h===prog?.horario?'selecionado':''}" onclick="selecionarHorarioEP(this,'${h}')"><span>🕐</span><span style="color:#fff;font-weight:600;">${h}</span></button>`).join('');
      if (prog?.horario) horarioSelecionado = prog.horario;
    };

    window.selecionarHorarioEP = (btn, h) => {
      el.querySelectorAll('.horario-btn').forEach(b => b.classList.remove('selecionado'));
      btn.classList.add('selecionado'); horarioSelecionado = h;
    };

    el.querySelector('#btn-responder').addEventListener('click', async () => {
      const resposta = el.querySelector('#ep-resposta').value.trim();
      if (!resposta) { alert('Digite uma resposta.'); return; }
      await responderContestacao(prog.numero, resposta);
      notificarClienteRespostaContestacao(prog.clienteTelefone, prog, resposta);
      el.querySelector('#ep-resposta').value = '';
      alert('Resposta enviada!');
    });

    el.querySelector('#btn-salvar-ep').addEventListener('click', async () => {
      const updates = {
        endereco: el.querySelector('#ep-endereco').value.trim(),
        detalhes: el.querySelector('#ep-detalhes').value,
        tecnico: el.querySelector('#ep-tecnico').value.trim(),
      };
      if (diaSelecionado) { updates.dataFormatada = formatarData(diaSelecionado); updates.dataChave = formatarDataChave(diaSelecionado); }
      if (horarioSelecionado) updates.horario = horarioSelecionado;
      await editarProgramado(prog.numero, updates);
      alert('✅ Programado atualizado!');
      setTela('painelAdmin');
    });

    el.querySelector('#btn-cancelar-prog').addEventListener('click', async () => {
      if (!confirm('Cancelar este programado?')) return;
      await cancelarProgramado(prog.numero);
      setTela('painelAdmin');
    });

    el.querySelector('#btn-excluir-prog').addEventListener('click', async () => {
      if (!confirm('Excluir permanentemente este programado?')) return;
      await excluirProgramado(prog.numero);
      setTela('painelAdmin');
    });
  }

  Router.registrarMount('editarProgramado', render);
})();
