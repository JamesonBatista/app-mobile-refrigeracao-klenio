// js/utils/authGuards.js
// Validação de acesso a telas e credenciais admin (sem Firebase).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AuthGuards = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  const TELAS_PUBLICAS = [
    "splash",
    "inicial",
    "loginCliente",
    "loginAdmin",
    "cadastro",
    "recuperarSenha",
  ];

  const TELAS_ADMIN = [
    "painelAdmin",
    "chamadoDetalhes",
    "agendaAdmin",
    "abrirProgramado",
    "editarProgramado",
    "orcamentoAdmin",
    "criarOrcamentoAdmin",
    "profissionais",
    "relatorio",
    "falarCliente",
  ];

  const TELAS_CLIENTE = [
    "principal",
    "abrirChamado",
    "acompanharChamado",
    "detalheChamadoCliente",
    "perfil",
    "programadoCliente",
    "orcamento",
    "meusOrcamentos",
    "aprovarOrcamento",
    "historicoCliente",
    "ajuda",
  ];

  const ADMIN_CREDENCIAIS = [
    { email: "krefrigeracao", senha: "060318" },
    { email: "krefrigeracao1", senha: "060318" },
    { email: "krefrigeracao2", senha: "060318" },
    { email: "krefrigeracao3", senha: "060318" },
  ];

  function isTelaPublica(tela) {
    return TELAS_PUBLICAS.indexOf(tela) >= 0;
  }

  function isTelaAdmin(tela) {
    return TELAS_ADMIN.indexOf(tela) >= 0;
  }

  function isTelaCliente(tela) {
    return TELAS_CLIENTE.indexOf(tela) >= 0;
  }

  function podeAcessarTela(tela, usuario) {
    if (!tela) return false;
    if (isTelaPublica(tela)) return true;
    if (isTelaAdmin(tela)) {
      return !!(usuario && usuario.perfil === "admin");
    }
    if (isTelaCliente(tela)) {
      return !!(usuario && usuario.perfil !== "admin");
    }
    return !!usuario;
  }

  function telaFallback(usuario) {
    if (usuario && usuario.perfil === "admin") return "painelAdmin";
    if (usuario) return "principal";
    return "inicial";
  }

  function resolverTelaAutorizada(tela, usuario) {
    if (podeAcessarTela(tela, usuario)) return tela;
    return telaFallback(usuario);
  }

  /** Exige e-mail + senha do mesmo par (não aceita só a senha). */
  function validarCredenciaisAdmin(email, senha) {
    const e = String(email || "").trim();
    const s = String(senha || "");
    return ADMIN_CREDENCIAIS.some(function (item) {
      return item.email === e && item.senha === s;
    });
  }

  function emailAdminCanonico(email) {
    const e = String(email || "").trim();
    const hit = ADMIN_CREDENCIAIS.find(function (item) {
      return item.email === e;
    });
    return hit ? hit.email : e;
  }

  return {
    TELAS_PUBLICAS,
    TELAS_ADMIN,
    TELAS_CLIENTE,
    ADMIN_CREDENCIAIS,
    isTelaPublica,
    isTelaAdmin,
    isTelaCliente,
    podeAcessarTela,
    telaFallback,
    resolverTelaAutorizada,
    validarCredenciaisAdmin,
    emailAdminCanonico,
  };
});
