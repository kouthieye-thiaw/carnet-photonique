"""Laser à cavité externe (ECDL) en configuration Littrow. Unités : mm.
Diode (face AR) -> lentille asphérique -> réseau de diffraction : l'ordre 1 revient dans la diode
(sélection de longueur d'onde), l'ordre 0 sort. Accord grossier par vis, fin par piézo.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from mathutils import Vector

A = args()
reset()
P = palette()
Z = 16.0
reseau_or = mat("reseau_or", "#e9c46a", metal=1.0, rough=0.12)
sillons = mat("reseau_sillons", "#9b7a2f", metal=1.0, rough=0.3)
piezo_m = mat("piezo", "#3d3430", rough=0.5)
tec_m = mat("tec", "#f4f1ea", rough=0.6)

# socle, élément Peltier (TEC) et dissipateur à ailettes
socle = box("socle", (76, 56, 6), (0, 0, 3), P["alu"], bevel=0.6)
tec = box("tec", (40, 40, 3.6), (0, 0, -1.8), tec_m, bevel=0.2)
tec_fils = [tube("tec_fil_rouge", [(20, -12, -1.8), (30, -16, -2), (40, -20, -6)], 0.6, P["rouge_btn"]),
            tube("tec_fil_noir", [(20, -8, -1.8), (31, -11, -2), (41, -14, -6)], 0.6, P["plastique_noir"])]
dissip = [box("dissipateur", (84, 64, 6), (0, 0, -6.6), P["alu_noir"], bevel=0.4)]
for i in range(11):
    dissip.append(box(f"ailette_{i}", (84, 1.6, 12), (0, -30 + i * 6, -15.6), P["alu_noir"], bevel=0.2))
g_tec = group("G_tec", [tec] + tec_fils, explode=(0, 0, -9))
g_dissip = group("G_dissipateur", dissip, explode=(0, 0, -22))

# monture de diode + tube de collimation + lentille asphérique
mont = box("monture_diode", (16, 22, 18), (-26, 0, Z), P["alu"], bevel=0.6)
to_can = cyl("diode_to_can", 2.8, 3.0, (-17.2, 0, Z), P["nickel"], rot=(0, 90, 0))
tube_col = cyl("tube_collimation", 5.0, 12, (-12, 0, Z), P["alu_noir"], rot=(0, 90, 0))
lentille = cyl("lentille_asph", 3.2, 1.6, (-5.6, 0, Z), P["verre"], rot=(0, 90, 0))
cables = [tube("cable_diode", [(-34, 0, Z), (-44, 0, Z + 2), (-50, 8, 8), (-46, 20, 6)], 1.5, P["caoutchouc"])]

# réseau en Littrow : angle tel que sin(theta) = lambda/(2d)  (780 nm, 1800 traits/mm -> 44,6°)
theta = math.degrees(math.asin(780e-6 * 1800 / 2))
phi = 90 - theta
c = Vector((22, 0, Z))
n = Vector((-math.cos(math.radians(theta)), math.sin(math.radians(theta)), 0))
reseau = box("reseau", (12, 3, 12), c, P["verre"], rot=(0, 0, phi))
face = box("reseau_face", (11.4, 0.3, 11.4), c + n * 1.6, reseau_or, rot=(0, 0, phi))
traits = []
for k in range(-5, 6):
    t = Vector((math.cos(math.radians(phi)), math.sin(math.radians(phi)), 0))  # axe X local du réseau
    traits.append(box(f"sillon_{k}", (0.25, 0.2, 11.2), c + n * 1.82 + t * k, sillons, rot=(0, 0, phi)))
bras = box("bras_pivot", (6, 26, 14), c + Vector((7, 6, 0)), P["alu"], rot=(0, 0, phi), bevel=0.4)
pivot = cyl("pivot_lame", 2.2, 16, c + Vector((5, -7, 0)), P["acier"], verts=24)
piezo = cyl("piezo", 3.2, 9, (34, 12, Z), piezo_m, rot=(0, 90, 0), verts=24)
piezo_fils = [tube("piezo_fil", [(38.5, 12, Z), (44, 14, Z + 2), (48, 18, 8)], 0.5, P["rouge_btn"])]
vis = [cyl("vis_reglage", 1.6, 18, (44, 18, Z), P["acier"], rot=(0, 90, 0), verts=20),
       cyl("vis_bouton", 4.5, 5, (55, 18, Z), P["plastique_noir"], rot=(0, 90, 0), verts=32)]
g_reseau = group("G_reseau", [reseau, face, bras] + traits)

# miroir de renvoi (garde la direction de sortie fixe)
d_in = Vector((1, 0, 0))
d0 = d_in - 2 * d_in.dot(n) * n            # ordre 0 réfléchi
p_m = c + d0 * 28
nm = (Vector((1, 0, 0)) - d0).normalized()
phim = math.degrees(math.atan2(-nm.x, nm.y))
miroir = box("miroir_renvoi", (10, 2.5, 10), p_m, P["acier"], rot=(0, 0, phim), bevel=0.3)
miroir_support = box("miroir_support", (8, 8, Z - 6 - 5), (p_m.x, p_m.y, 6 + (Z - 11) / 2), P["alu"], bevel=0.3)

# faisceaux
b1 = beam("beam_collimate", (-4.8, 0, Z), (c.x - 1.5, 0, Z), 1.4, "#e2372b", flat=0.45, flat_axis="y", speed=2.0)
b2 = beam("beam_retour_ordre1", (c.x - 1.5, 0, Z), (-4.8, 0, Z), 1.2, "#e2372b", flat=0.45, flat_axis="y", speed=2.0, opacity=0.45)
b3 = beam("beam_ordre0", c + n * 1.7, p_m, 1.3, "#e2372b", speed=2.0)
b4 = beam("beam_sortie", p_m, p_m + Vector((60, 0, 0)), 1.3, "#e2372b", speed=2.0)

hotspot("hs_diode", (-24, 0, Z + 10))
hotspot("hs_collimation", (-8, 0, Z + 6.5))
hotspot("hs_cavite", (8, 0, Z + 2))
hotspot("hs_reseau", (c.x - 2, 2, Z + 7.5), g_reseau)
hotspot("hs_piezo", (34, 12, Z + 4))
hotspot("hs_vis", (55, 18, Z + 5))
hotspot("hs_miroir", (p_m.x, p_m.y, Z + 6))
hotspot("hs_sortie", (p_m.x + 40, p_m.y, Z + 2))
hotspot("hs_tec", (20, -20, -1.8), g_tec)
hotspot("hs_dissipateur", (-30, -32, -12), g_dissip)

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    render(A["png"], view=(0.35, -1.0, 0.8), w=A["w"], h=A["h"], samples=A["samples"], focal=60, margin=0.86)
