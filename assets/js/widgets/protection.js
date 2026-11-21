// Mise sous tension / hors tension d'un driver : effet du démarrage progressif, du relais de court-circuit et de la diode antiparallèle
import { C, canvas, Plot, controls, toggle, buttons, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { soft: false, relay: false, anti: false, limit: false, eeprom: true };
  const ci = canvas(el, { height: 220 });
  const cvv = canvas(el, { height: 170 });
  const ctl = controls(el);
  toggle(ctl, { label: "DAC qui démarre sur une valeur parasite (EEPROM)", value: true, oninput: v => { st.eeprom = v; draw(); } });
  toggle(ctl, { label: "démarrage progressif (RC sur la consigne)", value: false, oninput: v => { st.soft = v; draw(); } });
  toggle(ctl, { label: "relais de court-circuit (ouvert après 150 ms)", value: false, oninput: v => { st.relay = v; draw(); } });
  toggle(ctl, { label: "limite de courant matérielle (diviseur)", value: false, oninput: v => { st.limit = v; draw(); } });
  toggle(ctl, { label: "diode Schottky antiparallèle", value: false, oninput: v => { st.anti = v; draw(); } });
  const ro = readouts(el, [["pk", "courant crête"], ["rv", "tension inverse crête"], ["v", "verdict"]]);
  const nt = note(el, "");
  const IMAX = 60, ISET = 40;
  function current(t) { // ms
    if (t < 20) return 0;
    if (st.relay && t < 170) return 0;
    const t0 = st.relay ? 170 : 20;
    let target = ISET;
    let glitch = 0;
    if (st.eeprom && t - 20 < 60) glitch = 110 * Math.exp(-(t - 20) / 15);         // consigne parasite au boot
    if (!st.soft) glitch += 85 * Math.exp(-(t - t0) / 0.6) * (t >= t0 ? 1 : 0);  // dépassement de boucle (AOP saturé)
    let I = st.soft ? target * (1 - Math.exp(-(t - t0) / 40)) + (st.eeprom ? glitch * 0.25 : 0) : target + glitch;
    if (st.limit) I = Math.min(I, IMAX);
    if (t > 420) I = I * Math.exp(-(t - 420) / (st.soft ? 15 : 0.8));               // coupure
    return Math.max(0, I);
  }
  function vrev(t) { if (t < 420) return 0; const k = Math.exp(-(t - 420) / 2) * (t < 440 ? 1 : 0); const v = -(st.soft ? 0.6 : 5.5) * k * (1 - Math.exp(-(t - 420) / 0.3)); return st.anti ? Math.max(v, -0.35) : v; }
  function draw() {
    const xs = [], is = [], vs = []; let pk = 0, rv = 0;
    for (let t = 0; t <= 500; t += 0.1) { const i = current(t), v = vrev(t); xs.push(t); is.push(i); vs.push(v); pk = Math.max(pk, i); rv = Math.min(rv, v); }
    const p = new Plot(ci, { x0: 0, x1: 500, y0: 0, y1: Math.max(180, pk * 1.1), xlabel: "temps (ms)", ylabel: "courant (mA)" });
    ci.clear(); p.axes();
    p.hline(IMAX, { color: C.red, label: "courant max de la diode", dash: [5, 4] });
    p.line(xs, is, { color: C.orange, width: 2.4 });
    p.at(30, Math.max(180, pk * 1.1) * 0.92, "mise sous tension", { hand: true, color: C.cocoa, align: "left" }); p.at(430, Math.max(180, pk * 1.1) * 0.92, "coupure", { hand: true, color: C.cocoa, align: "left" });
    const q = new Plot(cvv, { x0: 400, x1: 470, y0: -6, y1: 1, xlabel: "temps (ms) — zoom sur la coupure", ylabel: "V inverse (V)" });
    cvv.clear(); q.axes(); q.hline(-2, { color: C.red, label: "tension inverse max (2 V)", dash: [5, 4] }); q.line(xs, vs, { color: C.sky, width: 2.4 });
    const dead = pk > IMAX * 1.05 || rv < -2;
    ro("pk", fmt(pk, 3) + " mA", pk > IMAX * 1.05); ro("rv", fmt(rv, 3) + " V", rv < -2); ro("v", dead ? "diode détruite" : "diode sauvée", dead);
    nt.textContent = dead ? (pk > IMAX * 1.05 ? "un pic de courant au démarrage suffit à griller les facettes (COD). Active les protections une par une." : "à la coupure, l'inductance du câble renvoie une tension inverse : au-delà de 2 V, la jonction claque.") : "chaque protection traite un risque : aucune ne suffit seule, c'est leur combinaison qui rend le driver sûr.";
  }
  ci.onresize = draw; cvv.onresize = draw; draw();
}
