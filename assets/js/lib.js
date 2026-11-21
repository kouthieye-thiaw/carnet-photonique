/* lib.js — outils communs aux simulations du carnet (module ES)
   canvas net (HiDPI), traceur 2D avec axes lin/log, curseurs, affichages,
   boucle d'animation qui s'arrête hors écran. */

export const C = {
  ink: "#171717", cocoa: "#2b1a07", paper: "#fdfbf9", dew: "#f7efe9", orange: "#ff6f1e",
  sienna: "#ce500a", sky: "#3b82f6", pink: "#ff66cf", green: "#22c55e", mist: "#bebcbb",
  rule: "#e9e0d8", soft: "rgba(43,26,7,.62)", faint: "rgba(43,26,7,.35)", red: "#e2372b", ir: "#8f2a14", violet: "#7c3aed"
};
export const F = {
  ui: (s = 13, w = 400) => `${w} ${s}px Geist, Inter, system-ui, sans-serif`,
  hand: (s = 21) => `600 ${s}px Caveat, cursive`,
  serif: (s = 16, w = 600) => `${w} ${s}px Fraunces, Georgia, serif`,
  mono: (s = 12) => `${s}px "Geist Mono", ui-monospace, monospace`
};

/* ---------- formats ---------- */
const nf = new Map();
export function fmt(v, d = 3) {
  if (!isFinite(v)) return "—";
  if (v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3)) return v.toExponential(Math.max(0, d - 1)).replace(".", ",").replace("e", "·10^").replace("+", "");
  const k = "s" + d; if (!nf.has(k)) nf.set(k, new Intl.NumberFormat("fr-FR", { maximumSignificantDigits: d }));
  return nf.get(k).format(v);
}
export function fix(v, n = 1) { return isFinite(v) ? v.toFixed(n).replace(".", ",") : "—"; }
const PFX = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"]];
export function si(v, unit = "", d = 3) {
  if (!isFinite(v)) return "—"; if (v === 0) return "0 " + unit;
  const a = Math.abs(v); for (const [m, p] of PFX) { if (a >= m * 0.9995) return fmt(v / m, d) + " " + p + unit; }
  return fmt(v / 1e-15, d) + " f" + unit;
}
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export function linspace(a, b, n) { const o = new Array(n); for (let i = 0; i < n; i++) o[i] = a + (b - a) * i / (n - 1); return o; }
export function gaussRand() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
export function seeded(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* ---------- canvas HiDPI ---------- */
export function canvas(el, { height = 320, aspect = null, before = null } = {}) {
  const c = document.createElement("canvas");
  if (before) el.insertBefore(c, before); else { const ctl = el.querySelector(".controls, .readout, .btns"); ctl ? el.insertBefore(c, ctl) : el.appendChild(c); }
  const ctx = c.getContext("2d");
  const st = { c, ctx, w: 0, h: 0, dpr: 1, onresize: null };
  let lastW = -1;
  const fit = () => {
    const w = c.clientWidth || el.clientWidth; if (Math.abs(w - lastW) < 1) return; lastW = w;
    const hh = aspect ? Math.round(clamp(w / aspect, 200, 640)) : (typeof height === "function" ? height(w) : height);
    st.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    c.width = Math.round(w * st.dpr); c.height = Math.round(hh * st.dpr); c.style.height = hh + "px";
    st.w = w; st.h = hh; ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    st.onresize && st.onresize();
  };
  new ResizeObserver(fit).observe(el); fit();
  st.clear = () => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); };
  return st;
}

/* ---------- graduations « jolies » ---------- */
function niceStep(range, n) { const raw = range / n; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }
export function ticks(a, b, n = 6) { const s = niceStep(b - a, n); const out = []; for (let v = Math.ceil(a / s - 1e-9) * s; v <= b + s * 1e-9; v += s) out.push(Math.abs(v) < s * 1e-9 ? 0 : v); return out; }

/* ---------- traceur ---------- */
export class Plot {
  constructor(cv, o = {}) {
    this.cv = cv;
    this.o = Object.assign({ x0: 0, x1: 1, y0: 0, y1: 1, xlog: false, ylog: false, pad: { l: 58, r: 18, t: 18, b: 44 }, xlabel: "", ylabel: "", grid: true, xfmt: null, yfmt: null, nx: 7, ny: 5, y2: null }, o);
  }
  get ctx() { return this.cv.ctx; }
  set(o) { Object.assign(this.o, o); return this; }
  get L() { return this.o.pad.l; } get R() { return this.cv.w - this.o.pad.r; } get T() { return this.o.pad.t; } get B() { return this.cv.h - this.o.pad.b; }
  X(x) { const { x0, x1, xlog } = this.o; const t = xlog ? (Math.log10(x) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) : (x - x0) / (x1 - x0); return this.L + t * (this.R - this.L); }
  Y(y, ax) { const o = ax === 2 && this.o.y2 ? this.o.y2 : this.o; const t = this.o.ylog && ax !== 2 ? (Math.log10(y) - Math.log10(o.y0)) / (Math.log10(o.y1) - Math.log10(o.y0)) : (y - o.y0) / (o.y1 - o.y0); return this.B - t * (this.B - this.T); }
  invX(px) { const { x0, x1, xlog } = this.o; const t = (px - this.L) / (this.R - this.L); return xlog ? Math.pow(10, Math.log10(x0) + t * (Math.log10(x1) - Math.log10(x0))) : x0 + t * (x1 - x0); }
  invY(py) { const { y0, y1 } = this.o; const t = (this.B - py) / (this.B - this.T); return y0 + t * (y1 - y0); }
  clear() { this.cv.clear(); return this; }
  axes() {
    const c = this.ctx, o = this.o; c.save();
    const xt = o.xlog ? logTicks(o.x0, o.x1) : (o.xticks || ticks(o.x0, o.x1, Math.max(3, Math.round(o.nx * this.cv.w / 760))));
    const yt = o.ylog ? logTicks(o.y0, o.y1) : (o.yticks || ticks(o.y0, o.y1, o.ny));
    if (o.grid) {
      c.strokeStyle = C.rule; c.lineWidth = 1; c.setLineDash([3, 4]);
      xt.forEach(v => { const x = Math.round(this.X(v)) + .5; if (x < this.L - 1 || x > this.R + 1) return; c.beginPath(); c.moveTo(x, this.T); c.lineTo(x, this.B); c.stroke(); });
      yt.forEach(v => { const y = Math.round(this.Y(v)) + .5; if (y < this.T - 1 || y > this.B + 1) return; c.beginPath(); c.moveTo(this.L, y); c.lineTo(this.R, y); c.stroke(); });
      c.setLineDash([]);
    }
    c.strokeStyle = C.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(this.L, this.T - 4); c.lineTo(this.L, this.B); c.lineTo(this.R + 4, this.B); c.stroke();
    c.fillStyle = C.soft; c.font = F.ui(12);
    c.textAlign = "center"; c.textBaseline = "top";
    xt.forEach(v => { const x = this.X(v); if (x < this.L - 1 || x > this.R + 1) return; c.fillText(o.xfmt ? o.xfmt(v) : fmt(v, 4), x, this.B + 7); c.beginPath(); c.moveTo(x, this.B); c.lineTo(x, this.B + 4); c.strokeStyle = C.ink; c.lineWidth = 1; c.stroke(); });
    c.textAlign = "right"; c.textBaseline = "middle";
    yt.forEach(v => { const y = this.Y(v); if (y < this.T - 1 || y > this.B + 1) return; c.fillText(o.yfmt ? o.yfmt(v) : fmt(v, 4), this.L - 8, y); });
    if (o.y2) { const y2t = ticks(o.y2.y0, o.y2.y1, o.ny); c.textAlign = "left"; c.fillStyle = o.y2.color || C.sky; y2t.forEach(v => { const y = this.Y(v, 2); c.fillText(o.y2.fmt ? o.y2.fmt(v) : fmt(v, 4), this.R + 8, y); }); }
    c.fillStyle = C.cocoa; c.font = F.ui(13, 500);
    if (o.xlabel) { c.textAlign = "right"; c.textBaseline = "bottom"; c.fillText(o.xlabel, this.R, this.cv.h - 4); }
    if (o.ylabel) { c.save(); c.translate(14, this.T); c.rotate(-Math.PI / 2); c.textAlign = "right"; c.textBaseline = "middle"; c.fillText(o.ylabel, 0, 0); c.restore(); }
    if (o.y2 && o.y2.label) { c.save(); c.translate(this.cv.w - 6, this.T); c.rotate(-Math.PI / 2); c.textAlign = "right"; c.textBaseline = "middle"; c.fillStyle = o.y2.color || C.sky; c.fillText(o.y2.label, 0, 0); c.restore(); }
    c.restore(); return this;
  }
  clip(fn) { const c = this.ctx; c.save(); c.beginPath(); c.rect(this.L, this.T - 2, this.R - this.L, this.B - this.T + 2); c.clip(); fn(c); c.restore(); return this; }
  line(xs, ys, s = {}) {
    return this.clip(c => {
      c.strokeStyle = s.color || C.orange; c.lineWidth = s.width || 2.6; c.globalAlpha = s.alpha ?? 1; c.lineJoin = "round"; c.lineCap = "round"; if (s.dash) c.setLineDash(s.dash);
      c.beginPath(); let started = false;
      for (let i = 0; i < xs.length; i++) { const y = ys[i]; if (!isFinite(y) || (this.o.ylog && y <= 0)) { started = false; continue; } const px = this.X(xs[i]), py = this.Y(y, s.axis); if (!started) { c.moveTo(px, py); started = true; } else c.lineTo(px, py); }
      c.stroke();
    });
  }
  fn(f, s = {}) { const n = s.n || Math.max(200, Math.round(this.cv.w)); const xs = [], ys = []; const { x0, x1, xlog } = this.o; for (let i = 0; i < n; i++) { const t = i / (n - 1); const x = xlog ? Math.pow(10, Math.log10(x0) + t * (Math.log10(x1) - Math.log10(x0))) : x0 + t * (x1 - x0); xs.push(x); ys.push(f(x)); } return this.line(xs, ys, s); }
  area(xs, ys, s = {}) { return this.clip(c => { c.fillStyle = s.color || C.orange; c.globalAlpha = s.alpha ?? .15; c.beginPath(); c.moveTo(this.X(xs[0]), this.Y(s.base ?? this.o.y0)); xs.forEach((x, i) => c.lineTo(this.X(x), this.Y(ys[i]))); c.lineTo(this.X(xs[xs.length - 1]), this.Y(s.base ?? this.o.y0)); c.closePath(); c.fill(); }); }
  points(xs, ys, s = {}) { return this.clip(c => { c.fillStyle = s.color || C.ink; c.strokeStyle = s.stroke || C.paper; c.lineWidth = 1; xs.forEach((x, i) => { if (!isFinite(ys[i])) return; c.beginPath(); c.arc(this.X(x), this.Y(ys[i], s.axis), s.r || 3, 0, 7); c.fill(); if (s.ring) c.stroke(); }); }); }
  vline(x, s = {}) { const c = this.ctx; const px = this.X(x); if (px < this.L - 1 || px > this.R + 1) return this; c.save(); c.strokeStyle = s.color || C.ink; c.lineWidth = s.width || 1.4; c.setLineDash(s.dash || [5, 4]); c.beginPath(); c.moveTo(px, this.T); c.lineTo(px, this.B); c.stroke(); c.restore(); if (s.label) { const right = px > this.R - 150; this.label(px + (right ? -6 : 6), this.T + 4 + (s.dy || 0), s.label, { color: s.color || C.ink, align: right ? "right" : "left", base: "top", hand: s.hand }); } return this; }
  hline(y, s = {}) { const c = this.ctx; const py = this.Y(y, s.axis); if (py < this.T - 1 || py > this.B + 1) return this; c.save(); c.strokeStyle = s.color || C.ink; c.lineWidth = s.width || 1.4; c.setLineDash(s.dash || [5, 4]); c.beginPath(); c.moveTo(this.L, py); c.lineTo(this.R, py); c.stroke(); c.restore(); if (s.label) this.label(this.R - 4, py - 4, s.label, { color: s.color || C.ink, align: "right", base: "bottom", hand: s.hand }); return this; }
  label(px, py, t, s = {}) { const c = this.ctx; c.save(); c.fillStyle = s.color || C.ink; c.font = s.hand ? F.hand(s.size || 21) : F.ui(s.size || 12.5, s.weight || 500); c.textAlign = s.align || "left"; c.textBaseline = s.base || "middle"; if (s.halo !== false) { c.strokeStyle = C.paper; c.lineWidth = 4; c.lineJoin = "round"; c.strokeText(t, px, py); } c.fillText(t, px, py); c.restore(); return this; }
  at(x, y, t, s = {}) { return this.label(this.X(x) + (s.dx || 0), this.Y(y, s.axis) + (s.dy || 0), t, s); }
  legend(items, s = {}) { const c = this.ctx; c.save(); c.font = F.ui(12.5, 500); let y = this.T + 6; const x = s.left ? this.L + 12 : this.R - 10; items.forEach(it => { const w = c.measureText(it.label).width; const x0 = s.left ? x : x - w - 26; c.strokeStyle = it.color; c.lineWidth = it.width || 3; if (it.dash) c.setLineDash(it.dash); c.beginPath(); c.moveTo(x0, y + 7); c.lineTo(x0 + 18, y + 7); c.stroke(); c.setLineDash([]); c.fillStyle = C.ink; c.textBaseline = "middle"; c.textAlign = "left"; c.strokeStyle = C.paper; c.lineWidth = 4; c.strokeText(it.label, x0 + 24, y + 7); c.fillText(it.label, x0 + 24, y + 7); y += 20; }); c.restore(); return this; }
}
function logTicks(a, b) { const out = []; for (let e = Math.floor(Math.log10(a)); e <= Math.ceil(Math.log10(b)); e++) { const v = Math.pow(10, e); if (v >= a * 0.999 && v <= b * 1.001) out.push(v); } return out; }

/* ---------- contrôles ---------- */
export function controls(el) { let c = el.querySelector(":scope > .controls"); if (!c) { c = document.createElement("div"); c.className = "controls"; el.appendChild(c); } return c; }
export function slider(parent, { label, min, max, step = "any", value, unit = "", fmt: f = v => fmt(v, 3), log = false, oninput }) {
  const w = document.createElement("label"); w.className = "ctl";
  w.innerHTML = `<span class="lbl"><span>${label}</span><output></output></span><input type="range">`;
  const inp = w.querySelector("input"), out = w.querySelector("output");
  if (log) { inp.min = 0; inp.max = 1000; inp.step = 1; } else { inp.min = min; inp.max = max; inp.step = step; }
  const toV = r => log ? min * Math.pow(max / min, r / 1000) : +r;
  const toR = v => log ? 1000 * Math.log(v / min) / Math.log(max / min) : v;
  inp.value = toR(value);
  const show = v => out.textContent = f(v) + (unit ? " " + unit : "");
  const upd = () => { const v = toV(+inp.value); show(v); oninput && oninput(v); };
  inp.addEventListener("input", upd); parent.appendChild(w); show(toV(+inp.value));
  return { get value() { return toV(+inp.value); }, set value(v) { inp.value = toR(v); show(toV(+inp.value)); }, el: w, input: inp, refresh: upd };
}
export function select(parent, { label, options, value, oninput }) {
  const w = document.createElement("label"); w.className = "ctl";
  w.innerHTML = `<span class="lbl"><span>${label}</span></span><select>${options.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
  const s = w.querySelector("select"); if (value != null) s.value = value; s.addEventListener("change", () => oninput && oninput(s.value)); parent.appendChild(w);
  return { get value() { return s.value; }, set value(v) { s.value = v; }, el: w };
}
export function toggle(parent, { label, value = false, oninput }) {
  const w = document.createElement("label"); w.className = "ctl"; w.style.alignContent = "end";
  w.innerHTML = `<span style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" style="width:18px;height:18px;accent-color:#ff6f1e"> ${label}</span>`;
  const c = w.querySelector("input"); c.checked = value; c.addEventListener("change", () => oninput && oninput(c.checked)); parent.appendChild(w);
  return { get value() { return c.checked; }, set value(v) { c.checked = v; }, el: w };
}
export function buttons(el, defs) { let b = el.querySelector(":scope > .btns"); if (!b) { b = document.createElement("div"); b.className = "btns"; el.appendChild(b); } return defs.map(([t, fn, cls]) => { const x = document.createElement("button"); x.type = "button"; x.className = "pill small " + (cls || "ghost"); x.textContent = t; x.addEventListener("click", fn); b.appendChild(x); return x; }); }
export function readouts(el, defs) {
  let r = el.querySelector(":scope > .readout"); if (!r) { r = document.createElement("div"); r.className = "readout"; el.appendChild(r); }
  const map = {}; defs.forEach(([k, label]) => { const d = document.createElement("div"); d.className = "r"; d.innerHTML = `<b>—</b>${label}`; r.appendChild(d); map[k] = d; });
  return (k, v, warn = false) => { if (!map[k]) return; map[k].querySelector("b").textContent = v; map[k].classList.toggle("warn", !!warn); };
}
export function note(el, txt) { let n = el.querySelector(":scope > .lab-note"); if (!n) { n = document.createElement("div"); n.className = "lab-note"; el.appendChild(n); } n.textContent = txt; return n; }

/* ---------- animation économe ---------- */
export function loop(el, cb) {
  let raf = 0, visible = false, t0 = performance.now(), last = t0, running = true;
  const io = new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible && running && !raf) raf = requestAnimationFrame(tick); }, { threshold: 0.01 });
  io.observe(el);
  function tick(now) { raf = 0; if (!visible || !running) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; cb((now - t0) / 1000, dt); raf = requestAnimationFrame(tick); }
  return { stop() { running = false; }, start() { if (!running) { running = true; last = performance.now(); if (visible && !raf) raf = requestAnimationFrame(tick); } }, get running() { return running; } };
}
export const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- dessin « à la main » ---------- */
export function arrow(c, x1, y1, x2, y2, s = {}) {
  c.save(); c.strokeStyle = s.color || C.ink; c.fillStyle = s.color || C.ink; c.lineWidth = s.width || 1.6; c.lineCap = "round"; if (s.dash) c.setLineDash(s.dash);
  c.beginPath(); c.moveTo(x1, y1); if (s.curve) { const mx = (x1 + x2) / 2 + s.curve, my = (y1 + y2) / 2 - s.curve; c.quadraticCurveTo(mx, my, x2, y2); } else c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
  const a = Math.atan2(y2 - (s.curve ? (y1 + y2) / 2 - s.curve : y1), x2 - (s.curve ? (x1 + x2) / 2 + s.curve : x1)); const L = s.head || 9;
  c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - L * Math.cos(a - 0.42), y2 - L * Math.sin(a - 0.42)); if (s.open) { c.moveTo(x2, y2); } else { c.lineTo(x2 - L * Math.cos(a + 0.42), y2 - L * Math.sin(a + 0.42)); c.closePath(); c.fill(); }
  if (s.open) { c.lineTo(x2 - L * Math.cos(a + 0.42), y2 - L * Math.sin(a + 0.42)); c.stroke(); }
  c.restore();
}
export function rrect(c, x, y, w, h, r = 8) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
export function text(c, x, y, t, s = {}) { c.save(); c.fillStyle = s.color || C.ink; c.font = s.font || (s.hand ? F.hand(s.size || 21) : F.ui(s.size || 13, s.weight || 500)); c.textAlign = s.align || "center"; c.textBaseline = s.base || "middle"; if (s.halo) { c.strokeStyle = C.paper; c.lineWidth = 4; c.lineJoin = "round"; c.strokeText(t, x, y); } c.fillText(t, x, y); c.restore(); }

/* couleur approximative d'une longueur d'onde (nm) pour les dessins */
export function lambdaColor(nm, a = 1) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm <= 780) { r = 1; }
  let f = 1; if (nm >= 380 && nm < 420) f = .3 + .7 * (nm - 380) / 40; else if (nm > 700 && nm <= 780) f = .3 + .7 * (780 - nm) / 80; else if (nm < 380 || nm > 780) f = 0;
  if (f === 0) return nm > 780 ? `rgba(143,42,20,${a})` : `rgba(124,58,237,${a})`;
  const k = v => Math.round(255 * Math.pow(v * f, 0.8));
  return `rgba(${k(r)},${k(g)},${k(b)},${a})`;
}
