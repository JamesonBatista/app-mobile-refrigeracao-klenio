// js/services/whatsapp.js
// ============================================================
// whatsapp.js — Abertura de links WhatsApp
// Substitui: import { Linking } from 'react-native'
// No browser usa window.open() — funciona em Android e iOS
// ============================================================

const WHATSAPP_ADMIN = '5581986967254';

// ── Formata número para padrão WhatsApp (só dígitos) ────────
// Importado inline aqui para não depender de utils/agenda.js ainda
function formatarTelefoneWhatsApp(numero) {
  if (!numero) return null;
  const apenasDigitos = numero.replace(/\D/g, '');
  if (apenasDigitos.length < 10) return null;
  // Garante DDI 55 (Brasil)
  if (apenasDigitos.startsWith('55')) return apenasDigitos;
  return '55' + apenasDigitos;
}

// ── Abre WhatsApp com mensagem ───────────────────────────────
function enviarMensagemWhatsApp(numero, mensagem) {
  const numeroFormatado = formatarTelefoneWhatsApp(numero);
  if (!numeroFormatado) {
    console.log('Número inválido:', numero);
    return;
  }
  const url = `https://wa.me/${numeroFormatado}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

function enviarMensagemParaAdmin(mensagem) {
  const url = `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// ══════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PARA O ADMIN (via WhatsApp)
// ══════════════════════════════════════════════════════════════

function notificarAdminNovoChamado(chamado) {
  const mensagem =
    `🔧 *Novo chamado aberto!*\n\n` +
    `👤 Cliente: ${chamado.cliente}\n` +
    `📱 Telefone: ${chamado.clienteTelefone || 'Não informado'}\n` +
    `🔢 Número: ${chamado.numero}\n` +
    `🔧 Problema(s): ${chamado.tipos?.join(', ')}\n` +
    `📍 Endereço: ${chamado.endereco}\n` +
    `📅 Data: ${chamado.dataFormatada}\n` +
    `🕐 Horário: ${chamado.horario}\n` +
    (chamado.detalhes ? `📝 Detalhes: ${chamado.detalhes}\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⏳ Status: Aguardando técnico`;
  enviarMensagemParaAdmin(mensagem);
}

function notificarAdminNovoOrcamento(orcamento) {
  const mensagem =
    `📋 *Novo orçamento solicitado!*\n\n` +
    `👤 Cliente: ${orcamento.cliente}\n` +
    `📱 Telefone: ${orcamento.clienteTelefone || 'Não informado'}\n` +
    `🔢 Número: ${orcamento.numero}\n` +
    `🔧 Serviço: ${orcamento.tipoServico}\n` +
    `❄ Aparelho: ${orcamento.tipoAparelho}\n` +
    `⚡ BTUs: ${orcamento.btu}\n` +
    `🔢 Quantidade: ${orcamento.quantidade} unid.\n` +
    (orcamento.metragem && orcamento.metragem !== 'Não informado' ? `📐 Metragem: ${orcamento.metragem}\n` : '') +
    `📍 Endereço: ${orcamento.endereco}\n` +
    `📅 Data visita: ${orcamento.dataFormatada}\n` +
    `🕐 Horário: ${orcamento.horario}\n` +
    (orcamento.detalhes ? `📝 Detalhes: ${orcamento.detalhes}\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⏳ Status: Aguardando análise`;
  enviarMensagemParaAdmin(mensagem);
}

function notificarAdminContestacao(programado, motivo) {
  const mensagem =
    `⚠️ *Programado contestado!*\n\n` +
    `👤 Cliente: ${programado.cliente}\n` +
    `📱 Telefone: ${programado.clienteTelefone || 'Não informado'}\n` +
    `🔢 Número: ${programado.numero}\n` +
    `🛠️ Tipo: ${programado.tipo}\n` +
    `📅 Data: ${programado.dataFormatada}\n` +
    `🕐 Horário: ${programado.horario}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ Motivo: ${motivo}`;
  enviarMensagemParaAdmin(mensagem);
}

// ══════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PARA O CLIENTE (via WhatsApp)
// ══════════════════════════════════════════════════════════════

function notificarClienteOrcamentoEnviado(clienteTelefone, orcamento) {
  const mensagem =
    `Olá, ${orcamento.cliente}! 👋\n\n` +
    `💰 *Seu orçamento está disponível!*\n\n` +
    `📋 *Detalhes do Orçamento*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${orcamento.numero}\n` +
    `🔧 Serviço: ${orcamento.tipoServico}\n` +
    `❄ Aparelho: ${orcamento.tipoAparelho}\n` +
    `⚡ BTUs: ${orcamento.btu}\n` +
    `🔢 Quantidade: ${orcamento.quantidade} unid.\n` +
    (orcamento.metragem && orcamento.metragem !== 'Não informado' ? `📐 Metragem: ${orcamento.metragem}\n` : '') +
    `📍 Endereço: ${orcamento.endereco}\n` +
    `📅 Data visita: ${orcamento.dataFormatada}\n` +
    `🕐 Horário: ${orcamento.horario}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 Valor: R$ ${orcamento.valorOrcamento}\n` +
    (orcamento.descricaoAdmin ? `📝 Descrição: ${orcamento.descricaoAdmin}\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Acesse o app para *Aprovar*, *Recusar* ou *Contestar* o orçamento.\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}

function notificarClienteMudancaStatus(clienteTelefone, chamado) {
  const mensagem =
    `Olá, ${chamado.cliente}! 👋\n\n` +
    `🔔 *Atualização do seu chamado!*\n\n` +
    `📋 *Detalhes*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${chamado.numero}\n` +
    `🔧 Problema(s): ${chamado.tipos?.join(', ')}\n` +
    `📍 Endereço: ${chamado.endereco}\n` +
    `📅 Data: ${chamado.dataFormatada}\n` +
    `🕐 Horário: ${chamado.horario}\n` +
    (chamado.tecnico ? `👷 Técnico: ${chamado.tecnico}\n` : '') +
    (chamado.observacaoTecnica ? `📝 Observação: ${chamado.observacaoTecnica}\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔄 Novo status: *${chamado.status}*\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}

function notificarClienteChamadoCancelado(clienteTelefone, chamado) {
  const mensagem =
    `Olá, ${chamado.cliente}! 👋\n\n` +
    `❌ *Seu chamado foi cancelado.*\n\n` +
    `📋 *Detalhes*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${chamado.numero}\n` +
    `🔧 Problema(s): ${chamado.tipos?.join(', ')}\n` +
    `📅 Data: ${chamado.dataFormatada}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Em caso de dúvidas entre em contato conosco.\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}

function notificarClienteOrcamentoCancelado(clienteTelefone, orcamento) {
  const mensagem =
    `Olá, ${orcamento.cliente}! 👋\n\n` +
    `🚫 *Seu orçamento foi cancelado.*\n\n` +
    `📋 *Detalhes*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${orcamento.numero}\n` +
    `🔧 Serviço: ${orcamento.tipoServico}\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `Em caso de dúvidas entre em contato conosco.\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}

function notificarClienteProgramadoCriado(clienteTelefone, programado) {
  const mensagem =
    `Olá, ${programado.cliente}! 👋\n\n` +
    `📅 *O suporte agendou um atendimento para você!*\n\n` +
    `📋 *Detalhes do Agendamento*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${programado.numero}\n` +
    `🛠️ Tipo: ${programado.tipo}\n` +
    `📍 Endereço: ${programado.endereco}\n` +
    `📅 Data: ${programado.dataFormatada}\n` +
    `🕐 Horário: ${programado.horario}\n` +
    (programado.detalhes ? `📝 Observações: ${programado.detalhes}\n` : '') +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📲 Acesse o app para *Aceitar* ou *Contestar* o agendamento.\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}

function notificarClienteRespostaContestacao(clienteTelefone, programado, resposta) {
  const mensagem =
    `Olá, ${programado.cliente}! 👋\n\n` +
    `💬 *O suporte respondeu sua contestação!*\n\n` +
    `📋 *Detalhes*\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `🔢 Número: ${programado.numero}\n` +
    `🛠️ Tipo: ${programado.tipo}\n` +
    `📅 Data: ${programado.dataFormatada}\n` +
    `🕐 Horário: ${programado.horario}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💬 Resposta: ${resposta}\n\n` +
    `Acesse o app para *Aceitar* ou *Contestar* novamente.\n\n` +
    `Klenio Refrigeração ❄`;
  enviarMensagemWhatsApp(clienteTelefone, mensagem);
}
