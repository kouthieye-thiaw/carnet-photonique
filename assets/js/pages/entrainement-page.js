/* Page « entraînement » : choix des thèmes, séries mélangées ou par thème, catalogue des exercices. */
import { GENS, THEMES, mountPlayer, composer, niveau } from "../entrainement.js";
import * as M from "../memoire.js";

const K = window.Carnet;
const { store, esc, $, $$ } = K;
const tous = Object.keys(THEMES);
let choisis = store.get("pref:train-themes", null) || tous.slice();
choisis = choisis.filter(t => tous.includes(t)); if (!choisis.length) choisis = tous.slice();
// lien depuis le parcours : entrainement.html#themes=optique,ondes
const hTh = location.hash.match(/themes=([\w,-]+)/);
if (hTh) { const t = hTh[1].split(",").filter(x => tous.includes(x)); if (t.length) { choisis = t; store.set("pref:train-themes", choisis); } }

/* ---- thèmes ---- */
const chips = $('[data-c="themes"]');
chips.innerHTML = tous.map(t => `<button type="button" data-t="${t}" aria-pressed="${choisis.includes(t)}">${esc(THEMES[t].t)} <span class="small">(${GENS.filter(g => g.th === t).length})</span></button>`).join("");
chips.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const t = b.dataset.t;
  choisis = choisis.includes(t) ? choisis.filter(x => x !== t) : [...choisis, t];
  if (!choisis.length) choisis = [t];
  store.set("pref:train-themes", choisis);
  $$("button", chips).forEach(x => x.setAttribute("aria-pressed", String(choisis.includes(x.dataset.t))));
  info();
});

function info() {
  const ids = GENS.filter(g => choisis.includes(g.th)).map(g => g.id);
  const dus = M.exosDus().filter(x => ids.includes(x.cle)).length;
  const maitrises = ids.filter(id => (M.etatExo(id).m || 0) >= 4).length;
  $('[data-c="info"]').textContent = `${ids.length} types d'exercices choisis · ${maitrises} maîtrisé${maitrises > 1 ? "s" : ""} · ${dus} à revoir aujourd'hui.`;
}

/* ---- lancer une série ---- */
const zone = $('[data-c="player"]');
function lancer(file, mode) {
  mountPlayer(zone, { file, mode, onFin: () => { catalogue(); info(); } });
  zone.scrollIntoView({ behavior: "smooth", block: "start" });
}
$('[data-c="go"]').addEventListener("click", () => {
  const n = +$('[data-c="n"]').value, mode = $('[data-c="mode"]').value;
  const ids = GENS.filter(g => choisis.includes(g.th)).map(g => g.id);
  if (mode === "melange") return lancer(composer(ids, n), "melange");
  // un thème à la fois : chaque type trois fois de suite (exemple → à compléter → seul)
  const ordre = composer(ids, Math.ceil(n / 3)).filter((v, i, a) => a.indexOf(v) === i);
  const file = []; for (const id of ordre) { if (file.length >= n) break; file.push(id, id, id); }
  lancer(file.slice(0, Math.max(n, 3)), "bloc");
});

/* ---- catalogue ---- */
function catalogue() {
  $('[data-c="catalogue"]').innerHTML = tous.map(t => {
    const gs = GENS.filter(g => g.th === t);
    const m = gs.filter(g => (M.etatExo(g.id).m || 0) >= 4).length;
    return `<details class="reveal"><summary>${esc(THEMES[t].t)}<span class="tag soft">${m} / ${gs.length} maîtrisés</span></summary><div class="reveal-body">
      <p class="small">Lien avec tes cours GEII : ${esc(THEMES[t].geii)}.</p>
      <ul class="cat-list">${gs.map(g => {
        const s = M.etatExo(g.id), lv = Math.min(s.m || 0, 4);
        const lec = (g.lecons || []).filter(id => K.allPages.some(p => p.id === id)).slice(0, 2);
        return `<li><div><span class="t">${esc(g.titre)}</span><div class="r">${esc(g.rel)}</div></div>
          <div class="meta"><span class="lvl" data-m="${lv}">${niveau(s.m || 0)}</span>${s.n && (s.m || 0) >= 2 ? `<span>revient ${M.quand(s.n)}</span>` : ""}${lec.map(id => `<a href="${K.ROOT + id}.html">${esc(K.titleOf(id))}</a>`).join(" · ")}</div>
          <div><button class="pill small ghost" type="button" data-solo="${g.id}">m'entraîner</button></div></li>`;
      }).join("")}</ul></div></details>`;
  }).join("");
}
$('[data-c="catalogue"]').addEventListener("click", e => {
  const b = e.target.closest("[data-solo]"); if (!b) return;
  lancer([b.dataset.solo, b.dataset.solo, b.dataset.solo], "bloc");
});

// lien direct : entrainement.html#ex=snell
const m = location.hash.match(/ex=([\w-]+)/);
if (m && GENS.some(g => g.id === m[1])) lancer([m[1], m[1], m[1]], "bloc");

info(); catalogue();
