// Système du premier ordre : réponse indicielle exacte vs méthode d'Euler (et ses instabilités)
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { tau: 2, dt: 0.5, K: 1 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "constante de temps τ", min: 0.5, max: 5, step: 0.1, value: st.tau, unit: "s", fmt: v => fmt(v, 2), oninput: v => { st.tau = v; draw(); } });
  slider(ctl, { label: "pas de calcul Δt (Euler)", min: 0.05, max: 6, step: 0.05, value: st.dt, unit: "s", fmt: v => fmt(v, 2), oninput: v => { st.dt = v; draw(); } });
  const ro = readouts(el, [["r", "rapport Δt / τ"], ["e", "écart à t = τ"], ["y5", "valeur à t = 5τ (exacte)"]]);
  const nt = note(el, "");
  function draw() {
    const T = 20;
    const p = new Plot(cv, { x0: 0, x1: T, y0: -0.6, y1: 1.6, xlabel: "temps (s)", ylabel: "sortie / consigne" });
    cv.clear(); p.axes();
    p.hline(1, { color: C.mist, label: "consigne", dash: [3, 4] });
    p.hline(1 - Math.exp(-1), { color: C.mist, dash: [2, 5], label: "63 % (t = τ)" });
    p.vline(st.tau, { color: C.mist, dash: [2, 5] });
    p.fn(t => st.K * (1 - Math.exp(-t / st.tau)), { color: C.orange, width: 3 });
    // Euler explicite : y += dt·(K - y)/τ
    const xs = [0], ys = [0]; let y = 0;
    for (let t = st.dt; t <= T + 1e-9; t += st.dt) { y = y + st.dt * (st.K - y) / st.tau; xs.push(t); ys.push(Math.max(-0.6, Math.min(1.6, y))); }
    p.line(xs, ys, { color: C.sky, width: 1.8, dash: [6, 4] }).points(xs, ys, { color: C.sky, r: 4 });
    p.legend([{ label: "solution exacte 1 − e^(−t/τ)", color: C.orange }, { label: "Euler, pas Δt", color: C.sky, dash: [6, 4] }], { left: false });
    const r = st.dt / st.tau;
    let yt = 0; for (let t = st.dt; t <= st.tau + 1e-9; t += st.dt) yt += st.dt * (1 - yt) / st.tau;
    ro("r", fmt(r, 3), r > 0.3); ro("e", fmt(100 * Math.abs(yt - (1 - Math.exp(-Math.floor(st.tau / st.dt + 1e-9) * st.dt / st.tau))), 3) + " %"); ro("y5", fmt(100 * (1 - Math.exp(-5)), 3) + " %");
    nt.textContent = r >= 2 ? "Δt > 2τ : Euler diverge ! Un régulateur numérique trop lent fait la même chose." : r > 1 ? "Δt > τ : ça oscille autour de la consigne (artefact de calcul)." : r > 0.3 ? "résultat approximatif : prends Δt ≤ τ/10 pour une simulation fiable." : "pas assez petit : Euler colle à la solution exacte.";
  }
  cv.onresize = draw; draw();
}
