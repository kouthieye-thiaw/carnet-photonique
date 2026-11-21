// Convertisseur mW <-> dBm + budget de liaison optique (escalier de puissance en dBm)
import { C, F, canvas, Plot, controls, slider, readouts, fmt, note } from "../lib.js";

export default function (el) {
  // --- convertisseur
  const conv = document.createElement("div");
  conv.className = "check-row"; conv.style.marginBottom = "14px";
  conv.innerHTML = `<label class="small">puissance <input type="text" inputmode="decimal" value="1" data-mw aria-label="puissance en mW"> mW</label>
    <span class="hand sm" style="transform:none">⇄</span>
    <label class="small"><input type="text" inputmode="decimal" value="0" data-dbm aria-label="puissance en dBm"> dBm</label>`;
  el.insertBefore(conv, el.querySelector(".controls") || null);
  const imw = conv.querySelector("[data-mw]"), idbm = conv.querySelector("[data-dbm]");
  const num = s => parseFloat(String(s).replace(",", "."));
  imw.addEventListener("input", () => { const v = num(imw.value); if (v > 0) idbm.value = fmt(10 * Math.log10(v), 4); });
  idbm.addEventListener("input", () => { const v = num(idbm.value); if (isFinite(v)) imw.value = fmt(Math.pow(10, v / 10), 4); });

  // --- budget de liaison
  const st = { src: 3, km: 40, att: 0.2, nc: 4, split: 8, gain: 0, sens: -28 };
  const cv = canvas(el, { height: w => (w < 640 ? 300 : 320) });
  const ctl = controls(el);
  slider(ctl, { label: "laser émetteur", min: -10, max: 20, step: 0.5, value: st.src, unit: "dBm", oninput: v => { st.src = v; draw(); } });
  slider(ctl, { label: "longueur de fibre", min: 0, max: 120, step: 1, value: st.km, unit: "km", oninput: v => { st.km = v; draw(); } });
  slider(ctl, { label: "atténuation de la fibre", min: 0.15, max: 0.5, step: 0.01, value: st.att, unit: "dB/km", fmt: v => fmt(v, 2), oninput: v => { st.att = v; draw(); } });
  slider(ctl, { label: "connecteurs (0,3 dB chacun)", min: 0, max: 10, step: 1, value: st.nc, oninput: v => { st.nc = v; draw(); } });
  slider(ctl, { label: "coupleur 1 vers N", min: 1, max: 64, step: 1, value: st.split, fmt: v => "1:" + v, oninput: v => { st.split = v; draw(); } });
  slider(ctl, { label: "amplificateur (EDFA)", min: 0, max: 30, step: 0.5, value: st.gain, unit: "dB", oninput: v => { st.gain = v; draw(); } });
  slider(ctl, { label: "sensibilité du récepteur", min: -40, max: -10, step: 0.5, value: st.sens, unit: "dBm", oninput: v => { st.sens = v; draw(); } });
  const ro = readouts(el, [["rx", "puissance reçue"], ["mw", "soit"], ["loss", "pertes totales"], ["marge", "marge"]]);
  const nt = note(el, "");

  function chain() {
    const steps = [["laser", st.src]];
    let p = st.src;
    const add = (n, d) => { p += d; steps.push([n, p]); };
    add("connecteur", -0.3 * Math.min(1, st.nc));
    if (st.gain > 0) add("ampli", st.gain);
    add("fibre", -st.att * st.km);
    for (let i = 1; i < st.nc; i++) add("conn.", -0.3);
    if (st.split > 1) add("coupleur", -(10 * Math.log10(st.split) + 0.5));
    return steps;
  }
  function draw() {
    const s = chain(), rx = s[s.length - 1][1];
    const p = new Plot(cv, { x0: -0.5, x1: s.length - 0.5, y0: Math.min(st.sens - 6, rx - 6, -45), y1: Math.max(st.src, ...s.map(x => x[1])) + 6, ylabel: "puissance (dBm)", xticks: [], ny: 6, yfmt: v => fmt(v, 3) });
    cv.clear(); p.axes();
    p.hline(st.sens, { color: C.sky, label: "sensibilité " + fmt(st.sens, 3) + " dBm", hand: true });
    const c = cv.ctx; c.save(); c.strokeStyle = C.orange; c.lineWidth = 3; c.lineJoin = "round"; c.beginPath();
    s.forEach(([n, v], i) => { const x0 = p.X(i - 0.45), x1 = p.X(i + 0.45), y = p.Y(v); if (i === 0) c.moveTo(x0, y); else c.lineTo(x0, y); c.lineTo(x1, y); });
    c.stroke(); c.restore();
    s.forEach(([n, v], i) => { p.at(i, v, fmt(v, 3), { dy: -12, align: "center", size: 12 }); p.label(p.X(i), p.B + 14, n, { align: "center", size: 11.5, color: C.soft }); });
    const loss = st.src + st.gain - rx, marge = rx - st.sens;
    ro("rx", fmt(rx, 3) + " dBm"); ro("mw", fmtMw(Math.pow(10, rx / 10))); ro("loss", fmt(loss, 3) + " dB"); ro("marge", fmt(marge, 3) + " dB", marge < 3);
    nt.textContent = marge < 0 ? "le récepteur ne voit plus rien : il faut moins de pertes ou un ampli." : marge < 3 ? "ça passe de justesse : en pratique on garde au moins 3 dB de marge (vieillissement, réparations)." : "liaison confortable. note : on additionne des dB — jamais des dBm entre eux !";
  }
  const fmtMw = mw => mw >= 1 ? fmt(mw, 3) + " mW" : mw >= 1e-3 ? fmt(mw * 1e3, 3) + " µW" : fmt(mw * 1e6, 3) + " nW";
  cv.onresize = draw; draw();
}
