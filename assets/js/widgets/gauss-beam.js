// Propagation d'un faisceau gaussien (paramètre q, matrices ABCD) avec facteur M² et lentille de focalisation
import { C, canvas, Plot, controls, slider, toggle, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { w0: 0.5, lam: 633, M2: 1, lens: true, f: 200, zl: 600, zmax: 1200 };
  const cv = canvas(el, { height: w => (w < 640 ? 280 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "rayon au col w₀", min: 0.05, max: 3, step: 0.01, value: st.w0, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.w0 = v; draw(); } });
  slider(ctl, { label: "longueur d'onde λ", min: 400, max: 1600, step: 1, value: st.lam, unit: "nm", oninput: v => { st.lam = v; draw(); } });
  slider(ctl, { label: "qualité de faisceau M²", min: 1, max: 6, step: 0.05, value: st.M2, fmt: v => fmt(v, 3), oninput: v => { st.M2 = v; draw(); } });
  toggle(ctl, { label: "lentille de focalisation", value: true, oninput: v => { st.lens = v; draw(); } });
  slider(ctl, { label: "focale f", min: 25, max: 500, step: 1, value: st.f, unit: "mm", oninput: v => { st.f = v; draw(); } });
  slider(ctl, { label: "position de la lentille", min: 50, max: 1100, step: 5, value: st.zl, unit: "mm", oninput: v => { st.zl = v; draw(); } });
  const ro = readouts(el, [["zr", "longueur de Rayleigh"], ["div", "divergence (demi-angle)"], ["wf", "col après la lentille"], ["zf", "position du nouveau col"]]);
  const nt = note(el, "");
  // nombres complexes minimalistes
  const cx = (re, im) => ({ re, im }), add = (a, b) => cx(a.re + b.re, a.im + b.im), mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re), div = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
  function draw() {
    const lam = st.lam * 1e-6 * st.M2; // mm, longueur d'onde « effective » (faisceau enveloppé)
    const zR = Math.PI * st.w0 * st.w0 / lam;
    const q0 = cx(0, zR); // col en z = 0
    const wOf = q => { const inv = div(cx(1, 0), q); return Math.sqrt(-lam / (Math.PI * inv.im)); };
    let qL = null, zf = NaN, wf = NaN;
    if (st.lens) { const qb = add(q0, cx(st.zl, 0)); qL = div(qb, add(mul(cx(-1 / st.f, 0), qb), cx(1, 0))); zf = st.zl - qL.re; wf = Math.sqrt(lam * qL.im / Math.PI) ; }
    const W = z => (!st.lens || z < st.zl) ? wOf(add(q0, cx(z, 0))) : wOf(add(qL, cx(z - st.zl, 0)));
    const xs = [], up = [], dn = []; let ymax = 0;
    for (let i = 0; i <= 600; i++) { const z = st.zmax * i / 600; const w = W(z); xs.push(z); up.push(w); dn.push(-w); ymax = Math.max(ymax, w); }
    ymax = Math.min(ymax * 1.15, 12);
    const p = new Plot(cv, { x0: 0, x1: st.zmax, y0: -ymax, y1: ymax, xlabel: "distance z (mm)", ylabel: "rayon w (mm)", yfmt: v => fmt(Math.abs(v), 3) });
    cv.clear(); p.axes();
    p.clip(c => { c.fillStyle = "rgba(226,55,43,.16)"; c.beginPath(); xs.forEach((x, i) => { const X = p.X(x), Y = p.Y(up[i]); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); for (let i = xs.length - 1; i >= 0; i--) c.lineTo(p.X(xs[i]), p.Y(dn[i])); c.closePath(); c.fill(); });
    p.line(xs, up, { color: C.red, width: 2.2 }).line(xs, dn, { color: C.red, width: 2.2 });
    p.hline(0, { color: C.mist, dash: [2, 4] });
    if (st.lens) { const x = p.X(st.zl), c = cv.ctx; c.strokeStyle = C.sky; c.lineWidth = 3; c.beginPath(); c.ellipse(x, p.Y(0), 5, (p.B - p.T) * 0.42, 0, 0, 7); c.stroke(); p.at(st.zl, ymax * 0.9, "lentille f = " + st.f + " mm", { align: "center", hand: true, color: C.sky }); if (zf > 0 && zf < st.zmax) p.vline(zf, { color: C.orange, label: "nouveau col", hand: true }); }
    p.vline(zR > st.zmax ? st.zmax : zR, { color: C.mist, dash: [3, 4] });
    ro("zr", zR > 1000 ? fmt(zR / 1000, 3) + " m" : fmt(zR, 3) + " mm"); ro("div", fmt(lam / (Math.PI * st.w0) * 1000, 3) + " mrad");
    ro("wf", st.lens ? (wf < 0.1 ? fmt(wf * 1000, 3) + " µm" : fmt(wf, 3) + " mm") : "—"); ro("zf", st.lens ? fmt(zf, 4) + " mm" : "—");
    nt.textContent = st.M2 > 1.5 ? "M² > 1 : le faisceau réel diverge M² fois plus vite et se focalise M² fois moins bien qu'un gaussien parfait." : st.lens && wf < 0.02 ? "tache focale minuscule… mais la profondeur de champ (2 z_R) devient très courte." : "w₀·θ = λ/π : un col plus petit diverge plus. On ne peut pas avoir les deux.";
  }
  cv.onresize = draw; draw();
}
