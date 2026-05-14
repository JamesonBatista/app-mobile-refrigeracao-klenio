(function () {
  const nativeAlert = typeof window.alert === "function" ? window.alert.bind(window) : null;
  const nativeConfirm = typeof window.confirm === "function" ? window.confirm.bind(window) : null;
  const queue = [];
  const state = {
    aberto: false,
    overlay: null,
    msgEl: null,
    okBtn: null,
    cancelBtn: null,
    itemAtual: null,
  };

  function toMessage(value) {
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function ensureElements() {
    if (state.overlay) return true;
    if (!document.body) return false;

    const overlay = document.createElement("div");
    overlay.className = "ka-alert-overlay";
    overlay.innerHTML = `
      <div class="ka-alert-card" role="dialog" aria-modal="true" aria-label="Mensagem do sistema">
        <header class="ka-alert-header">Klenio Refrigeração</header>
        <section class="ka-alert-body">
          <p class="ka-alert-message"></p>
        </section>
        <footer class="ka-alert-footer">
          <button class="ka-alert-cancel" type="button">Cancelar</button>
          <button class="ka-alert-ok" type="button">OK</button>
        </footer>
      </div>
    `;

    document.body.appendChild(overlay);
    state.overlay = overlay;
    state.msgEl = overlay.querySelector(".ka-alert-message");
    state.okBtn = overlay.querySelector(".ka-alert-ok");
    state.cancelBtn = overlay.querySelector(".ka-alert-cancel");

    state.okBtn.addEventListener("click", function () {
      closeAlert(true);
    });
    state.cancelBtn.addEventListener("click", function () {
      closeAlert(false);
    });
    overlay.addEventListener("click", function (event) {
      if (event.target !== overlay) return;
      closeAlert(state.itemAtual && state.itemAtual.type === "confirm" ? false : true);
    });
    document.addEventListener("keydown", function (event) {
      if (!state.aberto) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeAlert(state.itemAtual && state.itemAtual.type === "confirm" ? false : true);
      } else if (event.key === "Enter") {
        event.preventDefault();
        closeAlert(true);
      }
    });
    return true;
  }

  function openNext() {
    if (state.aberto || queue.length === 0) return;
    if (!ensureElements()) return;

    const payload = queue.shift();
    state.itemAtual = payload;
    state.msgEl.textContent = payload.message;
    const isConfirm = payload.type === "confirm";
    state.cancelBtn.classList.toggle("is-hidden", !isConfirm);
    state.okBtn.textContent = isConfirm ? "OK" : "OK";
    state.overlay.classList.add("is-open");
    state.aberto = true;

    requestAnimationFrame(function () {
      if (!state.okBtn) return;
      if (isConfirm && state.cancelBtn) state.cancelBtn.focus();
      else state.okBtn.focus();
    });
  }

  function closeAlert(result) {
    if (!state.aberto || !state.overlay) return;
    const atual = state.itemAtual;
    if (atual && atual.type === "confirm" && typeof atual.resolve === "function") {
      atual.resolve(Boolean(result));
    }
    state.itemAtual = null;
    state.overlay.classList.remove("is-open");
    state.aberto = false;
    openNext();
  }

  function showCustomAlert(value) {
    const message = toMessage(value);
    if (!document.body) {
      if (nativeAlert) nativeAlert(message);
      return;
    }
    queue.push({ type: "alert", message });
    openNext();
  }

  function showCustomConfirm(value) {
    const message = toMessage(value);
    if (!document.body) {
      if (nativeConfirm) return nativeConfirm(message);
      return false;
    }
    return new Promise(function (resolve) {
      queue.push({ type: "confirm", message, resolve });
      openNext();
    });
  }

  window.showCustomConfirm = showCustomConfirm;
  window.showCustomAlert = showCustomAlert;
  window.alert = function alertOverride(message) {
    showCustomAlert(message);
  };

  if (typeof window.confirm !== "function") {
    window.confirm = function confirmFallback(message) {
      return showCustomConfirm(message);
    };
  }

  if (typeof window.confirmNative !== "function" && nativeConfirm) {
    window.confirmNative = nativeConfirm;
  }

  if (typeof window.alertNative !== "function" && nativeAlert) {
    window.alertNative = nativeAlert;
  }

  if (typeof window.showCustomAlert === "function") {
    openNext();
  }
})();
