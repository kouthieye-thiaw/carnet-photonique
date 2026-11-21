# carnet photonique

**Kouthieye Thiaw** — technicien laser & photonique en devenir · BUT3 GEII

Ma bibliothèque d'apprentissage et de développement de compétences : la physique du laser, les amplificateurs optiques, l'électronique qui fait vivre une diode laser, la maintenance des systèmes — et un **banc de test de diode laser piloté par une Raspberry Pi**, que je construis et que je programme moi-même en Python.

**Le site : https://kouthieye-thiaw.github.io/carnet-photonique/**

## ce qu'il y a dedans

| module | contenu |
|---|---|
| 01 · les maths utiles | décibels, exponentielles, complexes, équations différentielles, Fourier, statistiques et incertitudes |
| 02 · la physique de la lumière | photon, optique géométrique et ondulatoire, polarisation, émission stimulée, semi-conducteurs, thermique |
| 03 · le laser, en profondeur | principe, cavité et modes, faisceau gaussien, familles de lasers, diode laser, impulsions, accordabilité, sécurité |
| 04 · les amplificateurs optiques | gain, saturation, bruit, EDFA, SOA, Raman, mesures en fibre |
| 05 · électronique & intégration laser | source de courant, protections, régulation TEC/PID, photodétection, acquisition, alimentation et CEM |
| 06 · systèmes & maintenance | architecture, méthodes de maintenance, diagnostic, optique pratique, métrologie, sécurité au poste |
| 07 · projet : mon banc de test laser | cahier des charges, matériel, électronique, mécanique et optique, Raspberry Pi, logiciel en 4 étapes, protocoles, validation |

Chaque leçon combine explications, schémas, **simulations interactives** (une quarantaine), **modèles 3D** réalisés avec Blender, exercices corrigés, quiz et encadrés « sur le terrain ».

Les outils : **mon carnet** (notes de chaque leçon, journal de bord, export Markdown, sauvegarde), **fiches de révision** (répétition espacée), **formulaire**, **glossaire français / anglais** et **labo Python** (exercices exécutés dans le navigateur avec Pyodide). La section **mes cours BUT3** rassemble mes pages de révision du semestre 5 (maintenance, probabilités-statistiques, CEM).

Les notes, la progression et les scores restent dans le navigateur (stockage local) : rien n'est envoyé sur Internet. Pense à exporter une sauvegarde depuis « mon carnet ».

## utiliser le site sur son ordinateur

Aucun outil de compilation : ce sont des pages statiques.

```bash
git clone https://github.com/kouthieye-thiaw/carnet-photonique.git
cd carnet-photonique
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Les vues 3D demandent un navigateur avec WebGL (sinon une image du modèle s'affiche). Le labo Python télécharge Pyodide (≈ 10 Mo) à la première utilisation.

## le code du banc : `projet-banc/`

Le paquet `banclaser` est un **kit à compléter** : les pilotes (ADS1115, MCP4725, driver laser, régulation de température), les séquences de mesure et les analyses (L-I-V, D4σ et M² selon ISO 11146, polarisation, bruit) sont à écrire soi-même, guidés par les pages « code 1 » à « code 4 » du module 07 et par des tests `pytest`. Un **banc simulé** imite le matériel au niveau des octets I²C : tout se développe sur PC, puis tourne tel quel sur la Raspberry Pi.

```bash
cd projet-banc
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"        # sur la Raspberry Pi : pip install -e ".[dev,pi]"
pytest                         # au départ, seuls les tests du simulateur passent
```

## structure

```
index.html            accueil
maths/ physique/ lasers/ amplis/ electronique/ systemes/ projet/   les leçons
carnet.html fiches.html formulaire.html glossaire.html labo.html    les outils
but3/                 pages de révision BUT3 (avec une barre de retour vers le carnet)
assets/css/           charte graphique (carnet.css) et polices
assets/js/            moteur du site (carnet.js), plan du site, visionneuse 3D, simulations (widgets/)
assets/data/          glossaire, fiches, exercices du labo
assets/models/        modèles 3D (.glb)
blender/              scripts Blender qui génèrent les modèles et les images
projet-banc/          kit Python du banc de test
```

Régénérer les modèles 3D et les images (Blender 4 ou plus récent) :

```bash
bash blender/build_all.sh 96
uv run --with pillow python blender/to_webp.py
```

## crédits

- [three.js](https://threejs.org/) (licence MIT) pour les vues 3D, [KaTeX](https://katex.org/) (licence MIT) pour les formules, [Pyodide](https://pyodide.org/) (licence MPL 2.0) pour le labo Python ;
- polices Fraunces, Geist, Geist Mono et Caveat, sous licence SIL Open Font License 1.1 (textes dans `assets/fonts/`) ;
- contenus, simulations, modèles 3D et code : Kouthieye Thiaw, avec l'aide de Claude (Anthropic).
