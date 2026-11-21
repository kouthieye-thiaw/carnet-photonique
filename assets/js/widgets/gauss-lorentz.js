// Gaussienne vs lorentzienne (même largeur à mi-hauteur) + puissance transmise par un diaphragme
import { C, canvas, Plot, controls, slider, toggle, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { w: 1.0, r: 1.0, log: false };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 330) });
  const ctl = controls(el);
  slider(ctl, { label: "rayon du faisceau w (à 1/e²)", min: 0.3, max: 2, step: 0.01, value: st.w, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.w = v; draw(); } });
  slider(ctl, { label: "rayon du diaphragme r", min: 0, max: 3, step: 0.01, value: st.r, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.r = v; draw(); } });
  toggle(ctl, { label: "échelle logarithmique (voir les « ailes »)", value: false, oninput: v => { st.log = v; draw(); } });
  const ro = readouts(el, [["fwhm", "largeur à mi-hauteur"], ["d", "diamètre 1/e²"], ["frac", "puissance transmise"], ["perte", "perte du diaphragme"]]);
  const nt = note(el, "");
  function draw() {
    const w = st.w, fwhm = w * Math.sqrt(2 * Math.log(2)), g = fwhm / 2;
    const p = new Plot(cv, { x0: -3, x1: 3, y0: st.log ? 1e-4 : 0, y1: st.log ? 1.5 : 1.12, ylog: st.log, xlabel: "position x (mm)", ylabel: "intensité relative", nx: 7 });
    cv.clear(); p.axes();
    const G = x => Math.exp(-2 * x * x / (w * w)), L = x => (g * g) / (x * x + g * g);
    // zone du diaphragme
    p.clip(c => { c.fillStyle = "rgba(34,197,94,.10)"; c.fillRect(p.X(-st.r), p.T, p.X(st.r) - p.X(-st.r), p.B - p.T); });
    p.vline(-st.r, { color: C.green, dash: [4, 3] }); p.vline(st.r, { color: C.green, dash: [4, 3], label: "diaphragme", hand: true });
    p.fn(L, { color: C.sky, width: 2.4 });
    p.fn(G, { color: C.orange, width: 3 });
    if (!st.log) { p.hline(0.5, { color: C.mist, label: "mi-hauteur", dash: [2, 4] }); p.hline(Math.exp(-2), { color: C.mist, label: "1/e² ≈ 13,5 %", dash: [2, 4] }); }
    p.legend([{ label: "gaussienne (faisceau, Doppler)", color: C.orange }, { label: "lorentzienne (raie naturelle)", color: C.sky }]);
    const frac = 1 - Math.exp(-2 * st.r * st.r / (w * w));
    ro("fwhm", fmt(fwhm, 3) + " mm"); ro("d", fmt(2 * w, 3) + " mm"); ro("frac", fmt(100 * frac, 4) + " %"); ro("perte", frac > 0 ? fmt(-10 * Math.log10(frac), 3) + " dB" : "∞", frac < 0.95);
    nt.textContent = st.r / w >= 1.5 ? "r ≥ 1,5 w : on garde ≥ 98,9 % de la puissance — règle pratique pour dimensionner une optique." : st.r / w >= 1 ? "r = w : on ne garde que 86,5 % (le faisceau « déborde »)." : "diaphragme trop petit : grosse perte et diffraction des bords.";
  }
  cv.onresize = draw; draw();
}
