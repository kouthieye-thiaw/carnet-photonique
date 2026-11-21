// Laboratoires : chaque labo a des réglages, des préréglages tirés du TD et un rendu qui recalcule tout.

const LABS = [
  {
    id: "front", title: "Spectre d'un signal logique", diapos: "diapos 64–68, 132", exos: ["c1"],
    intro: "Un créneau trapézoïdal contient une infinité d'harmoniques. Leur enveloppe est plate jusqu'à 1/πτ, chute de 20 dB par décade, puis de 40 dB par décade au-delà de 1/πt<sub>m</sub>. Ralentir le front fait plonger tout le haut du spectre.",
    controls: [
      { id: "f", label: "Fréquence d'horloge", min: 1e6, max: 2e8, v: 25e6, log: true, u: "Hz" },
      { id: "tm", label: "Temps de montée", min: 1e-10, max: 2e-8, v: 5e-9, log: true, u: "s" },
      { id: "A", label: "Amplitude", min: 1, max: 5, v: 3.3, step: 0.1, u: "V" },
    ],
    presets: [
      { label: "25 MHz, tm 5 ns (diapo 132)", v: { f: 25e6, tm: 5e-9 } },
      { label: "25 MHz, tm 1 ns", v: { f: 25e6, tm: 1e-9 } },
      { label: "100 MHz, tm 1 ns", v: { f: 1e8, tm: 1e-9 } },
    ],
    render(s, el) {
      const T = 1 / s.f, d = 0.5, sinc = (x) => (x === 0 ? 1 : Math.sin(x) / x);
      const tm = Math.min(s.tm, T / 4);
      const pts = [];
      for (let n = 1; n * s.f <= 1e10 && n < 4000; n += 1) {
        const c = 2 * s.A * d * Math.abs(sinc(n * Math.PI * d)) * Math.abs(sinc((n * Math.PI * tm) / T));
        if (c > 1e-9) pts.push([n * s.f, 20 * Math.log10(c * 1e6)]);
      }
      const f1 = 1 / (Math.PI * d * T), f2 = 1 / (Math.PI * tm), top = 20 * Math.log10(2 * s.A * d * 1e6);
      const env = logspace(1e6, 1e10, 200).map((f) => [f, top - (f > f1 ? 20 * Math.log10(f / f1) : 0) - (f > f2 ? 20 * Math.log10(f / f2) : 0)]);
      plot(el.plot, { id: "front", label: "Spectre", x: { min: 1e6, max: 1e10, log: true, unit: "Hz", label: "fréquence" }, y: { min: 40, max: 140, fmt: (v) => v, label: "dBµV" },
        series: [{ pts, cls: "stem", stems: true }, { pts: env, cls: "env" }],
        marks: [{ x: f1, label: "1/πτ" }, { x: 0.35 / tm, label: "Fc = 0,35/tm", cls: "mark hot", dy: 16 }, { x: f2, label: "1/πtm", dy: 32 }] });
      const at = (F) => { const n = Math.round(F / s.f) | 1; return top - (n * s.f > f1 ? 20 * Math.log10((n * s.f) / f1) : 0) - (n * s.f > f2 ? 20 * Math.log10((n * s.f) / f2) : 0); };
      el.out([["Fc = 0,35/tm", eng(0.35 / tm, "Hz")], ["Enveloppe à 300 MHz", fr(at(3e8), 3) + " dBµV"], ["Enveloppe à 1 GHz", fr(at(1e9), 3) + " dBµV"]]);
      el.note(`Passe de 5 ns à 1 ns : l'enveloppe à 1 GHz gagne environ 28 dB (×25 en tension). C'est pour ça que la diapo 132 dit « danger » : une horloge rapide sur une nappe rayonne jusqu'au GHz.`);
    },
  },
  {
    id: "inductif", title: "Couplage inductif : câble perturbateur et boucle", diapos: "diapos 94–95", exos: ["q19", "q20", "q21", "q22"],
    intro: "Un courant qui varie crée un champ B en 1/d. Toute boucle traversée par ce champ reçoit e = (µ<sub>0</sub>l/2π)·ln((d + w)/d)·ΔI/t<sub>m</sub>. Trois leviers : la surface de la boucle, la distance, la vitesse du front.",
    controls: [
      { id: "dI", label: "Saut de courant ΔI", min: 0.01, max: 1e6, v: 20, log: true, u: "A" },
      { id: "tm", label: "Temps de montée", min: 1e-9, max: 1e-3, v: 1e-6, log: true, u: "s" },
      { id: "d", label: "Distance câble – boucle", min: 1e-3, max: 1e4, v: 0.5, log: true, u: "m" },
      { id: "l", label: "Longueur de la boucle", min: 0.01, max: 100, v: 2, log: true, u: "m" },
      { id: "w", label: "Largeur de la boucle", min: 1e-4, max: 20, v: 0.1, log: true, u: "m" },
    ],
    presets: [
      { label: "Q20 boucle de masse", v: { dI: 20, tm: 1e-6, d: 0.5, l: 2, w: 0.1 } },
      { label: "Q21 âme / tresse", v: { dI: 20, tm: 1e-6, d: 0.01, l: 2, w: 1.02e-3 } },
      { label: "Q22 foudre", v: { dI: 5e5, tm: 1e-4, d: 2000, l: 10, w: 5 } },
      { label: "Démarrage moteur 10 kW", v: { dI: 100, tm: 1e-3, d: 0.1, l: 5, w: 0.05 } },
    ],
    render(s, el) {
      const eEx = 2e-7 * s.l * Math.log((s.d + s.w) / s.d) * (s.dI / s.tm), eAp = ((2e-7 / s.d) * s.l * s.w * s.dI) / s.tm;
      // Schéma : vue en coupe, câble au-dessus, boucle en dessous, échelle compressée.
      const W = 640, H = 260, y0 = 50, sc = (x) => 40 * Math.log10(1 + x / 0.002);
      const dy = Math.min(120, sc(s.d)), wy = Math.max(6, Math.min(80, sc(s.w)));
      const len = Math.max(60, Math.min(520, 70 * Math.log10(1 + s.l / 0.01)));
      const x0 = (W - len) / 2, lw = 1 + Math.min(4, Math.log10(1 + s.dI));
      let g = `<svg viewBox="0 0 ${W} ${H}" class="schema" role="img" aria-label="Câble perturbateur au-dessus d'une boucle">`;
      for (let k = 1; k <= 4; k++) g += `<ellipse class="fieldB" cx="${W / 2}" cy="${y0}" rx="${k * 18}" ry="${k * 13}" style="opacity:${0.9 - k * 0.18}"/>`;
      g += `<line class="culprit" x1="20" x2="${W - 20}" y1="${y0}" y2="${y0}" style="stroke-width:${lw}"/>`;
      g += `<text class="lbl" x="22" y="${y0 - 10}">câble perturbateur · ΔI = ${eng(s.dI, "A")} en ${eng(s.tm, "s")}</text>`;
      g += `<rect class="loop" x="${x0}" y="${y0 + dy}" width="${len}" height="${wy}"/>`;
      g += `<line class="dim" x1="${x0 - 14}" x2="${x0 - 14}" y1="${y0}" y2="${y0 + dy}"/><text class="lbl" x="${x0 - 18}" y="${y0 + dy / 2 + 4}" text-anchor="end">d = ${eng(s.d, "m")}</text>`;
      g += `<text class="lbl" x="${x0 + len + 8}" y="${y0 + dy + wy / 2 + 4}">w = ${eng(s.w, "m")}</text>`;
      g += `<text class="lbl" x="${x0}" y="${y0 + dy + wy + 18}">boucle victime · l = ${eng(s.l, "m")} · S = ${eng(s.l * s.w, "m²")}</text>`;
      g += `<text class="big ${eEx > 1 ? "bad" : "ok"}" x="${W - 20}" y="${H - 18}" text-anchor="end">e = ${eng(eEx, "V")}</text></svg>`;
      el.plot.innerHTML = g;
      el.out([["e exact (intégrale)", eng(eEx, "V")], ["e approché (B uniforme)", eng(eAp, "V")], ["Verdict", eEx > 5 ? "destructif pour une entrée logique" : eEx > 0.8 ? "peut faire basculer une entrée TTL" : eEx > 0.01 ? "bruit gênant pour une mesure analogique" : "négligeable"]]);
      el.note(`Divise w par 10 : e est divisé par ~10. Multiplie d par 10 : e baisse aussi d'environ 10 (B en 1/d). Allonge t<sub>m</sub> d'un facteur 10 : même effet. ${s.w > s.d ? "Ici w > d : l'approximation « B uniforme » surestime, prends la valeur exacte." : ""}`);
    },
  },
  {
    id: "capacitif", title: "Couplage capacitif : la plaque à induction", diapos: "diapos 93, 122", exos: ["q48", "q49"],
    intro: "La piste victime voit la tension perturbatrice à travers C. Le circuit est un passe-haut RC : v<sub>s</sub> suit la dérivée de v quand RC ≪ t<sub>m</sub>, et sature vers v quand RC ≫ t<sub>m</sub>. La courbe pointillée est l'approximation du TD, la pleine est la vraie solution.",
    controls: [
      { id: "V", label: "Amplitude de v(t)", min: 10, max: 600, v: 400, step: 10, u: "V" },
      { id: "tm", label: "Temps de montée", min: 1e-8, max: 2e-6, v: 1e-7, log: true, u: "s" },
      { id: "C", label: "Capacité de couplage", min: 1e-13, max: 1e-9, v: 9e-12, log: true, u: "F" },
      { id: "R", label: "Impédance de la victime", min: 10, max: 1e6, v: 1e5, log: true, u: "Ω" },
    ],
    presets: [
      { label: "TD Q52", v: { V: 400, tm: 1e-7, C: 9e-12, R: 1e5 } },
      { label: "Victime basse impédance (50 Ω)", v: { V: 400, tm: 1e-7, C: 9e-12, R: 50 } },
      { label: "Fronts ralentis à 1 µs", v: { V: 400, tm: 1e-6, C: 9e-12, R: 1e5 } },
    ],
    render(s, el) {
      const T = 10e-6, RC = s.R * s.C, N = 6000, dt = T / N;
      const v = (t) => { const tt = t % T; if (tt < s.tm) return (s.V * tt) / s.tm; if (tt < T / 2) return s.V; if (tt < T / 2 + s.tm) return s.V * (1 - (tt - T / 2) / s.tm); return 0; };
      const dv = (t) => { const tt = t % T; if (tt < s.tm) return s.V / s.tm; if (tt >= T / 2 && tt < T / 2 + s.tm) return -s.V / s.tm; return 0; };
      const sub = Math.max(1, Math.ceil(dt / Math.min(RC / 4, s.tm / 8)));
      let x = 0, peak = 0;
      const ex = [], ap = [], vv = [];
      for (let i = 0; i <= N; i++) {
        const t = i * dt;
        if (i % 6 === 0) { ex.push([t, x]); ap.push([t, RC * dv(t)]); vv.push([t, v(t)]); }
        peak = Math.max(peak, Math.abs(x));
        for (let k = 0; k < sub; k++) { const tt = t + (k * dt) / sub; const a1 = dv(tt) - x / RC; const xm = x + (a1 * dt) / sub / 2; x += ((dv(tt + dt / sub / 2) - xm / RC) * dt) / sub; }
      }
      const approx = RC * (s.V / s.tm), ymax = Math.max(peak, Math.min(approx, peak * 3), s.V) * 1.1;
      plot(el.plot, { id: "cap", label: "v(t) et vs(t)", h: 300, x: { min: 0, max: T, unit: "s", label: "temps" }, y: { min: -ymax, max: ymax, unit: "V", label: "tension" },
        series: [{ pts: vv, cls: "src" }, { pts: ap.map(([t, y]) => [t, Math.max(-ymax * 1.3, Math.min(ymax * 1.3, y))]), cls: "approx" }, { pts: ex, cls: "victim" }] });
      el.out([["RC", eng(RC, "s")], ["Pic réel de vs", eng(peak, "V")], ["Approximation RC·dv/dt", eng(approx, "V")], ["Validité", RC < s.tm / 5 ? "RC ≪ tm : l'approximation tient" : "RC ≳ tm : l'approximation surestime"]]);
      el.note(`Légende : <span class="sw src"></span> v(t) perturbatrice · <span class="sw approx"></span> RC·dv/dt · <span class="sw victim"></span> v<sub>s</sub>(t) réelle. Mets R à 50 Ω : la même capacité ne donne presque plus rien. C'est pourquoi le couplage capacitif menace les entrées à haute impédance.`);
    },
  },
  {
    id: "impedance", title: "Impédance d'un conducteur de masse", diapos: "diapos 89–92, 147", exos: ["q33", "q34", "q41", "q47"],
    intro: "Tout conducteur a une résistance (qui croît avec l'effet de peau) et une inductance d'environ 1 µH/m. La tension à ses bornes vaut R·i + L·di/dt : avec des fronts rapides, c'est toujours le second terme qui domine.",
    controls: [
      { id: "kind", label: "Conducteur", type: "select", v: "fil", opts: [["fil", "Fil rond"], ["feuillard", "Feuillard plat"], ["piste", "Piste de PCB"]] },
      { id: "l", label: "Longueur", min: 0.01, max: 2, v: 0.3, log: true, u: "m" },
      { id: "s", label: "Section (fil)", min: 0.2, max: 50, v: 10, log: true, u: "mm²" },
      { id: "w", label: "Largeur (feuillard, piste)", min: 1e-4, max: 0.05, v: 0.03, log: true, u: "m" },
      { id: "I", label: "Courant", min: 1e-4, max: 10, v: 0.0025, log: true, u: "A" },
      { id: "tm", label: "Temps de montée", min: 1e-10, max: 1e-6, v: 2e-10, log: true, u: "s" },
    ],
    presets: [
      { label: "Q47 fil de 30 cm", v: { kind: "fil", l: 0.3, s: 10, I: 0.0025, tm: 2e-10 } },
      { label: "Q42 piste 5 cm", v: { kind: "piste", l: 0.05, w: 3e-4, I: 1, tm: 5e-9 } },
      { label: "Q34 feuillard 3 cm", v: { kind: "feuillard", l: 0.05, w: 0.03, I: 1, tm: 5e-9 } },
      { label: "Q34 feuillard 1 mm", v: { kind: "feuillard", l: 0.05, w: 0.001, I: 1, tm: 5e-9 } },
    ],
    render(s, el) {
      let R0, L, perim;
      if (s.kind === "fil") { const r = Math.sqrt((s.s * 1e-6) / Math.PI); R0 = (RHO_CU * s.l) / (s.s * 1e-6); L = 2e-7 * s.l * (Math.log((2 * s.l) / r) - 0.75); perim = 2 * Math.PI * r; }
      else if (s.kind === "feuillard") { R0 = (RHO_CU * s.l) / (s.w * 1e-4); L = 2e-7 * s.l * (Math.log((2 * s.l) / (s.w + 1e-4)) - 0.5); perim = 2 * s.w; }
      else { const h = 1.57e-3, w = s.w; R0 = (RHO_CU * s.l) / (35e-6 * w); L = w / h <= 1 ? ((60 * s.l) / C0) * Math.log((8 * h) / w + w / (4 * h)) : ((120 * Math.PI * s.l) / C0) / (w / h + 1.393 + 0.667 * Math.log(w / h + 1.444)); perim = 2 * w; }
      L = Math.max(L, 1e-10);
      const Rf = (f) => { const dl = 1 / Math.sqrt(Math.PI * f * MU0 * (1 / RHO_CU)); return Math.max(R0, (RHO_CU * s.l) / (perim * dl)); };
      const Z = (f) => Math.hypot(Rf(f), 2 * Math.PI * f * L);
      const fs = logspace(10, 1e9, 220);
      const fx = R0 / (2 * Math.PI * L);
      plot(el.plot, { id: "imp", label: "Impédance du conducteur", x: { min: 10, max: 1e9, log: true, unit: "Hz", label: "fréquence" }, y: { min: 1e-5, max: 1e3, log: true, unit: "Ω", label: "|Z|" },
        series: [{ pts: fs.map((f) => [f, Rf(f)]), cls: "approx" }, { pts: fs.map((f) => [f, 2 * Math.PI * f * L]), cls: "env" }, { pts: fs.map((f) => [f, Z(f)]), cls: "victim" }],
        marks: [{ x: fx, label: "R = Lω" }, { x: 0.35 / s.tm, label: "0,35/tm", cls: "mark hot", dy: 16 }] });
      const uR = R0 * s.I, uL = (L * s.I) / s.tm;
      el.out([["R continu", eng(R0, "Ω")], ["L", eng(L, "H") + " (" + eng(L / s.l, "H/m") + ")"], ["R·i", eng(uR, "V")], ["L·di/dt", eng(uL, "V")], ["L·di/dt / R·i", fr(uL / uR, 3)]]);
      el.note(`Légende : <span class="sw approx"></span> R(f) avec effet de peau · <span class="sw env"></span> Lω · <span class="sw victim"></span> |Z|. Au-dessus de ${eng(fx, "Hz")} le conducteur est une inductance : grossir sa section ne sert presque plus à rien, il faut le raccourcir ou l'élargir.`);
    },
  },
  {
    id: "peau", title: "Effet de peau : cuivre contre fer", diapos: "diapos 91, 142", exos: ["q43"],
    intro: "δ = 1/√(πfµσ). Tant que δ dépasse le rayon, tout le fil conduit. Au-delà, seule une couronne d'épaisseur δ conduit et R croît comme √f. Le fer, très perméable, entre dans ce régime des centaines de fois plus tôt.",
    controls: [
      { id: "D", label: "Diamètre", min: 0.1, max: 10, v: 1, log: true, u: "mm" },
      { id: "L", label: "Longueur", min: 0.1, max: 10, v: 1, log: true, u: "m" },
      { id: "f", label: "Fréquence lue", min: 10, max: 1e9, v: 1e6, log: true, u: "Hz" },
    ],
    presets: [{ label: "TD Q43–Q46 (1 m, Ø 1 mm)", v: { D: 1, L: 1, f: 1e6 } }],
    render(s, el) {
      const r = s.D / 2000, S = Math.PI * r * r;
      const mk = (rho, mur) => { const R0 = (rho * s.L) / S; return (f) => { const dl = Math.sqrt(rho / (Math.PI * f * MU0 * mur)); return dl >= r ? R0 : Math.max(R0, (rho * s.L) / (2 * Math.PI * r * dl - Math.PI * dl * dl)); }; };
      const cu = mk(RHO_CU, 1), fe = mk(1e-7, 5000), fs = logspace(10, 1e9, 240);
      const fcu = RHO_CU / (Math.PI * MU0 * r * r), ffe = 1e-7 / (Math.PI * 5000 * MU0 * r * r);
      plot(el.plot, { id: "peau", label: "Résistance en fonction de la fréquence", x: { min: 10, max: 1e9, log: true, unit: "Hz", label: "fréquence" }, y: { min: 1e-3, max: 1e3, log: true, unit: "Ω", label: "R" },
        series: [{ pts: fs.map((f) => [f, cu(f)]), cls: "copper" }, { pts: fs.map((f) => [f, fe(f)]), cls: "iron" }],
        marks: [{ x: fcu, label: "Cu : δ = r" }, { x: ffe, label: "Fe : δ = r", dy: 16 }, { x: s.f, cls: "mark hot", label: "lecture", dy: 32 }],
        points: [{ x: s.f, y: cu(s.f), cls: "pt cu" }, { x: s.f, y: fe(s.f), cls: "pt fe" }] });
      el.out([["δ cuivre", eng(1 / Math.sqrt(Math.PI * s.f * MU0 / RHO_CU), "m")], ["R cuivre", eng(cu(s.f), "Ω")], ["δ fer", eng(Math.sqrt(1e-7 / (Math.PI * s.f * MU0 * 5000)), "m")], ["R fer", eng(fe(s.f), "Ω")]]);
      el.note(`Légende : <span class="sw copper"></span> cuivre · <span class="sw iron"></span> fer (µ<sub>r</sub> = 5000). Cette courbe est le graphe de la question 46 : repère les coudes à ${eng(fcu, "Hz")} et ${eng(ffe, "Hz")}.`);
    },
  },
  {
    id: "condo", title: "Le condensateur de découplage réel", diapos: "diapos 99–100, 112–114", exos: ["c4"],
    intro: "Un vrai condensateur, c'est C en série avec une résistance (ESR) et une inductance (ESL, environ 10 nH par cm de pattes). Au-dessus de sa résonance, il devient une inductance. Deux condensateurs en parallèle créent une antirésonance entre leurs deux creux.",
    controls: [
      { id: "C", label: "Capacité", min: 1e-10, max: 1e-5, v: 12e-9, log: true, u: "F" },
      { id: "p", label: "Longueur des pattes", min: 0.05, max: 6, v: 4, log: true, u: "cm" },
      { id: "esr", label: "ESR", min: 0.005, max: 2, v: 0.1, log: true, u: "Ω" },
      { id: "two", label: "Ajouter un 2e condensateur en parallèle", type: "check", v: false },
      { id: "C2", label: "2e capacité (CMS, 0,5 nH)", min: 1e-11, max: 1e-6, v: 1e-9, log: true, u: "F" },
    ],
    presets: [
      { label: "Diapo 99 : 12 nF, 2 × 2 cm", v: { C: 12e-9, p: 4, esr: 0.1, two: false } },
      { label: "100 nF CMS 0603", v: { C: 1e-7, p: 0.08, esr: 0.03, two: false } },
      { label: "10 µF + 10 nF en parallèle", v: { C: 1e-5, p: 1, esr: 0.05, two: true, C2: 1e-8 } },
    ],
    render(s, el) {
      const L1 = s.p * 1e-8, fs = logspace(1e5, 1e9, 300);
      const z1 = (f) => { const w = 2 * Math.PI * f; return [s.esr, w * L1 - 1 / (w * s.C)]; };
      const z2 = (f) => { const w = 2 * Math.PI * f; return [0.02, w * 0.5e-9 - 1 / (w * s.C2)]; };
      const par = (a, b) => { const nr = a[0] * b[0] - a[1] * b[1], ni = a[0] * b[1] + a[1] * b[0], dr = a[0] + b[0], di = a[1] + b[1], dd = dr * dr + di * di; return [(nr * dr + ni * di) / dd, (ni * dr - nr * di) / dd]; };
      const zt = (f) => (s.two ? par(z1(f), z2(f)) : z1(f));
      const mag = (z) => Math.hypot(z[0], z[1]);
      const f0 = 1 / (2 * Math.PI * Math.sqrt(L1 * s.C));
      const series = [{ pts: fs.map((f) => [f, 1 / (2 * Math.PI * f * s.C)]), cls: "env" }, { pts: fs.map((f) => [f, mag(zt(f))]), cls: "victim" }];
      const marks = [{ x: f0, label: "fr = " + eng(f0, "Hz") }];
      if (s.two) { const f2 = 1 / (2 * Math.PI * Math.sqrt(0.5e-9 * s.C2)); marks.push({ x: f2, label: "fr2", dy: 16 }); }
      plot(el.plot, { id: "condo", label: "Impédance du condensateur", x: { min: 1e5, max: 1e9, log: true, unit: "Hz", label: "fréquence" }, y: { min: 1e-3, max: 1e3, log: true, unit: "Ω", label: "|Z|" }, series, marks });
      let anti = 0, fa = 0;
      if (s.two) for (const f of fs) { const m = mag(zt(f)); if (f > f0 && m > anti) { anti = m; fa = f; } }
      el.out([["ESL", eng(L1, "H")], ["Résonance", eng(f0, "Hz")], ["|Z| à 100 MHz", eng(mag(zt(1e8)), "Ω")], ...(s.two ? [["Antirésonance", eng(fa, "Hz") + " · " + eng(anti, "Ω")]] : [])]);
      el.note(`Légende : <span class="sw env"></span> condensateur idéal · <span class="sw victim"></span> réel. Raccourcis les pattes : la résonance monte en √. ${s.two ? "Le pic entre les deux creux est l'antirésonance : c'est pourquoi on choisit des valeurs proches ou un plan d'alimentation (diapo 114)." : ""}`);
    },
  },
  {
    id: "blindage", title: "Blindage : réflexion, absorption, ouvertures", diapos: "diapos 138–143", exos: ["c6", "c7"],
    intro: "L'efficacité théorique d'une paroi est A = A<sub>R</sub> + A<sub>A</sub>. En pratique, une ouverture de longueur s fuit comme une antenne dès que s approche λ/2 : c'est elle qui fixe l'efficacité réelle.",
    controls: [
      { id: "mat", label: "Matériau", type: "select", v: "al", opts: [["cu", "Cuivre (σr 1, µr 1)"], ["al", "Aluminium (σr 0,61, µr 1)"], ["ac", "Acier (σr 0,1, µr 1000)"]] },
      { id: "e", label: "Épaisseur", min: 0.01, max: 3, v: 1, log: true, u: "mm" },
      { id: "src", label: "Source", type: "select", v: "far", opts: [["far", "Champ lointain (377 Ω)"], ["E", "Champ proche électrique (dipôle)"], ["H", "Champ proche magnétique (boucle)"]] },
      { id: "dist", label: "Distance à la source", min: 0.01, max: 10, v: 10, log: true, u: "m" },
      { id: "slot", label: "Plus grande ouverture", min: 0.001, max: 0.5, v: 0.1, log: true, u: "m" },
    ],
    presets: [
      { label: "Diapo 141 : Al 1 mm à 10 m", v: { mat: "al", e: 1, src: "far", dist: 10, slot: 0.001 } },
      { label: "Même boîtier, fente de 10 cm", v: { mat: "al", e: 1, src: "far", dist: 10, slot: 0.1 } },
      { label: "Champ H proche : cuivre", v: { mat: "cu", e: 0.5, src: "H", dist: 0.05, slot: 0.001 } },
      { label: "Champ H proche : acier", v: { mat: "ac", e: 0.5, src: "H", dist: 0.05, slot: 0.001 } },
    ],
    render(s, el) {
      const M = { cu: [1, 1], al: [0.61, 1], ac: [0.1, 1000] }[s.mat], fs = logspace(1e3, 1e10, 240), e = s.e / 1000;
      const calc = (F) => {
        const lam = C0 / F, near = s.dist < lam / (2 * Math.PI);
        const Zc = !near || s.src === "far" ? 377 : s.src === "E" ? (377 * lam) / (2 * Math.PI * s.dist) : (377 * 2 * Math.PI * s.dist) / lam;
        const Ze = 3.7e-7 * Math.sqrt((M[1] * F) / M[0]);
        const AR = 20 * Math.log10((Zc + Ze) ** 2 / (4 * Zc * Ze)), dl = 1 / Math.sqrt(230 * F * M[0] * M[1]), AA = (8.686 * e) / dl;
        const ap = s.slot >= lam / 2 ? 0 : 20 * Math.log10(lam / (2 * s.slot));
        return { AR: Math.max(0, AR), AA, th: Math.max(0, AR) + AA, real: Math.min(Math.max(0, AR) + AA, ap), ap };
      };
      plot(el.plot, { id: "shield", label: "Efficacité de blindage", x: { min: 1e3, max: 1e10, log: true, unit: "Hz", label: "fréquence" }, y: { min: 0, max: 300, fmt: (v) => v, label: "dB" },
        series: [{ pts: fs.map((f) => [f, calc(f).AR]), cls: "approx" }, { pts: fs.map((f) => [f, calc(f).AA]), cls: "env" }, { pts: fs.map((f) => [f, Math.min(320, calc(f).ap)]), cls: "src" }, { pts: fs.map((f) => [f, calc(f).real]), cls: "victim" }],
        marks: [{ x: 1e8, label: "100 MHz", cls: "mark hot" }] });
      const c = calc(1e8), c1 = calc(1e4);
      el.out([["À 100 MHz : A_R", fr(c.AR, 3) + " dB"], ["A_A", c.AA > 999 ? "> 999 dB" : fr(c.AA, 3) + " dB"], ["Limite de l'ouverture", fr(c.ap, 3) + " dB"], ["Efficacité réelle", fr(c.real, 3) + " dB"], ["À 10 kHz réelle", fr(c1.real, 3) + " dB"]]);
      el.note(`Légende : <span class="sw approx"></span> réflexion · <span class="sw env"></span> absorption · <span class="sw src"></span> limite de l'ouverture · <span class="sw victim"></span> réel. Compare les deux préréglages « champ H proche » : à basse fréquence, seul l'acier tient, parce que la réflexion s'effondre quand Z<sub>c</sub> est faible.`);
    },
  },
];
