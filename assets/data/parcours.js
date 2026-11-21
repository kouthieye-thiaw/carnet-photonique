/* Parcours « technicien opto-électronique » (module ES) : les étapes, dans l'ordre conseillé
   à quelqu'un qui débute en optique et qui a une formation GEII. La séance du jour propose
   les nouvelles leçons dans cet ordre. */

export const PHASES = [
  { id: "p0", num: "0", titre: "démarrer", sous: "la méthode avant le contenu",
    objectif: "Savoir comment apprendre vite et durablement, et installer la routine quotidienne.",
    lecons: [],
    outils: [["methode.html", "la méthode, en 15 minutes"], ["seance.html", "régler et faire ma première séance"]],
    geii: [], themes: [],
    preuve: "Ta séance du jour est réglée et tu en as fait une : 20 à 40 minutes par jour valent mieux que 4 heures le dimanche." },
  { id: "p1", num: "1", titre: "la lumière sans peur", sous: "les bases de l'optique, en partant de zéro",
    objectif: "Parler de lumière avec les bons mots, suivre un rayon à travers une lentille et une fibre, convertir les puissances.",
    lecons: ["decouvrir/lumiere-sans-formules", "decouvrir/rayons-lentilles", "maths/unites-db", "decouvrir/fibres-pas-a-pas", "decouvrir/mesurer-lumiere", "physique/lumiere-photon", "physique/optique-geometrique"],
    geii: [["maths : puissances de 10, logarithmes", null], ["physique S5 · l'onde électromagnétique (cours de CEM, partie 1)", "but3/cem/index.html"]],
    themes: ["optique", "ondes", "fibre"],
    preuve: "Expliquer à voix haute, sans notes, pourquoi une fibre guide la lumière ; convertir de tête 5 puissances dBm ↔ mW." },
  { id: "p2", num: "2", titre: "ondes, matière et sources", sous: "d'où vient la lumière d'un laser",
    objectif: "Comprendre interférences, polarisation, niveaux d'énergie et jonction pn — et ce qui fait d'une source un laser.",
    lecons: ["maths/fonctions", "physique/optique-ondulatoire", "physique/polarisation", "physique/atome-emission", "physique/semi-conducteurs", "lasers/principe", "lasers/securite"],
    geii: [["physique S5 · semi-conducteurs : jonctions, transport", null], ["mathématiques : exponentielles, logarithmes", null]],
    themes: ["ondes", "laser", "surete"],
    preuve: "Dessiner le diagramme de bandes d'une jonction pn polarisée en direct et expliquer l'émission stimulée en cinq phrases ; connaître les classes laser." },
  { id: "p3", num: "3", titre: "la diode laser et son électronique", sous: "le cœur de ton métier GEII",
    objectif: "Piloter une diode en courant, la protéger, réguler sa température, détecter et numériser sa lumière.",
    lecons: ["lasers/diode-laser", "maths/complexes-trigo", "maths/derivees-equadiff", "electronique/driver-courant", "electronique/protection", "physique/thermique", "electronique/tec-pid", "electronique/photodetection", "electronique/acquisition", "electronique/alim-cem"],
    geii: [["électronique analogique : AOP, filtres", null], ["automatique : boucle fermée, PID", null], ["systèmes embarqués : I²C, SPI, CAN", null], ["CEM S5", "but3/cem/index.html"]],
    themes: ["laser", "detection", "electronique", "regulation"],
    preuve: "Calculer puis câbler une source de courant et un amplificateur transimpédance sur plaque d'essai ; mesurer la bande passante du TIA." },
  { id: "p4", num: "4", titre: "faisceaux, fibres et amplificateurs", sous: "propager, accorder, amplifier",
    objectif: "Maîtriser le faisceau gaussien, les modes, l'accord en longueur d'onde, les fibres et les amplificateurs optiques.",
    lecons: ["lasers/cavite-modes", "lasers/faisceau-gaussien", "lasers/familles", "lasers/impulsions", "lasers/accordabilite", "maths/fourier-signal", "amplis/principe", "amplis/edfa", "amplis/soa-raman-ta", "amplis/puissance-mesures"],
    geii: [["réseaux & télécommunications : liaisons, bilans", null], ["info spé S5 : transformée de Fourier discrète", null]],
    themes: ["faisceau", "fibre", "laser"],
    preuve: "Établir le bilan de liaison d'une fibre réelle et justifier chaque terme ; prévoir la taille d'un faisceau focalisé." },
  { id: "p5", num: "5", titre: "mesurer, contrôler, certifier", sous: "le pôle « contrôle et métrologie »",
    objectif: "Choisir l'instrument, exprimer un résultat avec son incertitude, suivre une production avec la MSP.",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie", "systemes/architecture", "systemes/optique-pratique"],
    geii: [["MSP S5 : cartes de contrôle, capabilité", "but3/revision-s5-maintenance-maths.html"], ["info spé S5 : banc de mesure automatisé en Python", null], ["bases de données S5 : stocker et retrouver des résultats de test", null]],
    themes: ["mesure", "detection"],
    preuve: "Un rapport de mesure d'une page : méthode, résultat avec incertitude élargie, et le Cpk d'un lot simulé." },
  { id: "p6", num: "6", titre: "maintenir, dépanner, sécuriser", sous: "le pôle « assistance technique et maintenance »",
    objectif: "Diagnostiquer méthodiquement, organiser la maintenance, travailler en sécurité au poste.",
    lecons: ["systemes/methodes-maintenance", "systemes/diagnostic", "systemes/securite-poste"],
    geii: [["maintenance S5 : stocks, coûts, Weibull", "but3/fiche-maintenance-s5.html"], ["probabilités-statistiques S5", "but3/revision-s5-maintenance-maths.html"]],
    themes: ["surete", "mesure"],
    preuve: "Un arbre de diagnostic pour « la puissance laser a chuté de 30 % », et une gamme de maintenance préventive." },
  { id: "p7", num: "7", titre: "le projet-preuve : ton banc de test", sous: "tout réunir, et le montrer",
    objectif: "Construire et programmer un banc qui caractérise une diode laser : la preuve concrète de tes compétences.",
    lecons: ["projet/cahier-des-charges", "projet/materiel", "projet/electronique-banc", "projet/mecanique-optique", "projet/raspberry-setup", "projet/logiciel-architecture", "projet/code-1-pilotes", "projet/code-2-mesures", "projet/code-3-analyse", "projet/code-4-interface", "projet/protocoles", "projet/validation"],
    geii: [["SAÉ : démarche de projet", null], ["info spé S5 : Python, instruments", null], ["anglais : documenter en anglais technique", "glossaire.html"]],
    themes: ["laser", "detection", "electronique", "mesure"],
    preuve: "Un dépôt GitHub avec ton code, une courbe L-I-V mesurée, un rapport de validation : à montrer en entretien de stage." }
];

export const ORDRE = PHASES.flatMap(p => p.lecons);

/* Les quatre pôles du métier (organisation du BTS « photonique », rénové) et leurs équivalents GEII (programme national du BUT, 2022) */
export const POLES = [
  { id: "concevoir", titre: "concevoir", geii: "Concevoir la partie GEII d'un système" },
  { id: "realiser", titre: "prototyper & intégrer", geii: "Implanter un système matériel ou logiciel (parcours ESE)" },
  { id: "controler", titre: "contrôler & mesurer", geii: "Vérifier la partie GEII d'un système" },
  { id: "maintenir", titre: "maintenir & assister", geii: "Maintenir en condition opérationnelle" },
  { id: "transverse", titre: "partout", geii: "compétences transversales" }
];

export const COMPETENCES = [
  { id: "c1", pole: "concevoir", titre: "choisir et dimensionner l'optique", desc: "lentilles, collimation, fibres, filtres : prévoir où va la lumière et ce qu'elle perd.",
    lecons: ["decouvrir/rayons-lentilles", "decouvrir/fibres-pas-a-pas", "physique/optique-geometrique", "lasers/faisceau-gaussien"], themes: ["optique", "faisceau", "fibre"] },
  { id: "c2", pole: "concevoir", titre: "dimensionner l'électronique de pilotage et de détection", desc: "source de courant, protections, TIA, filtrage, conversion.",
    lecons: ["electronique/driver-courant", "electronique/protection", "electronique/photodetection", "electronique/acquisition"], themes: ["electronique", "detection"] },
  { id: "c3", pole: "realiser", titre: "monter, aligner et nettoyer un montage optique", desc: "manipuler sans abîmer, aligner un faisceau, connecter et inspecter une fibre.",
    lecons: ["systemes/optique-pratique", "projet/mecanique-optique", "decouvrir/fibres-pas-a-pas"], themes: ["optique"] },
  { id: "c4", pole: "realiser", titre: "câbler et programmer une acquisition", desc: "I²C/SPI, Raspberry Pi, Python, pilotes d'instruments.",
    lecons: ["electronique/acquisition", "projet/raspberry-setup", "projet/code-1-pilotes", "projet/code-2-mesures"], themes: ["electronique"] },
  { id: "c5", pole: "controler", titre: "caractériser une source laser", desc: "L-I-V, seuil, rendement, spectre, profil de faisceau, polarisation, bruit.",
    lecons: ["lasers/diode-laser", "decouvrir/mesurer-lumiere", "projet/protocoles", "projet/code-3-analyse"], themes: ["laser", "faisceau", "detection"] },
  { id: "c6", pole: "controler", titre: "exprimer une mesure et suivre une production", desc: "incertitudes, étalonnage, traçabilité, cartes de contrôle et capabilité.",
    lecons: ["maths/stats-incertitudes", "systemes/metrologie", "projet/validation"], themes: ["mesure"] },
  { id: "c7", pole: "maintenir", titre: "diagnostiquer une panne", desc: "méthode, arbre de causes, mesures ciblées, remise en service.",
    lecons: ["systemes/architecture", "systemes/diagnostic", "electronique/tec-pid"], themes: ["regulation", "laser"] },
  { id: "c8", pole: "maintenir", titre: "organiser la maintenance", desc: "préventif, fiabilité, disponibilité, pièces de rechange, coûts.",
    lecons: ["systemes/methodes-maintenance"], themes: ["surete"] },
  { id: "c9", pole: "transverse", titre: "travailler en sécurité", desc: "risque laser, protections, ESD, électricité, organisation du poste.",
    lecons: ["lasers/securite", "systemes/securite-poste"], themes: ["surete"] },
  { id: "c10", pole: "transverse", titre: "communiquer : rapport, procédure, anglais", desc: "écrire ce qu'on a fait pour qu'un autre puisse le refaire — en français et en anglais technique.",
    lecons: ["projet/validation", "projet/code-4-interface"], themes: [] }
];

export const NIVEAUX_AUTO = ["je découvre", "je comprends", "je fais avec aide", "je fais seul", "je sais l'expliquer"];
