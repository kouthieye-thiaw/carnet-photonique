// Budget d'incertitude (GUM) : composantes, lois, coefficients de sensibilité → u_c, U (k = 2) et poids de chaque terme
import { C, canvas, buttons, readouts, fmt, rrect, text, note } from "../lib.js";

const LOIS = { normale2: ["certificat (U, k = 2)", 2], normale1: ["écart-type connu (k = 1)", 1], rect: ["rectangulaire ±a", Math.sqrt(3)], tri: ["triangulaire ±a", Math.sqrt(6)], resol: ["résolution q (u = q/√12)", Math.sqrt(12)] };
export default function (el, ctx) {
  const key = "incertitude:budget";
  let rows = (ctx && ctx.store && ctx.store.get(key, null)) || [
    { n: "répétabilité (s/√n, type A)", v: 0.017, l: "normale1", c: 1 },
    { n: "étalonnage de la tête (±3 %, k = 2)", v: 0.135, l: "normale2", c: 1 },
    { n: "résolution de l'afficheur (0,01 mW)", v: 0.01, l: "resol", c: 1 },
    { n: "réglage de λ (±1 % de sensibilité)", v: 0.045, l: "rect", c: 1 }
  ];
  const wrap = document.createElement("div"); wrap.className = "table-wrap"; wrap.style.marginTop = "8px"; el.appendChild(wrap);
  const cv = canvas(el, { height: 150, before: null });
  buttons(el, [["+ ajouter une composante", () => { rows.push({ n: "nouvelle composante", v: 0.01, l: "rect", c: 1 }); render(); }], ["réinitialiser l'exemple", () => { if (ctx && ctx.store) ctx.store.del(key); rows = null; location.reload(); }]]);
  const ro = readouts(el, [["uc", "incertitude-type composée u_c"], ["U", "incertitude élargie U (k = 2)"], ["dom", "terme dominant"]]);
  const nt = note(el, "");
  function render() {
    wrap.innerHTML = `<table><thead><tr><th>composante</th><th class="num">valeur (mW)</th><th>loi</th><th class="num">sensibilité</th><th class="num">u<sub>i</sub> (mW)</th><th></th></tr></thead><tbody>${rows.map((r, i) => `<tr>
      <td><input data-i="${i}" data-k="n" value="${r.n.replace(/"/g, "&quot;")}" style="width:100%;border:0;background:transparent;font:inherit" aria-label="nom"></td>
      <td class="num"><input data-i="${i}" data-k="v" value="${r.v}" inputmode="decimal" style="width:80px;text-align:right;border:1px solid #d9cdc2;border-radius:6px;padding:3px 6px;font:inherit" aria-label="valeur"></td>
      <td><select data-i="${i}" data-k="l" style="font:inherit;border:1px solid #d9cdc2;border-radius:6px;padding:3px">${Object.entries(LOIS).map(([k, v]) => `<option value="${k}" ${k === r.l ? "selected" : ""}>${v[0]}</option>`).join("")}</select></td>
      <td class="num"><input data-i="${i}" data-k="c" value="${r.c}" inputmode="decimal" style="width:56px;text-align:right;border:1px solid #d9cdc2;border-radius:6px;padding:3px 6px;font:inherit" aria-label="coefficient de sensibilité"></td>
      <td class="num" data-u="${i}"></td><td><button type="button" data-del="${i}" class="pill small ghost" aria-label="supprimer">×</button></td></tr>`).join("")}</tbody></table>`;
    wrap.querySelectorAll("input,select").forEach(inp => inp.addEventListener("input", () => { const r = rows[+inp.dataset.i]; const k = inp.dataset.k; r[k] = (k === "v" || k === "c") ? parseFloat(String(inp.value).replace(",", ".")) || 0 : inp.value; compute(); }));
    wrap.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { rows.splice(+b.dataset.del, 1); render(); }));
    compute();
  }
  function compute() {
    const us = rows.map(r => Math.abs(r.c) * r.v / LOIS[r.l][1]);
    us.forEach((u, i) => { const td = wrap.querySelector(`[data-u="${i}"]`); if (td) td.textContent = fmt(u, 3); });
    const uc = Math.sqrt(us.reduce((a, u) => a + u * u, 0)), U = 2 * uc;
    const c = cv.ctx, w = cv.w; cv.clear(); let x = 10; const tot = us.reduce((a, u) => a + u * u, 0) || 1, cols = [C.orange, C.sky, C.green, C.pink, C.violet, C.sienna, C.mist];
    text(c, 10, 18, "part de chaque composante dans la variance totale", { align: "left", size: 12, color: C.soft });
    us.forEach((u, i) => { const ww = (w - 20) * u * u / tot; c.fillStyle = cols[i % cols.length]; rrect(c, x, 34, Math.max(1, ww - 2), 40, 4); c.fill(); if (ww > 46) text(c, x + ww / 2, 54, fmt(100 * u * u / tot, 2) + " %", { size: 12, color: "#fff", weight: 600 }); x += ww; });
    rows.forEach((r, i) => { text(c, 10 + (i % 2) * (w / 2), 96 + Math.floor(i / 2) * 18, "■ " + r.n, { align: "left", size: 11.5, color: cols[i % cols.length] }); });
    const imax = us.indexOf(Math.max(...us));
    ro("uc", fmt(uc, 3) + " mW"); ro("U", "± " + fmt(U, 2) + " mW"); ro("dom", rows[imax] ? rows[imax].n.split(" (")[0] : "—");
    nt.textContent = "pour réduire U, attaque le terme dominant : inutile de répéter 100 fois une mesure si c'est l'étalonnage qui domine.";
    if (ctx && ctx.store) ctx.store.set(key, rows);
  }
  cv.onresize = compute; render();
}
