// js/app.js
// ============================================================
// app.js — inicializador principal
// Substitui: App.js do React Native
// Depende de: state.js, router.js e todos os screens/*.js
// ============================================================

// ── Trava orientação portrait ────────────────────────────────
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock('portrait').catch(() => {});
}

// ── Lógica de inicialização (substitui iniciarApp do App.js) ─
async function iniciarApp() {
  try {
    const usuario = State.carregarUsuario();
    if (usuario) {
      State.set('usuarioLogado', usuario);
      if (usuario.perfil === 'admin') {
        await configurarNotificacoesAdmin();
        Router.navegar('painelAdmin');
      } else {
        await configurarNotificacoesCliente(usuario.email);
        Router.navegar('principal');
      }
    } else {
      Router.navegar('inicial');
    }
  } catch (e) {
    console.log('Erro iniciarApp:', e);
    Router.navegar('inicial');
  }
}

// ── Notificações cliente ─────────────────────────────────────
async function configurarNotificacoesCliente(email) {
  try { await registrarToken(email); }
  catch (e) { console.log('Erro configurarNotificacoesCliente:', e); }
}

// ── Notificações admin ───────────────────────────────────────
async function configurarNotificacoesAdmin() {
  try {
    const token = await registrarToken(null);
    if (token) await salvarTokenAdmin(token);
  } catch (e) { console.log('Erro configurarNotificacoesAdmin:', e); }
}

// ── Inicializa o app quando o DOM estiver pronto ─────────────
document.addEventListener('DOMContentLoaded', () => {
  // FCM foreground
  configurarMensagemForeground();

  // Inicia na tela splash
  Router.navegar('splash');
});
