// js/services/firebase.js
// ============================================================
// firebase.js — inicialização do Firebase (SDK via CDN)
// O index.html deve carregar antes deste arquivo:
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"></script>
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBFvVTdHEZ2yKoO0htHfdBjLP1I32veewg",
  authDomain: "klenio-refrigeracao.firebaseapp.com",
  projectId: "klenio-refrigeracao",
  storageBucket: "klenio-refrigeracao.firebasestorage.app",
  messagingSenderId: "177014471183",
  appId: "1:177014471183:web:18a27f37159b69270a017a",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db   = firebase.firestore();
const auth = firebase.auth();

let firestoreWarmupPromise = null;
let firestoreWarmupAt = 0;

function isWarmupResultOk(error) {
  const code = String((error && error.code) || '').toLowerCase();
  // Mesmo com permission-denied, o handshake com o Firestore aconteceu.
  if (code.includes('permission-denied')) return true;
  if (code.includes('failed-precondition')) return true;
  if (code.includes('invalid-argument')) return true;
  return false;
}

async function aquecerFirestoreInterno() {
  const tentativas = [
    () => db.collection('config').limit(1).get(),
    () => db.collection('clientes').limit(1).get(),
    () => db.collection('chamados').limit(1).get(),
  ];

  for (const executar of tentativas) {
    try {
      await executar();
      return true;
    } catch (e) {
      if (isWarmupResultOk(e)) {
        return true;
      }
    }
  }

  return false;
}

function preaquecerFirestore(options = {}) {
  const force = !!options.force;
  const now = Date.now();
  const warmupValido = now - firestoreWarmupAt < 60000;

  if (!force && warmupValido) {
    return Promise.resolve(true);
  }
  if (!force && firestoreWarmupPromise) {
    return firestoreWarmupPromise;
  }

  firestoreWarmupPromise = aquecerFirestoreInterno()
    .then((ok) => {
      if (ok) firestoreWarmupAt = Date.now();
      return ok;
    })
    .catch(() => false)
    .finally(() => {
      firestoreWarmupPromise = null;
    });

  return firestoreWarmupPromise;
}

window.preaquecerFirestore = preaquecerFirestore;

// Pré-aquecimento inicial em background no load do app.
preaquecerFirestore({ force: true }).catch(() => {});
