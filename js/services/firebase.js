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

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function toSafeMs(value, fallback, minMs) {
    const min = Number.isFinite(minMs) ? minMs : 0;
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.floor(value));
  }

  function montarChamadoFicticioReativacao(docId) {
    const agora = new Date();
    const dataBr = agora.toLocaleDateString("pt-BR");
    const horaBr = agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      numero: docId,
      tipos: ["Reativação de sistema"],
      endereco: "Sistema interno",
      dataFormatada: dataBr,
      dataChave: agora.toISOString().split("T")[0],
      horario: "00:00 às 00:01",
      detalhes: "Registro fictício para reativação automática de conexão.",
      fotos: [],
      status: "Sistema",
      urgencia: "Normal",
      cliente: "Sistema",
      clienteEmail: "sistema@local.invalid",
      clienteTelefone: "",
      observacaoTecnica: "",
      tecnico: "",
      dataAbertura: dataBr,
      horaAbertura: horaBr,
      dataCriacao: `${dataBr} às ${horaBr}`,
      criadoPorAdmin: true,
      historicoStatus: [{ status: "Sistema", data: dataBr, hora: horaBr }],
      sistemaReativacao: true,
      sistemaGeradoEm: agora.toISOString(),
    };
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
    window.reativarFirestoreComContagem = async function () {
      return { ok: false, attempts: 0, elapsedMs: 0 };
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

  async function executarCicloReativacaoFirestore() {
    if (!db || typeof db.collection !== "function") {
      const error = new Error("Firestore indisponível");
      error.code = "failed-precondition";
      throw error;
    }

    const chamados = db.collection("chamados");
    await chamados.limit(1).get({ source: "server" });

    const docId = `__reativacao_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const docRef = chamados.doc(docId);
    const payload = montarChamadoFicticioReativacao(docId);

    await docRef.set(payload);
    await docRef.delete();
  }

  async function reativarFirestoreComContagem(options) {
    const opts = options && typeof options === "object" ? options : {};
    const totalMs = toSafeMs(opts.totalMs, 120000, 30000);
    const retryEveryMs = toSafeMs(opts.retryEveryMs, 10000, 1000);
    const onTick = typeof opts.onTick === "function" ? opts.onTick : null;
    const startedAt = Date.now();
    let attempts = 0;
    let lastError = null;

    function emit(status) {
      if (!onTick) return;
      const elapsedMs = Date.now() - startedAt;
      const remainingMs = Math.max(0, totalMs - elapsedMs);
      onTick({
        status: status || "processing",
        attempts,
        elapsedMs,
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        error: lastError || null,
      });
    }

    emit("start");
    while (Date.now() - startedAt < totalMs) {
      attempts += 1;
      emit("attempting");
      try {
        await executarCicloReativacaoFirestore();
        emit("success");
        return { ok: true, attempts, elapsedMs: Date.now() - startedAt };
      } catch (error) {
        lastError = error;
        emit("retrying");
      }

      const elapsedMs = Date.now() - startedAt;
      const remainingMs = totalMs - elapsedMs;
      if (remainingMs <= 0) break;
      await sleep(Math.min(retryEveryMs, remainingMs));
      emit("waiting");
    }

    emit("failed");
    return {
      ok: false,
      attempts,
      elapsedMs: Date.now() - startedAt,
      error: lastError || null,
    };
  }

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
  window.reativarFirestoreComContagem = reativarFirestoreComContagem;
  preaquecerFirestore({ force: true }).catch(function () {});
})();
