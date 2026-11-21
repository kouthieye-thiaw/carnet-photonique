// Profil de faisceau : largeur D4σ (moments d'ordre 2) sur une image bruitée —
// les pièges de l'écrêtage, du fond mal soustrait, et la fenêtre itérative de la norme ISO 11146.
import { C, F, canvas, controls, slider, toggle, buttons, readouts, fmt, fix, note, seeded } from "../lib.js";

export default function (el) {
  const W = 160, H = 120, X0 = 83.3, Y0 = 58.7, ELL = 0.8;
  const st = { w: 14, bruit: 1, fond: 0, ecreter: true, fenetre: false, graine: 7 };
  const cv = canvas(el, { height: w => (w < 640 ? Math.round((w - 20) * 0.75) + 178 : 360) });
  const ctl = controls(el);
  slider(ctl, { label: "rayon du faisceau w (vrai D4σ = 2w)", min: 6, max: 30, step: 0.5, value: st.w, unit: "px", oninput: v => { st.w = v; calc(); } });
  slider(ctl, { label: "bruit (écart-type, % du pic)", min: 0, max: 4, step: 0.1, value: st.bruit, unit: "%", fmt: v => fmt(v, 2), oninput: v => { st.bruit = v; calc(); } });
  slider(ctl, { label: "fond mal soustrait (% du pic)", min: -0.6, max: 0.6, step: 0.05, value: st.fond, unit: "%", fmt: v => fmt(v, 2), oninput: v => { st.fond = v; calc(); } });
  toggle(ctl, { label: "écrêter les valeurs négatives", value: st.ecreter, oninput: v => { st.ecreter = v; calc(); } });
  toggle(ctl, { label: "fenêtre ISO itérative (3 × D4σ)", value: st.fenetre, oninput: v => { st.fenetre = v; calc(); } });
  buttons(el, [["nouveau tirage du bruit", () => { st.graine++; calc(); }]]);
  const ro = readouts(el, [["dx", "D4σ mesuré selon x"], ["dy", "D4σ mesuré selon y"], ["ex", "écart en x"], ["ey", "écart en y"], ["it", "calculs (itérations)"]]);
  const nt = note(el, "");

  const img = new Float32Array(W * H);
  const off = document.createElement("canvas"); off.width = W; off.height = H;
  const octx = off.getContext("2d"), idata = octx.createImageData(W, H);
  let res = null;

  function generer() {
    const rnd = seeded(st.graine);
    const g = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const wx = st.w, wy = st.w * ELL;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = Math.exp(-2 * ((x - X0) ** 2 / wx ** 2 + (y - Y0) ** 2 / wy ** 2)) + st.bruit / 100 * g() + st.fond / 100;
      if (st.ecreter && v < 0) v = 0;
      img[y * W + x] = v;
    }
  }
  function moments(xa, xb, ya, yb) {
    let s = 0, sx = 0, sy = 0;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) { const v = img[y * W + x]; s += v; sx += x * v; sy += y * v; }
    if (!(s > 0)) return null;
    const cx = sx / s, cy = sy / s; let vx = 0, vy = 0;
    for (let y = ya; y <= yb; y++) for (let x = xa; x <= xb; x++) { const v = img[y * W + x]; vx += (x - cx) ** 2 * v; vy += (y - cy) ** 2 * v; }
    vx /= s; vy /= s;
    return { cx, cy, dx: vx > 0 ? 4 * Math.sqrt(vx) : NaN, dy: vy > 0 ? 4 * Math.sqrt(vy) : NaN };
  }
  const ok = m => m && isFinite(m.dx) && isFinite(m.dy);

  function calc() {
    generer();
    let win = [0, W - 1, 0, H - 1], m = moments(...win), it = 1;
    if (st.fenetre && ok(m)) {
      while (it < 20) {
        const nw = [Math.max(0, Math.round(m.cx - 1.5 * m.dx)), Math.min(W - 1, Math.round(m.cx + 1.5 * m.dx)),
                    Math.max(0, Math.round(m.cy - 1.5 * m.dy)), Math.min(H - 1, Math.round(m.cy + 1.5 * m.dy))];
        if (nw[1] - nw[0] < 3 || nw[3] - nw[2] < 3) break;
        const m2 = moments(...nw); it++;
        if (!ok(m2)) break;
        const stable = Math.abs(m2.dx - m.dx) / m.dx < 1e-3 && Math.abs(m2.dy - m.dy) / m.dy < 1e-3;
        m = m2; win = nw;
        if (stable) break;
      }
    }
    res = { m, win, it };
    const tx = 2 * st.w, ty = 2 * st.w * ELL;
    const ex = ok(m) ? (m.dx / tx - 1) * 100 : NaN, ey = ok(m) ? (m.dy / ty - 1) * 100 : NaN;
    ro("dx", ok(m) ? fix(m.dx, 1) + " px" : "—");
    ro("dy", ok(m) ? fix(m.dy, 1) + " px" : "—");
    ro("ex", isFinite(ex) ? (ex > 0 ? "+" : "") + fix(ex, 1) + " %" : "—", !(Math.abs(ex) <= 2));
    ro("ey", isFinite(ey) ? (ey > 0 ? "+" : "") + fix(ey, 1) + " %" : "—", !(Math.abs(ey) <= 2));
    ro("it", String(it));
    if (Math.abs(st.fond) >= 0.15) nt.textContent = "un fond mal soustrait, même de quelques dixièmes de %, s'additionne sur des milliers de pixels : soigne l'image « laser éteint ».";
    else if (st.ecreter && !st.fenetre) nt.textContent = "écrêtage + image entière : le bruit positif des « ailes », loin du centre, gonfle énormément D4σ.";
    else if (st.ecreter) nt.textContent = "la fenêtre ne sauve rien : avec l'écrêtage, le bruit a une moyenne positive partout. Désactive l'écrêtage.";
    else if (!st.fenetre) nt.textContent = "sans écrêtage, le bruit se compense en moyenne… mais sur toute l'image, le résultat reste instable : change le tirage.";
    else nt.textContent = "la méthode de la norme : pas d'écrêtage, fenêtre de 3 × D4σ itérée jusqu'à stabilité. Écart de l'ordre du %.";
    draw();
  }

  function couleur(v) {
    const t = Math.min(1, Math.pow(Math.abs(v), 0.45));
    if (v < 0) return [253 - 110 * t, 251 - 85 * t, 249 - 30 * t];
    if (t < 0.6) { const u = t / 0.6; return [253 - 27 * u, 251 - 196 * u, 249 - 206 * u]; }
    const u = (t - 0.6) / 0.4; return [226 - 183 * u, 55 - 29 * u, 43 - 36 * u];
  }

  function jauge(c, x, y, wd, nom, vrai, mes) {
    const S = Math.max(2.2 * vrai, isFinite(mes) ? mes * 1.08 : 0), X = v => x + Math.min(1, v / S) * wd;
    const bon = isFinite(mes) && Math.abs(mes / vrai - 1) <= 0.02;
    c.save();
    c.font = F.ui(13, 500); c.fillStyle = C.cocoa; c.textAlign = "left"; c.textBaseline = "bottom";
    c.fillText(`${nom} : ${isFinite(mes) ? fix(mes, 1) : "—"} px  (vrai ${fix(vrai, 1)})`, x, y - 8);
    c.fillStyle = C.dew; c.strokeStyle = C.ink; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect ? c.roundRect(x, y, wd, 16, 8) : c.rect(x, y, wd, 16); c.fill(); c.stroke();
    if (isFinite(mes)) { c.fillStyle = bon ? C.orange : C.sienna; c.beginPath(); c.roundRect ? c.roundRect(x, y, Math.max(4, X(mes) - x), 16, 8) : c.rect(x, y, Math.max(4, X(mes) - x), 16); c.fill(); }
    c.setLineDash([4, 3]); c.strokeStyle = C.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X(vrai), y - 4); c.lineTo(X(vrai), y + 20); c.stroke(); c.setLineDash([]);
    c.font = F.ui(11.5); c.fillStyle = C.soft; c.textAlign = "center"; c.textBaseline = "top"; c.fillText("vrai", X(vrai), y + 22);
    c.restore();
  }

  function draw() {
    if (!res) return;
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const narrow = w < 640;
    const iw = narrow ? w - 20 : Math.min(w * 0.6, (h - 20) * 4 / 3), ih = iw * 0.75, ix = 10, iy = 10, sc = iw / W;
    for (let i = 0; i < W * H; i++) { const [r, g, b] = couleur(img[i]); idata.data[4 * i] = r; idata.data[4 * i + 1] = g; idata.data[4 * i + 2] = b; idata.data[4 * i + 3] = 255; }
    octx.putImageData(idata, 0, 0);
    c.save(); c.imageSmoothingEnabled = false; c.drawImage(off, ix, iy, iw, ih); c.restore();
    const px = x => ix + (x + 0.5) * sc, py = y => iy + (y + 0.5) * sc;
    c.save(); c.beginPath(); c.rect(ix, iy, iw, ih); c.clip();
    const { m, win } = res;
    if (st.fenetre) { c.setLineDash([3, 3]); c.strokeStyle = C.sienna; c.lineWidth = 1.6; c.strokeRect(ix + win[0] * sc, iy + win[2] * sc, (win[1] - win[0] + 1) * sc, (win[3] - win[2] + 1) * sc); }
    c.setLineDash([5, 4]); c.strokeStyle = C.ink; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(px(X0), py(Y0), st.w * sc, st.w * ELL * sc, 0, 0, 7); c.stroke(); c.setLineDash([]);
    if (ok(m)) {
      c.strokeStyle = C.orange; c.lineWidth = 2.6;
      c.beginPath(); c.ellipse(px(m.cx), py(m.cy), Math.min(m.dx / 2 * sc, 5000), Math.min(m.dy / 2 * sc, 5000), 0, 0, 7); c.stroke();
      c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px(m.cx) - 7, py(m.cy)); c.lineTo(px(m.cx) + 7, py(m.cy)); c.moveTo(px(m.cx), py(m.cy) - 7); c.lineTo(px(m.cx), py(m.cy) + 7); c.stroke();
    }
    c.restore();
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.strokeRect(ix + 0.5, iy + 0.5, iw - 1, ih - 1);
    c.save(); c.font = F.ui(12); c.fillStyle = C.soft; c.textAlign = "left"; c.textBaseline = "top";
    c.fillText(narrow ? "noir : vrai 2w · orange : mesuré" + (st.fenetre ? " · brun : fenêtre" : "")
      : "pointillés noirs : vrai diamètre 2w · orange : D4σ mesuré" + (st.fenetre ? " · tirets bruns : fenêtre" : ""), ix, iy + ih + 6);
    c.restore();
    const tx = 2 * st.w, ty = 2 * st.w * ELL;
    if (narrow) {
      const gx = 14, gw = w - 28, y0 = iy + ih + 62;
      jauge(c, gx, y0, gw, "D4σ selon x", tx, ok(m) ? m.dx : NaN);
      jauge(c, gx, y0 + 62, gw, "D4σ selon y", ty, ok(m) ? m.dy : NaN);
    } else {
      const gx = ix + iw + 28, gw = w - gx - 14;
      c.save(); c.font = F.hand(22); c.fillStyle = C.orange; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("mesuré ou vrai ?", gx, 22); c.restore();
      jauge(c, gx, 110, gw, "D4σ selon x", tx, ok(m) ? m.dx : NaN);
      jauge(c, gx, 200, gw, "D4σ selon y", ty, ok(m) ? m.dy : NaN);
      c.save(); c.font = F.ui(12); c.fillStyle = C.soft; c.textAlign = "left"; c.textBaseline = "top";
      c.fillText("orange : écart ≤ 2 %", gx, 262);
      c.fillText("(la tolérance des tests)", gx, 280);
      c.fillText("brun : mesure faussée", gx, 298); c.restore();
    }
  }
  cv.onresize = draw;
  calc();
}
