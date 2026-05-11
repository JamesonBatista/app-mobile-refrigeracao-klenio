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

  const MAX_POR_DIA = 4;
  const MAX_SABADO = 2;

  const STATUS_ORDEM_CHAMADOS_CLIENTE = {
    "Aguardando técnico": 0,
    Aceito: 1,
    "Em atendimento": 2,
    Concluído: 3,
    Cancelado: 4,
  };

  const WHATSAPP_ICON_MAP = {
    "👋": "▣",
    "❄": "▣",
    "🔢": "#",
    "💬": "▣",
    "📨": "▣",
    "📲": "▣",
    "📱": "▣",
    "⏳": "!",
    "🚫": "X",
    "🏁": "✓",
    "🔍": "▣",
    "📡": "▣",
    "🌡": "▣",
    "⚡": "!",
    "💰": "$",
    "💵": "$",
    "💳": "$",
    "🔧": "▣",
    "🛠": "▣",
    "👷": "▣",
    "📅": "◷",
    "🕐": "◷",
    "⏱": "◷",
    "📍": "⌂",
    "✅": "✓",
    "❌": "X",
    "📋": "▣",
    "📝": "▣",
    "🚨": "!",
    "🔗": "→",
    "👤": "▣",
    "📊": "▣",
  };

  const WHATSAPP_ICON_REGEX = /(👋|❄|🔢|💬|📨|📲|📱|⏳|🚫|🏁|🔍|📡|🌡|⚡|💰|💵|💳|🔧|🛠|👷|📅|🕐|⏱|📍|✅|❌|📋|📝|🚨|🔗|👤|📊)/g;

  function getDbCollection(nome) {
    if (!window.db || typeof window.db.collection !== "function") return null;
    try {
      return window.db.collection(nome);
    } catch (error) {
      return null;
    }
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
    const collection = getDbCollection("chamados");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.chamados);
    try {
      const snapshot = await collection.get();
      const lista = snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
      setArrayStorage(STORAGE_KEYS.chamados, lista);
      return lista;
    } catch (error) {
      console.log("Erro carregarChamados:", error);
      return parseArrayStorage(STORAGE_KEYS.chamados);
    }
  }

  async function salvarChamado(chamado) {
    const collection = getDbCollection("chamados");
    if (!collection) {
      upsertByField(STORAGE_KEYS.chamados, "numero", chamado.numero, chamado);
      return;
    }
    try {
      await collection.doc(chamado.numero).set(chamado);
      upsertByField(STORAGE_KEYS.chamados, "numero", chamado.numero, chamado);
    } catch (error) {
      console.log("Erro salvarChamado:", error);
      upsertByField(STORAGE_KEYS.chamados, "numero", chamado.numero, chamado);
    }
  }

  async function atualizarChamado(numero, updates) {
    const collection = getDbCollection("chamados");
    if (!collection) {
      updateByField(STORAGE_KEYS.chamados, "numero", numero, updates);
      return;
    }
    try {
      await collection.doc(numero).update(updates);
      updateByField(STORAGE_KEYS.chamados, "numero", numero, updates);
    } catch (error) {
      console.log("Erro atualizarChamado:", error);
      updateByField(STORAGE_KEYS.chamados, "numero", numero, updates);
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
    const collection = getDbCollection("chamados");
    if (!collection) {
      return parseArrayStorage(STORAGE_KEYS.chamados).find(function (item) {
        return item && item.numero === numero;
      }) || null;
    }
    try {
      const doc = await collection.doc(numero).get();
      if (doc.exists) return { id: doc.id, ...doc.data() };
      return null;
    } catch (error) {
      console.log("Erro carregarChamadoPorNumero:", error);
      return null;
    }
  }

  function ouvirChamado(numero, callback) {
    const collection = getDbCollection("chamados");
    if (collection && collection.doc(numero) && typeof collection.doc(numero).onSnapshot === "function") {
      return collection.doc(numero).onSnapshot(function (doc) {
        if (doc.exists) callback({ id: doc.id, ...doc.data() });
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.chamados,
      function (lista) {
        const item = lista.find(function (entry) {
          return entry && entry.numero === numero;
        });
        if (item) callback(item);
      },
      function () {
        return parseArrayStorage(STORAGE_KEYS.chamados);
      }
    );
  }

  function ouvirChamados(callback) {
    const collection = getDbCollection("chamados");
    if (collection && typeof collection.onSnapshot === "function") {
      return collection.onSnapshot(function (snapshot) {
        const lista = snapshot.docs.map(function (doc) {
          return { id: doc.id, ...doc.data() };
        });
        setArrayStorage(STORAGE_KEYS.chamados, lista);
        callback(lista);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.chamados,
      callback,
      function () {
        return parseArrayStorage(STORAGE_KEYS.chamados);
      }
    );
  }

  function ouvirChamadosCliente(emailCliente, callback) {
    const collection = getDbCollection("chamados");
    if (collection && typeof collection.where === "function") {
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
    }
    return watchStorageChange(
      STORAGE_KEYS.chamados,
      callback,
      function () {
        const lista = parseArrayStorage(STORAGE_KEYS.chamados).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
        lista.sort(function (a, b) {
          return (STATUS_ORDEM_CHAMADOS_CLIENTE[a.status] ?? 5) - (STATUS_ORDEM_CHAMADOS_CLIENTE[b.status] ?? 5);
        });
        return lista;
      }
    );
  }

  async function carregarBloqueios() {
    const collection = getDbCollection("bloqueios");
    if (!collection) return parseObjectStorage(STORAGE_KEYS.bloqueios);
    try {
      const snapshot = await collection.get();
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
    const collection = getDbCollection("bloqueios");
    if (!collection) {
      const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
      bloqueios[chave] = Array.isArray(horarios) ? horarios : [];
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
      return;
    }
    try {
      await collection.doc(chave).set({ horarios });
      const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
      bloqueios[chave] = Array.isArray(horarios) ? horarios : [];
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
    } catch (error) {
      console.log("Erro salvarBloqueio:", error);
    }
  }

  async function removerBloqueio(chave, horario) {
    const collection = getDbCollection("bloqueios");
    if (!collection) {
      const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
      const lista = Array.isArray(bloqueios[chave]) ? bloqueios[chave] : [];
      const novos = lista.filter(function (item) {
        return item !== horario;
      });
      if (novos.length === 0) delete bloqueios[chave];
      else bloqueios[chave] = novos;
      setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
      return;
    }
    try {
      const doc = await collection.doc(chave).get();
      if (doc.exists) {
        const horarios = doc.data().horarios || [];
        const novos = horarios.filter(function (item) {
          return item !== horario;
        });
        if (novos.length === 0) await collection.doc(chave).delete();
        else await collection.doc(chave).set({ horarios: novos });

        const bloqueios = parseObjectStorage(STORAGE_KEYS.bloqueios);
        if (novos.length === 0) delete bloqueios[chave];
        else bloqueios[chave] = novos;
        setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
      }
    } catch (error) {
      console.log("Erro removerBloqueio:", error);
    }
  }

  function ouvirBloqueios(callback) {
    const collection = getDbCollection("bloqueios");
    if (collection && typeof collection.onSnapshot === "function") {
      return collection.onSnapshot(function (snapshot) {
        const bloqueios = {};
        snapshot.docs.forEach(function (doc) {
          bloqueios[doc.id] = doc.data().horarios || [];
        });
        setObjectStorage(STORAGE_KEYS.bloqueios, bloqueios);
        callback(bloqueios);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.bloqueios,
      callback,
      function () {
        return parseObjectStorage(STORAGE_KEYS.bloqueios);
      }
    );
  }

  async function getHorariosDisponiveis(data) {
    const chave = formatarDataChave(data);
    const horariosDia = getHorariosDoDia(data);
    const maxDia = getMaxDia(data);
    const hoje = isHoje(data);
    const agora = new Date();
    const agoraEmMinutos = agora.getHours() * 60 + agora.getMinutes();

    const collectionChamados = getDbCollection("chamados");
    const collectionBloqueios = getDbCollection("bloqueios");
    const collectionProgramados = getDbCollection("programados");

    try {
      let chamadosDia = [];
      let programadosDia = [];
      let bloqueiosDia = [];

      if (collectionChamados && collectionBloqueios && collectionProgramados) {
        const [chamadosSnap, bloqueioDoc, programadosSnap] = await Promise.all([
          collectionChamados.where("dataChave", "==", chave).get(),
          collectionBloqueios.doc(chave).get(),
          collectionProgramados.where("dataChave", "==", chave).get(),
        ]);

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

      chamadosDia = chamadosDia.filter(function (item) {
        return item.status !== "Cancelado";
      });
      programadosDia = programadosDia.filter(function (item) {
        return item.status !== "Cancelado";
      });

      const totalOcupacoes = chamadosDia.length + programadosDia.length;
      if (bloqueiosDia.includes("DIA_COMPLETO") || totalOcupacoes >= maxDia) return [];

      return horariosDia.filter(function (horario) {
        const ocupadoChamado = chamadosDia.some(function (item) {
          return item.horario === horario;
        });
        const ocupadoProgramado = programadosDia.some(function (item) {
          return item.horario === horario;
        });
        const bloqueado = bloqueiosDia.includes(horario);
        let jaPassou = false;
        if (hoje) {
          const inicioHorario = getHoraInicio(horario);
          jaPassou = agoraEmMinutos >= inicioHorario - 30;
        }
        return !ocupadoChamado && !ocupadoProgramado && !bloqueado && !jaPassou;
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
    const collection = getDbCollection("clientes");
    if (!collection) return consolidarClientesLocais();
    try {
      const snapshot = await collection.get();
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
    const collection = getDbCollection("programados");
    if (!collection) {
      return parseArrayStorage(STORAGE_KEYS.programados).filter(function (item) {
        return item && item.clienteEmail === emailCliente;
      });
    }
    try {
      const snapshot = await collection.where("clienteEmail", "==", emailCliente).get();
      return snapshot.docs.map(function (doc) {
        return { id: doc.id, ...doc.data() };
      });
    } catch (error) {
      console.log("Erro carregarProgramados:", error);
      return [];
    }
  }

  async function carregarTodosProgramados() {
    const collection = getDbCollection("programados");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.programados);
    try {
      const snapshot = await collection.get();
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
    const collection = getDbCollection("programados");
    if (collection && typeof collection.where === "function") {
      return collection.where("clienteEmail", "==", emailCliente).onSnapshot(function (snapshot) {
        const lista = snapshot.docs.map(function (doc) {
          return { id: doc.id, ...doc.data() };
        });
        callback(lista);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.programados,
      callback,
      function () {
        return parseArrayStorage(STORAGE_KEYS.programados).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
      }
    );
  }

  function ouvirTodosProgramados(callback) {
    const collection = getDbCollection("programados");
    if (collection && typeof collection.onSnapshot === "function") {
      return collection.onSnapshot(function (snapshot) {
        const lista = snapshot.docs.map(function (doc) {
          return { id: doc.id, ...doc.data() };
        });
        setArrayStorage(STORAGE_KEYS.programados, lista);
        callback(lista);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.programados,
      callback,
      function () {
        return parseArrayStorage(STORAGE_KEYS.programados);
      }
    );
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
    const collection = getDbCollection("programados");
    if (collection && collection.doc(numero) && typeof collection.doc(numero).onSnapshot === "function") {
      return collection.doc(numero).onSnapshot(function (doc) {
        if (doc.exists) callback({ id: doc.id, ...doc.data() });
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.programados,
      function (lista) {
        const item = lista.find(function (entry) {
          return entry && entry.numero === numero;
        });
        if (item) callback(item);
      },
      function () {
        return parseArrayStorage(STORAGE_KEYS.programados);
      }
    );
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
    const collection = getDbCollection("orcamentos");
    if (collection && typeof collection.where === "function") {
      return collection.where("clienteEmail", "==", emailCliente).onSnapshot(function (snapshot) {
        const lista = snapshot.docs.map(function (doc) {
          return { id: doc.id, ...doc.data() };
        });
        callback(lista);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.orcamentos,
      callback,
      function () {
        return parseArrayStorage(STORAGE_KEYS.orcamentos).filter(function (item) {
          return item && item.clienteEmail === emailCliente;
        });
      }
    );
  }

  function ouvirTodosOrcamentos(callback) {
    const collection = getDbCollection("orcamentos");
    if (collection && typeof collection.onSnapshot === "function") {
      return collection.onSnapshot(function (snapshot) {
        const lista = snapshot.docs.map(function (doc) {
          return { id: doc.id, ...doc.data() };
        });
        setArrayStorage(STORAGE_KEYS.orcamentos, lista);
        callback(lista);
      });
    }
    return watchStorageChange(
      STORAGE_KEYS.orcamentos,
      callback,
      function () {
        return parseArrayStorage(STORAGE_KEYS.orcamentos);
      }
    );
  }

  async function carregarTodosOrcamentos() {
    const collection = getDbCollection("orcamentos");
    if (!collection) return parseArrayStorage(STORAGE_KEYS.orcamentos);
    try {
      const snapshot = await collection.get();
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
    const collection = getDbCollection("profissionais");
    if (collection && typeof collection.onSnapshot === "function") {
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
    }
    return watchStorageChange(
      STORAGE_KEYS.profissionais,
      callback,
      function () {
        const lista = parseArrayStorage(STORAGE_KEYS.profissionais);
        lista.sort(function (a, b) {
          return String(a.nome || "").localeCompare(String(b.nome || ""));
        });
        return lista;
      }
    );
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
    const collection = getDbCollection("relatorios");
    if (collection && typeof collection.orderBy === "function") {
      return collection
        .orderBy("dataConclusaoISO", "desc")
        .onSnapshot(function (snapshot) {
          const lista = snapshot.docs.map(function (doc) {
            return { id: doc.id, ...doc.data() };
          });
          setArrayStorage(STORAGE_KEYS.relatorios, lista);
          callback(lista);
        });
    }
    return watchStorageChange(
      STORAGE_KEYS.relatorios,
      callback,
      function () {
        const lista = parseArrayStorage(STORAGE_KEYS.relatorios);
        lista.sort(function (a, b) {
          return String(b.dataConclusaoISO || "").localeCompare(String(a.dataConclusaoISO || ""));
        });
        return lista;
      }
    );
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
      // Remove modifiers/joiners that break rendering in older clients.
      .replace(/\uFE0F/g, "")
      .replace(/\u200D/g, "")
      // Padroniza ícones em símbolos simples e amplamente suportados.
      .replace(WHATSAPP_ICON_REGEX, function (icone) {
        return WHATSAPP_ICON_MAP[icone] || icone;
      })
      // Qualquer emoji restante vira marcador seguro.
      .replace(/[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "•")
      // Corrige caractere já quebrado (replacement char).
      .replace(/\uFFFD/g, "•")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function abrirLinkWhatsApp(numero, mensagem) {
    if (!numero) return false;
    const textoBruto = String(mensagem || "");
    const texto = sanitizarMensagemWhatsApp(textoBruto) || textoBruto;
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
    let janela = null;
    try {
      janela = window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {}
    if (!janela) {
      window.location.href = url;
    }
    return true;
  }

  const api = {
    HORARIOS_SEMANA,
    HORARIOS_SABADO,
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
