// js/utils/dataLocal.js
// Data chave em fuso local (evita virar o dia com toISOString UTC).

(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.DataLocal = api;
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null, function () {
  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** Retorna YYYY-MM-DD no fuso local do Date informado. */
  function formatarDataChaveLocal(data) {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) return "";
    return `${data.getFullYear()}-${pad2(data.getMonth() + 1)}-${pad2(data.getDate())}`;
  }

  return { formatarDataChaveLocal, pad2 };
});
