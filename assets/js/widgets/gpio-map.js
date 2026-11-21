// Connecteur GPIO 40 broches de la Raspberry Pi 5 avec l'affectation du banc (cliquable)
const BASE = { 1: "3V3", 2: "5V", 3: "GPIO2", 4: "5V", 5: "GPIO3", 6: "GND", 7: "GPIO4", 8: "GPIO14", 9: "GND", 10: "GPIO15", 11: "GPIO17", 12: "GPIO18", 13: "GPIO27", 14: "GND", 15: "GPIO22", 16: "GPIO23", 17: "3V3", 18: "GPIO24", 19: "GPIO10", 20: "GND", 21: "GPIO9", 22: "GPIO25", 23: "GPIO11", 24: "GPIO8", 25: "GND", 26: "GPIO7", 27: "GPIO0", 28: "GPIO1", 29: "GPIO5", 30: "GND", 31: "GPIO6", 32: "GPIO12", 33: "GPIO13", 34: "GND", 35: "GPIO19", 36: "GPIO16", 37: "GPIO26", 38: "GPIO20", 39: "GND", 40: "GPIO21" };
const BANC = {
  1: ["3,3 V", "alimente les modules ADS1115, MCP4725 et les tirages I²C (logique 3,3 V)."],
  3: ["I²C SDA", "données du bus I²C : ADS1115 (0x48, 0x49) et MCP4725 (0x60). Tirage 1,8 kΩ déjà présent sur la carte."],
  5: ["I²C SCL", "horloge du bus I²C."],
  6: ["masse", "masse commune : une seule liaison vers le point étoile de l'électronique."],
  7: ["LED d'état", "sortie libre : voyant logiciel « mesure en cours » (le voyant d'émission, lui, est câblé en matériel)."],
  11: ["relais de court-circuit", "sortie : 1 = bobine alimentée = court-circuit OUVERT (laser autorisé). Tirage vers le bas : relais fermé au démarrage."],
  13: ["chien de garde", "sortie : impulsions régulières vers le monostable 74HC123 ; si elles cessent, le relais se referme."],
  15: ["interlock (lecture)", "entrée : 1 = boucle clé/arrêt d'urgence/capot fermée. Lecture seule : la coupure est matérielle. Niveau adapté en 3,3 V (pont diviseur ou optocoupleur)."],
  16: ["platine : STEP", "sortie vers le TMC2209 : une impulsion = un micro-pas."],
  18: ["platine : DIR", "sens de déplacement de la platine."],
  22: ["platine : ENABLE", "actif à 0 : tirage vers le haut pour que le moteur soit libre au démarrage."],
  29: ["fin de course platine", "entrée avec tirage : prise d'origine de la platine."],
  31: ["polariseur IN1", "ULN2003 du moteur 28BYJ-48 (pas à pas unipolaire)."],
  32: ["pont en H IN1 (PWM0)", "PWM matérielle 20 kHz vers le DRV8871 : chauffer/refroidir."],
  33: ["pont en H IN2 (PWM1)", "PWM matérielle vers le DRV8871 (sens opposé)."],
  36: ["polariseur IN2", "ULN2003."],
  37: ["origine polariseur", "entrée : capteur optique ou à effet Hall de position zéro."],
  38: ["polariseur IN3", "ULN2003."],
  40: ["polariseur IN4", "ULN2003."]
};
export default function (el) {
  const g = document.createElement("div"); g.className = "pin-map"; g.style.maxWidth = "680px"; g.style.margin = "8px auto 0";
  const cls = n => { const b = BASE[n]; return BANC[n] && /GPIO/.test(b) ? "u" : b === "GND" ? "gnd" : b === "5V" ? "p5" : b === "3V3" ? "p3" : ""; };
  let html = "";
  for (let n = 1; n <= 40; n += 2) {
    const l = BANC[n], r = BANC[n + 1];
    html += `<span class="l ${l ? "used" : ""}">${l ? l[0] + " · " : ""}${BASE[n]}</span><button type="button" class="pin ${cls(n)}" data-n="${n}" aria-label="broche ${n}">${n}</button><button type="button" class="pin ${cls(n + 1)}" data-n="${n + 1}" aria-label="broche ${n + 1}">${n + 1}</button><span class="${r ? "used" : ""}">${BASE[n + 1]}${r ? " · " + r[0] : ""}</span>`;
  }
  g.innerHTML = html; el.appendChild(g);
  const info = document.createElement("div"); info.className = "lab-note"; info.style.fontFamily = "var(--font-gelica)"; info.style.fontSize = "17.5px"; info.style.color = "var(--ink)";
  info.innerHTML = "clique sur une broche pour voir son rôle dans le banc.";
  el.appendChild(info);
  g.querySelectorAll(".pin").forEach(p => { p.style.cursor = "pointer"; p.addEventListener("click", () => { const n = +p.dataset.n, b = BANC[n]; info.innerHTML = `<b>broche ${n} — ${BASE[n]}</b>${b ? ` · ${b[0]} : ${b[1]}` : BASE[n] === "GND" ? " · masse." : /V/.test(BASE[n]) ? " · alimentation." : " · libre pour une extension."}`; }); });
}
