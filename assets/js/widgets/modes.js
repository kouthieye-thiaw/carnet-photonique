// Modes longitudinaux sous la courbe de gain + motifs des modes transverses TEMmn (Hermite-Gauss)
import { C, canvas, Plot, controls, slider, select, readouts, fmt, note } from "../lib.js";

function hermite(n, x) { if (n === 0) return 1; if (n === 1) return 2 * x; let a = 1, b = 2 * x; for (let k = 2; k <= n; k++) { const c = 2 * x * b - 2 * (k - 1) * a; a = b; b = c; } return b; }

export default function (el) {
  const st = { L: 30, gw: 1.5, drift: 0, m: 0, n: 0, pump: 1.6 };
  const spec = canvas(el, { height: w => (w < 640 ? 260 : 280) });
  const ctl = controls(el);
  slider(ctl, { label: "longueur de cavité L (air)", min: 1, max: 100, step: 0.5, value: st.L, unit: "cm", fmt: v => fmt(v, 3), oninput: v => { st.L = v; draw(); } });
  slider(ctl, { label: "largeur de la courbe de gain", min: 0.2, max: 6, step: 0.05, value: st.gw, unit: "GHz", fmt: v => fmt(v, 3), oninput: v => { st.gw = v; draw(); } });
  slider(ctl, { label: "pompage (gain max / pertes)", min: 0.6, max: 3, step: 0.01, value: st.pump, fmt: v => fmt(v, 3), oninput: v => { st.pump = v; draw(); } });
  slider(ctl, { label: "dérive de la cavité (température)", min: -1, max: 1, step: 0.005, value: 0, fmt: v => fmt(v, 2) + " ISL", oninput: v => { st.drift = v; draw(); } });
  const ro = readouts(el, [["isl", "ISL = c/2L"], ["nb", "modes au-dessus du seuil"], ["dl", "écart en λ (à 633 nm)"]]);
  const nt = note(el, "");
  // modes transverses
  const tem = document.createElement("div"); tem.style.cssText = "display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-top:16px";
  tem.innerHTML = `<canvas width="180" height="180" style="width:180px;height:180px;border-radius:12px;background:#171717" aria-label="motif du mode transverse"></canvas><div class="controls" style="flex:1;margin:0"></div>`;
  el.appendChild(tem);
  const tc = tem.querySelector("canvas"), tctl = tem.querySelector(".controls");
  select(tctl, { label: "mode transverse TEM m", value: "0", options: [0, 1, 2, 3].map(v => [String(v), "m = " + v]), oninput: v => { st.m = +v; drawTem(); } });
  select(tctl, { label: "TEM n", value: "0", options: [0, 1, 2, 3].map(v => [String(v), "n = " + v]), oninput: v => { st.n = +v; drawTem(); } });
  function drawTem() {
    const c = tc.getContext("2d"), N = 180, img = c.createImageData(N, N); let max = 0; const vals = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i - N / 2) / 34, y = (j - N / 2) / 34; const v = (hermite(st.m, Math.SQRT2 * x) * hermite(st.n, Math.SQRT2 * y)) ** 2 * Math.exp(-2 * (x * x + y * y)); vals[j * N + i] = v; if (v > max) max = v; }
    for (let k = 0; k < N * N; k++) { const v = Math.pow(vals[k] / max, 0.8); img.data[4 * k] = 255 * Math.min(1, v * 1.4); img.data[4 * k + 1] = 255 * Math.max(0, v - 0.35) * 1.2; img.data[4 * k + 2] = 255 * Math.max(0, v - 0.75) * 3; img.data[4 * k + 3] = 255; }
    c.putImageData(img, 0, 0); c.fillStyle = "#fdfbf9"; c.font = "600 18px Caveat"; c.fillText(`TEM${st.m}${st.n}`, 10, 24);
  }
  function draw() {
    const isl = 0.3 / (2 * st.L / 100) ; // GHz (c = 0,3 m/ns)
    const span = Math.max(4 * st.gw, 3 * isl);
    const p = new Plot(spec, { x0: -span / 2, x1: span / 2, y0: 0, y1: st.pump * 1.15 + 0.1, xlabel: "fréquence relative (GHz)", ylabel: "gain / pertes", xfmt: v => fmt(v, 3) });
    spec.clear(); p.axes();
    const g = f => st.pump * Math.exp(-4 * Math.log(2) * f * f / (st.gw * st.gw));
    p.fn(g, { color: C.orange, width: 2.8 }); p.hline(1, { color: C.ink, label: "pertes (seuil)", hand: true });
    let nb = 0; const k0 = Math.ceil((-span / 2) / isl - st.drift - 1), k1 = Math.floor((span / 2) / isl - st.drift + 1);
    for (let k = k0; k <= k1 && k - k0 < 400; k++) {
      const f = (k + st.drift) * isl; if (f < -span / 2 || f > span / 2) continue;
      const on = g(f) > 1; if (on) nb++;
      const c = spec.ctx, x = p.X(f); c.strokeStyle = on ? C.red : C.mist; c.lineWidth = on ? 3 : 1.2; c.beginPath(); c.moveTo(x, p.B); c.lineTo(x, on ? p.Y(Math.min(g(f), st.pump)) : p.Y(0.15)); c.stroke();
    }
    ro("isl", isl >= 1 ? fmt(isl, 3) + " GHz" : fmt(isl * 1000, 3) + " MHz"); ro("nb", String(nb), nb > 1);
    const dl = 633e-9 ** 2 * isl * 1e9 / 3e8; ro("dl", fmt(dl * 1e12, 3) + " pm");
    nt.textContent = nb === 0 ? "aucun mode ne dépasse les pertes : pas d'effet laser." : nb === 1 ? "un seul mode longitudinal au-dessus du seuil : laser monofréquence (si la dérive le fait sortir, saut de mode !)." : `${nb} modes oscillent : le spectre a ${nb} raies séparées de l'ISL — et leurs battements donnent des pics à l'ISL sur un analyseur RF.`;
  }
  spec.onresize = draw; draw(); drawTem();
}
