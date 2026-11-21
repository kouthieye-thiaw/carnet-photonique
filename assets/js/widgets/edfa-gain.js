// Spectre de gain d'un EDFA en fonction de l'inversion et de la longueur de fibre (sections efficaces modélisées)
import { C, canvas, Plot, controls, slider, toggle, readouts, fmt, note } from "../lib.js";

const g = (l, c, w) => Math.exp(-(((l - c) / w) ** 2));
const se = l => 1.0 * g(l, 1531, 5) + 0.46 * g(l, 1551, 15) + 0.14 * g(l, 1585, 24);
const sa = l => 0.95 * g(l, 1530, 6) + 0.36 * g(l, 1510, 17) + 0.07 * g(l, 1556, 17);

export default function (el) {
  const st = { n2: 0.75, L: 15, gff: false };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "inversion (fraction d'ions excités)", min: 0, max: 1, step: 0.01, value: st.n2, fmt: v => fmt(100 * v, 3) + " %", oninput: v => { st.n2 = v; draw(); } });
  slider(ctl, { label: "longueur de fibre dopée", min: 2, max: 60, step: 0.5, value: st.L, unit: "m", fmt: v => fmt(v, 3), oninput: v => { st.L = v; draw(); } });
  toggle(ctl, { label: "filtre d'égalisation du gain (GFF)", value: false, oninput: v => { st.gff = v; draw(); } });
  const ro = readouts(el, [["pk", "gain max"], ["lp", "à la longueur d'onde"], ["c", "gain moyen bande C"], ["fl", "ondulation 1535–1560 nm"]]);
  const nt = note(el, "");
  const K = 2.6; // dB par mètre à inversion totale, au pic
  const G = l => K * st.L * (st.n2 * se(l) - (1 - st.n2) * sa(l));
  function draw() {
    const xs = [], ys = []; for (let l = 1500; l <= 1610; l += 0.5) { xs.push(l); ys.push(G(l)); }
    let ref = 0, cnt = 0; for (let l = 1535; l <= 1560; l += 0.5) { ref += G(l); cnt++; } ref /= cnt;
    const yf = st.gff ? xs.map((l, i) => (l >= 1528 && l <= 1565 ? Math.min(ys[i], ref) : ys[i])) : ys;
    const ymax = Math.max(10, ...yf) * 1.15, ymin = Math.min(-10, ...yf) * 1.1;
    const p = new Plot(cv, { x0: 1500, x1: 1610, y0: Math.max(ymin, -60), y1: Math.min(ymax, 80), xlabel: "longueur d'onde (nm)", ylabel: "gain (dB)" });
    cv.clear(); p.axes();
    p.clip(c => { c.fillStyle = "rgba(34,197,94,.08)"; c.fillRect(p.X(1530), p.T, p.X(1565) - p.X(1530), p.B - p.T); c.fillStyle = "rgba(59,130,246,.06)"; c.fillRect(p.X(1570), p.T, p.X(1605) - p.X(1570), p.B - p.T); });
    p.at(1547, Math.min(ymax, 80) * 0.93, "bande C", { align: "center", hand: true, color: C.green }); p.at(1588, Math.min(ymax, 80) * 0.93, "bande L", { align: "center", hand: true, color: C.sky });
    p.hline(0, { color: C.ink, dash: [2, 3] });
    p.line(xs, yf, { color: C.orange, width: 3 });
    let pk = -1e9, lp = 0; xs.forEach((l, i) => { if (yf[i] > pk) { pk = yf[i]; lp = l; } });
    let mn = 1e9, mx = -1e9; xs.forEach((l, i) => { if (l >= 1535 && l <= 1560) { mn = Math.min(mn, yf[i]); mx = Math.max(mx, yf[i]); } });
    ro("pk", fmt(pk, 3) + " dB"); ro("lp", fmt(lp, 4) + " nm"); ro("c", fmt(ref, 3) + " dB"); ro("fl", fmt(mx - mn, 3) + " dB", mx - mn > 1);
    nt.textContent = st.n2 < 0.4 ? "inversion faible : la fibre absorbe à 1530 nm et n'amplifie que vers les grandes longueurs d'onde — c'est le principe des amplis bande L (fibre longue, inversion modérée)." : st.gff ? "le filtre d'égalisation « rabote » le pic de 1530 nm pour que tous les canaux DWDM aient le même gain." : "inversion forte : gros pic vers 1530 nm et plateau 1540–1560 nm. Les canaux ne sont pas amplifiés pareil : il faut égaliser.";
  }
  cv.onresize = draw; draw();
}
