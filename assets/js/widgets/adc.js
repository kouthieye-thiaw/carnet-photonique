// Quantification d'un ADC (bits, LSB, bruit, SNR) + trame I²C dessinée bit par bit
import { C, F, canvas, Plot, controls, slider, readouts, fmt, text, note } from "../lib.js";

export default function (el) {
  const st = { bits: 4, fs: 4.096, addr: 0x48, data: 0xA3, rw: 0 };
  const cq = canvas(el, { height: 230 });
  const ctl = controls(el);
  slider(ctl, { label: "résolution de l'ADC", min: 2, max: 16, step: 1, value: st.bits, unit: "bits", oninput: v => { st.bits = v; drawQ(); } });
  slider(ctl, { label: "pleine échelle (±)", min: 0.256, max: 6.144, step: 0.001, value: st.fs, unit: "V", fmt: v => fmt(v, 4), oninput: v => { st.fs = v; drawQ(); } });
  const ro = readouts(el, [["lsb", "quantum (LSB)"], ["snr", "SNR idéal"], ["qn", "bruit de quantification (rms)"]]);
  const ci = canvas(el, { height: 190 });
  const ctl2 = document.createElement("div"); ctl2.className = "controls"; el.appendChild(ctl2);
  slider(ctl2, { label: "adresse I²C (7 bits)", min: 0x08, max: 0x77, step: 1, value: st.addr, fmt: v => "0x" + Math.round(v).toString(16).toUpperCase(), oninput: v => { st.addr = Math.round(v); drawI(); } });
  slider(ctl2, { label: "octet de donnée", min: 0, max: 255, step: 1, value: st.data, fmt: v => "0x" + Math.round(v).toString(16).toUpperCase().padStart(2, "0") + " (" + Math.round(v) + ")", oninput: v => { st.data = Math.round(v); drawI(); } });
  const nt = note(el, "");
  function drawQ() {
    const N = Math.pow(2, st.bits), lsb = 2 * st.fs / N;
    const p = new Plot(cq, { x0: 0, x1: 1, y0: -st.fs * 1.1, y1: st.fs * 1.1, xlabel: "temps", ylabel: "tension (V)", xticks: [] });
    cq.clear(); p.axes();
    const sig = t => 0.9 * st.fs * Math.sin(2 * Math.PI * t * 1.5) + 0.25 * st.fs * Math.sin(2 * Math.PI * t * 4.2);
    p.fn(sig, { color: C.mist, width: 1.6 });
    p.fn(t => Math.max(-st.fs, Math.min(st.fs - lsb, Math.floor(sig(t) / lsb + 0.5) * lsb)), { color: C.orange, width: 2.2, n: 1200 });
    ro("lsb", lsb >= 1e-3 ? fmt(lsb * 1000, 4) + " mV" : fmt(lsb * 1e6, 4) + " µV"); ro("snr", fmt(6.02 * st.bits + 1.76, 3) + " dB"); ro("qn", fmt(lsb / Math.sqrt(12) * 1e6, 3) + " µV");
  }
  function drawI() {
    const c = ci.ctx, w = ci.w, h = ci.h; ci.clear();
    const bits = [];
    bits.push({ t: "S", k: "start" });
    for (let i = 6; i >= 0; i--) bits.push({ t: (st.addr >> i) & 1, k: "addr" });
    bits.push({ t: st.rw, k: "rw" }); bits.push({ t: 0, k: "ack" });
    for (let i = 7; i >= 0; i--) bits.push({ t: (st.data >> i) & 1, k: "data" });
    bits.push({ t: 0, k: "ack" }); bits.push({ t: "P", k: "stop" });
    const x0 = 46, cw = (w - x0 - 12) / bits.length, ySCL = 46, ySDA = 110, A = 18;
    text(c, 8, ySCL, "SCL", { align: "left", size: 12 }); text(c, 8, ySDA, "SDA", { align: "left", size: 12 });
    const col = { start: C.green, addr: C.sky, rw: C.violet, ack: C.pink, data: C.orange, stop: C.green };
    bits.forEach((b, i) => { const x = x0 + i * cw; c.fillStyle = col[b.k] + "22"; c.fillRect(x, 20, cw, 120); });
    // SCL
    c.strokeStyle = C.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x0, ySCL - A);
    bits.forEach((b, i) => { const x = x0 + i * cw; if (b.k === "start" || b.k === "stop") { c.lineTo(x + cw, ySCL - A); } else { c.lineTo(x + cw * 0.25, ySCL - A); c.lineTo(x + cw * 0.25, ySCL + A); c.lineTo(x + cw * 0.75, ySCL + A); c.lineTo(x + cw * 0.75, ySCL - A); c.lineTo(x + cw, ySCL - A); } });
    c.stroke();
    // SDA (haut = 1). Start : SDA descend pendant SCL haut ; stop : remonte pendant SCL haut
    c.beginPath(); let y = ySDA - A; c.moveTo(x0, y);
    bits.forEach((b, i) => { const x = x0 + i * cw; let lv; if (b.k === "start") { c.lineTo(x + cw * 0.5, ySDA - A); c.lineTo(x + cw * 0.5, ySDA + A); y = ySDA + A; c.lineTo(x + cw, y); return; } if (b.k === "stop") { c.lineTo(x + cw * 0.5, ySDA + A); c.lineTo(x + cw * 0.5, ySDA - A); c.lineTo(x + cw, ySDA - A); return; } lv = b.t ? ySDA - A : ySDA + A; c.lineTo(x + 2, y); c.lineTo(x + 2, lv); c.lineTo(x + cw, lv); y = lv; });
    c.stroke();
    bits.forEach((b, i) => { const x = x0 + i * cw + cw / 2; text(c, x, 156, String(b.t), { size: 12, weight: 600 }); });
    const lab = [["start", 0, 1], ["adresse 7 bits", 1, 8], ["R/W̄", 8, 9], ["ACK", 9, 10], ["donnée (8 bits)", 10, 18], ["ACK", 18, 19], ["stop", 19, 20]];
    lab.forEach(([t, a, b]) => text(c, x0 + (a + b) / 2 * cw, 176, t, { size: 11, color: C.soft }));
    nt.textContent = `adresse 0x${st.addr.toString(16).toUpperCase()} = ${st.addr.toString(2).padStart(7, "0")} en binaire, puis le bit R/W̄ (0 = écriture), l'accusé de réception (ACK, tiré à 0 par l'esclave), l'octet 0x${st.data.toString(16).toUpperCase().padStart(2, "0")} poids fort en premier.`;
  }
  cq.onresize = drawQ; ci.onresize = drawI; drawQ(); drawI();
}
