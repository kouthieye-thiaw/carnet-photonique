// Banque d'exercices : les 55 questions du TD (numéros Q1–Q55) et les exercices chiffrés des diapos du cours.
// Exercice chiffré : vars (valeurs du TD par défaut), text(v), solve(v) → { fields, steps }.
// Exercice à choix : items [{ q, opts, ok, why }] ; ok peut être une liste (plusieurs bonnes réponses).

const PARTS = [
  { id: "I", title: "Champs électrique et magnétique", short: "Champs E et B", range: "Q1–Q22",
    rappel: `<p>Une <b>tension</b> crée un champ <b>E</b> (V/m) : les lignes partent des charges + et arrivent sur les −, perpendiculaires aux conducteurs et aux équipotentielles. Dans un champ uniforme, <b>V<sub>B</sub> − V<sub>A</sub> = −E⃗·AB⃗</b>, et entre deux plaques <b>E = U/d</b>.</p>
<p>Un <b>courant</b> crée un champ <b>B</b> (T). Fil infini : <b>B = µ<sub>0</sub>I / 2πr</b>, sens donné par la main droite. Un flux qui varie à travers une boucle y crée une f.é.m. <b>e = −dΦ/dt</b> (Faraday), qui s'oppose à sa cause (Lenz). Φ = B·S·cos θ.</p>` },
  { id: "II", title: "Capacité et inductance", short: "C et L", range: "Q23–Q40",
    rappel: `<p>Deux conducteurs proches forment toujours un condensateur : <b>C = ε<sub>0</sub>ε<sub>r</sub>S / e</b> (plan), <b>|Z<sub>C</sub>| = 1 / 2πfC</b>. En HF la capacité parasite devient un court-circuit.</p>
<p>Méthode inductance : Ampère → B → flux Φ → <b>L = Φ / I</b>. Ordre de grandeur à savoir par cœur : <b>un fil, c'est environ 1 µH/m (10 nH/cm)</b>, même droit. Coaxial : L = (µ<sub>0</sub>/2π)·l·ln(b/a).</p>` },
  { id: "III", title: "Couplage par impédance commune", short: "Impédance commune", range: "Q41–Q47",
    rappel: `<p>Un conducteur partagé par deux circuits (masse, alimentation) a une tension à ses bornes <b>u = R·i + L·di/dt</b>, qui s'ajoute au signal de l'autre circuit. En continu seul R compte ; dès qu'il y a des fronts, <b>L·di/dt domine</b>.</p>
<p>Effet de peau : en HF le courant ne circule que sur l'épaisseur <b>δ = 1/√(πfµσ)</b>, donc R augmente comme √f.</p>` },
  { id: "IV", title: "Couplage capacitif", short: "Couplage capacitif", range: "Q48–Q54",
    rappel: `<p>Une piste dont la tension varie vite injecte dans sa voisine un courant <b>i = C·d(v − v<sub>s</sub>)/dt</b> à travers la capacité parasite. Ce courant traverse l'impédance R de la victime : plus R est grande, plus la tension parasite est grande.</p>
<p>Équation : <b>RC·dv<sub>s</sub>/dt + v<sub>s</sub> = RC·dv/dt</b>. Si RC ≪ t<sub>m</sub>, v<sub>s</sub> ≈ RC·dv/dt.</p>` },
  { id: "V", title: "Synthèse des couplages", short: "Synthèse", range: "Q55",
    rappel: `<p>Forte variation de <b>courant</b> près d'une boucle → <b>inductif</b>. Forte variation de <b>tension</b> près d'un conducteur, problème qui disparaît en mettant des conducteurs à la masse (écran) → <b>capacitif</b>. Conducteur <b>partagé</b> (masse, alim) → <b>impédance commune</b>.</p>` },
  { id: "C", title: "Exercices chiffrés du cours", short: "Exercices du cours", range: "diapos 68–148",
    rappel: `<p>Ces calculs sont posés dans les diapos sans être tous corrigés. Ce sont les ordres de grandeur que l'examen aime : temps de montée et bande passante, fente dans le plan de masse, découplage, blindage, câble blindé.</p>` },
];

const EXOS = [
  // ───────── I.1 ─────────
  { id: "q1", part: "I", q: "Q1–Q2", title: "Sens et densité des lignes de champ E", kind: "qcm",
    items: [
      { q: "Les lignes de champ électrique vont toujours des charges…", opts: ["positives vers les charges négatives", "négatives vers les charges positives"], ok: 0, why: "Le champ « fuit » une charge + et « pointe vers » une charge −." },
      { q: "Le nombre de lignes qui partent d'une charge est proportionnel à la grandeur de la charge.", opts: ["Vrai", "Faux"], ok: 0, why: "Une charge deux fois plus grande émet deux fois plus de lignes : son champ est deux fois plus intense." },
    ],
    retenir: "Plus les lignes sont serrées, plus le champ est intense. Elles ne se croisent jamais.",
    pro: "Sur un PCB, la densité de lignes se voit aux bords des pistes (effet de bord, diapo 120) : c'est là que la capacité parasite « porte » le plus loin. D'où la règle : pistes sensibles au centre de la carte, jamais en bordure." },
  { id: "q3", part: "I", q: "Q3", title: "Repérer les schémas de lignes incorrects", kind: "qcm",
    intro: "Les sept schémas du TD, décrits en mots. Coche tous ceux qui sont <b>incorrects</b>.",
    items: [
      { q: "Schémas incorrects :", opts: ["(a) charge + avec des lignes sortantes, symétriques", "(b) charge − avec des lignes sortantes", "(c) charge + isolée avec plus de lignes d'un côté", "(d) charge + avec des lignes entrantes", "(e) charge − avec des lignes entrantes, symétriques", "(f) deux charges dont les lignes se croisent", "(g) +5 µC et −5 µC, lignes allant de + vers −"], ok: [1, 2, 3, 5],
        why: "(b) et (d) : sens inversé. (c) : une charge ponctuelle isolée a un champ symétrique. (f) : en un point le champ n'a qu'une direction, deux lignes ne peuvent pas se croiser." },
    ],
    retenir: "Trois tests suffisent : le sens (+ vers −), la symétrie d'une charge isolée, aucune ligne ne se croise." },
  { id: "q4", part: "I", q: "Q4", title: "Direction de E par les symétries", kind: "qcm",
    intro: "Méthode : (1) les plans de symétrie passant par M donnent la direction ; (2) charges + : E s'éloigne, charges − : E pointe vers elles.",
    items: [
      { q: "Segment chargé +, M sur la médiatrice", opts: ["perpendiculaire au segment, en s'éloignant", "parallèle au segment", "perpendiculaire, vers le segment"], ok: 0, why: "Les composantes parallèles des deux moitiés s'annulent." },
      { q: "Sphère Q > 0, M à l'extérieur", opts: ["radial, en s'éloignant de la sphère", "tangent à la sphère", "radial, vers la sphère"], ok: 0 },
      { q: "Demi-cercle Q < 0, M sur l'axe de symétrie", opts: ["le long de l'axe, vers l'arc", "le long de l'axe, en s'éloignant de l'arc", "perpendiculaire à l'axe"], ok: 0, why: "Charges négatives : E pointe vers elles." },
      { q: "Cylindre Q > 0, M sur l'axe Δ", opts: ["le long de Δ, en s'éloignant du cylindre", "perpendiculaire à Δ", "nul"], ok: 0 },
      { q: "Fil Q < 0, M à la distance r", opts: ["perpendiculaire au fil, vers le fil", "perpendiculaire au fil, en s'éloignant", "parallèle au fil"], ok: 0 },
      { q: "Plan chargé +, M à la distance a", opts: ["perpendiculaire au plan, en s'éloignant", "parallèle au plan", "perpendiculaire, vers le plan"], ok: 0 },
    ],
    retenir: "Intersection de deux plans de symétrie passant par M = une droite = la direction de E. Le signe des charges donne le sens." },
  { id: "q5", part: "I", q: "Q5", title: "Champs autour de deux pistes au-dessus d'un plan de masse", kind: "qcm",
    items: [
      { q: "Pistes à +5 V et −5 V (aucun courant indiqué) : on dessine…", opts: ["des lignes de champ E", "des lignes de champ B"], ok: 0, why: "Une tension crée un champ E : lignes de M (+5 V) vers N (−5 V) et vers la masse (0 V), perpendiculaires aux conducteurs." },
      { q: "Pistes parcourues par +1 A et −1 A : on dessine…", opts: ["des lignes de champ E", "des lignes de champ B"], ok: 1, why: "Un courant crée un champ B : boucles fermées autour de chaque piste." },
      { q: "Avec ±1 A, entre les deux pistes, les champs B…", opts: ["s'additionnent", "se compensent"], ok: 0 },
      { q: "Avec ±1 A, loin des deux pistes, les champs B…", opts: ["s'additionnent", "se compensent"], ok: 1 },
    ],
    retenir: "Tension → champ E → risque de couplage capacitif. Courant → champ B → risque de couplage inductif.",
    pro: "C'est pour ça qu'on route l'aller et le retour d'un signal côte à côte, ou une piste au-dessus d'un plan de masse : loin des pistes, les champs B se compensent et la carte rayonne peu (diapo 136)." },

  // ───────── I.2 – I.3 ─────────
  { id: "q6", part: "I", q: "Q6", title: "Tension de claquage d'une bougie d'allumage", kind: "num",
    vars: { d: { v: 0.1, min: 0.03, max: 0.3, step: 0.01, u: "cm", label: "écart des électrodes" }, E: { v: 3, min: 1, max: 10, step: 0.5, u: "MV/m", label: "champ disruptif" } },
    text: (v) => `Les électrodes d'une bougie sont distantes de ${fr(v.d)} cm. L'air s'ionise quand le champ atteint ${fr(v.E)} MV/m. Champ supposé uniforme : quelle tension faut-il pour l'étincelle ?`,
    solve: (v) => {
      const U = v.E * 1e6 * v.d * 1e-2;
      return { fields: [{ label: "U", value: U / 1e3, unit: "kV" }],
        steps: [`Champ uniforme entre deux électrodes : <b>U = E × d</b>.`, `U = ${fr(v.E)}·10⁶ V/m × ${fr(v.d * 1e-2)} m = <b>${eng(U, "V")}</b>.`] };
    },
    hint: "Pense à convertir les cm en m. Entre deux plaques, E = U/d.",
    retenir: "L'air claque vers 3 kV/mm. C'est la base des distances d'isolement.",
    pro: "En bureau d'études, c'est ce calcul qui fixe l'écart minimum entre une piste haute tension et une piste basse tension. Et à l'ouverture d'un relais, l'écart entre contacts est d'abord minuscule : quelques volts suffisent à faire claquer l'air, d'où les rafales d'étincelles de la diapo 78 et le module antiparasite (diode, varistance, RC)." },
  { id: "q7", part: "I", q: "Q7", title: "Champ entre deux plaques parallèles", kind: "qcm",
    items: [
      { q: "Les lignes de champ entre les plaques sont…", opts: ["des droites parallèles, perpendiculaires aux plaques, de + vers −", "des cercles autour des plaques", "des droites radiales depuis le centre"], ok: 0 },
      { q: "Le champ entre les plaques est…", opts: ["uniforme, E = U/d", "nul", "plus fort au centre qu'aux bords"], ok: 0 },
      { q: "En un point A entre les plaques, le vecteur E est…", opts: ["perpendiculaire aux plaques, vers la plaque −", "parallèle aux plaques", "vers la plaque +"], ok: 0 },
    ],
    retenir: "C'est le modèle du condensateur plan, qu'on retrouve partout : piste au-dessus d'un plan de masse, carte au-dessus d'un boîtier." },
  { id: "q8", part: "I", q: "Q8", title: "Le champ électrique de beau temps", kind: "num",
    vars: { E: { v: 100, min: 50, max: 300, step: 10, u: "V/m", label: "champ au sol" }, h: { v: 1.8, min: 1.5, max: 2, step: 0.05, u: "m", label: "taille" } },
    text: (v) => `Champ vertical vers le bas de ${fr(v.E)} V/m au sol. (a) Rapport force électrique / poids pour un électron (q = 1,609·10⁻¹⁹ C, m = 9,11·10⁻³¹ kg). (b) Différence de potentiel entre les pieds et la tête d'une personne de ${fr(v.h)} m.`,
    solve: (v) => {
      const Fe = 1.609e-19 * v.E, P = 9.11e-31 * 9.81;
      return { fields: [{ label: "Fe / P", value: Fe / P, unit: "" }, { label: "U debout", value: v.E * v.h, unit: "V" }],
        steps: [`F<sub>e</sub> = |q|·E = 1,609·10⁻¹⁹ × ${fr(v.E)} = ${sci(Fe)} N, <b>vers le haut</b> (q < 0, force opposée à E).`, `P = m·g = 9,11·10⁻³¹ × 9,81 = ${sci(P)} N, vers le bas.`, `F<sub>e</sub>/P = <b>${sci(Fe / P)}</b> : la gravité est négligeable pour un électron.`, `E vers le bas : le potentiel monte avec l'altitude. U = E × h = <b>${fr(v.E * v.h)} V</b>. Couchée, tout le corps est à la même hauteur : U ≈ 0.`] };
    },
    hint: "Pour le (b), U = E × h car le champ est uniforme et parallèle au déplacement.",
    retenir: "En électronique, on ne compte jamais le poids des charges : seules les forces électriques comptent.",
    pro: "180 V entre tête et pieds et on ne sent rien : le courant disponible est infime et le corps, conducteur, déforme le champ. En CEM c'est la même idée que le corps humain chargé de la diapo 118 : 150–300 pF par rapport à la terre, ce qui suffit pour une décharge électrostatique de plusieurs kV sur un connecteur." },
  { id: "q9", part: "I", q: "Q9", title: "Différences de potentiel dans un champ uniforme", kind: "num",
    vars: { E: { v: 200, min: 50, max: 500, step: 10, u: "V/m", label: "champ" }, d: { v: 5, min: 1, max: 10, step: 0.5, u: "cm", label: "AB" }, e: { v: 3, min: 1, max: 6, step: 0.5, u: "cm", label: "BC (vertical)" }, a: { v: 30, min: 0, max: 60, step: 5, u: "°", label: "inclinaison (iv)" } },
    text: (v) => `E⃗ = ${fr(v.E)} i⃗ V/m uniforme. A et B sont distants de d = ${fr(v.d)} cm le long du champ, C est ${fr(v.e)} cm sous B. Calcule V<sub>B</sub> − V<sub>A</sub> et V<sub>C</sub> − V<sub>A</sub>, puis les mêmes quand les lignes sont inclinées de ${fr(v.a)}° (vers la droite et le bas).`,
    solve: (v) => {
      const d = v.d / 100, e = v.e / 100, a = (v.a * Math.PI) / 180;
      const ba = -v.E * d, ca = -v.E * d, ba2 = -v.E * d * Math.cos(a), ca2 = -v.E * (d * Math.cos(a) + e * Math.sin(a));
      return { fields: [{ label: "VB − VA", value: ba, unit: "V" }, { label: "VC − VA", value: ca, unit: "V" }, { label: "VB − VA incliné", value: ba2, unit: "V" }, { label: "VC − VA incliné", value: ca2, unit: "V" }],
        steps: [`Formule : <b>V<sub>B</sub> − V<sub>A</sub> = −E⃗·AB⃗</b>. On descend le long du champ, le potentiel diminue.`, `V<sub>B</sub> − V<sub>A</sub> = −${fr(v.E)} × ${fr(d)} = <b>${fr(ba)} V</b>.`, `C est à la verticale de B, donc sur la même équipotentielle (droite verticale) : V<sub>C</sub> − V<sub>A</sub> = <b>${fr(ca)} V</b>.`, `Incliné : E⃗ = E(cos α i⃗ − sin α j⃗). V<sub>B</sub> − V<sub>A</sub> = −E·d·cos α = <b>${fr(ba2)} V</b>.`, `AC⃗ = d i⃗ − e j⃗ : V<sub>C</sub> − V<sub>A</sub> = −E(d cos α + e sin α) = <b>${fr(ca2)} V</b>. Seule la composante du déplacement parallèle au champ compte.`] };
    },
    hint: "Produit scalaire : seule la projection du déplacement sur E compte. Un déplacement perpendiculaire au champ ne change pas le potentiel.",
    retenir: "Équipotentielles ⊥ lignes de champ. Le champ va des potentiels hauts vers les bas." },

  // ───────── I.4 ─────────
  { id: "q10", part: "I", q: "Q10–Q12", title: "Sens de B : la main droite", kind: "qcm",
    items: [
      { q: "Cas A, fil vertical, courant vers le haut. En M1 (à gauche du fil), B…", opts: ["sort de la feuille ⊙", "entre dans la feuille ⊗", "est nul"], ok: 0, why: "Pouce vers le haut, les doigts sortent de la feuille à gauche et y entrent à droite." },
      { q: "Cas C, deux fils parallèles, courants vers le haut. En M2, entre les fils, plus près du premier…", opts: ["⊗, intensité réduite", "⊙, intensité doublée", "nul"], ok: 0, why: "Les deux champs sont opposés entre les fils ; le fil le plus proche l'emporte." },
      { q: "Cas D, deux fils très proches, courants opposés (aller et retour). Loin des fils, B…", opts: ["≈ 0", "est doublé", "est égal à celui d'un seul fil"], ok: 0, why: "Les deux champs sont presque égaux et opposés." },
      { q: "Q11 : vu depuis le côté où pointe B, le courant d'une spire tourne…", opts: ["dans le sens anti-horaire (trigonométrique)", "dans le sens horaire"], ok: 0 },
      { q: "Q12 : fil avec deux dérivations en demi-cercle entre C et D. En M sur CD, B…", opts: ["est nul", "vaut µ0I/2πr", "est doublé"], ok: 0, why: "Chaque demi-cercle porte I/2 et crée en M un champ de même valeur et de sens opposé. Les portions rectilignes ne créent rien sur leur propre axe." },
    ],
    retenir: "Cas D = la règle d'or de la CEM : l'aller et le retour côte à côte, les champs se compensent.",
    pro: "Paire torsadée (Ethernet, RS-485, CAN), câble coaxial, piste au-dessus de son plan de masse : c'est toujours le cas D. Une alimentation dont le fil + et le fil 0 V partent chacun de leur côté forme une grande boucle qui rayonne et capte." },
  { id: "q13", part: "I", q: "Q13", title: "Induction créée par un câble", kind: "num",
    vars: { I: { v: 50, min: 1, max: 1000, step: 1, u: "mA", label: "courant" }, r: { v: 50, min: 5, max: 200, step: 5, u: "cm", label: "distance" }, f: { v: 500, min: 1, max: 2000, step: 1, u: "MHz", label: "fréquence (alternatif)" } },
    text: (v) => `Un câble rectiligne est parcouru par ${fr(v.I)} mA. Quelle induction à ${fr(v.r)} cm ? Même question à ${fr(v.f)} MHz avec ${fr(v.I)} mA crête : écris B(t). Quelle est la longueur d'onde ?`,
    solve: (v) => {
      const B = (MU0 * v.I * 1e-3) / (2 * Math.PI * v.r * 1e-2), lam = C0 / (v.f * 1e6);
      return { fields: [{ label: "B", value: B * 1e9, unit: "nT" }, { label: "λ", value: lam * 100, unit: "cm" }],
        steps: [`Fil infini (Ampère) : <b>B = µ<sub>0</sub>I / 2πr</b> = 4π·10⁻⁷ × ${fr(v.I * 1e-3)} / (2π × ${fr(v.r / 100)}) = <b>${eng(B, "T")}</b>.`, `En alternatif, la même formule à chaque instant : <b>B(t) = ${sci(B)} cos(2π × ${sci(v.f * 1e6)} t)</b> T.`, `λ = c/f = <b>${fr(lam * 100)} cm</b>. ${lam < v.r / 100 * 2 ? "La distance est du même ordre que λ : on sort de l'approximation basse fréquence, le résultat n'est qu'un ordre de grandeur." : "La distance reste petite devant λ : l'approximation quasi-statique tient."}`] };
    },
    retenir: "µ0/2π = 2·10⁻⁷ : B = 2·10⁻⁷ × I / r. À retenir pour aller vite." },
  // ───────── I.5 ─────────
  { id: "q14", part: "I", q: "Q14–Q17", title: "Faraday et Lenz", kind: "qcm",
    items: [
      { q: "Q14 : boucle immobile dans le champ d'un aimant permanent. Le voltmètre indique…", opts: ["0", "une tension continue", "une tension alternative"], ok: 0, why: "Flux constant, dΦ/dt = 0, donc e = 0." },
      { q: "Q15 : spire près d'une bobine alimentée en sinusoïdal. Le voltmètre (AC) indique…", opts: ["une valeur efficace non nulle", "0"], ok: 0, why: "B(t) variable → flux variable → f.é.m. alternative. C'est le transformateur, et c'est le couplage inductif." },
      { q: "Q16 : deux surfaces identiques, l'une ⊥ à B, l'autre dont la normale fait π/3 avec B. Φa/Φb vaut…", opts: ["2", "1/2", "√3/2"], ok: 0, why: "Φb = BS·cos(π/3) = BS/2." },
      { q: "Q17 : on retire le cadre de l'entrefer de l'aimant. Le flux…", opts: ["diminue", "augmente"], ok: 0 },
      { q: "…donc le courant induit crée, dans le cadre, un champ…", opts: ["dans le même sens que B (il compense la baisse)", "opposé à B"], ok: 0, why: "Lenz : le courant induit s'oppose à la variation de flux." },
    ],
    retenir: "Pas de variation, pas de perturbation : seuls les champs qui varient couplent par induction." },
  { id: "q18", part: "I", q: "Q18", title: "Courant induit dans une spire", kind: "num",
    vars: { S: { v: 100, min: 10, max: 500, step: 10, u: "cm²", label: "surface" }, B0: { v: 0.5, min: 0, max: 2, step: 0.1, u: "T", label: "B initial" }, B1: { v: 2.5, min: 0.5, max: 5, step: 0.1, u: "T", label: "B final" }, t: { v: 1.5, min: 0.1, max: 5, step: 0.1, u: "s", label: "durée" }, R: { v: 4, min: 0.5, max: 20, step: 0.5, u: "Ω", label: "résistance" } },
    text: (v) => `Une spire de ${fr(v.S)} cm² est perpendiculaire à un B qui passe uniformément de ${fr(v.B0)} T à ${fr(v.B1)} T en ${fr(v.t)} s. Sa résistance vaut ${fr(v.R)} Ω. Quel courant induit ?`,
    solve: (v) => {
      const e = (v.S * 1e-4 * (v.B1 - v.B0)) / v.t, i = e / v.R;
      return { fields: [{ label: "|e|", value: e * 1e3, unit: "mV" }, { label: "i", value: i * 1e3, unit: "mA" }],
        steps: [`S = ${fr(v.S)} cm² = ${sci(v.S * 1e-4)} m². dB/dt = (${fr(v.B1)} − ${fr(v.B0)}) / ${fr(v.t)} = ${fr((v.B1 - v.B0) / v.t)} T/s.`, `|e| = S·dB/dt = <b>${eng(e, "V")}</b>.`, `i = |e| / R = <b>${eng(i, "A")}</b>.`] };
    },
    hint: "e = −dΦ/dt avec Φ = B·S. N'oublie pas cm² → m² (× 10⁻⁴).",
    retenir: "La f.é.m. est proportionnelle à la surface et à la vitesse de variation." },
  { id: "q19", part: "I", q: "Q19", title: "Boucle près d'un câble à 500 MHz", kind: "num", lab: "inductif",
    vars: { r: { v: 5, min: 1, max: 15, step: 0.5, u: "cm", label: "rayon de la boucle" }, d: { v: 50, min: 10, max: 200, step: 5, u: "cm", label: "distance au câble" }, I: { v: 50, min: 1, max: 500, step: 1, u: "mA", label: "courant crête" }, f: { v: 500, min: 1, max: 1000, step: 1, u: "MHz", label: "fréquence" } },
    text: (v) => `Une boucle de rayon ${fr(v.r)} cm est posée à ${fr(v.d)} cm d'un câble parcouru par ${fr(v.I)} mA crête à ${fr(v.f)} MHz. Donne l'amplitude de la f.é.m. induite.`,
    solve: (v) => {
      const B = (2e-7 * v.I * 1e-3) / (v.d / 100), w = 2 * Math.PI * v.f * 1e6, e = B * Math.PI * (v.r / 100) ** 2 * w;
      return { fields: [{ label: "amplitude e", value: e, unit: "V" }],
        steps: [`Boucle petite devant la distance : B uniforme sur la boucle, B(t) = (µ<sub>0</sub>I<sub>0</sub>/2πd) cos ωt = ${eng(B, "T")} × cos ωt.`, `Φ(t) = B(t)·πr² donc <b>e(t) = −dΦ/dt = (µ<sub>0</sub>I<sub>0</sub>/2πd)·πr²·ω·sin ωt</b>.`, `Amplitude : ${sci(B)} × π × ${fr(v.r / 100)}² × 2π × ${sci(v.f * 1e6)} = <b>${eng(e, "V")}</b>.`, `Un champ de ${eng(B, "T")} induit ${eng(e, "V")} : c'est ω, énorme, qui rend le couplage efficace.`] };
    },
    retenir: "La f.é.m. croît avec la fréquence : un même courant perturbe 1000 fois plus à 500 MHz qu'à 500 kHz.",
    pro: "C'est le principe de la sonde de champ proche (une petite boucle au bout d'un coax) qu'on promène au-dessus d'une carte en pré-qualification CEM pour trouver la piste qui rayonne avant d'aller en chambre anéchoïque." },
  { id: "q20", part: "I", q: "Q20", title: "Boucle de masse coax / chemin de câble", kind: "num", lab: "inductif",
    vars: { dI: { v: 20, min: 1, max: 100, step: 1, u: "A", label: "saut de courant" }, tm: { v: 1, min: 0.1, max: 10, step: 0.1, u: "µs", label: "temps de montée" }, d: { v: 50, min: 10, max: 200, step: 5, u: "cm", label: "distance" }, l: { v: 2, min: 0.5, max: 10, step: 0.5, u: "m", label: "longueur du coax" }, hh: { v: 10, min: 1, max: 50, step: 1, u: "cm", label: "hauteur au-dessus du chemin de câble" } },
    text: (v) => `Un câble d'alimentation commute de 0 à ${fr(v.dI)} A en ${fr(v.tm)} µs, à ${fr(v.d)} cm au-dessus d'un coax de ${fr(v.l)} m posé à ${fr(v.hh)} cm d'un chemin de câble à la masse. La tresse est reliée au chemin de câble à un bout : quelle f.é.m. pic à l'autre bout ?`,
    solve: (v) => {
      const S = v.l * v.hh / 100, d = v.d / 100, e = ((2e-7 / d) * S * v.dI) / (v.tm * 1e-6);
      const ex = 2e-7 * v.l * Math.log((d + v.hh / 100) / d) * v.dI / (v.tm * 1e-6);
      return { fields: [{ label: "|e| (B uniforme)", value: e, unit: "V" }],
        steps: [`Boucle = tresse + chemin de câble : S = ${fr(v.l)} × ${fr(v.hh / 100)} = ${fr(S)} m².`, `B uniforme pris à d : <b>|e| = (µ<sub>0</sub>/2πd)·S·ΔI/Δt</b> = (2·10⁻⁷/${fr(d)}) × ${fr(S)} × ${fr(v.dI)}/${sci(v.tm * 1e-6)} = <b>${fr(e)} V</b>.`, `Calcul exact en intégrant B de d à d + h : (µ<sub>0</sub>l/2π)·ln((d+h)/d)·ΔI/Δt = ${fr(ex)} V. Même ordre de grandeur : l'approximation suffit.`] };
    },
    retenir: "Réponse du TD : 1,6 V. Une boucle de masse est une antenne magnétique.",
    pro: "En installation industrielle, cette boucle apparaît dès qu'une tresse est raccordée à la masse à deux endroits par des chemins différents. La parade : le coax posé dans un chemin de câble métallique continu, au fond, contre la tôle (diapos 151–152) : la surface de boucle devient quasi nulle." },
  { id: "q21", part: "I", q: "Q21", title: "F.é.m. entre âme et tresse d'un coax MRG5800", kind: "num", lab: "inductif",
    vars: { dI: { v: 20, min: 1, max: 100, step: 1, u: "A", label: "saut de courant" }, tm: { v: 1, min: 0.1, max: 10, step: 0.1, u: "µs", label: "temps de montée" }, d: { v: 1, min: 0.3, max: 20, step: 0.1, u: "cm", label: "distance" }, l: { v: 2, min: 0.5, max: 10, step: 0.5, u: "m", label: "longueur" } },
    text: (v) => `Même câble d'alimentation (0 → ${fr(v.dI)} A en ${fr(v.tm)} µs), cette fois à ${fr(v.d)} cm d'un coax MRG5800 de ${fr(v.l)} m (âme Ø 0,91 mm, isolant Ø 2,95 mm). F.é.m. pic entre âme et tresse ?`,
    solve: (v) => {
      const S = v.l * (1.475e-3 - 0.455e-3), e = ((2e-7 / (v.d / 100)) * S * v.dI) / (v.tm * 1e-6);
      return { fields: [{ label: "|e|", value: e, unit: "V" }],
        steps: [`La « boucle » est la surface entre l'âme et la tresse : largeur b − a = 1,475 − 0,455 = 1,02 mm, donc S = ${fr(v.l)} × 1,02·10⁻³ = ${sci(S)} m².`, `|e| = (2·10⁻⁷/${fr(v.d / 100)}) × ${sci(S)} × ${fr(v.dI)}/${sci(v.tm * 1e-6)} = <b>${fr(e)} V</b>.`, `Surface 100 fois plus petite qu'en Q20, mais câble 50 fois plus près : la perturbation reste du même ordre.`] };
    },
    retenir: "Réponse du TD : 0,8 V. La distance compte autant que la surface (B en 1/d).",
    pro: "Règle de câblage d'armoire : séparer physiquement les câbles de puissance (variateurs, contacteurs) et les câbles de mesure, au moins 20–30 cm, ou dans des chemins de câble distincts. Les croisements se font à 90°." },
  { id: "q22", part: "I", q: "Q22", title: "La box ADSL d'Anna et la foudre", kind: "num", lab: "inductif",
    vars: { I: { v: 500, min: 10, max: 500, step: 10, u: "kA", label: "courant de foudre" }, tm: { v: 100, min: 1, max: 200, step: 1, u: "µs", label: "temps de montée" }, D: { v: 2, min: 0.1, max: 10, step: 0.1, u: "km", label: "distance" }, a: { v: 10, min: 1, max: 30, step: 1, u: "m", label: "largeur façade" }, b: { v: 5, min: 1, max: 15, step: 1, u: "m", label: "hauteur façade" } },
    text: (v) => `Un éclair de ${fr(v.I)} kA (montée en ${fr(v.tm)} µs) tombe à ${fr(v.D)} km. Les réseaux électrique et télécom se séparent sur une façade de ${fr(v.a)} m × ${fr(v.b)} m et se rejoignent à la box. Tension induite entre les deux masses ?`,
    solve: (v) => {
      const dBdt = ((2e-7 / (v.D * 1e3)) * v.I * 1e3) / (v.tm * 1e-6), S = v.a * v.b, e = S * dBdt;
      return { fields: [{ label: "dB/dt", value: dBdt, unit: "T/s" }, { label: "|e|", value: e, unit: "V" }],
        steps: [`dB/dt = (µ<sub>0</sub>/2πD)·dI/dt = (2·10⁻⁷/${fr(v.D * 1e3)}) × ${sci(v.I * 1e3)}/${sci(v.tm * 1e-6)} = <b>${fr(dBdt)} T/s</b>.`, `Boucle de la façade : S = ${fr(v.a)} × ${fr(v.b)} = ${fr(S)} m².`, `|e| = S·dB/dt = <b>${fr(e)} V</b>, +${fr(e)} V pendant la montée puis −${fr(e)} V à la descente.`, `Les entrées d'une box supportent quelques volts : ${e > 5 ? "oui, cela explique la panne." : "ici, la box a des chances de survivre."}`] };
    },
    retenir: "Réponse du TD : 25 V. Contre l'inductif : réduire la boucle, s'éloigner, ralentir les fronts.",
    pro: "C'est exactement pourquoi un installateur fait entrer l'énergie et les télécoms dans le bâtiment au même endroit (une seule « porte » avec une barre d'équipotentialité) et pose des parafoudres. Un poste de garde, un relais GSM ou une station de pompage en site isolé sont traités de cette façon." },

  // ───────── II.1 ─────────
  { id: "q23", part: "II", q: "Q23–Q25", title: "Condensateur plan", kind: "num",
    vars: { Q: { v: 1, min: 0.1, max: 10, step: 0.1, u: "nC", label: "charge" }, L: { v: 2, min: 0.5, max: 10, step: 0.5, u: "cm", label: "longueur" }, b: { v: 1, min: 0.5, max: 10, step: 0.5, u: "cm", label: "largeur" }, e: { v: 0.1, min: 0.02, max: 2, step: 0.01, u: "mm", label: "épaisseur" } },
    text: (v) => `Deux plans de ${fr(v.L)} cm × ${fr(v.b)} cm portent ±${fr(v.Q)} nC, séparés de ${fr(v.e)} mm. Calcule σ, U et C<sub>0</sub>.`,
    solve: (v) => {
      const S = (v.L / 100) * (v.b / 100), sig = (v.Q * 1e-9) / S, U = (sig / EPS0) * v.e * 1e-3, C = (v.Q * 1e-9) / U;
      return { fields: [{ label: "σ", value: sig * 1e6, unit: "µC/m²" }, { label: "U", value: U, unit: "V" }, { label: "C0", value: C * 1e12, unit: "pF" }],
        steps: [`σ = Q / (b·L) = ${sci(v.Q * 1e-9)} / ${sci(S)} = <b>${sci(sig)} C/m²</b>.`, `U = σ·e/ε<sub>0</sub> = Q·e / (ε<sub>0</sub>·b·L) = <b>${fr(U)} V</b>.`, `C<sub>0</sub> = Q/U = <b>ε<sub>0</sub>·b·L / e</b> = <b>${eng(C, "F")}</b>.`] };
    },
    retenir: "C = ε0·S/e : grande surface, faible épaisseur = grosse capacité. ε0 ≈ 8,85 pF/m." },
  { id: "q26", part: "II", q: "Q26", title: "Carte sur entretoises et boîtier métallique", kind: "num",
    vars: { a: { v: 5, min: 2, max: 30, step: 1, u: "cm", label: "largeur carte" }, b: { v: 10, min: 2, max: 30, step: 1, u: "cm", label: "longueur carte" }, e: { v: 5, min: 1, max: 20, step: 0.5, u: "mm", label: "entretoises" }, f: { v: 2000, min: 1, max: 5000, step: 1, u: "MHz", label: "fréquence" } },
    text: (v) => `Une carte de ${fr(v.a)} × ${fr(v.b)} cm est fixée par des entretoises isolantes de ${fr(v.e)} mm dans un boîtier métallique. Elle porte des oscillateurs à ${fr(v.f)} MHz. Impédance entre son plan de masse et le boîtier ?`,
    solve: (v) => {
      const C = (EPS0 * (v.a / 100) * (v.b / 100)) / (v.e / 1000), Z = 1 / (2 * Math.PI * v.f * 1e6 * C);
      return { fields: [{ label: "C", value: C * 1e12, unit: "pF" }, { label: "|Z|", value: Z, unit: "Ω" }],
        steps: [`Condensateur plan à air : C = ε<sub>0</sub>·S/e = 8,85·10⁻¹² × ${fr(v.a / 100)} × ${fr(v.b / 100)} / ${fr(v.e / 1000)} = <b>${eng(C, "F")}</b>.`, `<b>|Z| = 1 / 2πfC</b> = 1 / (2π × ${sci(v.f * 1e6)} × ${sci(C)}) = <b>${eng(Z, "Ω")}</b>.`, `${Z < 50 ? "La carte n'est pas isolée du boîtier en HF : c'est un très bon chemin pour les courants de mode commun." : "À cette fréquence l'impédance reste élevée."}`] };
    },
    retenir: "Réponse du TD : 8,85 pF et 9 Ω. « Isolé » en continu ne veut rien dire en HF.",
    pro: "Conséquence de conception : comme le courant HF passe de toute façon vers le boîtier, autant lui offrir un chemin maîtrisé. On visse le 0 V au châssis par des entretoises métalliques aux coins de la carte, côté numérique (diapo 119), plutôt que de laisser le courant choisir son chemin via les câbles." },
  { id: "q27", part: "II", q: "Q27–Q28", title: "Capacité d'une ligne bifilaire : la formule", kind: "qcm",
    items: [
      { q: "Avec V(x) = (λ/2πε0)·ln((d/2 + x)/(d/2 − x)) + V0, la tension entre les fils vaut…", opts: ["U = (λ/πε0)·ln((d − R)/R)", "U = (λ/2πε0)·ln(d/R)", "U = λ·d/ε0"], ok: 0, why: "On évalue V en x_A = −(d/2 − R) et x_B = d/2 − R, puis U = V_A − V_B : les deux logarithmes s'ajoutent." },
      { q: "Sur une longueur l (charge Q = λl), la capacité vaut…", opts: ["C = πε0εr·l / ln((d − R)/R)", "C = 2πε0εr·l / ln(b/a)", "C = ε0εr·S/e"], ok: 0, why: "La 2e est celle du coaxial, la 3e celle du condensateur plan." },
    ] },
  { id: "q29", part: "II", q: "Q29–Q30", title: "Capacité d'un câble 2 × 1,5 mm²", kind: "num",
    vars: { s: { v: 1.5, min: 0.5, max: 6, step: 0.25, u: "mm²", label: "section" }, d: { v: 2, min: 1.6, max: 10, step: 0.1, u: "mm", label: "entraxe" }, er: { v: 4, min: 1, max: 6, step: 0.1, u: "", label: "εr" }, l: { v: 2, min: 0.5, max: 20, step: 0.5, u: "m", label: "longueur" }, f: { v: 300, min: 1, max: 1000, step: 1, u: "MHz", label: "fréquence" } },
    text: (v) => `${fr(v.l)} m de câble 2 × ${fr(v.s)} mm², entraxe ${fr(v.d)} mm, isolant ε<sub>r</sub> = ${fr(v.er)}. Capacité entre les conducteurs, puis impédance à ${fr(v.f)} MHz.`,
    solve: (v) => {
      const R = Math.sqrt(v.s / Math.PI), ln = Math.log((v.d - R) / R), C = (Math.PI * EPS0 * v.er * v.l) / ln, Z = 1 / (2 * Math.PI * v.f * 1e6 * C);
      return { fields: [{ label: "C", value: C * 1e12, unit: "pF" }, { label: "|Z|", value: Z, unit: "Ω" }],
        steps: [`Rayon : πR² = ${fr(v.s)} mm² ⇒ R = ${fr(R)} mm. ln((d − R)/R) = ln(${fr(v.d - R)}/${fr(R)}) = ${fr(ln)}.`, `C = πε<sub>0</sub>ε<sub>r</sub>l / ln(…) = π × 8,85·10⁻¹² × ${fr(v.er)} × ${fr(v.l)} / ${fr(ln)} = <b>${eng(C, "F")}</b> (${eng(C / v.l, "F/m")}).`, `|Z| = 1/2πfC = <b>${eng(Z, "Ω")}</b> : à cette fréquence les deux conducteurs sont pratiquement court-circuités.`] };
    },
    retenir: "Réponse du TD : ≈ 350 pF et 1,5 Ω. Un câble « 2 fils » vaut environ 100–200 pF/m." },
  { id: "q31", part: "II", q: "Q31", title: "Capacité linéique du coax MRG5800", kind: "num",
    vars: { di: { v: 0.91, min: 0.3, max: 3, step: 0.01, u: "mm", label: "Ø âme" }, de: { v: 2.95, min: 1, max: 10, step: 0.05, u: "mm", label: "Ø sur isolant" }, er: { v: 2.3, min: 1, max: 4, step: 0.1, u: "", label: "εr (PE = 2,3)" } },
    text: (v) => `Coax : âme Ø ${fr(v.di)} mm, isolant Ø ${fr(v.de)} mm, ε<sub>r</sub> = ${fr(v.er)}. Capacité linéique ?`,
    solve: (v) => {
      const Cl = (2 * Math.PI * EPS0 * v.er) / Math.log(v.de / v.di);
      return { fields: [{ label: "C/L", value: Cl * 1e12, unit: "pF/m" }],
        steps: [`<b>C/L = 2πε<sub>0</sub>ε<sub>r</sub> / ln(R<sub>ext</sub>/R<sub>int</sub>)</b>, ln(${fr(v.de)}/${fr(v.di)}) = ${fr(Math.log(v.de / v.di))}.`, `C/L = 2π × 8,85·10⁻¹² × ${fr(v.er)} / ${fr(Math.log(v.de / v.di))} = <b>${fr(Cl * 1e12)} pF/m</b>. La datasheet annonce 100 pF/m : on la retrouve à 10 % près.`] };
    },
    retenir: "Coax 50 Ω : ≈ 100 pF/m et 0,25 µH/m." },
  // ───────── II.2 ─────────
  { id: "q32", part: "II", q: "Q32", title: "Inductance d'un solénoïde", kind: "num",
    vars: { l: { v: 30, min: 5, max: 100, step: 1, u: "cm", label: "longueur" }, D: { v: 5, min: 1, max: 20, step: 0.5, u: "cm", label: "diamètre" }, N: { v: 1105, min: 10, max: 3000, step: 5, u: "", label: "spires" } },
    text: (v) => `Solénoïde de ${fr(v.l)} cm, Ø ${fr(v.D)} cm, ${v.N} spires, B = µ<sub>0</sub>NI/l uniforme. Inductance ?`,
    solve: (v) => {
      const S = Math.PI * (v.D / 200) ** 2, L = (MU0 * v.N ** 2 * S) / (v.l / 100);
      return { fields: [{ label: "L", value: L * 1e3, unit: "mH" }],
        steps: [`Flux total : Φ = N·B·S = N·(µ<sub>0</sub>NI/l)·S, donc <b>L = µ<sub>0</sub>N²S / l</b>.`, `S = π × ${fr(v.D / 200)}² = ${sci(S)} m². L = 4π·10⁻⁷ × ${v.N}² × ${sci(S)} / ${fr(v.l / 100)} = <b>${eng(L, "H")}</b>.`] };
    },
    retenir: "L varie en N² : doubler les spires quadruple l'inductance (c'est aussi vrai pour une ferrite, diapo 159)." },
  { id: "q33", part: "II", q: "Q33", title: "Inductance d'un fil de masse", kind: "num", lab: "impedance",
    vars: { s: { v: 1.5, min: 0.5, max: 25, step: 0.5, u: "mm²", label: "section" }, l: { v: 5, min: 1, max: 100, step: 1, u: "cm", label: "longueur" } },
    text: (v) => `Fil de cuivre de ${fr(v.s)} mm² reliant deux plans de masse sur ${fr(v.l)} cm. Avec L = (µ<sub>0</sub>/2π)·l·(ln(2l/r) − 1 + µ<sub>r</sub>/4), calcule L.`,
    solve: (v) => {
      const r = Math.sqrt((v.s * 1e-6) / Math.PI), l = v.l / 100, L = 2e-7 * l * (Math.log((2 * l) / r) - 1 + 0.25);
      return { fields: [{ label: "L", value: L * 1e9, unit: "nH" }],
        steps: [`r = √(${fr(v.s)}/π) = ${fr(r * 1e3)} mm. 2l/r = ${fr((2 * l) / r)}, ln = ${fr(Math.log((2 * l) / r))}.`, `L = 2·10⁻⁷ × ${fr(l)} × (${fr(Math.log((2 * l) / r))} − 0,75) = <b>${eng(L, "H")}</b>.`, `Règle rapide : 10 nH/cm × ${fr(v.l)} cm = ${fr(10 * v.l)} nH. Cohérent.`] };
    },
    retenir: "Réponse du TD : 42 nH. La section change peu L (logarithme) : un gros fil reste inductif." },
  { id: "q34", part: "II", q: "Q34", title: "Feuillard large contre feuillard étroit", kind: "num", lab: "impedance",
    vars: { l: { v: 5, min: 1, max: 50, step: 1, u: "cm", label: "longueur" }, B1: { v: 30, min: 1, max: 100, step: 1, u: "mm", label: "largeur large" }, B2: { v: 1, min: 0.5, max: 10, step: 0.5, u: "mm", label: "largeur étroite" }, C: { v: 0.1, min: 0.05, max: 2, step: 0.05, u: "mm", label: "épaisseur" } },
    text: (v) => `Feuillard de cuivre de ${fr(v.l)} cm, épaisseur ${fr(v.C)} mm, reliant deux plans de masse. L ≈ (µ<sub>0</sub>/2π)·l·(ln(2l/(B+C)) − 1/2). Compare ${fr(v.B1)} mm et ${fr(v.B2)} mm de large.`,
    solve: (v) => {
      const l = v.l / 100, f = (B) => 2e-7 * l * (Math.log((2 * l) / ((B + v.C) / 1000)) + 0.5 - 1);
      const L1 = 2e-7 * l * (Math.log((2 * l) / ((v.B1 + v.C) / 1000)) - 0.5), L2 = 2e-7 * l * (Math.log((2 * l) / ((v.B2 + v.C) / 1000)) - 0.5);
      return { fields: [{ label: "L large", value: L1 * 1e9, unit: "nH" }, { label: "L étroit", value: L2 * 1e9, unit: "nH" }],
        steps: [`Large : B + C = ${fr(v.B1 + v.C)} mm, L = 2·10⁻⁷ × ${fr(l)} × (ln(${fr(2 * l)}/${fr((v.B1 + v.C) / 1000)}) − 0,5) = <b>${eng(L1, "H")}</b>.`, `Étroit : B + C = ${fr(v.B2 + v.C)} mm, L = <b>${eng(L2, "H")}</b>.`, `Rapport : ${fr(L2 / L1)}. La largeur fait baisser l'inductance.`] };
    },
    retenir: "Réponse du TD : 7 nH et 40 nH. Pour relier deux masses : large et court (rapport L/l < 5, diapo 92).",
    pro: "C'est pour ça que les tresses de masse plates (portes d'armoire, moteurs, chemins de câble) sont larges et courtes, et que le « fil vert-jaune » de 50 cm est une sécurité électrique, pas une masse HF." },
  { id: "q35", part: "II", q: "Q35–Q37 · Q39", title: "Inductance du coaxial et du tore : le raisonnement", kind: "qcm",
    items: [
      { q: "Q35 : entre l'âme et la tresse (a < x < b), Ampère donne…", opts: ["B = µ0I / 2πx", "B = 0", "B = µ0NI / l"], ok: 0, why: "Seul le courant de l'âme est enlacé." },
      { q: "À l'extérieur du coax (x > b), B vaut…", opts: ["0", "µ0I / 2πx", "µ0I / πx"], ok: 0, why: "Le courant enlacé est I − I = 0 : un coax bien utilisé ne rayonne pas de champ magnétique." },
      { q: "Q36–Q37 : le flux sur une longueur l entre a et b donne…", opts: ["L = (µ0/2π)·l·ln(b/a)", "L = µ0N²S/l", "L = µ0·l·b/a"], ok: 0 },
      { q: "Q39 : un tore de N spires, section rectangulaire h, de a à b, donne…", opts: ["L = (µrµ0N²h/2π)·ln(b/a)", "L = µrµ0N·h·(b − a)", "L = µ0N²/2πr"], ok: 0, why: "Flux dans une spire : ∫ µrµ0NI/(2πr)·h dr de a à b, puis × N spires." },
    ] },
  { id: "q38", part: "II", q: "Q38", title: "Inductance linéique et impédance du MRG5800", kind: "num",
    vars: { a: { v: 0.455, min: 0.1, max: 2, step: 0.005, u: "mm", label: "rayon âme" }, b: { v: 1.475, min: 0.5, max: 5, step: 0.005, u: "mm", label: "rayon isolant" }, er: { v: 2.3, min: 1, max: 4, step: 0.1, u: "", label: "εr" } },
    text: (v) => `Coax de rayons a = ${fr(v.a)} mm et b = ${fr(v.b)} mm, ε<sub>r</sub> = ${fr(v.er)}. Inductance linéique ? Vérifie Z<sub>c</sub> = √(L/C) et la vitesse v = 1/√(LC).`,
    solve: (v) => {
      const Ll = 2e-7 * Math.log(v.b / v.a), Cl = (2 * Math.PI * EPS0 * v.er) / Math.log(v.b / v.a), Zc = Math.sqrt(Ll / Cl), vel = 1 / Math.sqrt(Ll * Cl);
      return { fields: [{ label: "L/l", value: Ll * 1e6, unit: "µH/m" }, { label: "Zc", value: Zc, unit: "Ω" }, { label: "v / c", value: (vel / C0) * 100, unit: "%" }],
        steps: [`L/l = (µ<sub>0</sub>/2π)·ln(b/a) = 2·10⁻⁷ × ln(${fr(v.b / v.a)}) = <b>${eng(Ll, "H/m")}</b>.`, `Avec C/l = ${eng(Cl, "F/m")} : Z<sub>c</sub> = √(L/C) = <b>${fr(Zc)} Ω</b> (≈ 50 Ω).`, `v = 1/√(LC) = ${sci(vel)} m/s, soit <b>${fr((vel / C0) * 100)} %</b> de c (= 1/√ε<sub>r</sub>).`] };
    },
    retenir: "Un câble est une ligne : son impédance caractéristique ne dépend que de b/a et de εr." },
  { id: "q40", part: "II", q: "Q40", title: "Tore en fer doux pour filtrer une alimentation", kind: "num",
    vars: { mr: { v: 5000, min: 100, max: 10000, step: 100, u: "", label: "µr" }, N: { v: 10, min: 1, max: 40, step: 1, u: "", label: "spires" }, h: { v: 1, min: 0.2, max: 3, step: 0.1, u: "cm", label: "côté de section" }, a: { v: 5, min: 0.5, max: 10, step: 0.5, u: "cm", label: "rayon intérieur" } },
    text: (v) => `Tore µ<sub>r</sub> = ${v.mr}, ${v.N} spires, section carrée de ${fr(v.h)} cm, rayon intérieur ${fr(v.a)} cm. Inductance ?`,
    solve: (v) => {
      const a = v.a / 100, b = a + v.h / 100, L = ((v.mr * MU0 * v.N ** 2 * (v.h / 100)) / (2 * Math.PI)) * Math.log(b / a);
      return { fields: [{ label: "L", value: L * 1e6, unit: "µH" }],
        steps: [`b = a + h = ${fr(b * 100)} cm. <b>L = (µ<sub>r</sub>µ<sub>0</sub>N²h/2π)·ln(b/a)</b>.`, `L = ${v.mr} × 2·10⁻⁷ × ${v.N}² × ${fr(v.h / 100)} × ln(${fr(b / a)}) = <b>${eng(L, "H")}</b>.`, `À 1 MHz, |Z| = Lω = ${eng(L * 2 * Math.PI * 1e6, "Ω")} : le tore bloque les perturbations HF et laisse passer le continu.`] };
    },
    retenir: "Réponse du TD : 182 µH avec seulement 10 spires.",
    pro: "C'est la self de mode commun qu'on trouve à l'entrée de toutes les alimentations à découpage et dans les filtres secteur (diapos 154, 158). Attention : au-delà de quelques spires, la capacité entre spires court-circuite la self en HF (diapo 159)." },

  // ───────── III ─────────
  { id: "q41", part: "III", q: "Q41–Q42", title: "Tension aux extrémités d'une piste de PCB", kind: "num", lab: "impedance",
    vars: { l: { v: 5, min: 1, max: 30, step: 0.5, u: "cm", label: "longueur" }, w: { v: 0.3, min: 0.1, max: 5, step: 0.05, u: "mm", label: "largeur" }, I: { v: 1, min: 0.01, max: 5, step: 0.01, u: "A", label: "courant" }, tm: { v: 5, min: 0.1, max: 100, step: 0.1, u: "ns", label: "temps de montée" }, hh: { v: 1.57, min: 0.1, max: 3.2, step: 0.01, u: "mm", label: "épaisseur PCB" } },
    text: (v) => `Piste de 35 µm, ${fr(v.l)} cm de long, ${fr(v.w)} mm de large, sur un PCB de ${fr(v.hh)} mm. Tension à ses bornes pour ${fr(v.I)} A continu, puis pour une impulsion de ${fr(v.I)} A avec ${fr(v.tm)} ns de temps de montée.`,
    solve: (v) => {
      const l = v.l / 100, w = v.w / 1000, h = v.hh / 1000, R = (RHO_CU * l) / (35e-6 * w);
      const L = w / h <= 1 ? ((60 * l) / C0) * Math.log((8 * h) / w + w / (4 * h)) : ((120 * Math.PI * l) / C0) / (w / h + 1.393 + 0.667 * Math.log(w / h + 1.444));
      const UL = (L * v.I) / (v.tm * 1e-9);
      return { fields: [{ label: "R", value: R * 1e3, unit: "mΩ" }, { label: "U continu", value: R * v.I * 1e3, unit: "mV" }, { label: "L", value: L * 1e9, unit: "nH" }, { label: "U impulsion", value: UL, unit: "V" }],
        steps: [`R = ρl/S = 1,7·10⁻⁸ × ${fr(l)} / (35·10⁻⁶ × ${sci(w)}) = <b>${eng(R, "Ω")}</b>, donc U = RI = <b>${eng(R * v.I, "V")}</b>.`, `w/h = ${fr(w / h)} ${w / h <= 1 ? "≤ 1 : L = (60l/c)·ln(8h/w + w/4h)" : "> 1 : seconde formule"} = <b>${eng(L, "H")}</b>.`, `U = L·di/dt = ${sci(L)} × ${fr(v.I)}/${sci(v.tm * 1e-9)} = <b>${eng(UL, "V")}</b>, soit ${fr(UL / (R * v.I))} fois la chute ohmique.`] };
    },
    retenir: "Réponses du TD : 81 mV en continu, 7,5 V avec un front de 5 ns. En HF, c'est L qui commande.",
    pro: "C'est le problème du « ground bounce » : quand plusieurs sorties d'un FPGA commutent en même temps, le courant de retour traverse l'inductance des pistes et des broches de masse, et le 0 V interne du composant saute de quelques centaines de mV. Remède : plan de masse, plusieurs broches de masse, découplage au plus près (diapos 111–113)." },
  { id: "q43", part: "III", q: "Q43–Q46", title: "Résistance d'un fil et effet de peau", kind: "num", lab: "peau",
    vars: { D: { v: 1, min: 0.2, max: 5, step: 0.1, u: "mm", label: "diamètre" }, L: { v: 1, min: 0.1, max: 10, step: 0.1, u: "m", label: "longueur" } },
    text: (v) => `Fil de ${fr(v.L)} m et Ø ${fr(v.D)} mm. Résistance en cuivre (ρ = 1,7·10⁻⁸ Ω·m) et en fer (ρ = 10⁻⁷ Ω·m, µ<sub>r</sub> = 5000) ? À quelle fréquence l'effet de peau commence-t-il (δ = D/2) ?`,
    solve: (v) => {
      const S = (Math.PI * (v.D / 1000) ** 2) / 4, Rcu = (RHO_CU * v.L) / S, Rfe = (1e-7 * v.L) / S, r = v.D / 2000;
      const fcu = RHO_CU / (Math.PI * MU0 * r * r), ffe = 1e-7 / (Math.PI * 5000 * MU0 * r * r);
      return { fields: [{ label: "R cuivre", value: Rcu, unit: "Ω" }, { label: "R fer", value: Rfe, unit: "Ω" }, { label: "f cuivre", value: fcu / 1e3, unit: "kHz" }, { label: "f fer", value: ffe, unit: "Hz" }],
        steps: [`S = πD²/4 = ${sci(S)} m². R<sub>Cu</sub> = ρl/S = <b>${eng(Rcu, "Ω")}</b>, R<sub>Fe</sub> = <b>${eng(Rfe, "Ω")}</b>.`, `HF : le courant circule dans une couronne d'épaisseur δ et de périmètre πD, donc <b>R(f) ≈ ρL/(πDδ)</b>, qui croît comme √f (pente 1/2 en log-log).`, `L'effet de peau intervient quand δ ≈ D/2 : f = ρ/(πµ(D/2)²). Cuivre : <b>${eng(fcu, "Hz")}</b>. Fer : <b>${eng(ffe, "Hz")}</b>.`, `Sur le graphe du TD, la courbe basse (≈ 0,02 Ω) est le cuivre, la haute (≈ 0,13 Ω) le fer.`] };
    },
    retenir: "Réponses : 0,022 Ω et 0,13 Ω ; effet de peau vers 17 kHz (Cu) et 20 Hz (Fe). Le fer est très mauvais conducteur en HF.",
    pro: "Pour la même raison, une barre de masse en acier galvanisé est correcte en sécurité 50 Hz mais médiocre en HF ; on préfère le cuivre étamé ou le laiton (diapo 92). Et un plan de masse de PCB n'a pas besoin d'être épais : au-dessus de 10 MHz, seule la surface conduit (diapo 107)." },
  { id: "q47", part: "III", q: "Q47", title: "1 V de créneaux sur l'alimentation à l'oscilloscope", kind: "num", lab: "impedance",
    vars: { l: { v: 30, min: 5, max: 200, step: 5, u: "cm", label: "fil de masse" }, s: { v: 10, min: 1, max: 50, step: 1, u: "mm²", label: "section" }, V: { v: 5, min: 1, max: 12, step: 0.5, u: "V", label: "niveau logique" }, R: { v: 10, min: 0.1, max: 100, step: 0.1, u: "kΩ", label: "charge" }, tm: { v: 200, min: 50, max: 5000, step: 10, u: "ps", label: "temps de montée" } },
    text: (v) => `Une carte TTL (${fr(v.V)} V sur ${fr(v.R)} kΩ, fronts de ${fr(v.tm)} ps) est reliée à la masse mécanique par ${fr(v.l)} cm de fil de ${fr(v.s)} mm². Un oscilloscope référencé à la masse mécanique voit des créneaux d'environ 1 V sur le 6 V d'un AOP. Explique quantitativement.`,
    solve: (v) => {
      const r = Math.sqrt((v.s * 1e-6) / Math.PI), l = v.l / 100, L = 2e-7 * l * (Math.log((2 * l) / r) - 0.75), R = (RHO_CU * l) / (v.s * 1e-6), i = v.V / (v.R * 1e3), u = (L * i) / (v.tm * 1e-12);
      return { fields: [{ label: "L du fil", value: L * 1e9, unit: "nH" }, { label: "u par signal", value: u, unit: "V" }],
        steps: [`Le fil de masse est commun à la carte et à l'oscilloscope : c'est une <b>impédance commune</b>.`, `R = ρl/S = ${eng(R, "Ω")} : négligeable. L (formule Q33) = <b>${eng(L, "H")}</b> (règle : 1 µH/m × ${fr(l)} m).`, `Chaque sortie fournit i = ${fr(v.V)}/${fr(v.R * 1e3)} = ${eng(i, "A")} en ${fr(v.tm)} ps.`, `u = L·di/dt = <b>${eng(u, "V")}</b> par signal. Avec quelques signaux qui commutent ensemble, on retrouve ≈ 1 V au rythme des créneaux.`] };
    },
    retenir: "Remèdes : fil de masse court ou tresse large, référencer l'oscilloscope à la masse de la carte, découpler l'alimentation.",
    pro: "Au labo, c'est le piège de la mesure : le long fil de masse de la sonde d'oscilloscope (le « crocodile » de 15 cm) forme la même impédance commune et fait voir des oscillations qui n'existent pas. Un technicien CEM mesure avec le ressort de masse court au bout de la sonde." },

  // ───────── IV ─────────
  { id: "q48", part: "IV", q: "Q48 · Q50–Q51", title: "La plaque à induction : identifier le couplage", kind: "qcm",
    intro: "La piste vers le capteur non connecté (2 mm de large) longe sur 30 cm, à 8 mm, la piste qui alimente la plaque (v(t) : créneaux 400 V, période 10 µs, fronts de 100 ns). Le sommateur a 100 kΩ d'entrée.",
    items: [
      { q: "Dans la piste déconnectée, quelle grandeur est nulle en régime établi ?", opts: ["le courant I", "le potentiel V"], ok: 0, why: "Pas de circuit fermé, donc pas de courant ; mais elle prend un potentiel par influence." },
      { q: "Le couplage entre les deux pistes est…", opts: ["capacitif (champ E)", "inductif (champ B)", "par impédance commune"], ok: 0 },
      { q: "Schéma équivalent :", opts: ["v(t) → C ≈ 9 pF → entrée du sommateur, R = 100 kΩ vers la masse", "v(t) → R → C en parallèle vers la masse", "v(t) et le sommateur reliés par une mutuelle M"], ok: 0 },
      { q: "Équation différentielle :", opts: ["RC·dvs/dt + vs = RC·dv/dt", "RC·dv/dt + v = vs", "vs = v·R/(R + 1/Cω)"], ok: 0, why: "Le même courant traverse C puis R : i = C·d(v − vs)/dt = vs/R." },
    ] },
  { id: "q49", part: "IV", q: "Q49 · Q52–Q54", title: "Les 3600 V de la plaque à induction", kind: "num", lab: "capacitif",
    vars: { cl: { v: 30, min: 5, max: 100, step: 1, u: "pF/m", label: "capacité linéique (abaque)" }, len: { v: 30, min: 5, max: 100, step: 1, u: "cm", label: "longueur en parallèle" }, R: { v: 100, min: 1, max: 1000, step: 1, u: "kΩ", label: "entrée du sommateur" }, V: { v: 400, min: 10, max: 600, step: 10, u: "V", label: "amplitude de v(t)" }, tm: { v: 100, min: 10, max: 2000, step: 10, u: "ns", label: "temps de montée" } },
    text: (v) => `L'abaque donne ${fr(v.cl)} pF/m pour s/d = 4. Sur ${fr(v.len)} cm, quelle capacité ? Avec R = ${fr(v.R)} kΩ et des fronts de ${fr(v.V)} V en ${fr(v.tm)} ns, que vaut v<sub>s</sub> pendant un front (approximation v<sub>s</sub> ≈ RC·dv/dt) ? Et la vraie valeur ?`,
    solve: (v) => {
      const C = v.cl * 1e-12 * (v.len / 100), RC = v.R * 1e3 * C, a = v.V / (v.tm * 1e-9), approx = RC * a, exact = RC * a * (1 - Math.exp(-(v.tm * 1e-9) / RC));
      return { fields: [{ label: "C", value: C * 1e12, unit: "pF" }, { label: "RC", value: RC * 1e6, unit: "µs" }, { label: "vs approché", value: approx, unit: "V" }, { label: "vs réel (pic)", value: exact, unit: "V" }],
        steps: [`C = ${fr(v.cl)} pF/m × ${fr(v.len / 100)} m = <b>${eng(C, "F")}</b>.`, `RC = ${sci(v.R * 1e3)} × ${sci(C)} = <b>${eng(RC, "s")}</b>. dv/dt = ${fr(v.V)}/${sci(v.tm * 1e-9)} = ${sci(a)} V/s.`, `En négligeant RC·dv<sub>s</sub>/dt : v<sub>s</sub> ≈ RC·dv/dt = <b>${fr(approx)} V</b> pendant le front montant, ${fr(-approx)} V au front descendant, 0 sur les paliers (c'est la dérivée de v).`, `<b>Piège :</b> l'approximation exige RC ≪ t<sub>m</sub>. ${RC > v.tm * 1e-9 ? `Ici RC = ${eng(RC, "s")} > t<sub>m</sub> : la vraie solution v<sub>s</sub> = RC·(dv/dt)·(1 − e<sup>−t/RC</sup>) culmine à <b>${fr(exact)} V</b> puis décroît avec τ = RC.` : `Ici RC < t<sub>m</sub> : l'approximation est correcte (pic réel ${fr(exact)} V).`}`] };
    },
    retenir: "Réponses du TD : 9 pF, RC = 0,9 µs, ±3600 V (pic réel ≈ 380 V). Dans tous les cas, l'entrée du sommateur est détruite.",
    pro: "Les remèdes sont ceux d'un bureau d'études : relier à la masse toute piste inutilisée (ou par une résistance faible), l'éloigner de la piste de puissance, intercaler une piste de garde à la masse, ralentir les fronts de l'onduleur. Sur un produit électroménager, ce défaut serait vu au premier essai d'immunité." },

  // ───────── V ─────────
  { id: "q55", part: "V", q: "Q55", title: "Reconnaître le couplage", kind: "qcm",
    intro: "Méthode : di/dt près d'une boucle → inductif ; dv/dt près d'un conducteur, ou problème réglé par une mise à la masse (écran) → capacitif ; conducteur partagé → impédance commune.",
    items: [
      { q: "A. Un câble d'alimentation de moteur de 10 kW perturbe un câble de mesure voisin quand le moteur démarre.", opts: ["capacitif", "inductif", "impédance commune"], ok: 1, why: "Fort appel de courant : di/dt." },
      { q: "B. Des courts-circuits répétés sur un câble d'alimentation induisent un signal dans un câble voisin.", opts: ["capacitif", "inductif", "impédance commune"], ok: 1 },
      { q: "C. Deux cartes reliées par un câble de terre ; l'horloge 100 MHz de l'une apparaît sur l'autre.", opts: ["capacitif", "inductif", "impédance commune"], ok: 2 },
      { q: "D. Une perturbation sur un conducteur d'une nappe disparaît quand les conducteurs inutilisés sont reliés à la masse.", opts: ["capacitif", "inductif", "impédance commune"], ok: 0, why: "Effet d'écran : on a coupé les lignes de champ E." },
      { q: "E. Une boucle de masse crée une perturbation dans le circuit.", opts: ["capacitif", "inductif", "impédance commune"], ok: 1, why: "L'origine est le champ B capté par la boucle (on peut citer l'impédance commune en complément)." },
      { q: "F. La foudre tombée à 500 m a détérioré la box ADSL.", opts: ["capacitif", "inductif", "impédance commune"], ok: 1, why: "Voir Q22 : dI/dt énorme et grande boucle." },
    ],
    retenir: "Les 5 réflexes : 1 µH/m ; réduire les boucles ; éloigner et mettre à la masse ; masses courtes et larges ; ralentir les fronts." },

  // ───────── Exercices du cours ─────────
  { id: "c1", part: "C", q: "Diapos 68 · 109", title: "Temps de montée et bande de fréquence", kind: "num", lab: "front",
    vars: { tm: { v: 3.5, min: 0.1, max: 100, step: 0.1, u: "ns", label: "temps de montée" } },
    text: (v) => `Un signal logique a un temps de montée de ${fr(v.tm)} ns. Jusqu'à quelle fréquence son spectre est-il significatif ?`,
    solve: (v) => ({ fields: [{ label: "Fc", value: 0.35 / v.tm * 1e3, unit: "MHz" }],
      steps: [`<b>Fc = 0,35 / t<sub>m</sub></b> = 0,35 / ${sci(v.tm * 1e-9)} = <b>${eng(0.35 / (v.tm * 1e-9), "Hz")}</b>.`, `C'est le temps de montée, pas la fréquence d'horloge, qui fixe jusqu'où les harmoniques sont gênantes.`] }),
    retenir: "3,5 ns → 100 MHz ; 1 ns → 350 MHz.",
    pro: "Choisir une logique plus lente que nécessaire (ou ajouter une résistance série de 22–47 Ω sur une horloge) est souvent le correctif CEM le moins cher : on ralentit le front et le spectre s'effondre au-dessus de Fc." },
  { id: "c2", part: "C", q: "Diapo 109", title: "Fente dans le plan de masse", kind: "num",
    vars: { tm: { v: 3.5, min: 0.5, max: 20, step: 0.1, u: "ns", label: "temps de montée" }, Lf: { v: 10, min: 1, max: 30, step: 0.5, u: "cm", label: "longueur de fente" } },
    text: (v) => `Plan de masse de 30 × 15 cm (deux carrés). Impulsions de ${fr(v.tm)} ns de montée. Impédance ohmique du plan, puis impédance selfique d'une fente de ${fr(v.Lf)} cm que le courant doit contourner (1 nH/cm) ?`,
    solve: (v) => {
      const F = 0.35 / (v.tm * 1e-9), Zp = 2 * 0.37 * Math.sqrt(F / 1e6) * 1e-3, Zf = v.Lf * 1e-9 * 2 * Math.PI * F;
      return { fields: [{ label: "F", value: F / 1e6, unit: "MHz" }, { label: "Z plan", value: Zp * 1e3, unit: "mΩ" }, { label: "Z fente", value: Zf, unit: "Ω" }],
        steps: [`F = 0,35/t<sub>m</sub> = <b>${eng(F, "Hz")}</b>.`, `Impédance par carré : 0,37·√F<sub>MHz</sub> mΩ, deux carrés : <b>${eng(Zp, "Ω")}</b>.`, `Fente : L = ${fr(v.Lf)} nH, Z = L·2πF = <b>${eng(Zf, "Ω")}</b>, soit ${fr(Zf / Zp)} fois le plan.`] };
    },
    retenir: "Réponse du cours : 7,4 mΩ contre 6,28 Ω. Jamais de piste qui enjambe une fente ; des trous juxtaposés font une fente.",
    pro: "Quand un routeur coupe le plan de masse pour passer un bus, le courant de retour d'horloge fait le tour de la fente : la boucle grandit, la carte rayonne. C'est un des premiers points que regarde un relecteur de layout." },
  { id: "c3", part: "C", q: "Diapo 111", title: "Tension sur l'alimentation d'un boîtier", kind: "num",
    vars: { l: { v: 5, min: 1, max: 30, step: 0.5, u: "cm", label: "longueur de piste d'alim" }, dI: { v: 50, min: 5, max: 500, step: 5, u: "mA", label: "appel de courant" }, dt: { v: 5, min: 0.5, max: 50, step: 0.5, u: "ns", label: "durée" } },
    text: (v) => `${fr(v.l)} cm de piste d'alimentation (10 nH/cm) entre l'alimentation et un circuit qui appelle ${fr(v.dI)} mA en ${fr(v.dt)} ns. Chute de tension aux bornes du boîtier ?`,
    solve: (v) => { const U = v.l * 10e-9 * (v.dI * 1e-3) / (v.dt * 1e-9);
      return { fields: [{ label: "U", value: U * 1e3, unit: "mV" }], steps: [`L = ${fr(v.l)} × 10 nH = ${fr(v.l * 10)} nH. <b>U = L·ΔI/Δt</b> = ${sci(v.l * 1e-8)} × ${sci(v.dI * 1e-3)}/${sci(v.dt * 1e-9)} = <b>${eng(U, "V")}</b>.`] }; },
    retenir: "Réponse du cours : 500 mV. D'où le condensateur de découplage au plus près de chaque circuit." },
  { id: "c4", part: "C", q: "Diapo 99", title: "Condensateur de découplage avec pattes", kind: "num", lab: "condo",
    vars: { C: { v: 12, min: 0.1, max: 1000, step: 0.1, u: "nF", label: "capacité" }, p: { v: 4, min: 0.1, max: 6, step: 0.1, u: "cm", label: "longueur totale des pattes" } },
    text: (v) => `Condensateur de ${fr(v.C)} nF avec ${fr(v.p)} cm de pattes en tout (10 nH/cm). Fréquence de résonance ?`,
    solve: (v) => { const L = v.p * 1e-8, fr0 = 1 / (2 * Math.PI * Math.sqrt(L * v.C * 1e-9));
      return { fields: [{ label: "L", value: L * 1e9, unit: "nH" }, { label: "fr", value: fr0 / 1e6, unit: "MHz" }], steps: [`L = ${fr(v.p)} × 10 nH = <b>${fr(L * 1e9)} nH</b>.`, `<b>f<sub>r</sub> = 1 / 2π√(LC)</b> = <b>${eng(fr0, "Hz")}</b>. Au-delà, le condensateur se comporte comme une inductance : il ne découple plus.`] }; },
    retenir: "Réponse du cours : 40 nH, 7,26 MHz. Un CMS 0402 au ras de la broche (ESL ≈ 0,5 nH) monte bien plus haut." },
  { id: "c5", part: "C", q: "Diapo 135", title: "Courant de mode commun vers le boîtier", kind: "num",
    vars: { dU: { v: 5, min: 1, max: 15, step: 0.5, u: "V", label: "saut de tension" }, dt: { v: 5, min: 0.5, max: 50, step: 0.5, u: "ns", label: "durée" }, C: { v: 0.05, min: 0.01, max: 5, step: 0.01, u: "pF", label: "capacité piste/boîtier" } },
    text: (v) => `Une piste saute de ${fr(v.dU)} V en ${fr(v.dt)} ns, avec ${fr(v.C)} pF de capacité parasite vers le boîtier. Courant injecté ?`,
    solve: (v) => { const i = v.C * 1e-12 * v.dU / (v.dt * 1e-9);
      return { fields: [{ label: "i", value: i * 1e6, unit: "µA" }], steps: [`<b>i = C·dU/dt</b> = ${sci(v.C * 1e-12)} × ${fr(v.dU)}/${sci(v.dt * 1e-9)} = <b>${eng(i, "A")}</b>.`, `Ce courant revient par le câble (courant de mode commun) : le câble rayonne. Quelques µA sur un câble d'un mètre suffisent à dépasser la limite de la classe B.`] }; },
    retenir: "Réponse : 50 µA. C'est la carte qui pollue les câbles (diapo 130)." },
  { id: "c6", part: "C", q: "Diapo 141", title: "Atténuation par réflexion d'un boîtier aluminium", kind: "num", lab: "blindage",
    vars: { f: { v: 100, min: 0.01, max: 1000, step: 0.01, u: "MHz", label: "fréquence" }, sr: { v: 0.61, min: 0.02, max: 1, step: 0.01, u: "", label: "σr" }, mr: { v: 1, min: 1, max: 1000, step: 1, u: "", label: "µr" } },
    text: (v) => `Onde de ${fr(v.f)} MHz sur un boîtier (σ<sub>r</sub> = ${fr(v.sr)}, µ<sub>r</sub> = ${fr(v.mr)}) à 10 m de la source. Atténuation par réflexion ?`,
    solve: (v) => {
      const F = v.f * 1e6, lam = C0 / F, far = 10 > lam / (2 * Math.PI), Zc = 377, Ze = 3.7e-7 * Math.sqrt((v.mr * F) / v.sr), AR = 20 * Math.log10((Zc + Ze) ** 2 / (4 * Zc * Ze));
      return { fields: [{ label: "Zécran", value: Ze * 1e3, unit: "mΩ" }, { label: "AR", value: AR, unit: "dB" }],
        steps: [`λ = ${fr(lam)} m, λ/2π = ${fr(lam / (2 * Math.PI))} m. ${far ? "10 m > λ/2π : champ lointain, Z<sub>c</sub> = 377 Ω." : "10 m < λ/2π : on est en champ proche, Z<sub>c</sub> ≠ 377 Ω ; le calcul à 377 Ω est une hypothèse."}`, `Z<sub>écran</sub> = 3,7·10⁻⁷·√(µ<sub>r</sub>F/σ<sub>r</sub>) = <b>${eng(Ze, "Ω")}</b>.`, `<b>A<sub>R</sub> = 20 log((Z<sub>c</sub> + Z<sub>écran</sub>)² / 4Z<sub>c</sub>Z<sub>écran</sub>)</b> = <b>${fr(AR)} dB</b>.`] };
    },
    retenir: "≈ 86 dB à 100 MHz : un boîtier métallique fermé réfléchit presque tout. Ce sont les ouvertures qui limitent (diapo 143).",
    pro: "En pratique, une fente de 10 cm (porte, ventilation, écran) devient une antenne vers 1,5 GHz (λ/2) : l'efficacité réelle d'un coffret dépend des joints CEM et de la taille des ouvertures, pas de l'épaisseur de la tôle." },
  { id: "c7", part: "C", q: "Diapo 142", title: "Blindage en acier ou en cuivre ?", kind: "num", lab: "blindage",
    vars: { f: { v: 1, min: 0.001, max: 100, step: 0.001, u: "MHz", label: "fréquence" }, e: { v: 0.5, min: 0.01, max: 3, step: 0.01, u: "mm", label: "épaisseur" } },
    text: (v) => `Compare l'épaisseur de peau et l'absorption de ${fr(v.e)} mm de cuivre (σ<sub>r</sub> = 1, µ<sub>r</sub> = 1) et d'acier (σ<sub>r</sub> = 0,1, µ<sub>r</sub> = 1000) à ${fr(v.f)} MHz.`,
    solve: (v) => {
      const F = v.f * 1e6, dCu = 1 / Math.sqrt(230 * F), dAc = 1 / Math.sqrt(230 * F * 100), e = v.e / 1000;
      return { fields: [{ label: "δ cuivre", value: dCu * 1e6, unit: "µm" }, { label: "δ acier", value: dAc * 1e6, unit: "µm" }, { label: "AA cuivre", value: 8.686 * e / dCu, unit: "dB" }, { label: "AA acier", value: 8.686 * e / dAc, unit: "dB" }],
        steps: [`<b>δ = 1/√(230·F·σ<sub>r</sub>·µ<sub>r</sub>)</b>. Cuivre : <b>${eng(dCu, "m")}</b> ; acier (σ<sub>r</sub>µ<sub>r</sub> = 100) : <b>${eng(dAc, "m")}</b>, dix fois moins.`, `<b>A<sub>A</sub> = 20 log(e<sup>e/δ</sup>) = 8,69·e/δ</b> dB. Cuivre : ${fr(8.686 * e / dCu)} dB ; acier : ${fr(8.686 * e / dAc)} dB.`, `En <b>absorption</b>, l'acier gagne (σ<sub>r</sub>µ<sub>r</sub> grand). En <b>réflexion</b>, le cuivre gagne (Z<sub>écran</sub> plus faible). Contre un champ magnétique basse fréquence, seul un matériau perméable (acier, mu-métal) est efficace.`] };
    },
    retenir: "Blindage efficace en absorption si σr × µr est grand." },
  { id: "c8", part: "C", q: "Diapo 148", title: "Câble blindé et « queue de cochon »", kind: "num",
    vars: { I: { v: 0.1, min: 0.01, max: 1, step: 0.01, u: "A", label: "courant sur la tresse" }, f: { v: 100, min: 10, max: 500, step: 1, u: "MHz", label: "fréquence" }, Zt: { v: 1, min: 0.01, max: 10, step: 0.01, u: "Ω/m", label: "Zt" }, p: { v: 10, min: 1, max: 30, step: 1, u: "cm", label: "queue de cochon" } },
    text: (v) => `${fr(v.I)} A à ${fr(v.f)} MHz circulent sur la tresse d'un câble long (L > λ/2), Z<sub>t</sub> = ${fr(v.Zt)} Ω/m. La tresse est reprise par un fil (« queue de cochon ») de ${fr(v.p)} cm (1 µH/m). Tension parasite à l'entrée de l'amplificateur ?`,
    solve: (v) => {
      const lam = C0 / (v.f * 1e6), U1 = 0.7 * v.Zt * v.I * lam, U2 = v.p / 100 * 1e-6 * 2 * Math.PI * v.f * 1e6 * v.I;
      return { fields: [{ label: "U1 (tresse)", value: U1, unit: "V" }, { label: "U2 (queue de cochon)", value: U2, unit: "V" }],
        steps: [`λ = ${fr(lam)} m. Câble long (L > λ/2) : <b>U1 = 0,7·Z<sub>t</sub>·I·λ</b> = ${fr(U1)} V.`, `Queue de cochon : L = ${fr(v.p)} cm × 1 µH/m = ${fr(v.p * 10)} nH, |Z| = Lω = ${eng(v.p / 100 * 1e-6 * 2 * Math.PI * v.f * 1e6, "Ω")}, U2 = Z·I = <b>${fr(U2)} V</b>.`, `La queue de cochon apporte ${fr(U2 / U1)} fois plus de perturbation que le câble lui-même. Calcul proposé : le cours pose la question sans la corriger.`] };
    },
    retenir: "Une tresse se reprend sur 360° (presse-étoupe CEM, connecteur métallique), jamais par un fil.",
    pro: "Dans une armoire, la diapo 149 classe les trois montages : queue de cochon interdite, cavalier acceptable, presse-étoupe CEM recommandé. C'est un point de contrôle systématique en réception de chantier." },
  { id: "c9", part: "C", q: "Diapo 79", title: "Champ d'un émetteur radio portable", kind: "num",
    vars: { P: { v: 2, min: 0.01, max: 10, step: 0.01, u: "W", label: "puissance" }, G: { v: 1, min: 1, max: 10, step: 0.1, u: "", label: "gain" }, D: { v: 1, min: 0.1, max: 30, step: 0.1, u: "m", label: "distance" } },
    text: (v) => `Un talkie-walkie de ${fr(v.P)} W (gain ${fr(v.G)}) est utilisé à ${fr(v.D)} m d'un équipement. Champ reçu ?`,
    solve: (v) => { const E = Math.sqrt(30 * v.P * v.G) / v.D;
      return { fields: [{ label: "E", value: E, unit: "V/m" }], steps: [`<b>E = √(30·P·G) / D</b> = √(30 × ${fr(v.P)} × ${fr(v.G)}) / ${fr(v.D)} = <b>${fr(E)} V/m</b>.`, `Les essais d'immunité rayonnée d'un produit domestique se font typiquement à 3 V/m, 10 V/m en industrie : ${E > 10 ? "ici on dépasse même le niveau industriel." : E > 3 ? "ici on dépasse le niveau domestique." : "ici on reste sous le niveau domestique."}`] }; },
    retenir: "Un téléphone ou un talkie-walkie à 1 m donne plusieurs V/m : c'est le perturbateur le plus courant d'un atelier.",
    pro: "D'où les panneaux « téléphones interdits » en salle de réanimation ou près de certaines machines : l'équipement n'a été qualifié qu'à 3 ou 10 V/m." },
  { id: "c10", part: "C", q: "Diapo 85", title: "Piste commune logique / analogique", kind: "num",
    vars: { l: { v: 5, min: 1, max: 20, step: 0.5, u: "cm", label: "longueur" }, w: { v: 1, min: 0.1, max: 5, step: 0.1, u: "mm", label: "largeur" }, e: { v: 30, min: 17, max: 70, step: 1, u: "µm", label: "épaisseur" }, I: { v: 50, min: 1, max: 500, step: 1, u: "mA", label: "pics HCMOS" } },
    text: (v) => `Une piste commune (${fr(v.l)} cm × ${fr(v.w)} mm × ${fr(v.e)} µm, σ = 5·10⁷ S/m) porte les pics de ${fr(v.I)} mA d'une logique HCMOS et le retour d'un capteur de quelques µV. Chute de tension ?`,
    solve: (v) => { const R = (v.l / 100) / (5e7 * (v.w / 1000) * (v.e * 1e-6)), V = R * v.I * 1e-3;
      return { fields: [{ label: "R", value: R, unit: "Ω" }, { label: "V", value: V * 1e3, unit: "mV" }], steps: [`R = L/(σS) = <b>${eng(R, "Ω")}</b>.`, `V = R·I = <b>${eng(V, "V")}</b>, mille fois le signal du capteur. Solution : masse logique et masse analogique séparées jusqu'au point commun (diapo 86).`] }; },
    retenir: "Réponse du cours : 0,033 Ω et 1,65 mV." },
];
