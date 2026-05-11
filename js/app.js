// js/app.js

document.addEventListener("DOMContentLoaded", () => {
  Router.register("home", (root) => {
    root.innerHTML = `
      <article class="boot-card">
        <h1 class="boot-title">Projeto limpo com sucesso</h1>
        <p class="boot-subtitle">
          Base reiniciada. Envie as novas telas e eu construo uma por uma.
        </p>
        <ul class="boot-list">
          <li>Estrutura SPA simplificada</li>
          <li>Estado global reiniciado</li>
          <li>Roteador pronto para registrar novas telas</li>
        </ul>
      </article>
    `;
  });

  Router.go("home");
});
