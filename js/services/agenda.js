// js/services/agenda.js
// ============================================================
// agenda.js — utilitários de data/hora e acesso ao Firestore
// Substitui: utils/agenda.js
// Depende de: firebase.js (db já inicializado globalmente)
// ============================================================

const HORARIOS_SEMANA = [
  '08:00 às 10:00',
  '10:00 às 12:00',
  '13:00 às 15:00',
  '15:00 às 17:00',
];

const HORARIOS_SABADO = [
  '09:00 às 11:00',
  '11:30 às 13:00',
];

const MAX_POR_DIA = 4;
const MAX_SABADO  = 2;

const isDomingo = (data) => data.getDay() === 0;
const isSabado  = (data) => data.getDay() === 6;

const getProximosDias = () => {
  const dias = [];
  const hoje = new Date();
  let contador = 0, i = 0;
  while (contador < 7) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() + i++);
    if (!isDomingo(data)) { dias.push(data); contador++; }
  }
  return dias;
};

const formatarData = (data) =>
  data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

const formatarDataChave = (data) => data.toISOString().split('T')[0];

const getHorariosDoDia = (data) => isSabado(data) ? HORARIOS_SABADO : HORARIOS_SEMANA;
const getMaxDia = (data) => isSabado(data) ? MAX_SABADO : MAX_POR_DIA;

const getHoraInicio = (horario) => {
  if (!horario) return 0;
  const parte = horario.split('às')[0].trim();
  const [hora, minuto] = parte.split(':').map(Number);
  return hora * 60 + minuto;
};

const isHoje = (data) => {
  const hoje = new Date();
  return data.getDate() === hoje.getDate() &&
         data.getMonth() === hoje.getMonth() &&
         data.getFullYear() === hoje.getFullYear();
};

const getNowStr = () => {
  const agora = new Date();
  return {
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    iso:  agora.toISOString(),
  };
};

// ── CHAMADOS ────────────────────────────────────────────────

async function carregarChamados() {
  try {
    const snap = await db.collection('chamados').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.log('Erro carregarChamados:', e); return []; }
}

async function salvarChamado(chamado) {
  try { await db.collection('chamados').doc(chamado.numero).set(chamado); }
  catch (e) { console.log('Erro salvarChamado:', e); }
}

async function atualizarChamado(numero, updates) {
  try { await db.collection('chamados').doc(numero).update(updates); }
  catch (e) { console.log('Erro atualizarChamado:', e); }
}

async function registrarMudancaStatus(numero, novoStatus) {
  try {
    const { data, hora, iso } = getNowStr();
    const doc   = await db.collection('chamados').doc(numero).get();
    const dados = doc.data();
    const historico = dados.historicoStatus || [];
    historico.push({ status: novoStatus, data, hora, iso });
    await db.collection('chamados').doc(numero).update({
      status: novoStatus,
      historicoStatus: historico,
      [`timestamp_${novoStatus.replace(/ /g, '_')}`]: iso,
    });
  } catch (e) { console.log('Erro registrarMudancaStatus:', e); }
}

async function carregarChamadoPorNumero(numero) {
  try {
    const doc = await db.collection('chamados').doc(numero).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (e) { console.log('Erro carregarChamadoPorNumero:', e); return null; }
}

function ouvirChamado(numero, callback) {
  return db.collection('chamados').doc(numero).onSnapshot(doc => {
    if (doc.exists) callback({ id: doc.id, ...doc.data() });
  });
}

function ouvirChamados(callback) {
  return db.collection('chamados').onSnapshot(snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

function ouvirChamadosCliente(emailCliente, callback) {
  return db.collection('chamados')
    .where('clienteEmail', '==', emailCliente)
    .onSnapshot(snap => {
      const ordem = { 'Aguardando técnico': 0, 'Aceito': 1, 'Em atendimento': 2, 'Concluído': 3, 'Cancelado': 4 };
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lista.sort((a, b) => (ordem[a.status] ?? 5) - (ordem[b.status] ?? 5));
      callback(lista);
    });
}

// ── BLOQUEIOS ────────────────────────────────────────────────

async function carregarBloqueios() {
  try {
    const snap = await db.collection('bloqueios').get();
    const bloqueios = {};
    snap.docs.forEach(d => { bloqueios[d.id] = d.data().horarios || []; });
    return bloqueios;
  } catch (e) { console.log('Erro carregarBloqueios:', e); return {}; }
}

async function salvarBloqueio(chave, horarios) {
  try { await db.collection('bloqueios').doc(chave).set({ horarios }); }
  catch (e) { console.log('Erro salvarBloqueio:', e); }
}

async function removerBloqueio(chave, horario) {
  try {
    const doc = await db.collection('bloqueios').doc(chave).get();
    if (doc.exists) {
      const horarios = doc.data().horarios || [];
      const novos = horarios.filter(h => h !== horario);
      if (novos.length === 0) await db.collection('bloqueios').doc(chave).delete();
      else await db.collection('bloqueios').doc(chave).set({ horarios: novos });
    }
  } catch (e) { console.log('Erro removerBloqueio:', e); }
}

function ouvirBloqueios(callback) {
  return db.collection('bloqueios').onSnapshot(snap => {
    const bloqueios = {};
    snap.docs.forEach(d => { bloqueios[d.id] = d.data().horarios || []; });
    callback(bloqueios);
  });
}

// ── HORÁRIOS DISPONÍVEIS ─────────────────────────────────────

async function getHorariosDisponiveis(data) {
  const chave       = formatarDataChave(data);
  const horariosDia = getHorariosDoDia(data);
  const maxDia      = getMaxDia(data);
  const hoje        = isHoje(data);
  const agora       = new Date();
  const agoraMin    = agora.getHours() * 60 + agora.getMinutes();

  try {
    const [chamadosSnap, bloqueioDoc, programadosSnap] = await Promise.all([
      db.collection('chamados').where('dataChave', '==', chave).get(),
      db.collection('bloqueios').doc(chave).get(),
      db.collection('programados').where('dataChave', '==', chave).get(),
    ]);

    const chamadosDia   = chamadosSnap.docs.map(d => d.data()).filter(c => c.status !== 'Cancelado');
    const programadosDia= programadosSnap.docs.map(d => d.data()).filter(p => p.status !== 'Cancelado');
    const bloqueiosDia  = bloqueioDoc.exists ? (bloqueioDoc.data().horarios || []) : [];

    if (bloqueiosDia.includes('DIA_COMPLETO')) return [];

    const todosOcupados = [...chamadosDia, ...programadosDia].map(c => c.horario);

    return horariosDia.filter(h => {
      if (bloqueiosDia.includes(h)) return false;
      if (todosOcupados.filter(o => o === h).length >= maxDia) return false;
      if (hoje) {
        const horaIni = getHoraInicio(h);
        if (horaIni <= agoraMin + 60) return false;
      }
      return true;
    });
  } catch (e) {
    console.log('Erro getHorariosDisponiveis:', e);
    return horariosDia;
  }
}

// ── CLIENTES ─────────────────────────────────────────────────

async function carregarClientes() {
  try {
    const snap = await db.collection('clientes').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.log('Erro carregarClientes:', e); return []; }
}

// ── PROGRAMADOS ──────────────────────────────────────────────

async function salvarProgramado(programado) {
  try { await db.collection('programados').doc(programado.numero).set(programado); }
  catch (e) { console.log('Erro salvarProgramado:', e); }
}

async function carregarProgramados(emailCliente) {
  try {
    const snap = await db.collection('programados').where('clienteEmail', '==', emailCliente).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { console.log('Erro carregarProgramados:', e); return []; }
}

function ouvirProgramados(emailCliente, callback) {
  return db.collection('programados')
    .where('clienteEmail', '==', emailCliente)
    .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

function ouvirTodosProgramados(callback) {
  return db.collection('programados')
    .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

async function atualizarProgramado(numero, updates) {
  try { await db.collection('programados').doc(numero).update(updates); }
  catch (e) { console.log('Erro atualizarProgramado:', e); }
}

async function contestarProgramado(numero, motivo) {
  try {
    const doc = await db.collection('programados').doc(numero).get();
    const historico = doc.data().historico || [];
    historico.push({ tipo: 'contestacao', mensagem: motivo, data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    await db.collection('programados').doc(numero).update({ status: 'Contestado', historico });
  } catch (e) { console.log('Erro contestarProgramado:', e); }
}

async function responderContestacao(numero, resposta) {
  try {
    const doc = await db.collection('programados').doc(numero).get();
    const historico = doc.data().historico || [];
    historico.push({ tipo: 'resposta', mensagem: resposta, data: new Date().toLocaleDateString('pt-BR'), hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) });
    await db.collection('programados').doc(numero).update({ status: 'Respondido', historico });
  } catch (e) { console.log('Erro responderContestacao:', e); }
}

async function aceitarProgramado(numero) {
  try { await db.collection('programados').doc(numero).update({ status: 'Aceito' }); }
  catch (e) { console.log('Erro aceitarProgramado:', e); }
}

function ouvirProgramado(numero, callback) {
  return db.collection('programados').doc(numero).onSnapshot(doc => {
    if (doc.exists) callback({ id: doc.id, ...doc.data() });
  });
}

async function editarProgramado(numero, updates) {
  try { await db.collection('programados').doc(numero).update(updates); }
  catch (e) { console.log('Erro editarProgramado:', e); }
}

async function excluirProgramado(numero) {
  try { await db.collection('programados').doc(numero).delete(); }
  catch (e) { console.log('Erro excluirProgramado:', e); }
}

async function cancelarProgramado(numero) {
  try { await db.collection('programados').doc(numero).update({ status: 'Cancelado' }); }
  catch (e) { console.log('Erro cancelarProgramado:', e); }
}

// ── ORÇAMENTOS ───────────────────────────────────────────────

async function salvarOrcamento(orcamento) {
  try { await db.collection('orcamentos').doc(orcamento.numero).set(orcamento); }
  catch (e) { console.log('Erro salvarOrcamento:', e); }
}

async function atualizarOrcamento(numero, updates) {
  try { await db.collection('orcamentos').doc(numero).update(updates); }
  catch (e) { console.log('Erro atualizarOrcamento:', e); }
}

function ouvirOrcamentosCliente(emailCliente, callback) {
  return db.collection('orcamentos')
    .where('clienteEmail', '==', emailCliente)
    .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

function ouvirTodosOrcamentos(callback) {
  return db.collection('orcamentos')
    .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ── PROFISSIONAIS ─────────────────────────────────────────────

async function salvarProfissional(profissional) {
  try { await db.collection('profissionais').doc(profissional.id).set(profissional); }
  catch (e) { console.log('Erro salvarProfissional:', e); }
}

async function atualizarProfissional(id, updates) {
  try { await db.collection('profissionais').doc(id).update(updates); }
  catch (e) { console.log('Erro atualizarProfissional:', e); }
}

async function excluirProfissional(id) {
  try { await db.collection('profissionais').doc(id).delete(); }
  catch (e) { console.log('Erro excluirProfissional:', e); }
}

function ouvirProfissionais(callback) {
  return db.collection('profissionais').onSnapshot(snap => {
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    lista.sort((a, b) => a.nome.localeCompare(b.nome));
    callback(lista);
  });
}

// ── RELATÓRIOS ───────────────────────────────────────────────

async function salvarRegistroFinanceiro(chamado) {
  try {
    const { data, hora, iso } = getNowStr();
    let tempoAtendimento = null;
    if (chamado.timestamp_Em_atendimento) {
      const inicio  = new Date(chamado.timestamp_Em_atendimento);
      const diffMin = Math.floor((new Date() - inicio) / 60000);
      const horas   = Math.floor(diffMin / 60);
      const minutos = diffMin % 60;
      tempoAtendimento = horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
    }
    const registro = {
      id: `rel_${chamado.numero}_${Date.now()}`,
      numeroChamado: chamado.numero,
      cliente: chamado.cliente, clienteEmail: chamado.clienteEmail,
      clienteTelefone: chamado.clienteTelefone || '',
      tecnico: chamado.tecnico || '', tipos: chamado.tipos || [],
      endereco: chamado.endereco, dataServico: chamado.dataFormatada,
      dataChave: chamado.dataChave, horario: chamado.horario,
      formaPagamento: chamado.formaPagamento || '',
      valorCobrado: chamado.valorCobrado || '0',
      valorNumerico: parseFloat((chamado.valorCobrado || '0').replace(',', '.')),
      dataConclusao: data, horaConclusao: hora, dataConclusaoISO: iso,
      dataAbertura: chamado.dataAbertura || '', horaAbertura: chamado.horaAbertura || '',
      tempoAtendimento, historicoStatus: chamado.historicoStatus || [],
      geradoDeOrcamento: chamado.geradoDeOrcamento || null,
      urgencia: chamado.urgencia || 'Normal',
    };
    await db.collection('relatorios').doc(registro.id).set(registro);
  } catch (e) { console.log('Erro salvarRegistroFinanceiro:', e); }
}

function ouvirRelatorios(callback) {
  return db.collection('relatorios')
    .orderBy('dataConclusaoISO', 'desc')
    .onSnapshot(snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

// ── UTILS ────────────────────────────────────────────────────

function formatarTelefoneWhatsApp(telefone) {
  if (!telefone) return null;
  const nums = telefone.replace(/\D/g, '');
  if (nums.length === 11 || nums.length === 10) return `55${nums}`;
  return null;
}

function gerarNumero(prefixo = '#') {
  return prefixo + Math.floor(Math.random() * 90000 + 10000);
}
