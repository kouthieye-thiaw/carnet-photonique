/* Page « ma séance du jour » : plan adapté au temps disponible, révisions espacées (questions + fiches),
   rappel des leçons, entraînement mélangé, nouvelle leçon du parcours, bilan ; tableau de bord de la mémoire. */
import * as M from "../memoire.js";
import { GENS, mountPlayer, composer } from "../entrainement.js";
import { ORDRE } from "../../data/parcours.js";

const K = window.Carnet;
const { store, esc, $, $$, h, toast } = K;
const DELAI_F = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16, 6: 35, 7: 90 };   // mêmes délais que la page des fiches
const MINUTES = [10, 15, 25, 40, 60];
const pref = store.get("pref:seance", { min: 25 });
const jour = K.cleJour();
let etat = store.get("seance:jour", null);
if (!etat || etat.d !== jour) etat = { d: jour, faits: [] };
const sauverEtat = () => store.set("seance:jour", etat);
const nomMod = id => { const m = K.MAP.modules.find(x => x.id === id); return m ? `${m.num} · ${m.title}` : id; };

const FICHES = await new Promise(r => {
  if (window.CARNET_FICHES) return r(window.CARNET_FICHES);
  const s = document.createElement("script"); s.src = K.ROOT + "assets/data/fiches.js";
  s.onload = () => r(window.CARNET_FICHES || []); s.onerror = () => r([]); document.head.appendChild(s);
});
const pages = new Set(K.allPages.map(p => p.id));
const ordre = ORDRE.filter(id => pages.has(id)).concat(K.allPages.map(p => p.id).filter(id => !ORDRE.includes(id)));
const zone = $('[data-c="zone"]');

/* ================= le plan ================= */
let plan = null;
function composerPlan() {
  const T = pref.min, now = Date.now();
  const st = store.get("fiches:etat", {});
  const ouverts = new Set(K.allPages.filter(p => K.getStatus(p.id) !== "").map(p => p.id));
  const modsOuverts = new Set(K.allPages.filter(p => ouverts.has(p.id)).map(p => p.module.id));
  const dues = M.questionsDues().filter(x => pages.has(x.s.p)).map(x => ({ type: "q", cle: x.cle, s: x.s }))
    .concat(FICHES.filter(f => st[f.id] && st[f.id].n <= now).map(f => ({ type: "f", f })));
  const neuves = FICHES.filter(f => !st[f.id] && modsOuverts.has(f.m)).slice(0, T >= 40 ? 8 : T >= 25 ? 5 : 3).map(f => ({ type: "f", f, neuve: true }));
  const maxRev = Math.max(8, Math.floor(T * 0.35 / 0.5));
  const rev = M.melanger(dues).slice(0, maxRev);
  rev.push(...neuves.slice(0, Math.max(0, maxRev - rev.length)));
  const ld = M.leconsDues().filter(x => pages.has(x.cle));
  const nLec = ld.length ? Math.max(1, Math.min(ld.length, Math.floor(T * 0.25 / 4))) : 0;
  const genIds = GENS.filter(g => g.lecons.some(id => ouverts.has(id))).map(g => g.id);
  const nEx = genIds.length ? Math.max(3, Math.floor(T * 0.25 / 2)) : 0;
  const enCours = ordre.find(id => K.getStatus(id) === "lu" && !store.get("lec:" + id, null));
  const nouvelle = ordre.find(id => K.getStatus(id) === "");
  const minUtil = Math.ceil(rev.length * 0.5) + nLec * 4 + nEx * 2 + 2;
  const lecon = enCours || ((T - minUtil >= 12 || (!rev.length && !nLec)) ? nouvelle : null);
  return { T, rev, lec: ld.slice(0, nLec).map(x => x.cle), restantes: ld.length - nLec, ex: composer(genIds, nEx), nGen: genIds.length, lecon, enCours: !!enCours, minUtil };
}

function dessinerPlan() {
  plan = composerPlan();
  const p = plan, f = id => etat.faits.includes(id);
  const page = id => K.allPages.find(x => x.id === id);
  const L = p.lecon ? page(p.lecon) : null;
  const blocs = [
    { id: "rev", titre: "rappel espacé", vide: !p.rev.length,
      txt: p.rev.length ? `${p.rev.length} question${p.rev.length > 1 ? "s" : ""} et fiche${p.rev.length > 1 ? "s" : ""} que ta mémoire commence à oublier · ≈ ${Math.max(1, Math.ceil(p.rev.length * 0.5))} min` : "rien à rappeler aujourd'hui ✓ (les quiz et les fiches que tu fais alimentent cette étape)" },
    { id: "lec", titre: "rappel de leçon", vide: !p.lec.length,
      txt: p.lec.length ? `${p.lec.map(id => "« " + esc(K.titleOf(id)) + " »").join(", ")} · ≈ ${p.lec.length * 4} min${p.restantes > 0 ? ` (et ${p.restantes} autre${p.restantes > 1 ? "s" : ""} demain)` : ""}` : "aucune leçon à rappeler aujourd'hui" },
    { id: "ex", titre: "entraînement mélangé", vide: !p.ex.length,
      txt: p.ex.length ? `${p.ex.length} exercices tirés au sort parmi ${p.nGen} types liés aux leçons que tu as ouvertes · ≈ ${p.ex.length * 2} min` : "ouvre ta première leçon : les exercices liés se débloquent avec elle" },
    { id: "new", titre: p.enCours ? "terminer ma leçon en cours" : "nouvelle leçon", vide: !L,
      txt: L ? `<a href="${K.ROOT + L.file}${p.enCours ? "#rappel" : ""}">${esc(L.title)}</a> · ${esc(L.module.num + " · " + L.module.title)} · ≈ ${L.min} min${p.enCours ? " — il reste le rappel libre et le quiz" : ", en une ou deux fois"}` : (p.minUtil >= p.T - 11 ? "pas de nouveauté aujourd'hui : la révision d'abord, c'est elle qui fait gagner du temps" : "tout le parcours est ouvert ✓ — continue les révisions") },
    { id: "fin", titre: "bilan", vide: false, txt: "deux minutes : ce que j'ai compris, ce qui reste flou, par quoi je commence demain" }
  ];
  $('[data-c="plan"]').innerHTML = blocs.map((b, i) => `<li class="blk${b.vide ? " vide" : ""}${f(b.id) ? " fait" : ""}" data-b="${b.id}"><span class="blk-n">${i + 1}</span>
    <div><h3>${b.titre}</h3><p class="small">${b.txt}</p></div>
    ${b.vide ? "" : b.id === "new" ? `<a class="pill small${f(b.id) ? " ghost" : ""}" href="${K.ROOT + L.file}${p.enCours ? "#rappel" : ""}" data-go="new">${p.enCours ? "terminer" : "ouvrir la leçon"} →</a>` : `<button class="pill small${f(b.id) ? " ghost" : ""}" type="button" data-go="${b.id}">${f(b.id) ? "refaire" : "commencer"}</button>`}</li>`).join("");
  const total = Math.max(1, Math.ceil(p.rev.length * 0.5)) * (p.rev.length ? 1 : 0) + p.lec.length * 4 + p.ex.length * 2 + 2;
  $('[data-c="plan"]').insertAdjacentHTML("beforeend", `<li class="small" style="list-style:none;padding-left:4px">Plan estimé : ≈ ${total} min${L ? " + la leçon" : ""}. ${etat.faits.includes("fin") ? "<strong>Séance du jour terminée ✓ — à demain !</strong>" : ""}</li>`);
}

$('[data-c="plan"]').addEventListener("click", e => {
  const b = e.target.closest("[data-go]"); if (!b) return;
  const id = b.dataset.go;
  if (id === "new") { marquer("new"); return; }   // le lien ouvre la leçon
  $$(".blk").forEach(x => x.classList.toggle("actif", x.dataset.b === id));
  ({ rev: () => revisions(plan.rev), lec: () => lecons(plan.lec), ex: () => exercices(plan.ex), fin: bilan })[id]();
  zone.scrollIntoView({ behavior: "smooth", block: "start" });
});
function marquer(id) { if (!etat.faits.includes(id)) etat.faits.push(id); sauverEtat(); }
function finBloc(id, box) {
  marquer(id);
  const ordreBlocs = ["rev", "lec", "ex", "new", "fin"];
  dessinerPlan();
  const suiv = ordreBlocs.slice(ordreBlocs.indexOf(id) + 1).find(b => !etat.faits.includes(b) && !$(`.blk[data-b="${b}"]`).classList.contains("vide"));
  if (box && suiv) {
    const btn = h("button", { class: "pill small", type: "button" }, "étape suivante →");
    btn.addEventListener("click", () => { const t = $(`.blk[data-b="${suiv}"] [data-go]`); t && t.click(); });
    box.appendChild(h("div", { class: "pl-act" })).appendChild(btn);
  }
  tableau();
}
function nouveauLecteur() { zone.innerHTML = ""; const box = h("div", { class: "player" }); zone.appendChild(box); return box; }

/* ================= 1. rappel espacé : questions de quiz + fiches, mélangées ================= */
function revisions(items) {
  const box = nouveauLecteur();
  const file = items.slice(), reposes = new Set();
  let n = 0, ok = 0;
  const entete = tag => `<div class="pl-top"><span class="tag">${esc(tag)}</span><span class="tag soft">${n} / ${n + file.length}</span>${ok ? `<span class="pl-score">✓ ${ok}</span>` : ""}</div>`;
  async function suivant() {
    if (!file.length) return fin();
    const it = file.shift(); n++;
    if (it.type === "q") {
      let q = null; try { q = await M.question(it.cle, it.s.p); } catch (e) { q = null; }
      if (!q) { n--; return suivant(); }
      return question(it, q);
    }
    fiche(it);
  }
  function question(it, q) {
    box.innerHTML = entete(q.lecon.titre) + `<div class="pl-enonce">${q.texte}</div>
      <div class="qlike"><div class="opts">${q.opts.map(o => `<label><input type="${q.multi ? "checkbox" : "radio"}" name="rv" value="${esc(o.v)}"> <span>${o.t}</span></label>`).join("")}</div></div>
      <div class="pl-conf"></div><div class="pl-act"><button class="pill small" type="button" data-v>vérifier</button></div><div class="pl-fb" hidden></div>`;
    const conf = M.boutonsConfiance(); $(".pl-conf", box).appendChild(conf.el);
    K.renderMath(box);
    $("[data-v]", box).addEventListener("click", () => {
      const chosen = $$("input:checked", box).map(x => x.value);
      if (!chosen.length) { toast("choisis une réponse 😉"); return; }
      const good = q.a, juste = chosen.length === good.length && chosen.every(v => good.includes(v));
      $$(".qlike label", box).forEach(l => { const v = $("input", l).value; l.classList.toggle("right", good.includes(v)); l.classList.toggle("wrong", chosen.includes(v) && !good.includes(v)); });
      $$("input, .conf button", box).forEach(x => x.disabled = true); $("[data-v]", box).remove();
      const s = M.noterQuestion(it.cle, it.s.p, juste, conf.value);
      if (juste) ok++; else if (!reposes.has(it.cle)) { reposes.add(it.cle); file.splice(Math.min(file.length, 3), 0, { ...it, s }); }
      const fb = $(".pl-fb", box); fb.hidden = false;
      fb.innerHTML = `<p class="pl-verdict ${juste ? "ok" : "ko"}">${juste ? "juste ✓" : "raté ✗"} <span class="small">${juste ? "elle revient " + M.quand(s.n) : "elle revient dans quelques questions"}</span></p>
        ${!juste && conf.value === 2 ? `<p class="flag">⚡ erreur « sûre » : lis l'explication, puis redis-la avec tes mots.</p>` : ""}
        ${q.explain ? `<p class="small">${q.explain}</p>` : ""}<p class="small"><a href="${K.ROOT + q.lecon.id}.html">revoir la leçon</a></p>
        <div class="pl-act"><button class="pill small" type="button" data-n>${file.length ? "suivant →" : "terminer"}</button></div>`;
      K.renderMath(fb);
      $("[data-n]", fb).addEventListener("click", suivant); $("[data-n]", fb).focus({ preventScroll: true });
    });
  }
  function fiche(it) {
    const f = it.f;
    box.innerHTML = entete("fiche · " + nomMod(f.m) + (it.neuve ? " · nouvelle" : "")) + `<div class="fiche-face">${f.q}</div>
      <div class="pl-act"><button class="pill small" type="button" data-r>voir la réponse</button><span class="small">réponds d'abord dans ta tête, ou à voix haute</span></div><div class="pl-fb" hidden></div>`;
    K.renderMath(box);
    $("[data-r]", box).addEventListener("click", () => {
      $("[data-r]", box).parentElement.remove();
      const fb = $(".pl-fb", box); fb.hidden = false;
      fb.innerHTML = `<div class="fiche-face" style="background:#fff">${f.r}</div><p class="small">Honnêtement, tu l'avais ?</p>
        <div class="pl-act"><button class="pill small ghost" type="button" data-g="0">raté</button><button class="pill small ghost" type="button" data-g="1">à moitié</button><button class="pill small" type="button" data-g="2">je savais ✓</button></div>`;
      K.renderMath(fb);
      fb.addEventListener("click", e => {
        const b = e.target.closest("[data-g]"); if (!b || fb.dataset.fait) return; fb.dataset.fait = "1";
        const g = +b.dataset.g, st = store.get("fiches:etat", {}), cur = (st[f.id] && st[f.id].b) || 1;
        const bx = g === 2 ? Math.min(7, cur + 1) : g === 1 ? Math.max(2, cur - 1) : 1;
        st[f.id] = { b: bx, n: Date.now() + DELAI_F[bx] * M.JOUR - (bx === 1 ? 0 : 3600000) };
        store.set("fiches:etat", st); K.act("f");
        if (g === 2) ok++; else if (g === 0 && !reposes.has(f.id)) { reposes.add(f.id); file.splice(Math.min(file.length, 3), 0, { ...it, neuve: false }); }
        suivant();
      });
    });
  }
  function fin() {
    box.innerHTML = `<div class="pl-top"><span class="tag">rappel espacé terminé</span></div><h3>${ok} / ${n} retrouvé${ok > 1 ? "s" : ""} du premier coup ou au rattrapage</h3>
      <p class="small">Ce qui a résisté reviendra vite ; ce qui était solide s'éloigne. Chercher dans ta mémoire, même en échouant, l'a renforcée.</p>`;
    finBloc("rev", box);
  }
  suivant();
}

/* ================= 2. rappel de leçon ================= */
function lecons(ids) {
  const box = nouveauLecteur();
  let i = 0;
  async function suivante() {
    if (i >= ids.length) {
      box.innerHTML = `<div class="pl-top"><span class="tag">rappel de leçon terminé</span></div><h3>${ids.length} leçon${ids.length > 1 ? "s" : ""} réactivée${ids.length > 1 ? "s" : ""}</h3><p class="small">Chaque rappel réussi éloigne le suivant : 1, 3, 7, 16, 35 puis 90 jours. Trois rappels réussis sur trois jours différents = leçon « maîtrisée ».</p>`;
      return finBloc("lec", box);
    }
    const id = ids[i++];
    let L; try { L = await M.lecon(id); } catch (e) { return suivante(); }
    const points = L.retiens.length ? L.retiens : L.objectifs;
    let aide = false;
    box.innerHTML = `<div class="pl-top"><span class="tag">rappel de leçon</span><span class="tag soft">${i} / ${ids.length}</span></div>
      <h3>${esc(L.titre)}</h3>
      <p>Sans ouvrir la leçon : écris tout ce dont tu te souviens — idées, formules, ordres de grandeur, pièges. Même flou, même incomplet.</p>
      <textarea class="lined" aria-label="mon rappel de la leçon" placeholder="tout ce qui me revient…"></textarea>
      <div class="pl-act"><button class="pill small ghost" type="button" data-ind>un indice : ce que la leçon voulait m'apprendre</button><button class="pill small" type="button" data-cmp>comparer avec l'essentiel →</button></div>
      <div class="rv-cue" hidden><p class="small">Les objectifs de la leçon (l'indice compte comme une aide : la prochaine révision viendra plus tôt) :</p><ul>${L.objectifs.map(o => `<li>${o}</li>`).join("")}</ul></div>
      <div class="rp-check" hidden></div>`;
    K.renderMath(box);
    const ta = $("textarea", box);
    setTimeout(() => ta.focus({ preventScroll: true }), 40);
    $("[data-ind]", box).addEventListener("click", e => { aide = true; $(".rv-cue", box).hidden = false; e.target.disabled = true; });
    $("[data-cmp]", box).addEventListener("click", e => {
      if (ta.value.trim().length < 12) { toast("écris au moins deux ou trois idées 😉"); ta.focus(); return; }
      e.target.disabled = true; ta.readOnly = true;
      const chk = $(".rp-check", box); chk.hidden = false;
      chk.innerHTML = `<p class="small">Coche chaque point retrouvé, même dit autrement :</p><ul class="rp-points">${points.map(p => `<li><label><input type="checkbox"><span>${p}</span></label></li>`).join("")}</ul>
        <div class="pl-act"><button class="pill small" type="button" data-val>valider</button><span class="small" data-sc>0 / ${points.length}</span></div>`;
      K.renderMath(chk);
      chk.addEventListener("change", () => { $("[data-sc]", chk).textContent = `${$$("input:checked", chk).length} / ${points.length}`; });
      $("[data-val]", chk).addEventListener("click", ev => {
        ev.target.disabled = true; $$("input", chk).forEach(x => x.disabled = true);
        let score = points.length ? $$("input:checked", chk).length / points.length : 0;
        if (aide) score = Math.min(score, 0.79);
        const s = M.noterLecon(id, score);
        const hist = store.get("rap:" + id, []); hist.push({ t: Date.now(), txt: ta.value.trim(), s: Math.round(score * 100) / 100 }); store.set("rap:" + id, hist.slice(-6));
        chk.insertAdjacentHTML("beforeend", `<p><span class="hand sm">${Math.round(score * 100)} %</span> prochain rappel : <strong>${M.quand(s.n)}</strong>${s.maitrise ? " · <strong>leçon maîtrisée ✓</strong>" : ""}. ${score < 0.8 ? `Relis maintenant les points non cochés — <a href="${K.ROOT + id}.html">dans la leçon</a> si besoin.` : ""}</p>
          <div class="pl-act"><button class="pill small" type="button" data-next>${i < ids.length ? "leçon suivante →" : "terminer"}</button></div>`);
        $("[data-next]", chk).addEventListener("click", suivante);
      });
    });
  }
  suivante();
}

/* ================= 3. entraînement mélangé ================= */
function exercices(file) {
  zone.innerHTML = "";
  const wrap = h("div"); zone.appendChild(wrap);
  mountPlayer(wrap, { file, mode: "melange", onFin: (stats, box) => finBloc("ex", box) });
}

/* ================= 5. bilan ================= */
function bilan() {
  const box = nouveauLecteur();
  box.innerHTML = `<div class="pl-top"><span class="tag">bilan</span><span class="tag soft">2 min</span></div><h3>trois lignes pour finir</h3>
    <p class="small">Nommer ce qui reste flou, c'est déjà savoir quoi faire demain (<a href="methode.html#metacognition">métacognition</a>).</p>
    <label class="field">ce que j'ai compris aujourd'hui<textarea data-a style="min-height:70px"></textarea></label>
    <label class="field">ce qui reste flou (à revoir, ou à demander à quelqu'un)<textarea data-b style="min-height:70px"></textarea></label>
    <label class="field">demain, je commence par…<textarea data-d style="min-height:60px"></textarea></label>
    <div class="pl-act"><button class="pill" type="button" data-s>enregistrer dans mon journal ✓</button></div>`;
  $("[data-s]", box).addEventListener("click", () => {
    const a = $("[data-a]", box).value.trim(), b = $("[data-b]", box).value.trim(), d = $("[data-d]", box).value.trim();
    if (!a && !b && !d) { toast("une ligne suffit, mais il en faut une 😉"); return; }
    const j = store.get("journal", []);
    j.push({ t: Date.now(), title: "séance du " + new Date().toLocaleDateString("fr-FR"), cat: "cours", text: [a && "compris : " + a, b && "flou : " + b, d && "demain : " + d].filter(Boolean).join("\n") });
    store.set("journal", j); K.act("s");
    box.innerHTML = `<div class="pl-top"><span class="tag">séance terminée</span></div><h3>à demain ✓</h3><p class="small">Ton bilan est dans <a href="carnet.html#journal">ton journal de bord</a>. La meilleure séance, c'est celle de demain : même 10 minutes.</p>`;
    finBloc("fin", null);
  });
}

/* ================= tableau de bord ================= */
function tableau() {
  const act = store.get("act", {});
  const somme = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const auj = new Date(); auj.setHours(0, 0, 0, 0);
  const dow = (auj.getDay() + 6) % 7;
  const debut = new Date(auj); debut.setDate(auj.getDate() - dow - 7 * 15);
  let cells = "", joursActifs = 0;
  for (let i = 0; i < 16 * 7; i++) {
    const d = new Date(debut); d.setDate(debut.getDate() + i);
    if (d > auj) { cells += `<i style="visibility:hidden"></i>`; continue; }
    const n = somme(act[K.cleJour(d.getTime())]); if (n) joursActifs++;
    const l = !n ? 0 : n < 5 ? 1 : n < 15 ? 2 : n < 30 ? 3 : 4;
    cells += `<i data-l="${l}"${+d === +auj ? ' class="today"' : ""} title="${d.toLocaleDateString("fr-FR")} : ${n} action${n > 1 ? "s" : ""}"></i>`;
  }
  const pv = M.prevision(7), tot = pv.map(x => x.q + x.l + x.e + x.f), mx = Math.max(1, ...tot);
  const noms = tot.map((_, i) => { if (i === 0) return "auj."; if (i === 1) return "dem."; const d = new Date(auj); d.setDate(auj.getDate() + i); return d.toLocaleDateString("fr-FR", { weekday: "short" }); });
  const cb = M.calibration();
  const cible = { 2: 90, 1: 60, 0: 35 };
  const lignesCal = cb.map(c => { const pct = c.n ? Math.round(100 * c.ok / c.n) : 0; return `<div class="row"><span>« ${M.CONF[c.conf]} »</span><span class="track" title="attendu ≈ ${cible[c.conf]} %"><i style="width:${pct}%"></i><u style="left:${cible[c.conf]}%"></u></span><span>${c.n ? pct + " %" : "—"}<span class="small"> (${c.n})</span></span></div>`; }).join("");
  const sur = cb.find(c => c.conf === 2), hasard = cb.find(c => c.conf === 0);
  let conseil = "Indique ta confiance à chaque question : après une vingtaine de réponses, tu verras si « sûr » veut vraiment dire « juste ».";
  if (sur.n >= 10 && sur.ok / sur.n < 0.8) conseil = `Attention à la surconfiance : quand tu dis « sûr », tu as raison ${Math.round(100 * sur.ok / sur.n)} % du temps. Avant de répondre, demande-toi « comment je le sais ? ».`;
  else if (sur.n >= 10 && hasard.n >= 5 && hasard.ok / hasard.n > 0.7) conseil = "Tu te sous-estimes : tes réponses « au hasard » sont souvent justes. Ose dire « hésitant » ou « sûr ».";
  else if (sur.n >= 10) conseil = "Bien calibré : ton « sûr » est fiable. Garde ce réflexe, c'est celui d'un bon technicien.";
  const nQ = M.toutesLesQuestions().length, nL = M.toutesLesLecons().length, nE = M.tousLesExos().filter(x => (x.s.m || 0) >= 4).length;
  const nF = Object.keys(store.get("fiches:etat", {})).length;
  $('[data-c="dash"]').innerHTML = `
    <div class="mini-card"><h5>ma régularité · 16 semaines</h5><div class="stats"><div class="stat"><b>${M.serie()}</b><span>jour${M.serie() > 1 ? "s" : ""} d'affilée</span></div><div class="stat"><b>${joursActifs}</b><span>jours actifs</span></div></div>
      <div class="heat" role="img" aria-label="activité des 16 dernières semaines">${cells}</div><p class="small" style="margin-top:8px">Chaque case est un jour (lundi en haut). Plus c'est foncé, plus tu as révisé.</p></div>
    <div class="mini-card"><h5>révisions prévues · 7 jours</h5><div class="bars">${tot.map((t, i) => `<div class="bar"><span class="v" style="height:${Math.round(100 * t / mx)}%"></span><b>${t}</b><span>${noms[i]}</span></div>`).join("")}</div>
      <p class="small" style="margin-top:8px">Questions, fiches, leçons et exercices qui arrivent à échéance. Le nombre baisse quand ce que tu sais s'espace.</p></div>
    <div class="mini-card"><h5>ma calibration</h5><p class="small">Pour chaque niveau de confiance, la part de réponses justes (trait orange : ce qu'on attend).</p><div class="calib">${lignesCal}</div><p class="small" style="margin-top:10px">${conseil}</p></div>
    <div class="mini-card"><h5>ce que ma mémoire entretient</h5><div class="stats"><div class="stat"><b>${nQ}</b><span>questions en rotation</span></div><div class="stat"><b>${nL}</b><span>leçons en réapprentissage</span></div><div class="stat"><b>${nE}</b><span>exercices maîtrisés</span></div><div class="stat"><b>${nF}</b><span>fiches suivies</span></div></div></div>`;
}

/* ================= temps disponible ================= */
const chips = $('[data-c="minutes"]');
chips.innerHTML = MINUTES.map(m => `<button type="button" data-m="${m}" aria-pressed="${m === pref.min}">${m}</button>`).join("");
chips.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  pref.min = +b.dataset.m; store.set("pref:seance", pref);
  $$("button", chips).forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.m === pref.min)));
  dessinerPlan();
});

if (!Object.keys(store.get("act", {})).length && !K.allPages.some(p => K.getStatus(p.id))) {
  $('[data-c="plan"]').insertAdjacentHTML("beforebegin", `<div class="box astuce" style="max-width:840px;margin:14px 0"><p class="box-title">première séance ?</p><p>Lis d'abord <a href="methode.html">la méthode</a> (15 min) : elle explique pourquoi chaque étape est là. Puis ouvre ta première leçon ci-dessous : à partir de demain, les révisions arriveront toutes seules.</p></div>`);
}
dessinerPlan(); tableau();
