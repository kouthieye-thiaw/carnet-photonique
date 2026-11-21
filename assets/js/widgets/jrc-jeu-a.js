// SAÉ 5 — le jeu A, jouable : la même logique que AlgorithmeJeuA() de la carte
// (bon bouton, mauvais bouton, anti-rebond de 20 ms, limite de 2 s, trame R en plein jeu, réponses V1/V2).
import { controls, select, toggle, buttons, readouts, note } from "../lib.js";
import { COULEURS } from "./jrc-trame.js";

const DUREE_MAX = 2000, ANTI_REBOND = 20;

export default function (el) {
  const st = { n: 3, c1: 1, c2: 4, son: false };
  const jeu = { enCours: false, t0: 0, phase: "", err: 0, tBon: 0, dernier: 0, inc: 0, raf: 0, deb: 0 };
  const presses = new Set();

  const carte = document.createElement("div");
  carte.className = "jrc-carte"; carte.tabIndex = 0;
  carte.setAttribute("aria-label", "carte JRC simulée : boutons 1 à 4, touches 1 à 4 du clavier");
  carte.innerHTML = `<div class="jrc-haut"><span class="jrc-etat on"></span><span class="jrc-lbl">prêt</span><span class="jrc-buzz"></span><span class="jrc-chrono">0 ms</span></div>
    <div class="jrc-postes">${[1, 2, 3, 4].map(i => `<div class="jrc-poste"><span class="jrc-led" data-i="${i}"></span><button type="button" class="jrc-btn" data-b="${i}" aria-label="bouton ${i}">${i}</button></div>`).join("")}</div>
    <ol class="jrc-log" aria-live="polite"></ol>`;
  el.appendChild(carte);
  const $ = s => carte.querySelector(s), $$ = s => [...carte.querySelectorAll(s)];
  const log = $(".jrc-log");

  const ctl = controls(el);
  select(ctl, { label: "bouton à appuyer (n)", options: [1, 2, 3, 4].map(v => [v, String(v)]), value: st.n, oninput: v => { st.n = +v; trameTxt(); } });
  select(ctl, { label: "couleur de sa LED (c1)", options: COULEURS.map((c, i) => [i, `${i} · ${c.n}`]), value: st.c1, oninput: v => { st.c1 = +v; trameTxt(); } });
  select(ctl, { label: "couleur des autres (c2)", options: COULEURS.map((c, i) => [i, `${i} · ${c.n}`]), value: st.c2, oninput: v => { st.c2 = +v; trameTxt(); } });
  toggle(ctl, { label: "son du buzzer", value: false, oninput: v => { st.son = v; if (!v) son(0); } });
  const [bA] = buttons(el, [["envoyer A314", lancer, "is-on"], ["envoyer R", () => { ecrire("PC → R"); reset(); }], ["V1 : dernier temps ?", () => repondre(1)], ["V2 : erreurs ?", () => repondre(2)]]);
  const ro = readouts(el, [["t", "dernier_temps (ms)"], ["e", "nb_appui_incorrect"], ["rep", "dernière réponse au PC"]]);
  const nt = note(el, "Envoie la trame, puis appuie sur le bouton dont la LED a la couleur c1 — clic ou touches 1 à 4. Essaie aussi de te tromper, ou d'attendre plus de 2 s.");
  const trameTxt = () => { bA.textContent = `envoyer A${st.n}${st.c1}${st.c2}`; };
  trameTxt(); maj();

  /* ---- sorties de la carte ---- */
  function leds(v) { $$(".jrc-led").forEach((l, i) => { const c = v[i]; l.style.setProperty("--c", COULEURS[c].c); l.dataset.on = c ? "1" : "0"; }); }
  function etat(on) { $(".jrc-etat").classList.toggle("on", on); $(".jrc-lbl").textContent = on ? "prêt" : "occupé"; }
  let ctx = null, osc = null;
  function son(f) {
    $(".jrc-buzz").textContent = f ? `♪ ${f} Hz` : "";
    $(".jrc-buzz").dataset.f = f || "";
    if (!st.son || !f) { if (osc) { osc.stop(); osc = null; } return; }
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (osc) osc.stop();
      osc = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0.035;
      osc.type = "square"; osc.frequency.value = f; osc.connect(g).connect(ctx.destination); osc.start();
    } catch (e) { /* pas de son disponible : l'indicateur visuel suffit */ }
  }
  function ecrire(t) { const li = document.createElement("li"); li.textContent = t; log.appendChild(li); log.scrollTop = log.scrollHeight; }
  function maj() { ro("t", String(jeu.dernier)); ro("e", String(jeu.inc)); }
  const ms = () => Math.round(performance.now() - jeu.t0);

  /* ---- la trame A et le jeu ---- */
  function lancer() {
    if (jeu.enCours) { ecrire("carte occupée : la nouvelle trame attendra la fin du jeu"); return; }
    log.innerHTML = "";
    ecrire(`PC → A${st.n}${st.c1}${st.c2}  ·  AlgorithmeJeuA(${st.n}, ${st.c1}, ${st.c2})`);
    etat(false); jeu.inc = 0; maj();
    leds([1, 2, 3, 4].map(k => k === st.n ? st.c1 : st.c2));
    jeu.enCours = true; jeu.phase = "attente"; jeu.t0 = performance.now();
    carte.focus({ preventScroll: true });
    if (st.c1 === st.c2) ecrire("attention : c1 = c2, le joueur ne peut pas voir quelle LED viser");
    boucle();
  }
  function boucle() {
    cancelAnimationFrame(jeu.raf);
    const tick = () => {
      if (!jeu.enCours) return;
      const t = ms();
      $(".jrc-chrono").textContent = (jeu.phase === "bon" ? jeu.tBon : Math.min(t, DUREE_MAX)) + " ms";
      if ((jeu.phase === "attente" || jeu.phase === "erreur") && t >= DUREE_MAX) {
        if (jeu.phase === "erreur") son(0);
        ecrire(`${DUREE_MAX} ms : temps dépassé, le temps est figé à ${DUREE_MAX} ms`);
        return fin(DUREE_MAX);
      }
      jeu.raf = requestAnimationFrame(tick);
    };
    jeu.raf = requestAnimationFrame(tick);
  }
  // une « itération » de la boucle while(true) du jeu : bon bouton ? sinon mauvais bouton ?
  function examiner() {
    if (!jeu.enCours || jeu.phase !== "attente") return;
    const t = ms();
    if (t >= DUREE_MAX) return;
    if (presses.has(st.n)) { jeu.phase = "bon"; jeu.tBon = t; son(880); ecrire(`${t} ms : bouton ${st.n} — le bon ! buzzer 880 Hz jusqu'au relâchement`); return; }
    for (let b = 1; b <= 4; b++) if (b !== st.n && presses.has(b)) {
      jeu.inc++; maj(); jeu.phase = "erreur"; jeu.err = b; son(110);
      ecrire(`${t} ms : bouton ${b} — mauvais (nb_appui_incorrect = ${jeu.inc}), buzzer 110 Hz`);
      return;
    }
  }
  function appui(b) {
    if (presses.has(b)) return;
    presses.add(b); carte.querySelector(`.jrc-btn[data-b="${b}"]`).classList.add("enfonce");
    clearTimeout(jeu.deb);
    if (!jeu.enCours) { ecrire(`bouton ${b} appuyé hors jeu : ignoré (la carte attend une trame)`); return; }
    examiner();
  }
  function relache(b) {
    if (!presses.has(b)) return;
    presses.delete(b); carte.querySelector(`.jrc-btn[data-b="${b}"]`).classList.remove("enfonce");
    if (!jeu.enCours) return;
    const attendu = jeu.phase === "bon" ? st.n : jeu.phase === "erreur" ? jeu.err : 0;
    if (b !== attendu) return;
    // anti-rebond : relâché seulement après 20 ms sans contact
    jeu.deb = setTimeout(() => {
      if (presses.has(b) || !jeu.enCours) return;
      son(0);
      if (jeu.phase === "bon") { ecrire(`bouton ${b} relâché : fin du jeu`); fin(jeu.tBon); }
      else { jeu.phase = "attente"; examiner(); }
    }, ANTI_REBOND);
  }
  function fin(t) {
    jeu.enCours = false; cancelAnimationFrame(jeu.raf); son(0);
    jeu.dernier = t; maj();
    leds([0, 0, 0, 0]); etat(true);
    $(".jrc-chrono").textContent = t + " ms";
    ecrire(`dernier_temps = ${t} ms · LEDs de jeu éteintes · LED d'état verte`);
    nt.textContent = t >= DUREE_MAX ? "Temps dépassé : la carte a figé le temps à 2000 ms. Demande V1 pour le lire, comme le ferait le PC." : `Temps de réaction : ${t} ms${jeu.inc ? `, avec ${jeu.inc} erreur${jeu.inc > 1 ? "s" : ""}` : ""}. Le jeu ne renvoie rien de lui-même : clique sur V1 et V2.`;
  }
  function reset() {
    jeu.enCours = false; cancelAnimationFrame(jeu.raf); clearTimeout(jeu.deb); son(0);
    jeu.dernier = 0; jeu.inc = 0; maj(); leds([0, 0, 0, 0]); etat(true); $(".jrc-chrono").textContent = "0 ms";
    ecrire("AlgorithmeReset() : jeu arrêté, LEDs éteintes, compteurs à 0, LED d'état verte");
    nt.textContent = "Reset : le jeu s'arrête net, les 4 variables du CDC repassent à 0 et la carte attend une nouvelle trame.";
  }
  function repondre(i) { const v = i === 1 ? jeu.dernier : jeu.inc; ecrire(`PC → V${i}  ·  carte → ${v}`); ro("rep", String(v)); }

  /* ---- entrées : souris, doigt, clavier ---- */
  carte.addEventListener("pointerdown", e => { const b = e.target.closest(".jrc-btn"); if (!b) return; e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); appui(+b.dataset.b); });
  const lacher = e => { const b = e.target.closest(".jrc-btn"); if (b) relache(+b.dataset.b); };
  carte.addEventListener("pointerup", lacher); carte.addEventListener("pointercancel", lacher);
  carte.addEventListener("keydown", e => { if (/^[1-4]$/.test(e.key)) { e.preventDefault(); if (!e.repeat) appui(+e.key); } });
  carte.addEventListener("keyup", e => { if (/^[1-4]$/.test(e.key)) relache(+e.key); });
  carte.addEventListener("blur", () => [...presses].forEach(relache));
  leds([0, 0, 0, 0]);
}
