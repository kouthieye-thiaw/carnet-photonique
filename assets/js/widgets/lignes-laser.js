// Carte des longueurs d'onde des grandes familles de lasers (échelle log), cliquable
import { C, F, canvas, fmt, lambdaColor, text, rrect } from "../lib.js";

const L = [
  { n: "excimère ArF", l: 193, fam: "gaz", d: "UV profond, impulsions ns : lithographie des puces, chirurgie réfractive (LASIK)." },
  { n: "Nd:YAG triplé", l: 355, fam: "converti", d: "1064 nm / 3 : micro-usinage, marquage fin, LIDAR atmosphérique." },
  { n: "diode GaN", l: 405, fam: "semi", d: "Violet : Blu-ray, lithographie directe, excitation de fluorescence." },
  { n: "argon ionisé", l: 488, fam: "gaz", d: "Bleu-vert historique (488/514 nm), remplacé par les diodes et les DPSS." },
  { n: "Nd doublé (DPSS)", l: 532, fam: "converti", d: "Vert : pointeurs, pompage de Ti:Sa, ophtalmologie, spectacles." },
  { n: "hélium-néon", l: 632.8, fam: "gaz", d: "La référence d'alignement et de métrologie : stable, TEM₀₀, quelques mW." },
  { n: "diode AlGaInP", l: 650, fam: "semi", d: "Rouge bon marché : lecteurs, niveaux laser… et ton banc de test." },
  { n: "Ti:saphir", l: 800, fam: "solide", d: "Accordable 650–1100 nm et impulsions femtosecondes : le laser des labos d'ultrarapide." },
  { n: "diode 780 nm / ECDL", l: 780, fam: "semi", d: "Raie du rubidium : atomes froids, horloges, capteurs quantiques. Souvent en cavité externe." },
  { n: "diode de pompe 808", l: 808, fam: "semi", d: "Pompe du Nd:YAG, de dizaines de mW à des kW en barrettes." },
  { n: "VCSEL 850", l: 850, fam: "semi", d: "Datacom multimode, souris, capteurs de proximité, Face ID." },
  { n: "pompe 976 nm", l: 976, fam: "semi", d: "Pompe des fibres Yb et Er : stabilisée par réseau de Bragg (VBG/FBG)." },
  { n: "Yb fibre / Yb:YAG", l: 1030, fam: "fibre", d: "Lasers industriels de découpe et soudure (kW), femtosecondes industriels." },
  { n: "Nd:YAG", l: 1064, fam: "solide", d: "Le classique : marquage, découpe, LIDAR, médecine ; doublé en vert." },
  { n: "DFB 1310", l: 1310, fam: "semi", d: "Télécoms courte/moyenne distance (dispersion nulle de la fibre)." },
  { n: "DFB 1550 / Er fibre", l: 1550, fam: "fibre", d: "Télécoms longue distance, amplifiés par EDFA ; LIDAR « sans danger rétinien »." },
  { n: "thulium fibre", l: 2000, fam: "fibre", d: "2 µm : chirurgie (absorbé par l'eau), découpe des plastiques, pompage d'OPO." },
  { n: "Er:YAG", l: 2940, fam: "solide", d: "Pic d'absorption de l'eau : dentisterie, dermatologie." },
  { n: "QCL", l: 4500, fam: "semi", d: "Laser à cascade quantique : moyen IR 3–20 µm, détection de gaz (CO, NO, CH₄)." },
  { n: "CO₂", l: 10600, fam: "gaz", d: "Découpe des non-métaux (bois, acrylique, tissus), chirurgie ; rendement ~15 %." }
];
const FAM = { gaz: C.sky, solide: C.pink, fibre: C.green, semi: C.orange, converti: C.violet };

export default function (el) {
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 260) });
  const info = document.createElement("div"); info.className = "lab-note"; info.style.fontFamily = "var(--font-gelica)"; info.style.fontSize = "18px"; info.style.color = "var(--ink)";
  info.innerHTML = "<b>clique sur un laser</b> pour voir à quoi il sert.";
  el.appendChild(info);
  let sel = -1, hits = [];
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const x0 = 30, x1 = w - 30, lo = Math.log10(170), hi = Math.log10(12000), X = l => x0 + (x1 - x0) * (Math.log10(l) - lo) / (hi - lo);
    const yb = h - 50;
    for (let l = 170; l < 12000; l *= 1.02) { c.fillStyle = l >= 380 && l <= 780 ? lambdaColor(l, .9) : l < 380 ? "rgba(124,58,237,.15)" : "rgba(143,42,20,.12)"; c.fillRect(X(l), yb, X(l * 1.02) - X(l) + 0.6, 16); }
    c.strokeStyle = C.ink; c.lineWidth = 1.2; rrect(c, x0, yb, x1 - x0, 16, 4); c.stroke();
    [200, 400, 700, 1000, 2000, 5000, 10000].forEach(l => { text(c, X(l), yb + 30, l >= 1000 ? fmt(l / 1000, 2) + " µm" : l + " nm", { size: 11, color: C.soft }); });
    hits = [];
    const rows = w < 640 ? 5 : 4;
    L.forEach((it, i) => {
      const x = X(it.l), row = i % rows, y = 26 + row * ((yb - 46) / rows);
      c.strokeStyle = FAM[it.fam]; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, y + 12); c.lineTo(x, yb); c.stroke();
      c.font = F.ui(12, 500); const tw = c.measureText(it.n).width + 14;
      const bx = Math.max(4, Math.min(w - tw - 4, x - tw / 2));
      c.fillStyle = i === sel ? C.cocoa : C.paper; rrect(c, bx, y - 2, tw, 22, 11); c.fill(); c.strokeStyle = FAM[it.fam]; c.lineWidth = 2; c.stroke();
      c.fillStyle = i === sel ? C.paper : C.ink; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(it.n, bx + 7, y + 9);
      hits.push({ i, x: bx, y: y - 2, w: tw, h: 22 });
    });
    let lx = x0; Object.entries({ gaz: "gaz", solide: "solide", fibre: "fibre", semi: "semi-conducteur", converti: "converti en fréquence" }).forEach(([k, t]) => { c.fillStyle = FAM[k]; c.beginPath(); c.arc(lx + 5, h - 8, 5, 0, 7); c.fill(); c.fillStyle = C.soft; c.font = F.ui(11.5); c.textAlign = "left"; c.fillText(t, lx + 14, h - 8); lx += c.measureText(t).width + 34; });
  }
  cv.c.addEventListener("click", e => { const r = cv.c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; const hit = hits.find(hh => x >= hh.x && x <= hh.x + hh.w && y >= hh.y && y <= hh.y + hh.h); if (hit) { sel = hit.i; const it = L[sel]; info.innerHTML = `<b>${it.n} — ${it.l >= 1000 ? fmt(it.l / 1000, 3) + " µm" : it.l + " nm"}</b> · ${it.d}`; draw(); } });
  cv.c.style.cursor = "pointer"; cv.onresize = draw; draw();
}
