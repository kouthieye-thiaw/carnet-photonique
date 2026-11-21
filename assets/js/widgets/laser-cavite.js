// Simulation : un laser qui démarre. Équations de population normalisées (régime stationnaire)
// n' = P - n - n·s ; s' = n·s - L·s + β·n  →  seuil P_th = L, verrouillage du gain n = L au-dessus.
import { C, F, canvas, Plot, controls, slider, readouts, loop, fmt, rrect, text, note } from "../lib.js";

export default function (el) {
  const R1 = 0.999, AI = 0.01, BETA = 2e-4, PMAX = 0.6;
  const st = { P: 0.3, R2: 0.9 };
  const anim = canvas(el, { height: w => (w < 640 ? 220 : 250) });
  const plots = canvas(el, { height: w => (w < 640 ? 440 : 250) });
  const ctl = controls(el);
  slider(ctl, { label: "pompage (× échelle arbitraire)", min: 0, max: PMAX, step: 0.005, value: st.P, fmt: v => fmt(v, 2), oninput: v => { st.P = v; upd(); } });
  slider(ctl, { label: "réflectivité du coupleur de sortie R₂", min: 0.5, max: 0.999, step: 0.001, value: st.R2, fmt: v => fmt(v * 100, 4) + " %", oninput: v => { st.R2 = v; upd(); } });
  const ro = readouts(el, [["th", "seuil de pompage"], ["n", "inversion n (gain)"], ["s", "photons dans la cavité"], ["out", "puissance de sortie"]]);
  const nt = note(el, "");

  const loss = R2 => 2 * AI + Math.log(1 / (R1 * R2));
  const solve = (P, R2) => { const L = loss(R2); const s = ((P - L) + Math.sqrt((P - L) ** 2 + 4 * L * P * BETA)) / (2 * L); const n = P / (1 + s); return { L, s, n, out: s * Math.log(1 / R2) }; };

  // ----- graphiques
  function drawPlots() {
    const w = plots.w, h = plots.h, two = w >= 640; plots.clear();
    const box1 = two ? { x: 0, y: 0, w: w / 2, h } : { x: 0, y: 0, w, h: h / 2 };
    const box2 = two ? { x: w / 2, y: 0, w: w / 2, h } : { x: 0, y: h / 2, w, h: h / 2 };
    const sub = (b) => ({ ...plots, w: b.w, h: b.h, ctx: plots.ctx, clear() {} });
    const ctx = plots.ctx;
    // panneau 1 : sortie vs pompage
    ctx.save(); ctx.translate(box1.x, box1.y);
    const cur = solve(st.P, st.R2);
    const ymax = Math.max(0.05, solve(PMAX, st.R2).out * 1.15);
    const p1 = new Plot(sub(box1), { x0: 0, x1: PMAX, y0: 0, y1: ymax, xlabel: "pompage", ylabel: "sortie", xfmt: v => fmt(v, 2), yfmt: v => fmt(v, 2), nx: 5, ny: 4 });
    p1.axes();
    const xs = [], ys = []; for (let i = 0; i <= 200; i++) { const P = PMAX * i / 200; xs.push(P); ys.push(solve(P, st.R2).out); }
    p1.area(xs, ys, { alpha: 0.1 }).line(xs, ys, { color: C.orange, width: 2.8 });
    p1.vline(cur.L, { label: "seuil", hand: true, color: C.cocoa });
    p1.points([st.P], [cur.out], { r: 5.5, color: C.ink });
    ctx.restore();
    // panneau 2 : sortie vs R2 (optimum de couplage)
    ctx.save(); ctx.translate(box2.x, box2.y);
    const Rs = [], O = []; let best = { R: 0, o: -1 };
    for (let i = 0; i <= 240; i++) { const R = 0.5 + 0.499 * i / 240; const o = solve(st.P, R).out; Rs.push(R * 100); O.push(o); if (o > best.o) best = { R, o }; }
    const p2 = new Plot(sub(box2), { x0: 50, x1: 99.9, y0: 0, y1: Math.max(0.05, best.o * 1.25), xlabel: "R₂ (%)", ylabel: "sortie", xfmt: v => fmt(v, 3), yfmt: v => fmt(v, 2), nx: 5, ny: 4 });
    p2.axes().line(Rs, O, { color: C.sky, width: 2.6 });
    if (best.o > 0) p2.vline(best.R * 100, { label: "optimum ≈ " + fmt(best.R * 100, 3) + " %", hand: true, color: C.sky });
    p2.points([st.R2 * 100], [cur.out], { r: 5.5, color: C.ink });
    ctx.restore();
  }

  // ----- animation (atomes + photons)
  const N_AT = 60; const atoms = Array.from({ length: N_AT }, (_, i) => ({ i, ex: false, t: Math.random() }));
  let photons = [];
  function draw(t, dt) {
    const c = anim.ctx, w = anim.w, h = anim.h; anim.clear();
    const cur = solve(st.P, st.R2);
    const mx1 = 46, mx2 = w - 70, ay = h * 0.56, gx1 = mx1 + 34, gx2 = mx2 - 34, gh = 74;
    // pompe
    const np = Math.round(st.P / PMAX * 7);
    for (let k = 0; k < np; k++) { const x = gx1 + (k + 0.5) * (gx2 - gx1) / 7; const yy = 18 + ((t * 40 + k * 13) % 26); c.strokeStyle = C.orange; c.lineWidth = 2; c.beginPath(); c.moveTo(x, yy); c.lineTo(x, yy + 14); c.stroke(); c.beginPath(); c.moveTo(x - 4, yy + 9); c.lineTo(x, yy + 15); c.lineTo(x + 4, yy + 9); c.stroke(); }
    text(c, gx1 - 6, 22, "pompage", { hand: true, color: C.orange, align: "right", size: 20 });
    // milieu amplificateur
    c.fillStyle = "rgba(255,111,30,0.07)"; c.strokeStyle = C.ink; c.lineWidth = 1.5; rrect(c, gx1, ay - gh / 2, gx2 - gx1, gh, 10); c.fill(); c.stroke();
    // atomes : fraction excitée = n / PMAX (verrouillée au seuil)
    const target = Math.min(1, cur.n / PMAX);
    const cols = 15, rows = 4;
    atoms.forEach(a => { if (Math.random() < dt * 3) a.ex = Math.random() < target; });
    atoms.forEach(a => { const cx = gx1 + 14 + (a.i % cols) * (gx2 - gx1 - 28) / (cols - 1), cy = ay - gh / 2 + 14 + Math.floor(a.i / cols) * (gh - 28) / (rows - 1); c.beginPath(); c.arc(cx, cy, 4.2, 0, 7); if (a.ex) { c.fillStyle = C.orange; c.fill(); } c.strokeStyle = C.ink; c.lineWidth = 1.2; c.stroke(); });
    // miroirs
    c.fillStyle = C.ink; rrect(c, mx1, ay - 52, 8, 104, 3); c.fill();
    c.fillStyle = "rgba(23,23,23,.45)"; rrect(c, mx2, ay - 52, 8, 104, 3); c.fill();
    text(c, mx1 + 4, ay + 70, "miroir HR", { size: 12, color: C.soft });
    text(c, mx2 + 4, ay + 70, "coupleur R₂", { size: 12, color: C.soft });
    // photons : nombre cible ~ log(s)
    const want = Math.min(70, Math.round(cur.s > 0.02 ? 6 + 14 * Math.log10(1 + cur.s * 10) : cur.s * 200));
    if (photons.filter(p => !p.out).length < want && Math.random() < 0.6) photons.push({ x: gx1 + Math.random() * (gx2 - gx1), y: ay + (Math.random() - .5) * (gh - 18), d: Math.random() < .5 ? 1 : -1, out: false, a: 1 });
    const v = Math.min(w, 900) * 0.55;
    photons.forEach(p => {
      p.x += p.d * v * dt;
      if (!p.out) {
        if (p.x <= mx1 + 8) { p.x = mx1 + 8; p.d = 1; }
        if (p.x >= mx2) { if (Math.random() < 1 - st.R2 + 0.04) { p.out = true; p.x = mx2 + 9; } else { p.x = mx2; p.d = -1; } }
      } else { p.a -= dt * 0.9; }
    });
    photons = photons.filter(p => p.a > 0 && p.x < w + 20);
    const ex = photons.filter(p => !p.out).length;
    if (ex > want + 3) photons.splice(photons.findIndex(p => !p.out), 1);
    photons.forEach(p => { c.save(); c.globalAlpha = Math.max(0, p.a); c.strokeStyle = C.red; c.lineWidth = 2.2; c.beginPath(); for (let k = 0; k <= 10; k++) { const xx = p.x - p.d * k * 1.6; const yy = p.y + Math.sin(k * 1.2 + t * 18) * 3; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.restore(); });
    // faisceau de sortie
    if (cur.out > 0.002) { const a = Math.min(1, cur.out * 4); c.fillStyle = `rgba(226,55,43,${0.15 + 0.5 * a})`; c.fillRect(mx2 + 8, ay - 3 - 4 * a, w - mx2 - 8, 6 + 8 * a); }
    text(c, w - 8, ay - 22, cur.s > 0.5 ? "laser !" : "lueur", { hand: true, color: cur.s > 0.5 ? C.red : C.soft, align: "right", size: 22 });
  }
  const lp = loop(el, draw);
  function upd() {
    const cur = solve(st.P, st.R2);
    ro("th", fmt(cur.L, 3)); ro("n", fmt(cur.n, 3) + (st.P > cur.L ? " (verrouillée)" : "")); ro("s", fmt(cur.s, 3)); ro("out", fmt(cur.out, 3));
    nt.textContent = st.P < cur.L ? "sous le seuil : surtout de l'émission spontanée, faible et dans tous les sens." : "au-dessus du seuil : le gain reste bloqué à la valeur des pertes, tout le pompage en plus devient lumière laser.";
    drawPlots();
  }
  plots.onresize = drawPlots; upd();
}
