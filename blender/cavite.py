"""Cavité laser à solide pompée par diode (type Nd:YAG, pompage longitudinal). Unités : mm.
Pompe 808 nm -> lentille -> miroir dichroïque HR -> barreau Nd:YAG -> coupleur de sortie -> 1064 nm.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

A = args()
reset()
P = palette()
Z = 30.0  # hauteur de l'axe optique
yag = mat("nd_yag", "#d8b4ee", rough=0.03, transmission=0.95, ior=1.82, alpha=0.55)
hr = mat("traitement_hr", "#8fd0c4", metal=0.85, rough=0.05)
oc = mat("coupleur", "#c7d2ff", metal=0.4, rough=0.04, transmission=0.5, alpha=0.6)
eau = mat("tuyau_eau", "#3b82f6", rough=0.35, alpha=0.85)

rail = box("rail", (170, 26, 8), (0, 0, 4), P["alu_noir"], bevel=0.8)
rainure = box("rail_rainure", (170, 6, 1.2), (0, 0, 8.2), P["plastique_noir"])

def poteau(x, h=Z - 8, r=4.5):
    return cyl(f"poteau_{x}", r, h, (x, 0, 8 + h / 2), P["acier"], verts=32)

# 1. module de pompe (diode laser 808 nm) avec ailettes
pompe = [box("pompe_corps", (20, 22, 16), (-66, 0, Z), P["alu"], bevel=0.8), poteau(-66, Z - 16)]
for i in range(6):
    pompe.append(box(f"pompe_ailette_{i}", (18, 1.4, 7), (-66, -8.75 + i * 3.5, Z + 11.5), P["alu"], bevel=0.2))
pompe.append(cyl("pompe_sortie", 3.0, 2.0, (-55.2, 0, Z), P["puce_noire"], rot=(0, 90, 0)))
pompe.append(tube("pompe_cable", [(-76, 0, Z - 2), (-86, 0, Z - 6), (-88, 6, 9), (-84, 14, 9)], 1.6, P["caoutchouc"]))

# 2. lentille de focalisation
lent = [cyl("lentille", 7.0, 3.0, (-46, 0, Z), P["verre"], rot=(0, 90, 0)),
        torus("lentille_monture", 8.2, 1.3, (-46, 0, Z), P["alu_noir"], rot=(0, 90, 0)), poteau(-46, Z - 16, 3.5)]

# 3. miroir haute réflexion (dichroïque : HR à 1064, transparent à 808)
def monture(x, nom, mm):
    parts = [box(nom + "_plaque", (4, 30, 30), (x - 2.5, 0, Z), P["alu"], bevel=0.6),
             box(nom + "_plaque_av", (4, 30, 30), (x + 2.5, 0, Z), P["alu_noir"], bevel=0.6),
             cyl(nom + "_optique", 6.35, 3.0, (x + 5.2, 0, Z), mm, rot=(0, 90, 0)),
             poteau(x, Z - 15 - 8)]
    for k, (dy, dz) in enumerate(((10, 10), (-10, 10), (10, -10))):
        parts.append(cyl(f"{nom}_vis_{k}", 2.2, 9, (x - 8.5, dy, Z + dz), P["acier"], rot=(0, 90, 0), verts=24))
        parts.append(cyl(f"{nom}_bouton_{k}", 3.6, 3.0, (x - 13.5, dy, Z + dz), P["plastique_noir"], rot=(0, 90, 0), verts=24))
    return parts
m_hr = monture(-36, "miroir_hr", hr)

# 4. milieu amplificateur : barreau Nd:YAG dans un bloc de cuivre refroidi à l'eau
barreau = cyl("barreau_ndyag", 3.0, 40.0, (-6, 0, Z), yag, rot=(0, 90, 0), verts=48)
bloc_bas = box("bloc_cuivre_bas", (30, 18, 9), (-6, 0, Z - 7.5), P["cuivre"], bevel=0.5)
bloc_haut = box("bloc_cuivre_haut", (30, 18, 9), (-6, 0, Z + 7.5), P["cuivre"], bevel=0.5)
raccords = [cyl("raccord_eau_1", 1.8, 10, (-14, 12, Z - 7.5), P["laiton"] if "laiton" in P else P["or"], rot=(90, 0, 0), verts=20),
            cyl("raccord_eau_2", 1.8, 10, (2, 12, Z - 7.5), P["or"], rot=(90, 0, 0), verts=20),
            tube("tuyau_eau_1", [(-14, 17, Z - 7.5), (-14, 26, Z - 9), (-16, 30, 10)], 1.9, eau),
            tube("tuyau_eau_2", [(2, 17, Z - 7.5), (2, 26, Z - 9), (4, 30, 10)], 1.9, eau)]
socle = box("bloc_socle", (26, 16, Z - 12 - 8), (-6, 0, 8 + (Z - 12 - 8) / 2), P["alu"], bevel=0.5)
g_haut = group("G_bloc_haut", [bloc_haut], explode=(0, 0, 16))

# 5. coupleur de sortie (miroir partiellement réfléchissant)
m_oc = monture(30, "coupleur", oc)

# 6. faisceaux
fp1 = beam("beam_pompe_1", (-55, 0, Z), (-46, 0, Z), 1.0, "#8f2a14", r_end=3.6, speed=1.2)
fp2 = beam("beam_pompe_2", (-46, 0, Z), (-26, 0, Z), 3.6, "#8f2a14", r_end=0.35, speed=1.2)
fa = beam("beam_cavite_aller", (-30.8, 0, Z), (35.2, 0, Z), 0.9, "#e2372b", speed=2.2, opacity=0.6)
fr = beam("beam_cavite_retour", (35.2, 0, Z), (-30.8, 0, Z), 0.9, "#e2372b", speed=2.2, opacity=0.6)
fs = beam("beam_sortie", (35.4, 0, Z), (92, 0, Z), 1.0, "#e2372b", speed=2.0)

# points d'intérêt
hotspot("hs_pompe", (-66, 0, Z + 16))
hotspot("hs_lentille", (-46, 0, Z + 10))
hotspot("hs_miroir_hr", (-32, 0, Z + 17))
hotspot("hs_milieu", (-20, 0, Z + 2))
hotspot("hs_refroidissement", (-6, 0, Z + 12.5), g_haut)
hotspot("hs_faisceau", (14, 0, Z + 1.5))
hotspot("hs_coupleur", (34, 0, Z + 17))
hotspot("hs_reglage", (-49.5, 10, Z + 10))
hotspot("hs_sortie", (70, 0, Z + 1.5))

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    render(A["png"], view=(0.55, -1.0, 0.55), w=A["w"], h=A["h"], samples=A["samples"], focal=60, margin=0.86)
