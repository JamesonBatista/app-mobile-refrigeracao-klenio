// js/utils/recuperarSenhaLocal.js
// Atualiza senha em @clientes / @usuario / @usuarioLogado (somente localStorage).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.RecuperarSenhaLocal = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function normalizarEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function parseJSON(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  /**
   * storage: objeto com getItem/setItem (localStorage ou mock de teste)
   * Retorna { ok, motivo?, fontesAtualizadas[] }
   */
  function atualizarSenhaLocal(storage, email, novaSenha) {
    if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") {
      return { ok: false, motivo: "storage_indisponivel", fontesAtualizadas: [] };
    }

    const emailNorm = normalizarEmail(email);
    if (!emailNorm) {
      return { ok: false, motivo: "email_vazio", fontesAtualizadas: [] };
    }
    if (String(novaSenha || "").length < 6) {
      return { ok: false, motivo: "senha_curta", fontesAtualizadas: [] };
    }

    const fontesAtualizadas = [];
    let encontrado = false;

    const clientesRaw = storage.getItem("@clientes");
    const clientes = parseJSON(clientesRaw, []);
    if (Array.isArray(clientes) && clientes.length) {
      let mudou = false;
      const atualizados = clientes.map(function (item) {
        if (!item || typeof item !== "object") return item;
        if (normalizarEmail(item.email) !== emailNorm) return item;
        encontrado = true;
        mudou = true;
        return Object.assign({}, item, { senha: novaSenha });
      });
      if (mudou) {
        storage.setItem("@clientes", JSON.stringify(atualizados));
        fontesAtualizadas.push("@clientes");
      }
    }

    const usuario = parseJSON(storage.getItem("@usuario"), null);
    if (usuario && typeof usuario === "object" && normalizarEmail(usuario.email) === emailNorm) {
      encontrado = true;
      storage.setItem("@usuario", JSON.stringify(Object.assign({}, usuario, { senha: novaSenha })));
      fontesAtualizadas.push("@usuario");
    }

    const logado = parseJSON(storage.getItem("@usuarioLogado"), null);
    if (logado && typeof logado === "object" && normalizarEmail(logado.email) === emailNorm) {
      storage.setItem("@usuarioLogado", JSON.stringify(Object.assign({}, logado, { senha: novaSenha })));
      fontesAtualizadas.push("@usuarioLogado");
    }

    if (!encontrado) {
      return { ok: false, motivo: "email_nao_encontrado", fontesAtualizadas: [] };
    }

    return { ok: true, fontesAtualizadas };
  }

  return { normalizarEmail, atualizarSenhaLocal };
});
