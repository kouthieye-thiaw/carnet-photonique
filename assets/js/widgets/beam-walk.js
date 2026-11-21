// Jeu d'alignement « beam walking » : deux miroirs (M1, M2), deux diaphragmes (I1 proche, I2 lointain)
import { C, canvas, controls, slider, buttons, readouts, fmt, text, rrect, note } from "../lib.js";

export default function (el) {
  const L12 = 300, d1 = 150, d2 = 900, R = 0.5; // mm ; rayon du trou des diaphragmes (mm)
  const st = { t1: 0, t2: 0, e0: 0, a0: 0, moves: 0 };
  const cv = canvas(el, { height: w => (w < 640 ? 340 : 300) });
  const ctl = controls(el);
  const s1 = slider(ctl, { label: "vis du miroir M1 (loin des diaphragmes)", min: -3, max: 3, step: 0.005, value: 0, unit: "mrad", fmt: v => fmt(v, 3), oninput: v => { st.t1 = v; st.moves++; draw(); } });
  const s2 = slider(ctl, { label: "vis du miroir M2 (près des diaphragmes)", min: -3, max: 3, step: 0.005, value: 0, unit: "mrad", fmt: v => fmt(v, 3), oninput: v => { st.t2 = v; st.moves++; draw(); } });
  buttons(el, [["nouveau désalignement", () => shuffle()]]);
  const ro = readouts(el, [["y1", "écart sur I1 (proche)"], ["y2", "écart sur I2 (lointain)"], ["m", "réglages effectués"]]);
  const nt = note(el, "");
  // position du faisceau (mm) à une distance z après M2, pour des angles en mrad
  const pos = z => { const a1 = 2 * (st.t1 + st.a0) * 1e-3, yM2 = st.e0 + a1 * L12; const a = a1 + 2 * st.t2 * 1e-3; return yM2 + a * z; };
  function shuffle() { st.e0 = (Math.random() - 0.5) * 1.2; st.a0 = (Math.random() - 0.5) * 2.4; st.t1 = 0; st.t2 = 0; s1.value = 0; s2.value = 0; st.moves = 0; draw(); }
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const y1 = pos(d1), y2 = pos(d2), ok1 = Math.abs(y1) < R, ok2 = Math.abs(y2) < R;
    // schéma vu de côté (angles exagérés ×40)
    const X0 = 40, Xm1 = w * 0.18, Xm2 = w * 0.34, X1 = w * 0.5, X2 = w * 0.92, yc = h * 0.42, k = 22;
    c.strokeStyle = C.rule; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(X0, yc); c.lineTo(X2 + 20, yc); c.stroke(); c.setLineDash([]);
    const yb = z => yc - k * (z);
    const pts = [[X0, yc - k * st.e0 * 0], [Xm1, yb(st.e0)], [Xm2, yb(st.e0 + 2 * (st.t1 + st.a0) * 1e-3 * L12)], [X1, yb(y1)], [X2, yb(y2)]];
    c.strokeStyle = C.red; c.lineWidth = 3; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.fillStyle = C.ink; rrect(c, X0 - 30, yc - 12, 30, 24, 4); c.fill(); text(c, X0 - 15, yc + 26, "laser", { size: 12 });
    [[Xm1, "M1"], [Xm2, "M2"]].forEach(([x, t]) => { c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(x, yc - 34); c.lineTo(x, yc + 34); c.stroke(); text(c, x, yc + 50, t, { size: 13, weight: 600 }); });
    [[X1, ok1, "I1"], [X2, ok2, "I2"]].forEach(([x, ok, t]) => { c.strokeStyle = ok ? C.green : C.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(x, yc - 46); c.lineTo(x, yc - k * R); c.moveTo(x, yc + k * R); c.lineTo(x, yc + 46); c.stroke(); text(c, x, yc + 60, t, { size: 13, weight: 600 }); });
    // vues « face » des diaphragmes
    const face = (cx, y, ok, t) => { const cy = h - 50, Rpx = 26; c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, Rpx * 1.8, 0, 7); c.stroke(); c.strokeStyle = ok ? C.green : C.ink; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, Rpx, 0, 7); c.stroke(); const sx = cx, sy = cy - Math.max(-60, Math.min(60, y / R * Rpx)); c.fillStyle = "rgba(226,55,43,.85)"; c.beginPath(); c.arc(sx, sy, 7, 0, 7); c.fill(); text(c, cx + Rpx * 1.8 + 10, cy, t, { size: 12, align: "left", color: C.soft }); };
    face(w * 0.25, y1, ok1, "vue de I1"); face(w * 0.65, y2, ok2, "vue de I2");
    ro("y1", fmt(y1, 3) + " mm", !ok1); ro("y2", fmt(y2, 3) + " mm", !ok2); ro("m", String(st.moves));
    nt.textContent = ok1 && ok2 ? "aligné ! Le faisceau passe dans les deux diaphragmes : il est sur l'axe en position ET en angle." : "méthode : M1 pour centrer sur I1 (proche), puis M2 pour centrer sur I2 (lointain), et on recommence. Chaque passe rapproche du but.";
  }
  cv.onresize = draw; shuffle();
}
