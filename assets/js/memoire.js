/* memoire.js — le moteur de mémoire du carnet (module ES)
   · questions de quiz et exercices : répétition espacée pilotée par la réussite ET la confiance
   · leçons : réapprentissage successif (rappel libre à j+1, j+3, j+7, j+16, j+35, j+90)
   · calibration de la confiance (« sûr » doit vouloir dire « juste »)
   · lecture du contenu d'une leçon (questions, points à retenir) pour les révisions
   Tout est stocké dans le navigateur (préfixe cp1: via window.Carnet.store). */

const K = () => window.Carnet;
const S = () => K().store;

export const JOUR = 86400000;
export const ETAPES = [1, 3, 7, 16, 35, 90];              // jours entre deux rappels d'une leçon réussie
export const CONF = ["au hasard", "hésitant", "sûr"];      // 0, 1, 2

export const debutJour = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const cleJour = (t = Date.now()) => K().cleJour(t);
// une réussite repousse au début d'un jour futur ; un échec revient dans 15 minutes (et donc dans la séance suivante)
export const echeance = jours => jours <= 0 ? Date.now() + 15 * 60000 : debutJour(Date.now() + jours * JOUR);

export function quand(t) {
  if (t <= Date.now()) return "maintenant";
  const j = Math.round((debutJour(t) - debutJour()) / JOUR);
  if (j <= 0) return "dans la journée";
  if (j === 1) return "demain";
  if (j < 7) return `dans ${j} jours`;
  return "le " + new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/* intervalle suivant (en jours) : raté → 0 ; juste au hasard ou avec aide → 1 ;
   juste en hésitant → ×1,5 ; juste et sûr → ×2,5 (plafond 180 jours) */
export function intervalle(prec, ok, conf, aide = false) {
  prec = prec || 0;
  if (!ok) return 0;
  if (aide || conf === 0) return 1;
  if (conf === 1) return prec < 1 ? 1 : Math.min(180, Math.max(prec + 1, Math.round(prec * 1.5)));
  return prec < 1 ? 3 : Math.min(180, Math.max(prec + 2, Math.round(prec * 2.5)));
}

export const activite = (type, n = 1) => K().act(type, n);

/* ---------- calibration ---------- */
export function calibrer(ok, conf, src = "") {
  if (conf == null || conf < 0) return;
  const c = S().get("calib", []); c.push([Date.now(), ok ? 1 : 0, conf, src]);
  if (c.length > 1500) c.splice(0, c.length - 1500);
  S().set("calib", c);
}
export function calibration() {
  const c = S().get("calib", []);
  return [2, 1, 0].map(k => { const xs = c.filter(x => x[2] === k); return { conf: k, n: xs.length, ok: xs.filter(x => x[1]).length }; });
}

/* ---------- questions de quiz ---------- */
export function noterQuestion(cle, page, ok, conf) {
  const s = S().get("q:" + cle, { p: page, d: 0, h: [] });
  s.p = page; s.d = intervalle(s.d, ok, conf ?? 1); s.n = echeance(s.d);   // confiance non dite = « hésitant »
  s.h = (s.h || []).concat([[Date.now(), ok ? 1 : 0, conf ?? -1]]).slice(-10);
  S().set("q:" + cle, s); calibrer(ok, conf, "quiz"); activite("q");
  return s;
}

/* ---------- leçons : réapprentissage successif ---------- */
export function noterLecon(page, score) {
  const s = S().get("lec:" + page, { k: -1, h: [] });
  const k = s.k ?? -1;
  if (score >= 0.8) s.k = Math.min(ETAPES.length - 1, k + 1);
  else if (score >= 0.5) s.k = Math.max(0, k);
  else s.k = 0;
  s.n = echeance(ETAPES[s.k]);
  s.h = (s.h || []).concat([[Date.now(), Math.round(score * 100) / 100]]).slice(-12);
  // « maîtrisé » = trois rappels réussis (≥ 80 %) sur trois jours différents, le dernier compris
  const jours = new Set(s.h.filter(x => x[1] >= 0.8).map(x => cleJour(x[0])));
  if (score >= 0.8 && jours.size >= 3 && K().getStatus(page) !== "maitrise") { K().setStatus(page, "maitrise"); s.maitrise = Date.now(); }
  else if (K().getStatus(page) === "") K().setStatus(page, "lu");
  S().set("lec:" + page, s); activite("l");
  return s;
}

/* ---------- exercices (générateurs) ---------- */
export function etatExo(id) { return S().get("ex:" + id, { m: 0, d: 0, ok: 0, ko: 0, h: [] }); }
export function noterExo(id, ok, conf, aide = false) {
  const s = etatExo(id);
  if (ok) s.ok++; else s.ko++;
  // niveaux : 0 jamais vu · 1 exemple étudié · 2 exemple complété · 2+ seul ; ≥ 4 = maîtrisé (deux réussites seules d'affilée)
  if (ok && !aide) s.m = Math.max(2, s.m || 0) + 1; else if (!ok) s.m = 2;
  s.d = intervalle(s.d, ok, conf ?? 1, aide); s.n = echeance(s.d);
  s.h = (s.h || []).concat([[Date.now(), ok ? 1 : 0, conf ?? -1, aide ? 1 : 0]]).slice(-12);
  S().set("ex:" + id, s); calibrer(ok, conf, "exo"); activite("e");
  return s;
}
export function poserNiveau(id, m) { const s = etatExo(id); s.m = m; if (!s.n) s.n = Date.now(); S().set("ex:" + id, s); return s; }

/* ---------- listes « à réviser » ---------- */
const lire = p => S().keys(p).map(k => ({ cle: k.slice(p.length), s: S().get(k, null) })).filter(x => x.s);
export const questionsDues = (t = Date.now()) => lire("q:").filter(x => x.s.n <= t).sort((a, b) => a.s.n - b.s.n);
export const leconsDues = (t = Date.now()) => lire("lec:").filter(x => x.s.n <= t).sort((a, b) => a.s.n - b.s.n);
export const exosDus = (t = Date.now()) => lire("ex:").filter(x => x.s.m >= 2 && x.s.n <= t).sort((a, b) => a.s.n - b.s.n);
export const tousLesExos = () => lire("ex:");
export const toutesLesLecons = () => lire("lec:");
export const toutesLesQuestions = () => lire("q:");

/* prévision : nombre de révisions par jour sur les n prochains jours (index 0 = aujourd'hui, retards compris) */
export function prevision(n = 7) {
  const out = Array.from({ length: n }, () => ({ q: 0, l: 0, e: 0, f: 0 }));
  const d0 = debutJour();
  const add = (t, k) => { const j = Math.max(0, Math.floor((debutJour(t) - d0) / JOUR)); if (j < n) out[j][k]++; };
  lire("q:").forEach(x => add(x.s.n, "q"));
  lire("lec:").forEach(x => add(x.s.n, "l"));
  lire("ex:").filter(x => x.s.m >= 2).forEach(x => add(x.s.n, "e"));
  Object.values(S().get("fiches:etat", {})).forEach(s => s && s.n && add(s.n, "f"));
  return out;
}

/* série : jours consécutifs (jusqu'à aujourd'hui ou hier) avec une activité */
export function serie() {
  const a = S().get("act", {}); let n = 0; let t = Date.now();
  if (!a[cleJour(t)]) t -= JOUR;
  while (a[cleJour(t)]) { n++; t -= JOUR; }
  return n;
}

/* ---------- contenu d'une leçon ---------- */
const CACHE = new Map();
export function lecon(id) {
  if (!CACHE.has(id)) {
    CACHE.set(id, fetch(K().ROOT + id + ".html")
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(html => analyser(id, new DOMParser().parseFromString(html, "text/html"))));
    CACHE.get(id).catch(() => CACHE.delete(id));
  }
  return CACHE.get(id);
}
export function analyser(id, doc) {
  const inner = el => el ? el.innerHTML.trim() : "";
  const titre = ((doc.querySelector(".lesson-hero h1") || doc.querySelector("h1")) || {}).textContent || id;
  const retiens = Array.from(doc.querySelectorAll(".box.retiens li")).map(inner);
  const objectifs = Array.from(doc.querySelectorAll(".objectives li")).map(inner);
  const quiz = Array.from(doc.querySelectorAll(".quiz")).map((qz, qi) => ({
    id: qz.dataset.quiz || (id + ":" + qi),
    qs: Array.from(qz.querySelectorAll(".q")).map(q => ({
      a: (q.dataset.a || "").split(",").map(s => s.trim()).filter(Boolean),
      texte: inner(q.querySelector(":scope > p")).replace(/^\s*\d+\s*\.\s*/, ""),
      multi: !!q.querySelector("input[type=checkbox]"),
      opts: Array.from(q.querySelectorAll("label")).map(l => { const c = l.cloneNode(true); const i = c.querySelector("input"); const v = i ? i.value : ""; if (i) i.remove(); return { v, t: c.innerHTML.trim() }; }),
      explain: inner(q.querySelector(".explain"))
    }))
  }));
  return { id, titre: titre.trim(), retiens, objectifs, quiz };
}
/* retrouve une question à partir de sa clé « quiz#index » et de sa page */
export async function question(cle, page) {
  const L = await lecon(page);
  const [qid, i] = [cle.slice(0, cle.lastIndexOf("#")), +cle.slice(cle.lastIndexOf("#") + 1)];
  const qz = L.quiz.find(x => x.id === qid) || null;
  return qz && qz.qs[i] ? { ...qz.qs[i], lecon: L } : null;
}

/* ---------- petits utilitaires partagés ---------- */
export function melanger(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// boutons de confiance (renvoie un objet { el, value })
export function boutonsConfiance(onChange) {
  const el = document.createElement("div");
  el.className = "conf"; el.setAttribute("role", "group"); el.setAttribute("aria-label", "ma confiance dans cette réponse");
  el.innerHTML = `<span class="conf-k">ma confiance :</span>` + [2, 1, 0].map(v => `<button type="button" data-c="${v}" aria-pressed="false">${CONF[v]}</button>`).join("");
  const o = { el, value: null };
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    o.value = +b.dataset.c;
    el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    onChange && onChange(o.value);
  });
  o.reset = () => { o.value = null; el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); };
  return o;
}
