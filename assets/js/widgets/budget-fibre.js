// Bilan d'une liaison fibre : la puissance (en dBm) le long du trajet, connecteurs, soudures, atténuation.
import { C, canvas, controls, slider, select, readouts, note, Plot, fmt, fix } from "../lib.js";

const LAMBDAS = { "1550": { a: 0.2, t: "1550 nm · monomode (0,20 dB/km)" }, "1310": { a: 0.35, t: "1310 nm · monomode (0,35 dB/km)" }, "850": { a: 2.5, t: "850 nm · multimode (2,5 dB/km)" } };
const PC = 0.5, PS = 0.1, MARGE = 3;    // pertes prudentes : connecteur, soudure ; marge de sécurité

export default function (el) {
  const st = { p0: 0, l: "1550", L: 40, nc: 2, ns: 4, s: -28 };
  const cv = canvas(el, { height: w => (w < 560 ? 250 : 300) });
  const pl = new Plot(cv, { xlabel: "distance (km)", ylabel: "puissance (dBm)", nx: 6, ny: 5 });
  const ctl = controls(el);
  select(ctl, { label: "longueur d'onde & fibre", options: Object.entries(LAMBDAS).map(([k, v]) => [k, v.t]), value: st.l, oninput: v => { st.l = v; draw(); } });
  slider(ctl, { label: "puissance émise", min: -6, max: 6, step: 0.5, value: st.p0, unit: "dBm", fmt: v => fix(v, 1), oninput: v => { st.p0 = v; draw(); } });
  slider(ctl, { label: "longueur de fibre", min: 0.5, max: 120, step: 0.5, value: st.L, unit: "km", fmt: v => fmt(v, 3), oninput: v => { st.L = v; draw(); } });
  slider(ctl, { label: "connecteurs (0,5 dB)", min: 0, max: 8, step: 1, value: st.nc, unit: "", fmt: v => String(Math.round(v)), oninput: v => { st.nc = Math.round(v); draw(); } });
  slider(ctl, { label: "soudures (0,1 dB)", min: 0, max: 20, step: 1, value: st.ns, unit: "", fmt: v => String(Math.round(v)), oninput: v => { st.ns = Math.round(v); draw(); } });
  slider(ctl, { label: "sensibilité du récepteur", min: -34, max: -10, step: 1, value: st.s, unit: "dBm", fmt: v => String(Math.round(v)), oninput: v => { st.s = Math.round(v); draw(); } });
  const ro = readouts(el, [["pf", "pertes fibre"], ["pt", "pertes totales"], ["pr", "puissance reçue"], ["m", "marge restante"]]);
  const nt = note(el, "");

  function draw() {
    const a = LAMBDAS[st.l].a, L = st.L, c1 = Math.ceil(st.nc / 2), c2 = st.nc - c1;
    const xs = [0], ys = [st.p0];
    let p = st.p0 - c1 * PC; xs.push(0); ys.push(p);
    for (let k = 1; k <= st.ns; k++) { const x = L * k / (st.ns + 1); p -= a * (x - xs[xs.length - 1]); xs.push(x); ys.push(p); p -= PS; xs.push(x); ys.push(p); }
    p -= a * (L - xs[xs.length - 1]); xs.push(L); ys.push(p); p -= c2 * PC; xs.push(L); ys.push(p);
    const pr = p, marge = pr - st.s, pf = a * L, pt = st.p0 - pr;
    const y0 = Math.floor(Math.min(st.s - 2, pr - 2)), y1 = Math.ceil(st.p0 + 2);
    pl.set({ x0: 0, x1: L, y0, y1 }).clear().axes();
    pl.area(xs, ys, { base: y0, color: C.red, alpha: 0.08 });
    pl.line(xs, ys, { color: C.red, width: 2.8 });
    pl.hline(st.s, { color: C.ink, label: "sensibilité" });
    pl.hline(st.s + MARGE, { color: C.orange, dash: [3, 4], label: "+ 3 dB de marge", hand: true });
    pl.points([L], [pr], { color: marge >= MARGE ? C.green : C.red, r: 5, ring: true });
    ro("pf", fix(pf, 2) + " dB"); ro("pt", fix(pt, 2) + " dB"); ro("pr", fix(pr, 2) + " dBm"); ro("m", fix(marge, 1) + " dB", marge < MARGE);
    nt.textContent = marge < 0 ? "La lumière arrive sous la sensibilité : la liaison ne fonctionne pas. Raccourcis, change de longueur d'onde ou retire des connecteurs."
      : marge < MARGE ? "Ça passe… de justesse : sans marge, le moindre connecteur sale ou le vieillissement de la source coupera la liaison."
      : st.l === "850" && L > 2 ? "Le multimode à 850 nm perd beaucoup et sa bande passante limite aussi la distance : il sert surtout à l'intérieur des bâtiments."
      : `Marge confortable. En dB, tout s'additionne : ${fix(pf, 1)} dB de fibre + ${fix(st.nc * PC, 1)} dB de connecteurs + ${fix(st.ns * PS, 1)} dB de soudures.`;
  }
  cv.onresize = draw; draw();
}
