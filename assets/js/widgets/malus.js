// Polariseur tournant (loi de Malus), taux d'extinction (PER) et lame demi-onde comme atténuateur
import { C, canvas, Plot, controls, slider, toggle, readouts, loop, fmt, text, note } from "../lib.js";

export default function (el) {
  const st = { per: 25, pol: 0, hwp: 0, ana: 0, auto: true, useHwp: false };
  const draw2 = canvas(el, { height: 170 });
  const cv = canvas(el, { height: 240 });
  const ctl = controls(el);
  slider(ctl, { label: "taux d'extinction du laser (PER)", min: 5, max: 40, step: 0.5, value: st.per, unit: "dB", oninput: v => { st.per = v; } });
  slider(ctl, { label: "angle de l'analyseur (polariseur)", min: 0, max: 360, step: 1, value: 0, unit: "°", oninput: v => { st.ana = v; st.auto = false; autoT.value = false; } });
  const autoT = toggle(ctl, { label: "polariseur motorisé (rotation continue)", value: true, oninput: v => { st.auto = v; } });
  toggle(ctl, { label: "ajouter une lame λ/2 avant", value: false, oninput: v => { st.useHwp = v; } });
  slider(ctl, { label: "angle de la lame λ/2", min: 0, max: 90, step: 0.5, value: 0, unit: "°", oninput: v => { st.hwp = v; } });
  const ro = readouts(el, [["p", "puissance mesurée"], ["max", "P max"], ["min", "P min"], ["per", "PER mesuré"]]);
  const nt = note(el, "");
  const P0 = 5; // mW
  const meas = th => { const r = Math.pow(10, -st.per / 10); const polAxis = (st.useHwp ? 2 * st.hwp : 0) * Math.PI / 180; const a = th * Math.PI / 180 - polAxis; return P0 / (1 + r) * (Math.cos(a) ** 2 + r * Math.sin(a) ** 2); };
  loop(el, (t, dt) => {
    if (st.auto) st.ana = (st.ana + 40 * dt) % 360;
    // schéma : laser -> (λ/2) -> polariseur -> détecteur
    const c = draw2.ctx, w = draw2.w, h = draw2.h; draw2.clear();
    const y = h / 2, xs = [60, st.useHwp ? w * 0.36 : null, w * 0.6, w - 60];
    c.strokeStyle = C.red; c.lineWidth = 5; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(70, y); c.lineTo(xs[2], y); c.stroke();
    const out = meas(st.ana) / P0; c.globalAlpha = 0.15 + 0.75 * out; c.beginPath(); c.moveTo(xs[2], y); c.lineTo(xs[3] - 14, y); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = C.ink; c.fillRect(20, y - 16, 50, 32); text(c, 45, y + 30, "laser", { size: 12 });
    const disc = (x, ang, col, lab, kind) => { c.save(); c.translate(x, y); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.fillStyle = "rgba(247,239,233,.9)"; c.beginPath(); c.ellipse(0, 0, 14, 44, 0, 0, 7); c.fill(); c.stroke();
      const a = ang * Math.PI / 180; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(a) * 6, -Math.cos(a) * 38); c.moveTo(0, 0); c.lineTo(-Math.sin(a) * 6, Math.cos(a) * 38); c.stroke(); c.restore(); text(c, x, y + 62, lab, { size: 12 }); };
    if (st.useHwp) disc(xs[1], st.hwp, C.sky, "lame λ/2 (" + fmt(st.hwp, 3) + "°)");
    disc(xs[2], st.ana, C.orange, "polariseur (" + fmt(st.ana, 3) + "°)");
    c.fillStyle = C.ink; c.fillRect(xs[3] - 14, y - 20, 28, 40); text(c, xs[3], y + 34, "photodiode", { size: 12 });
    // flèche de polarisation en sortie du laser
    const pa = (st.useHwp ? 2 * st.hwp : 0) * Math.PI / 180;
    c.strokeStyle = C.red; c.lineWidth = 2; c.beginPath(); const xm = st.useHwp ? (xs[1] + xs[2]) / 2 : (90 + xs[2]) / 2; c.moveTo(xm + Math.sin(pa) * 4, y - Math.cos(pa) * 26); c.lineTo(xm - Math.sin(pa) * 4, y + Math.cos(pa) * 26); c.stroke();
    // courbe P(θ)
    const p = new Plot(cv, { x0: 0, x1: 360, y0: 0, y1: P0 * 1.12, xlabel: "angle du polariseur (°)", ylabel: "puissance (mW)", xticks: [0, 45, 90, 135, 180, 225, 270, 315, 360] });
    cv.clear(); p.axes(); p.fn(meas, { color: C.orange, width: 2.6 }); p.points([st.ana], [meas(st.ana)], { r: 6, color: C.ink });
    const mx = P0 / (1 + Math.pow(10, -st.per / 10)), mn = mx * Math.pow(10, -st.per / 10);
    ro("p", fmt(meas(st.ana), 3) + " mW"); ro("max", fmt(mx, 4) + " mW"); ro("min", mn < 0.01 ? fmt(mn * 1000, 3) + " µW" : fmt(mn, 3) + " mW"); ro("per", fmt(10 * Math.log10(mx / mn), 3) + " dB");
    nt.textContent = st.useHwp ? "tourner la lame λ/2 d'un angle α fait tourner la polarisation de 2α : avec un polariseur fixe, c'est un atténuateur réglable sans pièce mobile dans le faisceau." : "le minimum n'est jamais nul : c'est la part de lumière dans la polarisation croisée qui fixe le PER.";
  });
}
