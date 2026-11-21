// Sensibilité des photodiodes selon la longueur d'onde, et l'erreur d'un puissance-mètre mal réglé.
// Courbes typiques (indicatives) : R(λ) = η(λ)·λ[nm]/1239,84, avec un rendement quantique η qui chute
// aux courtes longueurs d'onde et s'effondre au-delà de la coupure du matériau (gap).
import { C, canvas, controls, slider, select, readouts, note, Plot, fmt, lambdaColor } from "../lib.js";

const sig = x => 1 / (1 + Math.exp(-x));
const MAT = {
  si: { t: "silicium (Si)", col: C.sky, eta: l => 0.82 * (l > 250 ? 1 - Math.exp(-(l - 250) / 180) : 0) * sig(-(l - 1040) / 28) },
  ge: { t: "germanium (Ge)", col: C.green, eta: l => 0.68 * (l > 400 ? 1 - Math.exp(-(l - 400) / 250) : 0) * sig(-(l - 1700) / 40) },
  ingaas: { t: "InGaAs", col: C.violet, eta: l => 0.78 * sig((l - 900) / 40) * sig(-(l - 1660) / 22) }
};
const R = (m, l) => MAT[m].eta(l) * l / 1239.84;

export default function (el) {
  const st = { m: "si", vrai: 850, regle: 633 };
  const cv = canvas(el, { height: w => (w < 560 ? 250 : 300) });
  const pl = new Plot(cv, { x0: 400, x1: 1800, y0: 0, y1: 1.15, xlabel: "longueur d'onde (nm)", ylabel: "sensibilité (A/W)", nx: 7, ny: 5 });
  const ctl = controls(el);
  select(ctl, { label: "tête du puissance-mètre", options: Object.entries(MAT).map(([k, v]) => [k, v.t]), value: st.m, oninput: v => { st.m = v; draw(); } });
  slider(ctl, { label: "longueur d'onde réelle du laser", min: 400, max: 1800, step: 1, value: st.vrai, unit: "nm", fmt: v => String(Math.round(v)), oninput: v => { st.vrai = v; draw(); } });
  slider(ctl, { label: "longueur d'onde réglée sur l'appareil", min: 400, max: 1800, step: 1, value: st.regle, unit: "nm", fmt: v => String(Math.round(v)), oninput: v => { st.regle = v; draw(); } });
  const ro = readouts(el, [["rv", "R à la vraie λ"], ["rr", "R à la λ réglée"], ["aff", "affiché pour 1 mW réel"], ["err", "erreur"]]);
  const nt = note(el, "");
  function draw() {
    pl.clear().axes();
    Object.entries(MAT).forEach(([k, m]) => pl.fn(l => R(k, l), { color: m.col, width: k === st.m ? 3.2 : 1.6, alpha: k === st.m ? 1 : 0.45 }));
    pl.vline(st.vrai, { color: st.vrai >= 400 && st.vrai <= 780 ? lambdaColor(st.vrai) : C.ir, dash: [1, 0], width: 2.2, label: "laser" });
    pl.vline(st.regle, { color: C.orange, label: "réglage", dy: 18, hand: true });
    pl.legend(Object.values(MAT).map(m => ({ label: m.t, color: m.col })));
    const rv = R(st.m, st.vrai), rr = R(st.m, st.regle);
    const aff = rr > 0.005 ? rv / rr : NaN, err = (aff - 1) * 100;
    ro("rv", fmt(rv, 3) + " A/W", rv < 0.05); ro("rr", fmt(rr, 3) + " A/W");
    ro("aff", isFinite(aff) ? fmt(aff, 3) + " mW" : "—"); ro("err", isFinite(err) ? (err > 0 ? "+" : "") + fmt(err, 3) + " %" : "—", Math.abs(err) > 5);
    nt.textContent = rv < 0.05 ? `Ce détecteur est presque aveugle à ${Math.round(st.vrai)} nm : change de tête (le silicium ne voit plus rien au-delà de 1100 nm).`
      : Math.abs(err) < 2 ? "Réglage correct : l'appareil divise le photocourant par la bonne sensibilité."
      : `L'appareil divise le photocourant par la sensibilité à ${Math.round(st.regle)} nm au lieu de ${Math.round(st.vrai)} nm : la lecture est fausse de ${fmt(Math.abs(err), 2)} %. Premier réflexe avant toute mesure : régler la longueur d'onde.`;
  }
  cv.onresize = draw; draw();
}
