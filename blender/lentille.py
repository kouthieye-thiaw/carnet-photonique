"""Lentille convergente qui focalise trois faisceaux parallèles (vignette du module « l'optique en partant de zéro »)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

A = args()
reset()
P = palette()
verre = mat("verre_lentille", "#f4fbff", rough=0.0, transmission=1.0, ior=1.52, alpha=0.4)

zc = 34.0          # hauteur de l'axe optique
f = 52.0           # focale (unités de la scène)
# lentille biconvexe : sphère aplatie le long de l'axe X
lent = sphere("lentille", 1.0, (0, 0, zc), verre, seg=64)
lent.scale = (5.5, 25.0, 25.0)
# monture : bague noire, tige et socle
bague = torus("bague", 25.6, 2.0, (0, 0, zc), P["alu_noir"], rot=(0, 90, 0), maj=96, mino=16)
tige = cyl("tige", 2.4, 8.5, (0, 0, 4.25), P["alu"], verts=32, bevel=0.3)
socle = cyl("socle", 16, 2.6, (0, 0, -1.3), P["plastique_creme"], verts=96, bevel=0.8)
# trois faisceaux parallèles qui convergent au foyer, puis divergent vers un petit écran
for k, dy in enumerate((-13.0, 0.0, 13.0)):
    beam(f"beam_in_{k}", (-100, dy, zc), (0, dy, zc), 1.5, "#e2372b", speed=1.5)
    end = (f + 34, -dy * 34 / f, zc)
    beam(f"beam_out_{k}", (0, dy, zc), end, 1.3, "#e2372b", speed=1.5)
ecran = box("ecran", (1.6, 34, 30), (f + 36, 0, zc), P["plastique_creme"], bevel=0.6)
pied = cyl("pied_ecran", 1.8, zc - 15, (f + 36, 0, (zc - 15) / 2), P["alu"], verts=24)
base2 = cyl("socle_ecran", 9, 2.2, (f + 36, 0, -1.1), P["plastique_creme"], verts=64, bevel=0.6)

if A["png"]:
    render(A["png"], view=(0.28, -1.0, 0.42), w=A["w"], h=A["h"], samples=A["samples"], focal=50, margin=0.6,
           extra=[(-100, 13, zc), (f + 36, -15, zc)], beam_strength=4.0)
