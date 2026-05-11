// js/router.js

const Router = (() => {
  const screens = new Map();

  function register(screenName, renderer) {
    screens.set(screenName, renderer);
  }

  function go(screenName, payload = null) {
    const renderer = screens.get(screenName);
    if (!renderer) {
      console.warn(`Tela "${screenName}" nao registrada.`);
      return;
    }

    const app = document.getElementById("app");
    app.innerHTML = `<section class="screen" data-screen="${screenName}"></section>`;

    const screenElement = app.querySelector(`[data-screen="${screenName}"]`);
    renderer(screenElement, payload);
    State.set("currentScreen", screenName);
  }

  window.setTela = go;

  return { register, go };
})();
