// Thermistance CTN : modèle β vs Steinhart-Hart, pont diviseur lu par un ADC, sensibilité
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { R25: 10000, B: 3950, T: 25, Rfix: 10000 };
  const cv = canvas(el, { height: w => (w < 640 ? 280 : 300) });
  const ctl = controls(el);
  slider(ctl, { label: "température de la monture", min: -10, max: 80, step: 0.1, value: st.T, unit: "°C", fmt: v => fmt(v, 3), oninput: v => { st.T = v; draw(); } });
  slider(ctl, { label: "coefficient β de la CTN", min: 3000, max: 4500, step: 10, value: st.B, unit: "K", oninput: v => { st.B = v; draw(); } });
  slider(ctl, { label: "résistance fixe du pont", min: 2000, max: 47000, step: 100, value: st.Rfix, fmt: v => fmt(v / 1000, 3) + " kΩ", oninput: v => { st.Rfix = v; draw(); } });
  const ro = readouts(el, [["r", "résistance de la CTN"], ["v", "tension au milieu du pont (3,3 V)"], ["s", "sensibilité"], ["q", "1 LSB (ADC 16 bits, ±4,096 V)"]]);
  const nt = note(el, "");
  const R = T => st.R25 * Math.exp(st.B * (1 / (T + 273.15) - 1 / 298.15));
  const V = T => 3.3 * R(T) / (R(T) + st.Rfix);
  function draw() {
    const p = new Plot(cv, { x0: -10, x1: 80, y0: 0, y1: 3.3, xlabel: "température (°C)", ylabel: "tension (V)", y2: { y0: 0, y1: 60, label: "R (kΩ)", color: C.sky } });
    cv.clear(); p.axes();
    p.fn(T => R(T) / 1000, { color: C.sky, width: 2, axis: 2 });
    p.fn(V, { color: C.orange, width: 2.8 });
    p.points([st.T], [V(st.T)], { r: 5.5 });
    p.legend([{ label: "tension du pont (lue par l'ADC)", color: C.orange }, { label: "résistance de la CTN", color: C.sky }]);
    const dVdT = (V(st.T + 0.05) - V(st.T - 0.05)) / 0.1, lsb = 8.192 / 65536;
    ro("r", fmt(R(st.T) / 1000, 4) + " kΩ"); ro("v", fmt(V(st.T), 4) + " V"); ro("s", fmt(Math.abs(dVdT) * 1000, 3) + " mV/°C"); ro("q", fmt(lsb / Math.abs(dVdT) * 1000, 3) + " m°C");
    nt.textContent = Math.abs(st.Rfix - R(st.T)) / R(st.T) < 0.3 ? "résistance fixe ≈ R(CTN) à la température de travail : sensibilité maximale du pont. Bon choix !" : "pour être le plus sensible autour de la consigne, prends une résistance fixe proche de R(CTN) à cette température.";
  }
  cv.onresize = draw; draw();
}
