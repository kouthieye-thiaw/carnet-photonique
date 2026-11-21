/* Générateurs d'exercices du carnet photonique (module ES).
   Chaque générateur fabrique un exercice neuf (valeurs tirées au sort) avec sa solution pas à pas.
   th : thème · rel : la relation à reconnaître (étape « quelle relation ? » de l'entraînement mélangé)
   f : la formule (KaTeX) · lecons : leçons du carnet où elle est expliquée
   gen(r) → { enonce, rep, unite, tol (relative), abs (absolue, optionnelle), etapes[] } */

export const THEMES = {
  optique: { t: "optique géométrique", geii: "physique (ondes et optique)" },
  ondes: { t: "lumière, photons & ondes", geii: "physique S5 · onde électromagnétique (CEM partie 1)" },
  faisceau: { t: "faisceaux laser", geii: "physique · ondes" },
  fibre: { t: "fibres & liaisons", geii: "réseaux & télécommunications" },
  laser: { t: "diodes laser", geii: "physique S5 · semi-conducteurs" },
  detection: { t: "photodétection", geii: "électronique analogique (AOP)" },
  electronique: { t: "électronique GEII", geii: "électronique · systèmes embarqués" },
  regulation: { t: "régulation", geii: "automatique" },
  mesure: { t: "mesure & qualité", geii: "MSP S5 · probabilités-statistiques" },
  surete: { t: "sécurité & fiabilité", geii: "maintenance S5" }
};

/* ---------- outils ---------- */
const P = (x, d = 3) => +Number(x).toPrecision(d);
const M = (x, d = 3) => String(P(x, d)).replace(".", "{,}");                       // nombre pour KaTeX
const T = (x, d = 3) => P(x, d).toLocaleString("fr-FR", { maximumFractionDigits: 12 }); // nombre pour le texte
const pick = (r, a) => a[Math.floor(r() * a.length)];
const grille = (r, a, b, pas = 1) => +(a + pas * Math.floor(r() * (Math.round((b - a) / pas) + 1))).toFixed(6);
const DEG = Math.PI / 180;
const HC = 1239.84;                    // h·c/e en eV·nm
const H = 6.62607015e-34, CL = 299792458, Q = 1.602176634e-19;
const LAMBDAS = [405, 450, 532, 633, 650, 780, 808, 850, 905, 980, 1064, 1310, 1550];

export const GENS = [
  /* ===================== optique géométrique ===================== */
  { id: "snell", th: "optique", titre: "réfraction à une interface", rel: "loi de Snell-Descartes", f: "n_1\\sin\\theta_1 = n_2\\sin\\theta_2",
    lecons: ["decouvrir/rayons-lentilles", "physique/optique-geometrique"],
    gen(r) {
      const MIL = [{ de: "de l'air", a: "dans l'air", n: 1.000 }, { de: "de l'eau", a: "dans l'eau", n: 1.333 }, { de: "du PMMA", a: "dans le PMMA", n: 1.49 },
        { de: "du verre BK7", a: "dans le verre BK7", n: 1.517 }, { de: "du verre flint SF11", a: "dans le verre flint SF11", n: 1.785 }];
      for (;;) {
        const a = pick(r, MIL), b = pick(r, MIL); if (a === b) continue;
        const t1 = grille(r, 10, 60, 5), s = a.n * Math.sin(t1 * DEG) / b.n; if (s > 0.97) continue;
        const t2 = Math.asin(s) / DEG;
        return { enonce: `Un rayon passe ${a.de} (\\(n_1 = ${M(a.n, 4)}\\)) ${b.a} (\\(n_2 = ${M(b.n, 4)}\\)) sous une incidence de ${t1}°. Quel est l'angle de réfraction ?`,
          rep: t2, unite: "°", tol: 0.01,
          etapes: [`Angles comptés depuis la normale : \\(n_1\\sin\\theta_1 = n_2\\sin\\theta_2\\).`,
            `\\(\\sin\\theta_2 = \\dfrac{${M(a.n, 4)}\\times\\sin ${t1}^\\circ}{${M(b.n, 4)}} = ${M(s, 4)}\\)`,
            `\\(\\theta_2 = \\arcsin(${M(s, 4)}) \\approx ${M(t2, 3)}^\\circ\\) : ${b.n > a.n ? "le rayon se rapproche de la normale (il entre dans un milieu plus réfringent)" : "le rayon s'écarte de la normale (milieu moins réfringent)"}.`] };
      }
    } },
  { id: "angle-critique", th: "optique", titre: "réflexion totale interne", rel: "angle critique (réflexion totale)", f: "\\sin\\theta_c = \\dfrac{n_2}{n_1}",
    lecons: ["decouvrir/rayons-lentilles", "decouvrir/fibres-pas-a-pas", "physique/optique-geometrique"],
    gen(r) {
      const c = pick(r, [["du verre (n = 1,5) vers l'air", 1.5, 1.0], ["de l'eau (n = 1,333) vers l'air", 1.333, 1.0], ["de la silice (n = 1,444) vers l'air", 1.444, 1.0],
        ["du saphir (n = 1,76) vers l'air", 1.76, 1.0], ["du cœur d'une fibre (n = 1,4677) vers sa gaine (n = 1,4624)", 1.4677, 1.4624], ["du GaAs (n = 3,5) vers l'air", 3.5, 1.0]]);
      const s = c[2] / c[1], tc = Math.asin(s) / DEG;
      return { enonce: `La lumière va ${c[0]}. À partir de quel angle d'incidence est-elle totalement réfléchie ?`, rep: tc, unite: "°", tol: 0.005,
        etapes: [`Réflexion totale possible car \\(n_1 > n_2\\) : \\(\\sin\\theta_c = n_2/n_1\\).`, `\\(\\sin\\theta_c = ${M(c[2], 5)}/${M(c[1], 5)} = ${M(s, 4)}\\)`,
          `\\(\\theta_c \\approx ${M(tc, 3)}^\\circ\\)${c[1] < 1.47 && c[2] > 1.4 ? " : dans une fibre, seuls les rayons très rasants restent guidés — d'où sa faible ouverture numérique." : " : au-delà, 100 % de la lumière est réfléchie, sans aucun traitement."}`] };
    } },
  { id: "fresnel", th: "optique", titre: "pertes par réflexion", rel: "coefficient de réflexion de Fresnel", f: "R = \\left(\\dfrac{n_1-n_2}{n_1+n_2}\\right)^2",
    lecons: ["decouvrir/rayons-lentilles", "physique/optique-geometrique"],
    gen(r) {
      const m = pick(r, [["verre", 1.5], ["silice", 1.45], ["saphir", 1.76], ["ZnSe", 2.4], ["silicium", 3.48], ["GaAs", 3.5], ["germanium", 4.0]]);
      const n = m[1], R = ((1 - n) / (1 + n)) ** 2, fen = r() < 0.5;
      if (!fen) return { enonce: `Quelle fraction de la puissance est réfléchie, en incidence normale, à l'interface air / ${m[0]} (n = ${T(n)}) ?`, rep: 100 * R, unite: "%", tol: 0.01,
        etapes: [`Incidence normale : \\(R = \\left(\\dfrac{n_1-n_2}{n_1+n_2}\\right)^2\\).`, `\\(R = \\left(\\dfrac{1-${M(n)}}{1+${M(n)}}\\right)^2 = ${M(R, 3)}\\), soit \\(${M(100 * R, 3)}\\,\\%\\).`] };
      const Tt = (1 - R) ** 2;
      return { enonce: `Une fenêtre non traitée en ${m[0]} (n = ${T(n)}) est traversée en incidence normale. Quelle part de la puissance ressort (deux faces, réflexions multiples négligées) ?`, rep: 100 * Tt, unite: "%", tol: 0.01,
        etapes: [`Par face : \\(R = \\left(\\dfrac{1-${M(n)}}{1+${M(n)}}\\right)^2 = ${M(R, 3)}\\).`, `Chaque face transmet \\(1-R\\) : \\(T = (1-R)^2 = ${M(Tt, 3)}\\), soit \\(${M(100 * Tt, 3)}\\,\\%\\).`, `D'où l'intérêt des traitements antireflet${n > 3 ? " — indispensables sur les semi-conducteurs" : ""}.`] };
    } },
  { id: "brewster", th: "optique", titre: "angle de Brewster", rel: "angle de Brewster", f: "\\tan\\theta_B = \\dfrac{n_2}{n_1}",
    lecons: ["physique/optique-geometrique", "physique/polarisation"],
    gen(r) {
      const m = pick(r, [["de verre BK7", 1.517], ["de silice", 1.45], ["de saphir", 1.76], ["de ZnSe", 2.4]]);
      const tb = Math.atan(m[1]) / DEG;
      return { enonce: `Sous quel angle d'incidence faut-il éclairer une lame ${m[0]} (n = ${T(m[1])}), depuis l'air, pour que la polarisation p ne soit plus du tout réfléchie ?`, rep: tb, unite: "°", tol: 0.005,
        etapes: [`Angle de Brewster : \\(\\tan\\theta_B = n_2/n_1\\).`, `\\(\\theta_B = \\arctan(${M(m[1], 4)}) \\approx ${M(tb, 3)}^\\circ\\)`, `On s'en sert pour les fenêtres « à Brewster » des cavités : pertes quasi nulles pour p, et le laser choisit cette polarisation.`] };
    } },
  { id: "conjugaison", th: "optique", titre: "image par une lentille", rel: "relation de conjugaison", f: "\\dfrac{1}{d_o} + \\dfrac{1}{d_i} = \\dfrac{1}{f} \\qquad G = -\\dfrac{d_i}{d_o}",
    lecons: ["decouvrir/rayons-lentilles", "physique/optique-geometrique"],
    gen(r) {
      const f = pick(r, [25, 40, 50, 75, 100, 150, 200]), k = pick(r, [1.25, 1.5, 2, 2.5, 3, 4, 5]), d0 = f * k;
      const di = f * d0 / (d0 - f), G = -di / d0, askG = r() < 0.4;
      const base = [`Lentille mince, distances positives : \\(\\dfrac{1}{d_o} + \\dfrac{1}{d_i} = \\dfrac{1}{f}\\).`,
        `\\(\\dfrac{1}{d_i} = \\dfrac{1}{${f}} - \\dfrac{1}{${M(d0, 4)}} \\;\\Rightarrow\\; d_i = ${M(di, 4)}\\ \\text{mm}\\)`];
      if (!askG) return { enonce: `Un objet est placé à ${T(d0, 4)} mm d'une lentille mince convergente de focale ${f} mm. À quelle distance derrière la lentille se forme l'image ?`, rep: di, unite: "mm", tol: 0.01,
        etapes: base.concat([d0 === 2 * f ? `Cas classique : objet à 2f → image à 2f, même taille, renversée.` : `L'image est réelle (de l'autre côté de la lentille) : on peut la recueillir sur un écran.`]) };
      return { enonce: `Un objet est placé à ${T(d0, 4)} mm d'une lentille mince convergente de focale ${f} mm. Quel est le grandissement G (avec son signe) ?`, rep: G, unite: "", tol: 0.01,
        etapes: base.concat([`\\(G = -\\dfrac{d_i}{d_o} = -\\dfrac{${M(di, 4)}}{${M(d0, 4)}} = ${M(G, 3)}\\) : image renversée (G < 0)${Math.abs(G) < 0.99 ? ", plus petite que l'objet" : Math.abs(G) > 1.01 ? ", plus grande que l'objet" : ", de même taille"}.`]) };
    } },
  { id: "vergence", th: "optique", titre: "lentilles accolées", rel: "les vergences s'additionnent", f: "V = \\dfrac{1}{f} \\qquad V = V_1 + V_2",
    lecons: ["decouvrir/rayons-lentilles", "physique/optique-geometrique"],
    gen(r) {
      for (;;) {
        const f1 = pick(r, [50, 75, 100, 150, 200]), f2 = pick(r, [100, 200, 300, 500, -100, -200, -300]);
        const V1 = 1000 / f1, V2 = 1000 / f2, V = V1 + V2; if (Math.abs(V) < 1.5) continue;
        const f = 1000 / V;
        return { enonce: `On accole une lentille de focale ${f1} mm et une lentille de focale ${f2} mm${f2 < 0 ? " (divergente)" : ""}. Quelle est la focale de l'ensemble ?`, rep: f, unite: "mm", tol: 0.01,
          etapes: [`Vergence en dioptries (focale en mètres) : \\(V = 1/f\\), et les vergences de lentilles accolées s'additionnent.`,
            `\\(V = \\dfrac{1}{${M(f1 / 1000, 3)}} + \\dfrac{1}{${M(f2 / 1000, 3)}} = ${M(V1, 4)} ${V2 < 0 ? "-" : "+"} ${M(Math.abs(V2), 4)} = ${M(V, 4)}\\ \\delta\\)`,
            `\\(f = 1/V = ${M(f / 1000, 4)}\\ \\text{m} = ${M(f, 4)}\\ \\text{mm}\\)${f < 0 ? " : l'ensemble est divergent." : "."}`] };
      }
    } },
  { id: "elargisseur", th: "optique", titre: "élargisseur de faisceau", rel: "grandissement d'un élargisseur (f₂/f₁)", f: "D_2 = D_1\\,\\dfrac{f_2}{f_1} \\qquad e = f_1 + f_2",
    lecons: ["decouvrir/rayons-lentilles", "systemes/optique-pratique"],
    gen(r) {
      const f1 = pick(r, [25, 30, 50, 75]), f2 = pick(r, [100, 150, 200, 250, 300]), D1 = pick(r, [1, 1.5, 2, 2.5, 3]), D2 = D1 * f2 / f1;
      return { enonce: `Un élargisseur de Kepler associe une lentille de ${f1} mm puis une de ${f2} mm. Le faisceau entre avec un diamètre de ${T(D1)} mm. Quel est son diamètre en sortie ?`, rep: D2, unite: "mm", tol: 0.01,
        etapes: [`Les deux lentilles partagent un foyer : écartement \\(e = f_1 + f_2 = ${f1 + f2}\\ \\text{mm}\\).`, `Grandissement \\(f_2/f_1 = ${M(f2 / f1, 3)}\\) : \\(D_2 = ${M(D1)} \\times ${M(f2 / f1, 3)} = ${M(D2, 3)}\\ \\text{mm}\\).`, `Bonus : la divergence est divisée par le même facteur — c'est pour ça qu'on élargit avant de focaliser loin.`] };
    } },
  /* ===================== ondes & photons ===================== */
  { id: "photon-ev", th: "ondes", titre: "énergie d'un photon", rel: "énergie d'un photon E = hc/λ", f: "E = \\dfrac{hc}{\\lambda} \\qquad E[\\text{eV}] \\approx \\dfrac{1240}{\\lambda[\\text{nm}]}",
    lecons: ["decouvrir/lumiere-sans-formules", "physique/lumiere-photon"],
    gen(r) {
      const l = pick(r, LAMBDAS), E = HC / l;
      return { enonce: `Quelle est l'énergie d'un photon à ${l} nm, en électronvolts ?`, rep: E, unite: "eV", tol: 0.005,
        etapes: [`\\(E = hc/\\lambda\\) ; en unités pratiques \\(E[\\text{eV}] = 1239{,}84/\\lambda[\\text{nm}]\\).`, `\\(E = 1239{,}84/${l} = ${M(E, 4)}\\ \\text{eV}\\)`,
          E > 1.42 ? "Plus grande que le gap du GaAs (1,42 eV) : ce photon peut être émis par une diode GaAs ou plus « large »." : E > 1.12 ? "Entre 1,12 et 1,42 eV : le silicium (gap 1,12 eV) détecte encore ce photon." : "Moins que le gap du silicium (1,12 eV) : le silicium devient transparent, il faut une photodiode InGaAs ou germanium."] };
    } },
  { id: "flux-photons", th: "ondes", titre: "photons par seconde", rel: "flux de photons N = P/(hν)", f: "N = \\dfrac{P}{h\\nu} = \\dfrac{P\\,\\lambda}{hc}",
    lecons: ["physique/lumiere-photon", "decouvrir/mesurer-lumiere"],
    gen(r) {
      const Pm = pick(r, [0.5, 1, 2, 5, 10]), l = pick(r, LAMBDAS), N = Pm * 1e-3 * l * 1e-9 / (H * CL), E = H * CL / (l * 1e-9);
      return { enonce: `Un faisceau de ${T(Pm)} mW à ${l} nm transporte combien de photons par seconde ? (réponds en unités de 10<sup>15</sup> photons/s)`, rep: N / 1e15, unite: "×10¹⁵ /s", tol: 0.01,
        etapes: [`Chaque photon porte \\(E = hc/\\lambda = ${M(E / 1e-19, 4)}\\times10^{-19}\\ \\text{J}\\).`, `\\(N = P/E = \\dfrac{${M(Pm * 1e-3, 3)}}{${M(E / 1e-19, 4)}\\times10^{-19}} = ${M(N / 1e15, 4)}\\times10^{15}\\ \\text{photons/s}\\)`] };
    } },
  { id: "young", th: "ondes", titre: "fentes de Young", rel: "interfrange des fentes de Young", f: "i = \\dfrac{\\lambda D}{a}",
    lecons: ["physique/optique-ondulatoire"],
    gen(r) {
      const l = pick(r, [405, 532, 633, 780, 850]), D = pick(r, [0.5, 1, 1.5, 2]), a = pick(r, [0.1, 0.2, 0.25, 0.5]), i = l * 1e-9 * D / (a * 1e-3) * 1e3;
      return { enonce: `Deux fentes distantes de ${T(a)} mm sont éclairées à ${l} nm ; l'écran est à ${T(D)} m. Quelle est la distance entre deux franges brillantes ?`, rep: i, unite: "mm", tol: 0.01,
        etapes: [`Interfrange \\(i = \\lambda D/a\\) (tout en mètres).`, `\\(i = \\dfrac{${l}\\times10^{-9}\\times ${M(D)}}{${M(a)}\\times10^{-3}} = ${M(i / 1000, 3)}\\ \\text{m} = ${M(i, 3)}\\ \\text{mm}\\)`] };
    } },
  { id: "reseau", th: "ondes", titre: "réseau de diffraction", rel: "formule des réseaux", f: "\\sin\\theta_m = m\\,\\dfrac{\\lambda}{d} \\qquad d = \\dfrac{1}{N}",
    lecons: ["physique/optique-ondulatoire"],
    gen(r) {
      for (;;) {
        const N = pick(r, [300, 600, 1200, 1800]), l = pick(r, [405, 532, 633, 780, 850, 1064, 1550]), s = N * l * 1e-6; if (s > 0.95) continue;
        const th = Math.asin(s) / DEG;
        return { enonce: `Un réseau de ${N} traits/mm est éclairé en incidence normale à ${l} nm. Sous quel angle part l'ordre 1 ?`, rep: th, unite: "°", tol: 0.005,
          etapes: [`Pas du réseau \\(d = 1/N = ${M(1000 / N, 4)}\\ \\mu\\text{m}\\).`, `\\(\\sin\\theta_1 = \\lambda/d = ${M(l / 1000, 4)}/${M(1000 / N, 4)} = ${M(s, 4)}\\)`, `\\(\\theta_1 \\approx ${M(th, 3)}^\\circ\\) — plus le réseau est fin, plus les couleurs s'écartent (meilleure résolution).`] };
      }
    } },
  { id: "airy", th: "ondes", titre: "limite de diffraction", rel: "tache d'Airy (limite de diffraction)", f: "r = 1{,}22\\,\\dfrac{\\lambda f}{D}",
    lecons: ["physique/optique-ondulatoire", "lasers/faisceau-gaussien"],
    gen(r) {
      const l = pick(r, [532, 633, 1064, 1550]), f = pick(r, [50, 100, 200]), D = pick(r, [5, 10, 25]), rr = 1.22 * l * 1e-3 * f / D;
      return { enonce: `Une lentille de ${f} mm de focale, éclairée uniformément sur un diamètre de ${D} mm à ${l} nm, focalise la lumière. Quel est le rayon du premier anneau noir de la tache ?`, rep: rr, unite: "µm", tol: 0.01,
        etapes: [`Rayon de la tache d'Airy : \\(r = 1{,}22\\,\\lambda f/D\\).`, `\\(r = 1{,}22\\times ${M(l / 1000, 4)}\\ \\mu\\text{m}\\times\\dfrac{${f}}{${D}} = ${M(rr, 3)}\\ \\mu\\text{m}\\)`, `Pour une tache plus petite : plus grande ouverture D, plus courte focale ou plus courte longueur d'onde.`] };
    } },
  { id: "coherence", th: "ondes", titre: "longueur de cohérence", rel: "longueur de cohérence", f: "L_c = \\dfrac{c}{\\Delta\\nu} = \\dfrac{\\lambda^2}{\\Delta\\lambda}",
    lecons: ["lasers/principe", "physique/optique-ondulatoire"],
    gen(r) {
      const s = pick(r, [{ n: "une LED infrarouge", l: 850, dl: 40 }, { n: "une diode superluminescente", l: 1310, dl: 35 }, { n: "une diode laser multimode", l: 780, dl: 2 },
        { n: "un laser DFB", dnu: 2e6 }, { n: "un laser à cavité externe", dnu: 1e5 }, { n: "un laser HeNe stabilisé", dnu: 1e6 }]);
      if (s.dl) { const Lc = s.l * s.l / s.dl / 1000;
        return { enonce: `Quelle est la longueur de cohérence de ${s.n} centrée à ${s.l} nm, de largeur spectrale ${s.dl} nm ?`, rep: Lc, unite: "µm", tol: 0.01,
          etapes: [`\\(L_c \\approx \\lambda^2/\\Delta\\lambda\\) (ordre de grandeur).`, `\\(L_c = ${s.l}^2/${s.dl} = ${M(Lc * 1000, 4)}\\ \\text{nm} = ${M(Lc, 3)}\\ \\mu\\text{m}\\)`, `Très court : c'est justement ce qu'on veut en tomographie (OCT) — et ce qui empêche ces sources de faire de belles interférences.`] }; }
      const Lc = CL / s.dnu;
      return { enonce: `Quelle est la longueur de cohérence d'${s.n} de largeur de raie ${T(s.dnu / 1e6)} MHz ?`, rep: Lc, unite: "m", tol: 0.01,
        etapes: [`\\(L_c \\approx c/\\Delta\\nu\\).`, `\\(L_c = \\dfrac{3\\times10^8}{${M(s.dnu / 1e6)}\\times10^6} = ${M(Lc, 3)}\\ \\text{m}\\)`, `Des interférences restent possibles avec des différences de chemin de cet ordre : utile en interférométrie, gênant pour le bruit de réflexions parasites.`] };
    } },
  { id: "malus", th: "ondes", titre: "polariseur et analyseur", rel: "loi de Malus", f: "P = P_0\\cos^2\\theta",
    lecons: ["physique/polarisation"],
    gen(r) {
      const P0 = pick(r, [1, 2, 5, 10, 20]), th = grille(r, 10, 80, 5), Pt = P0 * Math.cos(th * DEG) ** 2;
      return { enonce: `Un faisceau polarisé rectilignement de ${P0} mW traverse un polariseur dont l'axe fait ${th}° avec sa polarisation. Quelle puissance ressort ?`, rep: Pt, unite: "mW", tol: 0.01,
        etapes: [`Loi de Malus : \\(P = P_0\\cos^2\\theta\\).`, `\\(P = ${P0}\\times\\cos^2 ${th}^\\circ = ${P0}\\times ${M(Math.cos(th * DEG) ** 2, 3)} = ${M(Pt, 3)}\\ \\text{mW}\\)`] };
    } },
  /* ===================== faisceaux gaussiens ===================== */
  { id: "rayleigh", th: "faisceau", titre: "longueur de Rayleigh", rel: "longueur de Rayleigh", f: "z_R = \\dfrac{\\pi w_0^2}{\\lambda}",
    lecons: ["lasers/faisceau-gaussien"],
    gen(r) {
      const w0 = pick(r, [0.25, 0.4, 0.5, 1, 1.5, 2]), l = pick(r, [633, 1064, 1550]), zr = Math.PI * (w0 * 1e-3) ** 2 / (l * 1e-9);
      return { enonce: `Un faisceau gaussien (M² = 1) à ${l} nm a un waist de rayon ${T(w0)} mm. Sur quelle distance reste-t-il « quasi parallèle » (longueur de Rayleigh) ?`, rep: zr, unite: "m", tol: 0.01,
        etapes: [`\\(z_R = \\pi w_0^2/\\lambda\\), tout en mètres.`, `\\(z_R = \\dfrac{\\pi\\times(${M(w0)}\\times10^{-3})^2}{${l}\\times10^{-9}} = ${M(zr, 3)}\\ \\text{m}\\)`, `Sur \\(\\pm z_R\\) autour du waist, le rayon grandit d'au plus \\(\\sqrt2\\).`] };
    } },
  { id: "divergence", th: "faisceau", titre: "divergence d'un faisceau", rel: "divergence d'un faisceau gaussien", f: "\\theta = M^2\\,\\dfrac{\\lambda}{\\pi w_0}",
    lecons: ["lasers/faisceau-gaussien"],
    gen(r) {
      const w0 = pick(r, [0.2, 0.5, 1, 2]), l = pick(r, [633, 1064, 1550]), m2 = pick(r, [1, 1, 1.1, 1.3, 2]), th = m2 * l * 1e-9 / (Math.PI * w0 * 1e-3) * 1e3;
      return { enonce: `Un faisceau à ${l} nm, de waist ${T(w0)} mm et de facteur de qualité M² = ${T(m2)}, diverge de quel demi-angle ? (en mrad)`, rep: th, unite: "mrad", tol: 0.01,
        etapes: [`\\(\\theta = M^2\\lambda/(\\pi w_0)\\) en radians.`, `\\(\\theta = ${M(m2)}\\times\\dfrac{${l}\\times10^{-9}}{\\pi\\times ${M(w0)}\\times10^{-3}} = ${M(th / 1000, 3)}\\ \\text{rad} = ${M(th, 3)}\\ \\text{mrad}\\)`, `À 10 m, le rayon a grandi d'environ \\(${M(th * 10, 3)}\\ \\text{mm}\\).`] };
    } },
  { id: "waist-foyer", th: "faisceau", titre: "focaliser un faisceau", rel: "waist au foyer d'une lentille", f: "w_0' \\approx M^2\\,\\dfrac{\\lambda f}{\\pi w}",
    lecons: ["lasers/faisceau-gaussien", "decouvrir/rayons-lentilles"],
    gen(r) {
      const l = pick(r, [633, 1064, 1550]), f = pick(r, [25, 50, 100, 200]), w = pick(r, [1, 2, 3]), w0 = l * 1e-9 * f * 1e-3 / (Math.PI * w * 1e-3) * 1e6;
      return { enonce: `Un faisceau gaussien parfait (M² = 1) de rayon ${w} mm sur la lentille, à ${l} nm, est focalisé par une lentille de ${f} mm. Quel est le rayon du waist au foyer ?`, rep: w0, unite: "µm", tol: 0.01,
        etapes: [`\\(w_0' \\approx \\lambda f/(\\pi w)\\) (faisceau collimaté à l'entrée).`, `\\(w_0' = \\dfrac{${l}\\times10^{-9}\\times ${M(f / 1000)}}{\\pi\\times ${w}\\times10^{-3}} = ${M(w0, 3)}\\ \\mu\\text{m}\\)`, `Pour une tache plus fine : élargir le faisceau avant la lentille, ou prendre une focale plus courte.`] };
    } },
  { id: "w-z", th: "faisceau", titre: "taille du faisceau à distance", rel: "rayon w(z) d'un faisceau gaussien", f: "w(z) = w_0\\sqrt{1 + (z/z_R)^2}",
    lecons: ["lasers/faisceau-gaussien"],
    gen(r) {
      const w0 = pick(r, [0.3, 0.5, 1]), l = pick(r, [633, 1064]), z = pick(r, [1, 2, 5, 10]), zr = Math.PI * (w0 * 1e-3) ** 2 / (l * 1e-9), w = w0 * Math.sqrt(1 + (z / zr) ** 2);
      return { enonce: `Un faisceau à ${l} nm a un waist de ${T(w0)} mm de rayon. Quel est son rayon à ${z} m du waist ?`, rep: w, unite: "mm", tol: 0.01,
        etapes: [`D'abord \\(z_R = \\pi w_0^2/\\lambda = ${M(zr, 3)}\\ \\text{m}\\).`, `\\(w(z) = w_0\\sqrt{1+(z/z_R)^2} = ${M(w0)}\\sqrt{1+(${z}/${M(zr, 3)})^2} = ${M(w, 3)}\\ \\text{mm}\\)`, `${z > 2 * zr ? "Loin du waist (z ≫ z_R), w grandit presque linéairement : w ≈ θ·z." : "On reste près du waist : le faisceau a peu grossi."}`] };
    } },
  /* ===================== fibres & liaisons ===================== */
  { id: "ouverture-num", th: "fibre", titre: "ouverture numérique", rel: "ouverture numérique d'une fibre", f: "ON = \\sin\\theta_a = \\sqrt{n_1^2 - n_2^2}",
    lecons: ["decouvrir/fibres-pas-a-pas", "physique/optique-geometrique"],
    gen(r) {
      const c = pick(r, [[1.4677, 1.4624, "une fibre monomode télécom"], [1.48, 1.46, "une fibre multimode silice"], [1.458, 1.444, "une fibre multimode"], [1.49, 1.41, "une fibre plastique (POF)"]]);
      const on = Math.sqrt(c[0] ** 2 - c[1] ** 2), ang = r() < 0.5, ta = Math.asin(on) / DEG;
      if (!ang) return { enonce: `${c[2][0].toUpperCase() + c[2].slice(1)} a un cœur d'indice ${T(c[0], 5)} et une gaine d'indice ${T(c[1], 5)}. Quelle est son ouverture numérique ?`, rep: on, unite: "", tol: 0.01,
        etapes: [`\\(ON = \\sqrt{n_1^2 - n_2^2}\\).`, `\\(ON = \\sqrt{${M(c[0], 5)}^2 - ${M(c[1], 5)}^2} = ${M(on, 3)}\\)`] };
      return { enonce: `${c[2][0].toUpperCase() + c[2].slice(1)} (cœur ${T(c[0], 5)}, gaine ${T(c[1], 5)}) : quel est le demi-angle maximal d'entrée de la lumière, dans l'air ?`, rep: ta, unite: "°", tol: 0.01,
        etapes: [`\\(ON = \\sqrt{n_1^2 - n_2^2} = ${M(on, 3)}\\).`, `\\(\\theta_a = \\arcsin(ON) = ${M(ta, 3)}^\\circ\\) : au-delà, le rayon n'est plus guidé.`] };
    } },
  { id: "frequence-v", th: "fibre", titre: "monomode ou multimode ?", rel: "fréquence normalisée V", f: "V = \\dfrac{2\\pi a}{\\lambda}\\,ON \\quad (\\text{monomode si } V < 2{,}405)",
    lecons: ["decouvrir/fibres-pas-a-pas", "physique/optique-geometrique"],
    gen(r) {
      const fb = pick(r, [{ n: "monomode télécom (cœur 8,2 µm, ON effective 0,12)", a: 4.1, on: 0.12 }, { n: "multimode 50/125 (ON 0,20)", a: 25, on: 0.2 }]);
      const l = pick(r, fb.a < 10 ? [850, 1310, 1550] : [850, 1310]), V = 2 * Math.PI * fb.a * fb.on / (l / 1000);
      return { enonce: `Fibre ${fb.n}, utilisée à ${l} nm. Calcule sa fréquence normalisée V.`, rep: V, unite: "", tol: 0.01,
        etapes: [`\\(V = 2\\pi a\\,ON/\\lambda\\), avec \\(a\\) le rayon du cœur (même unité que λ).`, `\\(V = \\dfrac{2\\pi\\times ${M(fb.a)}\\times ${M(fb.on)}}{${M(l / 1000, 3)}} = ${M(V, 3)}\\)`, V < 2.405 ? `V < 2,405 : un seul mode guidé, la fibre est monomode à cette longueur d'onde.` : `V > 2,405 : plusieurs modes guidés (environ \\(V^2/2 \\approx ${Math.round(V * V / 2)}\\)) : la fibre est multimode à cette longueur d'onde.`] };
    } },
  { id: "budget", th: "fibre", titre: "bilan de liaison", rel: "bilan de liaison en dB", f: "P_{\\text{reçue}} = P_{\\text{émise}} - \\alpha L - \\textstyle\\sum \\text{pertes}",
    lecons: ["decouvrir/fibres-pas-a-pas", "maths/unites-db", "amplis/puissance-mesures"],
    gen(r) {
      const Pin = pick(r, [-3, 0, 3, 5]), c = pick(r, [[1310, 0.35], [1550, 0.2]]), L = grille(r, 5, 80, 5), nc = pick(r, [2, 4]), ns = grille(r, 0, 8, 1);
      const pertes = c[1] * L + nc * 0.5 + ns * 0.1, Pout = Pin - pertes;
      return { enonce: `Un émetteur injecte ${Pin} dBm dans ${L} km de fibre à ${c[0]} nm (${T(c[1])} dB/km), avec ${nc} connecteurs (0,5 dB chacun) et ${ns} soudure${ns > 1 ? "s" : ""} (0,1 dB chacune). Quelle puissance arrive au récepteur ?`, rep: Pout, unite: "dBm", tol: 0, abs: 0.05,
        etapes: [`En dB, les pertes s'additionnent : fibre \\(${M(c[1])}\\times${L} = ${M(c[1] * L, 3)}\\ \\text{dB}\\), connecteurs \\(${nc}\\times0{,}5 = ${M(nc * 0.5)}\\ \\text{dB}\\), soudures \\(${ns}\\times0{,}1 = ${M(ns * 0.1, 2)}\\ \\text{dB}\\).`, `Total \\(${M(pertes, 4)}\\ \\text{dB}\\) ; \\(P = ${Pin} - ${M(pertes, 4)} = ${M(Pout, 4)}\\ \\text{dBm}\\) (soit \\(${M(10 ** (Pout / 10), 3)}\\ \\text{mW}\\)).`] };
    } },
  { id: "portee", th: "fibre", titre: "longueur maximale d'une liaison", rel: "portée d'une liaison", f: "L_{max} = \\dfrac{P_e - S - \\text{pertes fixes} - \\text{marge}}{\\alpha}",
    lecons: ["decouvrir/fibres-pas-a-pas", "maths/unites-db"],
    gen(r) {
      const Pe = pick(r, [-3, 0, 3]), S = pick(r, [-30, -28, -24, -20]), c = pick(r, [[1310, 0.35], [1550, 0.2]]), Lm = (Pe - S - 1 - 3) / c[1];
      return { enonce: `Émetteur : ${Pe} dBm. Sensibilité du récepteur : ${S} dBm. On compte 2 connecteurs (0,5 dB chacun) et on garde 3 dB de marge. Fibre à ${c[0]} nm : ${T(c[1])} dB/km. Quelle longueur maximale de fibre ?`, rep: Lm, unite: "km", tol: 0.01,
        etapes: [`Budget disponible : \\(P_e - S = ${Pe} - (${S}) = ${Pe - S}\\ \\text{dB}\\).`, `On retire connecteurs (1 dB) et marge (3 dB) : il reste \\(${Pe - S - 4}\\ \\text{dB}\\) pour la fibre.`, `\\(L_{max} = ${Pe - S - 4}/${M(c[1])} = ${M(Lm, 3)}\\ \\text{km}\\)`] };
    } },
  { id: "dbm", th: "fibre", titre: "dBm ↔ mW", rel: "conversion dBm ↔ mW", f: "P[\\text{dBm}] = 10\\log_{10}\\!\\left(\\dfrac{P}{1\\ \\text{mW}}\\right)",
    lecons: ["maths/unites-db", "decouvrir/mesurer-lumiere"],
    gen(r) {
      if (r() < 0.5) { const Pm = pick(r, [0.01, 0.05, 0.2, 0.5, 2, 5, 20, 50, 100, 250]), x = 10 * Math.log10(Pm);
        return { enonce: `Exprime ${T(Pm)} mW en dBm.`, rep: x, unite: "dBm", tol: 0, abs: 0.05,
          etapes: [`\\(P[\\text{dBm}] = 10\\log_{10}(P/1\\ \\text{mW})\\).`, `\\(10\\log_{10}(${M(Pm)}) = ${M(x, 3)}\\ \\text{dBm}\\)`, `Repères : 1 mW = 0 dBm, ×2 = +3 dB, ×10 = +10 dB.`] }; }
      const x = pick(r, [-30, -20, -17, -13, -6, -3, 3, 7, 10, 13, 17, 20, 23]), Pm = 10 ** (x / 10);
      return { enonce: `Une puissance de ${x} dBm, c'est combien de milliwatts ?`, rep: Pm, unite: "mW", tol: 0.01,
        etapes: [`\\(P = 10^{x/10}\\ \\text{mW}\\).`, `\\(P = 10^{${x}/10} = ${M(Pm, 3)}\\ \\text{mW}\\)`, `Astuce de tête : ${x} dB = ${Math.floor(x / 10) * 10} dB + ${x - Math.floor(x / 10) * 10} dB, et 3 dB ≈ ×2, 7 dB ≈ ×5.`] };
    } },
  { id: "gain-db", th: "fibre", titre: "gain d'un amplificateur", rel: "gain en dB", f: "G[\\text{dB}] = 10\\log_{10}\\dfrac{P_s}{P_e}",
    lecons: ["amplis/principe", "amplis/edfa", "maths/unites-db"],
    gen(r) {
      const Pe = pick(r, [10, 20, 50, 100]), Ps = pick(r, [10, 20, 50, 100]), G = 10 * Math.log10(Ps * 1000 / Pe);
      return { enonce: `Un EDFA reçoit ${Pe} µW et délivre ${Ps} mW. Quel est son gain ?`, rep: G, unite: "dB", tol: 0, abs: 0.05,
        etapes: [`Même unité d'abord : \\(${Ps}\\ \\text{mW} = ${Ps * 1000}\\ \\mu\\text{W}\\).`, `\\(G = 10\\log_{10}(${Ps * 1000}/${Pe}) = 10\\log_{10}(${M(Ps * 1000 / Pe, 4)}) = ${M(G, 3)}\\ \\text{dB}\\)`] };
    } },
  /* ===================== diodes laser ===================== */
  { id: "seuil-pente", th: "laser", titre: "seuil et rendement d'une diode", rel: "seuil & rendement à partir de deux points", f: "\\eta = \\dfrac{\\Delta P}{\\Delta I} \\qquad I_{th} = I_1 - \\dfrac{P_1}{\\eta}",
    lecons: ["lasers/diode-laser", "projet/protocoles"],
    gen(r) {
      const Ith = grille(r, 8, 40, 1), eta = grille(r, 0.2, 1, 0.05), I1 = Ith + grille(r, 5, 20, 5), I2 = I1 + grille(r, 10, 40, 10);
      const P1 = +(eta * (I1 - Ith)).toFixed(2), P2 = +(eta * (I2 - Ith)).toFixed(2), askEta = r() < 0.4;
      const et = [`Au-dessus du seuil, \\(P = \\eta\\,(I - I_{th})\\) : une droite.`, `Pente \\(\\eta = \\dfrac{${M(P2, 4)} - ${M(P1, 4)}}{${I2} - ${I1}} = ${M(eta, 3)}\\ \\text{mW/mA} = ${M(eta, 3)}\\ \\text{W/A}\\)`];
      if (askEta) return { enonce: `Sur une diode laser on mesure ${T(P1, 4)} mW à ${I1} mA et ${T(P2, 4)} mW à ${I2} mA (au-dessus du seuil). Quel est le rendement différentiel, en W/A ?`, rep: eta, unite: "W/A", tol: 0.01, etapes: et };
      return { enonce: `Sur une diode laser on mesure ${T(P1, 4)} mW à ${I1} mA et ${T(P2, 4)} mW à ${I2} mA (au-dessus du seuil). Quel est son courant de seuil ?`, rep: Ith, unite: "mA", tol: 0.01,
        etapes: et.concat([`\\(I_{th} = I_1 - P_1/\\eta = ${I1} - ${M(P1, 4)}/${M(eta, 3)} = ${M(Ith, 3)}\\ \\text{mA}\\)`]) };
    } },
  { id: "puissance-courant", th: "laser", titre: "puissance à un courant donné", rel: "P = η(I − I_seuil)", f: "P = \\eta\\,(I - I_{th})",
    lecons: ["lasers/diode-laser", "electronique/driver-courant"],
    gen(r) {
      const Ith = grille(r, 10, 40, 1), eta = grille(r, 0.3, 1, 0.05), I = Ith + grille(r, 10, 80, 5), Pw = eta * (I - Ith);
      return { enonce: `Une diode a un seuil de ${Ith} mA et un rendement de ${T(eta)} W/A. Quelle puissance émet-elle à ${I} mA ?`, rep: Pw, unite: "mW", tol: 0.01,
        etapes: [`\\(P = \\eta\\,(I - I_{th})\\) ; W/A = mW/mA.`, `\\(P = ${M(eta)}\\times(${I} - ${Ith}) = ${M(Pw, 4)}\\ \\text{mW}\\)`, `Sous le seuil (I < ${Ith} mA), elle n'émettrait presque rien : de l'émission spontanée, comme une LED.`] };
    } },
  { id: "rendement-prise", th: "laser", titre: "rendement à la prise", rel: "rendement à la prise (P / V·I)", f: "\\eta_{wp} = \\dfrac{P_{opt}}{V\\,I}",
    lecons: ["lasers/diode-laser", "projet/protocoles"],
    gen(r) {
      const Ith = grille(r, 10, 30, 1), eta = grille(r, 0.4, 0.9, 0.05), I = Ith + grille(r, 20, 80, 10), V = grille(r, 1.8, 2.4, 0.1), Pw = eta * (I - Ith), w = 100 * Pw / (V * I);
      return { enonce: `À ${I} mA sous ${T(V)} V, une diode émet ${T(Pw, 4)} mW. Quel est son rendement à la prise ?`, rep: w, unite: "%", tol: 0.01,
        etapes: [`Puissance électrique \\(V\\,I = ${M(V)}\\times ${I}\\ \\text{mA} = ${M(V * I, 4)}\\ \\text{mW}\\).`, `\\(\\eta_{wp} = ${M(Pw, 4)}/${M(V * I, 4)} = ${M(w, 3)}\\,\\%\\)`, `Le reste (\\(${M(V * I - Pw, 4)}\\ \\text{mW}\\)) part en chaleur : c'est ce que le TEC doit évacuer.`] };
    } },
  { id: "isl", th: "laser", titre: "modes d'une cavité", rel: "intervalle spectral libre", f: "\\Delta\\lambda = \\dfrac{\\lambda^2}{2 n_g L} \\qquad \\Delta\\nu = \\dfrac{c}{2 n_g L}",
    lecons: ["lasers/cavite-modes", "lasers/diode-laser"],
    gen(r) {
      const l = pick(r, [780, 980, 1310, 1550]), ng = pick(r, [3.6, 3.8, 4.0]), L = pick(r, [250, 300, 500, 750, 1000]);
      if (r() < 0.6) { const dl = l * l / (2 * ng * L * 1000);
        return { enonce: `Une puce laser de ${L} µm de long (indice de groupe ${T(ng)}) émet vers ${l} nm. Quel écart sépare deux modes longitudinaux, en nm ?`, rep: dl, unite: "nm", tol: 0.01,
          etapes: [`\\(\\Delta\\lambda = \\lambda^2/(2 n_g L)\\), tout dans la même unité.`, `\\(\\Delta\\lambda = \\dfrac{${l}^2}{2\\times ${M(ng)}\\times ${L * 1000}} = ${M(dl, 3)}\\ \\text{nm}\\)`, `Une cavité plus courte écarte les modes : c'est une des clés du fonctionnement monomode.`] }; }
      const dn = CL / (2 * ng * L * 1e-6) / 1e9;
      return { enonce: `Une puce laser de ${L} µm de long a un indice de groupe de ${T(ng)}. Quel est l'écart en fréquence entre deux modes longitudinaux, en GHz ?`, rep: dn, unite: "GHz", tol: 0.01,
        etapes: [`\\(\\Delta\\nu = c/(2 n_g L)\\).`, `\\(\\Delta\\nu = \\dfrac{3\\times10^8}{2\\times ${M(ng)}\\times ${L}\\times10^{-6}} = ${M(dn, 3)}\\ \\text{GHz}\\)`] };
    } },
  { id: "derive-thermique", th: "laser", titre: "longueur d'onde et température", rel: "dérive thermique de λ", f: "\\lambda(T) = \\lambda_0 + \\dfrac{d\\lambda}{dT}\\,(T - T_0)",
    lecons: ["lasers/accordabilite", "electronique/tec-pid", "lasers/diode-laser"],
    gen(r) {
      const d = pick(r, [{ n: "Fabry-Perot", k: 0.3 }, { n: "Fabry-Perot", k: 0.25 }, { n: "DFB", k: 0.1 }, { n: "DFB", k: 0.08 }]), l0 = pick(r, [780.0, 852.0, 1310.0, 1550.0]);
      if (r() < 0.5) { const Tt = grille(r, 15, 45, 1), l = l0 + d.k * (Tt - 25);
        return { enonce: `Une diode ${d.n} émet à ${T(l0, 5)} nm à 25 °C et dérive de ${T(d.k)} nm/K. À quelle longueur d'onde émet-elle à ${Tt} °C ?`, rep: l, unite: "nm", tol: 0, abs: 0.01,
          etapes: [`\\(\\lambda = \\lambda_0 + k\\,(T - T_0)\\).`, `\\(\\lambda = ${M(l0, 5)} + ${M(d.k)}\\times(${Tt} - 25) = ${M(l, 6)}\\ \\text{nm}\\)`, `D'où l'importance d'une régulation de température au centième de degré pour une longueur d'onde stable.`] }; }
      const dl = pick(r, [0.2, 0.5, 1, 1.5]), dT = dl / d.k;
      return { enonce: `Pour décaler une diode ${d.n} (${T(d.k)} nm/K) de ${T(dl)} nm, de combien faut-il changer sa température ?`, rep: dT, unite: "K", tol: 0.01,
        etapes: [`\\(\\Delta T = \\Delta\\lambda / k\\).`, `\\(\\Delta T = ${M(dl)}/${M(d.k)} = ${M(dT, 3)}\\ \\text{K}\\)`] };
    } },
  /* ===================== photodétection ===================== */
  { id: "sensibilite", th: "detection", titre: "sensibilité d'une photodiode", rel: "sensibilité d'une photodiode (R = ηλ/1240)", f: "R = \\eta\\,\\dfrac{q\\lambda}{hc} \\approx \\eta\\,\\dfrac{\\lambda[\\text{nm}]}{1240}\\ \\text{A/W}",
    lecons: ["electronique/photodetection", "decouvrir/mesurer-lumiere"],
    gen(r) {
      const l = pick(r, [405, 532, 633, 850, 980, 1310, 1550]), eta = pick(r, [0.6, 0.7, 0.8, 0.85, 0.9]), R = eta * l / HC, mat = l <= 1000 ? "silicium" : "InGaAs";
      return { enonce: `Une photodiode en ${mat} a un rendement quantique de ${T(eta)} à ${l} nm. Quelle est sa sensibilité ?`, rep: R, unite: "A/W", tol: 0.01,
        etapes: [`Chaque photon (\\(E = hc/\\lambda\\)) donne au mieux un électron (\\(q\\)) : \\(R = \\eta\\,q\\lambda/(hc) = \\eta\\,\\lambda[\\text{nm}]/1239{,}84\\).`, `\\(R = ${M(eta)}\\times ${l}/1239{,}84 = ${M(R, 3)}\\ \\text{A/W}\\)`] };
    } },
  { id: "photocourant", th: "detection", titre: "photocourant", rel: "photocourant I = R·P", f: "I = R\\,P",
    lecons: ["electronique/photodetection", "decouvrir/mesurer-lumiere"],
    gen(r) {
      const R = pick(r, [0.45, 0.6, 0.9, 1.0]), Pu = pick(r, [5, 20, 50, 100, 500]), I = R * Pu;
      return { enonce: `Une photodiode de sensibilité ${T(R)} A/W reçoit ${Pu} µW. Quel photocourant débite-t-elle ?`, rep: I, unite: "µA", tol: 0.01,
        etapes: [`\\(I = R\\,P\\).`, `\\(I = ${M(R)}\\ \\text{A/W}\\times ${Pu}\\ \\mu\\text{W} = ${M(I, 3)}\\ \\mu\\text{A}\\)`] };
    } },
  { id: "tia", th: "detection", titre: "amplificateur transimpédance", rel: "tension de sortie d'un TIA", f: "V_s = R_f\\,I = R_f\\,R\\,P",
    lecons: ["electronique/photodetection"],
    gen(r) {
      for (;;) {
        const Pu = pick(r, [10, 50, 100, 200]), R = pick(r, [0.5, 0.65, 0.9]), Rf = pick(r, [1, 4.7, 10, 22, 47]), V = Pu * R * Rf / 1000; if (V > 4.5 || V < 0.02) continue;
        return { enonce: `${Pu} µW tombent sur une photodiode de ${T(R)} A/W, suivie d'un amplificateur transimpédance de ${T(Rf)} kΩ. Quelle tension en sortie ?`, rep: V, unite: "V", tol: 0.01,
          etapes: [`Photocourant \\(I = R\\,P = ${M(R)}\\times ${Pu} = ${M(R * Pu, 3)}\\ \\mu\\text{A}\\).`, `\\(V_s = R_f\\,I = ${M(Rf)}\\ \\text{k}\\Omega\\times ${M(R * Pu, 3)}\\ \\mu\\text{A} = ${M(V, 3)}\\ \\text{V}\\)`, `Vérifie toujours que \\(V_s\\) reste sous la tension de saturation de l'AOP.`] };
      }
    } },
  { id: "tia-bp", th: "detection", titre: "bande passante d'un TIA", rel: "bande passante d'un TIA (1/2πRfCf)", f: "f_{-3\\,\\text{dB}} \\approx \\dfrac{1}{2\\pi R_f C_f}",
    lecons: ["electronique/photodetection"],
    gen(r) {
      const Rf = pick(r, [10e3, 47e3, 100e3, 1e6]), Cf = pick(r, [1, 2.2, 4.7, 10]), f = 1 / (2 * Math.PI * Rf * Cf * 1e-12) / 1e3;
      return { enonce: `Un TIA a une résistance de contre-réaction de ${Rf >= 1e6 ? T(Rf / 1e6) + " MΩ" : T(Rf / 1e3) + " kΩ"} en parallèle avec ${T(Cf)} pF. Quelle est sa bande passante à −3 dB, en kHz ?`, rep: f, unite: "kHz", tol: 0.01,
        etapes: [`\\(f = 1/(2\\pi R_f C_f)\\).`, `\\(f = \\dfrac{1}{2\\pi\\times ${M(Rf, 3)}\\times ${M(Cf)}\\times10^{-12}} = ${M(f, 3)}\\ \\text{kHz}\\)`, `Compromis : plus de gain (\\(R_f\\) grand) = moins de bande passante.`] };
    } },
  { id: "grenaille", th: "detection", titre: "bruit de grenaille", rel: "bruit de grenaille", f: "i_n = \\sqrt{2\\,q\\,I\\,B}",
    lecons: ["electronique/photodetection", "amplis/principe"],
    gen(r) {
      const I = pick(r, [1, 10, 100]), B = pick(r, [1e3, 1e5, 1e6, 1e7]), i = Math.sqrt(2 * Q * I * 1e-6 * B) * 1e9;
      return { enonce: `Un photocourant de ${I} µA est mesuré dans une bande de ${B < 1e6 ? T(B / 1e3) + " kHz" : T(B / 1e6) + " MHz"}. Quel est le courant de bruit de grenaille ?`, rep: i, unite: "nA", tol: 0.01,
        etapes: [`\\(i_n = \\sqrt{2qIB}\\), avec \\(q = 1{,}602\\times10^{-19}\\ \\text{C}\\).`, `\\(i_n = \\sqrt{2\\times1{,}602\\times10^{-19}\\times ${I}\\times10^{-6}\\times ${M(B)}} = ${M(i, 3)}\\ \\text{nA}\\)`, `Rapport signal/bruit : \\(I/i_n = ${M(I * 1000 / i, 3)}\\) — il grandit comme \\(\\sqrt{I}\\).`] };
    } },
  /* ===================== électronique GEII ===================== */
  { id: "diviseur", th: "electronique", titre: "pont diviseur", rel: "pont diviseur de tension", f: "V_s = V_e\\,\\dfrac{R_2}{R_1 + R_2}",
    lecons: ["electronique/acquisition", "projet/electronique-banc"],
    gen(r) {
      const Ve = pick(r, [3.3, 5, 12]), R1 = pick(r, [1, 2.2, 3.3, 4.7, 10, 22]), R2 = pick(r, [1, 2.2, 4.7, 6.8, 10, 47]), V = Ve * R2 / (R1 + R2);
      return { enonce: `Un pont diviseur, alimenté sous ${T(Ve)} V, a R₁ = ${T(R1)} kΩ (en haut) et R₂ = ${T(R2)} kΩ (en bas). Quelle tension au point milieu, à vide ?`, rep: V, unite: "V", tol: 0.01,
        etapes: [`\\(V_s = V_e\\,R_2/(R_1+R_2)\\) (aucun courant prélevé).`, `\\(V_s = ${M(Ve)}\\times\\dfrac{${M(R2)}}{${M(R1)}+${M(R2)}} = ${M(V, 3)}\\ \\text{V}\\)`] };
    } },
  { id: "rc", th: "electronique", titre: "filtre RC", rel: "fréquence de coupure RC", f: "f_c = \\dfrac{1}{2\\pi R C}",
    lecons: ["maths/fourier-signal", "electronique/acquisition"],
    gen(r) {
      const R = pick(r, [1, 4.7, 10, 47, 100]), C = pick(r, [[10, "nF", 1e-8], [47, "nF", 4.7e-8], [100, "nF", 1e-7], [1, "µF", 1e-6]]), f = 1 / (2 * Math.PI * R * 1e3 * C[2]);
      return { enonce: `Filtre passe-bas RC : R = ${T(R)} kΩ, C = ${C[0]} ${C[1]}. Quelle est sa fréquence de coupure, en Hz ?`, rep: f, unite: "Hz", tol: 0.01,
        etapes: [`\\(f_c = 1/(2\\pi RC)\\) ; à \\(f_c\\) le gain vaut −3 dB.`, `\\(RC = ${M(R * 1e3, 3)}\\times ${M(C[2], 3)} = ${M(R * 1e3 * C[2], 3)}\\ \\text{s}\\)`, `\\(f_c = 1/(2\\pi\\times ${M(R * 1e3 * C[2], 3)}) = ${M(f, 3)}\\ \\text{Hz}\\)`] };
    } },
  { id: "aop", th: "electronique", titre: "montage à AOP", rel: "gain d'un montage à AOP", f: "G_{\\text{non-inv}} = 1 + \\dfrac{R_2}{R_1} \\qquad G_{\\text{inv}} = -\\dfrac{R_2}{R_1}",
    lecons: ["electronique/photodetection", "electronique/acquisition"],
    gen(r) {
      for (;;) {
        const inv = r() < 0.5, R1 = pick(r, [1, 2.2, 4.7, 10]), R2 = pick(r, [10, 22, 47, 100]), Ve = pick(r, [0.05, 0.1, 0.25, 0.5]);
        const G = inv ? -R2 / R1 : 1 + R2 / R1, V = G * Ve; if (Math.abs(V) > 11) continue;
        return { enonce: `Montage ${inv ? "inverseur" : "non inverseur"} à AOP : R₁ = ${T(R1)} kΩ, R₂ = ${T(R2)} kΩ (contre-réaction). L'entrée vaut ${T(Ve)} V. Quelle est la tension de sortie (avec son signe) ?`, rep: V, unite: "V", tol: 0.01,
          etapes: [inv ? `Inverseur : \\(G = -R_2/R_1 = -${M(R2)}/${M(R1)} = ${M(G, 3)}\\).` : `Non inverseur : \\(G = 1 + R_2/R_1 = 1 + ${M(R2)}/${M(R1)} = ${M(G, 3)}\\).`, `\\(V_s = G\\,V_e = ${M(G, 3)}\\times ${M(Ve)} = ${M(V, 3)}\\ \\text{V}\\)`] };
      }
    } },
  { id: "can", th: "electronique", titre: "convertisseur analogique-numérique", rel: "quantum d'un convertisseur (LSB)", f: "q = \\dfrac{V_{ref}}{2^n} \\qquad N = \\text{arrondi}(V/q)",
    lecons: ["electronique/acquisition", "projet/code-1-pilotes"],
    gen(r) {
      const v = r();
      if (v < 0.4) { const n = pick(r, [8, 10, 12, 16]), Vr = pick(r, [3.3, 4.096, 5]), q = Vr / 2 ** n * 1000;
        return { enonce: `Un CAN de ${n} bits a une pleine échelle de ${T(Vr, 4)} V. Quelle est la valeur d'un pas (LSB), en mV ?`, rep: q, unite: "mV", tol: 0.01,
          etapes: [`\\(q = V_{ref}/2^n\\).`, `\\(q = ${M(Vr, 4)}/2^{${n}} = ${M(Vr, 4)}/${2 ** n} = ${M(q, 4)}\\ \\text{mV}\\)`] }; }
      if (v < 0.7) { const V = grille(r, 0.1, 4, 0.0005), N = Math.round(V / 0.125e-3);
        return { enonce: `Un ADS1115 réglé sur ±4,096 V (16 bits signés) mesure ${T(V, 5)} V. Quel code numérique renvoie-t-il ?`, rep: N, unite: "", tol: 0, abs: 1.01,
          etapes: [`Pleine échelle ±4,096 V sur 16 bits signés : \\(q = 4{,}096/32768 = 0{,}125\\ \\text{mV}\\).`, `\\(N = ${M(V, 5)}/0{,}000125 = ${N}\\)`, `C'est ce calcul que fait ton pilote \\(\\texttt{ADS1115}\\) dans le code du banc.`] }; }
      const n = pick(r, [10, 12]), Vr = 3.3, V = grille(r, 0.2, 3.2, 0.01), q = Vr / 2 ** n, N = Math.round(V / q);
      return { enonce: `Un CAN ${n} bits de référence 3,3 V convertit ${T(V)} V. Quel code (arrondi au plus proche) obtient-on ?`, rep: N, unite: "", tol: 0, abs: 1.01,
        etapes: [`\\(q = 3{,}3/2^{${n}} = ${M(q * 1000, 4)}\\ \\text{mV}\\).`, `\\(N = V/q = ${M(V)}/${M(q, 4)} \\approx ${N}\\)`] };
    } },
  { id: "shunt", th: "electronique", titre: "mesurer un courant", rel: "mesure de courant par shunt", f: "I = \\dfrac{V}{G\\,R_s}",
    lecons: ["electronique/driver-courant", "projet/electronique-banc"],
    gen(r) {
      for (;;) {
        const Rs = pick(r, [0.1, 0.5, 1, 10]), G = pick(r, [1, 10, 20, 50]), I = pick(r, [20, 50, 80, 120, 250]), V = G * Rs * I / 1000; if (V > 4.5 || V < 0.05) continue;
        return { enonce: `Le courant d'une diode traverse un shunt de ${T(Rs)} Ω ; la tension à ses bornes est amplifiée ×${G}. On lit ${T(V, 4)} V. Quel est le courant ?`, rep: I, unite: "mA", tol: 0.01,
          etapes: [`\\(V = G\\,R_s\\,I \\Rightarrow I = V/(G\\,R_s)\\).`, `\\(I = ${M(V, 4)}/(${G}\\times ${M(Rs)}) = ${M(I / 1000, 3)}\\ \\text{A} = ${M(I, 3)}\\ \\text{mA}\\)`, `Puissance dans le shunt : \\(R_s I^2 = ${M(Rs * (I / 1000) ** 2 * 1000, 3)}\\ \\text{mW}\\) — négligeable, c'est voulu.`] };
      }
    } },
  { id: "dissipation", th: "electronique", titre: "chaleur dans un régulateur linéaire", rel: "puissance dissipée dans un régulateur linéaire", f: "P = (V_{alim} - V_{charge})\\,I",
    lecons: ["electronique/driver-courant", "electronique/alim-cem"],
    gen(r) {
      const Va = pick(r, [5, 9, 12]), Vd = pick(r, [1.8, 2.2, 2.5]), I = pick(r, [50, 100, 200, 500, 1000]), Pw = (Va - Vd) * I / 1000;
      return { enonce: `Une source de courant linéaire alimentée en ${Va} V pilote une diode à ${I} mA, qui a ${T(Vd)} V à ses bornes. Quelle puissance chauffe le transistor de régulation ?`, rep: Pw, unite: "W", tol: 0.01,
          etapes: [`Le transistor « mange » la différence de tension : \\(P = (V_{alim} - V_{diode})\\,I\\).`, `\\(P = (${Va} - ${M(Vd)})\\times ${M(I / 1000)} = ${M(Pw, 3)}\\ \\text{W}\\)`, Pw > 1 ? `Plus d'un watt : radiateur obligatoire (ou baisser la tension d'alimentation).` : `Modéré : un boîtier correctement refroidi suffit.`] };
    } },
  { id: "ntc", th: "electronique", titre: "lire une thermistance", rel: "équation β d'une thermistance", f: "\\dfrac{1}{T} = \\dfrac{1}{T_0} + \\dfrac{1}{\\beta}\\ln\\dfrac{R}{R_0}",
    lecons: ["physique/thermique", "electronique/tec-pid"],
    gen(r) {
      const B = pick(r, [3380, 3435, 3950]), R = grille(r, 4, 30, 0.5), Tk = 1 / (1 / 298.15 + Math.log(R / 10) / B), Tc = Tk - 273.15;
      return { enonce: `Une CTN de 10 kΩ à 25 °C (β = ${B} K) mesure ${T(R)} kΩ. Quelle est la température, en °C ?`, rep: Tc, unite: "°C", tol: 0, abs: 0.15,
        etapes: [`Températures en kelvins : \\(T_0 = 298{,}15\\ \\text{K}\\).`, `\\(\\dfrac{1}{T} = \\dfrac{1}{298{,}15} + \\dfrac{1}{${B}}\\ln\\dfrac{${M(R)}}{10} = ${M(1 / Tk, 5)}\\ \\text{K}^{-1}\\)`, `\\(T = ${M(Tk, 5)}\\ \\text{K} = ${M(Tc, 3)}\\ ^\\circ\\text{C}\\) ${R > 10 ? "(R > 10 kΩ : plus froid que 25 °C, c'est une CTN)" : "(R < 10 kΩ : plus chaud que 25 °C)"}.`] };
    } },
  /* ===================== régulation ===================== */
  { id: "premier-ordre", th: "regulation", titre: "réponse d'un premier ordre", rel: "réponse d'un premier ordre", f: "y(t) = y_\\infty\\,(1 - e^{-t/\\tau})",
    lecons: ["maths/derivees-equadiff", "electronique/tec-pid"],
    gen(r) {
      const tau = pick(r, [2, 5, 10, 30]), dT = pick(r, [5, 10, 20]), k = pick(r, [0.5, 1, 2, 3]), t = k * tau, y = dT * (1 - Math.exp(-k));
      return { enonce: `Un module Peltier refroidit une diode : la température suit un premier ordre de constante de temps ${tau} s, vers un écart final de ${dT} K. Quel écart est atteint au bout de ${T(t)} s ?`, rep: y, unite: "K", tol: 0.01,
        etapes: [`\\(y(t) = y_\\infty(1 - e^{-t/\\tau})\\), ici \\(t/\\tau = ${M(k)}\\).`, `\\(y = ${dT}\\times(1 - e^{-${M(k)}}) = ${dT}\\times ${M(1 - Math.exp(-k), 3)} = ${M(y, 3)}\\ \\text{K}\\)`, `Repères : 63 % à τ, 95 % à 3τ, 99 % à 5τ.`] };
    } },
  { id: "erreur-statique", th: "regulation", titre: "erreur d'une régulation proportionnelle", rel: "erreur statique d'une boucle proportionnelle", f: "\\varepsilon = \\dfrac{1}{1 + K_p K_s}",
    lecons: ["electronique/tec-pid"],
    gen(r) {
      const Kp = pick(r, [1, 2, 5, 10, 20, 50]), Ks = pick(r, [0.5, 1, 2]), e = 100 / (1 + Kp * Ks);
      return { enonce: `Une régulation de température à retour unitaire utilise un correcteur proportionnel K<sub>p</sub> = ${Kp} sur un procédé de gain statique K<sub>s</sub> = ${T(Ks)}. Quelle erreur statique reste-t-il, en % de la consigne ?`, rep: e, unite: "%", tol: 0.01,
        etapes: [`En boucle fermée, l'erreur à une consigne en échelon vaut \\(\\varepsilon = 1/(1 + K_pK_s)\\).`, `\\(\\varepsilon = 1/(1 + ${Kp}\\times ${M(Ks)}) = ${M(e / 100, 3)}\\), soit \\(${M(e, 3)}\\,\\%\\)`, `Augmenter \\(K_p\\) la réduit sans l'annuler (et finit par faire osciller) : c'est le rôle du terme intégral (I) du PID de l'annuler.`] };
    } },
  /* ===================== mesure & qualité ===================== */
  { id: "incertitude-a", th: "mesure", titre: "incertitude de type A", rel: "incertitude de type A (s/√n)", f: "u = \\dfrac{s}{\\sqrt{n}}",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie"],
    gen(r) {
      const s = pick(r, [0.02, 0.05, 0.08, 0.12]), n = pick(r, [5, 10, 20, 25]), u = s / Math.sqrt(n);
      return { enonce: `${n} mesures répétées d'une puissance donnent un écart-type expérimental de ${T(s)} mW. Quelle est l'incertitude-type sur la moyenne ?`, rep: u, unite: "mW", tol: 0.01,
        etapes: [`Type A (statistique) : \\(u = s/\\sqrt{n}\\).`, `\\(u = ${M(s)}/\\sqrt{${n}} = ${M(u, 3)}\\ \\text{mW}\\)`, `Quatre fois plus de mesures = incertitude divisée par deux seulement.`] };
    } },
  { id: "incertitude-b", th: "mesure", titre: "incertitude de type B", rel: "incertitude de type B (a/√3)", f: "u = \\dfrac{a}{\\sqrt{3}}",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie"],
    gen(r) {
      if (r() < 0.5) { const d = pick(r, [0.01, 0.1, 1]), u = d / 2 / Math.sqrt(3);
        return { enonce: `Un afficheur a une résolution de ${T(d)} mV (dernier chiffre). Quelle incertitude-type due à cette résolution ?`, rep: u, unite: "mV", tol: 0.01,
          etapes: [`Loi uniforme de demi-largeur \\(a = ${M(d)}/2 = ${M(d / 2)}\\ \\text{mV}\\).`, `\\(u = a/\\sqrt3 = ${M(u, 3)}\\ \\text{mV}\\)`] }; }
      const pct = pick(r, [1, 2, 3, 5]), L = pick(r, [2, 5, 10, 20]), a = pct / 100 * L, u = a / Math.sqrt(3);
      return { enonce: `Un puissance-mètre annonce une exactitude de ±${pct} % de la lecture. Il affiche ${L} mW. Quelle incertitude-type (type B) ?`, rep: u, unite: "mW", tol: 0.01,
        etapes: [`Demi-étendue \\(a = ${pct}\\,\\%\\times ${L} = ${M(a)}\\ \\text{mW}\\), loi uniforme faute de mieux.`, `\\(u = a/\\sqrt3 = ${M(u, 3)}\\ \\text{mW}\\)`] };
    } },
  { id: "composee", th: "mesure", titre: "incertitude composée", rel: "incertitude composée et élargie", f: "u_c = \\sqrt{\\textstyle\\sum u_i^2} \\qquad U = 2\\,u_c",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie", "projet/validation"],
    gen(r) {
      const u = [pick(r, [0.02, 0.03, 0.05]), pick(r, [0.01, 0.04, 0.06]), pick(r, [0.02, 0.05, 0.1])], uc = Math.hypot(...u), U = 2 * uc;
      return { enonce: `Trois causes indépendantes d'incertitude sur une puissance : ${u.map(x => T(x) + " mW").join(", ")}. Quelle incertitude élargie U (k = 2) ?`, rep: U, unite: "mW", tol: 0.01,
        etapes: [`Somme quadratique : \\(u_c = \\sqrt{${u.map(x => M(x) + "^2").join(" + ")}} = ${M(uc, 3)}\\ \\text{mW}\\).`, `\\(U = 2\\,u_c = ${M(U, 3)}\\ \\text{mW}\\) (niveau de confiance ≈ 95 %).`, `La plus grosse cause domine : c'est elle qu'il faut réduire en premier.`] };
    } },
  { id: "cpk", th: "mesure", titre: "capabilité d'un test de production", rel: "indice de capabilité Cpk", f: "C_{pk} = \\dfrac{\\min(T_S - \\mu,\\ \\mu - T_I)}{3\\sigma}",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie"],
    gen(r) {
      const mu = grille(r, 9.85, 10.15, 0.05), s = pick(r, [0.05, 0.08, 0.1, 0.12, 0.15]), cpk = Math.min(10.5 - mu, mu - 9.5) / (3 * s), cp = 1 / (6 * s);
      return { enonce: `Spécification d'une diode : 10 ± 0,5 mW. Sur la production, moyenne ${T(mu, 4)} mW, écart-type ${T(s)} mW. Quel est le Cpk ?`, rep: cpk, unite: "", tol: 0.01,
        etapes: [`\\(T_I = 9{,}5\\) et \\(T_S = 10{,}5\\ \\text{mW}\\). Distance de la moyenne à la limite la plus proche : \\(${M(Math.min(10.5 - mu, mu - 9.5), 3)}\\ \\text{mW}\\).`, `\\(C_{pk} = ${M(Math.min(10.5 - mu, mu - 9.5), 3)}/(3\\times ${M(s)}) = ${M(cpk, 3)}\\)  (et \\(C_p = 1/(6\\sigma) = ${M(cp, 3)}\\)).`, cpk >= 1.33 ? `≥ 1,33 : procédé capable.` : `< 1,33 : procédé insuffisamment capable — ${Math.abs(mu - 10) > 0.02 ? "commence par recentrer la moyenne" : "il faut réduire la dispersion"}.`] };
    } },
  /* ===================== sécurité & fiabilité ===================== */
  { id: "densite-puissance", th: "surete", titre: "densité de puissance", rel: "densité de puissance (P/surface)", f: "E = \\dfrac{P}{\\pi d^2/4}",
    lecons: ["lasers/securite", "decouvrir/mesurer-lumiere"],
    gen(r) {
      const Pm = pick(r, [5, 50, 500]), d = pick(r, [1, 2, 3, 5]), E = Pm / 1000 / (Math.PI * (d / 10) ** 2 / 4);
      return { enonce: `Un faisceau de ${Pm} mW a un diamètre de ${d} mm (profil supposé uniforme). Quelle est sa densité de puissance, en W/cm² ?`, rep: E, unite: "W/cm²", tol: 0.01,
        etapes: [`Surface \\(S = \\pi d^2/4 = \\pi\\times(${M(d / 10)}\\ \\text{cm})^2/4 = ${M(Math.PI * (d / 10) ** 2 / 4, 3)}\\ \\text{cm}^2\\).`, `\\(E = P/S = ${M(Pm / 1000)}/${M(Math.PI * (d / 10) ** 2 / 4, 3)} = ${M(E, 3)}\\ \\text{W/cm}^2\\)`, `Pour un vrai faisceau gaussien, le centre est environ deux fois plus intense que cette moyenne.`] };
    } },
  { id: "densite-optique", th: "surete", titre: "lunettes de protection", rel: "densité optique d'une protection", f: "OD = \\log_{10}\\dfrac{E}{EMP}",
    lecons: ["lasers/securite", "systemes/securite-poste"],
    gen(r) {
      const E = pick(r, [800, 2500, 12000, 60000, 400000]), emp = pick(r, [10, 25, 50]), od = Math.log10(E / emp);
      return { enonce: `Au poste, l'éclairement possible sur l'œil vaut ${T(E)} W/m² ; on admet une EMP de ${emp} W/m² pour ce cas. Quelle densité optique minimale doivent avoir les lunettes ?`, rep: od, unite: "", tol: 0, abs: 0.03,
        etapes: [`Il faut atténuer d'un facteur \\(E/EMP = ${M(E / emp, 4)}\\).`, `\\(OD = \\log_{10}(${M(E / emp, 4)}) = ${M(od, 3)}\\)`, `On choisit l'OD entière supérieure (${Math.ceil(od)}) à cette longueur d'onde — et on vérifie le marquage de la lunette (EN 207).`] };
    } },
  { id: "fiabilite", th: "surete", titre: "fiabilité exponentielle", rel: "fiabilité exponentielle (MTBF)", f: "R(t) = e^{-t/MTBF}",
    lecons: ["systemes/methodes-maintenance"],
    gen(r) {
      const mtbf = pick(r, [10000, 20000, 50000, 100000]), t = pick(r, [1000, 4380, 8760, 20000]), R = 100 * Math.exp(-t / mtbf);
      return { enonce: `Un module laser a un MTBF de ${T(mtbf)} h (taux de défaillance constant). Quelle probabilité a-t-il de fonctionner encore après ${T(t)} h ?`, rep: R, unite: "%", tol: 0.005,
        etapes: [`Taux constant : \\(R(t) = e^{-t/MTBF}\\).`, `\\(R = e^{-${t}/${mtbf}} = e^{-${M(t / mtbf, 3)}} = ${M(R / 100, 4)}\\), soit \\(${M(R, 3)}\\,\\%\\)`, `Attention : MTBF ≠ durée de vie garantie — à t = MTBF, il n'en reste que 37 %.`] };
    } },
  { id: "disponibilite", th: "surete", titre: "disponibilité", rel: "disponibilité (MTBF / (MTBF + MTTR))", f: "A = \\dfrac{MTBF}{MTBF + MTTR}",
    lecons: ["systemes/methodes-maintenance", "systemes/diagnostic"],
    gen(r) {
      const mtbf = pick(r, [500, 1000, 2000, 5000]), mttr = pick(r, [2, 4, 8, 24]), A = 100 * mtbf / (mtbf + mttr);
      return { enonce: `Un banc de test tombe en panne en moyenne toutes les ${mtbf} h et sa réparation dure en moyenne ${mttr} h. Quelle est sa disponibilité ?`, rep: A, unite: "%", tol: 0, abs: 0.02,
        etapes: [`\\(A = MTBF/(MTBF + MTTR)\\).`, `\\(A = ${mtbf}/(${mtbf} + ${mttr}) = ${M(A / 100, 5)}\\), soit \\(${M(A, 4)}\\,\\%\\)`, `Pour l'améliorer : réduire le MTTR (pièces en stock, diagnostic rapide) est souvent plus facile qu'augmenter le MTBF.`] };
    } },
  { id: "weibull", th: "surete", titre: "loi de Weibull", rel: "fiabilité de Weibull", f: "R(t) = e^{-(t/\\eta)^\\beta}",
    lecons: ["systemes/methodes-maintenance"],
    gen(r) {
      const b = pick(r, [0.8, 1.5, 2, 3]), eta = pick(r, [5000, 10000, 20000]), t = pick(r, [1000, 5000, 10000]), R = 100 * Math.exp(-((t / eta) ** b));
      return { enonce: `Des diodes suivent une loi de Weibull de paramètres β = ${T(b)} et η = ${T(eta)} h. Quelle fraction fonctionne encore après ${T(t)} h ?`, rep: R, unite: "%", tol: 0.01,
        etapes: [`\\(R(t) = e^{-(t/\\eta)^\\beta}\\).`, `\\((t/\\eta)^\\beta = (${M(t / eta, 3)})^{${M(b)}} = ${M((t / eta) ** b, 3)}\\)`, `\\(R = e^{-${M((t / eta) ** b, 3)}} = ${M(R, 3)}\\,\\%\\) — ${b < 1 ? "β < 1 : défaillances de jeunesse (déverminage utile)" : b > 1.2 ? "β > 1 : usure, la maintenance préventive a du sens" : "β ≈ 1 : défaillances aléatoires"}.`] };
    } }
];

export const genParId = Object.fromEntries(GENS.map(g => [g.id, g]));
