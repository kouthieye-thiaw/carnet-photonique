/* Page « formulaire » : filtre plein texte des formules. */
(function () {
  "use strict";
  const K = window.Carnet;
  if (!K) return;
  const { $, $$, norm } = K;
  const blocs = $$(".fgrid .formule").map(el => ({ el, sec: el.closest(".fsec"), txt: "" }));
  const index = () => blocs.forEach(b => {
    const clone = b.el.cloneNode(true);
    clone.querySelectorAll(".katex-html").forEach(x => x.remove());      // garder le TeX (annotation), pas les glyphes
    b.txt = norm(clone.textContent + " " + (b.sec.querySelector("h2") || {}).textContent);
  });
  index();
  document.addEventListener("carnet:math", index);
  const n = $('[data-c="n"]');
  const total = blocs.length;
  function filtrer(q) {
    const mots = norm(q).split(/\s+/).filter(Boolean);
    let vus = 0;
    blocs.forEach(b => { const ok = mots.every(m => b.txt.includes(m)); b.el.hidden = !ok; if (ok) vus++; });
    $$(".fsec").forEach(s => { s.hidden = !s.querySelector(".formule:not([hidden])"); });
    n.textContent = mots.length ? `${vus} formule${vus > 1 ? "s" : ""} sur ${total}` : `${total} formules`;
  }
  let tm; $('[data-c="q"]').addEventListener("input", e => { clearTimeout(tm); tm = setTimeout(() => filtrer(e.target.value), 120); });
  filtrer("");
})();
