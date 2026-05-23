// js/router.js

const Router = (() => {
  const screens = new Map();

  function register(screenName, renderer) {
    screens.set(screenName, renderer);
  }

  function go(screenName, payload = null) {
    const renderer = screens.get(screenName);
    if (!renderer) {
      console.warn(`Tela "${screenName}" nao registrada.`);
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

    const screenElement = app.querySelector(`[data-screen="${screenName}"]`);
    renderer(screenElement, payload);
    State.set("currentScreen", screenName);
  }

  window.setTela = go;

  return { register, go };
})();
