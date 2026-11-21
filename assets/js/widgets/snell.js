// Réfraction (Snell-Descartes), réflexion de Fresnel (s et p), angle de Brewster et réflexion totale
import { C, canvas, controls, slider, select, readouts, fmt, arrow, text, note } from "../lib.js";

const MAT = [["1.000", "air (1,000)"], ["1.333", "eau (1,333)"], ["1.444", "silice à 1550 nm (1,444)"], ["1.517", "verre BK7 (1,517)"], ["1.76", "saphir (1,76)"], ["3.48", "silicium à 1550 nm (3,48)"], ["3.6", "GaAs (≈ 3,6)"]];
export default function (el) {
  const st = { n1: 1.517, n2: 1.0, th: 30 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 340) });
  const ctl = controls(el);
  select(ctl, { label: "milieu du haut (n₁)", options: MAT, value: "1.517", oninput: v => { st.n1 = +v; draw(); } });
  select(ctl, { label: "milieu du bas (n₂)", options: MAT, value: "1.000", oninput: v => { st.n2 = +v; draw(); } });
  slider(ctl, { label: "angle d'incidence θ₁", min: 0, max: 89, step: 0.5, value: st.th, unit: "°", fmt: v => fmt(v, 3), oninput: v => { st.th = v; draw(); } });
  const ro = readouts(el, [["t2", "angle réfracté θ₂"], ["tc", "angle critique"], ["tb", "angle de Brewster"], ["rs", "réflexion (pol. s)"], ["rp", "réflexion (pol. p)"]]);
  const nt = note(el, "");
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const ox = w / 2, oy = h / 2, L = Math.min(w, h) * 0.46;
    c.fillStyle = `rgba(59,130,246,${0.04 + 0.05 * (st.n1 - 1)})`; c.fillRect(0, 0, w, oy);
    c.fillStyle = `rgba(59,130,246,${0.04 + 0.05 * (st.n2 - 1)})`; c.fillRect(0, oy, w, h - oy);
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, oy); c.lineTo(w, oy); c.stroke();
    c.setLineDash([4, 4]); c.strokeStyle = C.mist; c.beginPath(); c.moveTo(ox, 10); c.lineTo(ox, h - 10); c.stroke(); c.setLineDash([]);
    text(c, 14, 22, "n₁ = " + fmt(st.n1, 4), { align: "left", size: 13 }); text(c, 14, h - 16, "n₂ = " + fmt(st.n2, 4), { align: "left", size: 13 });
    const t1 = st.th * Math.PI / 180, s2 = st.n1 * Math.sin(t1) / st.n2, tir = s2 >= 1;
    const t2 = tir ? NaN : Math.asin(s2);
    let rs = 1, rp = 1;
    if (!tir) { const ci = Math.cos(t1), ct = Math.cos(t2); rs = ((st.n1 * ci - st.n2 * ct) / (st.n1 * ci + st.n2 * ct)) ** 2; rp = ((st.n2 * ci - st.n1 * ct) / (st.n2 * ci + st.n1 * ct)) ** 2; }
    const R = (rs + rp) / 2, T = 1 - R;
    // rayon incident
    const x0 = ox - L * Math.sin(t1), y0 = oy - L * Math.cos(t1);
    c.strokeStyle = C.red; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(ox, oy); c.stroke();
    arrow(c, (x0 + ox) / 2 - 1, (y0 + oy) / 2 - 1, (x0 + 3 * ox) / 4, (y0 + 3 * oy) / 4, { color: C.red, width: 0.1, head: 12 });
    // réfléchi
    c.globalAlpha = Math.max(0.15, Math.sqrt(R)); c.lineWidth = 1 + 3 * R; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + L * Math.sin(t1), oy - L * Math.cos(t1)); c.stroke(); c.globalAlpha = 1;
    // réfracté
    if (!tir) { c.globalAlpha = Math.max(0.15, Math.sqrt(T)); c.lineWidth = 1 + 3 * T; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + L * Math.sin(t2), oy + L * Math.cos(t2)); c.stroke(); c.globalAlpha = 1; }
    // arcs d'angle
    c.strokeStyle = C.ink; c.lineWidth = 1.2; c.beginPath(); c.arc(ox, oy, 46, -Math.PI / 2 - t1, -Math.PI / 2); c.stroke(); text(c, ox - 26, oy - 60, "θ₁", { size: 13 });
    if (!tir) { c.beginPath(); c.arc(ox, oy, 46, Math.PI / 2 - t2, Math.PI / 2); c.stroke(); text(c, ox + 22, oy + 62, "θ₂", { size: 13 }); }
    text(c, w - 16, oy - 16, tir ? "réflexion totale !" : "", { hand: true, color: C.red, align: "right", size: 24 });
    const tc = st.n1 > st.n2 ? Math.asin(st.n2 / st.n1) * 180 / Math.PI : NaN, tb = Math.atan(st.n2 / st.n1) * 180 / Math.PI;
    ro("t2", tir ? "—" : fmt(t2 * 180 / Math.PI, 4) + " °"); ro("tc", isNaN(tc) ? "aucun (n₁ < n₂)" : fmt(tc, 4) + " °"); ro("tb", fmt(tb, 4) + " °");
    ro("rs", fmt(100 * rs, 3) + " %"); ro("rp", fmt(100 * rp, 3) + " %", !tir && rp < 0.002);
    nt.textContent = tir ? "au-delà de l'angle critique, plus rien ne sort : c'est ainsi que la lumière reste piégée dans une fibre." : rp < 0.002 ? "angle de Brewster : la polarisation p n'est plus réfléchie du tout." : st.th < 1 ? `incidence normale : R = ((n₁−n₂)/(n₁+n₂))² = ${fmt(100 * R, 3)} % — pour une puce GaAs, ~30 % : la facette sert de miroir !` : "épaisseur des traits ∝ puissance réfléchie et transmise.";
  }
  cv.onresize = draw; draw();
}
