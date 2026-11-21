// Nomenclature interactive du banc : version économique / version labo, « déjà en ma possession », totaux par catégorie
import { readouts, fmt, note } from "../lib.js";

const ITEMS = [
  ["raspberry & calcul", "Raspberry Pi 5 (4 Go)", "le contrôleur du banc", 1, 65, 65],
  ["raspberry & calcul", "Alimentation officielle USB-C 27 W", "la Pi 5 en a besoin (jusqu'à 5 A)", 1, 13, 13],
  ["raspberry & calcul", "Carte microSD 64 Go (A2)", "système et données", 1, 12, 12],
  ["raspberry & calcul", "Ventilateur actif pour Pi 5", "évite le bridage thermique", 1, 6, 6],
  ["raspberry & calcul", "Caméra HQ (IMX477, pixels de 1,55 µm)", "profil de faisceau et M², sans objectif", 1, 55, 55],
  ["raspberry & calcul", "Camera Module 3", "capteur du spectromètre", 1, 28, 28],
  ["raspberry & calcul", "Câbles caméra pour Pi 5 (22 → 15 broches)", "connecteurs CSI de la Pi 5", 2, 3, 3],
  ["laser & optique", "Diode laser 650 nm 5–7 mW, TO-56, avec photodiode moniteur", "l'objet testé (+ une de rechange)", 2, 4, 25],
  ["laser & optique", "Collimation : barillet 12 mm avec lentille (éco) / tube + asphérique f ≈ 4,5 mm (labo)", "rendre le faisceau parallèle", 1, 6, 90],
  ["laser & optique", "Monture régulée : bloc alu + Peltier 15 × 15 mm + CTN 10 kΩ + dissipateur + ventilateur (éco) / monture TO-56 à Peltier du commerce (labo)", "tenir la diode à température", 1, 25, 350],
  ["laser & optique", "Prélèvement : lame de verre à 45° (~8 %) (éco) / séparatrice 90:10 non polarisante (labo)", "envoyer une fraction connue vers la photodiode", 1, 2, 110],
  ["laser & optique", "Photodiodes Si PIN grande surface (type BPW34)", "mesure de puissance (+ rechange)", 2, 2, 30],
  ["laser & optique", "Polariseur film + monture rotative (impression 3D) + poulie GT2 + courroie", "mesure du taux d'extinction", 1, 12, 90],
  ["laser & optique", "Densités neutres (jeu OD 0,5 à 4)", "protéger la caméra de la saturation", 1, 15, 160],
  ["laser & optique", "Diaphragmes iris", "matérialiser l'axe d'alignement", 2, 20, 110],
  ["laser & optique", "Réseau de transmission 1000 traits/mm + fente", "spectromètre maison", 1, 12, 60],
  ["laser & optique", "Piège à faisceau", "terminer chaque faisceau", 1, 5, 70],
  ["laser & optique", "Cartes de visualisation / cibles", "voir le faisceau sans l'œil", 1, 5, 25],
  ["mécanique", "Plaque support M6 (alu 10 mm taraudée) / breadboard 300 × 450", "tout fixer, au pas de 25 mm", 1, 45, 280],
  ["mécanique", "Poteaux, porte-poteaux, brides (lot)", "hauteur de faisceau constante", 1, 25, 180],
  ["mécanique", "Platine linéaire 150 mm (vis T8 + rail + chariot + NEMA17)", "déplacer la caméra (caustique)", 1, 40, 450],
  ["mécanique", "Driver pas à pas TMC2209", "moteur silencieux, micro-pas", 1, 6, 15],
  ["mécanique", "Moteur 28BYJ-48 + carte ULN2003", "rotation du polariseur", 1, 4, 4],
  ["mécanique", "Fins de course / capteur d'origine", "référence de position", 2, 2, 6],
  ["électronique", "Module ADS1115 (ADC 16 bits I²C)", "mesures analogiques", 2, 4, 15],
  ["électronique", "Module MCP4725 (DAC 12 bits I²C)", "consigne de courant", 1, 3, 8],
  ["électronique", "AOP CMOS rail-à-rail doubles (MCP6022 / OPA2350)", "source de courant et TIA", 3, 2, 6],
  ["électronique", "MOSFET logique (2N7000 / BS170) + shunt 10 Ω 0,1 % + résistances de précision", "source de courant", 1, 4, 8],
  ["électronique", "Relais NF 5 V + transistor + diode de roue libre + Schottky BAT54", "court-circuit de protection", 1, 4, 8],
  ["électronique", "Régulateurs 5 V et 3,3 V bas bruit + condensateurs", "alimentation propre de l'analogique", 1, 5, 20],
  ["électronique", "Pont en H DRV8871 + inductance 10 µH + condensateur 470 µF", "commande filtrée du Peltier", 1, 9, 12],
  ["électronique", "Chien de garde : 74HC123 + R/C", "laser coupé si le programme plante", 1, 2, 2],
  ["électronique", "Plaque à pastilles ou PCB fabriqué, connecteurs, câbles blindés", "câblage propre", 1, 20, 45],
  ["électronique", "Alimentation 12 V 3 A", "Peltier et moteurs", 1, 12, 25],
  ["sécurité", "Clé + arrêt d'urgence (NF, à accrochage) + contact de capot + voyant", "chaîne d'interlock", 1, 20, 45],
  ["sécurité", "Capot opaque (+ fenêtre filtrante CERTIFIÉE pour 650 nm, optionnelle)", "confiner le faisceau", 1, 25, 150],
  ["sécurité", "Lunettes de protection laser EN 207, DO ≥ 3 à 650 nm", "OBLIGATOIRES, ne pas économiser ici", 1, 60, 120],
  ["sécurité", "Bracelet + tapis antistatiques", "protéger les diodes des ESD", 1, 15, 40]
];

export default function (el, ctx) {
  const st = (ctx && ctx.store && ctx.store.get("bom", null)) || { mode: "eco", deja: {} };
  const bar = document.createElement("div"); bar.className = "btns";
  bar.innerHTML = `<button type="button" class="pill small" data-m="eco">version économique</button><button type="button" class="pill small" data-m="labo">version « labo »</button>`;
  el.appendChild(bar);
  const wrap = document.createElement("div"); wrap.className = "table-wrap"; wrap.style.marginTop = "12px"; el.appendChild(wrap);
  const ro = readouts(el, [["tot", "total à acheter"], ["deja", "déjà en ta possession"], ["sec", "dont sécurité"]]);
  const nt = note(el, "");
  const eur = v => fmt(Math.round(v), 5) + " €";
  function render() {
    bar.querySelectorAll("[data-m]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === st.mode)));
    const col = st.mode === "eco" ? 4 : 5; let cat = "", html = "", tot = 0, deja = 0, sec = 0;
    ITEMS.forEach((it, i) => {
      if (it[0] !== cat) { cat = it[0]; html += `<tr><th colspan="5" style="background:#fff;padding-top:16px">${cat}</th></tr>`; }
      const prix = it[3] * it[col], has = !!st.deja[i];
      if (has) deja += prix; else { tot += prix; if (it[0] === "sécurité") sec += prix; }
      html += `<tr style="${has ? "opacity:.5" : ""}"><td><label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" data-i="${i}" ${has ? "checked" : ""} style="margin-top:4px;accent-color:#ff6f1e" aria-label="déjà en ma possession">${it[1]}</label></td><td>${it[2]}</td><td class="num">${it[3]}</td><td class="num">${eur(it[col])}</td><td class="num">${eur(prix)}</td></tr>`;
    });
    wrap.innerHTML = `<table><thead><tr><th>article (coche ce que tu as déjà)</th><th>rôle</th><th class="num">qté</th><th class="num">prix u.</th><th class="num">total</th></tr></thead><tbody>${html}</tbody></table>`;
    wrap.querySelectorAll("input[data-i]").forEach(c => c.addEventListener("change", () => { st.deja[c.dataset.i] = c.checked; save(); render(); }));
    ro("tot", eur(tot)); ro("deja", eur(deja)); ro("sec", eur(sec));
    nt.textContent = st.mode === "eco" ? "version économique : impression 3D, modules à bas coût, lame de verre comme séparatrice. Les lunettes, elles, doivent être certifiées." : "version labo : composants optomécaniques standards, plus précis et plus durables — l'idéal si l'école ou l'entreprise prête du matériel.";
  }
  function save() { if (ctx && ctx.store) ctx.store.set("bom", st); }
  bar.addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (b) { st.mode = b.dataset.m; save(); render(); } });
  render();
}
