// js/router.js
// ============================================================
// router.js — roteador de telas SPA
// Substitui: switch(tela) do App.js
// ============================================================

const Router = (() => {

  // Mapa de tela → id do elemento HTML
  const TELAS = [
    'splash', 'inicial', 'loginCliente', 'loginAdmin', 'cadastro',
    'recuperarSenha', 'principal', 'abrirChamado', 'acompanharChamado',
    'detalheChamadoCliente', 'painelAdmin', 'chamadoDetalhes',
    'agendaAdmin', 'perfil', 'abrirProgramado', 'programadoCliente',
    'editarProgramado', 'orcamento', 'meusOrcamentos', 'aprovarOrcamento',
    'orcamentoAdmin', 'criarOrcamentoAdmin', 'profissionais', 'ajuda',
    'relatorio', 'falarCliente', 'historicoCliente',
  ];

  // Callbacks chamados quando uma tela é ativada (onMount)
  const _onMount = {};

  function registrarMount(tela, fn) {
    _onMount[tela] = fn;
  }

  function navegar(nomeTela) {
    if (nomeTela === 'sair') {
      handleSair();
      return;
    }

    // Esconde todas
    TELAS.forEach(t => {
      const el = document.getElementById(`tela-${t}`);
      if (el) el.classList.remove('active');
    });

    // Mostra a correta
    const alvo = document.getElementById(`tela-${nomeTela}`);
    if (alvo) {
      alvo.classList.add('active');
      alvo.scrollTop = 0;
    }

    State.set('tela', nomeTela);

    // Ao entrar como cliente/admin, dispara um get silencioso para
    // "acordar" a conexão do Firestore e reduzir erros no primeiro uso.
    if ((nomeTela === 'principal' || nomeTela === 'painelAdmin') && typeof window.preaquecerFirestore === 'function') {
      window.preaquecerFirestore({ reason: `entrada:${nomeTela}` }).catch(() => {});
    }

    // Executa callback de mount se existir
    if (_onMount[nomeTela]) {
      _onMount[nomeTela]();
    }
  }

  async function handleSair() {
    State.removerUsuario();
    State.set('usuarioLogado', null);
    navegar('inicial');
  }

  // Expõe setTela como função global para uso nas telas
  // chamada como: setTela('principal')
  window.setTela = navegar;

  return { navegar, registrarMount, handleSair };
})();
