// Outils communs : nombres à la française, unités, stockage local, tracés SVG.
const MU0 = 4 * Math.PI * 1e-7;
const EPS0 = 8.85e-12;
const C0 = 3e8;
const RHO_CU = 1.7e-8;

const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

function fr(x, sig = 3) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) return sci(x, sig);
  const n = Number(x.toPrecision(sig));
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
}

function sci(x, sig = 3) {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = Number((x / 10 ** e).toPrecision(sig));
  const mant = m.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
  if (e === 0) return mant;
  const exp = String(e).split("").map((c) => SUP[c]).join("");
  return (mant === "1" ? "" : mant + " × ") + "10" + exp;
}

const PREFIX = [
  [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"], [1e-15, "f"],
];
function eng(x, unit = "", sig = 3) {
  if (!isFinite(x)) return "—";
  if (x === 0) return "0 " + unit;
  const a = Math.abs(x);
  for (const [k, p] of PREFIX) if (a >= k * 0.9995) return fr(x / k, sig) + " " + p + unit;
  return sci(x, sig) + " " + unit;
}

function parseNum(text) {
  if (text == null) return NaN;
  let s = String(text).trim().replace(/\s/g, "").replace(/,/g, ".").replace(/−/g, "-");
  s = s.replace(/[×x\*]10\^?/i, "e").replace(/\^/g, "");
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

function close(given, expected, tol = 0.05) {
  if (!isFinite(given)) return false;
  if (expected === 0) return Math.abs(given) < 1e-9;
  return Math.abs(given - expected) / Math.abs(expected) <= tol;
}

const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("cem:" + key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("cem:" + key, JSON.stringify(value));
    } catch {}
  },
};

const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};

// Petit traceur SVG : axes lin ou log, séries, repères verticaux.
function plot(host, o) {
  const W = o.w || 640, H = o.h || 300;
  const m = { l: 58, r: 16, t: 14, b: 40 };
  const X = o.x, Y = o.y;
  const tx = (v) => {
    const a = X.log ? Math.log10(v) : v, lo = X.log ? Math.log10(X.min) : X.min, hi = X.log ? Math.log10(X.max) : X.max;
    return m.l + ((a - lo) / (hi - lo)) * (W - m.l - m.r);
  };
  const ty = (v) => {
    const a = Y.log ? Math.log10(Math.max(v, Y.min * 1e-3)) : v, lo = Y.log ? Math.log10(Y.min) : Y.min, hi = Y.log ? Math.log10(Y.max) : Y.max;
    const p = H - m.b - ((a - lo) / (hi - lo)) * (H - m.t - m.b);
    return Math.max(m.t - 40, Math.min(H - m.b + 40, p));
  };
  const ticks = (A) => {
    if (A.log) {
      const out = [];
      for (let e = Math.ceil(Math.log10(A.min) - 1e-9); e <= Math.floor(Math.log10(A.max) + 1e-9); e++) out.push(10 ** e);
      return out;
    }
    const span = A.max - A.min, step = 10 ** Math.floor(Math.log10(span / 5));
    const k = span / step > 10 ? step * 2 : step;
    const out = [];
    for (let v = Math.ceil(A.min / k) * k; v <= A.max + 1e-12; v += k) out.push(Number(v.toPrecision(10)));
    return out;
  };
  const fx = X.fmt || ((v) => eng(v, X.unit || ""));
  const fy = Y.fmt || ((v) => eng(v, Y.unit || ""));
  let s = `<svg viewBox="0 0 ${W} ${H}" class="plot" role="img" aria-label="${o.label || "graphique"}">`;
  s += `<defs><clipPath id="clip-${o.id}"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/></clipPath></defs>`;
  if (X.log)
    for (let e = Math.floor(Math.log10(X.min)); e < Math.log10(X.max); e++)
      for (let k = 2; k < 10; k++) {
        const v = k * 10 ** e;
        if (v > X.min && v < X.max) s += `<line class="g2" x1="${tx(v)}" x2="${tx(v)}" y1="${m.t}" y2="${H - m.b}"/>`;
      }
  for (const v of ticks(X)) s += `<line class="g" x1="${tx(v)}" x2="${tx(v)}" y1="${m.t}" y2="${H - m.b}"/><text class="tk" x="${tx(v)}" y="${H - m.b + 16}" text-anchor="middle">${fx(v)}</text>`;
  for (const v of ticks(Y)) s += `<line class="g" x1="${m.l}" x2="${W - m.r}" y1="${ty(v)}" y2="${ty(v)}"/><text class="tk" x="${m.l - 6}" y="${ty(v) + 4}" text-anchor="end">${fy(v)}</text>`;
  s += `<rect class="frame" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}"/>`;
  s += `<g clip-path="url(#clip-${o.id})">`;
  for (const b of o.bands || []) s += `<rect class="${b.cls}" x="${tx(b.x0)}" y="${m.t}" width="${tx(b.x1) - tx(b.x0)}" height="${H - m.t - m.b}"/>`;
  for (const l of o.hlines || []) s += `<line class="${l.cls || "mark"}" x1="${m.l}" x2="${W - m.r}" y1="${ty(l.y)}" y2="${ty(l.y)}"/>`;
  for (const se of o.series) {
    if (se.stems) {
      for (const [x, y] of se.pts) s += `<line class="${se.cls}" x1="${tx(x)}" x2="${tx(x)}" y1="${ty(Y.log ? Y.min : 0)}" y2="${ty(y)}"/>`;
    } else {
      const d = se.pts.filter(([x, y]) => isFinite(y) && x >= X.min && x <= X.max).map(([x, y], i) => `${i ? "L" : "M"}${tx(x).toFixed(1)} ${ty(y).toFixed(1)}`).join("");
      s += `<path class="${se.cls}" d="${d}"/>`;
    }
  }
  s += `</g>`;
  for (const mk of o.marks || []) {
    if (mk.x < X.min || mk.x > X.max) continue;
    s += `<line class="${mk.cls || "mark"}" x1="${tx(mk.x)}" x2="${tx(mk.x)}" y1="${m.t}" y2="${H - m.b}"/>`;
    if (mk.label) s += `<text class="mk" x="${tx(mk.x) + 5}" y="${m.t + 14 + (mk.dy || 0)}">${mk.label}</text>`;
  }
  for (const p of o.points || []) s += `<circle class="${p.cls || "pt"}" cx="${tx(p.x)}" cy="${ty(p.y)}" r="4"/>`;
  if (X.label) s += `<text class="ax" x="${W - m.r}" y="${H - 6}" text-anchor="end">${X.label}</text>`;
  if (Y.label) s += `<text class="ax" x="${m.l}" y="${m.t - 2}" dy="-1">${Y.label}</text>`;
  s += `</svg>`;
  host.innerHTML = s;
}

const logspace = (a, b, n) => Array.from({ length: n }, (_, i) => 10 ** (Math.log10(a) + ((Math.log10(b) - Math.log10(a)) * i) / (n - 1)));
