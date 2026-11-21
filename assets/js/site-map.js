/* Carte du site : modules, leçons, outils.
   Pour ajouter une leçon : crée le fichier HTML (copie une leçon existante),
   puis ajoute une ligne ici. Tout le reste (sommaire, progression, pager)
   se met à jour tout seul. */
window.CARNET_MAP = {
  owner: {
    name: "Kouthieye Thiaw",
    role: "étudiant BUT3 GEII · futur technicien opto-électronique",
    carnet: "n° 01",
    github: "https://github.com/kouthieye-thiaw"
  },
  site: {
    title: "carnet photonique",
    purpose: "bibliothèque d'apprentissage et de développement de compétences pour devenir technicien opto-électronique : optique, lasers, amplificateurs, électronique d'intégration, maintenance — avec des méthodes d'apprentissage validées par la recherche, et un banc de test laser sur Raspberry Pi à construire soi-même."
  },
  modules: [
    {
      id: "decouvrir", num: "00", title: "l'optique en partant de zéro", sticker: "etoile",
      desc: "la lumière sans formules, rayons et lentilles, fibres pas à pas, mesurer la lumière : les bases pour démarrer sans prérequis.",
      img: "assets/img/mod-decouvrir.webp",
      pages: [
        { id: "decouvrir/lumiere-sans-formules", title: "la lumière, sans formules", min: 30 },
        { id: "decouvrir/rayons-lentilles", title: "rayons, miroirs & lentilles", min: 40 },
        { id: "decouvrir/fibres-pas-a-pas", title: "les fibres optiques, pas à pas", min: 40 },
        { id: "decouvrir/mesurer-lumiere", title: "mesurer la lumière", min: 35 }
      ]
    },
    {
      id: "maths", num: "01", title: "les maths utiles", sticker: "pi",
      desc: "décibels, exponentielles, complexes, équations différentielles, Fourier, incertitudes : juste ce qu'il faut, appliqué au laser.",
      img: "assets/img/mod-maths.webp",
      pages: [
        { id: "maths/unites-db", title: "unités, puissances de 10 & décibels", min: 30 },
        { id: "maths/fonctions", title: "exponentielles, logarithmes & gaussiennes", min: 30 },
        { id: "maths/complexes-trigo", title: "trigo, nombres complexes & phaseurs", min: 35 },
        { id: "maths/derivees-equadiff", title: "dérivées, intégrales & équations différentielles", min: 40 },
        { id: "maths/fourier-signal", title: "fourier, spectres & échantillonnage", min: 45 },
        { id: "maths/stats-incertitudes", title: "statistiques, incertitudes & régression", min: 45 }
      ]
    },
    {
      id: "physique", num: "02", title: "la physique de la lumière", sticker: "photon",
      desc: "onde et photon, optique géométrique et ondulatoire, polarisation, émission stimulée, semi-conducteurs, thermique.",
      img: "assets/img/mod-physique.webp",
      pages: [
        { id: "physique/lumiere-photon", title: "la lumière : onde et photon", min: 30 },
        { id: "physique/optique-geometrique", title: "optique géométrique & fibres", min: 40 },
        { id: "physique/optique-ondulatoire", title: "interférences, diffraction & cohérence", min: 40 },
        { id: "physique/polarisation", title: "la polarisation", min: 35 },
        { id: "physique/atome-emission", title: "atomes, niveaux d'énergie & émission stimulée", min: 40 },
        { id: "physique/semi-conducteurs", title: "semi-conducteurs & jonction pn", min: 40 },
        { id: "physique/thermique", title: "thermique, effet peltier & thermistances", min: 30 }
      ]
    },
    {
      id: "lasers", num: "03", title: "le laser, en profondeur", sticker: "diode",
      desc: "principe, cavité et modes, faisceau gaussien, familles, diode laser, impulsions, accordabilité, sécurité.",
      img: "assets/img/mod-lasers.webp",
      pages: [
        { id: "lasers/principe", title: "le principe du laser", min: 35 },
        { id: "lasers/cavite-modes", title: "la cavité & ses modes", min: 40 },
        { id: "lasers/faisceau-gaussien", title: "le faisceau gaussien", min: 40 },
        { id: "lasers/familles", title: "les familles de lasers", min: 30 },
        { id: "lasers/diode-laser", title: "la diode laser", min: 50 },
        { id: "lasers/impulsions", title: "lasers impulsionnels", min: 35 },
        { id: "lasers/accordabilite", title: "accordabilité & stabilisation", min: 45 },
        { id: "lasers/securite", title: "sécurité laser", min: 40 }
      ]
    },
    {
      id: "amplis", num: "04", title: "les amplificateurs optiques", sticker: "fusee",
      desc: "gain, saturation, bruit ; EDFA, SOA, Raman, amplificateurs évasés ; amplis à fibre de puissance et leurs mesures.",
      img: "assets/img/mod-amplis.webp",
      pages: [
        { id: "amplis/principe", title: "amplifier la lumière : gain, saturation, bruit", min: 35 },
        { id: "amplis/edfa", title: "l'EDFA, ampli à fibre dopée erbium", min: 45 },
        { id: "amplis/soa-raman-ta", title: "SOA, Raman, TA & architecture MOPA", min: 35 },
        { id: "amplis/puissance-mesures", title: "fibres de puissance & mesures sur ampli", min: 40 }
      ]
    },
    {
      id: "electronique", num: "05", title: "électronique & intégration laser", sticker: "eclair",
      desc: "source de courant, protections, régulation TEC/PID, photodiode et TIA, acquisition, alimentations et CEM.",
      img: "assets/img/mod-electronique.webp",
      pages: [
        { id: "electronique/driver-courant", title: "piloter une diode laser : la source de courant", min: 45 },
        { id: "electronique/protection", title: "protéger une diode laser", min: 35 },
        { id: "electronique/tec-pid", title: "réguler la température : TEC & PID", min: 45 },
        { id: "electronique/photodetection", title: "détecter la lumière : photodiode & TIA", min: 45 },
        { id: "electronique/acquisition", title: "acquisition : ADC, DAC, I²C & SPI", min: 40 },
        { id: "electronique/alim-cem", title: "alimentations, masses & CEM", min: 35 }
      ]
    },
    {
      id: "systemes", num: "06", title: "systèmes & maintenance", sticker: "cle",
      desc: "anatomie d'un système laser, méthodes de maintenance, diagnostic, optique pratique, métrologie, sécurité au poste.",
      img: "assets/img/mod-systemes.webp",
      pages: [
        { id: "systemes/architecture", title: "anatomie d'un système laser", min: 30 },
        { id: "systemes/methodes-maintenance", title: "méthodes & indicateurs de maintenance", min: 40 },
        { id: "systemes/diagnostic", title: "diagnostic & dépannage", min: 40 },
        { id: "systemes/optique-pratique", title: "nettoyage, manipulation & alignement", min: 40 },
        { id: "systemes/metrologie", title: "métrologie & instruments de mesure", min: 40 },
        { id: "systemes/securite-poste", title: "sécurité au poste de travail", min: 30 }
      ]
    },
    {
      id: "projet", num: "07", title: "projet : mon banc de test laser", sticker: "framboise",
      desc: "un banc sur Raspberry Pi qui mesure L-I-V, seuil, rendement, spectre, profil de faisceau, polarisation et bruit. matériel expliqué, code python écrit par toi.",
      img: "assets/img/mod-projet.webp",
      pages: [
        { id: "projet/cahier-des-charges", title: "cahier des charges & architecture", min: 35 },
        { id: "projet/materiel", title: "le matériel & la nomenclature", min: 40 },
        { id: "projet/electronique-banc", title: "l'électronique du banc : schémas & câblage", min: 60 },
        { id: "projet/mecanique-optique", title: "mécanique, optique & alignement", min: 40 },
        { id: "projet/raspberry-setup", title: "préparer la raspberry pi", min: 35 },
        { id: "projet/logiciel-architecture", title: "architecture du logiciel python", min: 35 },
        { id: "projet/code-1-pilotes", title: "code 1 · pilotes des instruments", min: 60 },
        { id: "projet/code-2-mesures", title: "code 2 · séquences de mesure", min: 60 },
        { id: "projet/code-3-analyse", title: "code 3 · analyse des données", min: 60 },
        { id: "projet/code-4-interface", title: "code 4 · interface & rapport", min: 50 },
        { id: "projet/protocoles", title: "protocoles de mesure", min: 45 },
        { id: "projet/validation", title: "étalonnage, validation & suite", min: 40 }
      ]
    }
  ],
  tools: [
    { id: "seance", title: "ma séance du jour", file: "seance.html", sticker: "eclair", desc: "20 à 40 min guidées : révisions espacées, entraînement, nouvelle leçon, bilan." },
    { id: "parcours", title: "mon parcours", file: "parcours.html", sticker: "fusee", desc: "devenir technicien opto-électronique : étapes, liens GEII, compétences." },
    { id: "methode", title: "la méthode", file: "methode.html", sticker: "fantome", desc: "apprendre vite et pour longtemps : ce que la recherche a prouvé." },
    { id: "entrainement", title: "entraînement", file: "entrainement.html", sticker: "cle", desc: "52 types d'exercices tirés au sort, mélangés, corrigés pas à pas." },
    { id: "carnet", title: "mon carnet de notes", file: "carnet.html", sticker: "coeur", desc: "toutes tes notes, ton journal de bord, export en markdown." },
    { id: "fiches", title: "fiches de révision", file: "fiches.html", sticker: "etoile", desc: "cartes recto-verso avec répétition espacée (7 boîtes de Leitner)." },
    { id: "formulaire", title: "le formulaire", file: "formulaire.html", sticker: "pi", desc: "toutes les formules clés, avec unités et ordres de grandeur." },
    { id: "glossaire", title: "glossaire fr / en", file: "glossaire.html", sticker: "photon", desc: "le vocabulaire du métier, en français et en anglais." },
    { id: "labo", title: "labo python", file: "labo.html", sticker: "framboise", desc: "exercices python dans le navigateur, corrigés automatiquement." }
  ],
  but3: [
    { id: "but3/revision-s5", title: "révision S5 · maintenance & probas-stats", file: "but3/revision-s5-maintenance-maths.html", desc: "fiches de cours, TD corrigés, exercices d'annales." },
    { id: "but3/fiche-maintenance", title: "fiche maintenance S5", file: "but3/fiche-maintenance-s5.html", desc: "pièces de rechange, Wilson, point de commande, Weibull." },
    { id: "but3/cem", title: "CEM · révision interactive", file: "but3/cem/index.html", desc: "compatibilité électromagnétique : cours, exercices, labos." },
    { id: "but3/banc-cem", title: "CEM · le banc de mesure", file: "but3/cem/banc-cem-light.html", desc: "figure interactive du banc de mesure CEM." }
  ]
};
