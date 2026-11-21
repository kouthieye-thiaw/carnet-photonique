#!/usr/bin/env bash
# Régénère tous les modèles 3D (.glb) et toutes les images (.png) du carnet.
# Usage : bash blender/build_all.sh [échantillons]      (depuis la racine du dépôt)
set -euo pipefail
cd "$(dirname "$0")/.."
S=${1:-96}
B="blender -b --factory-startup --python"
run() { echo "== $1"; $B "blender/$1" -- "${@:2}" 2>&1 | grep -E "GLB_OK|PNG_OK|Error|Traceback|line [0-9]+" || true; }
run to_can.py  --glb assets/models/to-can.glb  --png assets/img/mod-lasers.png      --samples "$S" --size 1000x620
run cavite.py  --glb assets/models/cavite.glb  --png assets/img/cavite.png          --samples "$S" --size 1200x700
run ecdl.py    --glb assets/models/ecdl.glb    --png assets/img/ecdl.png            --samples "$S" --size 1200x760
run edfa.py    --glb assets/models/edfa.glb    --png assets/img/mod-amplis.png      --samples "$S" --size 1000x620
run fibre.py   --glb assets/models/fibre.glb   --png assets/img/mod-systemes.png    --samples "$S" --size 1000x620
run gauss.py   --glb assets/models/gauss.glb   --png assets/img/mod-maths.png       --samples "$S" --size 1000x620
run prisme.py  --png assets/img/mod-physique.png --samples "$S" --size 1000x620
run banc.py    --glb assets/models/banc.glb    --png assets/img/mod-projet.png --png2 assets/img/mod-electronique.png --samples "$S" --size 1000x620
run lentille.py --png assets/img/mod-decouvrir.png --samples "$S" --size 1000x620
run hero.py    --png assets/img/hero.png --samples "$S" --size 1400x1100
echo "terminé."
