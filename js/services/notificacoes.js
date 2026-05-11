// js/services/notificacoes.js
// ============================================================
// notificacoes.js — Web Push via Firebase Cloud Messaging (FCM)
// Substitui expo-notifications + expo-device
// Depende de: firebase.js (já inicializado)
// Requer: firebase-messaging-compat.js no index.html
//         e arquivo público /firebase-messaging-sw.js
// ============================================================

// VAPID KEY do projeto Firebase (gerar em: Console > Project Settings > Cloud Messaging)
const VAPID_KEY = 'SUA_VAPID_KEY_AQUI';

// ── Solicita permissão e registra token FCM do cliente ──────
async function registrarToken(emailCliente) {
  try {
    if (!('Notification' in window)) {
      console.log('Este browser não suporta notificações.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Permissão de notificação negada.');
      return null;
    }

    const messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey: VAPID_KEY });

    if (emailCliente && token) {
      await db.collection('clientes').doc(emailCliente).update({ token });
    }

    return token;
  } catch (e) {
    console.log('Erro registrarToken:', e);
    return null;
  }
}

// ── Notificação local (via Notification API do browser) ─────
function enviarNotificacaoLocal(titulo, corpo, dados = {}) {
  try {
    if (Notification.permission === 'granted') {
      new Notification(titulo, {
        body: corpo,
        data: dados,
        icon: '/assets/images/icon.png',
      });
    }
  } catch (e) {
    console.log('Erro enviarNotificacaoLocal:', e);
  }
}

// ── Envia push via FCM HTTP API (servidor/admin side) ───────
// No browser, chamadas diretas à FCM API requerem chave de servidor.
// Para uso seguro, isso deve ir por uma Cloud Function.
// Mantido aqui apenas como referência — use via backend.
async function enviarNotificacaoPush(tokenDestino, titulo, corpo, dados = {}) {
  try {
    // Redirecionar para sua Cloud Function ou backend seguro
    await fetch('https://SUA_CLOUD_FUNCTION_URL/enviarPush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenDestino, titulo, corpo, dados }),
    });
  } catch (e) {
    console.log('Erro enviarNotificacaoPush:', e);
  }
}

// ── Busca token FCM de um cliente no Firestore ──────────────
async function buscarTokenCliente(emailCliente) {
  try {
    const doc = await db.collection('clientes').doc(emailCliente).get();
    if (doc.exists) return doc.data().token || null;
    return null;
  } catch (e) {
    console.log('Erro buscarTokenCliente:', e);
    return null;
  }
}

// ── Busca token FCM do admin no Firestore ───────────────────
async function buscarTokenAdmin() {
  try {
    const doc = await db.collection('config').doc('admin').get();
    if (doc.exists) return doc.data().token || null;
    return null;
  } catch (e) {
    console.log('Erro buscarTokenAdmin:', e);
    return null;
  }
}

// ── Salva token FCM do admin no Firestore ───────────────────
async function salvarTokenAdmin(token) {
  try {
    await db.collection('config').doc('admin').set({ token });
  } catch (e) {
    console.log('Erro salvarTokenAdmin:', e);
  }
}

// ── Configura handler de mensagem em foreground ─────────────
function configurarMensagemForeground() {
  try {
    const messaging = firebase.messaging();
    messaging.onMessage((payload) => {
      console.log('Mensagem recebida em foreground:', payload);
      const { title, body } = payload.notification || {};
      if (title) enviarNotificacaoLocal(title, body, payload.data);
    });
  } catch (e) {
    console.log('Erro configurarMensagemForeground:', e);
  }
}
