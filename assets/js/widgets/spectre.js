// Longueur d'onde -> couleur, fréquence, énergie du photon, flux de photons, sensibilité de l'œil
import { C, F, canvas, controls, slider, readouts, fmt, lambdaColor, text, rrect, note } from "../lib.js";

const H = 6.62607015e-34, CL = 299792458, Q = 1.602176634e-19;
function bande(nm) {
  if (nm < 315) return "UV-B / UV-C"; if (nm < 400) return "UV-A (proche UV)"; if (nm < 450) return "violet"; if (nm < 495) return "bleu";
  if (nm < 570) return "vert"; if (nm < 590) return "jaune"; if (nm < 620) return "orange"; if (nm < 780) return "rouge";
  if (nm < 1260) return "proche infrarouge (IR-A)"; if (nm < 1360) return "IR — bande télécom O"; if (nm < 1460) return "IR — bande E";
  if (nm < 1530) return "IR — bande S"; if (nm < 1565) return "IR — bande C (EDFA)"; if (nm < 1625) return "IR — bande L"; return "infrarouge (IR-B)";
}
const V = nm => (nm < 380 || nm > 780) ? 0 : 1.019 * Math.exp(-285.4 * Math.pow(nm / 1000 - 0.559, 2));

export default function (el) {
  const st = { nm: 650, mw: 5 };
  const cv = canvas(el, { height: 190 });
  const ctl = controls(el);
  slider(ctl, { label: "longueur d'onde λ", min: 250, max: 2000, step: 1, value: st.nm, unit: "nm", fmt: v => fmt(v, 4), oninput: v => { st.nm = v; draw(); } });
  slider(ctl, { label: "puissance du faisceau", min: 0.01, max: 1000, log: true, value: st.mw, unit: "mW", fmt: v => fmt(v, 3), oninput: v => { st.mw = v; draw(); } });
  const ro = readouts(el, [["nu", "fréquence ν"], ["ev", "énergie du photon"], ["j", "en joules"], ["n", "photons par seconde"], ["v", "sensibilité de l'œil"]]);
  const nt = note(el, "");
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const x0 = 24, x1 = w - 24, L0 = 250, L1 = 2000, X = nm => x0 + (x1 - x0) * (nm - L0) / (L1 - L0);
    // bande spectrale
    for (let nm = L0; nm < L1; nm += 2) { c.fillStyle = nm >= 380 && nm <= 780 ? lambdaColor(nm) : nm < 380 ? "rgba(124,58,237,.18)" : "rgba(143,42,20,.13)"; c.fillRect(X(nm), 50, X(nm + 2) - X(nm) + 0.5, 46); }
    c.strokeStyle = C.ink; c.lineWidth = 1.5; rrect(c, x0, 50, x1 - x0, 46, 6); c.stroke();
    // courbe de sensibilité de l'œil
    c.strokeStyle = C.ink; c.lineWidth = 1.6; c.setLineDash([4, 3]); c.beginPath();
    for (let nm = 380; nm <= 780; nm += 2) { const y = 96 - 44 * V(nm); nm === 380 ? c.moveTo(X(nm), y) : c.lineTo(X(nm), y); } c.stroke(); c.setLineDash([]);
    text(c, X(555), 40, "sensibilité de l'œil", { size: 11.5, color: C.soft });
    [[405, "405"], [532, "532"], [650, "650"], [808, "808"], [1064, "1064"], [1310, "1310"], [1550, "1550"]].forEach(([nm, t]) => { c.fillStyle = C.soft; c.fillRect(X(nm), 96, 1, 6); text(c, X(nm), 112, t, { size: 11, color: C.soft }); });
    text(c, X(330), 72, "UV", { size: 12, color: C.cocoa }); text(c, X(1300), 72, "infrarouge (invisible)", { size: 12, color: C.cocoa });
    // marqueur
    const xm = X(st.nm); c.fillStyle = C.ink; c.beginPath(); c.moveTo(xm, 46); c.lineTo(xm - 7, 34); c.lineTo(xm + 7, 34); c.fill();
    c.strokeStyle = C.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(xm, 46); c.lineTo(xm, 100); c.stroke();
    // pastille couleur
    const col = st.nm >= 380 && st.nm <= 780 ? lambdaColor(st.nm) : "#e9e0d8";
    c.fillStyle = col; rrect(c, x0, 132, 64, 40, 10); c.fill(); c.strokeStyle = C.ink; c.lineWidth = 1.5; c.stroke();
    text(c, x0 + 78, 152, bande(st.nm), { hand: true, size: 24, align: "left", color: C.cocoa });
    const nu = CL / (st.nm * 1e-9), E = H * nu, n = st.mw * 1e-3 / E;
    ro("nu", fmt(nu / 1e12, 4) + " THz"); ro("ev", fmt(E / Q, 4) + " eV"); ro("j", fmt(E, 3) + " J"); ro("n", fmt(n, 3)); ro("v", fmt(100 * V(st.nm), 3) + " %", st.nm > 700 && st.nm < 1400);
    nt.textContent = st.nm >= 400 && st.nm <= 1400 && V(st.nm) < 0.01 ? "invisible mais focalisé sur la rétine (zone 400–1400 nm) : le plus traître des dangers." : st.nm > 1400 ? "au-delà de 1400 nm, absorbé avant la rétine (cornée, cristallin) : risque thermique de surface." : st.nm < 400 ? "UV : photochimique (cornée, cristallin, peau)." : V(st.nm) > 0.5 ? "très visible : à puissance égale, un vert paraît bien plus lumineux qu'un rouge." : "visible : le réflexe palpébral (≈ 0,25 s) protège un peu, jusqu'à quelques mW seulement.";
  }
  cv.onresize = draw; draw();
}
