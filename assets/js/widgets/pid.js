// Régulation de température d'une monture laser par Peltier : simulation PID (capteur en retard, saturation, anti-windup, perturbation)
import { C, canvas, Plot, controls, slider, toggle, buttons, readouts, fmt, gaussRand, seeded, note } from "../lib.js";

export default function (el) {
  const st = { Kp: 0.5, Ki: 0.02, Kd: 1.5, sp: 18, dt: 0.2, aw: true, dist: true, noise: true };
  const cv = canvas(el, { height: w => (w < 640 ? 260 : 280) });
  const cu = canvas(el, { height: 140 });
  const ctl = controls(el);
  const sKp = slider(ctl, { label: "K_p (gain proportionnel)", min: 0, max: 3, step: 0.01, value: st.Kp, fmt: v => fmt(v, 3), oninput: v => { st.Kp = v; run(); } });
  const sKi = slider(ctl, { label: "K_i (intégral, par s)", min: 0, max: 0.3, step: 0.001, value: st.Ki, fmt: v => fmt(v, 3), oninput: v => { st.Ki = v; run(); } });
  const sKd = slider(ctl, { label: "K_d (dérivé, s)", min: 0, max: 10, step: 0.05, value: st.Kd, fmt: v => fmt(v, 3), oninput: v => { st.Kd = v; run(); } });
  slider(ctl, { label: "consigne", min: 10, max: 40, step: 0.5, value: st.sp, unit: "°C", oninput: v => { st.sp = v; run(); } });
  slider(ctl, { label: "période d'échantillonnage", min: 0.05, max: 8, step: 0.05, value: st.dt, unit: "s", fmt: v => fmt(v, 3), oninput: v => { st.dt = v; run(); } });
  toggle(ctl, { label: "anti-windup (intégrale bloquée en saturation)", value: true, oninput: v => { st.aw = v; run(); } });
  toggle(ctl, { label: "perturbation : la pièce chauffe de 3 °C à t = 200 s", value: true, oninput: v => { st.dist = v; run(); } });
  toggle(ctl, { label: "bruit de mesure", value: true, oninput: v => { st.noise = v; run(); } });
  const preset = (p, i, d) => { sKp.value = p; sKi.value = i; sKd.value = d; st.Kp = p; st.Ki = i; st.Kd = d; run(); };
  buttons(el, [["P seul", () => preset(0.6, 0, 0)], ["PI", () => preset(0.6, 0.02, 0)], ["PID réglé", () => preset(0.5, 0.02, 1.5)], ["trop agressif", () => preset(2.6, 0.25, 0)]]);
  const ro = readouts(el, [["os", "dépassement"], ["ts", "temps d'établissement (±0,05 °C)"], ["es", "erreur à t = 190 s"], ["std", "stabilité (écart-type, fin)"]]);
  const nt = note(el, "");
  const TAU = 30, K = 25, TAUS = 3, TEND = 400;
  function run() {
    const rnd = seeded(3), g = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    let T = 25, Ts = 25, I = 0, prevM = 25, u = 0, tNext = 0; const h = 0.02;
    const ts = [], Tv = [], Mv = [], Uv = [];
    for (let t = 0; t <= TEND; t += h) {
      const amb = 25 + (st.dist && t >= 200 ? 3 : 0);
      if (t >= tNext - 1e-9) { // le régulateur ne calcule qu'à chaque période d'échantillonnage
        const meas = Ts + (st.noise ? 0.008 * g() : 0); const e = st.sp - meas;
        const D = -st.Kd * (meas - prevM) / st.dt; prevM = meas;
        let uRaw = st.Kp * e + I + D; const sat = uRaw > 1 || uRaw < -1;
        if (!st.aw || !sat || Math.sign(e) !== Math.sign(uRaw)) I += st.Ki * e * st.dt;
        I = Math.max(-5, Math.min(5, I));
        u = Math.max(-1, Math.min(1, st.Kp * e + I + D)); tNext += st.dt;
      }
      T += h * (amb + K * u - T) / TAU; Ts += h * (T - Ts) / TAUS;
      if (Math.round(t / h) % 10 === 0) { ts.push(t); Tv.push(T); Mv.push(Ts); Uv.push(u); }
    }
    // indicateurs
    const dir = Math.sign(st.sp - 25) || 1; let os = 0; ts.forEach((t, i) => { if (t < 200) os = Math.max(os, dir * (Tv[i] - st.sp)); });
    let tset = NaN; for (let i = ts.length - 1; i >= 0; i--) { if (ts[i] >= 200) continue; if (Math.abs(Tv[i] - st.sp) > 0.05) { tset = ts[i + 1]; break; } }
    const i190 = ts.findIndex(t => t >= 190), fin = Tv.filter((_, i) => ts[i] > 330), mean = fin.reduce((a, b) => a + b, 0) / fin.length, sd = Math.sqrt(fin.reduce((a, b) => a + (b - mean) ** 2, 0) / fin.length);
    const lo = Math.min(st.sp, 25) - 6, hi = Math.max(st.sp, 25) + 6;
    const p = new Plot(cv, { x0: 0, x1: TEND, y0: lo, y1: hi, xlabel: "temps (s)", ylabel: "température (°C)" });
    cv.clear(); p.axes(); p.hline(st.sp, { color: C.green, label: "consigne", dash: [5, 4] });
    if (st.dist) p.vline(200, { color: C.mist, label: "+3 °C ambiant", hand: true });
    p.line(ts, Tv, { color: C.orange, width: 2.6 }); p.line(ts, Mv, { color: C.ink, width: 1.2, dash: [3, 3] });
    p.legend([{ label: "monture (vraie)", color: C.orange }, { label: "mesure CTN (en retard)", color: C.ink, dash: [3, 3] }]);
    const q = new Plot(cu, { x0: 0, x1: TEND, y0: -1.1, y1: 1.1, ylabel: "commande", ny: 2, pad: { l: 58, r: 18, t: 10, b: 26 }, yfmt: v => fmt(100 * v, 3) + "%" });
    cu.clear(); q.axes(); q.hline(0, { color: C.mist }); q.line(ts, Uv, { color: C.sky, width: 1.6 });
    ro("os", fmt(Math.max(0, os), 3) + " °C", os > 0.5); ro("ts", isNaN(tset) || tset === undefined ? "jamais" : fmt(tset, 3) + " s", isNaN(tset)); ro("es", i190 >= 0 ? fmt(st.sp - Tv[i190], 2) + " °C" : "—", i190 >= 0 && Math.abs(st.sp - Tv[i190]) > 0.1); ro("std", fmt(sd * 1000, 3) + " m°C");
    const unstable = Tv.slice(-200).some(v => Math.abs(v - st.sp) > 2);
    nt.textContent = unstable ? "instable ou en oscillation : gains trop forts ou échantillonnage trop lent face au retard du capteur." : st.Ki === 0 ? "P seul : il reste une erreur statique (la commande a besoin d'une erreur pour exister)." : os > 0.5 ? "ça dépasse : baisse K_i ou ajoute un peu de K_d." : "réglage sain : peu de dépassement, erreur nulle, rejet de la perturbation.";
  }
  cv.onresize = run; cu.onresize = run; run();
}
