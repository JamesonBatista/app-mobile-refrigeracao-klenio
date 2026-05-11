// js/screens/agendaAdmin.js
(function () {
  function render() {
    const el = document.getElementById('tela-agendaAdmin');
    el.innerHTML = renderHTML();
    init();
  }
  function renderHTML() { return '<div class="scroll"><div class="header"><div><span class="header-empresa">Klenio Refrigeração</span><span class="header-nome">agendaAdmin</span></div><button class="btn-voltar" onclick="history.back()">← Voltar</button></div><p style="color:var(--text-muted);padding:40px 0;text-align:center">Tela em construção...</p></div>'; }
  function init() {}
  Router.registrarMount('agendaAdmin', render);
})();
