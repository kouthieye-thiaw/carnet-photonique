// Arbre de diagnostic interactif pour un système laser
const S = {
  noemit: { t: "le laser n'émet pas", start: "a1" },
  low: { t: "puissance trop faible", start: "p1" },
  unstable: { t: "puissance instable", start: "s1" },
  lambda: { t: "longueur d'onde instable / multimode", start: "w1" },
  beam: { t: "faisceau déformé", start: "b1" }
};
const N = {
  a1: { q: "Le voyant d'émission est-il allumé, sans alarme au contrôleur ?", y: "a2", n: "a1b" },
  a1b: { q: "Une alarme d'interlock, de clé ou d'arrêt d'urgence est-elle affichée ?", y: "E_inter", n: "a1c" },
  a1c: { q: "Une alarme de température (ou de capteur) est-elle affichée ?", y: "E_temp", n: "E_ctrl" },
  a2: { q: "Le courant mesuré dans la diode correspond-il à la consigne ?", y: "a3", n: "a2b" },
  a2b: { q: "Le courant mesuré est-il nul ?", y: "E_open", n: "E_compl" },
  a3: { q: "La tension aux bornes de la diode est-elle normale (comparée à la fiche de test) ?", y: "a4", n: "E_diode" },
  a4: { q: "Une carte de visualisation ou un puissance-mètre voit-il de la lumière juste à la sortie de la tête ?", y: "E_path", n: "E_intern" },
  p1: { q: "La puissance a-t-elle baissé progressivement, sur des semaines ?", y: "p2", n: "p3" },
  p2: { q: "En APC le courant a augmenté — ou en ACC la puissance a baissé à courant constant ?", y: "E_aging", n: "E_meas" },
  p3: { q: "La baisse est-elle apparue après une intervention, un transport ou un choc ?", y: "E_align", n: "p4" },
  p4: { q: "La température est-elle à sa consigne et stable ?", y: "E_optics", n: "E_thermal" },
  s1: { q: "Les variations sont-elles lentes (minutes) et suivent-elles la température de la pièce ?", y: "E_drift", n: "s2" },
  s2: { q: "Le spectre de bruit montre-t-il des raies (50 Hz, 100 Hz, kHz) ?", y: "E_elec", n: "s3" },
  s3: { q: "Voit-on des sauts brusques entre deux niveaux de puissance ?", y: "E_hop", n: "E_vib" },
  w1: { q: "La température de la diode est-elle régulée et stable ?", y: "w2", n: "E_thermal" },
  w2: { q: "Un retour de lumière est-il possible (pas d'isolateur, connecteur UPC, surface perpendiculaire au faisceau) ?", y: "E_feed", n: "w3" },
  w3: { q: "Le point de fonctionnement (courant, température) est-il proche d'un saut de mode connu ?", y: "E_point", n: "E_cav" },
  b1: { q: "La déformation est-elle déjà présente à la sortie de la tête laser ?", y: "b2", n: "E_down" },
  b2: { q: "Le profil change-t-il quand on change la puissance ?", y: "E_lens", n: "E_inalign" }
};
const E = {
  E_inter: ["boucle d'interlock ouverte", ["capot, porte ou clé ouvert", "arrêt d'urgence enclenché (à réarmer)", "connecteur d'interlock débranché ou fil coupé"], ["vérifier chaque contact de la chaîne à l'ohmmètre (système hors tension)", "ne JAMAIS shunter un interlock pour « tester »"]],
  E_temp: ["défaut de régulation thermique", ["CTN débranchée ou en court-circuit", "Peltier en panne ou inversé", "dissipateur saturé, ventilateur arrêté, eau coupée"], ["lire la température et la commande du Peltier", "vérifier ventilation / refroidissement", "mesurer la CTN et le Peltier hors tension"]],
  E_ctrl: ["contrôleur non prêt", ["séquence de démarrage non terminée (temporisation)", "défaut logiciel ou de communication", "alimentation du contrôleur"], ["lire le journal d'erreurs", "redémarrer proprement dans l'ordre prévu", "noter version logicielle et messages"]],
  E_open: ["circuit de la diode ouvert", ["relais de court-circuit resté fermé (commande absente)", "connecteur ou câble de la tête", "fusible / limite à zéro"], ["mesurer la continuité du câble (hors tension)", "vérifier la commande du relais", "contrôler les broches du connecteur"]],
  E_compl: ["le driver n'atteint pas la consigne", ["tension de compliance insuffisante", "limite de courant atteinte", "résistance de contact (connecteur oxydé)"], ["mesurer la tension disponible", "comparer V diode à la fiche de test", "nettoyer / remplacer le connecteur"]],
  E_diode: ["diode endommagée électriquement", ["tension trop basse : jonction claquée (ESD, tension inverse)", "tension trop haute : mauvais contact, soudure fissurée"], ["tracer la caractéristique V-I à faible courant (charge factice d'abord !)", "rechercher la cause (historique) avant de remplacer"]],
  E_path: ["la lumière se perd après la tête", ["obturateur fermé", "connecteur ou fibre sale/cassée", "désalignement d'une optique aval", "puissance-mètre réglé sur la mauvaise longueur d'onde"], ["suivre le faisceau avec la carte, élément par élément", "inspecter et nettoyer les connecteurs", "vérifier le réglage λ de l'instrument"]],
  E_intern: ["courant normal mais pas de lumière", ["facette détruite (COD) : la diode conduit mais n'émet plus", "obturateur ou désalignement internes"], ["comparer le courant de seuil à la fiche", "pas d'ouverture de tête hors procédure : retour usine (RMA)"]],
  E_aging: ["vieillissement normal", ["usure de la diode (seuil ↑, pente ↓)", "usure de la pompe (lasers pompés)"], ["tracer la tendance courant/puissance (GMAO)", "planifier le remplacement (maintenance conditionnelle)", "commander la pièce à temps"]],
  E_meas: ["problème de mesure plutôt que de laser", ["tête de mesure sale ou mal étalonnée", "mauvais réglage de longueur d'onde", "faisceau partiellement hors de la zone active"], ["vérifier avec un second instrument étalonné", "refaire la mesure de zéro"]],
  E_align: ["désalignement ou connectique", ["choc pendant le transport", "optique desserrée après intervention", "connecteur mal enfiché ou sali"], ["vérifier les points de passage (diaphragmes)", "réaligner selon la procédure, une vis à la fois", "inspecter les connecteurs"]],
  E_optics: ["pertes optiques", ["optique sale, rayée ou brûlée", "fenêtre de sortie contaminée", "fibre trop courbée"], ["inspection à la lampe rasante / microscope", "nettoyage selon la procédure (module 06)", "remplacer l'optique brûlée"]],
  E_thermal: ["régulation thermique défaillante", ["PID mal réglé ou capteur décollé", "refroidissement insuffisant", "Peltier vieillissant"], ["enregistrer consigne, mesure et commande", "vérifier pâte thermique, ventilateurs, débit d'eau"]],
  E_drift: ["dérive thermique lente", ["température ambiante (clim), courants d'air", "étalon parasite (lame à faces parallèles)", "polarisation qui tourne dans une fibre non PM"], ["corréler avec un enregistrement de température", "incliner les lames, capoter le montage", "utiliser une fibre PM ou fixer la fibre"]],
  E_elec: ["bruit électrique", ["boucle de masse (50 Hz)", "alimentation à découpage, PWM du Peltier (kHz)", "câble non blindé près d'une source"], ["méthode d'élimination : couper une source à la fois", "masse en étoile, paires torsadées, filtres LC"]],
  E_hop: ["sauts de mode", ["retour optique dans le laser", "point de fonctionnement entre deux modes"], ["vérifier l'isolateur et les connecteurs APC", "décaler légèrement courant ou température"]],
  E_vib: ["vibrations / acoustique", ["pompe, ventilateur, compresseur sur la même table", "turbulences d'air sur un long trajet"], ["isoler la table, capoter le faisceau", "corréler avec un accéléromètre ou en coupant les machines"]],
  E_feed: ["retour optique", ["pas d'isolateur", "connecteur PC/UPC au lieu d'APC", "optique perpendiculaire renvoyant dans le laser"], ["ajouter/vérifier l'isolateur", "incliner légèrement les optiques", "connecteurs APC"]],
  E_point: ["point de fonctionnement instable", ["courant/température à la frontière de deux modes"], ["cartographier λ(I,T) et choisir un point au milieu d'une plage stable"]],
  E_cav: ["cavité externe déréglée ou vieillie", ["réseau désaligné (rétroaction faible)", "diode à facette AR dégradée"], ["optimiser la rétroaction (seuil minimal)", "procédure constructeur de réalignement"]],
  E_down: ["défaut en aval de la tête", ["optique aval sale ou endommagée", "faisceau coupé par une monture (vignettage)", "lentille décentrée ou inclinée"], ["remonter le faisceau en le regardant à chaque élément", "recentrer, nettoyer"]],
  E_lens: ["effet thermique dans le laser", ["lentille thermique (pompage, échauffement)", "modes transverses supérieurs à forte puissance"], ["vérifier le refroidissement", "travailler à la puissance spécifiée", "contrôler M² en fonction de la puissance"]],
  E_inalign: ["défaut interne à la tête", ["désalignement interne", "optique interne contaminée"], ["comparer au profil de la fiche de test", "retour usine si la tête est scellée"]]
};
export default function (el) {
  const box = document.createElement("div"); box.style.marginTop = "6px"; el.appendChild(box);
  let path = [];
  function home() {
    path = [];
    box.innerHTML = `<p class="small">Quel est le symptôme ?</p><div class="btns">${Object.entries(S).map(([k, v]) => `<button type="button" class="pill small" data-s="${k}">${v.t}</button>`).join("")}</div>`;
    box.querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => { path = [S[b.dataset.s].t]; show(S[b.dataset.s].start); }));
  }
  function crumbs() { return `<p class="small" style="margin:0 0 10px">${path.map(p => `<span class="tag soft" style="margin:2px">${p}</span>`).join(" ")}</p>`; }
  function show(id) {
    if (E[id]) {
      const [t, causes, actions] = E[id];
      box.innerHTML = crumbs() + `<div class="box retiens" style="margin-top:6px"><p class="box-title">piste : ${t}</p><p><strong>causes probables</strong></p><ul>${causes.map(c => `<li>${c}</li>`).join("")}</ul><p><strong>actions</strong></p><ul>${actions.map(a => `<li>${a}</li>`).join("")}</ul><p class="small">Une modification à la fois, et note tout dans le journal de bord.</p></div><div class="btns"><button type="button" class="pill small" data-r>nouveau diagnostic</button><button type="button" class="pill small ghost" data-c>copier le diagnostic</button></div>`;
      box.querySelector("[data-r]").addEventListener("click", home);
      box.querySelector("[data-c]").addEventListener("click", () => { const txt = `Diagnostic : ${path.join(" → ")}\nPiste : ${t}\nCauses : ${causes.join(" ; ")}\nActions : ${actions.join(" ; ")}`; navigator.clipboard && navigator.clipboard.writeText(txt); });
      return;
    }
    const n = N[id];
    box.innerHTML = crumbs() + `<p style="font-size:20px;font-weight:600;margin:6px 0 12px">${n.q}</p><div class="btns"><button type="button" class="pill" data-y>oui</button><button type="button" class="pill" data-n>non</button><button type="button" class="pill small ghost" data-r>recommencer</button></div>`;
    box.querySelector("[data-y]").addEventListener("click", () => { path.push("oui"); show(n.y); });
    box.querySelector("[data-n]").addEventListener("click", () => { path.push("non"); show(n.n); });
    box.querySelector("[data-r]").addEventListener("click", home);
  }
  home();
}
