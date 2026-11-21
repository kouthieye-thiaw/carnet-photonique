"""Module EDFA (amplificateur à fibre dopée erbium), capot retiré. Unités : mm.
Entrée -> coupleur de prélèvement + photodiode -> isolateur -> multiplexeur 980/1550 (WDM)
-> fibre dopée erbium (bobine, pompée à 980 nm) -> isolateur -> prélèvement + photodiode -> sortie.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa

A = args()
reset()
P = palette()
edf = mat("fibre_edf", "#5be08f", rough=0.35, emit="#38e07a", strength=2.5)
iso_m = mat("isolateur", "#1d3f7a", metal=0.3, rough=0.35)
apc = mat("connecteur_apc", "#1f9d55", rough=0.4)
lid = mat("butterfly_capot", "#cfc7b5", metal=1.0, rough=0.25)
R = 0.45  # rayon des fibres (gaine 900 µm, exagéré)
ZF = 6.0

# boîtier ouvert
fond = box("boitier_fond", (140, 100, 2.5), (0, 0, 1.25), P["alu"], bevel=0.4)
murs = [box("mur_avant", (140, 2.5, 20), (0, -48.75, 12.5), P["alu"], bevel=0.3),
        box("mur_arriere", (140, 2.5, 20), (0, 48.75, 12.5), P["alu"], bevel=0.3),
        box("mur_gauche", (2.5, 100, 20), (-68.75, 0, 12.5), P["alu"], bevel=0.3),
        box("mur_droit", (2.5, 100, 20), (68.75, 0, 12.5), P["alu"], bevel=0.3)]
plaque = box("plaque_marquage", (40, 0.4, 9), (0, -50.1, 13), P["plastique_creme"])

def connecteur(x, nom):
    parts = [box(nom + "_traversee", (11, 5, 10), (x, -50.5, 11), apc, bevel=0.4),
             box(nom + "_fiche", (9, 14, 7.4), (x, -59.5, 11), apc, bevel=0.5),
             cone(nom + "_manchon", 3.2, 1.6, 14, (x, -73.5, 11), P["plastique_noir"], rot=(90, 0, 0)),
             tube(nom + "_cordon", [(x, -80, 11), (x, -92, 10), (x + (8 if x > 0 else -8), -104, 4), (x + (12 if x > 0 else -12), -112, 1.5)], 1.5, P["fibre_jaune"])]
    return parts
c_in = connecteur(-50, "entree")
c_out = connecteur(55, "sortie")

def composant(nom, p0, p1, r, m):
    return cyl_between(nom, p0, p1, r, m, verts=32)

tap_in = composant("prelevement_entree", (-50, -43, ZF), (-50, -18, ZF), 1.6, P["acier"])
pd_in = composant("photodiode_entree", (-62, -11, ZF), (-62, -6, ZF), 2.4, P["nickel"])
iso_in = composant("isolateur_entree", (-50, -14, ZF), (-50, 18, ZF), 2.8, iso_m)
wdm = composant("multiplexeur_wdm", (-33, 28, ZF), (-3, 28, ZF), 1.6, P["acier"])
iso_out = composant("isolateur_sortie", (55, 21, ZF), (55, -11, ZF), 2.8, iso_m)
tap_out = composant("prelevement_sortie", (55, -15, ZF), (55, -41, ZF), 1.6, P["acier"])
pd_out = composant("photodiode_sortie", (63, -36, ZF), (63, -31, ZF), 2.4, P["nickel"])

# diode de pompe 980 nm en boîtier « butterfly » 14 broches
bf = [box("pompe_corps", (26, 12, 8), (-48, 40, 7), lid, bevel=0.5),
      box("pompe_semelle", (34, 12, 1.2), (-48, 40, 2.9), P["or"], bevel=0.2),
      cone("pompe_gaine", 2.4, 1.0, 7, (-31.5, 40, 7), P["plastique_noir"], rot=(0, 90, 0))]
for i in range(7):
    for s in (-1, 1):
        bf.append(box(f"pompe_broche_{i}_{s}", (0.5, 5, 0.3), (-57 + i * 2.54, 40 + s * 8.5, 4.5), P["or"]))
pompe = join("pompe_butterfly", bf)

# bobine de fibre dopée erbium (lueur verte = fluorescence par conversion ascendante)
moyeu = cyl("bobine_moyeu", 16, 10, (20, 20, 8), P["plastique_creme"], verts=64)
flasques = [cyl("bobine_flasque_bas", 21, 1.0, (20, 20, 3.0), P["plastique_creme"], verts=64),
            cyl("bobine_flasque_haut", 21, 1.0, (20, 20, 13.0), mat("flasque_trans", "#f3ebe3", rough=0.2, alpha=0.5), verts=64)]
spire = helix("fibre_dopee_erbium", 17.0, 0.75, 10, 0.5, z0=4.2, center=(20, 20), material=edf)
spire["glow"] = 1

# fibres de liaison (gaine jaune = monomode)
F = P["fibre_jaune"]
fibres = [
    tube("f_entree", [(-50, -48.2, 11), (-50, -46, 8), (-50, -43.2, ZF)], R, F),
    tube("f_prise_pd", [(-50, -17.8, ZF), (-54, -14, ZF), (-60, -14, ZF), (-62, -11.2, ZF)], R, F),
    tube("f_iso_wdm", [(-50, 18.2, ZF), (-50, 24, ZF), (-44, 28.3, ZF), (-33.2, 28.3, ZF)], R, F),
    tube("f_pompe_wdm", [(-28, 40, 7), (-21, 40, ZF), (-21, 33, ZF), (-29, 29.4, ZF), (-33.2, 27.7, ZF)], R, F),
    tube("f_wdm_edf", [(-2.8, 28, ZF), (5, 34, ZF), (20, 40, 5), (33, 31, 4.4), (37, 20, 4.2)], R, F),
    tube("f_edf_iso", [(37, 20, 11.7), (44, 27, 10), (51, 27, 7.5), (55, 21.2, ZF)], R, F),
    tube("f_iso_prise", [(55, -11.2, ZF), (55, -14.8, ZF)], R, F),
    tube("f_prise_pd2", [(55, -41.2, ZF), (60, -43, ZF), (63, -40, ZF), (63, -36.2, ZF)], R, F),
    tube("f_sortie", [(55, -41.2, ZF), (55, -45, 8), (55, -48.2, 11)], R, F),
]

# carte de commande : driver de courant de pompe, régulation TEC, mesures
pcb = [box("carte_pcb", (58, 26, 1.6), (-2, -28, 3.6), P["pcb_vert"], bevel=0.2),
       box("carte_mcu", (8, 8, 1.2), (-18, -24, 5), P["puce_noire"]),
       box("carte_driver", (10, 8, 1.6), (0, -22, 5.2), P["puce_noire"]),
       box("carte_aop_1", (5, 4, 1.4), (12, -32, 5.1), P["puce_noire"]),
       box("carte_aop_2", (5, 4, 1.4), (19, -32, 5.1), P["puce_noire"]),
       box("carte_connecteur", (20, 5, 8), (-14, -38, 8.4), P["plastique_noir"], bevel=0.3)]
for i, (x, y) in enumerate(((8, -22), (14, -22), (22, -24))):
    pcb.append(cyl(f"carte_condo_{i}", 2.2, 6, (x, y, 7.4), P["alu"], verts=20))
carte = join("carte_commande", pcb)
fils = [tube("fil_pompe_1", [(-10, -16, 5), (-20, 10, 8), (-50, 30, 6), (-52, 33.4, 4.6)], 0.4, P["rouge_btn"]),
        tube("fil_pompe_2", [(-8, -16, 5), (-18, 10, 8.6), (-46, 30, 6), (-47, 33.4, 4.6)], 0.4, P["plastique_noir"])]

hotspot("hs_entree", (-50, -66, 18))
hotspot("hs_prise_in", (-50, -30, 10))
hotspot("hs_isolateur", (-50, 2, 11))
hotspot("hs_wdm", (-18, 28, 10))
hotspot("hs_pompe", (-48, 40, 14))
hotspot("hs_fibre_dopee", (20, 20, 17))
hotspot("hs_isolateur_out", (55, 5, 11))
hotspot("hs_prise_out", (55, -28, 10))
hotspot("hs_sortie", (55, -66, 18))
hotspot("hs_carte", (-2, -28, 12))

if A["glb"]:
    export_glb(A["glb"])
if A["png"]:
    render(A["png"], view=(0.25, -1.0, 1.25), w=A["w"], h=A["h"], samples=A["samples"], focal=60, margin=0.82)
