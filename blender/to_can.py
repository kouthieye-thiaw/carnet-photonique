"""Diode laser en boîtier TO-56 (Ø 5,6 mm), en vue éclatée. Unités : mm.
blender -b --factory-startup --python blender/to_can.py -- --glb assets/models/to-can.glb --png assets/img/mod-lasers.png
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

A = args()
reset()
P = palette()
verre_ar = mat("verre_ar", "#dcecff", rough=0.02, transmission=1.0, ior=1.5, alpha=0.38)
verre_scel = mat("verre_scellement", "#26323c", rough=0.08, coat=0.8)
rouge = mat("zone_active", "#ff3b2f", emit="#ff2a1a", strength=12.0)

# --- embase (header) dorée + détrompeur
embase = cyl("embase", 2.8, 1.2, (0, 0, 0.6), P["or"], verts=96, bevel=0.06)
detromp = box("detrompeur", (0.5, 0.6, 1.2), (0, -2.75, 0.6), P["or"])

# --- broches : LD, PD (isolées par du verre), COMMUN (soudée au boîtier)
import math
pins = []
for nom, ang, haut in (("broche_LD", 30, 1.75), ("broche_PD", 150, 1.75), ("broche_COM", 270, 0.0)):
    x, y = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    top = haut if haut else 0.0
    p = cyl(nom, 0.22, 9.0 + top, (x, y, -9.0 / 2 + top / 2), P["or"], verts=24)
    pins.append(p)
    if haut:
        pins.append(cyl(nom + "_verre", 0.45, 0.08, (x, y, 1.24), verre_scel, verts=32))

# --- dissipateur (plot) et embase céramique (submount AlN)
plot = box("dissipateur", (1.4, 1.0, 2.4), (0, 0.35, 2.4), P["or"], bevel=0.04)
submount = box("submount_AlN", (0.72, 0.18, 1.0), (0, -0.24, 3.1), P["ceramique"], bevel=0.015)
puce = box("puce_laser", (0.32, 0.12, 0.62), (0, -0.39, 3.29), P["silicium"], bevel=0.008)
bande = box("zone_active", (0.05, 0.012, 0.63), (0, -0.452, 3.29), rouge)
bande["glow"] = 1
spot = cyl("facette_emission", 0.05, 0.01, (0, -0.39, 3.605), rouge, verts=16)
fil_ld = tube("fil_LD", [(0, -0.45, 3.5), (0.25, -0.85, 3.95), (0.8, -0.3, 3.2), (0.866, 0.5, 1.8)], 0.022, P["or"])

# --- photodiode moniteur (inclinée pour ne pas renvoyer de lumière dans le laser)
pd = box("photodiode_moniteur", (0.85, 0.85, 0.16), (0, -0.39, 1.36), P["silicium"], rot=(8, 0, 0), bevel=0.01)
pd_pad = box("photodiode_plot", (0.18, 0.18, 0.02), (0.25, -0.2, 1.47), P["or"], rot=(8, 0, 0))
fil_pd = tube("fil_PD", [(0.25, -0.2, 1.48), (-0.2, 0.2, 2.0), (-0.866, 0.5, 1.8)], 0.02, P["or"])

# --- capot nickelé + fenêtre traitée antireflet
capot = shell_cylinder("capot", 2.15, 3.8, 0.12, (0, 0, 3.1), P["nickel"], top=True, hole=0.78, verts=96)
levre = torus("capot_levre", 2.28, 0.13, (0, 0, 1.33), P["nickel"], maj=96)
fenetre = cyl("fenetre", 0.95, 0.1, (0, 0, 4.86), verre_ar, verts=64)

# --- faisceau : très divergent et elliptique (axe rapide ⟂ jonction = axe Y)
fx = beam("beam_diode", (0, -0.39, 3.61), (0, -0.39, 16.0), 0.03, "#e2372b", r_end=3.3, flat=0.33, flat_axis="x", speed=1.4)

# --- groupes pour la vue éclatée (vecteurs en mm, Z vers le haut)
g_capot = group("G_capot", [capot, levre, fenetre], explode=(0, 0, 7.5))
g_puce = group("G_puce", [submount, puce, bande, spot, fil_ld, fx], explode=(0, -4.2, 2.2))
g_pd = group("G_photodiode", [pd, pd_pad, fil_pd], explode=(3.4, -3.2, 0.6))
g_broches = group("G_broches", pins, explode=(0, 0, -3.5))

# --- points d'intérêt (étiquettes)
hotspot("hs_embase", (2.85, 0.4, 0.6))
hotspot("hs_broches", (0.866, 0.5, -6.5), g_broches)
hotspot("hs_dissipateur", (0.72, 0.6, 2.9))
hotspot("hs_puce", (0.18, -0.46, 3.25), g_puce)
hotspot("hs_photodiode", (0.4, -0.6, 1.4), g_pd)
hotspot("hs_capot", (-2.2, 0, 4.2), g_capot)
hotspot("hs_fenetre", (0, 0.6, 5.0), g_capot)
hotspot("hs_faisceau", (0, -0.39, 13.0), g_puce)

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    lay_down("Y", 90)            # couchée : broches à gauche, faisceau vers la droite
    render(A["png"], view=(0.35, -1.0, 0.62), w=A["w"], h=A["h"], samples=A["samples"], focal=70, margin=0.9,
           extra=[(9.0, 0, 2.8)])
