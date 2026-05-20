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

  function isFirestoreRetryableError(error) {
    const code = String((error && error.code) || "").toLowerCase();
    if (!code) return false;
    if (code.includes("permission-denied")) return false;
    if (code.includes("failed-precondition")) return false;
    if (code.includes("invalid-argument")) return false;
    if (code.includes("not-found")) return false;
    return (
      code.includes("unavailable") ||
      code.includes("deadline-exceeded") ||
      code.includes("resource-exhausted") ||
      code.includes("internal") ||
      code.includes("aborted") ||
      code.includes("cancelled") ||
      code.includes("network")
    );
  }

  async function runFirestoreWithRetry(operation, options) {
    const opts = options && typeof options === "object" ? options : {};
    const maxAttempts = Number.isFinite(opts.maxAttempts) ? Math.max(0, opts.maxAttempts) : 0;
    let delayMs = Number.isFinite(opts.initialDelayMs) ? Math.max(300, opts.initialDelayMs) : 1200;
    const maxDelayMs = Number.isFinite(opts.maxDelayMs) ? Math.max(600, opts.maxDelayMs) : 8000;
    let attempts = 0;

    while (true) {
      attempts += 1;
      try {
        return await operation();
      } catch (error) {
        if (!isFirestoreRetryableError(error)) {
          throw error;
        }
        if (maxAttempts > 0 && attempts >= maxAttempts) {
          throw error;
        }
        await new Promise(function (resolve) {
          setTimeout(resolve, delayMs);
        });
        delayMs = Math.min(maxDelayMs, Math.floor(delayMs * 1.5));
      }
    }
  }

  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    window.db = window.firebase.firestore();
    window.auth = window.firebase.auth();
    window.isFirestoreRetryableError = isFirestoreRetryableError;
    window.runFirestoreWithRetry = runFirestoreWithRetry;
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
})();
