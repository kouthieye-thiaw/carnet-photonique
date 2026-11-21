// Schéma interactif d'une source de courant AOP + MOSFET + shunt (puits côté bas) : courant, compliance, dissipations
import { C, F, canvas, controls, slider, readouts, fmt, text, rrect, arrow, note } from "../lib.js";

export default function (el) {
  const st = { Vcc: 5, Vdac: 1.2, div: 0.2, Rs: 10, bits: 12 };
  const cv = canvas(el, { height: w => (w < 640 ? 330 : 340) });
  const ctl = controls(el);
  slider(ctl, { label: "tension d'alimentation V+", min: 3, max: 12, step: 0.1, value: st.Vcc, unit: "V", fmt: v => fmt(v, 3), oninput: v => { st.Vcc = v; draw(); } });
  slider(ctl, { label: "consigne du DAC (0–3,3 V)", min: 0, max: 3.3, step: 0.005, value: st.Vdac, unit: "V", fmt: v => fmt(v, 3), oninput: v => { st.Vdac = v; draw(); } });
  slider(ctl, { label: "rapport du diviseur de consigne", min: 0.05, max: 1, step: 0.01, value: st.div, fmt: v => "× " + fmt(v, 2), oninput: v => { st.div = v; draw(); } });
  slider(ctl, { label: "résistance de shunt R_s", min: 1, max: 100, step: 0.5, value: st.Rs, unit: "Ω", fmt: v => fmt(v, 3), oninput: v => { st.Rs = v; draw(); } });
  const ro = readouts(el, [["i", "courant dans la diode"], ["vld", "tension de la diode"], ["vds", "V_DS du MOSFET"], ["pm", "dissipation MOSFET"], ["ps", "dissipation shunt"], ["res", "résolution (DAC 12 bits)"]]);
  const nt = note(el, "");
  const Vld = I => I <= 0 ? 0 : 1.75 + 0.06 * Math.log(1 + I / 0.0005) * 0.5 + 6 * I; // modèle de diode rouge (A)
  function draw() {
    const c = cv.ctx, w = cv.w, h = cv.h; cv.clear();
    const Vset = st.Vdac * st.div, Iw = Vset / st.Rs; // courant « voulu »
    const vds_min = 0.25;
    const Imax = Iw; let I = Iw; // si compliance insuffisante, le courant plafonne
    const head = st.Vcc - Vld(I) - I * st.Rs;
    if (head < vds_min) { let lo = 0, hi = Iw; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; (st.Vcc - Vld(m) - m * st.Rs >= vds_min) ? lo = m : hi = m; } I = lo; }
    const Vd = Vld(I), Vds = st.Vcc - Vd - I * st.Rs;
    // ---- schéma
    const s = Math.min(1, w / 720), X = x => x * s + (w - 720 * s) / 2, Y = y => y * (h / 340);
    c.lineWidth = 1.8; c.strokeStyle = C.ink; c.lineCap = "round";
    const L = (a, b, d, e) => { c.beginPath(); c.moveTo(X(a), Y(b)); c.lineTo(X(d), Y(e)); c.stroke(); };
    // rail V+
    L(430, 30, 600, 30); text(c, X(615), Y(30), "V+ = " + fmt(st.Vcc, 3) + " V", { align: "left", size: 13 });
    // diode laser (anode en haut)
    L(520, 30, 520, 70);
    c.fillStyle = C.paper; c.beginPath(); c.moveTo(X(500), Y(70)); c.lineTo(X(540), Y(70)); c.lineTo(X(520), Y(100)); c.closePath(); c.fill(); c.stroke(); L(500, 100, 540, 100);
    if (I > 0.003) { const a = Math.min(1, I / 0.06); for (let k = 0; k < 3; k++) arrow(c, X(546), Y(78 + k * 9), X(586), Y(70 + k * 9), { color: `rgba(226,55,43,${0.4 + 0.6 * a})`, width: 2, head: 7 }); }
    text(c, X(470), Y(85), "diode laser", { size: 12.5, align: "right" });
    L(520, 100, 520, 150);
    // MOSFET (drain en haut)
    L(520, 150, 520, 165); L(520, 215, 520, 230); c.lineWidth = 3; L(505, 162, 505, 218); c.lineWidth = 1.8; L(505, 165, 520, 165); L(505, 215, 520, 215); L(497, 165, 497, 215);
    arrow(c, X(520), Y(190), X(507), Y(190), { width: 1.4, head: 6 }); L(505, 190, 520, 190);
    L(460, 190, 497, 190); text(c, X(545), Y(190), "MOSFET", { size: 12.5, align: "left" });
    // shunt
    L(520, 230, 520, 250); c.fillStyle = C.paper; rrect(c, X(508), Y(250), 24 * s, Y(40) - Y(0), 3); c.fill(); c.stroke(); L(520, 290, 520, 315);
    text(c, X(545), Y(270), "R_s = " + fmt(st.Rs, 3) + " Ω", { size: 12.5, align: "left" });
    L(490, 315, 550, 315); L(500, 321, 540, 321); L(510, 327, 530, 327);
    // AOP
    c.fillStyle = C.paper; c.beginPath(); c.moveTo(X(330), Y(150)); c.lineTo(X(330), Y(230)); c.lineTo(X(400), Y(190)); c.closePath(); c.fill(); c.stroke();
    text(c, X(342), Y(170), "+", { size: 15 }); text(c, X(342), Y(210), "−", { size: 15 }); text(c, X(365), Y(242), "AOP", { size: 12 });
    L(400, 190, 430, 190); c.fillStyle = C.paper; rrect(c, X(430), Y(184), 30 * s, 12, 2); c.fill(); c.stroke(); text(c, X(445), Y(176), "R_g", { size: 11 });
    // contre-réaction depuis le haut du shunt
    L(520, 240, 300, 240); L(300, 240, 300, 210); L(300, 210, 330, 210);
    // consigne : DAC + diviseur
    L(120, 170, 330, 170);
    c.fillStyle = "rgba(255,111,30,.1)"; rrect(c, X(30), Y(150), 90 * s, Y(40) - Y(0), 8); c.fill(); c.stroke(); text(c, X(75), Y(170), "DAC", { size: 13 });
    c.fillStyle = C.paper; rrect(c, X(190), Y(162), 40 * s, 16, 3); c.fill(); c.stroke(); text(c, X(210), Y(152), "diviseur × " + fmt(st.div, 2), { size: 11 });
    // annotations dynamiques
    text(c, X(140), Y(120), "V_set = " + fmt(Vset * 1000, 3) + " mV", { hand: true, color: C.orange, size: 22, align: "left" });
    text(c, X(560), Y(130), "I = " + fmt(I * 1000, 3) + " mA", { hand: true, color: C.red, size: 24, align: "left" });
    text(c, X(300), Y(285), "V(−) = R_s·I = " + fmt(I * st.Rs * 1000, 3) + " mV", { size: 12, color: C.soft, align: "left" });
    // sorties
    const Pm = Vds * I, Ps = I * I * st.Rs, res = 3.3 / 4096 * st.div / st.Rs;
    ro("i", fmt(I * 1000, 4) + " mA", I < Imax - 1e-6); ro("vld", fmt(Vd, 3) + " V"); ro("vds", fmt(Vds, 3) + " V", Vds <= vds_min + 1e-3);
    ro("pm", fmt(Pm * 1000, 3) + " mW", Pm > 0.5); ro("ps", fmt(Ps * 1000, 3) + " mW", Ps > 0.25); ro("res", fmt(res * 1e6, 3) + " µA");
    nt.textContent = I < Imax - 1e-6 ? `compliance insuffisante : il faudrait ${fmt(Imax * 1000, 3)} mA mais il ne reste pas assez de tension pour le MOSFET. Monte V+ ou baisse R_s.` : Pm > 0.5 ? "le MOSFET dissipe beaucoup : dissipateur, ou baisse V+ (la tension en trop part en chaleur)." : "la boucle impose V(−) = V(+) : le courant vaut V_set / R_s, quelle que soit la diode (tant que la compliance suffit).";
  }
  cv.onresize = draw; draw();
}
