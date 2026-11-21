// Saturation du gain d'un amplificateur optique : G = G0·exp(−(G−1)·Pin/Psat) ; Pout(Pin) et point de compression
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { G0dB: 30, Psat: 10, Pin: -20 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "gain petit signal G₀", min: 5, max: 40, step: 0.5, value: st.G0dB, unit: "dB", oninput: v => { st.G0dB = v; draw(); } });
  slider(ctl, { label: "puissance de saturation P<sub>sat</sub>".replace(/<\/?sub>/g, ""), min: -5, max: 25, step: 0.5, value: st.Psat, unit: "dBm", oninput: v => { st.Psat = v; draw(); } });
  slider(ctl, { label: "puissance d'entrée du signal", min: -40, max: 10, step: 0.5, value: st.Pin, unit: "dBm", oninput: v => { st.Pin = v; draw(); } });
  const ro = readouts(el, [["g", "gain réel"], ["po", "puissance de sortie"], ["c", "compression"], ["reg", "régime"]]);
  const nt = note(el, "");
  const mw = dbm => Math.pow(10, dbm / 10);
  function gain(PinDbm) { // résolution de G = G0 exp(-(G-1) Pin/Psat)
    const G0 = Math.pow(10, st.G0dB / 10), x = mw(PinDbm) / mw(st.Psat);
    let G = G0; for (let i = 0; i < 200; i++) { const f = Math.log(G) - Math.log(G0) + (G - 1) * x, df = 1 / G + x; const Gn = Math.max(1.0000001, G - f / df); if (Math.abs(Gn - G) < 1e-9 * G) { G = Gn; break; } G = Gn; }
    return G;
  }
  function draw() {
    const xs = [], gdb = [], pout = [];
    for (let p = -40; p <= 10.001; p += 0.25) { const G = gain(p); xs.push(p); gdb.push(10 * Math.log10(G)); pout.push(p + 10 * Math.log10(G)); }
    const p = new Plot(cv, { x0: -40, x1: 10, y0: 0, y1: st.G0dB + 5, xlabel: "puissance d'entrée (dBm)", ylabel: "gain (dB)", y2: { y0: -20, y1: 30, label: "sortie (dBm)", color: C.sky } });
    cv.clear(); p.axes();
    p.line(xs, pout, { color: C.sky, width: 2.2, axis: 2 });
    p.line(xs, gdb, { color: C.orange, width: 3 });
    p.hline(st.G0dB - 3, { color: C.mist, dash: [3, 4], label: "−3 dB (compression)" });
    const G = gain(st.Pin), Gd = 10 * Math.log10(G);
    p.points([st.Pin], [Gd], { r: 5.5 });
    p.legend([{ label: "gain", color: C.orange }, { label: "puissance de sortie", color: C.sky }], { left: true });
    const comp = st.G0dB - Gd;
    ro("g", fmt(Gd, 3) + " dB"); ro("po", fmt(st.Pin + Gd, 3) + " dBm"); ro("c", fmt(comp, 3) + " dB", comp > 3); ro("reg", comp < 0.5 ? "linéaire" : comp < 3 ? "début de saturation" : "saturé");
    nt.textContent = comp < 0.5 ? "petit signal : le gain est constant, la sortie suit l'entrée dB pour dB (préampli)." : comp > 3 ? "saturé : la sortie plafonne près de la puissance de saturation — un ampli « booster » fonctionne ainsi et devient insensible aux fluctuations d'entrée." : "le gain commence à baisser quand le signal consomme l'inversion.";
  }
  cv.onresize = draw; draw();
}
