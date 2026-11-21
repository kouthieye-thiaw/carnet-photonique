// Chaîne MOPA : oscillateur maître + préampli + booster, saturation de chaque étage, OSNR estimé (formule 58 + Pin − NF)
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { seed: 10, g1: 20, ps1: 15, nf1: 5, loss: 1.5, g2: 15, ps2: 33, nf2: 6 };
  const cv = canvas(el, { height: w => (w < 640 ? 280 : 300) });
  const ctl = controls(el);
  slider(ctl, { label: "oscillateur maître (seed)", min: 0.1, max: 100, log: true, value: st.seed, unit: "mW", fmt: v => fmt(v, 3), oninput: v => { st.seed = v; draw(); } });
  slider(ctl, { label: "préampli : gain petit signal", min: 0, max: 35, step: 0.5, value: st.g1, unit: "dB", oninput: v => { st.g1 = v; draw(); } });
  slider(ctl, { label: "préampli : P_sat", min: 0, max: 30, step: 0.5, value: st.ps1, unit: "dBm", oninput: v => { st.ps1 = v; draw(); } });
  slider(ctl, { label: "pertes entre étages (isolateur, filtre)", min: 0, max: 6, step: 0.1, value: st.loss, unit: "dB", fmt: v => fmt(v, 2), oninput: v => { st.loss = v; draw(); } });
  slider(ctl, { label: "booster : gain petit signal", min: 0, max: 30, step: 0.5, value: st.g2, unit: "dB", oninput: v => { st.g2 = v; draw(); } });
  slider(ctl, { label: "booster : P_sat", min: 20, max: 45, step: 0.5, value: st.ps2, unit: "dBm", oninput: v => { st.ps2 = v; draw(); } });
  const ro = readouts(el, [["out", "puissance de sortie"], ["outw", "soit"], ["nf", "facteur de bruit total"], ["osnr", "OSNR (0,1 nm) estimé"]]);
  const nt = note(el, "");
  const mw = d => Math.pow(10, d / 10), db = m => 10 * Math.log10(m);
  function amp(pinDbm, g0dB, psatDbm) { const G0 = mw(g0dB), x = mw(pinDbm) / mw(psatDbm); let G = G0; for (let i = 0; i < 100; i++) { const f = Math.log(G) - Math.log(G0) + (G - 1) * x, df = 1 / G + x; G = Math.max(1.000001, G - f / df); } return pinDbm + db(G); }
  function draw() {
    const s0 = db(st.seed), a1 = amp(s0, st.g1, st.ps1), l1 = a1 - st.loss, a2 = amp(l1, st.g2, st.ps2);
    const steps = [["seed", s0], ["préampli", a1], ["isolateur + filtre", l1], ["booster", a2]];
    const p = new Plot(cv, { x0: -0.5, x1: 3.5, y0: Math.min(-5, s0 - 5), y1: Math.max(a2, a1) + 8, ylabel: "puissance (dBm)", xticks: [] });
    cv.clear(); p.axes();
    const c = cv.ctx; c.strokeStyle = C.orange; c.lineWidth = 3; c.beginPath();
    steps.forEach(([n, v], i) => { const x0 = p.X(i - 0.42), x1 = p.X(i + 0.42), y = p.Y(v); i ? c.lineTo(x0, y) : c.moveTo(x0, y); c.lineTo(x1, y); }); c.stroke();
    steps.forEach(([n, v], i) => { p.at(i, v, fmt(v, 3) + " dBm", { dy: -12, align: "center", size: 12 }); p.label(p.X(i), p.B + 14, n, { align: "center", size: 11.5, color: C.soft }); });
    p.hline(st.ps2, { color: C.mist, dash: [3, 4], label: "P_sat booster" });
    const G1 = mw(a1 - s0), nfTot = db(mw(st.nf1) + (mw(st.nf2 + st.loss) - 1) / G1);
    ro("out", fmt(a2, 3) + " dBm"); ro("outw", mw(a2) >= 1000 ? fmt(mw(a2) / 1000, 3) + " W" : fmt(mw(a2), 3) + " mW"); ro("nf", fmt(nfTot, 3) + " dB"); ro("osnr", fmt(58 + s0 - nfTot, 3) + " dB");
    nt.textContent = a2 - l1 < st.g2 - 3 ? "le booster est saturé : la sortie dépend peu du seed — stable, c'est le but." : "booster encore linéaire : tu pourrais tirer plus de puissance (plus de pompe ou de seed).";
  }
  cv.onresize = draw; draw();
}
