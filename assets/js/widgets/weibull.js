// Loi de Weibull : fiabilité R(t), taux de défaillance λ(t), MTBF, durée B10 et disponibilité
import { C, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

function gamma(z) { // approximation de Lanczos
  const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1; let x = p[0]; for (let i = 1; i < g + 2; i++) x += p[i] / (z + i); const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
export default function (el) {
  const st = { beta: 2, eta: 20000, t0: 5000, mttr: 8 };
  const cr = canvas(el, { height: 220 });
  const cl = canvas(el, { height: 180 });
  const ctl = controls(el);
  slider(ctl, { label: "paramètre de forme β", min: 0.4, max: 5, step: 0.05, value: st.beta, fmt: v => fmt(v, 3), oninput: v => { st.beta = v; draw(); } });
  slider(ctl, { label: "paramètre d'échelle η", min: 1000, max: 100000, log: true, value: st.eta, unit: "h", fmt: v => fmt(v, 3), oninput: v => { st.eta = v; draw(); } });
  slider(ctl, { label: "instant observé t", min: 100, max: 100000, log: true, value: st.t0, unit: "h", fmt: v => fmt(v, 3), oninput: v => { st.t0 = v; draw(); } });
  slider(ctl, { label: "MTTR (temps moyen de réparation)", min: 0.5, max: 200, log: true, value: st.mttr, unit: "h", fmt: v => fmt(v, 3), oninput: v => { st.mttr = v; draw(); } });
  const ro = readouts(el, [["r", "fiabilité R(t)"], ["mtbf", "MTBF = η·Γ(1+1/β)"], ["b10", "durée B10 (R = 90 %)"], ["d", "disponibilité"]]);
  const nt = note(el, "");
  const R = t => Math.exp(-Math.pow(t / st.eta, st.beta)), lam = t => st.beta / st.eta * Math.pow(t / st.eta, st.beta - 1);
  function draw() {
    const tmax = st.eta * 3;
    const p = new Plot(cr, { x0: 0, x1: tmax, y0: 0, y1: 1.05, xlabel: "temps (h)", ylabel: "R(t)", xfmt: v => fmt(v, 3) });
    cr.clear(); p.axes(); p.fn(R, { color: C.orange, width: 3 }); p.hline(0.9, { color: C.mist, label: "90 %", dash: [3, 4] });
    const b10 = st.eta * Math.pow(-Math.log(0.9), 1 / st.beta); p.vline(b10, { color: C.sky, label: "B10", hand: true });
    if (st.t0 <= tmax) p.points([st.t0], [R(st.t0)], { r: 5.5 });
    const lmax = Math.max(lam(tmax * 0.98), lam(tmax * 0.02)) * 1.2;
    const q = new Plot(cl, { x0: tmax * 0.01, x1: tmax, y0: 0, y1: lmax, xlabel: "temps (h)", ylabel: "λ(t) (1/h)", yfmt: v => fmt(v, 2) });
    cl.clear(); q.axes(); q.fn(lam, { color: C.red, width: 2.6 });
    const mtbf = st.eta * gamma(1 + 1 / st.beta);
    ro("r", fmt(100 * R(st.t0), 4) + " %"); ro("mtbf", fmt(mtbf, 4) + " h"); ro("b10", fmt(b10, 4) + " h"); ro("d", fmt(100 * mtbf / (mtbf + st.mttr), 5) + " %");
    nt.textContent = st.beta < 0.95 ? "β < 1 : défaillances de jeunesse (λ décroît) → déverminage, contrôles à réception ; une maintenance préventive systématique serait inutile, voire néfaste." : st.beta < 1.05 ? "β ≈ 1 : défaillances au hasard (λ constant, loi exponentielle) → changer préventivement ne sert à rien ; il faut de la redondance et des pièces de rechange." : "β > 1 : usure (λ croît) → la maintenance préventive (systématique ou conditionnelle) devient rentable, par exemple avant la durée B10.";
  }
  cr.onresize = draw; cl.onresize = draw; draw();
}
