// Transmission d'un Fabry-Pérot (fonction d'Airy) : ISL, finesse, largeur des pics ; spectre d'un laser vu à travers
import { C, canvas, Plot, controls, slider, select, readouts, fmt, note } from "../lib.js";

export default function (el) {
  const st = { R: 0.9, L: 5, laser: "mono" };
  const cv = canvas(el, { height: w => (w < 640 ? 280 : 300) });
  const ctl = controls(el);
  slider(ctl, { label: "réflectivité des miroirs R", min: 0.3, max: 0.995, step: 0.001, value: st.R, fmt: v => fmt(v * 100, 4) + " %", oninput: v => { st.R = v; draw(); } });
  slider(ctl, { label: "longueur de la cavité L (air)", min: 0.5, max: 30, step: 0.1, value: st.L, unit: "cm", fmt: v => fmt(v, 3), oninput: v => { st.L = v; draw(); } });
  select(ctl, { label: "laser analysé", value: st.laser, options: [["mono", "monomode (une raie)"], ["multi", "multimode (3 modes)"], ["aucun", "aucun"]], oninput: v => { st.laser = v; draw(); } });
  const ro = readouts(el, [["isl", "ISL = c/2L"], ["fin", "finesse"], ["fw", "largeur d'un pic"], ["cont", "contraste Tmax/Tmin"]]);
  const nt = note(el, "");
  function draw() {
    const isl = 3e8 / (2 * st.L / 100), F = 4 * st.R / (1 - st.R) ** 2, fin = Math.PI * Math.sqrt(st.R) / (1 - st.R);
    const span = 2.6 * isl; // Hz
    const p = new Plot(cv, { x0: -span / 2 / 1e9, x1: span / 2 / 1e9, y0: 0, y1: 1.15, xlabel: "fréquence relative (GHz)", ylabel: "transmission", xfmt: v => fmt(v, 3) });
    cv.clear(); p.axes();
    const T = f => 1 / (1 + F * Math.sin(Math.PI * f / isl) ** 2);
    p.fn(fg => T(fg * 1e9), { color: C.orange, width: 2.6, n: 1600 });
    p.area([-span / 2e9, span / 2e9], [0, 0], { alpha: 0 });
    // raies du laser analysé
    const lines = st.laser === "mono" ? [0.13 * isl] : st.laser === "multi" ? [-0.9e9, 0.13 * isl, 1.16e9] : [];
    lines.forEach((f, i) => { p.vline(f / 1e9, { color: C.sky, dash: [2, 3], label: i === 0 ? "raie(s) laser" : "", hand: true }); });
    const fw = isl / fin;
    p.at(isl / 2e9, 1.06, "ISL", { align: "center", hand: true, color: C.cocoa });
    ro("isl", fmt(isl / 1e9, 4) + " GHz"); ro("fin", fmt(fin, 3)); ro("fw", fw > 1e9 ? fmt(fw / 1e9, 3) + " GHz" : fmt(fw / 1e6, 3) + " MHz"); ro("cont", fmt(1 + F, 3));
    nt.textContent = st.R > 0.98 ? "très haute finesse : pics très fins — c'est une cavité de référence pour stabiliser un laser." : st.R < 0.5 ? "faible finesse : la transmission ondule doucement (c'est l'effet d'une lame de verre non traitée — un « étalon » parasite)." : "en balayant L avec un piézo, chaque raie laser fait apparaître un pic : c'est l'analyseur de spectre Fabry-Pérot.";
  }
  cv.onresize = draw; draw();
}
