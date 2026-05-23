// js/services/firebase.js
// Inicializa Firebase no browser e expõe utilitários globais.

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyBFvVTdHEZ2yKoO0htHfdBjLP1I32veewg",
    authDomain: "klenio-refrigeracao.firebaseapp.com",
    projectId: "klenio-refrigeracao",
    storageBucket: "klenio-refrigeracao.firebasestorage.app",
    messagingSenderId: "177014471183",
    appId: "1:177014471183:web:18a27f37159b69270a017a",
  };

  function isFirestoreRetryableError(error) {
    const code = String((error && error.code) || "").toLowerCase();
    if (!code) return true;
    if (code.includes("permission-denied")) return false;
    if (code.includes("failed-precondition")) return false;
    if (code.includes("invalid-argument")) return false;
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
    const retryEveryMs = Number.isFinite(opts.retryEveryMs) ? Math.max(1000, opts.retryEveryMs) : 10000;
    const retryForMs = Number.isFinite(opts.retryForMs) ? Math.max(retryEveryMs, opts.retryForMs) : 120000;
    const maxAttempts = Number.isFinite(opts.maxAttempts) ? Math.max(0, Math.floor(opts.maxAttempts)) : 0;
    const startedAt = Date.now();
    let attempts = 0;

    while (true) {
      attempts += 1;
      try {
        return await operation();
      } catch (error) {
        if (!isFirestoreRetryableError(error)) throw error;
        if (maxAttempts > 0 && attempts >= maxAttempts) throw error;
        const elapsedMs = Date.now() - startedAt;
        if (elapsedMs + retryEveryMs > retryForMs) throw error;
        await new Promise(function (resolve) {
          setTimeout(resolve, retryEveryMs);
        });
      }
    }
  }

  if (typeof window.firebase === "undefined") {
    console.warn("Firebase SDK não carregado.");
    window.db = null;
    window.auth = null;
    window.isFirestoreRetryableError = isFirestoreRetryableError;
    window.runFirestoreWithRetry = runFirestoreWithRetry;
    window.preaquecerFirestore = async function () {
      return false;
    };
    return;
  }

  try {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error("Erro ao inicializar app Firebase:", error);
  }

  const db = window.firebase.firestore();
  const auth = window.firebase.auth();
  window.db = db;
  window.auth = auth;
  window.isFirestoreRetryableError = isFirestoreRetryableError;
  window.runFirestoreWithRetry = runFirestoreWithRetry;

  let firestoreWarmupPromise = null;
  let firestoreWarmupAt = 0;

  function isWarmupResultOk(error) {
    const code = String((error && error.code) || "").toLowerCase();
    if (code.includes("permission-denied")) return true;
    if (code.includes("failed-precondition")) return true;
    if (code.includes("invalid-argument")) return true;
    return false;
  }

  async function aquecerFirestoreInterno() {
    const tentativas = [
      function () {
        return db.collection("config").limit(1).get({ source: "server" });
      },
      function () {
        return db.collection("clientes").limit(1).get({ source: "server" });
      },
      function () {
        return db.collection("chamados").limit(1).get({ source: "server" });
      },
    ];

    for (const executar of tentativas) {
      try {
        await executar();
        return true;
      } catch (error) {
        if (isWarmupResultOk(error)) {
          return true;
        }
      }
    }

    return false;
  }

  function preaquecerFirestore(options) {
    const opts = options && typeof options === "object" ? options : {};
    const force = !!opts.force;
    const now = Date.now();
    const warmupValido = now - firestoreWarmupAt < 60000;

    if (!force && warmupValido) {
      return Promise.resolve(true);
    }
    if (!force && firestoreWarmupPromise) {
      return firestoreWarmupPromise;
    }

    firestoreWarmupPromise = aquecerFirestoreInterno()
      .then(function (ok) {
        if (ok) firestoreWarmupAt = Date.now();
        return ok;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        firestoreWarmupPromise = null;
      });

    return firestoreWarmupPromise;
  }

  window.preaquecerFirestore = preaquecerFirestore;
  preaquecerFirestore({ force: true }).catch(function () {});
})();
