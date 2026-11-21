// ECDL : gain de la puce × filtre du réseau × modes de la cavité externe → quel mode oscille ? (sauts de mode)
import { C, canvas, Plot, controls, slider, toggle, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { grat: 0, piezo: 0, sync: false, Lext: 30 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const hist = canvas(el, { height: 150 });
  const ctl = controls(el);
  slider(ctl, { label: "angle du réseau (accord)", min: -60, max: 60, step: 0.1, value: 0, unit: "GHz", fmt: v => (v > 0 ? "+" : "") + fmt(v, 3), oninput: v => { st.grat = v; draw(); } });
  slider(ctl, { label: "piézo (longueur de cavité)", min: -1, max: 1, step: 0.005, value: 0, unit: "ISL", fmt: v => fmt(v, 2), oninput: v => { st.piezo = v; draw(); } });
  slider(ctl, { label: "longueur de la cavité externe", min: 10, max: 80, step: 1, value: st.Lext, unit: "mm", oninput: v => { st.Lext = v; draw(); } });
  toggle(ctl, { label: "synchroniser cavité et réseau (point de pivot)", value: false, oninput: v => { st.sync = v; draw(); } });
  const ro = readouts(el, [["isl", "ISL de la cavité externe"], ["mode", "fréquence du mode laser"], ["hops", "sauts de mode sur le balayage"]]);
  const nt = note(el, "");
  const isl = () => 0.3 / (2 * st.Lext / 1000); // GHz
  const gratW = 25; // largeur du filtre du réseau (GHz, FWHM approx.)
  function modeAt(g, pz) {
    const I = isl(); const shift = st.sync ? g / I : pz; // avec synchro, le peigne suit le réseau
    let best = null;
    for (let k = -40; k <= 40; k++) {
      const f = (k + shift) * I;
      const G = Math.exp(-(((f - g) / gratW) ** 2) * 2.77) * (1 - 0.04 * Math.cos(2 * Math.PI * f / 140)) * Math.exp(-((f / 400) ** 2));
      if (!best || G > best.G) best = { f, G, k };
    }
    return best;
  }
  function draw() {
    const I = isl(), span = 90;
    const p = new Plot(cv, { x0: -span, x1: span, y0: 0, y1: 1.18, xlabel: "fréquence relative (GHz)", ylabel: "gain / transmission" });
    cv.clear(); p.axes();
    p.fn(f => Math.exp(-((f / 400) ** 2)) * (1 - 0.04 * Math.cos(2 * Math.PI * f / 140)), { color: C.mist, width: 2 });
    p.fn(f => Math.exp(-(((f - st.grat) / gratW) ** 2) * 2.77), { color: C.sky, width: 2.4 });
    const shift = st.sync ? st.grat / I : st.piezo, m = modeAt(st.grat, st.piezo);
    for (let k = -60; k <= 60; k++) { const f = (k + shift) * I; if (f < -span || f > span) continue; const c = cv.ctx, x = p.X(f); const on = Math.abs(f - m.f) < 1e-6; c.strokeStyle = on ? C.red : C.orange; c.globalAlpha = on ? 1 : 0.45; c.lineWidth = on ? 3.2 : 1.4; c.beginPath(); c.moveTo(x, p.B); c.lineTo(x, p.Y(on ? 1.08 : 0.25)); c.stroke(); c.globalAlpha = 1; }
    p.legend([{ label: "gain de la puce (+ résidu de ses modes)", color: C.mist }, { label: "filtre du réseau", color: C.sky }, { label: "modes de la cavité externe", color: C.orange }]);
    // balayage complet du réseau : fréquence du mode en fonction de l'angle
    const gs = [], fs = []; let hops = 0, prev = null;
    for (let i = 0; i <= 400; i++) { const g = -60 + 120 * i / 400; const mm = modeAt(g, st.piezo); gs.push(g); fs.push(mm.f); if (prev !== null && Math.abs(mm.f - prev) > I * 0.5) hops++; prev = mm.f; }
    const ph = new Plot(hist, { x0: -60, x1: 60, y0: -70, y1: 70, xlabel: "consigne du réseau (GHz)", ylabel: "f laser", ny: 4, pad: { l: 58, r: 18, t: 10, b: 36 } });
    hist.clear(); ph.axes(); ph.line([-60, 60], [-60, 60], { color: C.mist, dash: [3, 4], width: 1 }); ph.points(gs, fs, { color: C.red, r: 1.6 }); ph.points([st.grat], [m.f], { r: 5, color: C.ink });
    ro("isl", fmt(I, 3) + " GHz"); ro("mode", (m.f >= 0 ? "+" : "") + fmt(m.f, 3) + " GHz"); ro("hops", String(hops), hops > 0);
    nt.textContent = st.sync ? "cavité synchronisée : le peigne suit le réseau, l'accord est continu (sans saut de mode) — c'est le rôle du point de pivot ou de l'asservissement piézo + courant." : "sans synchronisation, le réseau balaie mais les modes de cavité restent fixes : la fréquence avance en « escalier » (sauts d'un ISL). Le graphe du bas le montre.";
  }
  cv.onresize = draw; hist.onresize = draw; draw();
}
