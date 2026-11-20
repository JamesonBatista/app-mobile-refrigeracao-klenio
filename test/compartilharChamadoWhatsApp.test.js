const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  montarMensagemChamado,
  abrirCompartilhamentoWhatsApp,
} = require("../js/utils/compartilharChamadoWhatsApp.js");

describe("Compartilhar chamado no WhatsApp (admin)", () => {
  it("monta mensagem com dados principais do chamado", () => {
    const msg = montarMensagemChamado({
      numero: "CH-100",
      status: "Aceito",
      cliente: "Maria",
      clienteTelefone: "81999999999",
      dataFormatada: "21/11/2026",
      horario: "08:00 às 10:00",
      endereco: "Rua A, 10",
      tipos: ["Vazamento", "Barulho"],
      tecnico: "João",
      urgencia: "Urgente",
    });

    assert.match(msg, /CH-100/);
    assert.match(msg, /Aceito/);
    assert.match(msg, /Maria/);
    assert.match(msg, /81999999999/);
    assert.match(msg, /Vazamento, Barulho/);
    assert.match(msg, /João/);
    assert.match(msg, /URGENTE/);
    assert.match(msg, /painel admin/);
  });

  it("usa fallbacks quando campos estão vazios", () => {
    const msg = montarMensagemChamado({});
    assert.match(msg, /Número: -/);
    assert.match(msg, /Não informado/);
    assert.doesNotMatch(msg, /Técnico:/);
    assert.doesNotMatch(msg, /Problemas:/);
  });

  it("gera URL de compartilhamento sem telefone (seletor de contato)", () => {
    const result = abrirCompartilhamentoWhatsApp("Olá chamado");
    assert.equal(result.ok, true);
    assert.match(result.webUrl, /^https:\/\/wa\.me\/\?text=/);
    assert.match(result.appUrl, /^whatsapp:\/\/send\?text=/);
    assert.doesNotMatch(result.webUrl, /phone=/);
  });
});
