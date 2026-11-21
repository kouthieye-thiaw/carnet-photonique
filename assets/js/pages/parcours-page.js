/* Page « mon parcours » : pôles du métier ↔ compétences GEII, feuille de route, grille d'auto-positionnement. */
import { PHASES, POLES, COMPETENCES, NIVEAUX_AUTO } from "../../data/parcours.js";
import { GENS, THEMES } from "../../data/generateurs.js";
import * as M from "../memoire.js";

const K = window.Carnet;
const { store, esc, $, $$ } = K;
const W = { "": 0, lu: 1 / 3, compris: 2 / 3, maitrise: 1 };
const existe = id => K.allPages.some(p => p.id === id);
const page = id => K.allPages.find(p => p.id === id);
const avancement = ids => { const l = ids.filter(existe); return l.length ? l.reduce((a, id) => a + W[K.getStatus(id)], 0) / l.length : 0; };
const BTS = { concevoir: "conception d'un système optique photonique", realiser: "prototypage et industrialisation", controler: "contrôle et métrologie", maintenir: "assistance technique et maintenance" };

/* ---- les quatre pôles ---- */
$('[data-c="poles"]').innerHTML = POLES.filter(p => p.id !== "transverse").map(p => `<div class="pole">
  <span class="hand sm">${esc(p.titre)}</span><h3>${esc(BTS[p.id])}</h3>
  <ul>${COMPETENCES.filter(c => c.pole === p.id).map(c => `<li>${esc(c.titre)}</li>`).join("")}</ul>
  <p class="geii">en GEII : <b>${esc(p.geii)}</b></p></div>`).join("");

/* ---- la feuille de route ---- */
function phases() {
  const actif = Object.keys(store.get("act", {})).length > 0;
  let courante = null;
  const html = PHASES.map(ph => {
    const ids = ph.lecons.filter(existe);
    const av = ph.id === "p0" ? (actif ? 1 : 0) : avancement(ids);
    if (!courante && av < 1) courante = ph.id;
    const preuve = store.get("parcours:preuve:" + ph.id, false);
    const minutes = ids.reduce((a, id) => a + (page(id).min || 0), 0);
    const lec = ids.map(id => {
      const p = page(id), s = store.get("lec:" + id, null);
      const rap = s ? (s.n <= Date.now() ? "rappel à faire" : `rappel ${M.quand(s.n)}`) : "";
      return `<li><span class="st-dot" data-s="${K.getStatus(id)}" title="${esc(K.getStatus(id) || "à lire")}"></span><a href="${K.ROOT + p.file}">${esc(p.title)}</a><span class="rap">${rap}</span></li>`;
    }).join("");
    const outils = (ph.outils || []).map(([f, t]) => `<li><a href="${K.ROOT + f}">${esc(t)}</a></li>`).join("");
    const geii = ph.geii.map(([t, f]) => `<li>${f ? `<a href="${K.ROOT + f}">${esc(t)}</a>` : esc(t)}</li>`).join("");
    const th = ph.themes.length ? `<p class="small" style="margin-top:10px"><a href="${K.ROOT}entrainement.html#themes=${ph.themes.join(",")}">m'entraîner sur ces thèmes →</a> <span>(${ph.themes.map(t => esc(THEMES[t].t)).join(", ")})</span></p>` : "";
    return `<li class="phase" id="${ph.id}" data-ph="${ph.id}"><header><span class="num">${ph.num}</span><h3>${esc(ph.titre)}</h3><span class="hand sm">${esc(ph.sous)}</span>
        <span class="progress" title="${Math.round(av * 100)} %"><i style="--p:${Math.round(av * 100)}%"></i></span></header>
      <p class="obj">${esc(ph.objectif)}${minutes ? ` <span class="small">· ${ids.length} leçon${ids.length > 1 ? "s" : ""}, ≈ ${Math.round(minutes / 6) / 10} h de lecture</span>` : ""}</p>
      <div class="ph-cols"><div><h5>${outils ? "à faire" : "les leçons, dans l'ordre"}</h5><ul class="ph-lecons">${outils || lec}</ul></div>
        <div><h5>tes cours GEII reliés</h5>${geii ? `<ul class="ph-geii">${geii}</ul>` : `<p class="small">—</p>`}${th}</div></div>
      <div class="preuve-box"><b>la preuve :</b> ${esc(ph.preuve)}<br><label class="small" style="display:inline-flex;gap:8px;align-items:center;margin-top:6px;cursor:pointer"><input type="checkbox" data-preuve="${ph.id}" ${preuve ? "checked" : ""} style="accent-color:#12803d;width:17px;height:17px"> c'est fait, je peux le montrer</label></div></li>`;
  }).join("");
  $('[data-c="phases"]').innerHTML = html;
  const c = courante && $(`.phase[data-ph="${courante}"]`); if (c) { c.classList.add("courante"); c.querySelector("header h3").insertAdjacentHTML("afterend", `<span class="tag orange">tu en es là</span>`); }
}
$('[data-c="phases"]').addEventListener("change", e => {
  const c = e.target.closest("[data-preuve]"); if (!c) return;
  store.set("parcours:preuve:" + c.dataset.preuve, c.checked);
  K.toast(c.checked ? "preuve cochée ✓ — pense à la ranger dans ton portfolio" : "preuve décochée");
});

/* ---- grille de compétences ---- */
function mesure(c) {
  const lec = avancement(c.lecons);
  const gens = GENS.filter(g => c.themes.includes(g.th));
  if (!gens.length) return { v: lec, data: c.lecons.some(id => K.getStatus(id)) };
  const ex = gens.filter(g => (M.etatExo(g.id).m || 0) >= 4).length / gens.length;
  const vus = gens.some(g => (M.etatExo(g.id).m || 0) > 0) || c.lecons.some(id => K.getStatus(id));
  return { v: 0.6 * lec + 0.4 * ex, data: vus };
}
function competences() {
  $('[data-c="competences"]').innerHTML = COMPETENCES.map(c => {
    const a = store.get("auto:" + c.id, null), m = mesure(c);
    const pole = POLES.find(p => p.id === c.pole);
    let ecart = "";
    if (a != null && m.data) {
      const d = a / 4 - m.v;
      if (d > 0.35) ecart = "Tu t'estimes plus avancé que ce que montrent tes rappels et exercices : teste-toi avant de passer à la suite.";
      else if (d < -0.35) ecart = "Tes résultats sont meilleurs que ton estimation : tu peux te faire davantage confiance.";
    }
    return `<div class="comp"><div><span class="pole-tag">${esc(pole.titre)}</span><h4>${esc(c.titre)}</h4><p class="d">${esc(c.desc)}</p></div>
      <div><div class="niv" role="group" aria-label="mon niveau : ${esc(c.titre)}">${NIVEAUX_AUTO.map((t, i) => `<button type="button" data-c="${c.id}" data-n="${i}" aria-pressed="${a === i}">${esc(t)}</button>`).join("")}</div>
        <div class="mesure"><span>mesuré</span><span class="track"><i style="width:${Math.round(100 * m.v)}%"></i></span><span>${Math.round(100 * m.v)} %</span></div>
        ${ecart ? `<p class="ecart">${ecart}</p>` : ""}</div></div>`;
  }).join("");
}
$('[data-c="competences"]').addEventListener("click", e => {
  const b = e.target.closest("button[data-n]"); if (!b) return;
  store.set("auto:" + b.dataset.c, +b.dataset.n); competences();
});

phases(); competences();
