// Régression linéaire sur une courbe L-I bruitée : seuil, pente, R², résidus — et le piège de la fenêtre d'ajustement
import { C, canvas, Plot, controls, slider, buttons, readouts, fmt, gaussRand, note } from "../lib.js";

export default function (el) {
  const TRUE = { ith: 25, eta: 0.8 }; // mA, W/A
  const st = { noise: 0.06, from: 32, to: 60, seed: 1 };
  let data = [];
  const cv = canvas(el, { height: w => (w < 640 ? 280 : 300) });
  const res = canvas(el, { height: 130 });
  const ctl = controls(el);
  slider(ctl, { label: "bruit de mesure (écart-type)", min: 0, max: 0.4, step: 0.01, value: st.noise, unit: "mW", fmt: v => fmt(v, 2), oninput: v => { st.noise = v; gen(); draw(); } });
  slider(ctl, { label: "début de la fenêtre d'ajustement", min: 0, max: 50, step: 1, value: st.from, unit: "mA", oninput: v => { st.from = Math.min(v, st.to - 4); draw(); } });
  slider(ctl, { label: "fin de la fenêtre", min: 20, max: 60, step: 1, value: st.to, unit: "mA", oninput: v => { st.to = Math.max(v, st.from + 4); draw(); } });
  buttons(el, [["nouvelle mesure (autre bruit)", () => { gen(); draw(); }]]);
  const ro = readouts(el, [["ith", "seuil estimé (vrai : 25 mA)"], ["eta", "pente (vraie : 0,8 W/A)"], ["r2", "R²"], ["n", "points ajustés"]]);
  const nt = note(el, "");
  function gen() {
    data = []; for (let I = 0; I <= 60; I += 1) { const P = I < TRUE.ith ? 0.004 * I : TRUE.eta * (I - TRUE.ith) + 0.004 * TRUE.ith; data.push([I, P + st.noise * gaussRand()]); }
  }
  function fit(pts) { const n = pts.length; let sx = 0, sy = 0, sxx = 0, sxy = 0; pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; }); const a = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - a * sx) / n; const my = sy / n; let ssr = 0, sst = 0; pts.forEach(([x, y]) => { ssr += (y - (a * x + b)) ** 2; sst += (y - my) ** 2; }); return { a, b, r2: 1 - ssr / sst, n }; }
  function draw() {
    const pts = data.filter(([x]) => x >= st.from && x <= st.to); const f = fit(pts);
    const p = new Plot(cv, { x0: 0, x1: 60, y0: -1, y1: 30, xlabel: "courant I (mA)", ylabel: "puissance P (mW)" });
    cv.clear(); p.axes();
    p.clip(c => { c.fillStyle = "rgba(255,111,30,.07)"; c.fillRect(p.X(st.from), p.T, p.X(st.to) - p.X(st.from), p.B - p.T); });
    p.points(data.map(d => d[0]), data.map(d => d[1]), { color: C.ink, r: 2.6 });
    p.fn(x => f.a * x + f.b, { color: C.orange, width: 2.6 });
    const ith = -f.b / f.a; p.vline(ith, { color: C.orange, label: "seuil ≈ " + fmt(ith, 3) + " mA", hand: true });
    p.vline(TRUE.ith, { color: C.mist, dash: [2, 4] });
    // résidus
    const pr = new Plot(res, { x0: 0, x1: 60, y0: -1.2, y1: 1.2, ylabel: "résidus", ny: 2, pad: { l: 58, r: 18, t: 10, b: 26 } });
    res.clear(); pr.axes(); pr.hline(0, { color: C.mist });
    pr.points(pts.map(d => d[0]), pts.map(d => d[1] - (f.a * d[0] + f.b)), { color: C.orange, r: 2.6 });
    ro("ith", fmt(ith, 3) + " mA", Math.abs(ith - 25) > 1.5); ro("eta", fmt(f.a, 3) + " W/A", Math.abs(f.a - 0.8) > 0.05); ro("r2", fmt(f.r2, 5)); ro("n", String(f.n));
    nt.textContent = st.from < TRUE.ith ? "la fenêtre inclut des points sous le seuil : la droite est tordue, le seuil et la pente sont faux — regarde les résidus en forme de « sourire »." : "fenêtre bien au-dessus du seuil : résidus répartis au hasard autour de 0, estimation fiable.";
  }
  cv.onresize = draw; res.onresize = draw; gen(); draw();
}
