// Calculateur d'impulsions : énergie, puissance crête, rapport cyclique, intensité crête ; train d'impulsions dessiné
import { C, canvas, controls, slider, readouts, fmt, si, text, note } from "../lib.js";

export default function (el) {
  const st = { Pm: 10, f: 100e3, tau: 10e-9, d: 50 };
  const cv = canvas(el, { height: 190 });
  const ctl = controls(el);
  slider(ctl, { label: "puissance moyenne", min: 0.001, max: 1000, log: true, value: st.Pm, fmt: v => si(v, "W", 3), oninput: v => { st.Pm = v; draw(); } });
  slider(ctl, { label: "cadence (taux de répétition)", min: 1, max: 1e9, log: true, value: st.f, fmt: v => si(v, "Hz", 3), oninput: v => { st.f = v; draw(); } });
  slider(ctl, { label: "durée d'impulsion (largeur à mi-hauteur)", min: 1e-14, max: 1e-4, log: true, value: st.tau, fmt: v => si(v, "s", 3), oninput: v => { st.tau = v; draw(); } });
  slider(ctl, { label: "diamètre de la tache focalisée", min: 5, max: 2000, log: true, value: st.d, unit: "µm", fmt: v => fmt(v, 3), oninput: v => { st.d = v; draw(); } });
  const ro = readouts(el, [["E", "énergie par impulsion"], ["Pc", "puissance crête"], ["rc", "rapport cyclique"], ["F", "fluence"], ["I", "intensité crête"]]);
  const nt = note(el, "");
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const E = st.Pm / st.f, Pc = 0.94 * E / st.tau, duty = st.tau * st.f;
    if (duty >= 1) { ro("E", "—"); ro("Pc", "impossible", true); ro("rc", fmt(duty, 3), true); nt.textContent = "durée × cadence ≥ 1 : les impulsions se chevauchent, c'est un laser continu !"; }
    const A = Math.PI * (st.d * 1e-4 / 2) ** 2; // cm²
    // dessin : 4 périodes, impulsions élargies pour être visibles
    const x0 = 30, x1 = w - 20, yb = h - 40, T = (x1 - x0) / 4;
    c.strokeStyle = C.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x0, yb); c.lineTo(x1, yb); c.stroke();
    const vis = Math.max(2, Math.min(T * 0.8, T * duty));
    for (let k = 0; k < 4; k++) { const xc = x0 + T * (k + 0.5); c.fillStyle = "rgba(226,55,43,.85)"; c.beginPath(); c.moveTo(xc - vis / 2 - 2, yb); for (let s = -1; s <= 1; s += 0.05) { const x = xc + s * vis; c.lineTo(x, yb - (yb - 26) * Math.exp(-4 * Math.log(2) * s * s * 4)); } c.lineTo(xc + vis + 2, yb); c.fill(); }
    c.setLineDash([4, 4]); c.strokeStyle = C.sky; const ym = yb - (yb - 26) * Math.min(1, duty * 1.5 + 0.02); c.beginPath(); c.moveTo(x0, ym); c.lineTo(x1, ym); c.stroke(); c.setLineDash([]);
    text(c, x1, ym - 10, "puissance moyenne", { align: "right", size: 12, color: C.sky });
    text(c, x0 + T * 1.5, 16, "période 1/f = " + si(1 / st.f, "s", 3), { hand: true, size: 20, color: C.cocoa });
    text(c, x0 + T * 0.5, yb + 18, "durée τ = " + si(st.tau, "s", 3) + " (dessin dilaté)", { size: 11.5, color: C.soft });
    if (duty < 1) {
      ro("E", si(E, "J", 3)); ro("Pc", si(Pc, "W", 3)); ro("rc", fmt(duty, 3), false); ro("F", si(E / A, "J/cm²", 3)); ro("I", si(Pc / A, "W/cm²", 3), Pc / A > 1e9);
      nt.textContent = Pc / st.Pm > 1e5 ? `la puissance crête est ${fmt(Pc / st.Pm, 3)} fois la puissance moyenne : c'est elle qui ablate la matière… et qui abîme les optiques.` : "en continu ou quasi-continu, crête ≈ moyenne.";
    }
  }
  cv.onresize = draw; draw();
}
