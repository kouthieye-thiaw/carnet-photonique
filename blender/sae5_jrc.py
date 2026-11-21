"""Carte « module joueur » du JRC (SAÉ 5, BUT3 GEII) : ATmega328P, CY7C65213, 4 boutons et 4 LEDs RGB,
LED d'état, buzzer, connecteur USB-B. Composants d'après le schéma KiCad ; leur disposition sur la carte
est une illustration (le routage du PCB n'est pas fait).
Usage : blender -b --factory-startup --python blender/sae5_jrc.py -- [--glb f.glb] [--png f.png] [--etat jeu|pret]"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *  # noqa
import bpy

A = args()
ETAT = sys.argv[sys.argv.index("--etat") + 1] if "--etat" in sys.argv else "jeu"
reset()
P = palette()
T = 1.6                                   # épaisseur du PCB : le dessus est à z = T
noir = mat("trou_noir", "#0d0d0d", rough=0.9)
piste = mat("piste_cuivre", "#2f8a52", rough=0.35, coat=0.3)
soudure = mat("etain", "#cfd2d6", metal=1.0, rough=0.25)
cera = mat("condo_ceramique", "#c9a77c", rough=0.55)
silk = mat("serigraphie", "#f4f1ea", rough=0.8)
lens_off = mat("led_eteinte", "#f6f2ea", rough=0.22, coat=0.6)
LED = {1: mat("led_rouge_jrc", "#ff3b2f", emit="#ff2a1a", strength=14), 4: mat("led_bleue_jrc", "#4d7bff", emit="#2f5bff", strength=14),
       2: mat("led_verte_jrc", "#3ee07a", emit="#22c55e", strength=11)}

def texte(nom, corps, loc, taille=2.4, rot=0):
    bpy.ops.object.text_add(location=loc, rotation=(0, 0, math.radians(rot)))
    t = bpy.context.active_object; t.name = nom
    t.data.body = corps; t.data.size = taille; t.data.align_x = "CENTER"; t.data.align_y = "CENTER"; t.data.extrude = 0.02
    select_only(t); bpy.ops.object.convert(target="MESH")
    t = bpy.context.active_object; t.name = nom
    t.data.materials.append(silk)
    return t

def r1206(nom, x, y, rot=90, corps=None):
    """résistance ou condensateur CMS 1206 (3,2 × 1,6 mm)"""
    c = corps or P["puce_noire"]
    a = math.radians(rot); dx, dy = math.cos(a), math.sin(a)
    objs = [box(nom + "_corps", (2.2, 1.6, 0.55), (x, y, T + 0.3), c, rot=(0, 0, rot))]
    for s in (-1, 1):
        objs.append(box(f"{nom}_bout{s}", (0.55, 1.62, 0.6), (x + s * 1.35 * dx, y + s * 1.35 * dy, T + 0.3), soudure, rot=(0, 0, rot)))
    return join(nom, objs)

def puce(nom, cx, cy, lx, ly, h, n_par_cote, pas, quatre_cotes, pin_l=1.0):
    """boîtier CMS : corps noir + pattes (2 ou 4 côtés) + repère de la broche 1"""
    objs = [box(nom + "_corps", (lx, ly, h), (cx, cy, T + 0.15 + h / 2), P["puce_noire"], bevel=0.12)]
    off = (n_par_cote - 1) * pas / 2
    cotes = [(0, -1), (0, 1)] + ([(-1, 0), (1, 0)] if quatre_cotes else [])
    for (sx, sy) in cotes:
        for k in range(n_par_cote):
            u = -off + k * pas
            if sy:
                objs.append(box(f"{nom}_p{sx}{sy}{k}", (pas * 0.45, pin_l, 0.18), (cx + u, cy + sy * (ly / 2 + pin_l / 2 - 0.1), T + 0.1), soudure))
            else:
                objs.append(box(f"{nom}_p{sx}{sy}{k}", (pin_l, pas * 0.45, 0.18), (cx + sx * (lx / 2 + pin_l / 2 - 0.1), cy + u, T + 0.1), soudure))
    o = join(nom, objs)
    cyl(nom + "_repere", 0.45, 0.06, (cx - lx / 2 + 1.0, cy + ly / 2 - 1.0 if quatre_cotes else cy - ly / 2 + 1.0, T + 0.16 + h), silk, verts=16)
    return o

def led_rgb(nom, x, y, couleur):
    """LED RGB CMS (PLCC-4, 3,2 × 2,8 mm) : boîtier blanc + lentille, allumée si couleur > 0"""
    box(nom + "_boitier", (3.2, 2.8, 1.6), (x, y, T + 0.8), P["ceramique"], bevel=0.15)
    m = LED.get(couleur, lens_off) if couleur else lens_off
    l = cyl(nom + "_lentille", 1.45, 0.7, (x, y, T + 1.85), m, verts=40)
    return l

# ---------------------------------------------------------------- la carte
pcb = box("pcb", (100, 64, T), (0, 0, T / 2), P["pcb_vert"], bevel=0.8)
for i, (x, y) in enumerate([(-46, 28), (46, 28), (-46, -28), (46, -28)]):
    cyl(f"trou_pastille_{i}", 2.9, 0.06, (x, y, T + 0.03), P["or"], verts=40)
    cyl(f"trou_{i}", 1.6, 0.08, (x, y, T + 0.05), noir, verts=32)
# quelques pistes (illustration)
for i, (x0, y0, x1, y1) in enumerate([(-34, 20, -27.5, 20), (-16.5, 20, -4.6, 20), (-16.5, 18, -4.6, 16), (4.6, 20, 9, 22), (4.6, 16, 30, 16),
                                       (-14, 1.5, -2, 13.4), (4, 1.5, 0, 13.4), (22, 1.5, 2, 13.4), (40, 1.5, 4, 14), (-40, -6, -4.6, 15), (-32, -20, -4, 13.4)]):
    L = math.hypot(x1 - x0, y1 - y0); a = math.degrees(math.atan2(y1 - y0, x1 - x0))
    box(f"piste_{i}", (L, 0.5, 0.04), ((x0 + x1) / 2, (y0 + y1) / 2, T + 0.02), piste, rot=(0, 0, a))

# USB-B vertical (J3)
box("usb_corps", (12, 11, 10.5), (-40, 20, T + 5.25), P["nickel"], bevel=0.35)
box("usb_ouverture", (8.6, 7.6, 0.3), (-40, 20, T + 10.4), noir)
box("usb_languette", (5.6, 1.6, 0.5), (-40, 20, T + 10.2), P["plastique_noir"])
texte("silk_usb", "USB", (-40, 11.5, T + 0.01), 2.2)
# CY7C65213 (IC3, SSOP-28) et ses condensateurs
puce("cy7c65213", -22, 20, 10.2, 5.3, 1.6, 14, 0.65, False)
for i, (x, y) in enumerate([(-30, 27), (-30, 13), (-14, 27), (-14, 12.5), (-40, 9)]):
    r1206(f"c_usb_{i}", x, y, 0, cera)
# ATmega328P (IC1, TQFP-32), quartz 16 MHz (Y2) et ses condensateurs
puce("atmega328p", 0, 18, 7, 7, 1.0, 8, 0.8, True)
box("quartz_base", (6, 3.5, 0.35), (12, 22, T + 0.18), P["ceramique"])
box("quartz_capot", (5.5, 3.0, 0.8), (12, 22, T + 0.75), P["acier"], bevel=0.2)
r1206("c_quartz_1", 12, 26.5, 0, cera); r1206("c_quartz_2", 12, 17.5, 0, cera); r1206("r_quartz", 17.5, 22, 90)
r1206("c_mcu", -6, 26, 0, cera)
texte("silk_titre", "JRC · module joueur", (2, 29, T + 0.01), 2.6)
# buzzer piézo (X1) et son condensateur de liaison C7
box("buzzer", (9, 9, 2.0), (34, 20, T + 1.0), P["puce_noire"], bevel=0.35)
cyl("buzzer_event", 1.1, 0.08, (34, 20, T + 2.02), noir, verts=32)
r1206("c_buzzer", 26, 24, 90, cera)
texte("silk_buzzer", "buzzer", (34, 13.2, T + 0.01), 2.0)
# connecteur J1 (RX, TX, RESET, GND), diodes BAT54S du reset automatique
box("j1_plastique", (2.5, 10.2, 2.5), (-44, -6, T + 1.25), P["plastique_noir"], bevel=0.15)
for k, dy in enumerate((-3.81, -1.27, 1.27, 3.81)):
    box(f"j1_broche_{k}", (0.64, 0.64, 8.5), (-44, -6 + dy, T + 4.25), P["or"])
for i, y in enumerate((-4, -10)):
    box(f"bat54s_{i}", (2.9, 1.3, 1.0), (-37, y, T + 0.55), P["puce_noire"], bevel=0.1)
texte("silk_j1", "RX TX RST GND", (-40.6, -6, T + 0.01), 1.3, rot=90)
# bouton reset (S1) et LED d'état (U6)
box("reset_corps", (6, 3.6, 2.2), (-44, -22, T + 1.1), P["plastique_noir"], bevel=0.2)
cyl("reset_poussoir", 1.1, 1.2, (-44, -22, T + 2.8), P["alu"], verts=24)
texte("silk_reset", "reset", (-44, -17.4, T + 0.01), 2.0)
led_rgb("led_etat", -32, -22, 2 if ETAT == "pret" else 0)
r1206("r_etat", -32, -17, 0)
texte("silk_etat", "prêt", (-32, -26.8, T + 0.01), 2.0)
# 4 postes de jeu : LED RGB, 3 résistances (rouge 2,2 k ; vert 6,8 k ; bleu 1,2 k), bouton et sa résistance de rappel 100 k
for i in range(4):
    x = -14 + 18 * i
    coul = (1 if i == 2 else 4) if ETAT == "jeu" else 0     # trame A314 : LED 3 en rouge, les autres en bleu
    led_rgb(f"led_jeu_{i + 1}", x, -6, coul)
    for k, dx in enumerate((-4, 0, 4)):
        r1206(f"r_led{i + 1}_{k}", x + dx, 2, 90)
    box(f"bouton_{i + 1}_corps", (6, 6, 3.4), (x, -19, T + 1.7), P["plastique_noir"], bevel=0.2)
    box(f"bouton_{i + 1}_plaque", (6.1, 6.1, 0.25), (x, -19, T + 3.5), P["acier"])
    cyl(f"bouton_{i + 1}_poussoir", 1.8, 1.6, (x, -19, T + 4.4), P["plastique_creme"], verts=32)
    r1206(f"r_rappel_{i + 1}", x + 6.2, -19, 90)
    texte(f"silk_bouton_{i + 1}", str(i + 1), (x, -25.6, T + 0.01), 2.6)

# ---------------------------------------------------------------- étiquettes (visionneuse)
for nom, loc in [("hs_usb", (-40, 20, T + 11)), ("hs_cy7", (-22, 20, T + 2.4)), ("hs_mcu", (0, 18, T + 1.8)),
                 ("hs_quartz", (12, 22, T + 1.6)), ("hs_buzzer", (34, 20, T + 2.6)), ("hs_connecteur", (-44, -6, T + 9)),
                 ("hs_reset", (-44, -22, T + 3.6)), ("hs_etat", (-32, -22, T + 2.4)), ("hs_leds", (13, -6, T + 2.4)),
                 ("hs_resistances", (-14, 2, T + 1)), ("hs_boutons", (4, -19, T + 5.4))]:
    hotspot(nom, loc)

def intensite_leds(v):
    for m in LED.values():
        m.node_tree.nodes.get("Principled BSDF").inputs["Emission Strength"].default_value = v

if A["glb"]:
    intensite_leds(2.2)            # la visionneuse web sature (blanchit) les émissions trop fortes
    export_glb(A["glb"])
    intensite_leds(14)
if A["png"]:
    render(A["png"], view=(0.22, -0.95, 1.15), w=A["w"], h=A["h"], samples=A["samples"], focal=55, margin=0.82, beam_strength=4.0)
