// Courbes L-I-V d'une diode laser en fonction de la température (seuil T0, pente, roll-over, kink, λ)
import { C, canvas, Plot, controls, slider, toggle, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const D = { ith25: 20, T0: 70, eta25: 0.65, Vk: 1.85, Rs: 6, lam25: 650, dldt: 0.22, Imax: 60 };
  const st = { T: 25, kink: false, deriv: false };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 330) });
  const ctl = controls(el);
  slider(ctl, { label: "température de la puce", min: 5, max: 75, step: 0.5, value: st.T, unit: "°C", fmt: v => fmt(v, 3), oninput: v => { st.T = v; draw(); } });
  toggle(ctl, { label: "défaut : « kink » (changement de mode)", value: false, oninput: v => { st.kink = v; draw(); } });
  toggle(ctl, { label: "afficher dP/dI (dérivée)", value: false, oninput: v => { st.deriv = v; draw(); } });
  const ro = readouts(el, [["ith", "courant de seuil"], ["eta", "rendement différentiel"], ["p30", "P à 35 mA"], ["v", "tension à 35 mA"], ["wp", "rendement à la prise"], ["l", "longueur d'onde"]]);
  const nt = note(el, "");
  const ith = () => D.ith25 * Math.exp((st.T - 25) / D.T0);
  const eta = () => D.eta25 * (1 - 0.006 * (st.T - 25));
  function P(I) {
    const it = ith(); if (I <= it) return 0.02 * I / it;
    let p = eta() * (I - it) - 0.00045 * Math.max(0, st.T - 5) * (I - it) ** 2 * 0.5; // roll-over thermique
    if (st.kink && I > it + 14) p -= 0.18 * eta() * Math.min(6, I - it - 14);
    return Math.max(0, p + 0.02);
  }
  const V = I => D.Vk * (1 - 0.0012 * (st.T - 25)) + 0.026 * 1.6 * Math.log(1 + I / 0.002) * 0.12 + D.Rs * I / 1000;
  function draw() {
    const p = new Plot(cv, { x0: 0, x1: D.Imax, y0: 0, y1: 26, xlabel: "courant I (mA)", ylabel: "puissance P (mW)", y2: { y0: 0, y1: 3, label: "tension V (V)", color: C.sky } });
    cv.clear(); p.axes();
    p.fn(I => V(I), { color: C.sky, width: 2, axis: 2 });
    p.fn(P, { color: C.orange, width: 3, n: 600 });
    if (st.deriv) { const dp = I => (P(I + 0.2) - P(I - 0.2)) / 0.4 * 20; p.fn(dp, { color: C.ink, width: 1.4, dash: [4, 3], n: 600 }); p.legend([{ label: "P(I)", color: C.orange }, { label: "V(I)", color: C.sky }, { label: "dP/dI (× 20)", color: C.ink, dash: [4, 3] }], { left: true }); }
    else p.legend([{ label: "puissance P(I)", color: C.orange }, { label: "tension V(I)", color: C.sky }], { left: true });
    p.vline(ith(), { color: C.cocoa, label: "seuil", hand: true });
    const I0 = 35, P0 = P(I0), V0 = V(I0);
    p.points([I0], [P0], { r: 5 });
    ro("ith", fmt(ith(), 3) + " mA", ith() > 30); ro("eta", fmt(eta(), 3) + " W/A"); ro("p30", fmt(P0, 3) + " mW", P0 < 5); ro("v", fmt(V0, 3) + " V"); ro("wp", fmt(100 * P0 / (V0 * I0), 3) + " %"); ro("l", fmt(D.lam25 + D.dldt * (st.T - 25), 4) + " nm");
    nt.textContent = st.kink ? "un « kink » : la pente chute brusquement (changement de mode transverse ou longitudinal). Invisible à l'œil sur P(I), évident sur dP/dI : critère de rejet en production." : st.T > 50 ? "à chaud : seuil plus élevé, pente plus faible, courbure (roll-over) aux forts courants, λ décalée. D'où la régulation de température." : "à 25 °C, la diode respecte sa fiche technique. Chauffe-la pour voir le seuil s'envoler.";
  }
  cv.onresize = draw; draw();
}
