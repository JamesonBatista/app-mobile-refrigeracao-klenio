// js/utils/compartilharChamadoWhatsApp.js
// Monta e abre mensagem de compartilhamento de chamado no WhatsApp (admin).
// Inclui todas as informações textuais do chamado; nunca inclui imagens/fotos.

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CompartilharChamadoWhatsApp = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  const CAMPOS_IGNORADOS = {
    fotos: true,
    foto: true,
    imagens: true,
    imagem: true,
    uri: true,
    url: true,
    src: true,
    base64: true,
    thumbnail: true,
  };

  function textoSeguro(value, fallback) {
    const t = String(value == null ? "" : value).trim();
    return t || fallback || "-";
  }

  function adicionarLinha(linhas, label, value, fallback, obrigatorio) {
    const vazio = value == null || String(value).trim() === "";
    if (vazio && !obrigatorio) return;
    const texto = textoSeguro(value, fallback);
    if (!texto || (texto === "-" && !obrigatorio)) return;
    linhas.push(`${label}: ${texto}`);
  }

  function formatarHistoricoStatus(historico) {
    if (!Array.isArray(historico) || historico.length === 0) return [];
    return historico
      .map(function (item) {
        if (!item || typeof item !== "object") return null;
        const status = textoSeguro(item.status);
        const data = textoSeguro(item.data, "");
        const hora = textoSeguro(item.hora, "");
        const quando = [data, hora].filter(Boolean).join(" às ");
        if (status === "-") return null;
        return quando ? `• ${status} — ${quando}` : `• ${status}`;
      })
      .filter(Boolean);
  }

  function contarFotos(chamado) {
    const fotos = chamado && chamado.fotos;
    return Array.isArray(fotos) ? fotos.length : 0;
  }

  function montarMensagemChamado(chamado) {
    const c = chamado && typeof chamado === "object" ? chamado : {};
    const tipos = Array.isArray(c.tipos) ? c.tipos.filter(Boolean) : [];
    const linhas = ["❄ *Klenio Refrigeração — Chamado*", ""];

    linhas.push("*Identificação*");
    adicionarLinha(linhas, "🔢 Número", c.numero);
    adicionarLinha(linhas, "📌 Status", c.status);
    adicionarLinha(linhas, "🚨 Urgência", c.urgencia || "Normal");
    if (c.criadoPorAdmin) {
      linhas.push("🛠️ Origem: Aberto pelo suporte / admin");
    }
    if (c.geradoDeOrcamento) {
      adicionarLinha(linhas, "🔗 Orçamento de origem", c.geradoDeOrcamento);
    }

    linhas.push("", "*Cliente*");
    adicionarLinha(linhas, "👤 Nome", c.cliente);
    adicionarLinha(linhas, "✉️ E-mail", c.clienteEmail);
    adicionarLinha(linhas, "📱 Telefone", c.clienteTelefone, "Não informado", true);

    linhas.push("", "*Agendamento*");
    adicionarLinha(linhas, "📅 Data", c.dataFormatada);
    adicionarLinha(linhas, "🗓️ Data (chave)", c.dataChave);
    adicionarLinha(linhas, "🕐 Horário", c.horario);
    adicionarLinha(linhas, "📍 Endereço", c.endereco);
    adicionarLinha(linhas, "🗓️ Aberto em", c.dataCriacao || (c.dataAbertura && c.horaAbertura ? `${c.dataAbertura} às ${c.horaAbertura}` : c.dataAbertura));

    linhas.push("", "*Serviço*");
    if (tipos.length) {
      linhas.push(`🛠️ Problemas: ${tipos.join(", ")}`);
    }
    adicionarLinha(linhas, "📝 Detalhes", c.detalhes);
    adicionarLinha(linhas, "👷 Técnico", c.tecnico);
    adicionarLinha(linhas, "🗒️ Observação técnica", c.observacaoTecnica);
    adicionarLinha(linhas, "⏱️ Tempo de atendimento", c.tempoAtendimento);

    if (c.tipoServico || c.tipoAparelho || c.btu || c.valorOrcamento) {
      linhas.push("", "*Orçamento vinculado*");
      adicionarLinha(linhas, "🔧 Tipo de serviço", c.tipoServico);
      if (c.tipoAparelho || c.btu) {
        const aparelho = [c.tipoAparelho, c.btu ? `${textoSeguro(c.btu)} BTUs` : ""]
          .filter(Boolean)
          .join(" • ");
        adicionarLinha(linhas, "❄️ Aparelho", aparelho);
      }
      if (c.valorOrcamento) {
        linhas.push(`💵 Valor orçado: R$ ${textoSeguro(c.valorOrcamento)}`);
      }
    }

    if (c.valorCobrado || c.formaPagamento) {
      linhas.push("", "*Pagamento*");
      if (c.valorCobrado) {
        linhas.push(`💰 Valor cobrado: R$ ${textoSeguro(c.valorCobrado)}`);
      }
      adicionarLinha(linhas, "💳 Forma de pagamento", c.formaPagamento);
    }

    const historicoLinhas = formatarHistoricoStatus(c.historicoStatus);
    if (historicoLinhas.length) {
      linhas.push("", "*Histórico de status*");
      historicoLinhas.forEach(function (linha) {
        linhas.push(linha);
      });
    }

    const qtdFotos = contarFotos(c);
    if (qtdFotos > 0) {
      linhas.push(
        "",
        `🖼️ Fotos: ${qtdFotos} anexo(s) — *não incluídas* neste compartilhamento`
      );
    }

    // Campos extras textuais que existam no objeto, sem imagens/URLs/base64
    const conhecidos = {
      numero: true,
      status: true,
      urgencia: true,
      criadoPorAdmin: true,
      geradoDeOrcamento: true,
      cliente: true,
      clienteEmail: true,
      clienteTelefone: true,
      dataFormatada: true,
      dataChave: true,
      horario: true,
      endereco: true,
      dataCriacao: true,
      dataAbertura: true,
      horaAbertura: true,
      tipos: true,
      detalhes: true,
      tecnico: true,
      observacaoTecnica: true,
      tempoAtendimento: true,
      tipoServico: true,
      tipoAparelho: true,
      btu: true,
      valorOrcamento: true,
      valorCobrado: true,
      formaPagamento: true,
      historicoStatus: true,
      fotos: true,
      sistemaReativacao: true,
      sistemaGeradoEm: true,
      timestamp_Em_atendimento: true,
      valorNumerico: true,
      excluidoPorAdmin: true,
      excluidoEm: true,
    };

    const extras = [];
    Object.keys(c).forEach(function (chave) {
      if (conhecidos[chave] || CAMPOS_IGNORADOS[chave]) return;
      if (/foto|image|img|uri|base64|thumb/i.test(chave)) return;
      const valor = c[chave];
      if (valor == null || valor === "") return;
      if (typeof valor === "object") return;
      if (typeof valor === "string" && /^(data:image|blob:|https?:\/\/\S+\.(png|jpe?g|gif|webp))/i.test(valor)) {
        return;
      }
      extras.push(`${chave}: ${textoSeguro(valor)}`);
    });
    if (extras.length) {
      linhas.push("", "*Outras informações*");
      extras.forEach(function (linha) {
        linhas.push(linha);
      });
    }

    linhas.push("", "Compartilhado pelo painel admin ❄");
    return linhas.join("\n");
  }

  function abrirCompartilhamentoWhatsApp(mensagem) {
    const textoBruto = String(mensagem || "");
    const texto =
      typeof rootSanitizar() === "function"
        ? rootSanitizar()(textoBruto) || textoBruto
        : textoBruto.trim();
    const encoded = encodeURIComponent(texto);
    const appUrl = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://wa.me/?text=${encoded}`;

    if (typeof window === "undefined") {
      return { ok: true, appUrl, webUrl };
    }

    if (typeof window.abrirLinkWhatsApp === "function") {
      const ok = window.abrirLinkWhatsApp(null, texto, { compartilhar: true });
      if (ok) return { ok: true, appUrl, webUrl };
    }

    const userAgent = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    if (isMobile) {
      try {
        window.location.href = appUrl;
        setTimeout(function () {
          if (document.visibilityState === "visible") {
            window.location.href = webUrl;
          }
        }, 1200);
        return { ok: true, appUrl, webUrl };
      } catch (error) {}
    }

    let janela = null;
    try {
      janela = window.open(webUrl, "_blank", "noopener,noreferrer");
    } catch (error) {}
    if (!janela) {
      window.location.href = webUrl;
    }
    return { ok: true, appUrl, webUrl };
  }

  function rootSanitizar() {
    if (typeof window !== "undefined" && typeof window.sanitizarMensagemWhatsApp === "function") {
      return window.sanitizarMensagemWhatsApp;
    }
    return null;
  }

  function compartilharChamado(chamado) {
    const mensagem = montarMensagemChamado(chamado);
    return abrirCompartilhamentoWhatsApp(mensagem);
  }

  return {
    montarMensagemChamado,
    abrirCompartilhamentoWhatsApp,
    compartilharChamado,
  };
});
