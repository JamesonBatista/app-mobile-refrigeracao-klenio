// js/services/firebase.js
// Inicializa Firebase no browser para uso das telas web.

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBFvVTdHEZ2yKoO0htHfdBjLP1I32veewg",
    authDomain: "klenio-refrigeracao.firebaseapp.com",
    projectId: "klenio-refrigeracao",
    storageBucket: "klenio-refrigeracao.firebasestorage.app",
    messagingSenderId: "177014471183",
    appId: "1:177014471183:web:18a27f37159b69270a017a",
  };

  if (typeof window.firebase === "undefined") {
    console.warn("Firebase SDK não carregado. A aplicação seguirá com fallback local.");
    return;
  }

  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    window.db = window.firebase.firestore();
    window.auth = window.firebase.auth();
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
})();
