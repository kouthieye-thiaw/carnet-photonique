// SAÉ 5 — décodeur de trames du module joueur JRC : ce que la carte comprend, vérifie et fait.
import { controls, buttons, note } from "../lib.js";

export const COULEURS = [
  { n: "éteint", c: "#ded6cc", glow: false }, { n: "rouge", c: "#e2372b" }, { n: "vert", c: "#22c55e" }, { n: "jaune", c: "#f2c230" },
  { n: "bleu", c: "#3b82f6" }, { n: "magenta", c: "#d946ef" }, { n: "cyan", c: "#22d3ee" }, { n: "blanc", c: "#ffffff" }
];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const VALEURS = { 0: ["numéro de série", "17"], 1: ["dernier temps (ms)", "412"], 2: ["appuis incorrects", "1"], 3: ["appuis valides", "0"], 4: ["temps moyen (ms)", "0"] };

/* analyse d'une trame : même logique que la fonction Algorithme() de la carte */
export function analyser(t) {
  const r = { ok: false, appel: "", action: "", leds: null, etat: null, reponse: null, pourquoi: "" };
  const ch = (i, a, b) => t.length > i && t[i] >= a && t[i] <= b;
  if (!t.length) { r.pourquoi = "trame vide"; return r; }
  switch (t[0]) {
    case "R":
      if (t.length !== 1) { r.pourquoi = "la trame R ne contient qu'une lettre"; return r; }
      return { ...r, ok: true, appel: "AlgorithmeReset()", action: "arrête le jeu, éteint les LEDs de jeu et le buzzer, remet les 4 variables du CDC à 0, LED d'état verte", leds: [0, 0, 0, 0], etat: true };
    case "A":
      if (t.length !== 4) { r.pourquoi = "une trame A fait 4 caractères : A, le bouton, deux couleurs"; return r; }
      if (!ch(1, "1", "4")) { r.pourquoi = `le bouton doit être entre 1 et 4 (reçu « ${t[1]} »)`; return r; }
      if (!ch(2, "0", "7") || !ch(3, "0", "7")) { r.pourquoi = "les couleurs doivent être entre 0 et 7"; return r; }
      { const n = t.charCodeAt(1) - 48, c1 = t.charCodeAt(2) - 48, c2 = t.charCodeAt(3) - 48;
        return { ...r, ok: true, appel: `AlgorithmeJeuA(${n}, ${c1}, ${c2})`, leds: [1, 2, 3, 4].map(k => k === n ? c1 : c2), etat: false,
          action: `LED d'état éteinte ; LED ${n} en ${COULEURS[c1].n}, les autres en ${COULEURS[c2].n} ; le chronomètre démarre ; il faut appuyer sur le bouton ${n} en moins de 2 s` }; }
    case "B":
      if (t.length !== 3) { r.pourquoi = "une trame B fait 3 caractères : B et deux couleurs"; return r; }
      if (!ch(1, "0", "7") || !ch(2, "0", "7")) { r.pourquoi = "les couleurs doivent être entre 0 et 7"; return r; }
      { const c1 = t.charCodeAt(1) - 48, c2 = t.charCodeAt(2) - 48;
        return { ...r, ok: true, appel: `AlgorithmeJeuB(${c1}, ${c2})`, leds: [c1, c2, c2, c2], etat: false,
          action: `jeu B : 20 tirages au sort ; à chaque tirage, la LED à viser en ${COULEURS[c1].n}, les autres en ${COULEURS[c2].n} (exemple affiché : LED 1 tirée)` }; }
    case "V":
      if (t.length !== 2 || !ch(1, "0", "4")) { r.pourquoi = "une trame V fait 2 caractères : V puis un chiffre de 0 à 4"; return r; }
      { const i = t.charCodeAt(1) - 48;
        return { ...r, ok: true, appel: `AlgorithmeInformation(${i})`, action: `renvoie « ${VALEURS[i][0]} »`, reponse: VALEURS[i][1] }; }
    default:
      r.pourquoi = `identifiant « ${t[0]} » inconnu : la carte ignore la trame`; return r;
  }
}

export function carteHTML(leds, etat) {
  return `<div class="jrc-mini" aria-hidden="true"><span class="jrc-etat${etat ? " on" : ""}" title="LED d'état"></span>${leds.map((c, i) => `<span class="jrc-led-mini" style="--c:${COULEURS[c].c}" data-on="${c ? 1 : 0}"><i>${i + 1}</i></span>`).join("")}</div>`;
}

export default function (el) {
  const zone = document.createElement("div"); zone.className = "jrc-trame";
  zone.innerHTML = `<div class="jrc-in"><label>trame envoyée par le PC <input type="text" maxlength="8" value="A314" spellcheck="false" autocomplete="off" aria-label="trame à envoyer"></label><span class="small">+ CR LF</span></div>
    <div class="jrc-chars"></div><div class="jrc-res"></div>
    <div class="jrc-legende">${COULEURS.map((c, i) => `<span><i style="--c:${c.c}"></i>${i} = ${c.n} <code>${i.toString(2).padStart(3, "0")}</code></span>`).join("")}</div>`;
  el.appendChild(zone);
  const ctl = controls(el);
  const inp = zone.querySelector("input");
  buttons(el, ["R", "A314", "A276", "A100", "B20", "V1", "V4", "A514", "A3x9", "X12"].map(t => [t, () => { inp.value = t; maj(); }]));
  ctl.remove();
  const nt = note(el, "");
  function maj() {
    const t = inp.value.toUpperCase().replace(/[\r\n]/g, "");
    zone.querySelector(".jrc-chars").innerHTML = t.split("").map((c, i) => `<div class="jrc-ch"><b>${esc(c)}</b><span>ASCII ${c.charCodeAt(0)}</span>${i > 0 && /\d/.test(c) ? `<span>${c.charCodeAt(0)} − 48 = <strong>${c.charCodeAt(0) - 48}</strong></span>` : `<span>${i === 0 ? "identifiant" : "&nbsp;"}</span>`}</div>`).join("") + `<div class="jrc-ch fin"><b>CR LF</b><span>fin de trame</span><span>&nbsp;</span></div>`;
    const r = analyser(t);
    const res = zone.querySelector(".jrc-res");
    if (!r.ok) { res.innerHTML = `<p class="jrc-ko">✗ trame ignorée : ${esc(r.pourquoi)}</p>`; nt.textContent = "La carte vérifie toujours la trame avant d'agir : une trame mal formée ne doit jamais lancer un jeu."; return; }
    res.innerHTML = `<p class="jrc-ok">✓ <code>${esc(r.appel)}</code></p><p class="small">${esc(r.action)}${r.reponse ? ` → la carte répond <code>${esc(r.reponse)}</code> + CR LF (valeur d'exemple)` : ""}</p>${r.leds ? carteHTML(r.leds, r.etat) : ""}`;
    nt.textContent = t[0] === "A" ? "Le caractère '3' vaut 51 en ASCII : trame[1] − '0' donne 51 − 48 = 3. C'est ainsi que la carte transforme le texte reçu en nombres." : t[0] === "V" ? "Le jeu ne renvoie rien de lui-même : c'est le PC qui vient chercher les résultats avec une trame V." : "Essaie une trame fausse (A514, A3x9, X12) : la carte doit l'ignorer sans planter.";
  }
  inp.addEventListener("input", maj);
  maj();
}
