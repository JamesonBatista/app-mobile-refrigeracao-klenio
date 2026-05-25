(function () {
  const STORAGE_KEYS = {
    chamados: "@chamados",
    bloqueios: "@bloqueiosAgenda",
    clientes: "@clientes",
    programados: "@programados",
    orcamentos: "@orcamentos",
    profissionais: "@profissionais",
    relatorios: "@relatorios",
  };

  const HORARIOS_SEMANA = [
    "08:00 às 10:00",
    "10:00 às 12:00",
    "13:00 às 15:00",
    "15:00 às 17:00",
  ];

  const HORARIOS_SABADO = ["09:00 às 11:00", "11:30 às 13:00"];
  const CAPACIDADE_POR_HORARIO = 2;
  const MAX_POR_DIA = HORARIOS_SEMANA.length * CAPACIDADE_POR_HORARIO;
  const MAX_SABADO = HORARIOS_SABADO.length * CAPACIDADE_POR_HORARIO;

  const STATUS_ORDEM_CHAMADOS_CLIENTE = {
    "Aguardando técnico": 0,
    Aceito: 1,
    "Em atendimento": 2,
    Concluído: 3,
    Cancelado: 4,
  };

  const DB_READY_WAIT_MS = 2200;
  const DB_GET_TIMEOUT_MS = 7000;
  const REMOTE_RETRY_INTERVAL_MS = 900;
  const FIRESTORE_RETRY_EVERY_MS = 10000;
  const FIRESTORE_RETRY_FOR_MS = 120000;

  function getDbCollection(nome) {
    if (!window.db || typeof window.db.collection !== "function") return null;
    try {
      return window.db.collection(nome);
    } catch (error) {
      return null;
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function criarErroFirestoreIndisponivel() {
    const error = new Error("Firestore indisponível");
    error.code = "unavailable";
    return error;
  }

  async function executarComRetryFirestore(operacao, options) {
    if (typeof window.runFirestoreWithRetry === "function") {
      const baseOptions = options && typeof options === "object" ? options : {};
      return window.runFirestoreWithRetry(operacao, {
        ...baseOptions,
        retryEveryMs: FIRESTORE_RETRY_EVERY_MS,
        retryForMs: FIRESTORE_RETRY_FOR_MS,
      });
    }
    return operacao();
  }

  function withTimeout(promise, timeoutMs) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error("Firestore timeout"));
        }, timeoutMs);
      }),
    ]);
  }

  async function waitForDbCollection(nome, timeoutMs) {
    const maxWaitMs = typeof timeoutMs === "number" ? timeoutMs : DB_READY_WAIT_MS;
    const startedAt = Date.now();
    let collection = getDbCollection(nome);

    while (!collection && Date.now() - startedAt < maxWaitMs) {
      await delay(150);
      collection = getDbCollection(nome);
    }

    return collection;
  }

  function subscribeWithStorageFallback(options) {
    const storageKey = options.storageKey;
    const callback = options.callback;
    const localProducer = options.localProducer;
    const connectRemote = options.connectRemote;
    const intervalMs = options.intervalMs;
    let stopped = false;
    let unsubscribeStorage = watchStorageChange(storageKey, callback, localProducer, intervalMs);
    let unsubscribeRemote = null;
    let retryTimer = null;

    function stopRetry() {
      if (!retryTimer) return;
      clearInterval(retryTimer);
      retryTimer = null;
    }

    function tryConnectRemote() {
      if (stopped || unsubscribeRemote) return;
      try {
        const candidate = connectRemote();
        if (typeof candidate === "function") {
          unsubscribeRemote = candidate;
          if (typeof unsubscribeStorage === "function") {
            unsubscribeStorage();
            unsubscribeStorage = null;
          }
          stopRetry();
        }
      } catch (error) {
        console.log("Erro conectar listener remoto:", error);
      }
    }

    tryConnectRemote();
    if (!unsubscribeRemote) {
      retryTimer = setInterval(tryConnectRemote, REMOTE_RETRY_INTERVAL_MS);
    }

    return function unsubscribeAll() {
      stopped = true;
      stopRetry();
      if (typeof unsubscribeStorage === "function") unsubscribeStorage();
      if (typeof unsubscribeRemote === "function") unsubscribeRemote();
    };
  }

  function parseArrayStorage(chave) {
    try {
      const raw = localStorage.getItem(chave);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function parseObjectStorage(chave) {
    try {
      const raw = localStorage.getItem(chave);
      const parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
      return {};
    } catch (error) {
      return {};
    }
  }

  function setArrayStorage(chave, lista) {
    localStorage.setItem(chave, JSON.stringify(Array.isArray(lista) ? lista : []));
  }

  function setObjectStorage(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor && typeof valor === "object" ? valor : {}));
  }

  function watchStorageChange(chave, callback, producer, intervalMs) {
    let lastRaw = null;
    const tickMs = typeof intervalMs === "number" ? intervalMs : 1200;

    function run() {
      const raw = localStorage.getItem(chave) || "";
      if (raw !== lastRaw) {
        lastRaw = raw;
        callback(producer());
      }
    }

    run();

    function onStorage(event) {
      if (!event || event.key === chave) {
        run();
      }
    }

    window.addEventListener("storage", onStorage);
    const timer = setInterval(run, tickMs);

    return function unwatch() {
      clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }

  function upsertByField(chave, field, valor, payload) {
    const lista = parseArrayStorage(chave);
    const index = lista.findIndex(function (item) {
      return item && item[field] === valor;
    });
    if (index >= 0) {
      lista[index] = { ...lista[index], ...payload };
    } else {
      lista.unshift({ ...payload });
    }
    setArrayStorage(chave, lista);
  }

  function updateByField(chave, field, valor, updates) {
    const lista = parseArrayStorage(chave);
    const index = lista.findIndex(function (item) {
      return item && item[field] === valor;
    });
    if (index >= 0) {
      lista[index] = { ...lista[index], ...updates };
      setArrayStorage(chave, lista);
    }
  }

  function removeByField(chave, field, valor) {
    const lista = parseArrayStorage(chave).filter(function (item) {
      return !(item && item[field] === valor);
    });
    setArrayStorage(chave, lista);
  }

  function getChamadoMergeKey(item, indexFallback) {
    if (!item) return `idx:${indexFallback}`;
    if (item.numero) return `numero:${item.numero}`;
    if (item.id) return `id:${item.id}`;
    return `idx:${indexFallback}`;
  }

  function mergeChamadosRemotosComLocais(chamadosRemotos) {
    const locais = parseArrayStorage(STORAGE_KEYS.chamados);
    const mapa = new Map();

    locais.forEach(function (item, index) {
      mapa.set(getChamadoMergeKey(item, index), item);
    });

    (Array.isArray(chamadosRemotos) ? chamadosRemotos : []).forEach(function (item, index) {
      const key = getChamadoMergeKey(item, index);
      const atual = mapa.get(key) || {};
      mapa.set(key, { ...atual, ...item });
    });

    return Array.from(mapa.values());
  }

  function isDomingo(data) {
    return data.getDay() === 0;
  }

  function isSabado(data) {
    return data.getDay() === 6;
  }

  function getProximosDias() {
    const dias = [];
    const hoje = new Date();
    let contador = 0;
    let i = 0;
    while (contador < 7) {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() + i);
      i += 1;
      if (!isDomingo(data)) {
        dias.push(data);
        contador += 1;
      }
    }
    return dias;
  }

  function formatarData(data) {
    return data.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
  }

  function formatarDataChave(data) {
    return data.toISOString().split("T")[0];
  }

  function getHorariosDoDia(data) {
    return isSabado(data) ? HORARIOS_SABADO : HORARIOS_SEMANA;
  }

  function getMaxDia(data) {
    return isSabado(data) ? MAX_SABADO : MAX_POR_DIA;
  }

  function statusOcupaHorario(item) {
    const status = String((item && item.status) || "");
    return status !== "Cancelado" && status !== "Concluído";
  }

  function getHoraInicio(horario) {
    if (!horario) return 0;
    const parte = String(horario).split("às")[0].trim();
    const [hora, minuto] = parte.split(":").map(Number);
    return hora * 60 + minuto;
  }

  function isHoje(data) {
    const hoje = new Date();
    return (
      data.getDate() === hoje.getDate() &&
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  }

  function getNowStr() {
    const agora = new Date();
    return {
      data: agora.toLocaleDateString("pt-BR"),
      hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      iso: agora.toISOString(),
    };
  }

  async function carregarChamados() {
    const collection = await waitForDbCollection("chamados");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.chamados);
    try {
      const snapshot = await withTimeout(collection.get(), DB_GET_TIMEOUT_MS);
      const listaRemota = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
      const lista = mergeChamadosRemotosComLocais(listaRemota);
      setArrayStorage(STORAGE_KEYS.chamados, lista);
      return lista;
    } catch (error) {
      console.log("Erro carregarChamados:", error);
      return parseArrayStorage(STORAGE_KEYS.chamados);
    }
  }

  async function salvarChamado(chamado) {
    try {
      await executarComRetryFirestore(async function () {
        const collection = getDbCollection("chamados");
        if (!collection) {
          throw criarErroFirestoreIndisponivel();
        }
        await collection.doc(chamado.numero).set(chamado);
      });
      upsertByField(STORAGE_KEYS.chamados, "numero", chamado.numero, chamado);
    } catch (error) {
      console.log("Erro salvarChamado:", error);
      throw error;
    }
  }

  async function atualizarChamado(numero, updates) {
    try {
      await executarComRetryFirestore(async function () {
        const collection = getDbCollection("chamados");
        if (!collection) {
          throw criarErroFirestoreIndisponivel();
        }
        try {
          await collection.doc(numero).update(updates);
        } catch (error) {
          const code = String((error && error.code) || "").toLowerCase();
          if (code.includes("not-found")) {
            await collection.doc(numero).set({ numero, ...updates }, { merge: true });
            return;
          }
          throw error;
        }
      }, {
        maxAttempts: 0,
        initialDelayMs: 900,
        maxDelayMs: 7000,
      });
      updateByField(STORAGE_KEYS.chamados, "numero", numero, updates);
    } catch (error) {
      console.log("Erro atualizarChamado:", error);
      throw error;
    }
  }

  async function registrarMudancaStatus(numero, novoStatus) {
    const { data, hora, iso } = getNowStr();
    const collection = getDbCollection("chamados");

    if (!collection) {
      const lista = parseArrayStorage(STORAGE_KEYS.chamados);
      const index = lista.findIndex(function (item) {
        return item && item.numero === numero;
      });
      if (index < 0) return;
      const chamado = { ...lista[index] };
      const historico = Array.isArray(chamado.historicoStatus) ? [...chamado.historicoStatus] : [];
      historico.push({ status: novoStatus, data, hora, iso });
      chamado.status = novoStatus;
      chamado.historicoStatus = historico;
      chamado[`timestamp_${novoStatus.replace(/ /g, "_")}`] = iso;
      lista[index] = chamado;
      setArrayStorage(STORAGE_KEYS.chamados, lista);
      return;
    }

    try {
      const doc = await collection.doc(numero).get();
      const dados = doc && doc.exists ? doc.data() : {};
      const historico = Array.isArray(dados.historicoStatus) ? [...dados.historicoStatus] : [];
      historico.push({ status: novoStatus, data, hora, iso });
      const payload = {
        status: novoStatus,
        historicoStatus: historico,
        [`timestamp_${novoStatus.replace(/ /g, "_")}`]: iso,
      };
      await collection.doc(numero).update(payload);
      updateByField(STORAGE_KEYS.chamados, "numero", numero, payload);
    } catch (error) {
      console.log("Erro registrarMudancaStatus:", error);
      await atualizarChamado(numero, {
        status: novoStatus,
      });
    }
  }

  async function carregarChamadoPorNumero(numero) {
    const collection = await waitForDbCollection("chamados");
    if (!collection) {
      return parseArrayStorage(STORAGE_KEYS.chamados).find(function (item) {
        return item && item.numero === numero;
      }) || null;
    }
    try {
      const doc = await withTimeout(collection.doc(numero).get(), DB_GET_TIMEOUT_MS);
      if (doc.exists) return { id: doc.id, ...doc.data() };
      return null;
    } catch (error) {
      console.log("Erro carregarChamadoPorNumero:", error);
      return null;
    }
  }

  function ouvirChamado(numero, callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.chamados,
      callback: function (lista) {
        const item = Array.isArray(lista)
          ? lista.find(function (entry) {
              return entry && entry.numero === numero;
            })
          : null;
        if (item) callback(item);
      },
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.chamados);
      },
      connectRemote: function () {
        const collection = getDbCollection("chamados");
        if (!collection) return null;
        const docRef = collection.doc(numero);
        if (!docRef || typeof docRef.onSnapshot !== "function") return null;
        return docRef.onSnapshot(function (doc) {
          if (!doc.exists) return;
          callback({ id: doc.id, ...doc.data() });
        });
      },
    });
  }

  function ouvirChamados(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.chamados,
      callback,
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.chamados);
      },
      connectRemote: function () {
        const collection = getDbCollection("chamados");
        if (!collection || typeof collection.onSnapshot !== "function") return null;
        return collection.onSnapshot(function (snapshot) {
          const listaRemota = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          const lista = mergeChamadosRemotosComLocais(listaRemota);
          setArrayStorage(STORAGE_KEYS.chamados, lista);
          callback(lista);
        });
      },
    });
  }

  function ouvirChamadosCliente(emailCliente, callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.chamados,
      callback,
      localProducer: function () {
        const lista = parseArrayStorage(STORAGE_KEYS.chamados).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
        lista.sort(function (a, b) {
          return (STATUS_ORDEM_CHAMADOS_CLIENTE[a.status] ?? 5) - (STATUS_ORDEM_CHAMADOS_CLIENTE[b.status] ?? 5);
        });
        return lista;
      },
      connectRemote: function () {
        const collection = getDbCollection("chamados");
        if (!collection || typeof collection.where !== "function") return null;
        return collection
          .where("clienteEmail", "==", emailCliente)
          .onSnapshot(function (snapshot) {
            const lista = snapshot.docs.map(function (doc) {
              return { id: doc.id, ...doc.data() };
            });
            lista.sort(function (a, b) {
              return (STATUS_ORDEM_CHAMADOS_CLIENTE[a.status] ?? 5) - (STATUS_ORDEM_CHAMADOS_CLIENTE[b.status] ?? 5);
            });
            callback(lista);
          });
      },
    });
  }

  async function carregarBloqueios() {
    const collection = await waitForDbCollection("bloqueios");
    if (!collection) return parseObjectStorage(STORAGE_KEYS.bloqueios);
    try {
      const snapshot = await withTimeout(collection.get(), DB_GET_TIMEOUT_MS);
      const bloqueios = {};
      snapshot.docs.forEach(function (doc) {
        bloqueios[doc.id] = doc.data().horarios || [];
      });
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
      return bloqueios;
    } catch (error) {
      console.log("Erro carregarBloqueios:", error);
      return parseObjectStorage(STORAGE_KEYS.bloqueios);
    }
  }

  async function salvarBloqueio(chave, horarios) {
    const horariosLimpos = Array.from(new Set(Array.isArray(horarios) ? horarios : []));
    try {
      await executarComRetryFirestore(async function () {
        const collection = getDbCollection("bloqueios");
        if (!collection) {
          throw criarErroFirestoreIndisponivel();
        }
        await collection.doc(chave).set({ horarios: horariosLimpos });
      }, {
        maxAttempts: 0,
        initialDelayMs: 900,
        maxDelayMs: 7000,
      });
      const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
      bloqueios[chave] = horariosLimpos;
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
    } catch (error) {
      console.log("Erro salvarBloqueio:", error);
      throw error;
    }
  }

  async function removerBloqueio(chave, horario) {
    const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
    const listaAtual = Array.isArray(bloqueios[chave]) ? bloqueios[chave] : [];
    const novos = listaAtual.filter(function (item) {
      return item !== horario;
    });

    try {
      await executarComRetryFirestore(async function () {
        const collection = getDbCollection("bloqueios");
        if (!collection) {
          throw criarErroFirestoreIndisponivel();
        }
        if (novos.length === 0) {
          await collection.doc(chave).delete();
        } else {
          await collection.doc(chave).set({ horarios: novos });
        }
      }, {
        maxAttempts: 0,
        initialDelayMs: 900,
        maxDelayMs: 7000,
      });

      if (novos.length === 0) delete bloqueios[chave];
      else bloqueios[chave] = novos;
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
    } catch (error) {
      console.log("Erro removerBloqueio:", error);
      throw error;
    }
  }

  function ouvirBloqueios(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.bloqueios,
      callback,
      localProducer: function () {
        return parseObjectStorage(STORAGE_KEYS.bloqueios);
      },
      connectRemote: function () {
        const collection = getDbCollection("bloqueios");
        if (!collection || typeof collection.onSnapshot !== "function") return null;
        return collection.onSnapshot(function (snapshot) {
          const bloqueios = {};
          snapshot.docs.forEach(function (doc) {
            bloqueios[doc.id] = doc.data().horarios || [];
          });
          setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
          callback(bloqueios);
        });
      },
    });
  }

  async function getHorariosDisponiveis(data) {
    const chave = formatarDataChave(data);
    const horariosDia = getHorariosDoDia(data);
    const maxDia = getMaxDia(data);
    const hoje = isHoje(data);
    const agora = new Date();
    const agoraEmMinutos = agora.getHours() * 60 + agora.getMinutes();

    const [collectionChamados, collectionBloqueios, collectionProgramados] = await Promise.all([
      waitForDbCollection("chamados", 1200),
      waitForDbCollection("bloqueios", 1200),
      waitForDbCollection("programados", 1200),
    ]);

    try {
      let chamadosDia = [];
      let programadosDia = [];
      let bloqueiosDia = [];

      if (collectionChamados && collectionBloqueios && collectionProgramados) {
        const [chamadosSnap, bloqueioDoc, programadosSnap] = await withTimeout(
          Promise.all([
            collectionChamados.where("dataChave", "==", chave).get(),
            collectionBloqueios.doc(chave).get(),
            collectionProgramados.where("dataChave", "==", chave).get(),
          ]),
          DB_GET_TIMEOUT_MS
        );

        chamadosDia = chamadosSnap.docs.map(function (doc) {
          return doc.data();
        });
        programadosDia = programadosSnap.docs.map(function (doc) {
          return doc.data();
        });
        bloqueiosDia = bloqueioDoc.exists ? bloqueioDoc.data().horarios || [] : [];
      } else {
        chamadosDia = parseArrayStorage(STORAGE_KEYS.chamados).filter(function (item) {
          return item && item.dataChave === chave;
        });
        programadosDia = parseArrayStorage(STORAGE_KEYS.programados).filter(function (item) {
          return item && item.dataChave === chave;
        });
        const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
        bloqueiosDia = Array.isArray(bloqueios[chave]) ? bloqueios[chave] : [];
      }

      chamadosDia = chamadosDia.filter(statusOcupaHorario);
      programadosDia = programadosDia.filter(statusOcupaHorario);

      const totalOcupacoes = chamadosDia.length + programadosDia.length;
      if (bloqueiosDia.includes("DIA_COMPLETO") || totalOcupacoes >= maxDia) return [];

      return horariosDia.filter(function (horario) {
        const totalChamadosNoHorario = chamadosDia.reduce(function (total, item) {
          return total + (item.horario === horario ? 1 : 0);
        }, 0);
        const totalProgramadosNoHorario = programadosDia.reduce(function (total, item) {
          return total + (item.horario === horario ? 1 : 0);
        }, 0);
        const totalNoHorario = totalChamadosNoHorario + totalProgramadosNoHorario;
        const bloqueado = bloqueiosDia.includes(horario);
        let jaPassou = false;
        if (hoje) {
          const inicioHorario = getHoraInicio(horario);
          jaPassou = agoraEmMinutos >= inicioHorario - 30;
        }
        return totalNoHorario < CAPACIDADE_POR_HORARIO && !bloqueado && !jaPassou;
      });
    } catch (error) {
      console.log("Erro getHorariosDisponiveis:", error);
      return [];
    }
  }

  function normalizarEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function consolidarClientesLocais() {
    const mapa = new Map();

    parseArrayStorage(STORAGE_KEYS.clientes).forEach(function (cliente) {
      if (!cliente || !cliente.email) return;
      mapa.set(normalizarEmail(cliente.email), { ...cliente });
    });

    [STORAGE_KEYS.chamados, STORAGE_KEYS.programados, STORAGE_KEYS.orcamentos].forEach(function (chave) {
      parseArrayStorage(chave).forEach(function (item) {
        const email = normalizarEmail(item && item.clienteEmail);
        if (!email) return;
        const atual = mapa.get(email) || {
          email,
          nome: item.cliente || item.nome || "Cliente",
          telefone: item.clienteTelefone || "",
          endereco: item.endereco || "",
        };
        mapa.set(email, {
          ...atual,
          nome: atual.nome || item.cliente || item.nome || "Cliente",
          telefone: atual.telefone || item.clienteTelefone || "",
          endereco: atual.endereco || item.endereco || "",
        });
      });
    });

    return Array.from(mapa.values()).sort(function (a, b) {
      return String(a.nome || "").localeCompare(String(b.nome || ""));
    });
  }

  async function carregarClientes() {
    const collection = await waitForDbCollection("clientes");
    if (!collection) return consolidarClientesLocais();
    try {
      const snapshot = await withTimeout(collection.get(), DB_GET_TIMEOUT_MS);
      const lista = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
      setArrayStorage(STORAGE_KEYS.clientes, lista);
      return lista;
    } catch (error) {
      console.log("Erro carregarClientes:", error);
      return consolidarClientesLocais();
    }
  }

  async function salvarProgramado(programado) {
    const collection = getDbCollection("programados");
    if (!collection) {
      upsertByField(STORAGE_KEYS.programados, "numero", programado.numero, programado);
      return;
    }
    try {
      await collection.doc(programado.numero).set(programado);
      upsertByField(STORAGE_KEYS.programados, "numero", programado.numero, programado);
    } catch (error) {
      console.log("Erro salvarProgramado:", error);
      upsertByField(STORAGE_KEYS.programados, "numero", programado.numero, programado);
    }
  }

  async function carregarProgramados(emailCliente) {
    const collection = await waitForDbCollection("programados");
    if (!collection) {
      return parseArrayStorage(STORAGE_KEYS.programados).filter(function (item) {
        return item && item.clienteEmail === emailCliente;
      });
    }
    try {
      const snapshot = await withTimeout(
        collection.where("clienteEmail", "==", emailCliente).get(),
        DB_GET_TIMEOUT_MS
      );
      return snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
    } catch (error) {
      console.log("Erro carregarProgramados:", error);
      return [];
    }
  }

  async function carregarTodosProgramados() {
    const collection = await waitForDbCollection("programados");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.programados);
    try {
      const snapshot = await withTimeout(collection.get(), DB_GET_TIMEOUT_MS);
      const lista = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
      setArrayStorage(STORAGE_KEYS.programados, lista);
      return lista;
    } catch (error) {
      console.log("Erro carregarTodosProgramados:", error);
      return parseArrayStorage(STORAGE_KEYS.programados);
    }
  }

  function ouvirProgramados(emailCliente, callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.programados,
      callback,
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.programados).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
      },
      connectRemote: function () {
        const collection = getDbCollection("programados");
        if (!collection || typeof collection.where !== "function") return null;
        return collection.where("clienteEmail", "==", emailCliente).onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          callback(lista);
        });
      },
    });
  }

  function ouvirTodosProgramados(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.programados,
      callback,
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.programados);
      },
      connectRemote: function () {
        const collection = getDbCollection("programados");
        if (!collection || typeof collection.onSnapshot !== "function") return null;
        return collection.onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          setArrayStorage(STORAGE_KEYS.programados, lista);
          callback(lista);
        });
      },
    });
  }

  async function atualizarProgramado(numero, updates) {
    const collection = getDbCollection("programados");
    if (!collection) {
      updateByField(STORAGE_KEYS.programados, "numero", numero, updates);
      return;
    }
    try {
      await collection.doc(numero).update(updates);
      updateByField(STORAGE_KEYS.programados, "numero", numero, updates);
    } catch (error) {
      console.log("Erro atualizarProgramado:", error);
      updateByField(STORAGE_KEYS.programados, "numero", numero, updates);
    }
  }

  async function contestarProgramado(numero, motivo) {
    const collection = getDbCollection("programados");
    const data = new Date().toLocaleDateString("pt-BR");
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (!collection) {
      const lista = parseArrayStorage(STORAGE_KEYS.programados);
      const index = lista.findIndex(function (item) {
        return item && item.numero === numero;
      });
      if (index < 0) return;
      const historico = Array.isArray(lista[index].historico) ? [...lista[index].historico] : [];
      historico.push({ tipo: "contestacao", mensagem: motivo, data, hora });
      lista[index] = { ...lista[index], status: "Contestado", historico };
      setArrayStorage(STORAGE_KEYS.programados, lista);
      return;
    }
    try {
      const doc = await collection.doc(numero).get();
      const dados = doc.data();
      const historico = dados && Array.isArray(dados.historico) ? [...dados.historico] : [];
      historico.push({ tipo: "contestacao", mensagem: motivo, data, hora });
      const payload = { status: "Contestado", historico };
      await collection.doc(numero).update(payload);
      updateByField(STORAGE_KEYS.programados, "numero", numero, payload);
    } catch (error) {
      console.log("Erro contestarProgramado:", error);
    }
  }

  async function responderContestacao(numero, resposta) {
    const collection = getDbCollection("programados");
    const data = new Date().toLocaleDateString("pt-BR");
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (!collection) {
      const lista = parseArrayStorage(STORAGE_KEYS.programados);
      const index = lista.findIndex(function (item) {
        return item && item.numero === numero;
      });
      if (index < 0) return;
      const historico = Array.isArray(lista[index].historico) ? [...lista[index].historico] : [];
      historico.push({ tipo: "resposta", mensagem: resposta, data, hora });
      lista[index] = { ...lista[index], status: "Respondido", historico };
      setArrayStorage(STORAGE_KEYS.programados, lista);
      return;
    }
    try {
      const doc = await collection.doc(numero).get();
      const dados = doc.data();
      const historico = dados && Array.isArray(dados.historico) ? [...dados.historico] : [];
      historico.push({ tipo: "resposta", mensagem: resposta, data, hora });
      const payload = { status: "Respondido", historico };
      await collection.doc(numero).update(payload);
      updateByField(STORAGE_KEYS.programados, "numero", numero, payload);
    } catch (error) {
      console.log("Erro responderContestacao:", error);
    }
  }

  async function aceitarProgramado(numero) {
    return atualizarProgramado(numero, { status: "Aceito" });
  }

  function ouvirProgramado(numero, callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.programados,
      callback: function (lista) {
        const item = Array.isArray(lista)
          ? lista.find(function (entry) {
              return entry && entry.numero === numero;
            })
          : null;
        if (item) callback(item);
      },
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.programados);
      },
      connectRemote: function () {
        const collection = getDbCollection("programados");
        if (!collection) return null;
        const docRef = collection.doc(numero);
        if (!docRef || typeof docRef.onSnapshot !== "function") return null;
        return docRef.onSnapshot(function (doc) {
          if (doc.exists) callback({ id: doc.id, ...doc.data() });
        });
      },
    });
  }

  async function editarProgramado(numero, updates) {
    return atualizarProgramado(numero, updates);
  }

  async function excluirProgramado(numero) {
    const collection = getDbCollection("programados");
    if (!collection) {
      removeByField(STORAGE_KEYS.programados, "numero", numero);
      return;
    }
    try {
      await collection.doc(numero).delete();
      removeByField(STORAGE_KEYS.programados, "numero", numero);
    } catch (error) {
      console.log("Erro excluirProgramado:", error);
      removeByField(STORAGE_KEYS.programados, "numero", numero);
    }
  }

  async function cancelarProgramado(numero) {
    return atualizarProgramado(numero, { status: "Cancelado" });
  }

  async function salvarOrcamento(orcamento) {
    const collection = getDbCollection("orcamentos");
    if (!collection) {
      upsertByField(STORAGE_KEYS.orcamentos, "numero", orcamento.numero, orcamento);
      return;
    }
    try {
      await collection.doc(orcamento.numero).set(orcamento);
      upsertByField(STORAGE_KEYS.orcamentos, "numero", orcamento.numero, orcamento);
    } catch (error) {
      console.log("Erro salvarOrcamento:", error);
      upsertByField(STORAGE_KEYS.orcamentos, "numero", orcamento.numero, orcamento);
    }
  }

  async function atualizarOrcamento(numero, updates) {
    const collection = getDbCollection("orcamentos");
    if (!collection) {
      updateByField(STORAGE_KEYS.orcamentos, "numero", numero, updates);
      return;
    }
    try {
      await collection.doc(numero).update(updates);
      updateByField(STORAGE_KEYS.orcamentos, "numero", numero, updates);
    } catch (error) {
      console.log("Erro atualizarOrcamento:", error);
      updateByField(STORAGE_KEYS.orcamentos, "numero", numero, updates);
    }
  }

  function ouvirOrcamentosCliente(emailCliente, callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.orcamentos,
      callback,
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.orcamentos).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
      },
      connectRemote: function () {
        const collection = getDbCollection("orcamentos");
        if (!collection || typeof collection.where !== "function") return null;
        return collection.where("clienteEmail", "==", emailCliente).onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          callback(lista);
        });
      },
    });
  }

  function ouvirTodosOrcamentos(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.orcamentos,
      callback,
      localProducer: function () {
        return parseArrayStorage(STORAGE_KEYS.orcamentos);
      },
      connectRemote: function () {
        const collection = getDbCollection("orcamentos");
        if (!collection || typeof collection.onSnapshot !== "function") return null;
        return collection.onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          setArrayStorage(STORAGE_KEYS.orcamentos, lista);
          callback(lista);
        });
      },
    });
  }

  async function carregarTodosOrcamentos() {
    const collection = await waitForDbCollection("orcamentos");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.orcamentos);
    try {
      const snapshot = await withTimeout(collection.get(), DB_GET_TIMEOUT_MS);
      const lista = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
      setArrayStorage(STORAGE_KEYS.orcamentos, lista);
      return lista;
    } catch (error) {
      console.log("Erro carregarTodosOrcamentos:", error);
      return parseArrayStorage(STORAGE_KEYS.orcamentos);
    }
  }

  async function salvarProfissional(profissional) {
    const payload = { ...profissional };
    if (!payload.id) {
      payload.id = `prof_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    const collection = getDbCollection("profissionais");
    if (!collection) {
      upsertByField(STORAGE_KEYS.profissionais, "id", payload.id, payload);
      return;
    }
    try {
      await collection.doc(payload.id).set(payload);
      upsertByField(STORAGE_KEYS.profissionais, "id", payload.id, payload);
    } catch (error) {
      console.log("Erro salvarProfissional:", error);
      upsertByField(STORAGE_KEYS.profissionais, "id", payload.id, payload);
    }
  }

  async function atualizarProfissional(id, updates) {
    const collection = getDbCollection("profissionais");
    if (!collection) {
      updateByField(STORAGE_KEYS.profissionais, "id", id, updates);
      return;
    }
    try {
      await collection.doc(id).update(updates);
      updateByField(STORAGE_KEYS.profissionais, "id", id, updates);
    } catch (error) {
      console.log("Erro atualizarProfissional:", error);
      updateByField(STORAGE_KEYS.profissionais, "id", id, updates);
    }
  }

  async function excluirProfissional(id) {
    const collection = getDbCollection("profissionais");
    if (!collection) {
      removeByField(STORAGE_KEYS.profissionais, "id", id);
      return;
    }
    try {
      await collection.doc(id).delete();
      removeByField(STORAGE_KEYS.profissionais, "id", id);
    } catch (error) {
      console.log("Erro excluirProfissional:", error);
      removeByField(STORAGE_KEYS.profissionais, "id", id);
    }
  }

  function ouvirProfissionais(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.profissionais,
      callback,
      localProducer: function () {
        const lista = parseArrayStorage(STORAGE_KEYS.profissionais);
        lista.sort(function (a, b) {
          return String(a.nome || "").localeCompare(String(b.nome || ""));
        });
        return lista;
      },
      connectRemote: function () {
        const collection = getDbCollection("profissionais");
        if (!collection || typeof collection.onSnapshot !== "function") return null;
        return collection.onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          lista.sort(function (a, b) {
            return String(a.nome || "").localeCompare(String(b.nome || ""));
          });
          setArrayStorage(STORAGE_KEYS.profissionais, lista);
          callback(lista);
        });
      },
    });
  }

  async function salvarRegistroFinanceiro(chamado) {
    const { data, hora, iso } = getNowStr();
    let tempoAtendimento = null;
    if (chamado.timestamp_Em_atendimento) {
      const inicio = new Date(chamado.timestamp_Em_atendimento);
      const fim = new Date();
      const diffMs = fim - inicio;
      const diffMin = Math.max(0, Math.floor(diffMs / 60000));
      const horas = Math.floor(diffMin / 60);
      const minutos = diffMin % 60;
      tempoAtendimento = horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min`;
    }

    const registro = {
      id: `rel_${chamado.numero}_${Date.now()}`,
      numeroChamado: chamado.numero,
      cliente: chamado.cliente,
      clienteEmail: chamado.clienteEmail,
      clienteTelefone: chamado.clienteTelefone || "",
      tecnico: chamado.tecnico || "",
      tipos: chamado.tipos || [],
      endereco: chamado.endereco,
      dataServico: chamado.dataFormatada,
      dataChave: chamado.dataChave,
      horario: chamado.horario,
      formaPagamento: chamado.formaPagamento || "",
      valorCobrado: chamado.valorCobrado || "0",
      valorNumerico: parseFloat(String(chamado.valorCobrado || "0").replace(",", ".")) || 0,
      dataConclusao: data,
      horaConclusao: hora,
      dataConclusaoISO: iso,
      dataAbertura: chamado.dataAbertura || "",
      horaAbertura: chamado.horaAbertura || "",
      tempoAtendimento,
      historicoStatus: chamado.historicoStatus || [],
      geradoDeOrcamento: chamado.geradoDeOrcamento || null,
      urgencia: chamado.urgencia || "Normal",
    };

    const collection = getDbCollection("relatorios");
    if (!collection) {
      const lista = parseArrayStorage(STORAGE_KEYS.relatorios);
      lista.unshift(registro);
      setArrayStorage(STORAGE_KEYS.relatorios, lista);
      return;
    }

    try {
      await collection.doc(registro.id).set(registro);
      upsertByField(STORAGE_KEYS.relatorios, "id", registro.id, registro);
    } catch (error) {
      console.log("Erro salvarRegistroFinanceiro:", error);
      const lista = parseArrayStorage(STORAGE_KEYS.relatorios);
      lista.unshift(registro);
      setArrayStorage(STORAGE_KEYS.relatorios, lista);
    }
  }

  function ouvirRelatorios(callback) {
    return subscribeWithStorageFallback({
      storageKey: STORAGE_KEYS.relatorios,
      callback,
      localProducer: function () {
        const lista = parseArrayStorage(STORAGE_KEYS.relatorios);
        lista.sort(function (a, b) {
          return String(b.dataConclusaoISO || "").localeCompare(String(a.dataConclusaoISO || ""));
        });
        return lista;
      },
      connectRemote: function () {
        const collection = getDbCollection("relatorios");
        if (!collection || typeof collection.orderBy !== "function") return null;
        return collection
          .orderBy("dataConclusaoISO", "desc")
          .onSnapshot(function (snapshot) {
            const lista = snapshot.docs.map(function (doc) {
              return { id: doc.id, ...doc.data() };
            });
            setArrayStorage(STORAGE_KEYS.relatorios, lista);
            callback(lista);
          });
      },
    });
  }

  function formatarTelefoneWhatsApp(telefone) {
    if (!telefone) return null;
    const numeros = String(telefone).replace(/\D/g, "");
    if ((numeros.length === 12 || numeros.length === 13) && numeros.startsWith("55")) {
      return numeros;
    }
    if (numeros.length === 11 || numeros.length === 10) return `55${numeros}`;
    return null;
  }

  function sanitizarMensagemWhatsApp(mensagem) {
    const texto = String(mensagem || "");
    return texto
      .normalize("NFC")
      // Corrige caractere já quebrado (replacement char).
      .replace(/\uFFFD/g, "")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function abrirLinkWhatsApp(numero, mensagem) {
    if (!numero) return false;
    const textoBruto = String(mensagem || "");
    const texto = sanitizarMensagemWhatsApp(textoBruto) || textoBruto;
    const encoded = encodeURIComponent(texto);
    const appUrl = `whatsapp://send?phone=${numero}&text=${encoded}`;
    const webUrl = `https://wa.me/${numero}?text=${encoded}`;
    const userAgent = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    if (isMobile) {
      try {
        window.location.href = appUrl;
        setTimeout(function () {
          if (document.visibilityState === "visible") {
            window.location.href = webUrl;
          }
        }, 1200);
        return true;
      } catch (error) {}
    }

    let janela = null;
    try {
      janela = window.open(webUrl, "_blank", "noopener,noreferrer");
    } catch (error) {}
    if (!janela) {
      window.location.href = webUrl;
    }
    return true;
  }

  const api = {
    HORARIOS_SEMANA,
    HORARIOS_SABADO,
    CAPACIDADE_POR_HORARIO,
    MAX_POR_DIA,
    MAX_SABADO,
    isDomingo,
    isSabado,
    getProximosDias,
    formatarData,
    formatarDataChave,
    getHorariosDoDia,
    getMaxDia,
    getNowStr,
    carregarChamados,
    salvarChamado,
    atualizarChamado,
    registrarMudancaStatus,
    carregarChamadoPorNumero,
    ouvirChamado,
    ouvirChamados,
    ouvirChamadosCliente,
    carregarBloqueios,
    salvarBloqueio,
    removerBloqueio,
    ouvirBloqueios,
    getHorariosDisponiveis,
    carregarClientes,
    salvarProgramado,
    carregarProgramados,
    carregarTodosProgramados,
    ouvirProgramados,
    ouvirTodosProgramados,
    atualizarProgramado,
    contestarProgramado,
    responderContestacao,
    aceitarProgramado,
    ouvirProgramado,
    editarProgramado,
    excluirProgramado,
    cancelarProgramado,
    salvarOrcamento,
    atualizarOrcamento,
    carregarTodosOrcamentos,
    ouvirOrcamentosCliente,
    ouvirTodosOrcamentos,
    salvarProfissional,
    atualizarProfissional,
    excluirProfissional,
    ouvirProfissionais,
    salvarRegistroFinanceiro,
    ouvirRelatorios,
    formatarTelefoneWhatsApp,
    sanitizarMensagemWhatsApp,
    abrirLinkWhatsApp,
  };

  window.AgendaService = api;
  Object.assign(window, api);
})();
