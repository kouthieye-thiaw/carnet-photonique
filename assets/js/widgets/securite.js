// Calculateur pédagogique : éclairement, EMP simplifiée, densité optique requise, DNRO (NOHD)
import { C, canvas, Plot, controls, slider, select, readouts, fmt, note } from "../lib.js";

const MPE = { "vis025": [25.4, "visible, exposition accidentelle 0,25 s (réflexe palpébral)"], "vis10": [10, "visible, regard prolongé 10 s"], "nir": [50, "1064 nm, 10 s (C_A = 5)"], "tel": [1000, "1550 nm, 10 s (absorbé avant la rétine)"] };
export default function (el) {
  const st = { P: 5, cas: "vis025", a: 1, phi: 1 };
  const cv = canvas(el, { height: 230 });
  const ctl = controls(el);
  slider(ctl, { label: "puissance du laser", min: 0.1, max: 5000, log: true, value: st.P, unit: "mW", fmt: v => fmt(v, 3), oninput: v => { st.P = v; draw(); } });
  select(ctl, { label: "longueur d'onde et durée d'exposition", value: st.cas, options: Object.entries(MPE).map(([k, v]) => [k, v[1]]), oninput: v => { st.cas = v; draw(); } });
  slider(ctl, { label: "diamètre du faisceau en sortie", min: 0.3, max: 10, step: 0.1, value: st.a, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.a = v; draw(); } });
  slider(ctl, { label: "divergence (angle total)", min: 0.1, max: 20, step: 0.1, value: st.phi, unit: "mrad", fmt: v => fmt(v, 3), oninput: v => { st.phi = v; draw(); } });
  const ro = readouts(el, [["E", "éclairement en sortie"], ["mpe", "EMP (simplifiée)"], ["od", "densité optique minimale"], ["nohd", "DNRO (distance de risque)"]]);
  const nt = note(el, "");
  function draw() {
    const P = st.P / 1000, mpe = MPE[st.cas][0], a = st.a / 1000, phi = st.phi / 1000;
    const E0 = 4 * P / (Math.PI * a * a), od = Math.log10(E0 / mpe), nohd = (Math.sqrt(4 * P / (Math.PI * mpe)) - a) / phi;
    const rmax = Math.max(10, Math.min(5000, nohd > 0 ? nohd * 1.6 : 10));
    const p = new Plot(cv, { x0: 0.1, x1: rmax, xlog: true, y0: Math.max(1e-3, mpe / 1000), y1: Math.max(E0 * 2, mpe * 10), ylog: true, xlabel: "distance (m)", ylabel: "éclairement (W/m²)" });
    cv.clear(); p.axes();
    p.fn(r => 4 * P / (Math.PI * (a + phi * r) ** 2), { color: C.red, width: 2.8 });
    p.hline(mpe, { color: C.green, label: "EMP", hand: true });
    if (nohd > 0 && nohd < rmax) p.vline(nohd, { color: C.cocoa, label: "DNRO ≈ " + (nohd > 1000 ? fmt(nohd / 1000, 3) + " km" : fmt(nohd, 3) + " m"), hand: true });
    ro("E", fmt(E0, 3) + " W/m²"); ro("mpe", fmt(mpe, 3) + " W/m²"); ro("od", od > 0 ? "DO " + fmt(Math.ceil(od * 10) / 10, 2) : "aucune", od > 0); ro("nohd", nohd > 0 ? (nohd > 1000 ? fmt(nohd / 1000, 3) + " km" : fmt(nohd, 3) + " m") : "0 m", nohd > 0);
    nt.textContent = "calcul pédagogique simplifié (faisceau « plat », EMP de référence). Pour un poste réel : norme IEC 60825-1, fiche du fabricant et ton référent sécurité laser.";
  }
  cv.onresize = draw; draw();
}
