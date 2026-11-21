// Lentille mince convergente : objet, image et les trois rayons particuliers.
// Convention « distances positives » : 1/do + 1/di = 1/f, G = −di/do (di < 0 : image virtuelle).
import { C, F, canvas, controls, slider, readouts, note, fmt, arrow, text } from "../lib.js";

export default function (el) {
  const st = { d0: 150, f: 100 };
  const cv = canvas(el, { height: w => (w < 560 ? 280 : 340) });
  const ctl = controls(el);
  slider(ctl, { label: "distance objet → lentille d₀", min: 30, max: 400, step: 5, value: st.d0, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.d0 = v; draw(); } });
  slider(ctl, { label: "focale f", min: 40, max: 160, step: 5, value: st.f, unit: "mm", fmt: v => fmt(v, 3), oninput: v => { st.f = v; draw(); } });
  const ro = readouts(el, [["di", "distance image dᵢ"], ["g", "grandissement G"], ["t", "nature de l'image"]]);
  const nt = note(el, "");

  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const { d0, f } = st;
    const x0 = -430, x1 = 650;                                   // mm visibles
    const X = mm => 20 + (mm - x0) * (w - 40) / (x1 - x0), sc = (w - 40) / (x1 - x0);
    const yA = h * 0.56, H0 = 34;                                 // axe optique, hauteur de l'objet (px)
    const inf = Math.abs(d0 - f) < 0.5;
    const di = inf ? Infinity : 1 / (1 / f - 1 / d0), G = inf ? Infinity : -di / d0;
    // axe et foyers
    c.strokeStyle = C.faint; c.lineWidth = 1; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(10, yA); c.lineTo(w - 10, yA); c.stroke(); c.setLineDash([]);
    [[-f, "F"], [f, "F'"]].forEach(([x, t]) => { c.fillStyle = C.ink; c.beginPath(); c.arc(X(x), yA, 3.5, 0, 7); c.fill(); text(c, X(x), yA + 18, t, { align: "center", size: 13, weight: 600 }); });
    // lentille
    const lh = Math.min(h * 0.42, 120);
    c.save(); c.fillStyle = "rgba(59,130,246,.10)"; c.strokeStyle = C.sky; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X(0), yA - lh); c.quadraticCurveTo(X(0) + 16, yA, X(0), yA + lh); c.quadraticCurveTo(X(0) - 16, yA, X(0), yA - lh); c.fill(); c.stroke(); c.restore();
    // objet
    const xo = X(-d0), yo = yA - H0;
    arrow(c, xo, yA, xo, yo, { color: C.ink, width: 2.6 });
    text(c, xo, yA + 18, "objet", { align: "center", size: 12.5, color: C.soft });
    // rayons
    const ray = (pts, col, dash) => { c.save(); c.strokeStyle = col; c.lineWidth = 2; if (dash) c.setLineDash(dash); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.stroke(); c.restore(); };
    const yAt = (xpx0, ypx0, slope, xpx) => ypx0 + slope * (xpx - xpx0);     // pente en px/px
    const xL = X(0), xEnd = w - 12, xStart = 12;
    // 1. parallèle à l'axe, puis passe par F'
    const s1 = (yA - yo) / (X(f) - xL);
    ray([[xo, yo], [xL, yo], [xEnd, yAt(xL, yo, s1, xEnd)]], C.red);
    // 2. par le centre optique, sans déviation
    const s2 = (yA - yo) / (xL - xo);
    ray([[xo, yo], [xEnd, yAt(xo, yo, s2, xEnd)]], C.orange);
    // 3. par F, puis parallèle à l'axe
    let y3 = null;
    if (Math.abs(X(-f) - xo) > 1) { const s3 = (yA - yo) / (X(-f) - xo); y3 = yAt(xo, yo, s3, xL); if (Math.abs(y3 - yA) < h) ray([[xo, yo], [xL, y3], [xEnd, y3]], C.sienna); }
    // prolongements virtuels (image du même côté que l'objet)
    if (!inf && di < 0) {
      const xi = X(di);
      ray([[xL, yo], [xi, yAt(xL, yo, s1, xi)]], C.red, [4, 4]);
      if (y3 !== null) ray([[xL, y3], [xi, y3]], C.sienna, [4, 4]);
      ray([[xo, yo], [xi, yAt(xo, yo, s2, xi)]], C.orange, [4, 4]);
    }
    // image
    if (!inf) {
      const xi = X(di), yi = yA - G * H0;                        // G < 0 : image renversée (vers le bas)
      if (xi > 0 && xi < w && Math.abs(G * H0) < h * 0.48) { arrow(c, xi, yA, xi, yi, { color: di > 0 ? C.ink : C.soft, width: 2.6, dash: di > 0 ? null : [5, 4] }); text(c, xi, yi + (G < 0 ? 16 : -10), di > 0 ? "image réelle" : "image virtuelle", { align: "center", size: 12.5, color: C.soft }); }
      else text(c, w - 16, 24, "image hors champ →", { align: "right", hand: true, size: 20, color: C.orange });
    } else text(c, w - 16, 24, "image à l'infini : faisceau collimaté", { align: "right", hand: true, size: 20, color: C.orange });
    // lecture
    ro("di", inf ? "∞" : fmt(di, 3) + " mm");
    ro("g", inf ? "∞" : (G > 0 ? "+" : "") + fmt(G, 3));
    ro("t", inf ? "à l'infini" : di > 0 ? (Math.abs(G) > 1 ? "réelle, renversée, agrandie" : "réelle, renversée, réduite") : "virtuelle, droite, agrandie (loupe)");
    nt.textContent = inf ? "Objet au foyer : les rayons ressortent parallèles. C'est ainsi qu'on collimate une diode laser."
      : d0 < f ? "Objet plus près que la focale : les rayons divergent après la lentille ; l'œil voit une image droite et agrandie — c'est une loupe."
      : Math.abs(d0 - 2 * f) < 3 ? "Objet à 2f : image à 2f, même taille, renversée. Repère pratique pour tester une lentille."
      : "Les trois rayons particuliers se croisent au même point : c'est l'image. Rapproche l'objet du foyer pour l'envoyer très loin.";
  }
  cv.onresize = draw; draw();
}
