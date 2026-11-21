// Conception d'un TIA pour photodiode : tension de sortie, bande passante, capacité de compensation, bruits, SNR
import { C, canvas, Plot, controls, slider, select, readouts, fmt, si, note } from "../lib.js";

export default function (el) {
  const st = { P: 0.5e-3, R: 0.43, Rf: 10e3, Cd: 70e-12, gbw: 38e6, vmax: 3.2 };
  const cv = canvas(el, { height: w => (w < 640 ? 260 : 280) });
  const ctl = controls(el);
  select(ctl, { label: "détecteur et longueur d'onde", value: "0.43", options: [["0.43", "silicium à 650 nm (0,43 A/W)"], ["0.55", "silicium à 850 nm (0,55 A/W)"], ["0.95", "InGaAs à 1550 nm (0,95 A/W)"]], oninput: v => { st.R = +v; draw(); } });
  slider(ctl, { label: "puissance sur la photodiode", min: 1e-6, max: 5e-3, log: true, value: st.P, fmt: v => si(v, "W", 3), oninput: v => { st.P = v; draw(); } });
  slider(ctl, { label: "résistance de contre-réaction R_f", min: 1e3, max: 1e7, log: true, value: st.Rf, fmt: v => si(v, "Ω", 3), oninput: v => { st.Rf = v; draw(); } });
  slider(ctl, { label: "capacité de la photodiode C_d", min: 1e-12, max: 300e-12, log: true, value: st.Cd, fmt: v => si(v, "F", 3), oninput: v => { st.Cd = v; draw(); } });
  slider(ctl, { label: "produit gain-bande de l'AOP", min: 1e6, max: 200e6, log: true, value: st.gbw, fmt: v => si(v, "Hz", 3), oninput: v => { st.gbw = v; draw(); } });
  const ro = readouts(el, [["i", "photocourant"], ["v", "tension de sortie"], ["cf", "C_f conseillée"], ["bw", "bande passante"], ["n", "bruit total (rms)"], ["snr", "rapport signal/bruit"]]);
  const nt = note(el, "");
  function draw() {
    const q = 1.602e-19, k = 1.381e-23, T = 298, Cin = st.Cd + 5e-12, Id = 1e-9;
    const Iph = st.R * st.P, Vraw = Iph * st.Rf, sat = Vraw > st.vmax, Vout = Math.min(Vraw, st.vmax);
    const Cf = Math.sqrt(Cin / (2 * Math.PI * st.Rf * st.gbw));
    const bw = 1 / (2 * Math.PI * st.Rf * Cf);
    const Bn = bw * 1.57; // bande équivalente de bruit (1er ordre)
    const ish = Math.sqrt(2 * q * (Iph + Id) * Bn), ith = Math.sqrt(4 * k * T * Bn / st.Rf), en = 8e-9 * Math.sqrt(Bn) * (1 + Cin / Cf) / st.Rf;
    const itot = Math.sqrt(ish ** 2 + ith ** 2 + en ** 2), vn = itot * st.Rf;
    // diagramme de Bode de la transimpédance
    const p = new Plot(cv, { x0: 10, x1: 1e9, xlog: true, y0: st.Rf / 1e4, y1: st.Rf * 3, ylog: true, xlabel: "fréquence (Hz)", ylabel: "transimpédance (Ω)", xfmt: v => si(v, "", 1).trim() });
    cv.clear(); p.axes();
    const Z = f => st.Rf / Math.sqrt(1 + (f / bw) ** 2) / Math.sqrt(1 + (f / (st.gbw * Cf / (Cf + Cin) * 2)) ** 2);
    p.fn(Z, { color: C.orange, width: 2.8 }); p.vline(bw, { color: C.cocoa, label: "−3 dB : " + si(bw, "Hz", 3), hand: true });
    ro("i", si(Iph, "A", 3)); ro("v", sat ? "saturée !" : si(Vout, "V", 3), sat); ro("cf", si(Cf, "F", 3)); ro("bw", si(bw, "Hz", 3)); ro("n", si(vn, "V", 3)); ro("snr", fmt(20 * Math.log10(Vout / vn), 3) + " dB");
    nt.textContent = sat ? "la sortie sature : baisse R_f (ou la puissance avec une densité). Vise 50–80 % de la pleine échelle de l'ADC." : bw > 1e6 && st.Rf > 1e6 ? "attention : grande R_f et grande bande sont difficiles à avoir ensemble — c'est C_d qui limite." : "plus R_f est grand, meilleur est le bruit thermique relatif… mais plus la bande se réduit et la sortie sature vite. Tout est compromis.";
  }
  cv.onresize = draw; draw();
}
