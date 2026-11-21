// Composer un signal, l'échantillonner et regarder son spectre (FFT) — repliement compris
import { C, canvas, Plot, controls, slider, select, readouts, fmt, gaussRand, seeded, note } from "../lib.js";

function fft(re, im) { // FFT radix-2 en place
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k]; const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}

export default function (el) {
  const st = { f: 120, forme: "sinus", fe: 1000, bruit: 0.05, secteur: 0.2, fen: "hann" };
  const time = canvas(el, { height: 200 });
  const spec = canvas(el, { height: 230 });
  const ctl = controls(el);
  select(ctl, { label: "forme du signal", value: st.forme, options: [["sinus", "sinusoïde"], ["carre", "signal carré"], ["deux", "deux raies proches"]], oninput: v => { st.forme = v; draw(); } });
  slider(ctl, { label: "fréquence du signal", min: 5, max: 900, step: 1, value: st.f, unit: "Hz", oninput: v => { st.f = v; draw(); } });
  slider(ctl, { label: "fréquence d'échantillonnage f<sub>e</sub>".replace(/<\/?sub>/g, ""), min: 100, max: 2000, step: 10, value: st.fe, unit: "Hz", oninput: v => { st.fe = v; draw(); } });
  slider(ctl, { label: "bruit blanc", min: 0, max: 0.5, step: 0.01, value: st.bruit, fmt: v => fmt(v, 2), oninput: v => { st.bruit = v; draw(); } });
  slider(ctl, { label: "parasite secteur 50 Hz", min: 0, max: 1, step: 0.01, value: st.secteur, fmt: v => fmt(v, 2), oninput: v => { st.secteur = v; draw(); } });
  select(ctl, { label: "fenêtre", value: st.fen, options: [["rect", "rectangulaire (aucune)"], ["hann", "Hann"]], oninput: v => { st.fen = v; draw(); } });
  const ro = readouts(el, [["nyq", "fréquence de Nyquist"], ["df", "résolution Δf"], ["vu", "fréquence apparente"]]);
  const nt = note(el, "");
  const N = 512;
  function sig(t) {
    let v = 0; const w = 2 * Math.PI * st.f;
    if (st.forme === "sinus") v = Math.sin(w * t);
    else if (st.forme === "carre") { for (let k = 1; k <= 15; k += 2) v += (4 / Math.PI) * Math.sin(k * w * t) / k; }
    else v = Math.sin(w * t) + 0.6 * Math.sin(2 * Math.PI * (st.f + 6) * t);
    return v + st.secteur * Math.sin(2 * Math.PI * 50 * t);
  }
  function draw() {
    const rnd = seeded(7); const g = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const Te = 1 / st.fe, re = new Float64Array(N), im = new Float64Array(N), xs = [], ys = [];
    for (let i = 0; i < N; i++) { const v = sig(i * Te) + st.bruit * g(); re[i] = v; xs.push(i * Te * 1000); ys.push(v); }
    // signal temporel : 60 ms « vrais » + points échantillonnés
    const span = Math.min(60, N * Te * 1000);
    const pt = new Plot(time, { x0: 0, x1: span, y0: -2.2, y1: 2.2, xlabel: "temps (ms)", ylabel: "signal", ny: 4 });
    time.clear(); pt.axes(); pt.fn(t => sig(t / 1000), { color: C.mist, width: 1.4, n: 1500 });
    const k = xs.findIndex(x => x > span); pt.line(xs.slice(0, k), ys.slice(0, k), { color: C.orange, width: 1.6 }).points(xs.slice(0, k), ys.slice(0, k), { color: C.ink, r: 2.4 });
    // spectre
    let s = 0; for (let i = 0; i < N; i++) { const w = st.fen === "hann" ? 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)) : 1; re[i] *= w; s += w; }
    fft(re, im);
    const fx = [], amp = []; for (let i = 0; i <= N / 2; i++) { fx.push(i * st.fe / N); amp.push(Math.max(1e-4, 2 * Math.hypot(re[i], im[i]) / s)); }
    const ps = new Plot(spec, { x0: 0, x1: st.fe / 2, y0: 1e-3, y1: 3, ylog: true, xlabel: "fréquence (Hz)", ylabel: "amplitude (log)" });
    spec.clear(); ps.axes(); ps.area(fx, amp, { base: 1e-3, alpha: .12 }).line(fx, amp, { color: C.orange, width: 1.8 });
    const app = Math.abs(((st.f + st.fe / 2) % st.fe) - st.fe / 2);
    if (st.f > st.fe / 2) ps.vline(app, { color: C.sky, label: "repliement !", hand: true });
    ro("nyq", fmt(st.fe / 2, 4) + " Hz"); ro("df", fmt(st.fe / N, 3) + " Hz"); ro("vu", fmt(app, 4) + " Hz", st.f > st.fe / 2);
    nt.textContent = st.f > st.fe / 2 ? `le signal à ${st.f} Hz dépasse f_e/2 : il apparaît (faussement) à ${fmt(app, 4)} Hz. Il fallait un filtre anti-repliement.` : st.forme === "carre" ? "un carré = la fondamentale + les harmoniques impaires (1, 1/3, 1/5…)." : st.forme === "deux" ? "deux raies séparées de 6 Hz : on ne les distingue que si Δf = f_e/N est assez fin (et avec une fenêtre)." : "chaque sinusoïde donne un pic ; le bruit blanc donne un « plancher » plat.";
  }
  time.onresize = draw; spec.onresize = draw; draw();
}
