// js/state.js
// ============================================================
// state.js — estado global reativo
// Substitui: useState/useRef do App.js + AsyncStorage
// ============================================================

const State = (() => {
  const _state = {
    tela: 'splash',
    usuarioLogado: null,
    chamadoSelecionado: null,
    chamadoClienteSelecionado: null,
    programadoSelecionado: null,
    orcamentoParaAprovar: null,
  };

  const _listeners = {};

  function get(key) {
    return _state[key];
  }

  function set(key, value) {
    _state[key] = value;
    if (_listeners[key]) {
      _listeners[key].forEach(fn => fn(value));
    }
  }

  function on(key, fn) {
    if (!_listeners[key]) _listeners[key] = [];
    _listeners[key].push(fn);
  }

  // ── Persistência (substitui AsyncStorage) ────────────────
  function salvarUsuario(usuario) {
    try {
      localStorage.setItem('@usuarioLogado', JSON.stringify(usuario));
    } catch (e) { console.log('Erro salvarUsuario:', e); }
  }

  function carregarUsuario() {
    try {
      const raw = localStorage.getItem('@usuarioLogado');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function removerUsuario() {
    try {
      localStorage.removeItem('@usuarioLogado');
    } catch (e) { console.log('Erro removerUsuario:', e); }
  }

  function salvarDadosUsuario(key, dados) {
    try {
      localStorage.setItem(key, JSON.stringify(dados));
    } catch (e) { console.log('Erro salvarDadosUsuario:', e); }
  }

  function carregarDadosUsuario(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  return { get, set, on, salvarUsuario, carregarUsuario, removerUsuario, salvarDadosUsuario, carregarDadosUsuario };
})();
