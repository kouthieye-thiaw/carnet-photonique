// Systèmes à 2, 3 et 4 niveaux : peut-on obtenir l'inversion de population ?
import { C, canvas, controls, slider, select, readouts, loop, fmt, text, arrow, note } from "../lib.js";

export default function (el) {
  const st = { sys: "4", W: 2 };
  const cv = canvas(el, { height: w => (w < 640 ? 320 : 300) });
  const ctl = controls(el);
  select(ctl, { label: "système", value: st.sys, options: [["2", "2 niveaux"], ["3", "3 niveaux (rubis, erbium)"], ["4", "4 niveaux (Nd:YAG)"]], oninput: v => { st.sys = v; } });
  slider(ctl, { label: "taux de pompage W (× 1/τ)", min: 0, max: 6, step: 0.05, value: st.W, fmt: v => fmt(v, 3), oninput: v => { st.W = v; } });
  const ro = readouts(el, [["up", "niveau haut laser"], ["lo", "niveau bas laser"], ["inv", "inversion ΔN"]]);
  const nt = note(el, "");
  // populations stationnaires (fractions), A = 1/τ = 1 ; désexcitations non radiatives très rapides
  function pops() {
    const W = st.W, A = 1;
    if (st.sys === "2") { const n2 = W / (2 * W + A); return { lv: [1 - n2, n2], up: 1, lo: 0 }; }
    if (st.sys === "3") { const n2 = W / (W + A); return { lv: [1 - n2, n2, 0], up: 1, lo: 0 }; }
    const n2 = W / (W + A); return { lv: [1 - n2, 0.0, n2, 0], up: 2, lo: 1 };
  }
  const N = 48; let dots = Array.from({ length: N }, (_, i) => ({ x: Math.random(), lvl: 0, t: Math.random() }));
  let flashes = [];
  loop(el, (t, dt) => {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const P = pops(), nl = P.lv.length;
    const E = st.sys === "2" ? [0, 0.62] : st.sys === "3" ? [0, 0.55, 0.82] : [0, 0.22, 0.6, 0.85];
    const x0 = 70, x1 = w * 0.62, Y = e => h - 34 - e * (h - 70);
    // niveaux
    E.forEach((e, i) => { c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, Y(e)); c.lineTo(x1, Y(e)); c.stroke(); text(c, x0 - 12, Y(e), "E" + i, { align: "right", size: 13 }); });
    const lab = st.sys === "2" ? ["fondamental", "excité"] : st.sys === "3" ? ["fondamental = bas laser", "métastable (haut laser)", "bande de pompe"] : ["fondamental", "bas laser (se vide vite)", "haut laser (métastable)", "bande de pompe"];
    lab.forEach((l, i) => text(c, x1 + 8, Y(E[i]), l, { align: "left", size: 12, color: C.soft }));
    // répartition des atomes selon les populations cibles
    const target = P.lv.map(p => Math.round(p * N)); let k = 0;
    const want = []; target.forEach((n, i) => { for (let j = 0; j < n; j++) want.push(i); }); while (want.length < N) want.push(0);
    dots.forEach((d, i) => { if (Math.random() < dt * 2.5) { const nw = want[(i * 7) % N]; if (nw !== d.lvl) { if (nw < d.lvl && d.lvl === P.up) flashes.push({ x: x0 + d.x * (x1 - x0), y: Y(E[d.lvl]), a: 1 }); d.lvl = nw; } } });
    dots.forEach(d => { const xx = x0 + 10 + d.x * (x1 - x0 - 20), yy = Y(E[d.lvl]) - 7; c.beginPath(); c.arc(xx, yy, 4.6, 0, 7); c.fillStyle = d.lvl === P.up ? C.orange : d.lvl === 0 ? C.paper : C.sky; c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.2; c.stroke(); });
    // flèches pompe & laser
    const xp = x1 - 50; arrow(c, xp, Y(0) - 4, xp, Y(E[nl - 1]) + 4, { color: C.orange, width: 2.4 }); text(c, xp - 8, (Y(0) + Y(E[nl - 1])) / 2, "pompe", { hand: true, color: C.orange, align: "right", size: 20 });
    if (st.sys !== "2") { c.setLineDash([4, 3]); arrow(c, xp - 90, Y(E[nl - 1]) + 4, xp - 90, Y(E[P.up]) - 4, { color: C.soft, width: 1.6 }); c.setLineDash([]); }
    if (st.sys === "4") { c.setLineDash([4, 3]); arrow(c, xp - 140, Y(E[1]) + 4, xp - 140, Y(0) - 4, { color: C.soft, width: 1.6 }); c.setLineDash([]); }
    const xl = x0 + 40; arrow(c, xl, Y(E[P.up]) + 4, xl, Y(E[P.lo]) - 4, { color: C.red, width: 3 }); text(c, xl + 10, (Y(E[P.up]) + Y(E[P.lo])) / 2, "transition laser", { align: "left", size: 12, color: C.red });
    flashes.forEach(f => { f.a -= dt * 1.4; f.x += 160 * dt; c.globalAlpha = Math.max(0, f.a); c.strokeStyle = C.red; c.lineWidth = 2; c.beginPath(); for (let q = 0; q < 10; q++) { const xx = f.x + q * 2, yy = f.y - 12 + Math.sin(q * 1.3 + t * 20) * 3; q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.globalAlpha = 1; });
    flashes = flashes.filter(f => f.a > 0).slice(-30);
    // barres de population
    const bx = w * 0.8, bw = Math.min(70, w * 0.12);
    const up = P.lv[P.up], lo = P.lv[P.lo], inv = up - lo;
    [[up, C.orange, "haut"], [lo, C.sky, "bas"]].forEach(([v, col, l], i) => { const xx = bx + i * (bw + 10), hh = (h - 90) * v; c.fillStyle = col; c.fillRect(xx, h - 40 - hh, bw, hh); c.strokeStyle = C.ink; c.strokeRect(xx, h - 40 - (h - 90), bw, h - 90); text(c, xx + bw / 2, h - 24, l, { size: 12 }); });
    text(c, bx + bw + 5, 20, inv > 0 ? "inversion ✓" : "pas d'inversion", { hand: true, color: inv > 0 ? C.green : C.red, size: 22 });
    ro("up", fmt(100 * up, 3) + " %"); ro("lo", fmt(100 * lo, 3) + " %"); ro("inv", fmt(100 * inv, 3) + " %", inv <= 0);
    nt.textContent = st.sys === "2" ? "à deux niveaux, le pompage remplit le haut… mais vide aussi le haut par émission stimulée : on plafonne à 50 %, jamais d'inversion." : st.sys === "3" ? "à trois niveaux, il faut pomper plus de la moitié des atomes hors du fondamental : seuil élevé (W > 1/τ)." : "à quatre niveaux, le bas laser est presque vide : le moindre pompage crée une inversion. D'où des seuils très bas.";
  });
}
