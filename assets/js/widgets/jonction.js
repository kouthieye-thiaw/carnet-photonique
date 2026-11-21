// Diagramme de bandes d'une jonction PN : polarisation directe (LED/laser) ou inverse (photodiode)
import { C, canvas, controls, slider, select, toggle, readouts, loop, fmt, text, lambdaColor, note } from "../lib.js";

const MATS = { GaAs: 1.42, "AlGaAs (Al 30 %)": 1.80, "InGaAsP (1550)": 0.80, "InGaN (bleu)": 2.75, "GaN": 3.40, "Si (gap indirect)": 1.12 };
export default function (el) {
  const st = { mat: "GaAs", V: 0.6, light: false };
  const cv = canvas(el, { height: 300 });
  const ctl = controls(el);
  select(ctl, { label: "matériau", value: st.mat, options: Object.keys(MATS).map(k => [k, k + " — " + MATS[k] + " eV"]), oninput: v => { st.mat = v; } });
  slider(ctl, { label: "tension appliquée (× tension de diffusion)", min: -1.5, max: 0.95, step: 0.01, value: st.V, fmt: v => (v >= 0 ? "directe " : "inverse ") + fmt(Math.abs(v), 2), oninput: v => { st.V = v; } });
  toggle(ctl, { label: "éclairer la jonction", value: false, oninput: v => { st.light = v; } });
  const ro = readouts(el, [["eg", "gap"], ["l", "λ émise ≈ 1240/Eg"], ["mode", "fonctionnement"]]);
  const nt = note(el, "");
  let parts = [];
  loop(el, (t, dt) => {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const Eg = MATS[st.mat], lam = 1240 / Eg, indirect = st.mat.startsWith("Si");
    const step = 70 * (1 - st.V), mid = w / 2, wd = 40 * Math.sqrt(Math.max(0.15, 1 - st.V)), gap = 80;
    const Ec = x => { const s = 1 / (1 + Math.exp(-(x - mid) / (wd / 3))); return 80 + step * s; };
    const Ev = x => Ec(x) + gap;
    c.fillStyle = "rgba(255,111,30,.06)"; c.fillRect(mid - wd, 40, 2 * wd, h - 80);
    text(c, mid, 30, "zone de charge d'espace", { size: 12, color: C.soft });
    text(c, 40, h - 20, "côté P (trous)", { align: "left", size: 13 }); text(c, w - 40, h - 20, "côté N (électrons)", { align: "right", size: 13 });
    [[Ec, "bande de conduction"], [Ev, "bande de valence"]].forEach(([f, l]) => { c.strokeStyle = C.ink; c.lineWidth = 2.2; c.beginPath(); for (let x = 20; x <= w - 20; x += 4) { const y = f(x); x === 20 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); text(c, 26, f(20) - 10, l, { align: "left", size: 11.5, color: C.soft }); });
    // porteurs
    if (Math.random() < dt * 30 && parts.length < 90) {
      const fwd = st.V > 0.2;
      if (fwd) { parts.push({ k: "e", x: w - 30 - Math.random() * 80, v: -90 - Math.random() * 60, a: 1 }); parts.push({ k: "h", x: 30 + Math.random() * 80, v: 90 + Math.random() * 60, a: 1 }); }
      if (st.light && Math.random() < 0.5) { const x = mid + (Math.random() - .5) * wd * 1.6; parts.push({ k: "e", x, v: 120, a: 1, gen: 1 }); parts.push({ k: "h", x, v: -120, a: 1, gen: 1 }); }
    }
    parts.forEach(p => {
      if (p.k === "e") { const y = Ec(p.x) - 7; p.x += p.v * dt * (p.gen ? 1 : Math.max(0.1, st.V)); if (!p.gen && p.x < mid - wd * 0.3) { p.a -= dt * 3; if (!p.em && Math.random() < 0.3) { p.em = 1; parts.push({ k: "ph", x: p.x, y: (Ec(p.x) + Ev(p.x)) / 2, a: 1, dx: (Math.random() - .5) * 2, dy: -1 }); } } c.globalAlpha = Math.max(0, p.a); c.fillStyle = C.sky; c.beginPath(); c.arc(p.x, y, 4.5, 0, 7); c.fill(); c.globalAlpha = 1; }
      else if (p.k === "h") { const y = Ev(p.x) + 7; p.x += p.v * dt * (p.gen ? 1 : Math.max(0.1, st.V)); if (!p.gen && p.x > mid + wd * 0.3) p.a -= dt * 3; c.globalAlpha = Math.max(0, p.a); c.strokeStyle = C.orange; c.lineWidth = 2; c.beginPath(); c.arc(p.x, y, 4.5, 0, 7); c.stroke(); c.globalAlpha = 1; }
      else { p.x += p.dx * 60 * dt; p.y += p.dy * 70 * dt; p.a -= dt * 0.8; if (indirect) p.a -= dt * 3; c.globalAlpha = Math.max(0, p.a); c.strokeStyle = lam > 780 ? C.ir : lambdaColor(lam); c.lineWidth = 2.2; c.beginPath(); for (let q = 0; q < 9; q++) { const xx = p.x + q * 2 * p.dx, yy = p.y + q * 2 * p.dy + Math.sin(q * 1.4 + t * 18) * 3; q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); c.globalAlpha = 1; }
      if (p.gen && (p.x < 10 || p.x > w - 10)) p.a = 0;
    });
    parts = parts.filter(p => p.a > 0 && p.x > 0 && p.x < w && (p.y === undefined || p.y > 0));
    if (st.light) { c.strokeStyle = C.red; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const x = mid - 24 + k * 24; c.beginPath(); for (let q = 0; q < 12; q++) { const yy = 6 + q * 3, xx = x + Math.sin(q * 1.3 + t * 12) * 3; q ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } }
    const mode = st.V > 0.2 ? (indirect ? "directe : chaleur surtout" : "directe : émission (LED / laser)") : st.V < -0.05 ? (st.light ? "inverse éclairée : photodiode" : "inverse : bloquée") : "quasi à l'équilibre";
    ro("eg", fmt(Eg, 3) + " eV"); ro("l", fmt(lam, 4) + " nm"); ro("mode", mode);
    nt.textContent = indirect && st.V > 0.2 ? "silicium : gap indirect, les recombinaisons produisent surtout de la chaleur — on n'en fait pas de lasers." : st.V > 0.2 ? "en direct, électrons (bleus) et trous (cercles orange) se rencontrent dans la zone active et se recombinent en émettant des photons d'énergie ≈ Eg." : st.light ? "en inverse, chaque photon absorbé crée une paire électron-trou que le champ sépare : c'est le photocourant." : "en inverse sans lumière, il ne passe qu'un minuscule courant de fuite (courant d'obscurité).";
  });
}
