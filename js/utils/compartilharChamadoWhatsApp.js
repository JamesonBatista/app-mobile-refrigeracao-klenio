// js/utils/compartilharChamadoWhatsApp.js
// Monta e abre mensagem de compartilhamento de chamado no WhatsApp (admin).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CompartilharChamadoWhatsApp = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function textoSeguro(value, fallback) {
    const t = String(value == null ? "" : value).trim();
    return t || fallback || "-";
  }

  function montarMensagemChamado(chamado) {
    const c = chamado && typeof chamado === "object" ? chamado : {};
    const tipos = Array.isArray(c.tipos) ? c.tipos.filter(Boolean) : [];
    const linhas = [
      "❄ *Klenio Refrigeração — Chamado*",
      "",
      `🔢 Número: ${textoSeguro(c.numero)}`,
      `📌 Status: ${textoSeguro(c.status)}`,
      `👤 Cliente: ${textoSeguro(c.cliente)}`,
      `📱 Telefone: ${textoSeguro(c.clienteTelefone, "Não informado")}`,
      `📅 Data: ${textoSeguro(c.dataFormatada)} • ${textoSeguro(c.horario)}`,
      `📍 Endereço: ${textoSeguro(c.endereco)}`,
    ];

    if (tipos.length) {
      linhas.push(`🛠️ Problemas: ${tipos.join(", ")}`);
    }
    if (c.detalhes) {
      linhas.push(`📝 Detalhes: ${textoSeguro(c.detalhes)}`);
    }
    if (c.tecnico) {
      linhas.push(`👷 Técnico: ${textoSeguro(c.tecnico)}`);
    }
    if (c.urgencia === "Urgente") {
      linhas.push("🚨 Urgência: URGENTE");
    }
    if (c.valorCobrado) {
      linhas.push(
        `💰 Valor: R$ ${textoSeguro(c.valorCobrado)}${c.formaPagamento ? ` • ${textoSeguro(c.formaPagamento)}` : ""}`
      );
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
      // Sem telefone = seletor de contato (compartilhar)
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
