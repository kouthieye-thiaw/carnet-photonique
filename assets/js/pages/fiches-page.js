/* Page « fiches » : répétition espacée en 7 boîtes de Leitner (mêmes délais que la séance du jour).
   État : store « fiches:etat » = { id: { b, n } }. */
(function () {
  "use strict";
  const K = window.Carnet, F = window.CARNET_FICHES;
  if (!K || !F) return;
  const { MAP, store, esc, $ } = K;
  const JOUR = 86400000, DELAI = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16, 6: 35, 7: 90 }, TAILLE = 20, NB = 7;
  const nomMod = id => { const m = MAP.modules.find(x => x.id === id); return m ? `${m.num} · ${m.title}` : id; };
  const etat = store.get("fiches:etat", {});
  let mods = store.get("fiches:mods", null) || [...new Set(F.map(f => f.m))];
  const sauver = () => store.set("fiches:etat", etat);
  const boite = f => (etat[f.id] && etat[f.id].b) || 1;
  const due = f => !etat[f.id] || etat[f.id].n <= Date.now();

  /* ---- choix des modules ---- */
  const chips = $('[data-c="mods"]');
  const tous = [...new Set(F.map(f => f.m))];
  chips.innerHTML = tous.map(m => `<button type="button" data-m="${esc(m)}" aria-pressed="${mods.includes(m)}">${esc(nomMod(m))}</button>`).join("");
  chips.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const m = b.dataset.m;
    mods = mods.includes(m) ? mods.filter(x => x !== m) : [...mods, m];
    if (!mods.length) mods = [m];
    store.set("fiches:mods", mods);
    chips.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(mods.includes(x.dataset.m))));
    resume();
  });
  const choisies = () => F.filter(f => mods.includes(f.m));

  /* ---- résumé des boîtes ---- */
  function resume() {
    const c = choisies(), n = c.length || 1;
    $('[data-c="boites"]').innerHTML = Array.from({ length: NB }, (_, k) => k + 1).map(b => {
      const k = c.filter(f => boite(f) === b).length;
      return `<div class="bx"><b>${k}</b><span>boîte ${b}${b > 1 ? ` · ${DELAI[b]} j` : ""}</span><i style="--p:${Math.round(100 * k / n)}%"></i></div>`;
    }).join("");
    const d = c.filter(due).length;
    $('[data-c="dues"]').textContent = d ? `${d} fiche${d > 1 ? "s" : ""} à revoir aujourd'hui (séance de ${Math.min(TAILLE, d)})` : "rien à revoir aujourd'hui : reviens demain, ou relis la liste ci-dessous";
    $('[data-c="go"]').disabled = !d;
  }

  /* ---- séance ---- */
  let file = [], i = 0, vues = 0, sues = 0;
  const carte = $('[data-c="carte"]'), sec = $('[data-c="seance"]'), fin = $('[data-c="fin"]');
  function demarrer() {
    file = choisies().filter(due).sort((a, b) => boite(a) - boite(b) || Math.random() - 0.5).slice(0, TAILLE);
    i = 0; vues = 0; sues = 0;
    if (!file.length) return;
    sec.hidden = false; fin.hidden = true; montrer();
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function montrer() {
    const f = file[i];
    carte.classList.remove("flip");
    $('[data-c="q"]').innerHTML = f.q; $('[data-c="r"]').innerHTML = f.r;
    $('[data-c="pos"]').textContent = `fiche ${vues + 1} · reste ${file.length - i}`;
    $('[data-c="mod"]').textContent = `${nomMod(f.m)} · boîte ${boite(f)}`;
    carte.focus({ preventScroll: true });
  }
  function repondre(ok) {
    const f = file[i]; if (!f) return;
    if (!carte.classList.contains("flip")) { carte.classList.add("flip"); return; }   // d'abord voir la réponse
    const b = ok ? Math.min(NB, boite(f) + 1) : 1;
    etat[f.id] = { b, n: Date.now() + DELAI[b] * JOUR - (b === 1 ? 0 : 3600000) };
    sauver(); K.act && K.act("f"); vues++; if (ok) sues++;
    if (!ok) file.push(f);                     // une fiche ratée revient en fin de séance
    i++;
    if (i >= file.length || vues >= TAILLE * 2) { terminer(); return; }
    montrer();
  }
  function terminer() {
    sec.hidden = true; fin.hidden = false;
    fin.innerHTML = `<span class="hand">séance terminée !</span><p style="margin:8px 0 0">${vues} réponse${vues > 1 ? "s" : ""}, dont ${sues} juste${sues > 1 ? "s" : ""} du premier coup ou au rattrapage. Les fiches sues reviendront plus tard ; les autres demain.</p>`;
    resume(); liste();
  }
  carte.addEventListener("click", () => carte.classList.toggle("flip"));
  $('[data-c="savais"]').addEventListener("click", () => repondre(true));
  $('[data-c="revoir"]').addEventListener("click", () => repondre(false));
  $('[data-c="go"]').addEventListener("click", demarrer);
  document.addEventListener("keydown", e => {
    if (sec.hidden || e.target.closest("input, textarea, select")) return;
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); carte.classList.toggle("flip"); }
    else if (e.key === "ArrowRight") repondre(true);
    else if (e.key === "ArrowLeft") repondre(false);
  });

  /* ---- liste complète ---- */
  function liste() {
    $('[data-c="toutes"]').innerHTML = tous.map(m => {
      const fs = F.filter(f => f.m === m);
      return `<details class="reveal"><summary>${esc(nomMod(m))}<span class="tag soft">${fs.length} fiches</span></summary><div class="reveal-body">${fs.map(f =>
        `<div class="gl-item"><div class="term" style="font-size:18px">${f.q}<small>boîte ${boite(f)}</small></div><p>${f.r}</p></div>`).join("")}</div></details>`;
    }).join("");
  }

  resume(); liste();
})();
