// Filtre LC (ou RC) contre l'ondulation d'une alimentation à découpage / PWM de Peltier
import { C, canvas, Plot, controls, slider, select, readouts, fmt, si, note } from "../lib.js";

export default function (el) {
  const st = { type: "lc", L: 10e-6, Cap: 100e-6, R: 1, fsw: 500e3, rip: 0.1, Rl: 10 };
  const cv = canvas(el, { height: w => (w < 640 ? 260 : 280) });
  const ctl = controls(el);
  select(ctl, { label: "type de filtre", value: "lc", options: [["lc", "LC (2e ordre)"], ["rc", "RC (1er ordre)"]], oninput: v => { st.type = v; draw(); } });
  slider(ctl, { label: "inductance L (ou R pour un RC)", min: 1e-6, max: 1e-3, log: true, value: st.L, fmt: v => st.type === "rc" ? si(v * 1e6, "Ω", 3) : si(v, "H", 3), oninput: v => { st.L = v; draw(); } });
  slider(ctl, { label: "capacité C", min: 1e-6, max: 1e-3, log: true, value: st.Cap, fmt: v => si(v, "F", 3), oninput: v => { st.Cap = v; draw(); } });
  slider(ctl, { label: "fréquence de découpage", min: 1e3, max: 2e6, log: true, value: st.fsw, fmt: v => si(v, "Hz", 3), oninput: v => { st.fsw = v; draw(); } });
  slider(ctl, { label: "ondulation en entrée (crête-crête)", min: 0.01, max: 1, log: true, value: st.rip, fmt: v => si(v, "V", 3), oninput: v => { st.rip = v; draw(); } });
  const ro = readouts(el, [["f0", "fréquence de coupure"], ["att", "atténuation au découpage"], ["out", "ondulation en sortie"], ["q", "surtension à f₀"]]);
  const nt = note(el, "");
  function H(f) {
    const w = 2 * Math.PI * f;
    if (st.type === "rc") { const R = st.L * 1e6; return 1 / Math.sqrt(1 + (w * R * st.Cap) ** 2); }
    // LC chargé par Rl, avec ESR de 20 mΩ
    const Zl = { re: 0.02, im: w * st.L }, Zc = { re: 0.01, im: -1 / (w * st.Cap) };
    const par = (a, b) => { const n = { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }, d = { re: a.re + b.re, im: a.im + b.im }; const m = d.re * d.re + d.im * d.im; return { re: (n.re * d.re + n.im * d.im) / m, im: (n.im * d.re - n.re * d.im) / m }; };
    const Zp = par(Zc, { re: st.Rl, im: 0 }); const den = { re: Zl.re + Zp.re, im: Zl.im + Zp.im };
    return Math.hypot(Zp.re, Zp.im) / Math.hypot(den.re, den.im);
  }
  function draw() {
    const f0 = st.type === "rc" ? 1 / (2 * Math.PI * st.L * 1e6 * st.Cap) : 1 / (2 * Math.PI * Math.sqrt(st.L * st.Cap));
    const p = new Plot(cv, { x0: 10, x1: 1e7, xlog: true, y0: -120, y1: 30, xlabel: "fréquence (Hz)", ylabel: "gain (dB)", xfmt: v => si(v, "", 1).trim() });
    cv.clear(); p.axes(); p.hline(0, { color: C.mist, dash: [2, 3] });
    p.fn(f => 20 * Math.log10(H(f)), { color: C.orange, width: 2.8, n: 600 });
    p.vline(st.fsw, { color: C.sky, label: "découpage", hand: true });
    const a = 20 * Math.log10(H(st.fsw)), peak = st.type === "lc" ? 20 * Math.log10(H(f0)) : 0;
    ro("f0", si(f0, "Hz", 3)); ro("att", fmt(a, 3) + " dB"); ro("out", si(st.rip * H(st.fsw), "V", 3)); ro("q", fmt(peak, 3) + " dB", peak > 6);
    nt.textContent = peak > 6 ? "le LC résonne à f₀ (surtension) : il amplifie les perturbations proches de f₀ ! On l'amortit (résistance série avec un condensateur, ferrite)." : st.fsw < 5 * f0 ? "le découpage est trop proche de la coupure : presque pas d'atténuation." : "règle : coupure au moins 10× sous la fréquence de découpage → 40 dB/décade pour un LC, 20 pour un RC.";
  }
  cv.onresize = draw; draw();
}
