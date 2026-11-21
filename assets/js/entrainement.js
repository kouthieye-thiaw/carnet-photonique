/* entrainement.js — le lecteur d'exercices du carnet (module ES)
   · estompage : exemple résolu → exemple à compléter → seul (effet de l'exemple résolu, Sweller ; Renkl)
   · entraînement mélangé : d'abord reconnaître la relation à utiliser, puis calculer (Rohrer & Taylor)
   · confiance avant correction, solution pas à pas, ratés re-posés plus loin dans la séance
   · chaque réussite « seul » est planifiée en répétition espacée (memoire.js) */
import * as M from "./memoire.js";
import { GENS, THEMES, genParId } from "../data/generateurs.js";
export { GENS, THEMES, genParId };

const K = () => window.Carnet;
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const P4 = x => +Number(x).toPrecision(4);
export const fmtRep = x => P4(x.rep).toLocaleString("fr-FR", { maximumFractionDigits: 12 }) + (x.unite ? " " + x.unite : "");
export function lireNombre(s) {
  s = String(s).trim().replace(/[\s\u202f\u00a0]/g, "").replace(/[−–]/g, "-").replace(",", ".");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}
export const estJuste = (v, x) => Math.abs(v - x.rep) <= Math.max(x.abs || 0, Math.abs(x.rep) * (x.tol || 0)) + 1e-12;
export function niveau(m) { return m >= 4 ? "maîtrisé" : m === 3 ? "1 réussite seul" : m === 2 ? "à faire seul" : m === 1 ? "exemple étudié" : "jamais vu"; }

/* compose une file d'exercices : les exercices dus d'abord, puis les moins maîtrisés, jamais deux fois le même d'affilée */
export function composer(ids, n, r = Math.random) {
  if (!ids.length || n <= 0) return [];
  const now = Date.now();
  const prio = id => { const s = M.etatExo(id); const du = s.m >= 2 && s.n && s.n <= now; return (du ? 0 : 10) + Math.min(s.m || 0, 5) + r() * 4; };
  const tri = ids.slice().sort((a, b) => prio(a) - prio(b));
  const choisis = [];
  while (choisis.length < n) choisis.push(...tri.slice(0, n - choisis.length));
  const out = M.melanger(choisis, r);
  for (let k = 1; k < out.length; k++) if (out[k] === out[k - 1]) { const j = out.findIndex((v, idx) => idx > k && v !== out[k]); if (j > 0) [out[k], out[j]] = [out[j], out[k]]; }
  return out;
}

/* ---------------------------------------------------------------------------------------------
   mountPlayer(el, { file: [ids], mode: "melange" | "bloc", onFin })
   --------------------------------------------------------------------------------------------- */
export function mountPlayer(el, { file, mode = "melange", onFin } = {}) {
  const { esc, h, renderMath } = K();
  file = file.slice();
  const total0 = file.length;
  const stats = { vus: 0, ok: 0, ko: 0, disc: 0, discOk: 0, th: {}, rates: new Set(), t0: Date.now() };
  const reposes = new Set();
  let i = 0;
  el.innerHTML = "";
  const box = h("div", { class: "player train" });
  el.appendChild(box);

  function suivant() {
    if (!file.length) return fin();
    const id = file.shift();
    const g = genParId[id];
    if (!g) return suivant();
    i++;
    poser(g);
  }

  function poser(g) {
    const x = g.gen(seeded((Math.random() * 2 ** 31) >>> 0));
    const st = M.etatExo(g.id);
    const forme = (st.m || 0) === 0 ? "exemple" : st.m === 1 ? "complete" : "seul";
    const discrimination = mode === "melange" && forme === "seul";
    const lab = { exemple: "exemple résolu", complete: "exemple à compléter", seul: "à toi, seul" }[forme];
    const lecon = g.lecons && g.lecons.find(id => K().allPages.some(p => p.id === id));
    box.innerHTML = `<div class="pl-top"><span class="tag">${esc(THEMES[g.th].t)}</span><span class="tag soft">exercice ${i} / ${Math.max(i + file.length, total0)}</span><span class="tag orange">${lab}</span>${stats.vus ? `<span class="pl-score">✓ ${stats.ok} / ${stats.vus}</span>` : ""}</div>
      <h3>${esc(g.titre)}</h3>
      <div class="pl-enonce">${x.enonce}</div>
      <div class="pl-corps"></div>`;
    const corps = box.querySelector(".pl-corps");
    const etapesHTML = (n) => `<ol class="pl-etapes">${x.etapes.slice(0, n).map(e => `<li>${e}</li>`).join("")}</ol>`;
    const lienLecon = lecon ? `<a href="${K().ROOT + lecon}.html">revoir la leçon : ${esc(K().titleOf(lecon))}</a>` : "";

    if (forme === "exemple") {
      corps.innerHTML = `<p class="small pl-consigne">Exemple résolu : lis chaque étape et demande-toi <em>pourquoi</em> elle est là. Ensuite, tu en feras un toi-même.</p>
        ${etapesHTML(x.etapes.length)}<p class="pl-rep">réponse : <b>${esc(fmtRep(x))}</b></p>
        <div class="pl-act"><button class="pill small" type="button" data-ok>j'ai compris : à moi d'essayer →</button><button class="pill small ghost" type="button" data-deja>je sais déjà faire</button></div>`;
      corps.querySelector("[data-ok]").addEventListener("click", () => { M.poserNiveau(g.id, 1); M.activite("e"); file.unshift(g.id); suivant(); });
      corps.querySelector("[data-deja]").addEventListener("click", () => { M.poserNiveau(g.id, 2); file.unshift(g.id); suivant(); });
      renderMath(box); return;
    }

    const nVisibles = forme === "complete" ? Math.max(1, x.etapes.length - 1) : 0;
    corps.innerHTML = `${forme === "complete" ? `<p class="small pl-consigne">Les premières étapes sont faites : termine le calcul.</p>${etapesHTML(nVisibles)}` : ""}
      ${discrimination ? `<div class="pl-disc"><p class="pl-q">1. Quelle relation vas-tu utiliser ?</p><div class="pl-opts"></div></div>` : ""}
      <div class="pl-calc" ${discrimination ? "hidden" : ""}>
        ${discrimination ? `<p class="pl-q">2. Calcule.</p>` : ""}
        <div class="pl-in"><input type="text" inputmode="decimal" autocomplete="off" placeholder="ta réponse" aria-label="ta réponse"><span class="u">${esc(x.unite || "sans unité")}</span></div>
        <div class="pl-conf"></div>
        <div class="pl-act"><button class="pill small" type="button" data-verif>vérifier</button>${forme === "seul" ? `<button class="pill small ghost" type="button" data-indice>indice : la formule</button>` : ""}</div>
        <div class="pl-indice" hidden><div class="formule"><div class="f-eq">\\[ ${g.f} \\]</div></div></div>
      </div>
      <div class="pl-fb" hidden></div>`;
    const conf = M.boutonsConfiance();
    corps.querySelector(".pl-conf").appendChild(conf.el);
    const inp = corps.querySelector("input");
    let aide = false, fait = false;

    if (discrimination) {
      const autres = GENS.filter(o => o.rel !== g.rel);
      const meme = M.melanger(autres.filter(o => o.th === g.th)).slice(0, 2);
      const reste = M.melanger(autres.filter(o => !meme.includes(o))).slice(0, 3 - meme.length);
      const opts = M.melanger([g, ...meme, ...reste]);
      const zone = corps.querySelector(".pl-opts");
      zone.innerHTML = opts.map(o => `<button type="button" class="pl-opt" data-id="${o.id}">${esc(o.rel)}</button>`).join("");
      zone.addEventListener("click", e => {
        const b = e.target.closest(".pl-opt"); if (!b || zone.dataset.fait) return;
        zone.dataset.fait = "1"; stats.disc++;
        const bon = b.dataset.id === g.id; if (bon) stats.discOk++;
        zone.querySelectorAll(".pl-opt").forEach(x2 => { x2.disabled = true; if (x2.dataset.id === g.id) x2.classList.add("right"); else if (x2 === b) x2.classList.add("wrong"); });
        zone.insertAdjacentHTML("afterend", `<p class="small pl-dfb">${bon ? "✓ c'est bien elle." : `✗ ici, c'est « ${esc(g.rel)} » : repère ce qui, dans l'énoncé, l'annonçait.`}</p>`);
        corps.querySelector(".pl-calc").hidden = false; inp.focus();
      });
    }
    const ind = corps.querySelector("[data-indice]");
    if (ind) ind.addEventListener("click", () => { aide = true; corps.querySelector(".pl-indice").hidden = false; ind.disabled = true; renderMath(corps.querySelector(".pl-indice")); });

    const verifier = () => {
      if (fait) { suivant(); return; }
      const v = lireNombre(inp.value);
      if (isNaN(v)) { K().toast("un nombre, stp (virgule ou point)"); inp.focus(); return; }
      fait = true;
      const ok = estJuste(v, x);
      stats.vus++; ok ? stats.ok++ : stats.ko++;
      const t = stats.th[g.th] || (stats.th[g.th] = { ok: 0, n: 0 }); t.n++; if (ok) t.ok++;
      let s;
      if (forme === "complete") { s = M.poserNiveau(g.id, ok ? 2 : 1); M.activite("e"); if (conf.value != null) M.calibrer(ok, conf.value, "exo"); }
      else s = M.noterExo(g.id, ok, conf.value, aide);
      if (!ok) { stats.rates.add(g.id); if (!reposes.has(g.id)) { reposes.add(g.id); file.splice(Math.min(file.length, 2 + Math.floor(Math.random() * 2)), 0, g.id); } }
      inp.disabled = true; corps.querySelectorAll(".conf button, [data-indice]").forEach(b => b.disabled = true);
      const fb = corps.querySelector(".pl-fb");
      const sure = !ok && conf.value === 2;
      fb.innerHTML = `<p class="pl-verdict ${ok ? "ok" : "ko"}">${ok ? "juste ✓" : "pas tout à fait ✗"} <span class="small">réponse attendue : <b>${esc(fmtRep(x))}</b>${ok ? "" : ` · toi : ${esc(inp.value)}`}</span></p>
        ${sure ? `<p class="flag">⚡ erreur « sûre » : la plus utile à comprendre. Lis la solution, puis refais le calcul de tête.</p>` : ""}
        <details class="reveal solution" ${ok ? "" : "open"}><summary>la solution pas à pas</summary><div class="reveal-body"><ol class="pl-etapes">${x.etapes.map(e => `<li>${e}</li>`).join("")}</ol>${lienLecon ? `<p class="small">${lienLecon}</p>` : ""}</div></details>
        <p class="small pl-next">${ok && forme === "seul" ? `Prochaine fois : ${M.quand(s.n)}${(s.m || 0) >= 4 ? " · maîtrisé ✓" : ""}.` : ok ? "Prochaine fois : seul, sans les premières étapes." : "Un exercice du même type reviendra un peu plus loin, avec d'autres valeurs."}</p>
        <div class="pl-act"><button class="pill small" type="button" data-suiv>${file.length ? "exercice suivant →" : "terminer"}</button></div>`;
      fb.hidden = false;
      fb.querySelector("[data-suiv]").addEventListener("click", suivant);
      renderMath(fb);
      fb.querySelector("[data-suiv]").focus({ preventScroll: true });
    };
    corps.querySelector("[data-verif]").addEventListener("click", verifier);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") verifier(); });
    renderMath(box);
    if (!discrimination) setTimeout(() => inp.focus({ preventScroll: true }), 30);
  }

  function fin() {
    const min = Math.max(1, Math.round((Date.now() - stats.t0) / 60000));
    const ths = Object.entries(stats.th).map(([k, v]) => `<li>${esc(THEMES[k].t)} : ${v.ok}/${v.n}</li>`).join("");
    const rates = [...stats.rates].map(id => genParId[id]).filter(Boolean);
    box.innerHTML = `<div class="pl-top"><span class="tag">bilan</span><span class="tag soft">${min} min</span></div>
      <h3>${stats.vus ? `${stats.ok} / ${stats.vus} réussi${stats.ok > 1 ? "s" : ""}` : "exemples étudiés ✓"}</h3>
      ${stats.disc ? `<p>Relation reconnue du premier coup : <b>${stats.discOk} / ${stats.disc}</b>. ${stats.discOk === stats.disc ? "C'est exactement la compétence que l'entraînement mélangé développe." : "Savoir choisir la bonne relation, c'est la moitié du travail : c'est pour ça qu'on mélange les thèmes."}</p>` : ""}
      ${ths ? `<ul class="pl-bilan">${ths}</ul>` : ""}
      ${rates.length ? `<p class="small">À revoir en priorité : ${rates.map(g => esc(g.titre)).join(" · ")}. Ils reviendront dans ta séance du jour.</p>` : stats.vus ? `<p class="small">Tout juste : ces exercices s'espacent maintenant dans le temps.</p>` : ""}`;
    onFin && onFin(stats, box);
  }

  suivant();
  return { stats };
}
