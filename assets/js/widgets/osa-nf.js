// Trace d'analyseur de spectre optique en sortie d'ampli : signal + ASE ; mesure du gain et du NF par interpolation
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { pin: -20, G: 25, NF: 5, rbw: 0.1, sse: -50 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "puissance d'entrée", min: -35, max: 0, step: 0.5, value: st.pin, unit: "dBm", oninput: v => { st.pin = v; draw(); } });
  slider(ctl, { label: "gain réel de l'ampli", min: 10, max: 35, step: 0.5, value: st.G, unit: "dB", oninput: v => { st.G = v; draw(); } });
  slider(ctl, { label: "facteur de bruit réel", min: 3, max: 9, step: 0.1, value: st.NF, unit: "dB", fmt: v => fmt(v, 2), oninput: v => { st.NF = v; draw(); } });
  slider(ctl, { label: "bande de résolution de l'OSA", min: 0.02, max: 1, step: 0.01, value: st.rbw, unit: "nm", fmt: v => fmt(v, 2), oninput: v => { st.rbw = v; draw(); } });
  slider(ctl, { label: "émission parasite du laser source (SSE)", min: -70, max: -35, step: 1, value: st.sse, unit: "dBm/0,1 nm", oninput: v => { st.sse = v; draw(); } });
  const ro = readouts(el, [["g", "gain mesuré"], ["ase", "ASE interpolée"], ["nf", "NF mesuré"], ["err", "erreur sur le NF"]]);
  const nt = note(el, "");
  const hnu = 6.626e-34 * 2.998e8 / 1550e-9, mw = d => Math.pow(10, d / 10), db = x => 10 * Math.log10(x);
  function draw() {
    const G = mw(st.G), NF = mw(st.NF), B = 2.998e8 * st.rbw * 1e-9 / (1550e-9 ** 2);
    const aseW = (NF - 1 / G) * hnu * G * B;                     // ASE dans la RBW (W)
    const sseOut = mw(st.sse) * 1e-3 * (st.rbw / 0.1) * G;          // SSE du laser, amplifiée (W)
    const shape = l => Math.exp(-(((l - 1545) / 22) ** 2)) * 0.6 + 0.4;      // ASE pas tout à fait plate
    const trace = l => { const ase = aseW * shape(l) / shape(1550); const sig = mw(st.pin + st.G) * 1e-3 * Math.exp(-(((l - 1550) / (st.rbw * 0.6)) ** 2)); return db((ase + sseOut * Math.exp(-(((l - 1550) / 3) ** 2)) + sig) * 1e3); };
    const xs = [], ys = []; for (let l = 1530; l <= 1570; l += 0.02) { xs.push(l); ys.push(trace(l)); }
    const p = new Plot(cv, { x0: 1530, x1: 1570, y0: db(aseW * 1e3) - 25, y1: st.pin + st.G + 6, xlabel: "longueur d'onde (nm)", ylabel: "dBm / RBW" });
    cv.clear(); p.axes(); p.line(xs, ys, { color: C.orange, width: 1.8 });
    // interpolation de l'ASE à ±1 nm (méthode « interpolation source soustraite » simplifiée)
    const aL = mw(trace(1549)), aR = mw(trace(1551)), aseI = (aL + aR) / 2 * 1e-3;
    p.points([1549, 1551], [trace(1549), trace(1551)], { color: C.sky, r: 5 });
    p.at(1551.4, trace(1551) + 3, "points d'interpolation", { hand: true, color: C.sky, size: 19 });
    const Gm = (mw(st.pin + st.G) * 1e-3) / (mw(st.pin) * 1e-3), NFm = aseI / (hnu * Gm * B) + 1 / Gm;
    ro("g", fmt(db(Gm), 3) + " dB"); ro("ase", fmt(db(aseI * 1e3), 3) + " dBm"); ro("nf", fmt(db(NFm), 3) + " dB"); ro("err", fmt(db(NFm) - st.NF, 2) + " dB", Math.abs(db(NFm) - st.NF) > 0.3);
    nt.textContent = Math.abs(db(NFm) - st.NF) > 0.3 ? "l'émission parasite du laser source (amplifiée) se confond avec l'ASE : le NF est surestimé. Il faut filtrer la source ou soustraire sa contribution." : "NF = P_ASE/(hν·G·B) + 1/G : la mesure colle à la vraie valeur.";
  }
  cv.onresize = draw; draw();
}
