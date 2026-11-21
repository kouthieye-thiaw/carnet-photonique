/* Barre de retour vers le carnet photonique, ajoutée en haut des pages de révision BUT3. */
(function () {
  "use strict";
  var s = document.currentScript || document.querySelector('script[src*="carnet-but3.js"]');
  var root = new URL("../", s.src).href;
  function go() {
    if (window.self !== window.top || document.querySelector(".carnet-bar")) return;   // pas de barre dans un cadre (iframe)
    var bar = document.createElement("nav");
    bar.className = "carnet-bar";
    bar.setAttribute("aria-label", "retour au carnet photonique");
    bar.innerHTML = '<a class="cb-pill" href="' + root + 'but3/index.html">← mes cours BUT3</a>' +
      '<span class="cb-hand">révisions BUT3 GEII</span>' +
      '<a class="cb-brand" href="' + root + 'index.html">carnet photonique</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
