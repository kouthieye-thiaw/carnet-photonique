"""Le banc de test laser piloté par Raspberry Pi. Unités : mm.
Axe optique : y = -60, z = 60. Électronique à l'arrière (y > 20).
Rendus : --png (vue d'ensemble, sans capot) et --png2 (gros plan de la carte driver).
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
from mathutils import Vector

A = args()
png2 = None
if "--png2" in sys.argv:
    png2 = sys.argv[sys.argv.index("--png2") + 1]
reset()
P = palette()
Y, Z = -60.0, 60.0
trou = mat("trou", "#0d0d0e", rough=0.9)
pol_m = mat("polariseur", "#5d6670", rough=0.05, transmission=0.6, alpha=0.55)
nd_m = mat("densite", "#2f2f33", rough=0.05, alpha=0.78)
laiton = mat("laiton", "#c9a24a", metal=1.0, rough=0.3)
pcb_banc = mat("pcb_banc", "#24418f", rough=0.42, coat=0.4)
violet = mat("pcb_violet", "#5b3e9b", rough=0.45, coat=0.3)
bornier = mat("bornier", "#2e8b57", rough=0.5)
capot_m = mat("pmma_filtrant_650", "#2f8f8a", rough=0.05, transmission=0.5, alpha=0.16)  # bleu-vert : absorbe le rouge
gris_boite = mat("boite_grise", "#e9e4dc", rough=0.6)
led_r = mat("led_rouge", "#ff3b2f", emit="#ff2a1a", strength=6)
led_v = mat("led_verte", "#3ee07a", emit="#22c55e", strength=4)

# ---- table optique (breadboard M6, pas de 25 mm)
table = box("breadboard", (450, 300, 12.7), (0, 0, 6.35), P["alu_noir"], bevel=1.0)
trous = array_holes("trous_m6", 17, 11, 25, 3.2, 0.6, 12.75, trou)

def poteau(x, y, ztop, r=6.0, nom="poteau"):
    h = ztop - 12.7
    return [cyl(f"{nom}_{int(x)}_{int(y)}", r, h, (x, y, 12.7 + h / 2), P["acier"], verts=32),
            cyl(f"{nom}_pied_{int(x)}_{int(y)}", r + 6, 6, (x, y, 15.7), P["alu_noir"], verts=40, bevel=0.6)]

# ---- 1. diode laser sur Peltier (TEC) + collimateur
laser = [box("laser_monture", (34, 40, 34), (-185, Y, Z), P["alu"], bevel=1.0),
         box("laser_tec", (34, 40, 3), (-185, Y, 41.5), P["ceramique"], bevel=0.3)]
laser += poteau(-185, Y, 40)
for i in range(6):
    laser.append(box(f"laser_ailette_{i}", (30, 2, 11), (-185, Y - 15 + i * 6, 82.5), P["alu_noir"], bevel=0.3))
laser += [cyl("collimateur", 6.5, 18, (-159, Y, Z), P["alu_noir"], rot=(0, 90, 0)),
          cyl("collimateur_lentille", 4.2, 1.5, (-149.8, Y, Z), P["verre"], rot=(0, 90, 0))]
g_laser = group("G_laser", laser)

# ---- 2. diaphragme (iris) d'alignement
iris = [torus("iris_bague", 9, 1.8, (-120, Y, Z), P["alu_noir"], rot=(0, 90, 0)),
        cyl("iris_lames", 8.0, 1.0, (-120, Y, Z), mat("iris_lames", "#3a3530", metal=0.6, rough=0.4, alpha=0.55), rot=(0, 90, 0))]
iris += poteau(-120, Y, Z - 9, r=4.5)

# ---- 3. cube séparateur + photodiode de mesure de puissance
cube = [box("cube_separateur", (12.7, 12.7, 12.7), (-60, Y, Z), P["verre"]),
        box("cube_diagonale", (17.6, 0.25, 12.4), (-60, Y, Z), mat("traitement_bs", "#c9d6ff", metal=0.7, rough=0.05, alpha=0.6), rot=(0, 0, 45)),
        box("cube_plateau", (22, 22, 3), (-60, Y, Z - 7.85), P["alu_noir"], bevel=0.4)]
cube += poteau(-60, Y, Z - 9.35)
pd = [cyl_between("photodiode_boitier", (-60, -133, Z), (-60, -117, Z), 11, P["alu_noir"]),
      cyl_between("photodiode_zone", (-60, -117, Z), (-60, -116.4, Z), 5.0, mat("pd_actif", "#1f2a5c", metal=0.4, rough=0.15)),
      cyl_between("photodiode_bnc", (-60, -144, Z), (-60, -133, Z), 4.5, P["nickel"])]
pd += poteau(-60, -125, Z - 11, r=5)

# ---- 4. polariseur sur monture rotative motorisée (tourne en continu dans le viewer)
pol_tourne = [cyl("polariseur_disque", 12.5, 1.6, (0, Y, Z), pol_m, rot=(0, 90, 0)),
              box("polariseur_axe", (1.8, 1.0, 24), (0.9, Y, Z), P["papier"]),
              cyl("polariseur_engrenage", 19, 3, (-3, Y, Z), laiton, rot=(0, 90, 0))]
g_pol = group("G_polariseur_tournant", pol_tourne, loc=(0, Y, Z), spin=("x", 0.9))
pol_fixe = [torus("polariseur_bague", 17, 3, (2.5, Y, Z), P["alu_noir"], rot=(0, 90, 0)),
            box("polariseur_equerre", (6, 46, 76), (8, Y, 46), P["alu"], bevel=0.6),
            cyl("moteur_pas_28byj", 14, 19, (-1, Y, 22), P["bleu_sticker"], rot=(0, 90, 0)),
            cyl("moteur_poulie", 4, 6, (-6, Y, 22), laiton, rot=(0, 90, 0)),
            tube("courroie", [(-6, Y - 4, 22), (-5, Y - 19, Z), (-5, Y, Z + 19), (-5, Y + 19, Z), (-6, Y + 4, 22), (-6, Y, 18)], 1.2, P["caoutchouc"], closed=True)]

# ---- 5. densité neutre (protège la caméra)
nd = [cyl("densite_neutre", 12.7, 2.2, (55, Y, Z), nd_m, rot=(0, 90, 0)),
      torus("densite_bague", 14, 2.0, (55, Y, Z), P["alu_noir"], rot=(0, 90, 0))]
nd += poteau(55, Y, Z - 14, r=4.5)

# ---- 6. platine de translation motorisée + caméra (profil de faisceau / M²)
platine = [box("platine_base", (150, 52, 12), (160, Y, 18.7), P["alu"], bevel=0.8),
           box("platine_butee_1", (8, 52, 20), (89, Y, 34.7), P["alu"], bevel=0.5),
           box("platine_butee_2", (8, 52, 20), (231, Y, 34.7), P["alu"], bevel=0.5),
           cyl_between("guide_1", (89, Y - 16, 38), (231, Y - 16, 38), 3, P["acier"]),
           cyl_between("guide_2", (89, Y + 16, 38), (231, Y + 16, 38), 3, P["acier"]),
           cyl_between("vis_mere", (93, Y, 31), (236, Y, 31), 3.5, laiton)]
moteur = [box("moteur_nema17", (40, 42, 42), (256, Y, 31), P["plastique_noir"], bevel=1.0),
          box("moteur_flasque_1", (3, 42.6, 42.6), (237.5, Y, 31), P["alu"], bevel=0.6),
          box("moteur_flasque_2", (3, 42.6, 42.6), (274.5, Y, 31), P["alu"], bevel=0.6)]
XC = 120.0
chariot = [box("chariot", (34, 56, 10), (XC, Y, 43), P["alu_noir"], bevel=0.6),
           box("camera_equerre", (4, 38, 34), (XC + 4, Y, 65), P["alu"], bevel=0.4),
           box("camera_pcb", (1.6, 38, 38), (XC, Y, Z), P["pcb_vert"], bevel=0.2),
           cyl("camera_bague_c", 15, 10, (XC - 6.5, Y, Z), P["plastique_noir"], rot=(0, 90, 0)),
           box("camera_capteur", (0.6, 8, 6.2), (XC - 1.2, Y, Z), mat("capteur", "#27325a", metal=0.5, rough=0.1))]
g_chariot = group("G_chariot", chariot)

# ---- faisceaux
b1 = beam("beam_laser", (-149, Y, Z), (-60, Y, Z), 1.6, "#e2372b", flat=0.55, flat_axis="y")
b_r = beam("beam_reflechi", (-60, Y, Z), (-60, -116.4, Z), 1.4, "#e2372b", speed=1.4)
b_t = beam("beam_transmis", (-60, Y, Z), (XC - 1.5, Y, Z), 1.5, "#e2372b", speed=1.8, from_start=True)

# animation : la caméra parcourt la caustique (mesure de M²)
sc = bpy.context.scene
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, 240
L0 = (XC - 1.5) - (-60)
for f, x in ((1, XC), (120, XC + 80), (240, XC)):
    g_chariot.location.x = x - XC
    g_chariot.keyframe_insert("location", index=0, frame=f)
    b_t.scale.z = ((x - 1.5) - (-60)) / L0
    b_t.keyframe_insert("scale", index=2, frame=f)
g_chariot.location.x = 0
b_t.scale.z = 1

# ---- électronique (arrière)
def entretoises(cx, cy, dx, dy):
    return [cyl(f"entretoise_{int(cx)}_{i}", 2.6, 8, (cx + sx * dx, cy + sy * dy, 16.7), laiton, verts=6)
            for i, (sx, sy) in enumerate(((-1, -1), (-1, 1), (1, -1), (1, 1)))]

pi = [box("rpi_pcb", (85, 56, 1.6), (90, 85, 21.5), P["pcb_vert"], bevel=0.3),
      box("rpi_soc", (14, 14, 1.6), (82, 88, 23.1), P["nickel"]),
      box("rpi_ram", (12, 9, 1.1), (96, 92, 22.9), P["puce_noire"]),
      box("rpi_rp1", (7, 7, 1.0), (98, 76, 22.8), P["puce_noire"]),
      box("rpi_ethernet", (21, 16, 13.5), (124, 103, 29), P["nickel"], bevel=0.4),
      box("rpi_usb3", (17, 13, 15.6), (126, 85, 30.1), P["nickel"], bevel=0.4),
      box("rpi_usb2", (17, 13, 15.6), (126, 68, 30.1), P["nickel"], bevel=0.4),
      box("rpi_gpio_base", (51, 5, 2.5), (82, 109.5, 23.6), P["plastique_noir"]),
      box("rpi_gpio_broches", (50, 4, 6), (82, 109.5, 27.6), P["or"]),
      box("rpi_ventilateur", (30, 30, 7), (78, 82, 26.2), P["plastique_noir"], bevel=0.6),
      cyl("rpi_helice", 11, 0.8, (78, 82, 30.2), P["alu"]),
      box("rpi_usbc", (9, 7, 3.2), (62, 59, 23.9), P["nickel"], bevel=0.3)]
pi += entretoises(90, 85, 38, 24)
g_pi = group("G_raspberry", pi)

def borne(nom, x, y):
    return box(nom, (10, 8, 10), (x, y, 27.3), bornier, bevel=0.4)
carte = [box("carte_pcb", (110, 70, 1.6), (-60, 95, 21.5), pcb_banc, bevel=0.3),
         box("carte_dissipateur", (22, 14, 22), (-92, 112, 33.3), P["alu_noir"], bevel=0.3),
         box("carte_mosfet", (10, 4.5, 9), (-92, 104, 29.8), P["puce_noire"]),
         box("carte_mosfet_patte", (10, 1.3, 15), (-92, 106.9, 32.8), P["alu"]),
         box("carte_shunt", (6, 3, 2), (-78, 86, 23.3), P["puce_noire"]),
         box("carte_relais", (19, 15, 15), (-102, 78, 29.8), mat("relais", "#2e5aa8", rough=0.4), bevel=0.4),
         box("carte_trim", (6, 6, 5), (-40, 68, 24.8), P["bleu_sticker"], bevel=0.3),
         box("carte_dac", (18, 18, 1.6), (-30, 116, 27.3), violet, bevel=0.2),
         box("carte_dac_puce", (4, 4, 1.2), (-30, 116, 28.7), P["puce_noire"]),
         box("carte_adc", (28, 18, 1.6), (-30, 88, 27.3), violet, bevel=0.2),
         box("carte_adc_puce", (5, 4, 1.2), (-30, 88, 28.7), P["puce_noire"]),
         cyl_between("carte_bnc", (-10, 122, 27.5), (-10, 134, 27.5), 5, P["nickel"]),
         borne("carte_bornier_1", -100, 62), borne("carte_bornier_2", -88, 62), borne("carte_bornier_3", -76, 62),
         cyl("carte_led_rouge", 1.6, 4, (-110, 126, 24.3), led_r, verts=16),
         cyl("carte_led_verte", 1.6, 4, (-104, 126, 24.3), led_v, verts=16)]
for i, (x, y) in enumerate(((-70, 92), (-60, 92), (-50, 92))):
    carte.append(box(f"carte_aop_{i}", (5, 4, 1.5), (x, y, 23.05), P["puce_noire"]))
for i, x in enumerate((-20, -10)):
    carte.append(cyl(f"carte_condo_{i}", 4, 10, (x, 70, 27.3), P["plastique_noir"], verts=24))
for i in range(4):
    carte.append(box(f"carte_ailette_{i}", (1.4, 14, 22), (-101 + i * 6, 112, 33.3), P["alu_noir"]))
carte += entretoises(-60, 95, 50, 30)
g_carte = group("G_carte_driver", carte)

tec_drv = [box("tec_driver_pcb", (25, 20, 1.6), (-150, 110, 21.5), violet, bevel=0.2),
           box("tec_driver_puce", (5, 5, 1.2), (-150, 110, 22.9), P["puce_noire"]),
           borne("tec_driver_bornier", -150, 101)] + entretoises(-150, 110, 9, 7)
pas = [box("driver_pas_pcb", (20, 15, 1.6), (30, 125, 21.5), violet, bevel=0.2),
       box("driver_pas_radiateur", (9, 9, 5), (30, 125, 24.8), P["alu"])] + entretoises(30, 125, 7, 5)
alim = [box("alim_12v", (99, 82, 30), (180, 95, 27.7), mat("alim_tole", "#c4c6c9", metal=0.8, rough=0.45), bevel=0.8),
        box("alim_bornier", (8, 50, 10), (126, 95, 22), bornier, bevel=0.3)]

# câbles
cab = P["caoutchouc"]
cables = [tube("cable_laser", [(-185, -40, 60), (-185, 0, 48), (-150, 40, 20), (-110, 58, 26), (-100, 62, 32)], 2.2, cab),
          tube("cable_tec", [(-200, -40, 50), (-205, 30, 20), (-170, 90, 18), (-150, 100, 30)], 1.6, P["rouge_btn"]),
          tube("cable_photodiode", [(-60, -146, Z), (-60, -150, 40), (-20, -150, 16), (10, -20, 15), (0, 80, 18), (-10, 140, 26), (-10, 134, 27.5)], 1.8, cab),
          tube("cable_moteur", [(276, Y, 31), (282, -20, 22), (240, 60, 16), (60, 140, 16), (30, 132, 24)], 1.5, cab),
          tube("cable_alim", [(126, 110, 25), (60, 140, 16), (-40, 140, 16), (-76, 66, 32)], 1.8, P["rouge_btn"]),
          tube("fils_gpio_1", [(70, 110, 30), (40, 112, 40), (-5, 118, 36), (-30, 118, 30)], 0.7, P["orange"]),
          tube("fils_gpio_2", [(74, 110, 30), (40, 108, 42), (-5, 100, 36), (-30, 92, 30)], 0.7, P["bleu_sticker"]),
          tube("fils_gpio_3", [(78, 110, 30), (50, 104, 44), (10, 96, 40), (-50, 100, 30)], 0.7, P["vert_sticker"])]

# ---- sécurité : boîte de commande (clé, arrêt d'urgence, voyant), interlock de capot
secu = [box("boite_securite", (70, 40, 35), (175, -125, 30.2), gris_boite, bevel=1.2),
        cyl("au_socle", 14, 6, (192, -125, 50.7), P["jaune"], verts=48),
        cyl("au_champignon", 12, 9, (192, -125, 58.2), P["rouge_btn"], verts=48, bevel=2.5),
        cyl("cle_barillet", 7.5, 4, (160, -125, 49.7), P["nickel"], verts=40),
        box("cle", (2, 10, 13), (160, -125, 58.2), P["acier"], bevel=0.4),
        cyl("voyant_laser", 3.5, 3, (176, -110, 49.2), led_r, verts=24)]
interlock = [box("interlock_corps", (20, 10, 12), (215, 140, 18.7), P["plastique_noir"], bevel=0.5),
             box("interlock_levier", (2, 14, 1), (215, 132, 25.2), P["acier"], rot=(18, 0, 0))]

# ---- capot avec fenêtres filtrantes pour 650 nm (teinte bleu-vert ; un orange laisserait passer le rouge !)
W, D, H = 470, 320, 190
capot = [box("capot_avant", (W, 4, H), (0, -D / 2, 12.7 + H / 2), capot_m),
         box("capot_arriere", (W, 4, H), (0, D / 2, 12.7 + H / 2), capot_m),
         box("capot_gauche", (4, D, H), (-W / 2, 0, 12.7 + H / 2), capot_m),
         box("capot_droit", (4, D, H), (W / 2, 0, 12.7 + H / 2), capot_m),
         box("capot_dessus", (W, D, 4), (0, 0, 12.7 + H), capot_m)]
g_capot = group("G_capot", capot, explode=(0, 0, 230))

# ---- points d'intérêt
hotspot("hs_laser", (-185, Y, 92), g_laser)
hotspot("hs_collimateur", (-156, Y, 72))
hotspot("hs_diaphragme", (-120, Y, 75))
hotspot("hs_cube", (-60, Y, 72))
hotspot("hs_photodiode", (-60, -125, 76))
hotspot("hs_polariseur", (2, Y, 86))
hotspot("hs_densite", (55, Y, 78))
hotspot("hs_camera", (XC, Y, 84), g_chariot)
hotspot("hs_platine", (160, Y - 30, 28))
hotspot("hs_moteur", (256, Y, 56))
hotspot("hs_carte_driver", (-60, 95, 44), g_carte)
hotspot("hs_tec_driver", (-150, 110, 34))
hotspot("hs_raspberry", (90, 85, 42), g_pi)
hotspot("hs_alim", (180, 95, 48))
hotspot("hs_securite", (175, -125, 72))
hotspot("hs_interlock", (215, 140, 32))
hotspot("hs_capot", (0, -D / 2, 12.7 + H), g_capot)

if A["glb"]:
    export_glb(A["glb"], anim=True)
if A["png"] or png2:
    bpy.data.objects.remove(g_capot, do_unlink=True)
    for o in capot:
        bpy.data.objects.remove(o, do_unlink=True)
if A["png"]:
    render(A["png"], view=(0.62, -1.0, 0.95), w=A["w"], h=A["h"], samples=A["samples"], focal=50, margin=0.78)
if png2:
    cleanup_render()
    keep_only("G_carte_driver")
    render(png2, view=(0.5, -1.0, 0.9), w=A["w"], h=A["h"], samples=A["samples"], focal=70, margin=0.85)
