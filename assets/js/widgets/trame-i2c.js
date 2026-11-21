// Registres et trames I²C : ADS1115 (mot de configuration, lecture signée) et MCP4725 (écriture rapide, EEPROM).
// data-mode="ads" (par défaut) ou data-mode="dac".
import { controls, select, slider, readouts, note, fmt } from "../lib.js";

const MUX = ["AIN0 − AIN1", "AIN0 − AIN3", "AIN1 − AIN3", "AIN2 − AIN3", "AIN0 / masse", "AIN1 / masse", "AIN2 / masse", "AIN3 / masse"];
const PGA = [6.144, 4.096, 2.048, 1.024, 0.512, 0.256, 0.256, 0.256];
const DR = [8, 16, 32, 64, 128, 250, 475, 860];
const hex = (v, n = 2) => "0x" + v.toString(16).toUpperCase().padStart(n, "0");
const bin = (v, n) => v.toString(2).padStart(n, "0");
const octets = (arr) => arr.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
const virg = s => String(s).replace(".", ",");

/* Grille de bits : noms de champs, numéros de bits, cases, signification. */
function grille(parent, nbits, champs, onClick) {
  const g = document.createElement("div");
  g.className = "bits"; g.style.setProperty("--nb", nbits);
  const champDuBit = [];
  champs.forEach((f, i) => { for (let b = f.hi; b > f.hi - f.n; b--) champDuBit[b] = i; });
  champs.forEach((f, i) => { const d = document.createElement("div"); d.className = "bf-name" + (i % 2 ? " alt" : ""); d.style.gridColumn = `span ${f.n}`; d.textContent = f.nom; d.title = f.nom; g.appendChild(d); });
  for (let b = nbits - 1; b >= 0; b--) { const d = document.createElement("div"); d.className = "b-num"; d.textContent = b; g.appendChild(d); }
  const cases = [];
  for (let b = nbits - 1; b >= 0; b--) {
    const c = document.createElement("button");
    c.type = "button"; c.className = "b-cell" + (champDuBit[b] % 2 ? " alt-f" : "");
    c.setAttribute("aria-label", "bit " + b);
    if (onClick) c.addEventListener("click", () => onClick(b)); else c.disabled = true;
    g.appendChild(c); cases[b] = c;
  }
  const sens = champs.map((f, i) => { const d = document.createElement("div"); d.className = "bf-val" + (i % 2 ? " alt" : ""); d.style.gridColumn = `span ${f.n}`; g.appendChild(d); return d; });
  parent.appendChild(g);
  let avant = null;
  return {
    el: g,
    afficher(mot, textes) {
      for (let b = 0; b < nbits; b++) {
        const v = (mot >> b) & 1, c = cases[b];
        c.textContent = v; c.classList.toggle("one", !!v);
        if (avant !== null && ((avant >> b) & 1) !== v) { c.classList.remove("chg"); void c.offsetWidth; c.classList.add("chg"); }
      }
      textes.forEach((t, i) => { sens[i].textContent = t; });
      avant = mot;
    },
  };
}

function legende(parent, texte) {
  const p = document.createElement("p"); p.className = "small bits-cap"; p.innerHTML = texte; parent.appendChild(p); return p;
}

/* ------------------------------------------------------------------ ADS1115 */
function ads(el) {
  const CHAMPS = [
    { k: "os", nom: "OS", hi: 15, n: 1 }, { k: "mux", nom: "MUX", hi: 14, n: 3 }, { k: "pga", nom: "PGA", hi: 11, n: 3 },
    { k: "mode", nom: "MODE", hi: 8, n: 1 }, { k: "dr", nom: "DR", hi: 7, n: 3 }, { k: "comp", nom: "COMP", hi: 4, n: 5 },
  ];
  let mot = 0xC383;
  legende(el, "Registre de configuration (pointeur <code>0x01</code>) — clique sur un bit pour le basculer, ou règle les champs :");
  const g = grille(el, 16, CHAMPS, b => { mot ^= (1 << b); maj(); });
  const ctl = controls(el);
  const champ = k => { const f = CHAMPS.find(x => x.k === k); return (mot >> (f.hi - f.n + 1)) & ((1 << f.n) - 1); };
  const fixer = (k, v) => { const f = CHAMPS.find(x => x.k === k); const d = f.hi - f.n + 1, m = ((1 << f.n) - 1) << d; mot = (mot & ~m) | ((v << d) & m); maj(); };
  const sMux = select(ctl, { label: "entrée (MUX)", options: MUX.map((t, i) => [i, bin(i, 3) + " · " + t]), value: 4, oninput: v => fixer("mux", +v) });
  const sPga = select(ctl, { label: "pleine échelle (PGA)", options: [0, 1, 2, 3, 4, 5].map(i => [i, bin(i, 3) + " · ±" + virg(PGA[i]) + " V"]), value: 1, oninput: v => fixer("pga", +v) });
  const sDr = select(ctl, { label: "cadence (DR)", options: DR.map((d, i) => [i, bin(i, 3) + " · " + d + " éch./s"]), value: 4, oninput: v => fixer("dr", +v) });
  const sMode = select(ctl, { label: "mode", options: [[1, "1 · conversion unique"], [0, "0 · continu"]], value: 1, oninput: v => fixer("mode", +v) });
  const lh = document.createElement("label"); lh.className = "ctl";
  lh.innerHTML = `<span class="lbl"><span>mot en hexadécimal (Entrée)</span></span><input type="text" spellcheck="false" autocomplete="off" aria-label="mot de configuration en hexadécimal">`;
  ctl.appendChild(lh);
  const hin = lh.querySelector("input");
  hin.addEventListener("change", () => {
    const v = parseInt(hin.value.trim().replace(/^0x/i, ""), 16);
    if (Number.isFinite(v) && v >= 0 && v <= 0xFFFF) { mot = v; maj(); } else hin.value = hex(mot, 4);
  });
  const ro = readouts(el, [["hex", "mot de configuration"], ["trame", "octets écrits sur le bus"], ["tconv", "durée d'une conversion"], ["lsb", "résolution (1 LSB)"]]);
  const nt = note(el, "");

  // --- lecture du registre de conversion
  const lect = document.createElement("div"); lect.className = "bits-read";
  lect.innerHTML = `<p class="small bits-cap">Lecture du registre de conversion (pointeur <code>0x00</code>) : le composant renvoie 2 octets, poids fort d'abord, en <b>complément à deux</b>.</p>
    <div class="bits-io"><label class="small">octet fort <input type="text" value="FF" maxlength="4" data-o1 aria-label="octet fort en hexadécimal"></label>
    <label class="small">octet faible <input type="text" value="38" maxlength="4" data-o2 aria-label="octet faible en hexadécimal"></label>
    <span class="small" data-res></span></div>`;
  el.appendChild(lect);
  const o1 = lect.querySelector("[data-o1]"), o2 = lect.querySelector("[data-o2]"), res = lect.querySelector("[data-res]");
  const gl = grille(lect, 16, [{ nom: "signe", hi: 15, n: 1 }, { nom: "valeur (15 bits)", hi: 14, n: 15 }], null);
  function lire() {
    const a = parseInt(o1.value.replace(/^0x/i, ""), 16), b = parseInt(o2.value.replace(/^0x/i, ""), 16);
    if (!(a >= 0 && a <= 255 && b >= 0 && b <= 255)) { res.textContent = "deux octets de 00 à FF"; return; }
    const brut16 = (a << 8) | b, signe = brut16 >= 0x8000, brut = signe ? brut16 - 65536 : brut16;
    const fs = PGA[champ("pga")];
    gl.afficher(brut16, [signe ? "1 → négatif" : "0 → positif", `${brut16} ${signe ? "− 65 536 = " + brut : ""}`]);
    res.innerHTML = `brut signé <b>${brut}</b> → tension <b>${virg(fmt(brut * fs / 32768, 4))} V</b> <span style="color:var(--ink-faint)">(± ${virg(fs)} V)</span>`;
  }
  o1.addEventListener("input", lire); o2.addEventListener("input", lire);

  function maj() {
    const os = champ("os"), mux = champ("mux"), pga = champ("pga"), mode = champ("mode"), dr = champ("dr"), comp = champ("comp");
    g.afficher(mot, [
      os ? "1 : démarrer" : "0 : rien",
      bin(mux, 3) + " : " + MUX[mux],
      bin(pga, 3) + " : ±" + virg(PGA[pga]) + " V",
      mode ? "1 : unique" : "0 : continu",
      bin(dr, 3) + " : " + DR[dr] + "/s",
      bin(comp, 5) + ((comp & 3) === 3 ? " : désactivé" : " : actif"),
    ]);
    sMux.value = mux; sPga.value = Math.min(pga, 5); sDr.value = dr; sMode.value = mode;
    hin.value = hex(mot, 4);
    ro("hex", hex(mot, 4));
    ro("trame", octets([0x01, mot >> 8, mot & 0xFF]));
    ro("tconv", virg(fmt(1000 / DR[dr], 3)) + " ms");
    ro("lsb", virg(fmt(PGA[pga] / 32768 * 1e6, 4)) + " µV");
    const decomp = [bin(os, 1), bin(mux, 3), bin(pga, 3), bin(mode, 1), bin(dr, 3), bin(comp, 5)].join(" ");
    if (mot === 0xC383) nt.textContent = `${decomp} = 0xC383 : le mot de référence du test (AIN0, ±4,096 V, 128 éch./s) !`;
    else if (!mode) nt.textContent = "en mode continu, le composant convertit sans arrêt : pour le banc, on préfère la conversion unique (on sait quand la mesure a été prise).";
    else if (pga === 0) nt.textContent = "±6,144 V : attention, l'entrée ne doit jamais dépasser VDD + 0,3 V, quelle que soit la gamme.";
    else if (mux < 4) nt.textContent = "mesure différentielle : utile pour un shunt « flottant », mais le banc mesure tout par rapport à la masse.";
    else nt.textContent = `${decomp} = ${hex(mot, 4)}`;
    lire();
  }
  maj();
}

/* ------------------------------------------------------------------ MCP4725 */
function dac(el) {
  const RS = 10, DIV = 0.18, VREF = 3.3, IMAX = 45;
  const IMAT = 4095 / 4096 * VREF * DIV / RS * 1000;
  const ctl = controls(el);
  const ro = readouts(el, [["vset", "V_set = I × Rs"], ["vdac", "V_dac = V_set / diviseur"], ["code", "code DAC (12 bits)"], ["ireel", "courant obtenu"], ["lsb", "pas de réglage (1 LSB)"]]);
  legende(el, "<b>Écriture rapide</b> (fast write) : 2 octets, mode normal (PD = 00).");
  const gf = grille(el, 16, [{ nom: "cmd 00", hi: 15, n: 2 }, { nom: "PD", hi: 13, n: 2 }, { nom: "D11…D8", hi: 11, n: 4 }, { nom: "D7…D0", hi: 7, n: 8 }], null);
  legende(el, "<b>Registre + EEPROM</b> : 3 octets ; l'EEPROM est rechargée à chaque mise sous tension.");
  const ge = grille(el, 24, [{ nom: "0x60 : DAC + EEPROM", hi: 23, n: 8 }, { nom: "D11…D4", hi: 15, n: 8 }, { nom: "D3…D0", hi: 7, n: 4 }, { nom: "0000", hi: 3, n: 4 }], null);
  const nt = note(el, "");
  slider(ctl, { label: "courant demandé", min: 0, max: 62, step: 0.5, value: 40, unit: "mA", fmt: v => virg(fmt(v, 3)), oninput: maj });
  function maj(i) {
    const vset = i / 1000 * RS, vdac = vset / DIV, brut = Math.round(vdac / VREF * 4096), code = Math.min(4095, brut);
    const ireel = code / 4096 * VREF * DIV / RS * 1000;
    ro("vset", virg(fmt(vset, 4)) + " V");
    ro("vdac", virg(fmt(vdac, 4)) + " V", vdac > VREF);
    ro("code", code + " = " + hex(code, 3), brut > 4095);
    ro("ireel", virg(fmt(ireel, 4)) + " mA", i > IMAX);
    ro("lsb", virg(fmt(VREF / 4096 * DIV / RS * 1e6, 3)) + " µA");
    const f = [(code >> 8) & 0x0F, code & 0xFF], e = [0x60, code >> 4, (code & 0x0F) << 4];
    gf.afficher((f[0] << 8) | f[1], ["00", "00 : normal", bin(code >> 8, 4), bin(code & 0xFF, 8)]);
    ge.afficher((e[0] << 16) | (e[1] << 8) | e[2], ["0110 0000", bin(code >> 4, 8), bin(code & 0xF, 4), "0000"]);
    if (brut > 4095) nt.textContent = `impossible : ${virg(fmt(IMAT, 4))} mA au maximum (code 4095) — c'est la limite MATÉRIELLE fixée par le diviseur.`;
    else if (i > IMAX) nt.textContent = `refusé par le logiciel : au-dessus de i_max_ma = ${IMAX} mA → ValueError.`;
    else if (code === 2758) nt.textContent = "40 mA → code 2758 → octets 0A C6 : exactement ce que vérifie le test !";
    else nt.textContent = `rapide : ${octets(f)}   ·   EEPROM : ${octets(e)}`;
  }
  maj(40);
}

export default function (el) {
  if (el.dataset.mode === "dac") dac(el); else ads(el);
}
