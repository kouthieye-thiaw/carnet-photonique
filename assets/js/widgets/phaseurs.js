// Phaseurs : somme de deux ondes, interférences et battement
import { C, F, canvas, controls, slider, readouts, loop, fmt, arrow, text, note, reduced } from "../lib.js";

export default function (el) {
  const st = { a2: 1, phi: 0, df: 0 };
  const cv = canvas(el, { height: w => (w < 640 ? 460 : 280) });
  const ctl = controls(el);
  slider(ctl, { label: "amplitude de l'onde 2 (onde 1 = 1)", min: 0, max: 1.5, step: 0.01, value: st.a2, fmt: v => fmt(v, 3), oninput: v => { st.a2 = v; } });
  slider(ctl, { label: "déphasage Δφ", min: 0, max: 360, step: 1, value: 0, unit: "°", oninput: v => { st.phi = v * Math.PI / 180; } });
  slider(ctl, { label: "écart de fréquence (battement)", min: 0, max: 0.6, step: 0.01, value: 0, unit: "Hz (ralenti)", fmt: v => fmt(v, 2), oninput: v => { st.df = v; } });
  const ro = readouts(el, [["I", "intensité résultante"], ["Imax", "maxi possible"], ["V", "contraste (visibilité)"]]);
  const nt = note(el, "");
  let ph = 0, rel = 0;
  loop(el, (t, dt) => {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const narrow = w < 640;
    const w0 = 0.9; ph += (reduced() ? 0 : w0) * dt; rel += 2 * Math.PI * st.df * dt;
    const dphi = st.phi + rel;
    // --- diagramme de Fresnel
    const cx = narrow ? w / 2 : w * 0.22, cy = narrow ? 120 : h / 2, R = narrow ? 52 : Math.min(62, h / 4);
    c.strokeStyle = C.rule; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, R * 2.5, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(cx - R * 2.6, cy); c.lineTo(cx + R * 2.6, cy); c.moveTo(cx, cy - R * 2.6); c.lineTo(cx, cy + R * 2.6); c.stroke();
    const p1 = [Math.cos(ph) * R, -Math.sin(ph) * R], p2 = [Math.cos(ph + dphi) * R * st.a2, -Math.sin(ph + dphi) * R * st.a2];
    arrow(c, cx, cy, cx + p1[0], cy + p1[1], { color: C.orange, width: 2.6 });
    arrow(c, cx + p1[0], cy + p1[1], cx + p1[0] + p2[0], cy + p1[1] + p2[1], { color: C.sky, width: 2.6 });
    arrow(c, cx, cy, cx + p1[0] + p2[0], cy + p1[1] + p2[1], { color: C.ink, width: 3 });
    text(c, cx, narrow ? 16 : 18, "phaseurs (Fresnel)", { hand: true, color: C.soft, size: 20 });
    // --- signaux dans le temps
    const x0 = narrow ? 14 : w * 0.44, x1 = w - 14, yA = narrow ? 290 : h * 0.35, yB = narrow ? 400 : h * 0.78, amp = narrow ? 30 : h * 0.13;
    const N = 240, span = 4 * Math.PI;
    const trace = (fn, y0, col, lw) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (let i = 0; i <= N; i++) { const s = i / N, tt = ph - span * (1 - s); const x = x0 + (x1 - x0) * s, y = y0 - amp * fn(tt, s); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
    c.strokeStyle = C.rule; c.beginPath(); c.moveTo(x0, yA); c.lineTo(x1, yA); c.moveTo(x0, yB); c.lineTo(x1, yB); c.stroke();
    trace(tt => Math.cos(tt), yA, C.orange, 2);
    trace((tt, s) => st.a2 * Math.cos(tt + st.phi + rel - 2 * Math.PI * st.df * span * (1 - s) / w0 * 0), yA, C.sky, 2);
    trace((tt) => (Math.cos(tt) + st.a2 * Math.cos(tt + dphi)) / 1.6, yB, C.ink, 2.4);
    text(c, x0 + 4, yA - amp - 10, "onde 1 et onde 2", { size: 12, align: "left", color: C.soft });
    text(c, x0 + 4, yB - amp - 12, "somme (ce que voit le détecteur, au carré)", { size: 12, align: "left", color: C.soft });
    const I = 1 + st.a2 * st.a2 + 2 * st.a2 * Math.cos(dphi), Imax = (1 + st.a2) ** 2, Imin = (1 - st.a2) ** 2;
    ro("I", fmt(I, 3)); ro("Imax", fmt(Imax, 3)); ro("V", fmt((Imax - Imin) / (Imax + Imin), 3));
    nt.textContent = st.df > 0 ? "fréquences différentes : la phase relative tourne, l'intensité « bat » à l'écart de fréquence." : Math.cos(st.phi) > 0.95 ? "en phase : interférence constructive." : Math.cos(st.phi) < -0.95 ? "en opposition de phase : interférence destructive." : "interférence partielle : I = I₁ + I₂ + 2√(I₁I₂)·cos Δφ.";
  });
}
