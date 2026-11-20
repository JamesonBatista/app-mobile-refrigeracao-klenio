const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  montarMensagemChamado,
  abrirCompartilhamentoWhatsApp,
} = require("../js/utils/compartilharChamadoWhatsApp.js");

describe("Compartilhar chamado no WhatsApp (admin)", () => {
  it("inclui todas as informações textuais relevantes", () => {
    const msg = montarMensagemChamado({
      numero: "CH-100",
      status: "Em atendimento",
      urgencia: "Urgente",
      cliente: "Maria",
      clienteEmail: "maria@email.com",
      clienteTelefone: "81999999999",
      dataFormatada: "21/11/2026",
      dataChave: "2026-11-21",
      horario: "08:00 às 10:00",
      endereco: "Rua A, 10",
      dataCriacao: "20/11/2026 às 14:00",
      tipos: ["Vazamento", "Barulho"],
      detalhes: "Pinga na sala",
      tecnico: "João",
      observacaoTecnica: "Verificar válvula",
      tempoAtendimento: "45min",
      geradoDeOrcamento: "ORC-9",
      tipoServico: "Instalação",
      tipoAparelho: "Split",
      btu: "12000",
      valorOrcamento: "450,00",
      valorCobrado: "480,00",
      formaPagamento: "Pix",
      criadoPorAdmin: true,
      historicoStatus: [
        { status: "Aguardando técnico", data: "20/11/2026", hora: "14:00" },
        { status: "Aceito", data: "20/11/2026", hora: "15:10" },
      ],
      fotos: ["data:image/jpeg;base64,AAAA", "https://exemplo.com/foto.jpg"],
    });

    assert.match(msg, /CH-100/);
    assert.match(msg, /Em atendimento/);
    assert.match(msg, /URGENTE|Urgente/);
    assert.match(msg, /Maria/);
    assert.match(msg, /maria@email\.com/);
    assert.match(msg, /81999999999/);
    assert.match(msg, /2026-11-21/);
    assert.match(msg, /Vazamento, Barulho/);
    assert.match(msg, /Pinga na sala/);
    assert.match(msg, /João/);
    assert.match(msg, /Verificar válvula/);
    assert.match(msg, /45min/);
    assert.match(msg, /ORC-9/);
    assert.match(msg, /Instalação/);
    assert.match(msg, /Split/);
    assert.match(msg, /12000/);
    assert.match(msg, /450,00/);
    assert.match(msg, /480,00/);
    assert.match(msg, /Pix/);
    assert.match(msg, /Aberto pelo suporte/);
    assert.match(msg, /Aguardando técnico/);
    assert.match(msg, /Aceito/);
    assert.match(msg, /2 anexo/);
    assert.match(msg, /não incluídas/);
  });

  it("nunca inclui conteúdo de imagens/fotos", () => {
    const msg = montarMensagemChamado({
      numero: "CH-1",
      fotos: ["data:image/jpeg;base64,ABCDEF123456", "https://cdn.exemplo.com/x.png"],
      thumbnail: "data:image/png;base64,ZZZZ",
    });
    assert.doesNotMatch(msg, /ABCDEF123456/);
    assert.doesNotMatch(msg, /cdn\.exemplo\.com/);
    assert.doesNotMatch(msg, /data:image/);
    assert.doesNotMatch(msg, /ZZZZ/);
  });

  it("usa fallbacks quando campos estão vazios", () => {
    const msg = montarMensagemChamado({});
    assert.match(msg, /Não informado/);
    assert.doesNotMatch(msg, /Histórico de status/);
    assert.doesNotMatch(msg, /Pagamento/);
  });

  it("gera URL de compartilhamento sem telefone (seletor de contato)", () => {
    const result = abrirCompartilhamentoWhatsApp("Olá chamado");
    assert.equal(result.ok, true);
    assert.match(result.webUrl, /^https:\/\/wa\.me\/\?text=/);
    assert.match(result.appUrl, /^whatsapp:\/\/send\?text=/);
    assert.doesNotMatch(result.webUrl, /phone=/);
  });
});
